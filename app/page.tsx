'use client'

import { useState, useEffect, useCallback } from 'react'
import { INCOME_CATEGORIES, MANDATORY_CATEGORIES, CURRENT_CATEGORIES, MONTHS_RU, fmt } from './lib/data'
import { AnnualPlan, Transaction, AppNotification } from './lib/types'
import {
  getAnnualPlan, saveAnnualPlan,
  getTransactions, saveTransactions,
  getOpeningBalances, saveOpeningBalances,
  monthKey,
} from './lib/storage'
import FactView from './components/MonthView'
import AnnualPlanView from './components/AnnualPlanView'
import ReportView from './components/ReportView'
import HistoryView from './components/HistoryView'
import NotificationToast from './components/NotificationToast'

type Tab = 'fact' | 'plan' | 'report' | 'history'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'fact', label: 'Факт', icon: '💸' },
  { key: 'plan', label: 'План', icon: '📋' },
  { key: 'report', label: 'Отчёт', icon: '📊' },
  { key: 'history', label: 'История', icon: '🗂' },
]

export default function Home() {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [activeTab, setActiveTab] = useState<Tab>('fact')
  const [annualPlan, setAnnualPlan] = useState<AnnualPlan>({})
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>({})
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setAnnualPlan(getAnnualPlan())
    setTransactions(getTransactions())
    setOpeningBalances(getOpeningBalances())
    setIsLoaded(true)
  }, [])

  const handlePlanChange = useCallback((plan: AnnualPlan) => {
    setAnnualPlan(plan)
    saveAnnualPlan(plan)
  }, [])

  const handleAddTransaction = useCallback(
    (transaction: Transaction) => {
      const updated = [...transactions, transaction]
      setTransactions(updated)
      saveTransactions(updated)

      // Check budget exceeded for expense categories
      const expenseCat = [...MANDATORY_CATEGORIES, ...CURRENT_CATEGORIES].find(
        c => c.id === transaction.categoryId,
      )
      if (expenseCat && transaction.amount > 0) {
        const planned = annualPlan[transaction.categoryId] || 0
        if (planned > 0) {
          const actual = updated
            .filter(t => {
              const d = new Date(t.timestamp)
              return (
                d.getFullYear() === currentYear &&
                d.getMonth() === currentMonth &&
                t.categoryId === transaction.categoryId
              )
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
    [transactions, annualPlan, currentYear, currentMonth],
  )

  const handleSetOpeningBalance = useCallback(
    (amount: number) => {
      const key = monthKey(currentYear, currentMonth)
      const updated = { ...openingBalances, [key]: amount }
      setOpeningBalances(updated)
      saveOpeningBalances(updated)
    },
    [openingBalances, currentYear, currentMonth],
  )

  const getOpeningBalance = (year: number, month: number): number => {
    const key = monthKey(year, month)
    if (openingBalances[key] !== undefined) return openingBalances[key]
    // Auto-calculate from previous month
    if (month === 0 && year === now.getFullYear()) return 0
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const prevOpening = getOpeningBalance(prevYear, prevMonth)
    const prevTx = transactions.filter(t => {
      const d = new Date(t.timestamp)
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth
    })
    const prevIncome = prevTx
      .filter(t => INCOME_CATEGORIES.find(c => c.id === t.categoryId))
      .reduce((s, t) => s + t.amount, 0)
    const prevExpense = prevTx
      .filter(t => [...MANDATORY_CATEGORIES, ...CURRENT_CATEGORIES].find(c => c.id === t.categoryId))
      .reduce((s, t) => s + t.amount, 0)
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-green-400 text-3xl animate-pulse">💸</div>
      </div>
    )
  }

  const currentOpeningBalance = getOpeningBalance(currentYear, currentMonth)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💸</span>
            <span className="text-white font-bold text-lg tracking-tight">КЭШ ФЛОУ</span>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs">{MONTHS_RU[currentMonth]} {currentYear}</div>
            <div className={`text-xs font-medium ${currentOpeningBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmt(currentOpeningBalance)}
            </div>
          </div>
        </div>

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
            annualPlan={annualPlan}
            transactions={transactions}
            openingBalance={currentOpeningBalance}
            onAddTransaction={handleAddTransaction}
            onSetOpeningBalance={handleSetOpeningBalance}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        )}
        {activeTab === 'plan' && (
          <AnnualPlanView
            annualPlan={annualPlan}
            transactions={transactions}
            currentYear={currentYear}
            currentMonth={currentMonth}
            onChange={handlePlanChange}
          />
        )}
        {activeTab === 'report' && (
          <ReportView
            annualPlan={annualPlan}
            transactions={transactions}
            currentYear={currentYear}
            currentMonth={currentMonth}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView annualPlan={annualPlan} transactions={transactions} />
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
