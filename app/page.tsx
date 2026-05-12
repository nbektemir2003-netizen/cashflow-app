'use client'

import { useState, useEffect, useCallback } from 'react'
import { MONTHS_RU, fmt, DEFAULT_CATEGORIES } from './lib/data'
import { Transaction, AppNotification, Category, Account, Transfer, RecurringPayment } from './lib/types'
import {
  getTransactions, saveTransactions,
  getOpeningBalances, saveOpeningBalances,
  getStoredCategories, saveStoredCategories,
  getMonthlyPlans, saveMonthlyPlans,
  getAccounts, saveAccounts,
  getTransfers, saveTransfers,
  getRecurring, saveRecurring,
  DEFAULT_ACCOUNTS,
  MonthlyPlans, monthKey,
} from './lib/storage'
import {
  cloudLoadPlan, cloudSavePlan,
  cloudLoadTransactions, cloudSaveTransaction, cloudUploadAllTransactions,
  cloudDeleteTransaction, cloudUpdateTransaction,
  cloudLoadBalances, cloudSaveBalance,
  cloudLoadCategories, cloudSaveCategories,
  cloudLoadAccounts, cloudSaveAccounts,
  cloudLoadTransfers, cloudSaveTransfer,
  cloudLoadRecurring, cloudSaveRecurring,
} from './lib/cloudStorage'
import { supabase } from './lib/supabase'
import FactView from './components/MonthView'
import AnnualPlanView from './components/AnnualPlanView'
import ReportView from './components/ReportView'
import HistoryView from './components/HistoryView'
import NotificationToast from './components/NotificationToast'
import AuthModal from './components/AuthModal'

type Tab = 'fact' | 'plan' | 'report' | 'history'
type AppMode = 'checking' | 'auth' | 'app'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'fact', label: 'Месяц', icon: '📅' },
  { key: 'plan', label: 'План', icon: '📋' },
  { key: 'report', label: 'Отчёт', icon: '📊' },
  { key: 'history', label: 'История', icon: '📈' },
]

