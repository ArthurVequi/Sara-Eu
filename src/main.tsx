import Dexie, { type Table } from 'dexie'
import { useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { cloud, enableMorningPush } from './cloud'
import { DriveFiles, prepareDriveFolders, startDriveQueue } from './DriveFiles'
import './style.css'

type Area = 'Semana' | 'Estudos' | 'Finanças'
type Kind = 'Matéria' | 'Tema' | 'Prova' | 'Revisão' | 'Conta' | 'Gasto' | 'Conta fixa' | 'Parcela' | 'Limite'
type Entry = { id: string; area: Area; title: string; detail: string; done?: boolean; date?: string; weekly?: boolean; amount?: number; kind?: Kind; parent?: string; category?: string; color?: string; installments?: number }
const areas: Area[] = ['Semana', 'Estudos', 'Finanças']
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
const linkedDay = new URLSearchParams(location.search).get('agenda')
const examples: Entry[] = [
  { id: 'demo-class', area: 'Semana', title: 'Aula de Anatomia', detail: '08:30 · Sala 12', date: today, weekly: true },
  { id: 'demo-task', area: 'Semana', title: 'Organizar material da aula', detail: 'Tarefa', date: today },
  { id: 'demo-study', area: 'Estudos', title: 'Anatomia', detail: '', kind: 'Matéria' },
  { id: 'demo-topic', area: 'Estudos', title: 'Sistema cardiovascular', detail: '', kind: 'Tema', parent: 'demo-study' },
  { id: 'demo-review', area: 'Estudos', title: 'Revisar sistema cardiovascular', detail: 'Revisão manual', date: today, kind: 'Revisão', parent: 'demo-study' },
  { id: 'demo-account', area: 'Finanças', title: 'Carteira', detail: 'Saldo informado', kind: 'Conta', amount: 120000, color: '#d48ba7' },
  { id: 'demo-expense', area: 'Finanças', title: 'Material de estudo', detail: '', kind: 'Gasto', category: 'Estudos', parent: 'demo-account', date: today, amount: 18500 },
]
const studyKinds: Kind[] = ['Matéria', 'Tema', 'Prova', 'Revisão']
const financeKinds: Kind[] = ['Gasto', 'Conta', 'Conta fixa', 'Parcela', 'Limite']
type Snapshot = { version: number; entries: Entry[] }
const db = new Dexie(cloud ? 'organiza-ai-shared' : 'organiza-ai') as Dexie & {
  entries: Table<Entry, string>
  settings: Table<{ id: string; snapshot?: Snapshot }, string>
}
db.version(1).stores({ entries: 'id, area', settings: 'id' })
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', currencyDisplay: 'code' })

function occursOn(entry: Entry, day: string) {
  if (!entry.date || entry.date > day) return false
  if (!entry.weekly) return entry.date === day
  return (Date.parse(day) - Date.parse(entry.date)) % (7 * 86_400_000) === 0
}

function shiftDay(day: string, offset: number) {
  const date = new Date(day + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

const weekDayLabel = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC',
})

function App() {
  const [tab, setTab] = useState<Area | 'Início'>(linkedDay ? 'Semana' : 'Início')
  const [entries, setEntries] = useState<Entry[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Entry>()
  const [routine, setRoutine] = useState<'Dia' | 'Semana' | 'Recorrentes'>(linkedDay ? 'Dia' : 'Semana')
  const [message, setMessage] = useState('')
  const [conflict, setConflict] = useState<Snapshot>()
  const [subject, setSubject] = useState('')
  const [day, setDay] = useState(linkedDay && /^\d{4}-\d{2}-\d{2}$/.test(linkedDay) ? linkedDay : today)
  const [pushMessage, setPushMessage] = useState('')
  const [month, setMonth] = useState(today.slice(0, 7))
  const monday = shiftDay(day, -((new Date(day + 'T00:00:00Z').getUTCDay() + 6) % 7))
  const week = Array.from({ length: 7 }, (_, index) => shiftDay(monday, index))
  const accounts = entries.filter(entry => entry.kind === 'Conta')
  const subjects = entries.filter(entry => entry.kind === 'Matéria')
  const expenses = entries.filter(entry => entry.area === 'Finanças' && (!entry.kind || entry.kind === 'Gasto') && entry.date?.startsWith(month))
  const planned = entries.filter(entry => isReserved(entry, month))
  const total = (items: Entry[]) => items.reduce((sum, entry) => sum + (entry.amount ?? 0), 0)
  const reserved = total(planned)
  const spent = total(expenses)
  const available = total(accounts) - reserved
  const limit = entries.find(entry => entry.kind === 'Limite' && entry.date?.startsWith(month))?.amount

  async function synchronize(choice?: 'local' | 'remote') {
    if (!cloud || !navigator.onLine) return
    try {
      await navigator.locks.request('organiza-ai-sync', async () => {
        const base = (await db.settings.get('cloud'))?.snapshot
        const local = await db.entries.toArray()
        const { data, error } = await cloud!.from('organiza_workspace').select('version, entries').eq('id', 1).single()
        if (error) throw error
        const remote = data as Snapshot
        if (choice && remote.version !== conflict?.version) {
          setConflict(remote)
          return
        }
        const merged = mergeEntries(base?.entries ?? [], local, remote.entries, choice)
        if (!merged) {
          setConflict(remote)
          return
        }
        let next = remote
        if (!sameEntries(merged, remote.entries)) {
          const result = await cloud!.from('organiza_workspace')
            .update({ entries: merged, version: remote.version + 1 })
            .eq('id', 1).eq('version', remote.version).select('version, entries').maybeSingle()
          if (result.error) throw result.error
          if (!result.data) return
          next = result.data as Snapshot
        }
        await db.transaction('rw', db.entries, db.settings, async () => {
          const current = await db.entries.toArray()
          const updated = mergeEntries(local, current, next.entries, 'local')!
          await db.entries.clear()
          await db.entries.bulkPut(updated)
          await db.settings.put({ id: 'cloud', snapshot: next })
        })
        await refresh()
        setConflict(undefined)
        setMessage('Sincronização concluída')
        void prepareDriveFolders(next.entries.filter(item => item.kind === 'Matéria').map(item => item.id)).catch(() => {})
      })
    } catch {
      setMessage('Sincronização indisponível. Alterações continuam neste aparelho.')
    }
  }

  useEffect(() => {
    if (!ready || !cloud) return
    const stopQueue = startDriveQueue()
    const sync = () => void synchronize()
    sync()
    window.addEventListener('online', sync)
    const timer = window.setInterval(sync, 20_000)
    return () => { stopQueue(); window.removeEventListener('online', sync); window.clearInterval(timer) }
  }, [ready])

  async function refresh() {
    setEntries(await db.entries.toArray())
  }

  useEffect(() => {
    db.transaction('rw', db.entries, db.settings, async () => {
      if (await db.settings.get('initialized')) return
      if (!cloud) await db.entries.bulkAdd(examples)
      await db.settings.add({ id: 'initialized' })
    }).then(refresh).then(() => setReady(true)).catch(() => setError('Não foi possível abrir o armazenamento deste aparelho.'))
  }, [])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || !editing.title.trim()) return
    try {
      await db.entries.put({ ...editing, title: editing.title.trim() })
      await refresh()
      setEditing(undefined)
      setError('')
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
    }
  }

  async function toggle(entry: Entry) {
    try {
      await db.entries.update(entry.id, { done: !entry.done })
      await refresh()
    } catch {
      setError('Não foi possível atualizar a tarefa.')
    }
  }

  function list(items: Entry[]) {
    return items.length ? <ul>{items.map(entry => <li key={entry.id}>
      {entry.area === 'Semana' && !entry.weekly && <input type="checkbox" checked={!!entry.done} aria-label={`Concluir ${entry.title}`} onChange={() => void toggle(entry)} />}
      <button className="entry" onClick={() => setEditing(entry)}>
        <strong>{entry.title}</strong>
        <small>{[entry.kind, entry.detail, entry.category, entries.find(item => item.id === entry.parent)?.title, entry.date, entry.weekly ? 'Toda semana' : ''].filter(Boolean).join(' · ')}</small>
      </button>
      {entry.kind === 'Conta' && <span className="account-color" style={{ backgroundColor: entry.color }} aria-hidden="true" />}
      {entry.amount !== undefined && <strong>{money.format(entry.amount)}</strong>}
    </li>)}</ul> : <p>Nenhum item por aqui.</p>
  }

  return <main>
    <header><span className="brand">✓ Organiza Aí</span><span className="badge">{cloud ? message || 'Espaço compartilhado' : 'Modo local · demonstração'}</span></header>
    {cloud && <div className="toolbar">
      <button onClick={() => void enableMorningPush().then(() => setPushMessage('Lembrete matinal ativado neste aparelho.')).catch(error => setPushMessage(error.message))}>Ativar lembrete matinal</button>
      <span role="status">{pushMessage}</span>
    </div>}
    {conflict && <section className="panel">
      <h2>Alterações em conflito</h2>
      <p>Compare os itens que serão substituídos antes de escolher.</p>
      <div className="grid">
        <div><h3>Neste aparelho</h3>{changes(entries, conflict.entries)}</div>
        <div><h3>No servidor</h3>{changes(conflict.entries, entries)}</div>
      </div>
      <div className="toolbar">
        <button onClick={() => void synchronize('local')}>Manter deste aparelho</button>
        <button onClick={() => void synchronize('remote')}>Manter do servidor</button>
      </div>
    </section>}
    <nav aria-label="Navegação principal">{(['Início', ...areas] as const).map(area => <button key={area} aria-current={tab === area ? 'page' : undefined} onClick={() => { setTab(area); setEditing(undefined) }}>{area}</button>)}</nav>
    <section className="hero"><p>SEU ORGANIZADOR PESSOAL</p><h1>{tab === 'Início' ? 'Olá, Sara!' : tab === 'Semana' ? 'Minha semana' : tab}</h1>
      <p>{tab === 'Início' ? 'Veja o que importa hoje, em um só lugar.' : 'Toque em um item para editar.'}</p></section>
    {error && <p role="alert">{error}</p>}
    {!ready && !error && <p>Carregando…</p>}
    {ready && tab === 'Início' && <div className="grid">
      <section className="panel"><h2>Hoje</h2>{list(entries.filter(item => item.area === 'Semana' && occursOn(item, today)))}</section>
      <section className="panel"><h2>Estudos de hoje</h2>{list(entries.filter(item => item.area === 'Estudos' && item.date === today))}</section>
      <section className="panel"><h2>Gastos do mês</h2><strong>{money.format(entries.filter(item => item.area === 'Finanças' && item.date?.startsWith(today.slice(0, 7))).reduce((sum, item) => sum + (item.amount ?? 0), 0))}</strong></section>
    </div>}
    {ready && tab !== 'Início' && <section className="panel">
      <div className="toolbar"><h2>{tab === 'Semana' ? routine : tab === 'Estudos' ? 'Matérias e conteúdos' : 'Lançamentos em pesos argentinos'}</h2>
        <button className="primary" onClick={() => setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: tab, date: tab === 'Finanças' ? month === today.slice(0, 7) ? today : month + '-01' : day, weekly: tab === 'Semana' && routine === 'Recorrentes', kind: tab === 'Estudos' ? subject ? 'Tema' : 'Matéria' : tab === 'Finanças' ? 'Gasto' : undefined, parent: tab === 'Estudos' ? subject || undefined : undefined })}>+ Adicionar</button></div>
      {tab === 'Semana' && <div className="toolbar">{(['Dia', 'Semana', 'Recorrentes'] as const).map(view => <button key={view} aria-pressed={routine === view} onClick={() => setRoutine(view)}>{view}</button>)}</div>}
      {tab === 'Semana' && routine === 'Dia' && <label>Dia da agenda<input type="date" value={day} onChange={event => setDay(event.target.value || today)} /></label>}
      {tab === 'Semana' && routine === 'Semana' && <>
        <div className="toolbar week-controls">
          <button onClick={() => setDay(shiftDay(day, -7))}>Semana anterior</button>
          <button onClick={() => setDay(today)}>Hoje</button>
          <button onClick={() => setDay(shiftDay(day, 7))}>Próxima semana</button>
        </div>
        {week.map(date => <section className="week-day" key={date}>
          <h3><button onClick={() => { setDay(date); setRoutine('Dia') }}>
            {weekDayLabel.format(new Date(date))}{date === today && ' · Hoje'}
          </button></h3>
          {list(entries.filter(item => item.area === 'Semana' && occursOn(item, date)))}
        </section>)}
        {entries.some(item => item.area === 'Semana' && !item.date) && <section className="week-day">
          <h3>Sem data</h3>{list(entries.filter(item => item.area === 'Semana' && !item.date))}
        </section>}
      </>}
      {tab === 'Estudos' && <label>Matéria<select value={subject} onChange={event => setSubject(event.target.value)}>
        <option value="">Todas</option>{subjects.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label>}
      {tab === 'Finanças' && <>
        <label>Mês<input type="month" value={month} onChange={event => setMonth(event.target.value || today.slice(0, 7))} /></label>
        <div className="finance-summary">{[['Disponível', available], ['Reservado', reserved], ['Gasto', spent]].map(([label, value], index) => {
          const combined = Math.max(available, 0) + reserved + spent
          const percent = combined ? Math.max(Number(value), 0) / combined * 100 : 0
          return <div key={label}><span className={`ring ring-${index}`} style={{ backgroundImage: `conic-gradient(var(--ring) ${percent}%, #f5e9ee 0)` }} aria-hidden="true" /><strong>{money.format(Number(value))}</strong><small>{label}</small></div>
        })}</div>
        {limit !== undefined && <p>Limite do mês: {money.format(limit)}{spent > limit ? ' · Limite ultrapassado' : ''}</p>}
      </>}
      {!(tab === 'Semana' && routine === 'Semana') && list(entries.filter(item => {
        if (item.area !== tab) return false
        if (tab === 'Semana') return routine === 'Recorrentes' ? item.weekly : !item.date || occursOn(item, day)
        if (tab === 'Estudos') return !subject || item.id === subject || item.parent === subject
        return accounts.includes(item) || expenses.includes(item) || planned.includes(item) || (item.kind === 'Limite' && item.date?.startsWith(month))
      }))}
    </section>}
    {tab === 'Estudos' && subject && cloud && <DriveFiles key={subject} subject={subject} />}
    {editing && <section className="panel" aria-label="Editar item"><form onSubmit={save}>
      <label>Título<input required value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>
      {editing.area !== 'Semana' && <label>Tipo<select value={editing.kind ?? 'Gasto'} onChange={event => setEditing({ ...editing, kind: event.target.value as Kind })}>
        {(editing.area === 'Estudos' ? studyKinds : financeKinds).map(kind => <option key={kind}>{kind}</option>)}
      </select></label>}
      {((editing.area === 'Estudos' && editing.kind !== 'Matéria') || (editing.area === 'Finanças' && ['Gasto', 'Conta fixa', 'Parcela'].includes(editing.kind ?? 'Gasto'))) && <label>{editing.area === 'Estudos' ? 'Matéria' : 'Conta'}<select value={editing.parent ?? ''} onChange={event => setEditing({ ...editing, parent: event.target.value || undefined })}>
        <option value="">Selecionar</option>{(editing.area === 'Estudos' ? subjects : accounts).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label>}
      {editing.area === 'Finanças' && <label>Categoria<input value={editing.category ?? ''} onChange={event => setEditing({ ...editing, category: event.target.value })} /></label>}
      {editing.kind === 'Conta' && <label>Cor da conta<input type="color" value={editing.color ?? '#d48ba7'} onChange={event => setEditing({ ...editing, color: event.target.value })} /></label>}
      {editing.kind === 'Parcela' && <label>Número de parcelas<input required type="number" min="2" step="1" value={editing.installments ?? ''} onChange={event => setEditing({ ...editing, installments: event.target.valueAsNumber || undefined })} /></label>}
      <label>Detalhes<input value={editing.detail} onChange={event => setEditing({ ...editing, detail: event.target.value })} /></label>
      <label>Data<input type="date" value={editing.date ?? ''} onChange={event => setEditing({ ...editing, date: event.target.value })} /></label>
      {editing.area === 'Semana' && <label className="check"><input type="checkbox" checked={!!editing.weekly} onChange={event => setEditing({ ...editing, weekly: event.target.checked })} /> Repetir toda semana</label>}
      {editing.area === 'Finanças' && <label>{editing.kind === 'Parcela' ? 'Valor de cada parcela' : 'Valor'} (ARS)<input required type="number" min={editing.kind === 'Conta' ? undefined : '0.01'} step="0.01" value={editing.amount ?? ''} onChange={event => setEditing({ ...editing, amount: event.target.value ? Number(event.target.value) : undefined })} /></label>}
      <div className="toolbar"><button type="button" onClick={() => setEditing(undefined)}>Cancelar</button><button className="primary">Salvar</button></div>
    </form></section>}
  </main>
}

