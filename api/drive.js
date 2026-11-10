import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { optimizeMedia } from '../server/optimize-media.js'

const limit = 3 * 1024 * 1024
const drive = 'https://www.googleapis.com/drive/v3'
const folderType = 'application/vnd.google-apps.folder'
const safeId = /^[a-zA-Z0-9_-]{1,128}$/
const chunkSize = 2 * 1024 * 1024
const maxUpload = 100 * 1024 * 1024
const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()
  if (!process.env.DRIVE_CLIENT_ID || !process.env.DRIVE_CLIENT_SECRET || !process.env.DRIVE_REFRESH_TOKEN) {
    return res.status(503).json({ error: 'O Google Drive ainda não foi configurado.' })
  }
  try {
    if (req.method === 'POST' && req.body?.action === 'chunk') return await uploadChunk(req.body, res)
    const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const subject = req.query.subject
    if (typeof subject !== 'string' || !safeId.test(subject)) return res.status(400).end()
    const { data: workspace } = await client.from('organiza_workspace').select('entries').eq('id', 1).single()
    const entry = workspace?.entries.find(item => item.id === subject && ['Matéria', 'Tema'].includes(item.kind))
    const parent = entry?.kind === 'Tema'
      ? workspace.entries.find(item => item.id === entry.parent && item.kind === 'Matéria')
      : entry
    if (!parent || typeof parent.id !== 'string' || !safeId.test(parent.id)) {
      return res.status(404).json({ error: 'A matéria e o tema precisam estar sincronizados.' })
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token', refresh_token: process.env.DRIVE_REFRESH_TOKEN,
        client_id: process.env.DRIVE_CLIENT_ID, client_secret: process.env.DRIVE_CLIENT_SECRET,
      }),
    })
    if (!tokenResponse.ok) throw new Error('Drive token')
    const { access_token } = await tokenResponse.json()
    const request = async (url, options = {}) => {
      const response = await fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${access_token}` } })
      if (!response.ok) throw new Error('Drive request')
      return response
    }
    const root = process.env.DRIVE_STUDIES_FOLDER_ID || await studiesFolder(request)
    if (!safeId.test(root)) throw new Error('Drive root')
    const subjectFolder = await entryFolder(request, root, 'subject', parent)
    const folder = entry.kind === 'Tema' ? await entryFolder(request, subjectFolder, 'theme', entry) : subjectFolder
    if (req.method === 'POST' && req.body?.action === 'optimize') {
      const { uploadId } = req.body
      if (typeof uploadId !== 'string' || !safeId.test(uploadId)) return res.status(400).end()
      return res.json(await optimizeUpload(request, folder, uploadId))
    }
    if (req.method === 'GET' && !req.query.file) {
      if (req.query.folder === '1') return res.status(204).end()
      return res.json(await list(request, `'${folder}' in parents and mimeType != '${folderType}'`))
    }
    if (req.method === 'GET' && safeId.test(req.query.file)) {
      const file = req.query.file
      const metadata = await (await request(`${drive}/files/${file}?fields=parents,size,trashed`)).json()
      if (metadata.trashed || !metadata.parents?.includes(folder)) return res.status(404).end()
      const size = Number(metadata.size)
      const offset = Number(req.query.offset ?? 0)
      if (!Number.isSafeInteger(offset) || offset < 0 || offset >= Math.max(size, 1) || !Number.isSafeInteger(size)) return res.status(416).end()
      const end = Math.min(size - 1, offset + chunkSize - 1)
      const response = await request(`${drive}/files/${file}?alt=media`, {
        headers: size ? { Range: `bytes=${offset}-${end}` } : {},
      })
      if (size > chunkSize && response.status !== 206) throw new Error('Drive range')
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-File-Size', String(size))
      return res.send(Buffer.from(await response.arrayBuffer()))
    }
    if (req.method !== 'POST') return res.status(405).end()
    const { name, base64, mimeType, action, size, uploadId } = req.body ?? {}
    if (typeof name !== 'string' || !name.trim() || name.length > 250 ||
        (uploadId !== undefined && (typeof uploadId !== 'string' || !safeId.test(uploadId)))) {
      return res.status(400).json({ error: 'Arquivo inválido.' })
    }
    let type = typeof mimeType === 'string' && /^[\w.+-]+\/[\w.+-]+$/.test(mimeType) ? mimeType : 'application/octet-stream'
    const appProperties = uploadId ? { uploadId } : undefined
    if (uploadId) {
      const existing = await list(request, `'${folder}' in parents and appProperties has { key='uploadId' and value='${uploadId}' }`)
      if (existing.length) return res.json({ done: true })
    }
    if (action === 'start') {
      if (!Number.isSafeInteger(size) || size <= 0 || size > maxUpload) return res.status(400).end()
      const response = await request(`${uploadUrl}?uploadType=resumable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': type, 'X-Upload-Content-Length': String(size) },
        body: JSON.stringify({ name, mimeType: type, parents: [folder], appProperties }),
      })
      return res.json({ session: response.headers.get('location') })
    }
    if (typeof base64 !== 'string' || base64.length > limit * 4 / 3) return res.status(400).end()
    let bytes = Buffer.from(base64, 'base64')
    let filename = name
    if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      const optimized = await sharp(bytes).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
      if (optimized.length < bytes.length) {
        bytes = optimized
        type = 'image/webp'
        filename = name.replace(/\.[^.]+$/, '') + '.webp'
      }
    }
    const boundary = randomUUID()
    const metadata = JSON.stringify({ name: filename, parents: [folder], mimeType: type, appProperties })
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`),
      bytes, Buffer.from(`\r\n--${boundary}--\r\n`),
    ])
    const response = await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType', {
      method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
    })
    return res.status(201).json(await response.json())
  } catch {
    return res.status(502).json({ error: 'Não foi possível acessar o Google Drive.' })
  }
}

async function entryFolder(request, parent, key, entry) {
  const folders = await list(request, `'${parent}' in parents and mimeType = '${folderType}' and appProperties has { key='${key}' and value='${entry.id}' }`)
  if (folders[0]) return folders[0].id
  const response = await request(`${drive}/files?fields=id`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: entry.title, mimeType: folderType, parents: [parent], appProperties: { [key]: entry.id } }),
  })
  return (await response.json()).id
}

async function optimizeUpload(request, folder, uploadId) {
  const [file] = await list(request, `'${folder}' in parents and appProperties has { key='uploadId' and value='${uploadId}' }`)
  if (!file) throw new Error('Upload not found')
  const metadata = await (await request(`${drive}/files/${file.id}?fields=size,appProperties`)).json()
  const size = Number(metadata.size)
  if (metadata.appProperties?.optimization || !Number.isSafeInteger(size) || size <= 0 || size > maxUpload) return { optimized: false }
  const mark = async status => request(`${drive}/files/${file.id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appProperties: { optimization: status } }),
  })
  const original = await request(`${drive}/files/${file.id}?alt=media`)
  let converted
  try {
    converted = await optimizeMedia(Buffer.from(await original.arrayBuffer()), file.mimeType)
  } catch {
    await mark('original')
    return { optimized: false }
  }
  if (!converted) {
    await mark('original')
    return { optimized: false }
  }
  const start = await request(`${uploadUrl}/${file.id}?uploadType=resumable`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json', 'X-Upload-Content-Type': converted.type,
      'X-Upload-Content-Length': String(converted.bytes.length),
    },
    body: JSON.stringify({
      name: file.name.replace(/\.[^.]+$/, '') + '.' + converted.extension,
      mimeType: converted.type, appProperties: { optimization: 'converted' },
    }),
  })
  const session = start.headers.get('location')
  if (!session?.startsWith(uploadUrl + '?') && !session?.startsWith(uploadUrl + '/')) throw new Error('Invalid replacement session')
  await request(session, {
    method: 'PUT', redirect: 'error', headers: { 'Content-Type': converted.type }, body: converted.bytes,
  })
  return { optimized: true }
}

