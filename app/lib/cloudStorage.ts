import { supabase } from './supabase'
import { AnnualPlan, Transaction, Category, Account, Transfer, RecurringPayment } from './types'
import { MonthlyPlans } from './storage'

// Раньше ошибки сохранения в облако игнорировались — расход "добавлялся", а после
// обновления страницы пропадал. Теперь ошибка логируется и показывается пользователю.
function reportError(what: string, error: { message: string } | null): boolean {
  if (!error) return true
  console.error(`[cloud] ${what}:`, error.message)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cloud-sync-error', { detail: `${what}: ${error.message}` }))
  }
  return false
}

export async function cloudLoadPlan(userId: string): Promise<MonthlyPlans | null> {
  const { data, error } = await supabase
    .from('cashflow_plans')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  const raw = data.plan as any
  if (!raw) return null
  // Old flat format: { salary: 350000, ... } → one month
  if (typeof Object.values(raw)[0] === 'number') {
    const now = new Date()
    const key = `${now.getFullYear()}-${now.getMonth()}`
    return { [key]: { amounts: raw as AnnualPlan, notes: {} } }
  }
  // Intermediate format: { "2026-4": { salary: 350000 } }
  const firstMonth = Object.values(raw)[0] as any
  if (firstMonth && typeof firstMonth === 'object' && !('amounts' in firstMonth)) {
    const migrated: MonthlyPlans = {}
    for (const [k, v] of Object.entries(raw)) {
      migrated[k] = { amounts: v as AnnualPlan, notes: {} }
    }
    return migrated
  }
  return raw as MonthlyPlans
}

export async function cloudSavePlan(userId: string, plans: MonthlyPlans): Promise<boolean> {
  const { error } = await supabase
    .from('cashflow_plans')
    .upsert({ user_id: userId, plan: plans, updated_at: new Date().toISOString() })
  return reportError('план', error)
}

// Supabase отдаёт максимум 1000 строк за запрос — читаем страницами, иначе при длинной
// истории самые свежие операции (сортировка по возрастанию) обрезались бы.
const PAGE_SIZE = 1000

export async function cloudLoadTransactions(userId: string): Promise<Transaction[] | null> {
  const rows: any[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('cashflow_transactions')
      .select('id, category_id, amount, timestamp, note, account_id')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) return null
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows.map(row => ({
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    timestamp: row.timestamp,
    note: row.note ?? undefined,
    accountId: row.account_id ?? undefined,
  }))
}

export async function cloudSaveTransaction(userId: string, t: Transaction): Promise<boolean> {
  const { error } = await supabase.from('cashflow_transactions').upsert({
    id: t.id,
    user_id: userId,
    category_id: t.categoryId,
    amount: t.amount,
    timestamp: t.timestamp,
    note: t.note || null,
    account_id: t.accountId || null,
  })
  return reportError('операция', error)
}

export async function cloudDeleteTransaction(userId: string, txId: string): Promise<boolean> {
  const { error } = await supabase.from('cashflow_transactions').delete().match({ id: txId, user_id: userId })
  return reportError('удаление операции', error)
}

export async function cloudUpdateTransaction(userId: string, t: Transaction): Promise<boolean> {
  return cloudSaveTransaction(userId, t)
}

export async function cloudUploadAllTransactions(userId: string, txs: Transaction[]): Promise<boolean> {
  if (txs.length === 0) return true
  const { error } = await supabase.from('cashflow_transactions').upsert(
    txs.map(t => ({
      id: t.id,
      user_id: userId,
      category_id: t.categoryId,
      amount: t.amount,
      timestamp: t.timestamp,
      note: t.note || null,
      account_id: t.accountId || null,
    })),
  )
  return reportError('загрузка операций', error)
}

export async function cloudLoadBalances(userId: string): Promise<Record<string, number> | null> {
  const { data, error } = await supabase
    .from('cashflow_balances')
    .select('month_key, amount')
    .eq('user_id', userId)
  if (error) return null
  return Object.fromEntries((data || []).map(r => [r.month_key, r.amount]))
}

export async function cloudSaveBalance(userId: string, monthKey: string, amount: number): Promise<boolean> {
  const { error } = await supabase
    .from('cashflow_balances')
    .upsert({ user_id: userId, month_key: monthKey, amount })
  return reportError('начальный остаток', error)
}

export async function cloudDeleteBalance(userId: string, monthKey: string): Promise<boolean> {
  const { error } = await supabase.from('cashflow_balances').delete().match({ user_id: userId, month_key: monthKey })
  return reportError('сброс начального остатка', error)
}

export async function cloudLoadCategories(userId: string): Promise<Category[] | null> {
  const { data, error } = await supabase
    .from('cashflow_categories')
    .select('categories')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.categories as Category[]
}

export async function cloudSaveCategories(userId: string, categories: Category[]): Promise<boolean> {
  const { error } = await supabase.from('cashflow_categories').upsert({ user_id: userId, categories })
  return reportError('категории', error)
}

export async function cloudLoadAccounts(userId: string): Promise<Account[] | null> {
  const { data, error } = await supabase.from('cashflow_accounts').select('accounts').eq('user_id', userId).maybeSingle()
  if (error || !data) return null
  return data.accounts as Account[]
}
export async function cloudSaveAccounts(userId: string, accounts: Account[]): Promise<boolean> {
  const { error } = await supabase.from('cashflow_accounts').upsert({ user_id: userId, accounts })
  return reportError('счета', error)
}

export async function cloudLoadTransfers(userId: string): Promise<Transfer[] | null> {
  const rows: any[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase.from('cashflow_transfers')
      .select('id, from_account_id, to_account_id, amount, timestamp, note').eq('user_id', userId)
      .order('timestamp', { ascending: true }).order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) return null
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows.map(r => ({ id: r.id, fromAccountId: r.from_account_id, toAccountId: r.to_account_id, amount: r.amount, timestamp: r.timestamp, note: r.note ?? undefined }))
}
export async function cloudSaveTransfer(userId: string, t: Transfer): Promise<boolean> {
  const { error } = await supabase.from('cashflow_transfers').upsert({ id: t.id, user_id: userId, from_account_id: t.fromAccountId, to_account_id: t.toAccountId, amount: t.amount, timestamp: t.timestamp, note: t.note || null })
  return reportError('перевод', error)
}
export async function cloudDeleteTransfer(userId: string, id: string): Promise<boolean> {
  const { error } = await supabase.from('cashflow_transfers').delete().match({ id, user_id: userId })
  return reportError('удаление перевода', error)
}

export async function cloudLoadRecurring(userId: string): Promise<RecurringPayment[] | null> {
  const { data, error } = await supabase.from('cashflow_recurring').select('payments').eq('user_id', userId).maybeSingle()
  if (error || !data) return null
  return data.payments as RecurringPayment[]
}
export async function cloudSaveRecurring(userId: string, payments: RecurringPayment[]): Promise<boolean> {
  const { error } = await supabase.from('cashflow_recurring').upsert({ user_id: userId, payments })
  return reportError('повторяющиеся платежи', error)
}
