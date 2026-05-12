'use client'

import { useState } from 'react'
import { MONTHS_RU, fmt } from '../lib/data'
import { AnnualPlan, Transaction, Category } from '../lib/types'
import AmountModal from './AmountModal'
import EditTransactionModal from './EditTransactionModal'

interface Props {
  year: number
  month: number
  annualPlan: AnnualPlan
  transactions: Transaction[]
  openingBalance: number
  categories: Category[]
  onAddTransaction: (t: Transaction) => void
  onDeleteTransaction: (id: string) => void
  onEditTransaction: (t: Transaction) => void
  onSetOpeningBalance: (amount: number) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

interface AddModalState {
  categoryId: string
  categoryName: string
  categoryIcon: string
  type: 'add' | 'subtract'
}

export default function FactView({
  year, month, annualPlan, transactions, openingBalance, categories,
  onAddTransaction, onDeleteTransaction, onEditTransaction,
  onSetOpeningBalance, onPrevMonth, onNextMonth,
}: Props) {
  const [addModal, setAddModal] = useState<AddModalState | null>(null)
  const [editModal, setEditModal] = useState<Transaction | null>(null)
  const [txList, setTxList] = useState<string | null>(null) // categoryId whose tx list is open
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

  const getCategoryTx = (categoryId: string) =>
    monthTx.filter(t => t.categoryId === categoryId).sort((a, b) => b.timestamp - a.timestamp)

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

  const openAddModal = (cat: Category, type: 'add' | 'subtract') =>
    setAddModal({ categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon, type })

  const handleAddConfirm = (amount: number, note?: string) => {
    if (!addModal) return
    onAddTransaction({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      categoryId: addModal.categoryId,
      amount: addModal.type === 'subtract' ? -amount : amount,
      timestamp: Date.now(),
      note,
    })
    setAddModal(null)
  }

  const saveBalance = () => {
    const n = parseFloat(balanceInput.replace(/\s/g, '').replace(',', '.'))
    if (!isNaN(n)) onSetOpeningBalance(n)
    setEditingBalance(false)
  }

  const txListCat = txList ? categories.find(c => c.id === txList) : null
  const txListItems = txList ? getCategoryTx(txList) : []

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={onPrevMonth} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white text-lg transition-colors">←</button>
        <div className="text-center">
          <div className="text-xl font-bold text-white flex items-center justify-center gap-2">
            {MONTHS_RU[month]}
            {isCurrentMonth && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-normal">сейчас</span>}
          </div>
          <div className="text-gray-500 text-sm">{year}</div>
        </div>
        <button onClick={onNextMonth} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white text-lg transition-colors">→</button>
      </div>

      {/* Balance row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700/50">
          <div className="text-gray-400 text-xs mb-1">Начальный остаток</div>
          {editingBalance ? (
            <div className="flex items-center gap-2">
              <input type="number" value={balanceInput} onChange={e => setBalanceInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveBalance()}
                className="flex-1 bg-gray-700 text-white text-sm p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-0" autoFocus />
              <button onClick={saveBalance} className="text-green-400 text-sm font-medium hover:text-green-300">✓</button>
            </div>
          ) : (
            <button onClick={() => { setBalanceInput(String(openingBalance)); setEditingBalance(true) }}
              className="text-white font-bold text-sm hover:text-blue-300 transition-colors text-left w-full">
              {fmt(openingBalance)}<span className="text-gray-600 text-xs ml-1">✏️</span>
            </button>
          )}
          <div className="text-gray-600 text-xs mt-0.5">перенос с пред. месяца</div>
        </div>
        <div className={`rounded-xl p-3 border ${closingBalance >= 0 ? 'bg-green-900/20 border-green-800/40' : 'bg-red-900/20 border-red-800/40'}`}>
          <div className="text-gray-400 text-xs mb-1">Конечный остаток</div>
          <div className={`font-bold text-sm ${closingBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(closingBalance)}</div>
          <div className="text-gray-600 text-xs mt-0.5">начало + доходы − расходы</div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <SummaryCard label="Доходы" actual={totalIncomeActual} planned={totalIncomePlanned} color="green" />
        <SummaryCard label="Обязат." actual={totalMandatoryActual} planned={totalMandatoryPlanned} color="orange" />
        <SummaryCard label="Текущие" actual={totalCurrentActual} planned={totalCurrentPlanned} color="red" />
      </div>

      {/* Category sections */}
      <CategorySection title="💰 ДОХОДЫ" titleColor="text-green-400" lineColor="bg-green-900/40"
        categories={incomeCategories} annualPlan={annualPlan} getActual={getActual} getCategoryTx={getCategoryTx}
        type="income" txListOpen={txList} onToggleTxList={id => setTxList(txList === id ? null : id)}
        onAdd={cat => openAddModal(cat, 'add')} onSubtract={cat => openAddModal(cat, 'subtract')}
        onEditTx={tx => setEditModal(tx)} onDeleteTx={onDeleteTransaction}
      />
      <CategorySection title="🔒 ОБЯЗАТЕЛЬНЫЕ РАСХОДЫ" titleColor="text-orange-400" lineColor="bg-orange-900/40"
        categories={mandatoryCategories} annualPlan={annualPlan} getActual={getActual} getCategoryTx={getCategoryTx}
        type="expense" txListOpen={txList} onToggleTxList={id => setTxList(txList === id ? null : id)}
        onAdd={cat => openAddModal(cat, 'add')} onSubtract={cat => openAddModal(cat, 'subtract')}
        onEditTx={tx => setEditModal(tx)} onDeleteTx={onDeleteTransaction}
      />
      <CategorySection title="🛒 ТЕКУЩИЕ РАСХОДЫ" titleColor="text-red-400" lineColor="bg-red-900/40"
        categories={currentCategories} annualPlan={annualPlan} getActual={getActual} getCategoryTx={getCategoryTx}
        type="expense" txListOpen={txList} onToggleTxList={id => setTxList(txList === id ? null : id)}
        onAdd={cat => openAddModal(cat, 'add')} onSubtract={cat => openAddModal(cat, 'subtract')}
        onEditTx={tx => setEditModal(tx)} onDeleteTx={onDeleteTransaction}
      />

      {addModal && (
        <AmountModal categoryName={addModal.categoryName} categoryIcon={addModal.categoryIcon}
          type={addModal.type} onConfirm={handleAddConfirm} onClose={() => setAddModal(null)} />
      )}

      {editModal && (
        <EditTransactionModal
          transaction={editModal}
          categories={categories}
          onSave={tx => { onEditTransaction(tx); setEditModal(null) }}
          onDelete={id => { onDeleteTransaction(id); setEditModal(null) }}
          onClose={() => setEditModal(null)}
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
  title, titleColor, lineColor, categories, annualPlan, getActual, getCategoryTx,
  type, txListOpen, onToggleTxList, onAdd, onSubtract, onEditTx, onDeleteTx,
}: {
  title: string; titleColor: string; lineColor: string
  categories: Category[]; annualPlan: AnnualPlan
  getActual: (id: string) => number; getCategoryTx: (id: string) => Transaction[]
  type: 'income' | 'expense'; txListOpen: string | null
  onToggleTxList: (id: string) => void
  onAdd: (cat: Category) => void; onSubtract: (cat: Category) => void
  onEditTx: (tx: Transaction) => void; onDeleteTx: (id: string) => void
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
          const txs = getCategoryTx(cat.id)
          const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : actual > 0 ? 100 : 0
          const isOver = type === 'expense' && planned > 0 && actual > planned
          const isOpen = txListOpen === cat.id
          return (
            <div key={cat.id} className={`bg-gray-800 rounded-xl overflow-hidden ${isOver ? 'ring-1 ring-red-500/30' : ''}`}>
              {/* Main row */}
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => txs.length > 0 && onToggleTxList(cat.id)}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-white text-sm font-medium truncate">{cat.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isOver && <span className="text-red-400 text-xs bg-red-900/30 px-1.5 py-0.5 rounded">⚠ превышен</span>}
                        {txs.length > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded transition-colors ${isOpen ? 'bg-blue-800/50 text-blue-300' : 'bg-gray-700 text-gray-500'}`}>
                            {txs.length} {isOpen ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                      <span>факт: <span className={type === 'income' ? 'text-green-400' : isOver ? 'text-red-400' : 'text-gray-300'}>{fmt(actual)}</span></span>
                      <span>{planned > 0 ? `план: ${fmt(planned)}` : 'план не задан'}</span>
                    </div>
                    {(planned > 0 || actual !== 0) && (
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                        <div className={`h-1 rounded-full transition-all duration-300 ${type === 'income' ? 'bg-green-500' : isOver ? 'bg-red-500' : pct >= 80 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => onSubtract(cat)} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-red-800/70 text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors">−</button>
                    <button onClick={() => onAdd(cat)} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-green-800/70 text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors">+</button>
                  </div>
                </div>
              </div>

              {/* Transaction list (expanded) */}
              {isOpen && txs.length > 0 && (
                <div className="border-t border-gray-700/60">
                  {txs.map((tx, i) => {
                    const d = new Date(tx.timestamp)
                    const timeStr = d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={tx.id} className={`flex items-center gap-3 px-3 py-2.5 ${i < txs.length - 1 ? 'border-b border-gray-700/40' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.amount > 0 ? '+' : '−'}{fmt(Math.abs(tx.amount))}
                            </span>
                            {tx.note && <span className="text-gray-500 text-xs truncate">{tx.note}</span>}
                          </div>
                          <div className="text-gray-600 text-xs">{timeStr}</div>
                        </div>
                        <button
                          onClick={() => onEditTx(tx)}
                          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-blue-800/50 text-gray-500 hover:text-blue-300 flex items-center justify-center text-sm transition-colors"
                          title="Редактировать"
                        >✏</button>
                        <button
                          onClick={() => onDeleteTx(tx.id)}
                          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-red-900/50 text-gray-600 hover:text-red-400 flex items-center justify-center text-sm transition-colors"
                          title="Удалить"
                        >×</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