function sameEntries(a: Entry[], b: Entry[]) {
  return a.length === b.length && a.every(entry => b.some(other => sameEntry(entry, other)))
}

function mergeEntries(base: Entry[], local: Entry[], remote: Entry[], choice?: 'local' | 'remote') {
  const index = (items: Entry[]) => new Map(items.map(item => [item.id, item]))
  const [before, device, server] = [base, local, remote].map(index)
  const ids = new Set([...before.keys(), ...device.keys(), ...server.keys()])
  const equal = (a?: Entry, b?: Entry) => a && b ? sameEntry(a, b) : a === b
  const result: Entry[] = []
  for (const id of ids) {
    const [original, here, there] = [before.get(id), device.get(id), server.get(id)]
    let item = there
    if (equal(original, there)) item = here
    else if (!equal(original, here) && !equal(here, there)) {
      if (!choice) return null
      if (choice === 'local') item = here
    }
    if (item) result.push(item)
  }
  return result
}

function isReserved(entry: Entry, month: string) {
  if (!entry.date || (entry.kind !== 'Conta fixa' && entry.kind !== 'Parcela')) return false
  const [year, number] = month.split('-').map(Number)
  const [startYear, startNumber] = entry.date.split('-').map(Number)
  const elapsed = (year - startYear) * 12 + number - startNumber
  return elapsed >= 0 && (entry.kind === 'Conta fixa' || elapsed < (entry.installments ?? 1))
}

function sameEntry(a: Entry, b: Entry) {
  return (Object.keys(a) as (keyof Entry)[]).every(key => a[key] === b[key])
    && (Object.keys(b) as (keyof Entry)[]).every(key => a[key] === b[key])
}

function changes(a: Entry[], b: Entry[]) {
  const different = a.filter(entry => !b.some(other => sameEntry(entry, other)))
  return different.length ? <ul>{different.map(entry => <li key={entry.id}>
    {entry.title} · {entry.detail} {entry.date} {entry.amount === undefined ? '' : money.format(entry.amount)}
    {entry.weekly ? ' · Semanal' : ''}{entry.done ? ' · Concluído' : ''}
    {entry.kind && ` · ${entry.kind}`}{entry.category && ` · ${entry.category}`}
    {entry.installments && ` · ${entry.installments} parcelas`}{entry.color && ` · Cor ${entry.color}`}
  </li>)}</ul> : <p>Nenhum item diferente nesta versão.</p>
}

createRoot(document.getElementById('root')!).render(<App />)
