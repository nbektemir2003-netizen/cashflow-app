import { AnnualPlan, Transaction, Category } from './types'
import { DEFAULT_CATEGORIES } from './data'

const PLAN_KEY = 'cashflow_annual_plan'         // legacy
const MONTHLY_PLANS_KEY = 'cashflow_monthly_plans'
const TRANSACTIONS_KEY = 'cashflow_transactions'
const BALANCES_KEY = 'cashflow_opening_balances'
const CATEGORIES_KEY = 'cashflow_categories'

export type MonthlyPlans = Record<string, AnnualPlan>

export function getMonthlyPlans(): MonthlyPlans {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(MONTHLY_PLANS_KEY)
    if (data) return JSON.parse(data)
    // Migrate from old flat plan → apply to current month
    const legacy = localStorage.getItem(PLAN_KEY)
    if (legacy) {
      const old: AnnualPlan = JSON.parse(legacy)
      const now = new Date()
      const key = monthKey(now.getFullYear(), now.getMonth())
      return { [key]: old }
    }
    return {}
  } catch {
    return {}
  }
}

export function saveMonthlyPlans(plans: MonthlyPlans): void {
  localStorage.setItem(MONTHLY_PLANS_KEY, JSON.stringify(plans))
}

// Legacy — kept for migration only
export function getAnnualPlan(): AnnualPlan {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(PLAN_KEY)
    return data ? JSON.parse(data) : {}
  } catch { return {} }
}

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
}

export function getOpeningBalances(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(BALANCES_KEY)
    return data ? JSON.parse(data) : {}
  } catch { return {} }
}

export function saveOpeningBalances(balances: Record<string, number>): void {
  localStorage.setItem(BALANCES_KEY, JSON.stringify(balances))
}

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

export function getStoredCategories(): Category[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES
  try {
    const data = localStorage.getItem(CATEGORIES_KEY)
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES
  } catch { return DEFAULT_CATEGORIES }
}

export function saveStoredCategories(categories: Category[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}
