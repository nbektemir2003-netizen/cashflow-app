import { Transaction, Transfer, Category, Account } from './types'
import { DEPOSIT_TOPUP_CATEGORY_ID } from './data'
import { DEPOSIT_ACCOUNT_ID } from './storage'

// Остаток счёта на конец месяца: остаток на начало + доходы − расходы ± переводы.
// Общий расчёт для закреплённой полосы остатков в шапке и для вкладки "Месяц".
export function computeAccountBalance(p: {
  accountId: string
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  transfers: Transfer[]
  year: number
  month: number
  startBalance: number
}): number {
  const { accountId, accounts, categories, transactions, transfers, year, month, startBalance } = p
  const inMonth = (ts: number) => {
    const d = new Date(ts)
    return d.getFullYear() === year && d.getMonth() === month
  }
  const monthTx = transactions.filter(t => inMonth(t.timestamp))
  const isDefault = accounts[0]?.id === accountId
  const incomeIds = new Set(categories.filter(c => c.group === 'income').map(c => c.id))
  const acctTx = monthTx.filter(t => t.accountId === accountId || (isDefault && !t.accountId))
  const income = acctTx.filter(t => incomeIds.has(t.categoryId)).reduce((s, t) => s + t.amount, 0)
  const expense = acctTx.filter(t => !incomeIds.has(t.categoryId)).reduce((s, t) => s + t.amount, 0)
  const monthTransfers = transfers.filter(t => inMonth(t.timestamp))
  const tIn = monthTransfers.filter(t => t.toAccountId === accountId).reduce((s, t) => s + t.amount, 0)
  const tOut = monthTransfers.filter(t => t.fromAccountId === accountId).reduce((s, t) => s + t.amount, 0)
  // Категория "Депозит" списывается как обычный расход со своего счёта (карта/наличные),
  // но при этом сумма также зачисляется на счёт "Депозит" — как будто это перевод.
  const depositTopUps = accountId === DEPOSIT_ACCOUNT_ID
    ? monthTx
        .filter(t => t.categoryId === DEPOSIT_TOPUP_CATEGORY_ID && t.accountId !== DEPOSIT_ACCOUNT_ID)
        .reduce((s, t) => s + Math.abs(t.amount), 0)
    : 0
  return startBalance + income - expense + tIn - tOut + depositTopUps
}
