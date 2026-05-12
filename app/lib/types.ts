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
  accountId?: string
}

export interface Account {
  id: string
  name: string
  icon: string
  initialBalance: number
}

export interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  timestamp: number
  note?: string
}

export interface RecurringPayment {
  id: string
  categoryId: string
  accountId: string
  amount: number
  note?: string
  dayOfMonth: number
  active: boolean
}

export interface AppNotification {
  id: string
  message: string
  categoryName: string
}
