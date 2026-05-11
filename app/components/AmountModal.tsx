'use client'

import { useState, useEffect } from 'react'
import { CURRENCY } from '../lib/data'

interface Props {
  categoryName: string
  categoryIcon: string
  type: 'add' | 'subtract'
  onConfirm: (amount: number, note?: string) => void
  onClose: () => void
}

const PRESETS = [500, 1000, 5000, 10000, 50000, 100000]

export default function AmountModal({ categoryName, categoryIcon, type, onConfirm, onClose }: Props) {
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleConfirm = () => {
    const amount = parseFloat(value.replace(/\s/g, '').replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return
    onConfirm(amount, note.trim() || undefined)
  }

  const isAdd = type === 'add'

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-t-2xl p-6 w-full max-w-md border-t border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{categoryIcon}</span>
            <div>
              <div className="text-gray-400 text-xs">{isAdd ? '+ Добавить' : '− Вычесть'}</div>
              <div className="text-white font-semibold">{categoryName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="relative mb-3">
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0"
            className="w-full bg-gray-800 text-white text-3xl font-bold p-4 pr-16 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-medium">
            {CURRENCY}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => setValue(String(p))}
              className={`bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                value === String(p) ? 'border-green-500 text-green-400' : 'border-gray-700'
              }`}
            >
              {p.toLocaleString('ru-RU')}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Комментарий (необязательно)"
          className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder-gray-600 text-sm mb-4"
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 rounded-xl font-semibold text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={!value || parseFloat(value) <= 0}
            className={`py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isAdd ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {isAdd ? 'Добавить' : 'Вычесть'}
          </button>
        </div>
      </div>
    </div>
  )
}
