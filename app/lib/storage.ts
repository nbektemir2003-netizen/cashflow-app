import { AnnualPlan, Transaction, Category, Account, Transfer, RecurringPayment } from './types'
import { DEFAULT_CATEGORIES } from './data'

// Запись в localStorage может бросить исключение (приватный режим, переполнение, запрет
// сайтовых данных). Раньше это обрывало обработчик ДО отправки в облако: сумма на экране
// менялась, но нигде не сохранялась и пропадала после обновления страницы.
function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    console.error('[storage] не удалось записать', key, e)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloud-sync-error', { detail: `память браузера (${key}): ${(e as Error)?.message ?? e}` }))
    }
  }
}

const PLAN_KEY = 'cashflow_annual_plan'         // legacy
const MONTHLY_PLANS_KEY = 'cashflow_monthly_plans'
const TRANSACTIONS_KEY = 'cashflow_transactions'
const BALANCES_KEY = 'cashflow_opening_balances'
const CATEGORIES_KEY = 'cashflow_categories'
const ACCOUNTS_KEY = 'cashflow_accounts'
const TRANSFERS_KEY = 'cashflow_transfers'
const RECURRING_KEY = 'cashflow_recurring'

export const DEPOSIT_ACCOUNT_ID = 'deposit'

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'card', name: 'Карта', icon: '💳', initialBalance: 0 },
  { id: 'cash', name: 'Наличные', icon: '💵', initialBalance: 0 },
  { id: DEPOSIT_ACCOUNT_ID, name: 'Депозит', icon: '🏦', initialBalance: 0 },
]

export type MonthPlan = {
  amounts: Record<string, number>
  notes: Record<string, string>
  // Ручной начальный остаток плана этого месяца (не влияет на фактический остаток во вкладке "Месяц")
  opening?: number
}
export type MonthlyPlans = Record<string, MonthPlan>

function migrateMonthlyPlans(raw: any): MonthlyPlans {
  if (!raw || typeof raw !== 'object') return {}
  const result: MonthlyPlans = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v === 'object' && 'amounts' in (v as any)) {
      result[k] = v as MonthPlan
    } else if (v && typeof v === 'object') {
      // Old format: { "2026-4": { salary: 350000, ... } }
      result[k] = { amounts: v as Record<string, number>, notes: {} }
    }
  }
  return result
}

export function getMonthlyPlans(): MonthlyPlans {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(MONTHLY_PLANS_KEY)
    if (data) return migrateMonthlyPlans(JSON.parse(data))
    // Migrate from very old flat plan → current month
    const legacy = localStorage.getItem(PLAN_KEY)
    if (legacy) {
      const old: AnnualPlan = JSON.parse(legacy)
      const now = new Date()
      const key = monthKey(now.getFullYear(), now.getMonth())
      return { [key]: { amounts: old, notes: {} } }
    }
    return {}
  } catch {
    return {}
  }
}

export function saveMonthlyPlans(plans: MonthlyPlans): void {
  safeSet(MONTHLY_PLANS_KEY, JSON.stringify(plans))
}

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

export function saveTransactions(transactions: Transaction[]): void {
  safeSet(TRANSACTIONS_KEY, JSON.stringify(transactions))
}

export function getOpeningBalances(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(BALANCES_KEY)
    return data ? JSON.parse(data) : {}
  } catch { return {} }
}

export function saveOpeningBalances(balances: Record<string, number>): void {
  safeSet(BALANCES_KEY, JSON.stringify(balances))
}

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

// Пользователи, у которых категории уже сохранены (локально или в облаке),
// не получают новые пункты из DEFAULT_CATEGORIES автоматически — их список
// "заморожен" на момент первого сохранения. Эта функция дополняет сохранённый
// список недостающими стандартными категориями, не трогая пользовательские правки.
export function mergeWithDefaultCategories(categories: Category[]): Category[] {
  const existingIds = new Set(categories.map(c => c.id))
  const missing = DEFAULT_CATEGORIES.filter(c => !existingIds.has(c.id))
  return missing.length > 0 ? [...categories, ...missing] : categories
}

export function getStoredCategories(): Category[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES
  try {
    const data = localStorage.getItem(CATEGORIES_KEY)
    const cats = data ? JSON.parse(data) : DEFAULT_CATEGORIES
    return mergeWithDefaultCategories(cats)
  } catch { return DEFAULT_CATEGORIES }
}

export function saveStoredCategories(categories: Category[]): void {
  safeSet(CATEGORIES_KEY, JSON.stringify(categories))
}

export function getAccounts(): Account[] {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNTS
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY)
    return data ? JSON.parse(data) : DEFAULT_ACCOUNTS
  } catch { return DEFAULT_ACCOUNTS }
}
export function saveAccounts(accounts: Account[]): void {
  safeSet(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function getTransfers(): Transfer[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(TRANSFERS_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}
export function saveTransfers(transfers: Transfer[]): void {
  safeSet(TRANSFERS_KEY, JSON.stringify(transfers))
}

export function getRecurring(): RecurringPayment[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(RECURRING_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}
export function saveRecurring(recurring: RecurringPayment[]): void {
  safeSet(RECURRING_KEY, JSON.stringify(recurring))
}

// Legacy — kept for edge-case migration only
export function getAnnualPlan(): AnnualPlan {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(PLAN_KEY)
    return data ? JSON.parse(data) : {}
  } catch { return {} }
}

// Очередь несинхронизированных изменений. Операция/перевод попадает сюда в момент
// добавления и уходит, только когда облако подтвердило сохранение. При загрузке
// после входа эти записи не затираются данными из облака (раньше облако перезаписывало
// локальные данные целиком, и расход, не дошедший до сервера, пропадал после обновления).
const SYNC_QUEUE_KEY = 'cashflow_sync_queue'

// misc: 'plans' | 'cats' | 'recurring' | 'bal:<monthKey>' — всё, что хранится целиком, а не по записям
export type SyncQueue = { txUp: string[]; txDel: string[]; trUp: string[]; trDel: string[]; misc: string[] }

export function getSyncQueue(): SyncQueue {
  const empty: SyncQueue = { txUp: [], txDel: [], trUp: [], trDel: [], misc: [] }
  if (typeof window === 'undefined') return empty
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY)
    return data ? { ...empty, ...JSON.parse(data) } : empty
  } catch { return empty }
}

function saveSyncQueue(q: SyncQueue): void {
  try { safeSet(SYNC_QUEUE_KEY, JSON.stringify(q)) } catch {}
}

const OPPOSITE: Partial<Record<keyof SyncQueue, keyof SyncQueue>> = { txUp: 'txDel', txDel: 'txUp', trUp: 'trDel', trDel: 'trUp' }

export function queueAdd(kind: keyof SyncQueue, id: string): void {
  const q = getSyncQueue()
  const opp = OPPOSITE[kind]
  if (opp) q[opp] = q[opp].filter(x => x !== id)
  if (!q[kind].includes(id)) q[kind].push(id)
  saveSyncQueue(q)
}

export function queueRemove(kind: keyof SyncQueue, id: string): void {
  const q = getSyncQueue()
  q[kind] = q[kind].filter(x => x !== id)
  saveSyncQueue(q)
}

// Облако + ещё не дошедшие до него локальные правки, минус ещё не дошедшие удаления
export function mergeWithQueue<T extends { id: string }>(cloud: T[], local: T[], up: string[], del: string[]): T[] {
  const map = new Map(cloud.map(x => [x.id, x] as [string, T]))
  for (const x of local) if (up.includes(x.id)) map.set(x.id, x)
  for (const id of del) map.delete(id)
  return Array.from(map.values())
}
