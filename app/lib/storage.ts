import { AnnualPlan, Transaction } from './types'

const PLAN_KEY = 'cashflow_annual_plan'
const TRANSACTIONS_KEY = 'cashflow_transactions'

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
