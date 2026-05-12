import { supabase } from './supabase'
import { AnnualPlan, Transaction, Category } from './types'
import { MonthlyPlans } from './storage'

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

export async function cloudSavePlan(userId: string, plans: MonthlyPlans): Promise<void> {
  await supabase
    .from('cashflow_plans')
    .upsert({ user_id: userId, plan: plans, updated_at: new Date().toISOString() })
}

export async function cloudLoadTransactions(userId: string): Promise<Transaction[] | null> {
  const { data, error } = await supabase
    .from('cashflow_transactions')
    .select('id, category_id, amount, timestamp, note')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true })
  if (error) return null
  return (data || []).map(row => ({
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    timestamp: row.timestamp,
    note: row.note ?? undefined,
  }))
}

export async function cloudSaveTransaction(userId: string, t: Transaction): Promise<void> {
  await supabase.from('cashflow_transactions').upsert({
    id: t.id,
    user_id: userId,
    category_id: t.categoryId,
    amount: t.amount,
    timestamp: t.timestamp,
    note: t.note || null,
  })
}

export async function cloudUploadAllTransactions(userId: string, txs: Transaction[]): Promise<void> {
  if (txs.length === 0) return
  await supabase.from('cashflow_transactions').upsert(
    txs.map(t => ({
      id: t.id,
      user_id: userId,
      category_id: t.categoryId,
      amount: t.amount,
      timestamp: t.timestamp,
      note: t.note || null,
    })),
  )
}

export async function cloudLoadBalances(userId: string): Promise<Record<string, number> | null> {
  const { data, error } = await supabase
    .from('cashflow_balances')
    .select('month_key, amount')
    .eq('user_id', userId)
  if (error) return null
  return Object.fromEntries((data || []).map(r => [r.month_key, r.amount]))
}

export async function cloudSaveBalance(userId: string, monthKey: string, amount: number): Promise<void> {
  await supabase
    .from('cashflow_balances')
    .upsert({ user_id: userId, month_key: monthKey, amount })
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

export async function cloudSaveCategories(userId: string, categories: Category[]): Promise<void> {
  await supabase
    .from('cashflow_categories')
    .upsert({ user_id: userId, categories })
}