export default function Home() {
  const now = new Date()
  const [appMode, setAppMode] = useState<AppMode>('checking')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [activeTab, setActiveTab] = useState<Tab>('fact')

  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlans>({})
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>({})
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [recurring, setRecurring] = useState<RecurringPayment[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadForUser(session.user.id, session.user.email!)
      } else {
        setAppMode('auth')
      }
    }
    init()
  }, [])

  const loadForUser = async (uid: string, email: string) => {
    setSyncing(true)
    setUserId(uid)
    setUserEmail(email)

    const localPlans = getMonthlyPlans()
    const localTx = getTransactions()
    const localBalances = getOpeningBalances()
    const localCats = getStoredCategories()
    const localAccounts = getAccounts()
    const localTransfers = getTransfers()
    const localRecurring = getRecurring()

    const [cloudPlans, cloudTx, cloudBalances, cloudCats, cloudAccounts, cloudTransfers, cloudRecurring] = await Promise.all([
      cloudLoadPlan(uid),
      cloudLoadTransactions(uid),
      cloudLoadBalances(uid),
      cloudLoadCategories(uid),
      cloudLoadAccounts(uid),
      cloudLoadTransfers(uid),
      cloudLoadRecurring(uid),
    ])

    const finalPlans = cloudPlans ?? localPlans
    const finalTx = (cloudTx !== null && cloudTx.length > 0)
      ? cloudTx
      : localTx.length > 0
      ? (await cloudUploadAllTransactions(uid, localTx), localTx)
      : []
    const finalBalances = cloudBalances ?? localBalances
    const finalCats = cloudCats ?? localCats
    const finalAccounts = cloudAccounts ?? localAccounts
    const finalTransfers = cloudTransfers ?? localTransfers
    const finalRecurring = cloudRecurring ?? localRecurring

    if (!cloudPlans && Object.keys(localPlans).length > 0) await cloudSavePlan(uid, localPlans)
    if (!cloudCats) await cloudSaveCategories(uid, finalCats)
    if (!cloudAccounts) await cloudSaveAccounts(uid, finalAccounts)
    if (!cloudRecurring) await cloudSaveRecurring(uid, finalRecurring)

    setMonthlyPlans(finalPlans)
    setTransactions(finalTx)
    setOpeningBalances(finalBalances)
    setCategories(finalCats)
    setAccounts(finalAccounts)
    setTransfers(finalTransfers)
    setRecurring(finalRecurring)

    saveMonthlyPlans(finalPlans)
    saveTransactions(finalTx)
    saveOpeningBalances(finalBalances)
    saveStoredCategories(finalCats)
    saveAccounts(finalAccounts)
    saveTransfers(finalTransfers)
    saveRecurring(finalRecurring)

    setSyncing(false)
    setAppMode('app')
  }

  const handleAuthenticated = useCallback(async (uid: string, email: string) => {
    await loadForUser(uid, email)
  }, [])

  const handleSkip = useCallback(() => {
    setMonthlyPlans(getMonthlyPlans())
    setTransactions(getTransactions())
    setOpeningBalances(getOpeningBalances())
    setCategories(getStoredCategories())
    setAccounts(getAccounts())
    setTransfers(getTransfers())
    setRecurring(getRecurring())
    setAppMode('app')
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setUserEmail(null)
    setAppMode('auth')
  }

  const handlePlansChange = useCallback(async (plans: MonthlyPlans) => {
    setMonthlyPlans(plans)
    saveMonthlyPlans(plans)
    if (userId) cloudSavePlan(userId, plans)
  }, [userId])

  const handleCategoriesChange = useCallback(async (cats: Category[]) => {
    setCategories(cats)
    saveStoredCategories(cats)
    if (userId) cloudSaveCategories(userId, cats)
  }, [userId])

  const handleAddTransaction = useCallback(
    async (transaction: Transaction) => {
      const updated = [...transactions, transaction]
      setTransactions(updated)
      saveTransactions(updated)
      if (userId) cloudSaveTransaction(userId, transaction)

      const currentPlan = monthlyPlans[monthKey(currentYear, currentMonth)]?.amounts || {}
      const expenseCat = categories.filter(c => c.group !== 'income').find(c => c.id === transaction.categoryId)
      if (expenseCat && transaction.amount > 0) {
        const planned = currentPlan[transaction.categoryId] || 0
        if (planned > 0) {
          const actual = updated
            .filter(t => {
              const d = new Date(t.timestamp)
              return d.getFullYear() === currentYear && d.getMonth() === currentMonth && t.categoryId === transaction.categoryId
            })
            .reduce((sum, t) => sum + t.amount, 0)
          if (actual > planned) {
            setNotifications(prev => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                message: `Превышение на ${(actual - planned).toLocaleString('ru-RU')} ₸`,
                categoryName: expenseCat.name,
              },
            ])
          }
        }
      }
    },
    [transactions, monthlyPlans, currentYear, currentMonth, userId, categories],
  )

  const handleDeleteTransaction = useCallback(async (id: string) => {
    const updated = transactions.filter(t => t.id !== id)
    setTransactions(updated)
    saveTransactions(updated)
    if (userId) cloudDeleteTransaction(userId, id)
  }, [transactions, userId])

  const handleEditTransaction = useCallback(async (tx: Transaction) => {
    const updated = transactions.map(t => t.id === tx.id ? tx : t)
    setTransactions(updated)
    saveTransactions(updated)
    if (userId) cloudUpdateTransaction(userId, tx)
  }, [transactions, userId])

  const handleAddTransfer = useCallback(async (t: Transfer) => {
    const updated = [...transfers, t]
    setTransfers(updated)
    saveTransfers(updated)
    if (userId) cloudSaveTransfer(userId, t)
  }, [transfers, userId])

  const handleSaveRecurring = useCallback(async (r: RecurringPayment[]) => {
    setRecurring(r)
    saveRecurring(r)
    if (userId) cloudSaveRecurring(userId, r)
  }, [userId])

  const handleSetOpeningBalance = useCallback(
    async (amount: number) => {
      const key = monthKey(currentYear, currentMonth)
      const updated = { ...openingBalances, [key]: amount }
      setOpeningBalances(updated)
      saveOpeningBalances(updated)
      if (userId) cloudSaveBalance(userId, key, amount)
    },
    [openingBalances, currentYear, currentMonth, userId],
  )

  const getOpeningBalance = (year: number, month: number): number => {
    const key = monthKey(year, month)
    if (openingBalances[key] !== undefined) return openingBalances[key]
    if (month === 0 && year === now.getFullYear()) return 0
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const prevOpening = getOpeningBalance(prevYear, prevMonth)
    const prevTx = transactions.filter(t => {
      const d = new Date(t.timestamp)
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth
    })
    const incomeIds = new Set(categories.filter(c => c.group === 'income').map(c => c.id))
    const expenseIds = new Set(categories.filter(c => c.group !== 'income').map(c => c.id))
    const prevIncome = prevTx.filter(t => incomeIds.has(t.categoryId)).reduce((s, t) => s + t.amount, 0)
    const prevExpense = prevTx.filter(t => expenseIds.has(t.categoryId)).reduce((s, t) => s + t.amount, 0)
    return prevOpening + prevIncome - prevExpense
  }

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  if (appMode === 'checking') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <div className="text-4xl animate-pulse">💸</div>
        <div className="text-gray-500 text-sm">Загрузка...</div>
      </div>
    )
  }

  if (appMode === 'auth') {
    return <AuthModal onAuthenticated={handleAuthenticated} onSkip={handleSkip} />
  }

  const currentOpeningBalance = getOpeningBalance(currentYear, currentMonth)
  const currentPlan = monthlyPlans[monthKey(currentYear, currentMonth)]?.amounts || {}

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💸</span>
            <span className="text-white font-bold text-lg tracking-tight">КЭШ ФЛОУ</span>
            {syncing && <span className="text-xs text-blue-400 animate-pulse">↑ синхр.</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-gray-400 text-xs">{MONTHS_RU[currentMonth]} {currentYear}</div>
              <div className={`text-xs font-medium ${currentOpeningBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmt(currentOpeningBalance)}
              </div>
            </div>
            {userId ? (
              <button
                onClick={handleSignOut}
                title={`Выйти (${userEmail})`}
                className="w-8 h-8 rounded-full bg-green-700/30 hover:bg-red-800/40 text-green-400 hover:text-red-400 flex items-center justify-center text-sm transition-colors"
              >
                ☁
              </button>
            ) : (
              <button
                onClick={() => setAppMode('auth')}
                title="Войти для синхронизации"
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-colors"
              >
                ↗
              </button>
            )}
          </div>
        </div>

        {!userId && (
          <div
            onClick={() => setAppMode('auth')}
            className="max-w-lg mx-auto px-4 py-1.5 bg-blue-900/20 border-t border-blue-800/30 text-center cursor-pointer hover:bg-blue-900/30 transition-colors"
          >
            <span className="text-blue-400 text-xs">☁ Войдите для синхронизации между устройствами →</span>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-lg mx-auto flex border-t border-gray-800">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-all flex flex-col items-center gap-0.5 ${
                activeTab === tab.key
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-8">
        {activeTab === 'fact' && (
          <FactView
            year={currentYear}
            month={currentMonth}
            annualPlan={currentPlan}
            transactions={transactions}
            openingBalance={currentOpeningBalance}
            categories={categories}
            accounts={accounts}
            transfers={transfers}
            recurring={recurring}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
            onSetOpeningBalance={handleSetOpeningBalance}
            onAddTransfer={handleAddTransfer}
            onSaveRecurring={handleSaveRecurring}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        )}
        {activeTab === 'plan' && (
          <AnnualPlanView
            monthlyPlans={monthlyPlans}
            transactions={transactions}
            currentYear={currentYear}
            currentMonth={currentMonth}
            categories={categories}
            onChange={handlePlansChange}
            onCategoriesChange={handleCategoriesChange}
          />
        )}
        {activeTab === 'report' && (
          <ReportView
            monthlyPlans={monthlyPlans}
            transactions={transactions}
            currentYear={currentYear}
            currentMonth={currentMonth}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView monthlyPlans={monthlyPlans} transactions={transactions} />
        )}
      </main>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {notifications.map(n => (
          <NotificationToast
            key={n.id}
            notification={n}
            onDismiss={id => setNotifications(prev => prev.filter(x => x.id !== id))}
          />
        ))}
      </div>
    </div>
  )
}
