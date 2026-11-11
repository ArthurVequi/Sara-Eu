import Dexie, { type Table } from 'dexie'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { cloud, enableMorningPush } from './cloud'
import { DriveFiles, prepareDriveFolders, startDriveQueue } from './DriveFiles'
import './style.css'
import { SplashScreen } from './SplashScreen'

type Area = 'Semana' | 'Estudos' | 'Finanças'
type Kind = 'Matéria' | 'Tema' | 'Prova' | 'Revisão' | 'Conta' | 'Gasto' | 'Conta fixa' | 'Parcela' | 'Limite'
type Entry = { id: string; area: Area; title: string; detail: string; done?: boolean; date?: string; startTime?: string; endTime?: string; weekly?: boolean; amount?: number; kind?: Kind; parent?: string; category?: string; color?: string; installments?: number; paymentFor?: string }
const areas: Area[] = ['Semana', 'Estudos', 'Finanças']
const navIcons = [
  'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8 M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'M8 2v3m8-3v3 M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01',
  'M12 5v16m8.001-2A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2a5 5 0 0 1 4-2z',
  'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1 M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
]
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
const linkedDay = new URLSearchParams(location.search).get('agenda')
const examples: Entry[] = [
  { id: 'demo-class', area: 'Semana', title: 'Aula de Anatomia', detail: 'Sala 12', date: today, startTime: '08:30', endTime: '10:00', weekly: true },
  { id: 'demo-task', area: 'Semana', title: 'Organizar material da aula', detail: 'Tarefa', date: today },
  { id: 'demo-study', area: 'Estudos', title: 'Anatomia', detail: '', kind: 'Matéria' },
  { id: 'demo-topic', area: 'Estudos', title: 'Sistema cardiovascular', detail: '', kind: 'Tema', parent: 'demo-study' },
  { id: 'demo-review', area: 'Estudos', title: 'Revisar sistema cardiovascular', detail: 'Revisão manual', date: today, kind: 'Revisão', parent: 'demo-study' },
  { id: 'demo-account', area: 'Finanças', title: 'Carteira', detail: 'Saldo informado', kind: 'Conta', amount: 120000, color: '#112c0f' },
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
  const [message, setMessage] = useState('')
  const [conflict, setConflict] = useState<Snapshot>()
  const [subject, setSubject] = useState('')
  const [studyActionsOpen, setStudyActionsOpen] = useState(false)
  const [theme, setTheme] = useState('')
  const [day, setDay] = useState(linkedDay && /^\d{4}-\d{2}-\d{2}$/.test(linkedDay) ? linkedDay : today)
  const [pushMessage, setPushMessage] = useState('')
  const [month, setMonth] = useState(today.slice(0, 7))
  const accounts = entries.filter(entry => entry.kind === 'Conta')
  const subjects = entries.filter(entry => entry.kind === 'Matéria')
  const themes = entries.filter(entry => entry.kind === 'Tema' && entry.parent === subject)
  const fileTarget = themes.some(entry => entry.id === theme) ? theme : subject
  const agendaMonth = day.slice(0, 7)
  const firstDay = agendaMonth + '-01'
  const firstWeekday = (new Date(firstDay + 'T00:00:00Z').getUTCDay() + 6) % 7
  const [agendaYear, agendaMonthNumber] = agendaMonth.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(agendaYear, agendaMonthNumber, 0)).getUTCDate()
  const { expenses, planned, available, reserved, spent } = financeSummary(entries, month)
  const current = financeSummary(entries, today.slice(0, 7))
  const exams = entries.filter(entry => entry.kind === 'Prova' && entry.date && entry.date >= today)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).slice(0, 3)
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
      void synchronize()
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
    }
  }

  async function toggle(entry: Entry) {
    try {
      await db.entries.update(entry.id, { done: !entry.done })
      await refresh()
      void synchronize()
    } catch {
      setError('Não foi possível atualizar a tarefa.')
    }
  }

  async function togglePayment(entry: Entry) {
    const id = paymentId(entry.id, month)
    try {
      await db.transaction('rw', db.entries, async () => {
        if (await db.entries.get(id)) await db.entries.delete(id)
        else await db.entries.add({
          id, area: 'Finanças', title: entry.title, detail: 'Pagamento',
          paymentFor: entry.id, date: month + '-01', amount: entry.amount, category: entry.category,
        })
      })
      await refresh()
      void synchronize()
    } catch {
      setError('Não foi possível atualizar o pagamento.')
    }
  }

  async function remove(entry: Entry) {
    const note = entry.kind === 'Matéria' ? '\nOs arquivos da matéria permanecerão no Google Drive.' : ''
    if (!window.confirm(`Excluir “${entry.title}” do espaço compartilhado?${note}`)) return
    try {
      const removed = await db.transaction('rw', db.entries, async () => {
        if ((await db.entries.toArray()).some(item => item.parent === entry.id)) return false
        await db.entries.delete(entry.id)
        return true
      })
      if (!removed) {
        setError('Este item tem registros vinculados. Mova ou exclua esses registros antes.')
        return
      }
      if (subject === entry.id) setSubject('')
      setEditing(undefined)
      setError('')
      await refresh()
      void synchronize()
    } catch {
      setError('Não foi possível excluir o item. Tente novamente.')
    }
  }

  function list(items: Entry[], empty = 'Nenhum item por aqui.') {
    const ordered = [...items].sort((a, b) =>
      (a.startTime || '24:00').localeCompare(b.startTime || '24:00'))
    return ordered.length ? <ul>{ordered.map(entry => <li key={entry.id}>
      {entry.area === 'Semana' && !entry.weekly && <input type="checkbox" checked={!!entry.done} aria-label={`Concluir ${entry.title}`} onChange={() => void toggle(entry)} />}
      <button className="entry" onClick={() => setEditing(entry)}>
        <strong>{entry.title}</strong>
        <small>{[entry.kind, [entry.startTime, entry.endTime].filter(Boolean).join(' – '), entry.detail, entry.category, entries.find(item => item.id === entry.parent)?.title, entry.date, entry.weekly ? 'Toda semana' : ''].filter(Boolean).join(' · ')}</small>
      </button>
      {entry.kind === 'Conta' && <span className="account-color" style={{ backgroundColor: entry.color }} aria-hidden="true" />}
      {entry.amount !== undefined && <strong>{money.format(entry.amount)}</strong>}
      {tab === 'Finanças' && (entry.kind === 'Conta fixa' || entry.kind === 'Parcela') && <button
        aria-pressed={entries.some(item => item.id === paymentId(entry.id, month))}
        onClick={() => void togglePayment(entry)}>
        {entries.some(item => item.id === paymentId(entry.id, month)) ? 'Desfazer pagamento' : 'Marcar como pago'}
      </button>}
    </li>)}</ul> : <p className="empty-state">{empty}</p>
  }

  function navigate(area: typeof tab) {
    setTab(area)
    setStudyActionsOpen(false)
    setEditing(undefined)
    setError('')
    window.scrollTo(0, 0)
  }

  return <main className={editing?.area === 'Semana' ? 'commitment-page' : undefined}>
    <header className="app-header"><span className="brand"><span aria-hidden="true">✓</span> Organiza Aí</span><span className="badge" role="status">{cloud ? message || 'Espaço compartilhado' : 'Modo local · demonstração'}</span></header>
    {cloud && <details className="notifications"><summary>Lembretes</summary><div className="toolbar">
      <button onClick={() => void enableMorningPush().then(() => setPushMessage('Lembrete matinal ativado neste aparelho.')).catch(error => setPushMessage(error.message))}>Ativar lembrete matinal</button>
      <span role="status">{pushMessage}</span>
    </div></details>}
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
    <nav className="app-nav" aria-label="Navegação principal">
      {(['Início', ...areas] as const).map((area, index) => <button key={area} aria-current={tab === area ? 'page' : undefined} onClick={() => navigate(area)}>
        <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={navIcons[index]} />
        </svg>
        {area}
      </button>)}
    </nav>
    <section className="hero">
      {tab === 'Início' && <p className="hero-date">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(today))}</p>}
      <h1>{tab === 'Início' ? 'Olá, Sara!' : tab === 'Semana' ? 'Minha semana' : tab}</h1>
    </section>
    {error && <p role="alert">{error}</p>}
    {!ready && !error && <p role="status">Carregando…</p>}
    {ready && tab === 'Início' && <div className="grid dashboard">
      <section className="panel dashboard-today"><div className="toolbar"><h2>Hoje</h2><button className="text-action" onClick={() => { setDay(today); navigate('Semana') }}>Ver agenda</button></div>{list(entries.filter(item => item.area === 'Semana' && occursOn(item, today)), 'Nenhum compromisso para hoje.')}</section>
      <section className="panel dashboard-exams"><h2>Próximas provas</h2>{list(exams, 'Nenhuma prova marcada.')}</section>
      <section className="panel dashboard-reviews"><h2>Revisões pendentes</h2>{list(entries.filter(item => item.kind === 'Revisão' && !item.done && item.date && item.date <= today), 'Nenhuma revisão pendente.')}</section>
      <section className="panel dashboard-finance"><div className="toolbar"><h2>Resumo financeiro</h2><button className="text-action" onClick={() => { setMonth(today.slice(0, 7)); navigate('Finanças') }}>Ver finanças</button></div><dl className="dashboard-money">
        <div><dt>Disponível</dt><dd>{money.format(current.available)}</dd></div>
        <div><dt>Reservado</dt><dd>{money.format(current.reserved)}</dd></div>
        <div><dt>Gasto</dt><dd>{money.format(current.spent)}</dd></div>
      </dl></section>
    </div>}
    {ready && tab !== 'Início' && <section className="panel">
      {tab !== 'Estudos' && <>
      <div className="toolbar"><h2>{tab === 'Semana' ? 'Calendário' : 'Lançamentos em pesos argentinos'}</h2>
        <button hidden={tab === 'Semana' && !!editing} className={tab === 'Semana' ? 'primary calendar-add' : 'primary'} onClick={() => setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: tab, date: tab === 'Finanças' ? month === today.slice(0, 7) ? today : month + '-01' : day, kind: tab === 'Finanças' ? 'Gasto' : undefined })}>{tab === 'Semana' ? <><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14" /></svg> Novo compromisso</> : '+ Adicionar'}</button></div>
      </>}
      {tab === 'Semana' && <>
        <div className="toolbar week-controls" role="group" aria-label="Navegação por mês">
          <button aria-label="Mês anterior" onClick={() => setDay(shiftDay(firstDay, -1).slice(0, 7) + '-01')}>‹</button>
          <div className="week-period"><strong aria-live="polite">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(firstDay))}</strong></div>
          <button aria-label="Próximo mês" onClick={() => setDay(shiftDay(firstDay, daysInMonth))}>›</button>
        </div>
        <div className="month-grid">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(label => <span key={label}>{label}</span>)}
          {Array.from({ length: firstWeekday }, (_, index) => <span key={index} />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const date = shiftDay(firstDay, index)
            const count = entries.filter(item => item.area === 'Semana' && occursOn(item, date)).length
            return <button key={date} aria-current={date === today ? 'date' : undefined}
              aria-label={`${weekDayLabel.format(new Date(date))}, ${count} itens`}
              aria-pressed={date === day} onClick={() => setDay(date)}>
              {index + 1}{count > 0 && <small>{count} itens</small>}
            </button>
          })}
        </div>
      </>}
      {tab === 'Semana' && <section className="week-day">
        <h3>{weekDayLabel.format(new Date(day))}</h3>
        {list(entries.filter(item => item.area === 'Semana' && occursOn(item, day)), 'Nenhum compromisso neste dia.')}
      </section>}
      {tab === 'Semana' && entries.some(item => item.area === 'Semana' && !item.date) && <section className="week-day">
        <h3>Sem data</h3>{list(entries.filter(item => item.area === 'Semana' && !item.date))}
      </section>}
      {tab === 'Estudos' && (subject ? <div className="toolbar">
        <h2>{subjects.find(item => item.id === subject)?.title}</h2>
        <button onClick={() => { setSubject(''); setTheme(''); setEditing(undefined) }}>Todas as matérias</button>
      </div> : subjects.length ? <ul>{subjects.map(item => <li key={item.id}>
        <button className="entry" onClick={() => { setSubject(item.id); setTheme(''); setEditing(undefined) }}><strong>{item.title}</strong></button>
      </li>)}</ul> : <p className="empty-state">Nenhuma matéria cadastrada.</p>)}
      {tab === 'Estudos' && themes.length > 0 && <label>Arquivos do tema<select value={theme} onChange={event => setTheme(event.target.value)}>
        <option value="">Arquivos gerais da matéria</option>{themes.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label>}
      {tab === 'Finanças' && <>
        <label>Mês<input type="month" value={month} onChange={event => setMonth(event.target.value || today.slice(0, 7))} /></label>
        <div className="finance-summary">{[['Disponível', available], ['Reservado', reserved], ['Gasto', spent]].map(([label, value], index) => {
          const combined = Math.max(available, 0) + reserved + spent
          const percent = combined ? Math.max(Number(value), 0) / combined * 100 : 0
          return <div key={label}><span className={`ring ring-${index}`} style={{ backgroundImage: `conic-gradient(var(--ring) ${percent}%, var(--tint) 0)` }} aria-hidden="true" /><strong>{money.format(Number(value))}</strong><small>{label}</small></div>
        })}</div>
        {limit !== undefined && <p>Limite do mês: {money.format(limit)}{spent > limit ? ' · Limite ultrapassado' : ''}</p>}
      </>}
      {tab !== 'Semana' && (tab !== 'Estudos' || !!subject) && list(entries.filter(item => {
        if (item.area !== tab) return false
        if (tab === 'Estudos') return !subject || item.id === subject || item.parent === subject
        return accounts.includes(item) || (expenses.includes(item) && (!item.paymentFor || !planned.some(plan => plan.id === item.paymentFor))) || planned.includes(item) || (item.kind === 'Limite' && item.date?.startsWith(month))
      }))}
    </section>}
    {ready && tab === 'Estudos' && !editing && <div className="study-actions">
      <div id="study-create-options" hidden={!studyActionsOpen}>
        {(['Matéria', 'Tema', 'Prova', 'Revisão'] as const).map(kind => <button key={kind} type="button" onClick={() => {
          setStudyActionsOpen(false)
          setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: 'Estudos', kind, date: day,
            parent: kind === 'Matéria' ? undefined : subject || undefined })
        }}>{kind === 'Tema' ? 'Novo tema' : `Nova ${kind.toLowerCase()}`}</button>)}
      </div>
      <button className="primary study-toggle" type="button" aria-label={studyActionsOpen ? 'Fechar opções' : 'Adicionar em Estudos'}
        aria-expanded={studyActionsOpen} aria-controls="study-create-options" onClick={() => setStudyActionsOpen(open => !open)}>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14" /></svg>
      </button>
    </div>}
    {tab === 'Estudos' && fileTarget && cloud && <DriveFiles key={fileTarget} subject={fileTarget} title={fileTarget === subject ? 'Arquivos da matéria' : 'Arquivos do tema'} />}
    {editing && <section key={editing.id} className={editing.area === 'Semana' ? 'panel commitment-editor' : 'panel'} aria-label="Editar item"><form onSubmit={save}>
      {editing.area === 'Semana' && <h1>{entries.some(item => item.id === editing.id) ? 'Editar compromisso' : 'Novo compromisso'}</h1>}
      <label>Título<input autoFocus required value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>
      {editing.area !== 'Semana' && <label>Tipo<select value={editing.kind ?? 'Gasto'} onChange={event => setEditing({ ...editing, kind: event.target.value as Kind })}>
        {(editing.area === 'Estudos' ? studyKinds : financeKinds).map(kind => <option key={kind}>{kind}</option>)}
      </select></label>}
      {((editing.area === 'Estudos' && editing.kind !== 'Matéria') || (editing.area === 'Finanças' && ['Gasto', 'Conta fixa', 'Parcela'].includes(editing.kind ?? 'Gasto'))) && <label>{editing.area === 'Estudos' ? 'Matéria' : 'Conta'}<select value={editing.parent ?? ''} onChange={event => setEditing({ ...editing, parent: event.target.value || undefined })}>
        <option value="">Selecionar</option>{(editing.area === 'Estudos' ? subjects : accounts).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label>}
      {editing.area === 'Finanças' && <label>Categoria<input value={editing.category ?? ''} onChange={event => setEditing({ ...editing, category: event.target.value })} /></label>}
      {editing.kind === 'Conta' && <label>Cor da conta<input type="color" value={editing.color ?? '#112c0f'} onChange={event => setEditing({ ...editing, color: event.target.value })} /></label>}
      {editing.kind === 'Parcela' && <label>Número de parcelas<input required type="number" min="2" step="1" value={editing.installments ?? ''} onChange={event => setEditing({ ...editing, installments: event.target.valueAsNumber || undefined })} /></label>}
      {editing.area !== 'Semana' && <label>Detalhes<input value={editing.detail} onChange={event => setEditing({ ...editing, detail: event.target.value })} /></label>}
      {editing.area === 'Semana' ? <>
        <CommitmentDate value={editing.date} onChange={date => setEditing({ ...editing, date })} />
        <label>Horário<input type="text" inputMode="numeric" placeholder="HH:MM"
          pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]" title="Digite um horário de 00:00 a 23:59"
          value={editing.startTime ?? ''} onChange={event => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
            const startTime = digits.length > 2 ? digits.slice(0, 2) + ':' + digits.slice(2) : digits
            setEditing({ ...editing, startTime, endTime: undefined })
          }} /></label>
      </> : <label>Data<input type="date" required={editing.kind === 'Prova' || editing.kind === 'Revisão' || editing.area === 'Finanças' && editing.kind !== 'Conta'} value={editing.date ?? ''} onChange={event => setEditing({ ...editing, date: event.target.value })} /></label>}
      {editing.area === 'Semana' && <label className="check"><input type="checkbox" checked={!!editing.weekly} onChange={event => setEditing({ ...editing, weekly: event.target.checked })} /> Repetir toda semana</label>}
      {editing.area === 'Finanças' && <label>{editing.kind === 'Parcela' ? 'Valor de cada parcela' : 'Valor'} (ARS)<input required type="number" min={editing.kind === 'Conta' ? undefined : '0.01'} step="0.01" value={editing.amount ?? ''} onChange={event => setEditing({ ...editing, amount: event.target.value ? Number(event.target.value) : undefined })} /></label>}
      {editing.kind === 'Revisão' && <label className="check"><input type="checkbox" checked={!!editing.done} onChange={event => setEditing({ ...editing, done: event.target.checked })} /> Revisão concluída</label>}
      <div className="toolbar">
        <button type="button" onClick={() => { setEditing(undefined); setError('') }}>Cancelar</button>
        {entries.some(entry => entry.id === editing.id) && <button type="button" onClick={() => void remove(editing)}>Excluir</button>}
        <button className="primary">Salvar</button>
      </div>
    </form></section>}
  </main>
}

