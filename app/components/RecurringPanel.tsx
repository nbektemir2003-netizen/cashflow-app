'use client'

import { useState } from 'react'
import { Account, Category, RecurringPayment } from '../lib/types'
import { fmt, CURRENCY } from '../lib/data'

interface Props {
  recurring: RecurringPayment[]
  accounts: Account[]
  categories: Category[]
  onSave: (r: RecurringPayment[]) => void
  onClose: () => void
}

const PRESETS = [1000, 5000, 10000, 50000]

export default function RecurringPanel({ recurring, accounts, categories, onSave, onClose }: Props) {
  const [list, setList] = useState<RecurringPayment[]>(recurring)
  const [adding, setAdding] = useState(false)
  const [newCatId, setNewCatId] = useState('')
  const [newAccId, setNewAccId] = useState(accounts[0]?.id ?? '')
  const [newAmount, setNewAmount] = useState('')
  const [newDay, setNewDay] = useState('1')
  const [newNote, setNewNote] = useState('')

  const expenseCategories = categories.filter(c => c.group !== 'income')

  const handleAdd = () => {
    if (!newCatId) return
    const amount = parseFloat(newAmount)
    if (isNaN(amount) || amount <= 0) return
    const r: RecurringPayment = {
      id: `rec-${Date.now()}`,
      categoryId: newCatId,
      accountId: newAccId,
      amount,
      note: newNote.trim() || undefined,
      dayOfMonth: Math.min(31, Math.max(1, parseInt(newDay) || 1)),
      active: true,
    }
    setList(prev => [...prev, r])
    setAdding(false)
    setNewCatId('')
    setNewAmount('')
    setNewNote('')
    setNewDay('1')
  }

  const toggleActive = (id: string) => setList(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r))
  const deleteRec = (id: string) => setList(prev => prev.filter(r => r.id !== id))

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-t-2xl w-full max-w-md border-t border-gray-700 p-5 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-white font-bold text-base">🔄 Повторяющиеся платежи</div>
          <div className="flex items-center gap-2">
            <button onClick={() => { onSave(list); onClose() }}
              className="text-green-400 text-sm font-bold px-3 py-1 bg-green-900/30 rounded-lg hover:bg-green-900/50 transition-colors">
              Сохранить
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-700">✕</button>
          </div>
        </div>

        {list.length === 0 && !adding && (
          <div className="text-gray-500 text-sm text-center py-6">Нет повторяющихся платежей</div>
        )}

        <div className="space-y-2 mb-4">
          {list.map(r => {
            const cat = categories.find(c => c.id === r.categoryId)
            const acc = accounts.find(a => a.id === r.accountId)
            return (
              <div key={r.id} className={`bg-gray-800 rounded-xl p-3 flex items-center gap-3 transition-opacity ${!r.active ? 'opacity-50' : ''}`}>
                <span className="text-xl">{cat?.icon ?? '?'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm">{cat?.name ?? r.categoryId}</div>
                  <div className="text-gray-500 text-xs">
                    {acc && <span>{acc.icon} {acc.name} · </span>}
                    {r.dayOfMonth} числа · {fmt(r.amount)}
                  </div>
                  {r.note && <div className="text-gray-600 text-xs truncate">{r.note}</div>}
                </div>
                <button onClick={() => toggleActive(r.id)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${r.active ? 'border-green-700 text-green-400 bg-green-900/20' : 'border-gray-700 text-gray-500 bg-gray-800'}`}>
                  {r.active ? 'вкл' : 'выкл'}
                </button>
                <button onClick={() => deleteRec(r.id)}
                  className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-red-900/50 text-gray-500 hover:text-red-400 flex items-center justify-center text-sm transition-colors">
                  ×
                </button>
              </div>
            )
          })}
        </div>

        {adding ? (
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="text-white text-sm font-medium">Новый платёж</div>

            <div>
              <div className="text-gray-500 text-xs mb-1.5">Категория</div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {expenseCategories.map(c => (
                  <button key={c.id} onClick={() => setNewCatId(c.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left ${newCatId === c.id ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                    <span>{c.icon}</span><span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {accounts.length > 0 && (
              <div>
                <div className="text-gray-500 text-xs mb-1.5">Счёт</div>
                <div className="flex gap-2 flex-wrap">
                  {accounts.map(a => (
                    <button key={a.id} onClick={() => setNewAccId(a.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-all ${newAccId === a.id ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                      <span>{a.icon}</span><span>{a.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-gray-500 text-xs mb-1.5">Сумма</div>
              <div className="relative">
                <input type="text" inputMode="numeric" value={newAmount}
                  onChange={e => setNewAmount(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full bg-gray-700 text-white text-lg font-bold p-2.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{CURRENCY}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setNewAmount(String(p))}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${newAmount === String(p) ? 'border-blue-500 text-blue-400 bg-blue-900/20' : 'border-gray-700 text-gray-500 hover:bg-gray-700'}`}>
                    {p.toLocaleString('ru-RU')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-gray-500 text-xs mb-1.5">День месяца</div>
              <input type="number" min="1" max="31" value={newDay}
                onChange={e => setNewDay(e.target.value)}
                className="w-20 bg-gray-700 text-white p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center" />
            </div>

            <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder="Комментарий (необязательно)"
              className="w-full bg-gray-700 text-white p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder-gray-600 text-sm" />

            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 text-sm">Отмена</button>
              <button onClick={handleAdd} disabled={!newCatId || !newAmount}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm transition-colors">
                Добавить
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 text-sm transition-colors">
            + Добавить платёж
          </button>
        )}
      </div>
    </div>
  )
}
