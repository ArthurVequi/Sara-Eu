import Dexie, { type Table } from 'dexie'
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { cloud } from './cloud'
import './style.css'
import { SplashScreen } from './SplashScreen'

type Area = 'Semana' | 'Estudos' | 'Finanças'
type Kind = 'Matéria' | 'Tema' | 'Prova' | 'Revisão' | 'Hábito' | 'Conta' | 'Entrada' | 'Gasto' | 'Conta fixa' | 'Parcela' | 'Limite' | 'Meta financeira'
type Entry = { id: string; area: Area; title: string; detail: string; done?: boolean; date?: string; startTime?: string; endTime?: string; weekly?: boolean; amount?: number; kind?: Kind; parent?: string; category?: string; color?: string; installments?: number; paymentFor?: string; weekday?: number; contentId?: string; habitDays?: string[]; smartReview?: boolean; goalId?: string; piggyMovement?: boolean; focusMinutes?: number }
type NotificationSettings = { studies: boolean; agenda: boolean; finances: boolean }
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
const financeActionGroups = {
  Entrada: ['Entrada'],
  'Saída': ['Gasto', 'Conta fixa', 'Parcela'],
} as const
const expenseCategories = ['Mercado', 'Alimentação', 'Farmácia', 'Lazer', 'Transporte', 'Outros'] as const
type Snapshot = { version: number; entries: Entry[] }
const db = new Dexie(cloud ? 'organiza-ai-shared' : 'organiza-ai') as Dexie & {
  entries: Table<Entry, string>
  settings: Table<{ id: string; snapshot?: Snapshot; notifications?: NotificationSettings }, string>
}
db.version(1).stores({ entries: 'id, area', settings: 'id' })
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', currencyDisplay: 'code' })
const compactMoney = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const walletColors = ['#123d2d', '#137b6b', '#3357b8', '#775291', '#a85f2a']

function occursOn(entry: Entry, day: string) {
  if (entry.kind === 'Matéria') return entry.weekday === new Date(day).getUTCDay()
  if (entry.area !== 'Semana') return false
  if (!entry.date || entry.date > day) return false
  if (!entry.weekly) return entry.date === day
  return (Date.parse(day) - Date.parse(entry.date)) % (7 * 86_400_000) === 0
}

