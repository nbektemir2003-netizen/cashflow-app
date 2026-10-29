'use client'

import { useState } from 'react'
import { Transaction, Category, Account } from '../lib/types'
import { CURRENCY } from '../lib/data'
import { sanitizeAmountInput, parseAmount, displayAmountInput, amountToInput } from '../lib/amount'

interface Props {
  transaction: Transaction
  categories: Category[]
  accounts: Account[]
  onSave: (updated: Transaction) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const PRESETS = [500, 1000, 5000, 10000, 50000, 100000]

export default function EditTransactionModal({ transaction, categories, accounts, onSave, onDelete, onClose }: Props) {
  const isNegative = transaction.amount < 0
  const [rawAmount, setRawAmount] = useState(amountToInput(transaction.amount))
  const [note, setNote] = useState(transaction.note || '')
  const [categoryId, setCategoryId] = useState(transaction.categoryId)
  const [accountId, setAccountId] = useState(transaction.accountId || accounts[0]?.id || '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const incomeCategories = categories.filter(c => c.group === 'income')
  const mandatoryCategories = categories.filter(c => c.group === 'mandatory')
  const currentCategories = categories.filter(c => c.group === 'current')

  const handleSave = () => {
    const amount = parseAmount(rawAmount)
    if (isNaN(amount) || amount <= 0) return
    const newAmount = isNegative ? -Math.abs(amount) : Math.abs(amount)
    onSave({ ...transaction, categoryId, amount: newAmount, note: note.trim() || undefined, accountId: accountId || undefined })
  }

  const date = new Date(transaction.timestamp)
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-gray-100 dark:bg-gray-900 rounded-t-2xl w-full max-w-md border-t border-gray-300 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="text-gray-900 dark:text-white font-bold text-base">Редактировать запись</div>
            <div className="text-gray-500 text-xs mt-0.5">{dateStr}, {timeStr}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">✕</button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Amount */}
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-xs mb-2">Сумма</div>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={displayAmountInput(rawAmount)}
                onChange={e => setRawAmount(sanitizeAmountInput(e.target.value))}
                className="w-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-2xl font-bold p-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 text-lg">{CURRENCY}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => setRawAmount(String(p))}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${rawAmount === String(p) ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
                >
                  {p.toLocaleString('ru-RU')}
                </button>
              ))}
            </div>
          </div>

          {/* Category: компактный выбор вместо длинного списка кнопок, который сдвигал сумму вниз */}
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-xs mb-2">Категория</div>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {!categories.some(c => c.id === categoryId) && <option value={categoryId}>Категория удалена</option>}
              {incomeCategories.length > 0 && (
                <optgroup label="💰 Доходы">
                  {incomeCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </optgroup>
              )}
              {mandatoryCategories.length > 0 && (
                <optgroup label="🔒 Обязательные">
                  {mandatoryCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </optgroup>
              )}
              {currentCategories.length > 0 && (
                <optgroup label="🛒 Текущие">
                  {currentCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>

          {/* Account selector */}
          {accounts.length > 0 && (
            <div>
              <div className="text-gray-600 dark:text-gray-400 text-xs mb-2">Счёт</div>
              <div className="flex gap-2 flex-wrap">
                {accounts.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAccountId(a.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-all ${
                      accountId === a.id
                        ? 'border-green-500 bg-green-900/30 text-white'
                        : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <span>{a.icon}</span>
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <div className="text-gray-600 dark:text-gray-400 text-xs mb-2">Комментарий</div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Необязательно..."
              className="w-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder-gray-400 dark:placeholder-gray-600 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">Отмена</button>
            <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm">Сохранить</button>
          </div>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 rounded-xl border border-red-900/50 text-red-600 hover:text-red-400 hover:border-red-700 text-sm transition-colors"
            >
              🗑 Удалить запись
            </button>
          ) : (
            <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3">
              <div className="text-red-300 text-sm font-medium mb-2 text-center">Удалить эту запись?</div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">Нет</button>
                <button onClick={() => onDelete(transaction.id)} className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-bold">Да, удалить</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
