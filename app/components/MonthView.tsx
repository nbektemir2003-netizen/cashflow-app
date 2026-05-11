'use client'

import { useState } from 'react'
import { MONTHS_RU, fmt } from '../lib/data'
import { AnnualPlan, Transaction, Category } from '../lib/types'
import AmountModal from './AmountModal'

interface Props {
  year: number
  month: number
  annualPlan: AnnualPlan
  transactions: Transaction[]
  openingBalance: number
  categories: Category[]
  onAddTransaction: (t: Transaction) => void
  onSetOpeningBalance: (amount: number) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

interface ModalState {
  categoryId: string
  categoryName: string
  categoryIcon: string
  type: 'add' | 'subtract'
}

export default function FactView({
  year,
  month,
  annualPlan,
  transactions,
  openingBalance,
  categories,
  onAddTransaction,
  onSetOpeningBalance,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceInput, setBalanceInput] = useState('')

  const incomeCategories = categories.filter(c => c.group === 'income')
  const mandatoryCategories = categories.filter(c => c.group === 'mandatory')
  const currentCategories = categories.filter(c => c.group === 'current')

  const monthTx = transactions.filter(t => {
    const d = new Date(t.timestamp)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const getActual = (categoryId: string) =>
    monthTx.filter(t => t.categoryId === categoryId).reduce((sum, t) => sum + t.amount, 0)

  const totalIncomeActual = incomeCategories.reduce((s, c) => s + getActual(c.id), 0)
  const totalMandatoryActual = mandatoryCategories.reduce((s, c) => s + getActual(c.id), 0)
  const totalCurrentActual = currentCategories.reduce((s, c) => s + getActual(c.id), 0)
  const totalExpenseActual = totalMandatoryActual + totalCurrentActual

  const totalIncomePlanned = incomeCategories.reduce((s, c) => s + (annualPlan[c.id] || 0), 0)
  const totalMandatoryPlanned = mandatoryCategories.reduce((s, c) => s + (annualPlan[c.id] || 0), 0)
  const totalCurrentPlanned = currentCategories.reduce((s, c) => s + (annualPlan[c.id] || 0), 0)
  const totalExpensePlanned = totalMandatoryPlanned + totalCurrentPlanned

  const closingBalance = openingBalance + totalIncomeActual - totalExpenseActual

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const openModal = (cat: Category, type: 'add' | 'subtract') =>
    setModal({ categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon, type })

  const handleModalConfirm = (amount: number, note?: string) => {
    if (!modal) return
    onAddTransaction({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      categoryId: modal.categoryId,
      amount: modal.type === 'subtract' ? -amount : amount,
      timestamp: Date.now(),
      note,
    })
    setModal(null)
  }

  const saveBalance = () => {
    const n = parseFloat(balanceInput.replace(/\s/g, '').replace(',', '.'))
    if (!isNaN(n)) onSetOpeningBalance(n)
    setEditingBalance(false)
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onPrevMonth}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white text-lg transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-xl font-bold text-white flex items-center justify-center gap-2">
            {MONTHS_RU[month]}
            {isCurrentMonth && (
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-normal">
                сейчас
              </span>
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

      {/* Balance row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-1">Начальный остаток</div>
          {editingBalance ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={balanceInput}
                onChange={e => setBalanceInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveBalance()}
                className="flex-1 bg-gray-700 text-white text-sm p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-0"
                autoFocus
              />
              <button onClick={saveBalance} className="text-green-400 text-sm font-medium hover:text-green-300">✓</button>
            </div>
          ) : (
            <button
              onClick={() => { setBalanceInput(String(openingBalance)); setEditingBalance(true) }}
              className="text-white font-bold text-sm hover:text-blue-300 transition-colors text-left w-full"
            >
              {fmt(openingBalance)}
              <span className="text-gray-600 text-xs ml-1">✏️</span>
            </button>
          )}
          <div className="text-gray-600 text-xs mt-0.5">перенос с пред. месяца</div>
        </div>
        <div className={`rounded-xl p-3 border ${closingBalance >= 0 ? 'bg-green-900/20 border-green-800/40' : 'bg-red-900/20 border-red-800/40'}`}>
          <div className="text-gray-400 text-xs mb-1">Конечный остаток</div>
          <div className={`font-bold text-sm ${closingBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmt(closingBalance)}
          </div>
          <div className="text-gray-600 text-xs mt-0.5">начало + доходы − расходы</div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <SummaryCard label="Доходы" actual={totalIncomeActual} planned={totalIncomePlanned} color="green" />
        <SummaryCard label="Обязат." actual={totalMandatoryActual} planned={totalMandatoryPlanned} color="orange" />
        <SummaryCard label="Текущие" actual={totalCurrentActual} planned={totalCurrentPlanned} color="red" />
      </div>

      {/* Income */}
      <CategorySection
        title="💰 ДОХОДЫ"
        titleColor="text-green-400"
        lineColor="bg-green-900/40"
        categories={incomeCategories}
        annualPlan={annualPlan}
        getActual={getActual}
        type="income"
        onAdd={cat => openModal(cat, 'add')}
        onSubtract={cat => openModal(cat, 'subtract')}
      />

      {/* Mandatory expenses */}
      <CategorySection
        title="🔒 ОБЯЗАТЕЛЬНЫЕ РАСХОДЫ"
        titleColor="text-orange-400"
        lineColor="bg-orange-900/40"
        categories={mandatoryCategories}
        annualPlan={annualPlan}
        getActual={getActual}
        type="expense"
        onAdd={cat => openModal(cat, 'add')}
        onSubtract={cat => openModal(cat, 'subtract')}
      />

      {/* Current expenses */}
      <CategorySection
        title="🛒 ТЕКУЩИЕ РАСХОДЫ"
        titleColor="text-red-400"
        lineColor="bg-red-900/40"
        categories={currentCategories}
        annualPlan={annualPlan}
        getActual={getActual}
        type="expense"
        onAdd={cat => openModal(cat, 'add')}
        onSubtract={cat => openModal(cat, 'subtract')}
      />

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

function SummaryCard({ label, actual, planned, color }: { label: string; actual: number; planned: number; color: 'green' | 'orange' | 'red' }) {
  const colors = { green: 'text-green-400', orange: 'text-orange-400', red: 'text-red-400' }
  const isOver = color !== 'green' && planned > 0 && actual > planned
  return (
    <div className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700/50">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className={`font-bold text-xs ${isOver ? 'text-red-400' : colors[color]}`}>{fmt(actual)}</div>
      <div className="text-gray-600 text-xs mt-0.5 truncate">/{fmt(planned)}</div>
    </div>
  )
}

function CategorySection({
  title, titleColor, lineColor, categories, annualPlan, getActual, type, onAdd, onSubtract,
}: {
  title: string; titleColor: string; lineColor: string
  categories: Category[]; annualPlan: AnnualPlan; getActual: (id: string) => number
  type: 'income' | 'expense'; onAdd: (cat: Category) => void; onSubtract: (cat: Category) => void
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`${titleColor} text-xs font-bold`}>{title}</span>
        <div className={`flex-1 h-px ${lineColor}`} />
      </div>
      <div className="space-y-2">
        {categories.map(cat => {
          const planned = annualPlan[cat.id] || 0
          const actual = getActual(cat.id)
          const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : actual > 0 ? 100 : 0
          const isOver = type === 'expense' && planned > 0 && actual > planned
          return (
            <CategoryRow
              key={cat.id}
              category={cat}
              planned={planned}
              actual={actual}
              pct={pct}
              isOver={isOver}
              type={type}
              onAdd={() => onAdd(cat)}
              onSubtract={() => onSubtract(cat)}
            />
          )
        })}
      </div>
    </div>
  )
}

function CategoryRow({
  category, planned, actual, pct, isOver, type, onAdd, onSubtract,
}: {
  category: Category; planned: number; actual: number; pct: number
  isOver: boolean; type: 'income' | 'expense'; onAdd: () => void; onSubtract: () => void
}) {
  const barColor = type === 'income' ? 'bg-green-500' : isOver ? 'bg-red-500' : pct >= 80 ? 'bg-orange-500' : 'bg-blue-500'
  return (
    <div className={`bg-gray-800 rounded-xl p-3 ${isOver ? 'ring-1 ring-red-500/30' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl flex-shrink-0">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-white text-sm font-medium truncate">{category.name}</span>
            {isOver && <span className="text-red-400 text-xs flex-shrink-0 bg-red-900/30 px-1.5 py-0.5 rounded">⚠ превышен</span>}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>факт: <span className={type === 'income' ? 'text-green-400' : isOver ? 'text-red-400' : 'text-gray-300'}>{fmt(actual)}</span></span>
            <span>{planned > 0 ? `план: ${fmt(planned)}` : 'план не задан'}</span>
          </div>
          {(planned > 0 || actual !== 0) && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div className={`h-1 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={onSubtract} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-red-800/70 text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors">−</button>
          <button onClick={onAdd} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-green-800/70 text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors">+</button>
        </div>
      </div>
    </div>
  )
}
