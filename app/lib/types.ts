export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
}

export type AnnualPlan = Record<string, number>

export interface Transaction {
  id: string
  categoryId: string
  amount: number
  timestamp: number
}

export interface AppNotification {
  id: string
  message: string
  categoryName: string
}
