'use client'

import { useState } from 'react'
import { Transaction, Category } from '../lib/types'
import { fmt, CURRENCY } from '../lib/data'

interface Props {
  transaction: Transaction
  categories: Category[]
  onSave: (updated: Transaction) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const PRESETS = [500, 1000, 5000, 10000, 50000, 100000]

export default function EditTransactionModal({ transaction, categories, onSave, onDelete, onClose }: Props) {
  const isNegative = transaction.amount < 0
  const [rawAmount, setRawAmount] = useState(String(Math.abs(transaction.amount)))
  const [note, setNote] = useState(transaction.note || '')
  const [categoryId, setCategoryId] = useState(transaction.categoryId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const incomeCategories = categories.filter(c => c.group === 'income')
  const mandatoryCategories = categories.filter(c => c.group === 'mandatory')
  const currentCategories = categories.filter(c => c.group === 'current')

  const selectedCat = categories.find(c => c.id === categoryId)
  const selectedGroup = selectedCat?.group ?? 'current'

  const handleSave = () => {
    const amount = parseFloat(rawAmount.replace(/\D/g, ''))
    if (isNaN(amount) || amount <= 0) return
    const newAmount = selectedGroup === 'income' ? Math.abs(amount) : -Math.abs(amount)
    onSave({ ...transaction, categoryId, amount: newAmount, note: note.trim() || undefined })
  }

  const date = new Date(transaction.timestamp)
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-t-2xl w-full max-w-md border-t border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="text-white font-bold text-base">Редактировать запись</div>
            <div className="text-gray-500 text-xs mt-0.5">{dateStr}, {timeStr}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">✕</button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Category selector */}
          <div>
            <div className="text-gray-400 text-xs mb-2">Категория</div>
            <CategoryGroup title="💰 Доходы" cats={incomeCategories} selected={categoryId} onSelect={setCategoryId} color="green" />
            <CategoryGroup title="🔒 Обязательные" cats={mandatoryCategories} selected={categoryId} onSelect={setCategoryId} color="orange" />
            <CategoryGroup title="🛒 Текущие" cats={currentCategories} selected={categoryId} onSelect={setCategoryId} color="red" />
          </div>

          {/* Amount */}
          <div>
            <div className="text-gray-400 text-xs mb-2">Сумма</div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={rawAmount}
                onChange={e => setRawAmount(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-800 text-white text-2xl font-bold p-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">{CURRENCY}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => setRawAmount(String(p))}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${rawAmount === String(p) ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-gray-700 text-gray-400 bg-gray-800 hover:bg-gray-700'}`}
                >
                  {p.toLocaleString('ru-RU')}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <div className="text-gray-400 text-xs mb-2">Комментарий</div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Необязательно..."
              className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder-gray-600 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm">Отмена</button>
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
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm">Нет</button>
                <button onClick={() => onDelete(transaction.id)} className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-bold">Да, удалить</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryGroup({ title, cats, selected, onSelect, color }: {
  title: string; cats: Category[]; selected: string
  onSelect: (id: string) => void; color: 'green' | 'orange' | 'red'
}) {
  if (cats.length === 0) return null
  const colors = {
    green: 'border-green-500 bg-green-900/30 text-green-300',
    orange: 'border-orange-500 bg-orange-900/30 text-orange-300',
    red: 'border-red-500 bg-red-900/30 text-red-300',
  }
  return (
    <div className="mb-2">
      <div className="text-gray-600 text-xs mb-1">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {cats.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-2.5 py-1 rounded-lg border text-xs transition-all flex items-center gap-1 ${
              selected === cat.id ? colors[color] : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
