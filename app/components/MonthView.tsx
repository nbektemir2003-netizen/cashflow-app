'use client'

import { useState } from 'react'
import { CATEGORIES, MONTHS_RU, fmt } from '../lib/data'
import { AnnualPlan, Transaction, Category } from '../lib/types'
import AmountModal from './AmountModal'

interface Props {
  year: number
  month: number
  annualPlan: AnnualPlan
  transactions: Transaction[]
  onAddTransaction: (t: Transaction) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

interface ModalState {
  categoryId: string
  categoryName: string
  categoryIcon: string
  type: 'add' | 'subtract'
}

export default function MonthView({
  year,
  month,
  annualPlan,
  transactions,
  onAddTransaction,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const [modal, setModal] = useState<ModalState | null>(null)

  const monthTx = transactions.filter(t => {
    const d = new Date(t.timestamp)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const getActual = (categoryId: string) =>
    monthTx.filter(t => t.categoryId === categoryId).reduce((sum, t) => sum + t.amount, 0)

  const incomeCategories = CATEGORIES.filter(c => c.type === 'income')
  const expenseCategories = CATEGORIES.filter(c => c.type === 'expense')

  const totalIncomePlanned = incomeCategories.reduce((s, c) => s + (annualPlan[c.id] || 0), 0)
  const totalIncomeActual = incomeCategories.reduce((s, c) => s + getActual(c.id), 0)
  const totalExpensePlanned = expenseCategories.reduce((s, c) => s + (annualPlan[c.id] || 0), 0)
  const totalExpenseActual = expenseCategories.reduce((s, c) => s + getActual(c.id), 0)
  const balance = totalIncomeActual - totalExpenseActual

  const openModal = (cat: Category, type: 'add' | 'subtract') => {
    setModal({ categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon, type })
  }

  const handleModalConfirm = (amount: number) => {
    if (!modal) return
    onAddTransaction({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      categoryId: modal.categoryId,
      amount: modal.type === 'subtract' ? -amount : amount,
      timestamp: Date.now(),
    })
    setModal(null)
  }

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevMonth}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white text-lg transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {MONTHS_RU[month]}
            {isCurrentMonth && (
              <span className="ml-2 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">сейчас</span>
            )}
          </div>
          <div className="text-gray-500 text-sm">{year}</div>
        </div>
        <button
          onClick={onNextMonth}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white text-lg transition-colors"
        >
          →
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-800/80 rounded-xl p-3 text-center border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Доходы</div>
          <div className="text-green-400 font-bold text-sm">{fmt(totalIncomeActual)}</div>
          <div className="text-gray-600 text-xs mt-0.5">план {fmt(totalIncomePlanned)}</div>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-3 text-center border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Расходы</div>
          <div
            className={`font-bold text-sm ${
              totalExpensePlanned > 0 && totalExpenseActual > totalExpensePlanned
                ? 'text-red-400'
                : 'text-orange-400'
            }`}
          >
            {fmt(totalExpenseActual)}
          </div>
          <div className="text-gray-600 text-xs mt-0.5">план {fmt(totalExpensePlanned)}</div>
        </div>
        <div className="bg-gray-800/80 rounded-xl p-3 text-center border border-gray-700/50">
          <div className="text-xs text-gray-400 mb-1">Баланс</div>
          <div className={`font-bold text-sm ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmt(balance)}
          </div>
          <div className="text-gray-600 text-xs mt-0.5">факт</div>
        </div>
      </div>

      {/* Income */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-400 text-sm font-bold">↑ ДОХОДЫ</span>
          <div className="flex-1 h-px bg-green-900/40" />
        </div>
        <div className="space-y-2">
          {incomeCategories.map(cat => {
            const planned = annualPlan[cat.id] || 0
            const actual = getActual(cat.id)
            const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : actual > 0 ? 100 : 0
            return (
              <CategoryRow
                key={cat.id}
                category={cat}
                planned={planned}
                actual={actual}
                pct={pct}
                isOver={false}
                type="income"
                onAdd={() => openModal(cat, 'add')}
                onSubtract={() => openModal(cat, 'subtract')}
              />
            )
          })}
        </div>
      </div>

      {/* Expenses */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-400 text-sm font-bold">↓ РАСХОДЫ</span>
          <div className="flex-1 h-px bg-red-900/40" />
        </div>
        <div className="space-y-2">
          {expenseCategories.map(cat => {
            const planned = annualPlan[cat.id] || 0
            const actual = getActual(cat.id)
            const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : actual > 0 ? 100 : 0
            const isOver = planned > 0 && actual > planned
            return (
              <CategoryRow
                key={cat.id}
                category={cat}
                planned={planned}
                actual={actual}
                pct={pct}
                isOver={isOver}
                type="expense"
                onAdd={() => openModal(cat, 'add')}
                onSubtract={() => openModal(cat, 'subtract')}
              />
            )
          })}
        </div>
      </div>

      {modal && (
        <AmountModal
          categoryName={modal.categoryName}
          categoryIcon={modal.categoryIcon}
          type={modal.type}
          onConfirm={handleModalConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

interface CategoryRowProps {
  category: Category
  planned: number
  actual: number
  pct: number
  isOver: boolean
  type: 'income' | 'expense'
  onAdd: () => void
  onSubtract: () => void
}

function CategoryRow({ category, planned, actual, pct, isOver, type, onAdd, onSubtract }: CategoryRowProps) {
  const barColor =
    type === 'income'
      ? 'bg-green-500'
      : isOver
      ? 'bg-red-500'
      : pct >= 80
      ? 'bg-orange-500'
      : 'bg-blue-500'

  return (
    <div
      className={`bg-gray-800 rounded-xl p-3 transition-all ${
        isOver ? 'ring-1 ring-red-500/40 bg-red-950/20' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl flex-shrink-0">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white text-sm font-medium truncate">{category.name}</span>
            {isOver && (
              <span className="text-red-400 text-xs flex-shrink-0 bg-red-900/30 px-1.5 py-0.5 rounded">
                ⚠ превышен
              </span>
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>
              факт:{' '}
              <span
                className={
                  type === 'income' ? 'text-green-400' : isOver ? 'text-red-400' : 'text-gray-300'
                }
              >
                {fmt(actual)}
              </span>
            </span>
            <span>{planned > 0 ? `план: ${fmt(planned)}` : 'план не задан'}</span>
          </div>
          {(planned > 0 || actual > 0) && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={onSubtract}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-red-800/70 text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors"
            title="Вычесть"
          >
            −
          </button>
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-green-800/70 text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors"
            title="Добавить"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