function CommitmentDate({ value, onChange }: { value?: string; onChange: (date: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [first, setFirst] = useState((value || today).slice(0, 7) + '-01')
  const start = new Date(first)
  const padding = (start.getUTCDay() + 6) % 7
  const length = Number(shiftDay(shiftDay(first, 32).slice(0, 7) + '-01', -1).slice(-2))
  return <div className="commitment-date">
    <span>Data</span>
    <button type="button" aria-haspopup="dialog" onClick={() => {
      setFirst((value || today).slice(0, 7) + '-01')
      dialog.current?.showModal()
    }}>{value ? weekDayLabel.format(new Date(value)) : 'Escolher data'}</button>
    <dialog ref={dialog} className="date-dialog" aria-labelledby="commitment-calendar-title">
      <h2 id="commitment-calendar-title">Escolher data</h2>
      <div className="toolbar week-controls">
        <button type="button" aria-label="Mês anterior" onClick={() => setFirst(shiftDay(first, -1).slice(0, 7) + '-01')}>‹</button>
        <strong aria-live="polite">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(start)}</strong>
        <button type="button" aria-label="Próximo mês" onClick={() => setFirst(shiftDay(first, length))}>›</button>
      </div>
      <div className="month-grid">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(label => <span key={label}>{label}</span>)}
        {Array.from({ length: padding }, (_, index) => <span key={index} />)}
        {Array.from({ length }, (_, index) => {
          const date = shiftDay(first, index)
          return <button type="button" key={date} aria-pressed={date === value} aria-label={weekDayLabel.format(new Date(date))}
            onClick={() => { onChange(date); dialog.current?.close() }}>{index + 1}</button>
        })}
      </div>
      <button type="button" onClick={() => dialog.current?.close()}>Cancelar</button>
    </dialog>
  </div>
}

