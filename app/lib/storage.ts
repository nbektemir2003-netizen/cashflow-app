import { AnnualPlan, Transaction } from './types'

const PLAN_KEY = 'cashflow_annual_plan'
const TRANSACTIONS_KEY = 'cashflow_transactions'
const BALANCES_KEY = 'cashflow_opening_balances'

export function getAnnualPlan(): AnnualPlan {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(PLAN_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function saveAnnualPlan(plan: AnnualPlan): void {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
}

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
}

// Opening balances per month key "YYYY-M"
export function getOpeningBalances(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(BALANCES_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function saveOpeningBalances(balances: Record<string, number>): void {
  localStorage.setItem(BALANCES_KEY, JSON.stringify(balances))
}

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}