function shiftDay(day: string, offset: number) {
  const date = new Date(day + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function shiftMonth(month: string, offset: number) {
  const [year, number] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, number - 1 + offset, 1))
  return date.toISOString().slice(0, 7)
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSettings>({ studies: true, agenda: true, finances: true })
  const [conflict, setConflict] = useState<Snapshot>()
  const [subject, setSubject] = useState('')
  const [studyActionsOpen, setStudyActionsOpen] = useState(false)
  const [financeActionsOpen, setFinanceActionsOpen] = useState(false)
  const [financeActionGroup, setFinanceActionGroup] = useState<keyof typeof financeActionGroups>()
  const [selectedWallet, setSelectedWallet] = useState('all')
  const [activePiggyBank, setActivePiggyBank] = useState<Entry>()
  const [piggyMenu, setPiggyMenu] = useState<string>()
  const [theme, setTheme] = useState('')
  const [day, setDay] = useState(linkedDay && /^\d{4}-\d{2}-\d{2}$/.test(linkedDay) ? linkedDay : today)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [focusSeconds, setFocusSeconds] = useState(25 * 60)
  const [focusRunning, setFocusRunning] = useState(false)
  const [focusSubject, setFocusSubject] = useState('')
  const accounts = entries.filter(entry => entry.kind === 'Conta')
  const subjects = entries.filter(entry => entry.kind === 'Matéria')
  const financialGoals = entries.filter(entry => entry.kind === 'Meta financeira')
  const studyPlan = entries
    .filter(entry => (entry.kind === 'Prova' || entry.kind === 'Revisão') && entry.date && entry.date >= today)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const studyDeadlines = studyPlan
    .slice(0, 4)
  const pendingReviews = studyPlan.filter(entry => entry.kind === 'Revisão' && !entry.done).length
  const themes = entries.filter(entry => entry.kind === 'Tema' && entry.parent === subject)
  const agendaMonth = day.slice(0, 7)
  const firstDay = agendaMonth + '-01'
  const firstWeekday = (new Date(firstDay + 'T00:00:00Z').getUTCDay() + 6) % 7
  const [agendaYear, agendaMonthNumber] = agendaMonth.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(agendaYear, agendaMonthNumber, 0)).getUTCDate()
  const { expenses, planned, available, reserved, spent } = financeSummary(entries, month)
  const current = financeSummary(entries, today.slice(0, 7))
  const exams = entries.filter(entry => entry.kind === 'Prova' && entry.date && entry.date >= today)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).slice(0, 3)
  const selectedAccount = accounts.find(account => account.id === selectedWallet)
  const financeView = selectedAccount ? walletFinanceSummary(selectedAccount, month) : { available, reserved, spent }
  const piggyTotal = financialGoals.reduce((sum, goal) => sum + piggyBalance(goal.id), 0)
  const isPiggyMovement = !!editing?.piggyMovement

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
      })
    } catch {
      setMessage('Sincronização indisponível. Alterações continuam neste aparelho.')
    }
  }

  useEffect(() => {
    if (!ready || !cloud) return
    const sync = () => void synchronize()
    sync()
    window.addEventListener('online', sync)
    const timer = window.setInterval(sync, 20_000)
    return () => { window.removeEventListener('online', sync); window.clearInterval(timer) }
  }, [ready])

  useEffect(() => {
    if (!focusRunning) return
    const timer = window.setInterval(() => setFocusSeconds(seconds => {
      if (seconds > 1) return seconds - 1
      window.clearInterval(timer)
      setFocusRunning(false)
      if (focusSubject) void db.entries.update(focusSubject, { focusMinutes: (entries.find(item => item.id === focusSubject)?.focusMinutes ?? 0) + focusMinutes }).then(refresh)
      return 0
    }), 1_000)
    return () => window.clearInterval(timer)
  }, [focusRunning, focusMinutes, focusSubject, entries])

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

  useEffect(() => {
    void db.settings.get('preferences').then(saved => {
      if (saved?.notifications) setNotifications(saved.notifications)
    })
  }, [])

  async function createInitialWallet() {
    const wallet = { id: crypto.randomUUID(), title: 'Carteira', detail: 'Carteira inicial', area: 'Finanças' as const, kind: 'Conta' as const, amount: 0 }
    await db.entries.put(wallet)
    await refresh()
    setEditing(current => current ? { ...current, parent: wallet.id } : current)
    void synchronize()
  }

  async function updateNotification(key: keyof NotificationSettings) {
    const next = { ...notifications, [key]: !notifications[key] }
    setNotifications(next)
    try {
      await db.settings.put({ id: 'preferences', notifications: next })
    } catch {
      setError('Não foi possível salvar as notificações.')
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || (editing.kind !== 'Entrada' && !editing.title.trim())) return
    if (!editing.date && (editing.weekly || editing.kind === 'Prova' || editing.kind === 'Revisão' || (editing.area === 'Finanças' && editing.kind !== 'Conta' && editing.kind !== 'Meta financeira'))) {
      setError('Escolha uma data antes de salvar.')
      return
    }
    if (editing.kind === 'Gasto' && editing.goalId && (editing.amount ?? 0) > piggyBalance(editing.goalId)) {
      setError('O valor para retirar é maior que o saldo do cofrinho.')
      return
    }
    try {
      const next = { ...editing, title: editing.title.trim() }
      await db.transaction('rw', db.entries, async () => {
        await db.entries.put(next)
        if (next.kind === 'Tema' && next.smartReview && !entries.some(item => item.kind === 'Revisão' && item.contentId === next.id)) {
          await db.entries.bulkPut([1, 3, 7, 14].map(days => ({ id: crypto.randomUUID(), area: 'Estudos' as const, kind: 'Revisão' as const, title: `Revisar ${next.title}`, detail: 'Revisão inteligente', parent: next.parent, contentId: next.id, date: shiftDay(today, days) })))
        }
      })
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
    if (!window.confirm(`Excluir “${entry.title}” do espaço compartilhado?`)) return
    try {
      const removed = await db.transaction('rw', db.entries, async () => {
        if ((await db.entries.toArray()).some(item => item.parent === entry.id || item.contentId === entry.id)) return false
        await db.entries.delete(entry.id)
        return true
      })
      if (!removed) {
        setError('Este item tem registros vinculados. Mova ou exclua esses registros antes.')
        return
      }
      if (subject === entry.id) setSubject('')
      if (theme === entry.id) setTheme('')
      if (selectedWallet === entry.id) setSelectedWallet('all')
      setEditing(undefined)
      setError('')
      await refresh()
      void synchronize()
    } catch {
      setError('Não foi possível excluir o item. Tente novamente.')
    }
  }

  function list(items: Entry[], empty = 'Nenhum item por aqui.', className = '') {
    const ordered = [...items].sort((a, b) =>
      (a.startTime || '24:00').localeCompare(b.startTime || '24:00'))
    return ordered.length ? <ul className={className}>{ordered.map(entry => <li key={entry.id}>
      {entry.area === 'Semana' && !entry.weekly && <input type="checkbox" checked={!!entry.done} aria-label={`Concluir ${entry.title}`} onChange={() => void toggle(entry)} />}
      <button className="entry" onClick={() => setEditing(entry)}>
        <strong>{entry.title}</strong>
        <small>{[entry.kind, [entry.startTime, entry.endTime].filter(Boolean).join(' – '), entry.detail, entry.category, entries.find(item => item.id === entry.parent)?.title, entry.date, entry.weekly || entry.weekday !== undefined ? 'Toda semana' : ''].filter(Boolean).join(' · ')}</small>
      </button>
      {entry.kind === 'Conta' && <span className="account-color" style={{ backgroundColor: entry.color }} aria-hidden="true" />}
      {entry.amount !== undefined && <strong>{money.format(entry.amount)}</strong>}
      {tab === 'Finanças' && (entry.kind === 'Conta fixa' || entry.kind === 'Parcela') && <button
        aria-pressed={entries.some(item => item.id === paymentId(entry.id, month))}
        onClick={() => void togglePayment(entry)}>
        {entries.some(item => item.id === paymentId(entry.id, month)) ? 'Desfazer pagamento' : 'Marcar como pago'}
      </button>}
    </li>)}</ul> : empty ? <p className="empty-state">{empty}</p> : null
  }

  function financeList(items: Entry[]) {
    return items.length ? <ul className="finance-entries">{items.map(entry => <li key={entry.id}>
      <span className="finance-entry-icon" aria-hidden="true"><ExpenseCategoryIcon category={entry.category} kind={entry.kind} /></span>
      <button className="entry finance-entry" onClick={() => setEditing(entry)}>
        <strong>{entry.title}</strong>
        <small>{entry.kind === 'Parcela' ? `Parcela · ${installmentPosition(entry, month)}/${entry.installments ?? 1}` : entry.kind ?? 'Gasto'}</small>
      </button>
      <span className="finance-entry-value"><strong>{money.format(entry.kind === 'Conta'
        ? (entry.amount ?? 0) + entries.filter(item => item.kind === 'Entrada' && item.parent === entry.id && item.date?.startsWith(month)).reduce((sum, item) => sum + (item.amount ?? 0), 0)
        : entry.amount ?? 0)}</strong>{entry.date && <time className="finance-entry-date" dateTime={entry.date}>{`${entry.date.slice(8, 10)}/${entry.date.slice(5, 7)}`}</time>}</span>
    </li>)}</ul> : <p className="empty-state">Nenhum lançamento neste mês.</p>
  }

  function walletBalance(account: Entry) {
    const activity = entries.filter(item => item.parent === account.id).reduce((sum, item) => sum + (item.kind === 'Entrada' ? item.amount ?? 0 : item.kind === 'Gasto' ? -(item.amount ?? 0) : 0), 0)
    return (account.amount ?? 0) + activity
  }

  function walletFinanceSummary(account: Entry, selectedMonth: string) {
    const activity = entries.filter(item => item.parent === account.id && item.date?.startsWith(selectedMonth))
    const spent = activity.filter(item => item.kind === 'Gasto').reduce((sum, item) => sum + (item.amount ?? 0), 0)
    const reserved = activity.filter(item => isReserved(item, selectedMonth)).reduce((sum, item) => sum + (item.amount ?? 0), 0)
    return { available: walletBalance(account), reserved, spent }
  }

  function piggyBalance(goalId: string) {
    return entries.filter(item => item.goalId === goalId).reduce((sum, item) => sum + (item.kind === 'Gasto' ? -(item.amount ?? 0) : item.amount ?? 0), 0)
  }

  function openPiggyMovement(goal: Entry, kind: 'Entrada' | 'Gasto') {
    setActivePiggyBank(undefined)
    setEditing({ id: crypto.randomUUID(), title: kind === 'Entrada' ? `Adicionar ao cofrinho ${goal.title}` : `Retirar do cofrinho ${goal.title}`, detail: '', area: 'Finanças', kind, goalId: goal.id, piggyMovement: true, date: today })
  }

  function navigate(area: typeof tab) {
    setTab(area)
    setStudyActionsOpen(false)
    setFinanceActionsOpen(false)
    setFinanceActionGroup(undefined)
    setQuickActionsOpen(false)
    setEditing(undefined)
    setError('')
    window.scrollTo(0, 0)
  }

  const fullEditor = editing?.area === 'Semana' && editing.kind !== 'Hábito'
  return <main className={focusRunning ? 'focus-active' : undefined}>
    <header className="app-header"><span className="brand"><span className="brand-mark" aria-hidden="true"><img src="/organiza-ai.svg" alt="" width="32" height="32" /></span> Organiza Aí</span><div className="app-header-actions"><span className="badge" role="status">{cloud ? message || 'Espaço compartilhado' : 'Modo local · demonstração'}</span><button className="settings-button" type="button" aria-label="Configurações" onClick={() => setSettingsOpen(true)}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06l-2.12 2.12l-.06-.06a1.7 1.7 0 0 0-1.88-.34a1.7 1.7 0 0 0-1.04 1.56V20h-3v-.09A1.7 1.7 0 0 0 10.66 18.35a1.7 1.7 0 0 0-1.88.34l-.06.06L6.6 16.63l.06-.06A1.7 1.7 0 0 0 7 14.69a1.7 1.7 0 0 0-1.56-1.04h-.09v-3h.09A1.7 1.7 0 0 0 7 9.61a1.7 1.7 0 0 0-.34-1.88L6.6 7.67l2.12-2.12l.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.39V4.3h3v.09a1.7 1.7 0 0 0 1.04 1.56a1.7 1.7 0 0 0 1.88-.34l.06-.06l2.12 2.12l-.06.06A1.7 1.7 0 0 0 19.4 9.61a1.7 1.7 0 0 0 1.56 1.04h.09v3h-.09A1.7 1.7 0 0 0 19.4 15" /></svg></button></div></header>
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
        {area === 'Início' ? 'Meu dia' : area}
      </button>)}
    </nav>
    <section className="hero">
      {tab === 'Início' && <p className="hero-date">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(today))}</p>}
      <h1>{tab === 'Início' ? 'Olá, Sara!' : tab === 'Semana' ? 'Minha semana' : tab}</h1>
    </section>
    {error && <p role="alert">{error}</p>}
    {!ready && !error && <p role="status">Carregando…</p>}
    {ready && tab === 'Início' && <div className="grid dashboard">
      <section className="panel dashboard-today"><div className="toolbar"><h2>Hoje</h2><button className="text-action" onClick={() => { setDay(today); navigate('Semana') }}>Ver agenda</button></div>{list(entries.filter(item => occursOn(item, today)), 'Nenhum compromisso para hoje.')}</section>
      <section className="dashboard-study-summary" aria-label="Resumo de estudos"><button className="panel study-summary-card" onClick={() => navigate('Estudos')}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-5 9 5-9 5zM7 12v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5" /></svg><small>Próxima prova</small><strong>{exams[0] ? `${Math.max(0, Math.ceil((Date.parse(exams[0].date!) - Date.parse(today)) / 86_400_000))} dias` : 'Livre'}</strong><span>{exams[0]?.title ?? 'Nenhuma prova marcada'}</span></button><button className="panel study-summary-card" onClick={() => navigate('Estudos')}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg><small>Revisões pendentes</small><strong>{pendingReviews}</strong><span>Para concluir</span></button></section>
      <section className="panel dashboard-finance"><div className="toolbar"><h2>Resumo financeiro</h2><button className="text-action" onClick={() => { setMonth(today.slice(0, 7)); navigate('Finanças') }}>Ver finanças</button></div><dl className="dashboard-money">
        <div><dt>Disponível</dt><dd aria-label={money.format(current.available)}>{compactMoney.format(current.available)}</dd></div>
        <div><dt>Reservado</dt><dd aria-label={money.format(current.reserved)}>{compactMoney.format(current.reserved)}</dd></div>
        <div><dt>Gasto</dt><dd aria-label={money.format(current.spent)}>{compactMoney.format(current.spent)}</dd></div>
      </dl></section>
    </div>}
    {ready && tab === 'Estudos' && <section className="panel focus-panel"><div className="focus-overview"><div><p>Modo de estudo</p><h2>Foco</h2></div><strong className="focus-time" aria-live="polite">{formatFocusTime(focusSeconds)}</strong></div><div className="focus-controls"><FocusSubjectPicker items={subjects} value={focusSubject} onChange={setFocusSubject} />{[25, 50].map(minutes => <button key={minutes} type="button" aria-pressed={focusMinutes === minutes} onClick={() => { setFocusMinutes(minutes); setFocusSeconds(minutes * 60); setFocusRunning(false) }}>{minutes} min</button>)}<button className="primary" type="button" onClick={() => { if (!focusRunning && focusSeconds === 0) setFocusSeconds(focusMinutes * 60); setFocusRunning(running => !running) }}>{focusRunning ? 'Pausar' : 'Começar'}</button></div></section>}
    {ready && tab === 'Estudos' && <section className="panel study-plan" aria-label="Plano de estudos"><div className="study-section-heading"><div><p>Plano de estudos</p><h2>Para estudar</h2></div><small>{studyDeadlines.filter(entry => !entry.done).length} pendentes</small></div>{studyDeadlines.length ? <ul className="study-plan-list">{studyDeadlines.map(entry => <li className={entry.done ? 'is-done' : ''} key={entry.id}><input type="checkbox" checked={!!entry.done} aria-label={`Concluir ${entry.title}`} onChange={() => void toggle(entry)} /><button className="entry" onClick={() => { setSubject(entry.parent ?? ''); setTheme(entry.contentId ?? ''); setEditing(entry) }}><strong>{entry.title}</strong><small>{[entry.kind, subjects.find(item => item.id === entry.parent)?.title, weekDayLabel.format(new Date(entry.date!))].filter(Boolean).join(' · ')}</small></button></li>)}</ul> : <p className="empty-state">Nenhuma prova ou revisão programada.</p>}</section>}
    {ready && tab !== 'Início' && <section className="panel">
      {tab !== 'Estudos' && <>
      {tab === 'Semana' && <div className="toolbar"><h2>Calendário</h2>
        <button hidden={!!editing} className="primary calendar-add" onClick={() => setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: tab, date: day })}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14" /></svg> Novo compromisso</button>
      </div>}
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
            const count = entries.filter(item => occursOn(item, date)).length
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
        {list(entries.filter(item => occursOn(item, day)), 'Nenhum compromisso neste dia.')}
      </section>}
      {tab === 'Semana' && entries.some(item => item.area === 'Semana' && item.kind !== 'Hábito' && !item.date) && <section className="week-day">
        <h3>Sem data</h3>{list(entries.filter(item => item.area === 'Semana' && item.kind !== 'Hábito' && !item.date))}
      </section>}
      {tab === 'Estudos' && <details className="study-subjects" open>
        <summary>Matérias</summary>
        {subjects.length ? <ul className="subject-list">{subjects.map(item => <li className="study-subject-card" key={item.id}>
        <button className="entry subject-toggle subject-card-trigger" aria-expanded={subject === item.id} onClick={() => {
          setSubject(subject === item.id ? '' : item.id)
          setTheme('')
        }}>
          <span className="subject-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-5 9 5-9 5zM7 12v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5" /></svg></span>
          <span className="subject-card-title"><strong>{item.title}</strong><small>{`${entries.filter(entry => entry.kind === 'Tema' && entry.parent === item.id).length} conteúdos${item.focusMinutes ? ` · ${item.focusMinutes} min de foco` : ''}`}</small></span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {subject === item.id && <div className="subject-content">
          <div className="subject-card-actions"><button type="button" onClick={() => setEditing(item)}>Editar matéria</button><button type="button" onClick={() => void remove(item)}>Excluir</button></div>
          {themes.length > 0 && <section className="content-group"><h3>Conteúdos</h3><ul className="content-list">{themes.map(content => <li key={content.id}>
            <div className="subject-row"><button type="button" className="entry subject-toggle" aria-expanded={theme === content.id}
              onClick={() => setTheme(theme === content.id ? '' : content.id)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              <strong>{content.title}</strong>
            </button>
            <StudyRowActions title={content.title} onEdit={() => setEditing(content)} onRemove={() => void remove(content)} /></div>
            {theme === content.id && <div className="subject-content">
              {content.detail && <p>{content.detail}</p>}
              {entries.some(entry => entry.contentId === content.id) && list(entries.filter(entry => entry.contentId === content.id))}
            </div>}
          </li>)}</ul></section>}
          {entries.some(entry => entry.parent === item.id && entry.kind !== 'Tema' && !themes.some(content => content.id === entry.contentId)) && <section className="content-group content-activities"><h3>Atividades</h3>{list(entries.filter(entry => entry.parent === item.id && entry.kind !== 'Tema' && !themes.some(content => content.id === entry.contentId)))}</section>}
          {!themes.length && !entries.some(entry => entry.parent === item.id && entry.kind !== 'Tema') && <p className="empty-state">Nenhum conteúdo cadastrado.</p>}
        </div>}
      </li>)}</ul> : <p className="empty-state">Nenhuma matéria cadastrada.</p>}
      </details>}
      {tab === 'Finanças' && <>
        <section className="finance-wallets" aria-label="Carteiras">
          <h3>Carteiras</h3>
          <div className="wallet-switcher">
            <button className="wallet-option wallet-option-all" type="button" aria-pressed={selectedWallet === 'all'} onClick={() => setSelectedWallet('all')}>
              <span className="wallet-option-mark" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" /></svg></span>
              <strong>Todos</strong>
            </button>
            {accounts.map((account, index) => <button className="wallet-option" type="button" key={account.id} aria-pressed={selectedWallet === account.id} onClick={() => setSelectedWallet(account.id)}>
              <span className="wallet-option-mark" style={{ backgroundColor: walletColors[index % walletColors.length] }} aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v2m0 6v2a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6" /><path d="M16 12h4v4h-4a2 2 0 0 1 0-4Z" /></svg></span>
              <strong>{account.title}</strong>
            </button>)}
            <button className="wallet-option wallet-new" type="button" onClick={() => setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: 'Finanças', kind: 'Conta', amount: 0 })}>
              <span className="wallet-option-mark" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14" /></svg></span>
              <strong>Novo</strong>
            </button>
          </div>
          <section className="finance-goals finance-piggy-bank" aria-label="Cofrinho">
            <div className="toolbar"><h4><span className="piggy-icon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M15 10c0-.55.45-1 1-1s1 .45 1 1s-.45 1-1 1s-1-.45-1-1M8 9h5V7H8zm14-1.5v6.97l-2.82.94L17.5 21H12v-2h-2v2H4.5S2 12.54 2 9.5S4.46 4 7.5 4h5c.91-1.21 2.36-2 4-2a1.498 1.498 0 0 1 1.38 2.08c-.14.34-.26.73-.32 1.15l2.27 2.27zm-2 2h-1L15.5 6c0-.65.09-1.29.26-1.91c-.97.25-1.76.97-2.09 1.91H7.5C5.57 6 4 7.57 4 9.5c0 1.88 1.22 6.65 2 9.5h2v-2h6v2h2l1.56-5.15l2.44-.82z" /></svg></span>Cofrinho</h4><button type="button" className="text-action" onClick={() => setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: 'Finanças', kind: 'Meta financeira' })}>Novo</button></div>
          </section>
          {financialGoals.length > 0 && <ul className="piggy-list">{financialGoals.map(goal => {
            const saved = piggyBalance(goal.id)
            const progress = goal.amount ? Math.min(100, saved / goal.amount * 100) : 0
            return <li className="piggy-goal" key={goal.id}><button type="button" className="piggy-open" onClick={() => setActivePiggyBank(goal)}><span className="piggy-heading"><strong>{goal.title}</strong><span className="piggy-saved"><small>Separado</small><strong>{money.format(saved)}</strong></span></span><span className="piggy-progress-row"><strong>{Math.round(progress)}%</strong><span className="goal-progress" aria-label={`${Math.round(progress)}% concluída`}><span style={{ width: `${progress}%` }} /></span></span><small className="piggy-target">Meta: {money.format(goal.amount ?? 0)}</small></button><div className="piggy-menu"><button type="button" className="piggy-more" aria-label={`Opções de ${goal.title}`} aria-expanded={piggyMenu === goal.id} onClick={() => setPiggyMenu(current => current === goal.id ? undefined : goal.id)}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg></button>{piggyMenu === goal.id && <div className="piggy-menu-options" role="menu"><button type="button" role="menuitem" onClick={() => { setPiggyMenu(undefined); setEditing(goal) }}>Editar</button><button type="button" role="menuitem" onClick={() => { setPiggyMenu(undefined); void remove(goal) }}>Apagar</button></div>}</div></li>
          })}</ul>}
        </section>
        <div className="toolbar finance-month-controls" role="group" aria-label="Navegação por mês">
          <button aria-label="Mês anterior" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
          <div><strong aria-live="polite">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`))}</strong></div>
          <button aria-label="Próximo mês" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
        </div>
        <h3 className="finance-view-title">{selectedAccount ? selectedAccount.title : 'Todos'}</h3>
        <div className="finance-summary">{[['Disponível', financeView.available], ['Reservado', financeView.reserved], ['Gasto', financeView.spent]].map(([label, value], index) => {
          const combined = Math.max(financeView.available, 0) + financeView.reserved + financeView.spent
          const percent = combined ? Math.max(Number(value), 0) / combined * 100 : 0
          const piggyPercent = index === 0 && combined ? Math.min(Math.max(piggyTotal, 0), Math.max(financeView.available, 0)) / combined * 100 : 0
          const backgroundImage = index === 0 && piggyPercent ? `conic-gradient(var(--piggy) ${piggyPercent}%, var(--ring) 0 ${percent}%, var(--tint) 0)` : `conic-gradient(var(--ring) ${percent}%, var(--tint) 0)`
          return <div key={label}><span className={`ring ring-${index}`} style={{ backgroundImage }} aria-hidden="true" /><strong>{money.format(Number(value))}</strong><small>{label}</small></div>
        })}</div>
        <p className="piggy-total">Guardado nos cofrinhos: <strong>{money.format(piggyTotal)}</strong></p>
      </>}
      {tab === 'Finanças' && financeList(entries.filter(item => {
        if (item.area !== tab) return false
        const included = (item.kind === 'Entrada' && item.date?.startsWith(month)) || (expenses.includes(item) && (!item.paymentFor || !planned.some(plan => plan.id === item.paymentFor))) || planned.includes(item)
        return included && (selectedWallet === 'all' || item.parent === selectedWallet)
      }))}
    </section>}
    {ready && tab === 'Estudos' && !editing && <div className="study-actions">
      <div id="study-create-options" hidden={!studyActionsOpen}>
        {(['Matéria', 'Tema', 'Prova', 'Revisão'] as const).map(kind => <button key={kind} type="button" onClick={() => {
          setStudyActionsOpen(false)
          setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: 'Estudos', kind,
            date: kind === 'Prova' || kind === 'Revisão' ? day : undefined,
            parent: kind === 'Matéria' ? undefined : subject || undefined })
        }}>{kind === 'Tema' ? 'Novo conteúdo' : `Nova ${kind.toLowerCase()}`}</button>)}
      </div>
      <button className="primary study-toggle" type="button" aria-label={studyActionsOpen ? 'Fechar opções' : 'Adicionar em Estudos'}
        aria-expanded={studyActionsOpen} aria-controls="study-create-options" onClick={() => setStudyActionsOpen(open => !open)}>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14" /></svg>
      </button>
    </div>}
    {ready && tab === 'Início' && !editing && <div className="quick-actions">
      <div id="quick-create-options" hidden={!quickActionsOpen}>
        <button type="button" onClick={() => { setQuickActionsOpen(false); setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: 'Semana', date: today }) }}>Novo compromisso</button>
        <button type="button" onClick={() => { setQuickActionsOpen(false); setEditing({ id: crypto.randomUUID(), title: '', detail: '', area: 'Estudos', kind: 'Prova', date: today }) }}>Nova prova</button>
        <button type="button" onClick={() => { setQuickActionsOpen(false); setEditing({ id: crypto.randomUUID(), title: 'Adicionar saldo', detail: '', area: 'Finanças', kind: 'Entrada', date: today }) }}>Movimentação</button>
      </div>
      <button className="primary quick-toggle" type="button" aria-label={quickActionsOpen ? 'Fechar adição rápida' : 'Adição rápida'} aria-expanded={quickActionsOpen} aria-controls="quick-create-options" onClick={() => setQuickActionsOpen(open => !open)}>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14" /></svg>
      </button>
    </div>}
    {ready && tab === 'Finanças' && !editing && <div className="finance-actions">
      <div id="finance-type-options" className="finance-action-types" hidden={!financeActionGroup}>
        {financeActionGroup && financeActionGroups[financeActionGroup].map(kind => <button key={kind} type="button" onClick={() => {
          setFinanceActionsOpen(false)
          setFinanceActionGroup(undefined)
          setEditing({ id: crypto.randomUUID(), title: kind === 'Entrada' ? 'Adicionar saldo' : '', detail: '', area: 'Finanças', kind,
            date: month === today.slice(0, 7) ? today : `${month}-01` })
        }}>{kind === 'Entrada' ? 'Adicionar saldo' : `Novo ${kind.toLowerCase()}`}</button>)}
      </div>
      <div id="finance-create-options" className="finance-action-groups" hidden={!financeActionsOpen}>
        {(Object.keys(financeActionGroups) as Array<keyof typeof financeActionGroups>).map(group => <button key={group} type="button"
          aria-expanded={financeActionGroup === group} aria-controls="finance-type-options"
          onClick={() => setFinanceActionGroup(current => current === group ? undefined : group)}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {group === 'Entrada' ? <><path fill="currentColor" d="M17 8V5a1 1 0 0 0-1-1H6a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6" /><path fill="currentColor" d="M20 12v4h-4a2 2 0 0 1 0-4z" /></> : <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2l-2 2l-2-2l-2 2l-2-2zM9 7h6m-6 4h6m-2 4h2" />}
          </svg>
          {group}
        </button>)}
      </div>
      <button className="primary finance-toggle" type="button" aria-label={financeActionsOpen ? 'Fechar opções financeiras' : 'Adicionar lançamento'}
        aria-expanded={financeActionsOpen} aria-controls="finance-create-options" onClick={() => {
          setFinanceActionsOpen(open => !open)
          setFinanceActionGroup(undefined)
        }}>
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14m-7-7v14" /></svg>
      </button>
    </div>}
    {activePiggyBank && <ItemEditor modal onCancel={() => setActivePiggyBank(undefined)}><section className="panel piggy-movement" aria-label="Movimentar cofrinho"><h1 id="item-editor-title">{activePiggyBank.title}</h1><p>Separado: <strong>{money.format(piggyBalance(activePiggyBank.id))}</strong></p><div><button type="button" className="primary" onClick={() => openPiggyMovement(activePiggyBank, 'Entrada')}>Adicionar dinheiro</button><button type="button" onClick={() => openPiggyMovement(activePiggyBank, 'Gasto')}>Retirar dinheiro</button></div><button type="button" onClick={() => setActivePiggyBank(undefined)}>Cancelar</button></section></ItemEditor>}
    {settingsOpen && <ItemEditor modal onCancel={() => setSettingsOpen(false)}><section className="panel settings-panel" aria-label="Configurações"><div className="settings-heading"><span className="settings-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06l-2.12 2.12l-.06-.06a1.7 1.7 0 0 0-1.88-.34a1.7 1.7 0 0 0-1.04 1.56V20h-3v-.09A1.7 1.7 0 0 0 10.66 18.35a1.7 1.7 0 0 0-1.88.34l-.06.06L6.6 16.63l.06-.06A1.7 1.7 0 0 0 7 14.69a1.7 1.7 0 0 0-1.56-1.04h-.09v-3h.09A1.7 1.7 0 0 0 7 9.61a1.7 1.7 0 0 0-.34-1.88L6.6 7.67l2.12-2.12l.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.39V4.3h3v.09a1.7 1.7 0 0 0 1.04 1.56a1.7 1.7 0 0 0 1.88-.34l.06-.06l2.12 2.12l-.06.06A1.7 1.7 0 0 0 19.4 9.61a1.7 1.7 0 0 0 1.56 1.04h.09v3h-.09A1.7 1.7 0 0 0 19.4 15" /></svg></span><div><h1 id="item-editor-title">Configurações</h1><p>Notificações</p></div></div><div className="notification-options">{([{ key: 'studies', title: 'Estudos', detail: 'Revisões e provas programadas' }, { key: 'agenda', title: 'Agenda', detail: 'Compromissos próximos e atrasados' }, { key: 'finances', title: 'Finanças', detail: 'Contas e parcelas a vencer' }] as const).map(option => <label className="notification-option" key={option.key}><span><strong>{option.title}</strong><small>{option.detail}</small></span><input type="checkbox" checked={notifications[option.key]} onChange={() => void updateNotification(option.key)} /></label>)}</div><button type="button" onClick={() => setSettingsOpen(false)}>Concluir</button></section></ItemEditor>}
    {editing && <ItemEditor key={editing.id} modal onCancel={() => { setEditing(undefined); setError('') }}>
      <section className={fullEditor ? 'panel commitment-editor' : 'panel'} aria-label="Editar item"><form onSubmit={save}>
      {editing.area === 'Semana' && <h1 id="item-editor-title">{editing.kind === 'Hábito' ? entries.some(item => item.id === editing.id) ? 'Editar hábito' : 'Novo hábito' : entries.some(item => item.id === editing.id) ? 'Editar compromisso' : 'Novo compromisso'}</h1>}
      {editing.area === 'Estudos' && <h1 id="item-editor-title">{entries.some(item => item.id === editing.id) ? `Editar ${editing.kind === 'Tema' ? 'conteúdo' : editing.kind?.toLowerCase() ?? 'item'}` : editing.kind === 'Tema' ? 'Novo conteúdo' : `Nova ${editing.kind?.toLowerCase() ?? 'matéria'}`}</h1>}
      {editing.area === 'Finanças' && <h1 id="item-editor-title">{isPiggyMovement ? `${editing.kind === 'Entrada' ? 'Adicionar ao' : 'Retirar do'} cofrinho ${financialGoals.find(goal => goal.id === editing.goalId)?.title ?? ''}` : editing.kind === 'Entrada' ? 'Adicionar saldo' : editing.kind === 'Meta financeira' ? entries.some(item => item.id === editing.id) ? 'Editar cofrinho' : 'Novo cofrinho' : entries.some(item => item.id === editing.id) ? 'Editar lançamento' : editing.kind === 'Conta fixa' ? 'Nova conta fixa' : editing.kind === 'Parcela' ? 'Nova parcela' : editing.kind === 'Limite' ? 'Limite mensal' : 'Novo gasto'}</h1>}
      {error && <p role="alert">{error}</p>}
      {!isPiggyMovement && (editing.area !== 'Finanças' || editing.kind !== 'Entrada') && <label>{editing.kind === 'Matéria' ? 'Nome da matéria' : editing.kind === 'Tema' ? 'Nome do conteúdo' : editing.kind === 'Conta' ? 'Nome da conta' : editing.kind === 'Meta financeira' ? 'Nome do cofrinho' : 'Título'}<input autoFocus required value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>}
      {editing.area === 'Estudos' && editing.kind !== 'Matéria' && <SubjectPicker items={subjects} value={editing.parent}
        onChange={parent => setEditing({ ...editing, parent, contentId: parent === editing.parent ? editing.contentId : undefined })} />}
      {editing.parent && (editing.kind === 'Prova' || editing.kind === 'Revisão') && <SubjectPicker label="Conteúdo"
        items={entries.filter(item => item.kind === 'Tema' && item.parent === editing.parent)}
        value={editing.contentId} onChange={contentId => setEditing({ ...editing, contentId })} />}
      {editing.kind === 'Tema' && <label className="check"><input type="checkbox" checked={!!editing.smartReview} onChange={event => setEditing({ ...editing, smartReview: event.target.checked })} /> Programar revisões em 1, 3, 7 e 14 dias</label>}
      {editing.area === 'Finanças' && !isPiggyMovement && ['Entrada', 'Gasto', 'Conta fixa', 'Parcela'].includes(editing.kind ?? 'Gasto') && (accounts.length ? <label>Onde<select required value={editing.parent ?? ''} onChange={event => setEditing({ ...editing, parent: event.target.value || undefined })}>
        <option value="">Selecionar</option>{accounts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select></label> : <div className="no-account"><strong>Onde</strong><p>Você ainda não tem uma carteira.</p><button type="button" onClick={() => void createInitialWallet()}>Criar carteira</button></div>)}
      {!isPiggyMovement && editing.kind === 'Gasto' && <SubjectPicker label="Cofrinho" items={financialGoals} value={editing.goalId} onChange={goalId => setEditing({ ...editing, goalId })} />}
      {editing.area === 'Finanças' && ['Gasto', 'Conta fixa', 'Parcela'].includes(editing.kind ?? 'Gasto') && !editing.goalId && <CategoryPicker value={editing.category} onChange={category => setEditing({ ...editing, category })} />}
      {editing.kind === 'Parcela' && <label>Número de parcelas<input required type="number" min="2" step="1" value={editing.installments ?? ''} onChange={event => setEditing({ ...editing, installments: event.target.valueAsNumber || undefined })} /></label>}
      {editing.area !== 'Semana' && editing.area !== 'Finanças' && <label>{editing.area === 'Estudos' ? 'Descrição (opcional)' : 'Detalhes'}<input value={editing.detail} onChange={event => setEditing({ ...editing, detail: event.target.value })} /></label>}
      {editing.kind === 'Matéria' && <SubjectWeekday value={editing.weekday} onChange={weekday => setEditing({ ...editing, weekday })} />}
      {(fullEditor || editing.kind === 'Prova' || editing.kind === 'Revisão') && <EditorDate value={editing.date} onChange={date => setEditing({ ...editing, date })} />}
      {editing.area === 'Finanças' && !isPiggyMovement && editing.kind !== 'Conta' && editing.kind !== 'Meta financeira' && <EditorDate compact value={editing.date} onChange={date => setEditing({ ...editing, date })} />}
      {((editing.area === 'Semana' && editing.kind !== 'Hábito') || editing.kind === 'Matéria') &&
        <label>Horário<input type="text" inputMode="numeric" placeholder="HH:MM"
          pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]" title="Digite um horário de 00:00 a 23:59"
          value={editing.startTime ?? ''} onChange={event => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
            const startTime = digits.length > 2 ? digits.slice(0, 2) + ':' + digits.slice(2) : digits
            setEditing({ ...editing, startTime, endTime: undefined })
          }} /></label>
      }
      {editing.area === 'Semana' && editing.kind !== 'Hábito' && <label className="check"><input type="checkbox" checked={!!editing.weekly} onChange={event => setEditing({ ...editing, weekly: event.target.checked })} /> Repetir toda semana</label>}
      {editing.area === 'Finanças' && <label>{editing.kind === 'Conta' ? 'Saldo inicial' : editing.kind === 'Meta financeira' ? 'Valor do cofrinho' : editing.kind === 'Parcela' ? 'Valor de cada parcela' : 'Valor'} (ARS)<input required type="number" min={editing.kind === 'Conta' ? undefined : '0.01'} step="0.01" value={editing.amount ?? ''} onChange={event => setEditing({ ...editing, amount: event.target.value ? Number(event.target.value) : undefined })} /></label>}
      {editing.kind === 'Revisão' && <label className="check"><input type="checkbox" checked={!!editing.done} onChange={event => setEditing({ ...editing, done: event.target.checked })} /> Revisão concluída</label>}
      <div className="toolbar">
        <button type="button" onClick={() => { setEditing(undefined); setError('') }}>Cancelar</button>
        {entries.some(entry => entry.id === editing.id) && editing.kind !== 'Meta financeira' && <button type="button" onClick={() => void remove(editing)}>Excluir</button>}
        <button className="primary">Salvar</button>
      </div>
    </form></section></ItemEditor>}
  </main>
}

function StudyRowActions({ title, onEdit, onRemove }: { title: string; onEdit: () => void; onRemove: () => void }) {
  return <>
    <button type="button" className="subject-edit" aria-label={`Editar ${title}`} onClick={onEdit}>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 3 5 5M4 15 16 3a2.12 2.12 0 0 1 3 0l2 2a2.12 2.12 0 0 1 0 3L9 20l-6 1z" />
      </svg>
    </button>
    <button type="button" className="subject-edit" aria-label={`Excluir ${title}`} onClick={onRemove}>
      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M10 10v7m4-7v7" />
      </svg>
    </button>
  </>
}

function ItemEditor({ modal, onCancel, children }: { modal: boolean; onCancel: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const node = dialog.current
    if (!modal || !node) return
    node.showModal()
    return () => node.close()
  }, [modal])
  useEffect(() => {
    if (!modal) return
    const root = document.documentElement
    const body = document.body
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousOverscroll = body.style.overscrollBehavior
    const stopBackgroundInteraction = (event: Event) => {
      const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]'))
      const topDialog = dialogs.at(-1)
      if (topDialog && !topDialog.contains(event.target as Node)) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    document.addEventListener('pointerdown', stopBackgroundInteraction, true)
    document.addEventListener('click', stopBackgroundInteraction, true)
    document.addEventListener('touchstart', stopBackgroundInteraction, { capture: true, passive: false })
    document.addEventListener('touchmove', stopBackgroundInteraction, { capture: true, passive: false })
    document.addEventListener('wheel', stopBackgroundInteraction, { capture: true, passive: false })
    return () => {
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow
      body.style.overscrollBehavior = previousOverscroll
      document.removeEventListener('pointerdown', stopBackgroundInteraction, true)
      document.removeEventListener('click', stopBackgroundInteraction, true)
      document.removeEventListener('touchstart', stopBackgroundInteraction, true)
      document.removeEventListener('touchmove', stopBackgroundInteraction, true)
      document.removeEventListener('wheel', stopBackgroundInteraction, true)
    }
  }, [modal])
  if (!modal) return children
  return <dialog ref={dialog} className="study-editor-dialog" aria-labelledby="item-editor-title"
    onCancel={event => { event.preventDefault(); onCancel() }}>{children}</dialog>
}

function ExpenseCategoryIcon({ category, kind, size = 18 }: { category?: string; kind?: Kind; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (kind === 'Entrada') return <svg {...props}><path d="M5 12h14m-7-7v14" /><path d="M4 5h16v14H4z" /></svg>
  if (kind === 'Conta fixa') return <svg {...props}><path d="M5 3h14v18l-3-2l-2 2l-2-2l-2 2l-3-2zM9 7h6m-6 4h6" /></svg>
  if (kind === 'Parcela') return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h2" /></svg>
  if (category === 'Mercado') return <svg {...props}><path d="M6.331 8H17.67a2 2 0 0 1 1.977 2.304l-1.255 8.152A3 3 0 0 1 15.426 21H8.574a3 3 0 0 1-2.965-2.544l-1.255-8.152A2 2 0 0 1 6.331 8" /><path d="M9 11V6a3 3 0 0 1 6 0v5" /></svg>
  if (category === 'Alimentação') return <svg {...props}><path d="M19 3v12h-5c-.023-3.681.184-7.406 5-12m0 12v6h-1v-3M8 4v17M5 4v3a3 3 0 1 0 6 0V4" /></svg>
  if (category === 'Farmácia') return <svg {...props}><path d="M13 3a1 1 0 0 1 1 1v4.535l3.928-2.267a1 1 0 0 1 1.366.366l1 1.732a1 1 0 0 1-.366 1.366L16.001 12l3.927 2.269a1 1 0 0 1 .366 1.366l-1 1.732a1 1 0 0 1-1.366.366L14 15.464V20a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-4.536l-3.928 2.268a1 1 0 0 1-1.366-.366l-1-1.732a1 1 0 0 1 .366-1.366L7.999 12L4.072 9.732a1 1 0 0 1-.366-1.366l1-1.732a1 1 0 0 1 1.366-.366L10 8.535V4a1 1 0 0 1 1-1z" /></svg>
  if (category === 'Lazer') return <svg {...props}><path d="M17.553 16.75a7.5 7.5 0 0 0-10.606 0M18 3.804A6 6 0 0 0 9.804 6l10.392 6A6 6 0 0 0 18 3.804M16.732 10C18.39 7.13 18.957 4.356 18 3.804S14.925 5.13 13.268 8M15 9l-3 5.196M3 19.25A2.4 2.4 0 0 1 4 19a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2-1a2.4 2.4 0 0 1 2-1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2-1a2.4 2.4 0 0 1 2-1a2.4 2.4 0 0 1 1 .25" /></svg>
  if (category === 'Transporte') return <svg {...props}><path d="M5 17h14l-1.5-8h-11zM7 17v2m10-2v2M4 10l1-5h14l1 5M7 13h.01M17 13h.01" /></svg>
  return <svg {...props}><path d="M4 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0m7 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0" /></svg>
}

function CategoryPicker({ value, onChange }: { value?: string; onChange: (category?: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const choose = (category?: string) => { onChange(category); dialog.current?.close() }
  return <div className="commitment-date category-picker">
    <span>Categoria</span>
    <button type="button" aria-label="Selecionar categoria" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>{value ? <><ExpenseCategoryIcon category={value} /><span>{value}</span></> : 'Selecionar categoria'}</button>
    <dialog ref={dialog} className="date-dialog weekday-dialog" aria-label="Selecionar categoria"><h2>Categoria</h2><div>{expenseCategories.map(category => <button key={category} type="button" className="category-choice" aria-pressed={value === category} onClick={() => choose(category)}><ExpenseCategoryIcon category={category} /><span>{category}</span></button>)}</div><button type="button" onClick={() => dialog.current?.close()}>Cancelar</button></dialog>
  </div>
}

function SubjectPicker({ label = 'Matéria', items, value, onChange }: { label?: string; items: Entry[]; value?: string; onChange: (id?: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const prompt = label === 'Matéria' ? 'Selecionar matéria' : 'Selecionar conteúdo'
  const choose = (id?: string) => { onChange(id); dialog.current?.close() }
  return <div className="commitment-date">
    <span>{label}</span>
    <button type="button" aria-label={prompt} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      {items.find(item => item.id === value)?.title ?? prompt}
    </button>
    <dialog ref={dialog} className="date-dialog weekday-dialog subject-picker" aria-label={prompt}>
      <h2>{prompt}</h2>
      <div>{items.map(item => <button key={item.id} type="button" aria-pressed={item.id === value} onClick={() => choose(item.id)}>{item.title}</button>)}
        <button type="button" aria-pressed={!value} onClick={() => choose()}>{`Sem ${label.toLowerCase()} vinculada`}</button>
      </div>
      <button type="button" onClick={() => dialog.current?.close()}>Cancelar</button>
    </dialog>
  </div>
}

function FocusSubjectPicker({ items, value, onChange }: { items: Entry[]; value?: string; onChange: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const choose = (id: string) => { onChange(id); dialog.current?.close() }
  const selected = items.find(item => item.id === value)
  return <div className="focus-subject-picker">
    <button type="button" aria-label="Selecionar matéria do foco" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-5 9 5-9 5zM7 12v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5" /></svg>
      <span>{selected?.title ?? 'Escolher matéria'}</span><span aria-hidden="true">⌄</span>
    </button>
    <dialog ref={dialog} className="date-dialog weekday-dialog subject-picker" aria-label="Selecionar matéria do foco">
      <h2>Matéria do foco</h2>
      <div>{items.map(item => <button key={item.id} type="button" aria-pressed={item.id === value} onClick={() => choose(item.id)}>{item.title}</button>)}</div>
      <button type="button" onClick={() => dialog.current?.close()}>Cancelar</button>
    </dialog>
  </div>
}

const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function SubjectWeekday({ value, onChange }: { value?: number; onChange: (weekday?: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const choose = (weekday?: number) => {
    onChange(weekday)
    dialog.current?.close()
  }
  return <div className="commitment-date">
    <span>Dia da semana</span>
    <button type="button" aria-label="Dia da semana" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      {value === undefined ? 'Sem dia vinculado' : weekdays[value]}
    </button>
    <dialog ref={dialog} className="date-dialog weekday-dialog" aria-labelledby="weekday-title">
      <h2 id="weekday-title">Dia da semana</h2>
      <div>{[1, 2, 3, 4, 5, 6, 0].map(day => <button key={day} type="button" aria-pressed={value === day} onClick={() => choose(day)}>{weekdays[day]}</button>)}
        <button type="button" aria-pressed={value === undefined} onClick={() => choose()}>Sem dia vinculado</button>
      </div>
      <button type="button" onClick={() => dialog.current?.close()}>Cancelar</button>
    </dialog>
  </div>
}

function EditorDate({ value, onChange, compact = false }: { value?: string; onChange: (date: string) => void; compact?: boolean }) {
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
    }}>{value ? compact ? value.slice(8, 10) + '/' + value.slice(5, 7) : weekDayLabel.format(new Date(value)) : 'Escolher data'}</button>
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
  const additions = entries.filter(entry => entry.kind === 'Entrada' && entry.date?.startsWith(month))
  const planned = entries.filter(entry => isReserved(entry, month))
  const total = (items: Entry[]) => items.reduce((sum, entry) => sum + (entry.amount ?? 0), 0)
  const reserved = total(planned.filter(entry => !expenses.some(expense => expense.id === paymentId(entry.id, month))))
  return { expenses, planned, reserved, spent: total(expenses), available: total(entries.filter(entry => entry.kind === 'Conta')) + total(additions) - reserved }
}

function paymentId(entryId: string, month: string) {
  return `payment:${entryId}:${month}`
}

function installmentPosition(entry: Entry, month: string) {
  if (!entry.date) return 1
  const [year, number] = month.split('-').map(Number)
  const [startYear, startNumber] = entry.date.split('-').map(Number)
  return Math.min(Math.max((year - startYear) * 12 + number - startNumber + 1, 1), entry.installments ?? 1)
}

function habitStreak(days: string[] = []) {
  let streak = 0
  let cursor = today
  while (days.includes(cursor)) {
    streak += 1
    cursor = shiftDay(cursor, -1)
  }
  return streak
}

function formatFocusTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
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
  const equal = (left: unknown, right: unknown) => Array.isArray(left) || Array.isArray(right) ? JSON.stringify(left) === JSON.stringify(right) : left === right
  return (Object.keys(a) as (keyof Entry)[]).every(key => equal(a[key], b[key]))
    && (Object.keys(b) as (keyof Entry)[]).every(key => equal(a[key], b[key]))
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
