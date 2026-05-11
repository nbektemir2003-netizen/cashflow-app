export type CategoryGroup = 'income' | 'mandatory' | 'current'

export interface Category {
  id: string
  name: string
  group: CategoryGroup
  icon: string
}

export type AnnualPlan = Record<string, number>

export interface Transaction {
  id: string
  categoryId: string
  amount: number
  timestamp: number
  note?: string
}

export interface AppNotification {
  id: string
  message: string
  categoryName: string
}