function financeSummary(entries: Entry[], month: string) {
  const expenses = entries.filter(entry => entry.area === 'Finanças' && (!entry.kind || entry.kind === 'Gasto') && entry.date?.startsWith(month))
  const planned = entries.filter(entry => isReserved(entry, month))
  const total = (items: Entry[]) => items.reduce((sum, entry) => sum + (entry.amount ?? 0), 0)
  const reserved = total(planned.filter(entry => !expenses.some(expense => expense.id === paymentId(entry.id, month))))
  return { expenses, planned, reserved, spent: total(expenses), available: total(entries.filter(entry => entry.kind === 'Conta')) - reserved }
}

function paymentId(entryId: string, month: string) {
  return `payment:${entryId}:${month}`
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
    {entry.title} · {entry.detail} {entry.date} {[entry.startTime, entry.endTime].filter(Boolean).join(' – ')} {entry.amount === undefined ? '' : money.format(entry.amount)}
    {entry.weekly ? ' · Semanal' : ''}{entry.done ? ' · Concluído' : ''}
    {entry.kind && ` · ${entry.kind}`}{entry.category && ` · ${entry.category}`}
    {entry.installments && ` · ${entry.installments} parcelas`}{entry.color && ` · Cor ${entry.color}`}
  </li>)}</ul> : <p>Nenhum item diferente nesta versão.</p>
}

createRoot(document.getElementById('root')!).render(<SplashScreen><App /></SplashScreen>)