async function uploadChunk({ session, base64, offset, size }, res) {
  if (typeof session !== 'string' || !session.startsWith(uploadUrl + '?') || session.length > 2048 ||
      !Number.isSafeInteger(size) || size <= 0 || size > maxUpload ||
      !Number.isSafeInteger(offset) || offset < 0 || offset >= size ||
      typeof base64 !== 'string' || base64.length > Math.ceil(chunkSize / 3) * 4) return res.status(400).end()
  const url = new URL(session)
  if (!url.searchParams.has('upload_id') || url.hash) return res.status(400).end()
  const bytes = Buffer.from(base64, 'base64')
  if (bytes.length > Math.min(chunkSize, size - offset) ||
      (bytes.length && offset + bytes.length < size && bytes.length % (256 * 1024) !== 0)) return res.status(400).end()
  const range = bytes.length ? `bytes ${offset}-${offset + bytes.length - 1}/${size}` : `bytes */${size}`
  const response = await fetch(url, { method: 'PUT', redirect: 'manual', headers: { 'Content-Range': range }, body: bytes })
  if (response.status === 308) return res.json({ offset: Number(response.headers.get('range')?.split('-')[1] ?? -1) + 1 })
  if (response.status === 404 || response.status === 410) return res.status(410).json({ error: 'Envio expirado. Tentando novamente.' })
  if (!response.ok) throw new Error('Drive chunk')
  return res.json({ done: true })
}

async function studiesFolder(request) {
  const filter = `mimeType = '${folderType}' and appProperties has { key='organiza_ai' and value='estudos_v1' }`
  const folders = await list(request, filter)
  if (folders.length) return folders[0].id
  const response = await request(`${drive}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Organiza Aí - Estudos',
      mimeType: folderType,
      appProperties: { organiza_ai: 'estudos_v1' },
    }),
  })
  return (await response.json()).id
}

async function list(request, filter) {
  const files = []
  let page
  do {
    const params = new URLSearchParams({ q: `trashed = false and (${filter})`, fields: 'nextPageToken,files(id,name,mimeType)' })
    if (page) params.set('pageToken', page)
    const result = await (await request(`${drive}/files?${params}`)).json()
    files.push(...result.files)
    page = result.nextPageToken
  } while (page)
  return files
}
