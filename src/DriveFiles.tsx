import { useEffect, useState } from 'react'
import { cloud } from './cloud'

type DriveFile = { id: string; name: string; mimeType: string }

async function request(subject: string, options?: RequestInit, file?: string) {
  const { data } = await cloud!.auth.getSession()
  if (!data.session) throw new Error('Entre para acessar os arquivos.')
  const query = new URLSearchParams({ subject })
  if (file) query.set('file', file)
  const response = await fetch(`/api/drive?${query}`, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${data.session.access_token}` },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? 'Não foi possível acessar os arquivos.')
  }
  return response
}

export function DriveFiles({ subject }: { subject: string }) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ url: string; name: string; kind: string }>()
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url) }, [preview])

  async function refresh() {
    setFiles(await (await request(subject)).json())
  }

  async function upload(selected: File[]) {
    setBusy(true)
    const failures: string[] = []
    for (const file of selected) {
      try {
        if (file.size > 3 * 1024 * 1024) throw new Error('limite de 3 MB')
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result).split(',')[1])
          reader.onerror = () => reject(new Error('falha na leitura'))
          reader.readAsDataURL(file)
        })
        await request(subject, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, mimeType: file.type, base64 }),
        })
      } catch (error) {
        failures.push(`${file.name} (${error instanceof Error ? error.message : 'falha no envio'})`)
      }
    }
    try {
      await refresh()
    } catch {
      failures.push('lista de arquivos indisponível')
    }
    setStatus(failures.length ? `Pendências: ${failures.join('; ')}` : 'Arquivos enviados.')
    setBusy(false)
  }

  async function open(file: DriveFile) {
    try {
      const bytes = await (await request(subject, undefined, file.id)).arrayBuffer()
      const kind = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm)|application\/pdf)$/.test(file.mimeType)
        ? file.mimeType : 'application/octet-stream'
      setPreview({ url: URL.createObjectURL(new Blob([bytes], { type: kind })), name: file.name, kind })
      setStatus('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível abrir o arquivo.')
    }
  }

  return <section className="panel">
    <h2>Arquivos da matéria</h2>
    <button disabled={busy} onClick={() => void refresh().then(() => setStatus('')).catch(error => setStatus(error.message))}>Carregar arquivos do Drive</button>
    <label>Enviar arquivos (até 3 MB por arquivo)<input type="file" multiple disabled={busy} onChange={event => {
      const selected = Array.from(event.target.files ?? [])
      event.target.value = ''
      if (selected.length) void upload(selected)
    }} /></label>
    <p role="status">{busy ? 'Enviando…' : status}</p>
    <ul>{files.map(file => <li key={file.id}><button className="entry" onClick={() => void open(file)}>{file.name}</button></li>)}</ul>
    {preview && <div className="preview">
      <div className="toolbar"><a href={preview.url} download={preview.name}>Baixar {preview.name}</a><button onClick={() => setPreview(undefined)}>Fechar</button></div>
      {preview.kind.startsWith('image/') && <img src={preview.url} alt={preview.name} />}
      {preview.kind.startsWith('video/') && <video src={preview.url} controls playsInline />}
      {preview.kind === 'application/pdf' && <iframe title={preview.name} src={preview.url} />}
    </div>}
  </section>
}
