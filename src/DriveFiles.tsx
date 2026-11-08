import { useEffect, useState } from 'react'
import Dexie, { type Table } from 'dexie'

type DriveFile = { id: string; name: string; mimeType: string }
type Upload = { id: string; subject: string; file: File; session?: string; uploaded?: boolean }
const queue = new Dexie('organiza-ai-drive') as Dexie & {
  uploads: Table<Upload, string>
  folders: Table<{ id: string }, string>
}
queue.version(1).stores({ uploads: 'id,subject', folders: 'id' })
const chunkSize = 2 * 1024 * 1024
const maxUpload = 100 * 1024 * 1024
const changed = 'organiza-drive-changed'

async function request(subject: string, options?: RequestInit, file?: string, extra?: Record<string, string>) {
  const query = new URLSearchParams({ subject, ...extra })
  if (file) query.set('file', file)
  const response = await fetch(`/api/drive?${query}`, options)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw Object.assign(new Error(body?.error ?? 'Não foi possível acessar os arquivos.'), { status: response.status })
  }
  return response
}

function encode(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('Falha na leitura do arquivo.'))
    reader.readAsDataURL(blob)
  })
}

async function send(subject: string, body: object) {
  return (await request(subject, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })).json()
}

async function sendUpload(job: Upload) {
  const { file, subject, id } = job
  const metadata = { name: file.name, mimeType: file.type, size: file.size, uploadId: id }
  if (file.size <= 3 * 1024 * 1024) {
    await send(subject, { ...metadata, base64: await encode(file) })
    return
  }
  let session = job.session
  if (!session) {
    const result = await send(subject, { ...metadata, action: 'start' })
    if (result.done) return
    if (typeof result.session !== 'string') throw new Error('O Drive não iniciou o envio.')
    session = result.session
    await queue.uploads.update(id, { session })
  }
  const put = (offset: number, base64: string) => send(subject, { action: 'chunk', session, size: file.size, offset, base64 })
  try {
    let result = await put(0, '')
    while (!result.done) {
      const offset = result.offset
      if (!Number.isSafeInteger(offset) || offset < 0 || offset >= file.size) throw new Error('Progresso de envio inválido.')
      result = await put(offset, await encode(file.slice(offset, offset + chunkSize)))
      if (!result.done && result.offset <= offset) throw new Error('O Drive não confirmou o envio deste trecho.')
    }
  } catch (error) {
    if ((error as { status?: number }).status === 410) await queue.uploads.update(id, { session: undefined })
    throw error
  }
}

let draining = false
async function drainQueue() {
  if (draining || !navigator.onLine) return
  draining = true
  try {
    await navigator.locks.request('organiza-ai-drive', { ifAvailable: true }, async lock => {
      if (!lock) return
      for (const job of await queue.uploads.toArray()) {
        try {
          if (!job.uploaded) {
            await sendUpload(job)
            await queue.uploads.update(job.id, { uploaded: true })
          }
          if (job.file.type.startsWith('video/') ||
              (job.file.size > 3 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(job.file.type))) {
            await send(job.subject, { action: 'optimize', uploadId: job.id })
          }
          await queue.uploads.delete(job.id)
          window.dispatchEvent(new CustomEvent(changed, { detail: job.subject }))
        } catch {
          if (!navigator.onLine) break
        }
      }
    })
  } finally {
    draining = false
  }
}

export function startDriveQueue() {
  const run = () => void drainQueue().catch(() => {})
  run()
  window.addEventListener('online', run)
  const timer = window.setInterval(run, 20_000)
  return () => { window.removeEventListener('online', run); window.clearInterval(timer) }
}

export async function prepareDriveFolders(subjects: string[]) {
  for (const id of subjects) {
    if (await queue.folders.get(id)) continue
    await request(id, undefined, undefined, { folder: '1' })
    await queue.folders.put({ id })
  }
}

export function DriveFiles({ subject }: { subject: string }) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(0)
  const [preview, setPreview] = useState<{ url: string; name: string; kind: string }>()
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url) }, [preview])

  async function refresh() {
    setFiles(await (await request(subject)).json())
  }

  useEffect(() => {
    const updatePending = () => void queue.uploads.where('subject').equals(subject).count().then(setPending).catch(() => {})
    const updateFiles = (event: Event) => {
      if ((event as CustomEvent).detail !== subject) return
      updatePending()
      void refresh().catch(() => {})
    }
    updatePending()
    window.addEventListener(changed, updateFiles)
    return () => window.removeEventListener(changed, updateFiles)
  }, [subject])

  async function upload(selected: File[]) {
    setBusy(true)
    try {
      const accepted = selected.filter(file => file.size <= maxUpload && file.name.length <= 250)
      await queue.transaction('rw', queue.uploads, () => queue.uploads.bulkAdd(accepted.map(file => ({
        id: crypto.randomUUID(), subject, file,
      }))))
      setPending(await queue.uploads.where('subject').equals(subject).count())
      setStatus(accepted.length === selected.length ? '' : 'Alguns arquivos excedem 100 MB ou têm nomes longos demais.')
      void drainQueue().catch(() => {})
    } catch {
      setStatus('Não foi possível guardar os arquivos neste aparelho. Verifique o espaço disponível.')
    } finally {
      setBusy(false)
    }
  }

  async function open(file: DriveFile) {
    try {
      const chunks: ArrayBuffer[] = []
      let offset = 0
      let size: number
      do {
        const response = await request(subject, undefined, file.id, { offset: String(offset) })
        size = Number(response.headers.get('X-File-Size'))
        const bytes = await response.arrayBuffer()
        if (size > offset && !bytes.byteLength) throw new Error('O download foi interrompido.')
        offset += bytes.byteLength
        chunks.push(bytes)
      } while (offset < size)
      const kind = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm)|application\/pdf)$/.test(file.mimeType)
        ? file.mimeType : 'application/octet-stream'
      setPreview({ url: URL.createObjectURL(new Blob(chunks, { type: kind })), name: file.name, kind })
      setStatus('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível abrir o arquivo.')
    }
  }

  return <section className="panel">
    <h2>Arquivos da matéria</h2>
    <button disabled={busy} onClick={() => void refresh().then(() => setStatus('')).catch(error => setStatus(error.message))}>Carregar arquivos do Drive</button>
    <label>Enviar arquivos (até 100 MB por arquivo)<input type="file" multiple disabled={busy} onChange={event => {
      const selected = Array.from(event.target.files ?? [])
      event.target.value = ''
      if (selected.length) void upload(selected)
    }} /></label>
    <p role="status">{busy ? 'Salvando no aparelho…' : status || (pending ? `${pending} arquivo(s) na fila de envio` : '')}</p>
    <ul>{files.map(file => <li key={file.id}><button className="entry" onClick={() => void open(file)}>{file.name}</button></li>)}</ul>
    {preview && <div className="preview">
      <div className="toolbar"><a href={preview.url} download={preview.name}>Baixar {preview.name}</a><button onClick={() => setPreview(undefined)}>Fechar</button></div>
      {preview.kind.startsWith('image/') && <img src={preview.url} alt={preview.name} />}
      {preview.kind.startsWith('video/') && <video src={preview.url} controls playsInline />}
      {preview.kind === 'application/pdf' && <iframe title={preview.name} src={preview.url} />}
    </div>}
  </section>
}
