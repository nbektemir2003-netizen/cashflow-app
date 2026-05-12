'use client'

import { useState } from 'react'
import { MONTHS_RU, fmt } from '../lib/data'
import { AnnualPlan, Transaction, Category, Account, Transfer, RecurringPayment } from '../lib/types'
import AmountModal from './AmountModal'
import EditTransactionModal from './EditTransactionModal'
import TransferModal from './TransferModal'
import RecurringPanel from './RecurringPanel'

interface Props {
  year: number
  month: number
  annualPlan: AnnualPlan
  transactions: Transaction[]
  openingBalance: number
  categories: Category[]
  accounts: Account[]
  transfers: Transfer[]
  recurring: RecurringPayment[]
  onAddTransaction: (t: Transaction) => void
  onDeleteTransaction: (id: string) => void
  onEditTransaction: (t: Transaction) => void
  onSetOpeningBalance: (amount: number) => void
  onAddTransfer: (t: Transfer) => void
  onSaveRecurring: (r: RecurringPayment[]) => void
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
  accounts, transfers, recurring,
  onAddTransaction, onDeleteTransaction, onEditTransaction,
  onSetOpeningBalance, onAddTransfer, onSaveRecurring,
  onPrevMonth, onNextMonth,
}: Props) {
  const [addModal, setAddModal] = useState<AddModalState | null>(null)
  const [editModal, setEditModal] = useState<Transaction | null>(null)
  const [txList, setTxList] = useState<string | null>(null)
  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceInput, setBalanceInput] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)

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

  const getAccountBalance = (accountId: string) => {
    const isDefault = accounts[0]?.id === accountId
    const incomeIds = new Set(incomeCategories.map(c => c.id))
    const acctTx = monthTx.filter(t => t.accountId === accountId || (isDefault && !t.accountId))
    const income = acctTx.filter(t => incomeIds.has(t.categoryId)).reduce((s, t) => s + t.amount, 0)
    const expense = acctTx.filter(t => !incomeIds.has(t.categoryId)).reduce((s, t) => s + t.amount, 0)
    const monthTransfers = transfers.filter(t => {
      const d = new Date(t.timestamp)
      return d.getFullYear() === year && d.getMonth() === month
    })
    const tIn = monthTransfers.filter(t => t.toAccountId === accountId).reduce((s, t) => s + t.amount, 0)
    const tOut = monthTransfers.filter(t => t.fromAccountId === accountId).reduce((s, t) => s + t.amount, 0)
    const startBalance = isDefault ? openingBalance : 0
    return startBalance + income - expense + tIn - tOut
  }

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

  // Recurring payments pending this month (not yet added)
  const pendingRecurring = recurring.filter(r => {
    if (!r.active) return false
    const cat = categories.find(c => c.id === r.categoryId)
    if (!cat) return false
    return !monthTx.some(t => t.categoryId === r.categoryId && t.accountId === r.accountId)
  })

  const openAddModal = (cat: Category, type: 'add' | 'subtract') =>
    setAddModal({ categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon, type })

  const handleAddConfirm = (amount: number, note?: string, accountId?: string) => {
    if (!addModal) return
    onAddTransaction({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      categoryId: addModal.categoryId,
      amount: addModal.type === 'subtract' ? -amount : amount,
      timestamp: Date.now(),
      note,
      accountId: accountId || undefined,
    })
    setAddModal(null)
  }

  const handleAddRecurring = (r: RecurringPayment) => {
    onAddTransaction({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      categoryId: r.categoryId,
      amount: r.amount,
      timestamp: Date.now(),
      note: r.note,
      accountId: r.accountId || undefined,
    })
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

      {/* Accounts */}
      {accounts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Счета</span>
            <button onClick={() => setShowTransfer(true)}
              className="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 px-2.5 py-1 rounded-lg transition-colors border border-blue-800/30">
              ↔ Перевод
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {accounts.map(acc => {
              const bal = getAccountBalance(acc.id)
              return (
                <div key={acc.id} className="bg-gray-800 rounded-xl p-2.5 text-center border border-gray-700/50">
                  <div className="text-xl mb-1">{acc.icon}</div>
                  <div className="text-gray-400 text-xs">{acc.name}</div>
                  <div className={`font-bold text-xs mt-0.5 ${bal >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(bal)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending recurring payments */}
      {pendingRecurring.length > 0 && (
        <div className="mb-4 bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 text-xs font-bold">🔄 Повторяющиеся</span>
            <button onClick={() => setShowRecurring(true)} className="text-gray-500 hover:text-gray-300 text-xs px-2 py-0.5 rounded-lg hover:bg-gray-700 transition-colors">⚙ Настроить</button>
          </div>
          <div className="space-y-1.5">
            {pendingRecurring.map(r => {
              const cat = categories.find(c => c.id === r.categoryId)
              const acc = accounts.find(a => a.id === r.accountId)
              if (!cat) return null
              return (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="text-base">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-sm">{cat.name}</span>
                    {acc && <span className="text-gray-500 text-xs ml-1">· {acc.icon} {acc.name}</span>}
                  </div>
                  <span className="text-gray-400 text-xs">{fmt(r.amount)}</span>
                  <button onClick={() => handleAddRecurring(r)}
                    className="text-xs bg-yellow-700/50 hover:bg-yellow-600/60 text-yellow-200 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap">
                    + Добавить
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recurring.length > 0 && pendingRecurring.length === 0 && (
        <div className="mb-4 flex justify-end">
          <button onClick={() => setShowRecurring(true)} className="text-gray-600 hover:text-gray-400 text-xs flex items-center gap-1 transition-colors">
            🔄 Повторяющиеся платежи
          </button>
        </div>
      )}

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
      <CategorySection title="💰 ДОХОДЫ" titleColor="text-green-400" lineColor="bg-green-900/40" barColor="green"
        categories={incomeCategories} annualPlan={annualPlan} getActual={getActual} getCategoryTx={getCategoryTx}
        type="income" txListOpen={txList} onToggleTxList={id => setTxList(txList === id ? null : id)}
        onAdd={cat => openAddModal(cat, 'add')} onSubtract={cat => openAddModal(cat, 'subtract')}
        onEditTx={tx => setEditModal(tx)} onDeleteTx={onDeleteTransaction}
      />
      <CategorySection title="🔒 ОБЯЗАТЕЛЬНЫЕ РАСХОДЫ" titleColor="text-orange-400" lineColor="bg-orange-900/40" barColor="orange"
        categories={mandatoryCategories} annualPlan={annualPlan} getActual={getActual} getCategoryTx={getCategoryTx}
        type="expense" txListOpen={txList} onToggleTxList={id => setTxList(txList === id ? null : id)}
        onAdd={cat => openAddModal(cat, 'add')} onSubtract={cat => openAddModal(cat, 'subtract')}
        onEditTx={tx => setEditModal(tx)} onDeleteTx={onDeleteTransaction}
      />
      <CategorySection title="🛒 ТЕКУЩИЕ РАСХОДЫ" titleColor="text-red-400" lineColor="bg-red-900/40" barColor="red"
        categories={currentCategories} annualPlan={annualPlan} getActual={getActual} getCategoryTx={getCategoryTx}
        type="expense" txListOpen={txList} onToggleTxList={id => setTxList(txList === id ? null : id)}
        onAdd={cat => openAddModal(cat, 'add')} onSubtract={cat => openAddModal(cat, 'subtract')}
        onEditTx={tx => setEditModal(tx)} onDeleteTx={onDeleteTransaction}
      />

      {/* Recurring manage link (if no pending) */}
      {recurring.length === 0 && (
        <div className="text-center mt-2 mb-4">
          <button onClick={() => setShowRecurring(true)} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            + Настроить повторяющиеся платежи
          </button>
        </div>
      )}

      {addModal && (
        <AmountModal
          categoryName={addModal.categoryName}
          categoryIcon={addModal.categoryIcon}
          type={addModal.type}
          accounts={accounts}
          onConfirm={handleAddConfirm}
          onClose={() => setAddModal(null)}
        />
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

      {showTransfer && (
        <TransferModal
          accounts={accounts}
          onSave={t => { onAddTransfer(t); setShowTransfer(false) }}
          onClose={() => setShowTransfer(false)}
        />
      )}

      {showRecurring && (
        <RecurringPanel
          recurring={recurring}
          accounts={accounts}
          categories={categories}
          onSave={r => { onSaveRecurring(r); setShowRecurring(false) }}
          onClose={() => setShowRecurring(false)}
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
  title, titleColor, lineColor, barColor, categories, annualPlan, getActual, getCategoryTx,
  type, txListOpen, onToggleTxList, onAdd, onSubtract, onEditTx, onDeleteTx,
}: {
  title: string; titleColor: string; lineColor: string; barColor: 'green' | 'orange' | 'red'
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
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => txs.length > 0 && onToggleTxList(cat.id)}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-white text-sm font-medium truncate">{cat.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isOver && <span className="text-red-400 text-xs bg-red-900/30 px-1.5 py-0.5 rounded">⚠ превышен</span>}
                        {txs.length > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded transition-colors ${isOpen ? barColor === 'green' ? 'bg-green-800/50 text-green-300' : barColor === 'orange' ? 'bg-orange-800/50 text-orange-300' : 'bg-red-800/50 text-red-300' : 'bg-gray-700 text-gray-500'}`}>
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
                        <div className={`h-1 rounded-full transition-all duration-300 ${isOver ? 'bg-red-500' : barColor === 'green' ? 'bg-green-500' : barColor === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => onSubtract(cat)} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-red-800/70 text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors">−</button>
                    <button onClick={() => onAdd(cat)} className="w-8 h-8 rounded-full bg-gray-700 hover:bg-green-800/70 text-gray-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors">+</button>
                  </div>
                </div>
              </div>

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
                        <button onClick={() => onEditTx(tx)}
                          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-blue-800/50 text-gray-500 hover:text-blue-300 flex items-center justify-center text-sm transition-colors">✏</button>
                        <button onClick={() => onDeleteTx(tx.id)}
                          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-red-900/50 text-gray-600 hover:text-red-400 flex items-center justify-center text-sm transition-colors">×</button>
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
