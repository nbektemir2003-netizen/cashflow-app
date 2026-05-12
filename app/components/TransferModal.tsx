'use client'

import { useState } from 'react'
import { Account, Transfer } from '../lib/types'
import { CURRENCY } from '../lib/data'

const PRESETS = [1000, 5000, 10000, 50000, 100000, 500000]

interface Props {
  accounts: Account[]
  onSave: (t: Transfer) => void
  onClose: () => void
}

export default function TransferModal({ accounts, onSave, onClose }: Props) {
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '')
  const [toId, setToId] = useState(accounts[1]?.id ?? '')
  const [rawAmount, setRawAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (fromId === toId) { setError('Выберите разные счета'); return }
    const amount = parseFloat(rawAmount.replace(/\D/g, ''))
    if (isNaN(amount) || amount <= 0) { setError('Введите сумму'); return }
    onSave({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fromAccountId: fromId,
      toAccountId: toId,
      amount,
      timestamp: Date.now(),
      note: note.trim() || undefined,
    })
  }

  const fromAcc = accounts.find(a => a.id === fromId)
  const toAcc = accounts.find(a => a.id === toId)

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-gray-900 rounded-t-2xl w-full max-w-md border-t border-gray-700 p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-white font-bold text-base">↔ Перевод между счетами</div>
          <button onClick={onClose} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700">✕</button>
        </div>

        {/* From → To */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="text-gray-500 text-xs mb-1.5">Откуда</div>
            <div className="space-y-1.5">
              {accounts.map(a => (
                <button key={a.id} onClick={() => setFromId(a.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${fromId === a.id ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  <span>{a.icon}</span><span>{a.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="text-2xl text-gray-500 mt-4">→</div>
          <div className="flex-1">
            <div className="text-gray-500 text-xs mb-1.5">Куда</div>
            <div className="space-y-1.5">
              {accounts.map(a => (
                <button key={a.id} onClick={() => setToId(a.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${toId === a.id ? 'border-green-500 bg-green-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  <span>{a.icon}</span><span>{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {fromId === toId && fromId && <div className="text-red-400 text-xs mb-3">⚠ Выберите разные счета</div>}

        {/* Preview */}
        {fromAcc && toAcc && fromId !== toId && (
          <div className="bg-gray-800 rounded-xl p-3 mb-4 flex items-center justify-center gap-2 text-sm">
            <span>{fromAcc.icon}</span><span className="text-white">{fromAcc.name}</span>
            <span className="text-gray-500">→</span>
            <span>{toAcc.icon}</span><span className="text-white">{toAcc.name}</span>
          </div>
        )}

        {/* Amount */}
        <div className="relative mb-3">
          <input type="text" inputMode="numeric" value={rawAmount}
            onChange={e => { setRawAmount(e.target.value.replace(/\D/g, '')); setError('') }}
            placeholder="0" autoFocus
            className="w-full bg-gray-800 text-white text-2xl font-bold p-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={e => e.key === 'Enter' && handleSave()} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">{CURRENCY}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PRESETS.map(p => (
            <button key={p} onClick={() => setRawAmount(String(p))}
              className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${rawAmount === String(p) ? 'border-blue-500 text-blue-400 bg-blue-900/20' : 'border-gray-700 text-gray-400 bg-gray-800 hover:bg-gray-700'}`}>
              {p.toLocaleString('ru-RU')}
            </button>
          ))}
        </div>

        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          placeholder="Комментарий (необязательно)"
          className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder-gray-600 text-sm mb-3"
          onKeyDown={e => e.key === 'Enter' && handleSave()} />

        {error && <div className="text-red-400 text-xs mb-3">⚠ {error}</div>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 text-sm">Отмена</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm">Перевести</button>
        </div>
      </div>
    </div>
  )
}
