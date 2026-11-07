import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

const limit = 3 * 1024 * 1024
const drive = 'https://www.googleapis.com/drive/v3'
const folderType = 'application/vnd.google-apps.folder'
const safeId = /^[a-zA-Z0-9_-]{1,128}$/

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) return res.status(401).end()
  try {
    const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: { user } } = await client.auth.getUser(authorization.slice(7))
    if (!user) return res.status(401).end()
    const membership = await client.from('organiza_members').select('user_id').eq('user_id', user.id).maybeSingle()
    if (!membership.data) return res.status(403).end()
    const subject = req.query.subject
    if (typeof subject !== 'string' || !safeId.test(subject)) return res.status(400).end()
    const { data: workspace } = await client.from('organiza_workspace').select('entries').eq('id', 1).single()
    const entry = workspace?.entries.find(item => item.id === subject && item.kind === 'Matéria')
    if (!entry) return res.status(404).json({ error: 'A matéria precisa estar sincronizada.' })

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
    const root = process.env.DRIVE_STUDIES_FOLDER_ID
    if (!root || !safeId.test(root)) throw new Error('Drive root')
    const folders = await list(request, `'${root}' in parents and mimeType = '${folderType}' and appProperties has { key='subject' and value='${subject}' }`)
    let folder = folders[0]?.id
    if (!folder) {
      const response = await request(`${drive}/files`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: entry.title, mimeType: folderType, parents: [root], appProperties: { subject } }),
      })
      folder = (await response.json()).id
    }
    if (req.method === 'GET' && !req.query.file) {
      return res.json(await list(request, `'${folder}' in parents`))
    }
    if (req.method === 'GET' && safeId.test(req.query.file)) {
      const file = req.query.file
      const metadata = await (await request(`${drive}/files/${file}?fields=parents,size,trashed`)).json()
      if (metadata.trashed || !metadata.parents?.includes(folder)) return res.status(404).end()
      if (Number(metadata.size) > limit) return res.status(413).json({ error: 'Arquivo grande demais para esta versão.' })
      const response = await request(`${drive}/files/${file}?alt=media`)
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      return res.send(Buffer.from(await response.arrayBuffer()))
    }
    if (req.method !== 'POST') return res.status(405).end()
    const { name, base64, mimeType } = req.body ?? {}
    if (typeof name !== 'string' || !name.trim() || name.length > 250 || typeof base64 !== 'string' || base64.length > limit * 4 / 3) {
      return res.status(400).json({ error: 'Arquivo inválido ou acima de 3 MB.' })
    }
    let bytes = Buffer.from(base64, 'base64')
    let type = typeof mimeType === 'string' && /^[\w.+-]+\/[\w.+-]+$/.test(mimeType) ? mimeType : 'application/octet-stream'
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
    const metadata = JSON.stringify({ name: filename, parents: [folder], mimeType: type })
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
