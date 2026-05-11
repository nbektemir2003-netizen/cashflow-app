'use client'

import { useState } from 'react'
import { CATEGORIES, CURRENCY, fmt } from '../lib/data'
import { AnnualPlan } from '../lib/types'

interface Props {
  annualPlan: AnnualPlan
  onChange: (plan: AnnualPlan) => void
}

export default function AnnualPlanView({ annualPlan, onChange }: Props) {
  const [localPlan, setLocalPlan] = useState<AnnualPlan>({ ...annualPlan })
  const [saved, setSaved] = useState(false)

  const handleChange = (categoryId: string, value: string) => {
    const num = parseFloat(value.replace(/\s/g, '').replace(',', '.'))
    setLocalPlan(prev => ({ ...prev, [categoryId]: isNaN(num) || num < 0 ? 0 : num }))
    setSaved(false)
  }

  const handleSave = () => {
    onChange(localPlan)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const incomeCategories = CATEGORIES.filter(c => c.type === 'income')
  const expenseCategories = CATEGORIES.filter(c => c.type === 'expense')

  const totalIncome = incomeCategories.reduce((s, c) => s + (localPlan[c.id] || 0), 0)
  const totalExpense = expenseCategories.reduce((s, c) => s + (localPlan[c.id] || 0), 0)
  const plannedSavings = totalIncome - totalExpense

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-white font-bold text-lg mb-1">Годовой план</h2>
        <p className="text-gray-400 text-sm">
          Плановые суммы на месяц — применяются ко всем месяцам года
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-3">
          <div className="text-green-400 text-xs mb-1">Доходы в мес.</div>
          <div className="text-white font-bold text-sm">{fmt(totalIncome)}</div>
        </div>
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-3">
          <div className="text-red-400 text-xs mb-1">Расходы в мес.</div>
          <div className="text-white font-bold text-sm">{fmt(totalExpense)}</div>
        </div>
        <div
          className={`rounded-xl p-3 border ${
            plannedSavings >= 0
              ? 'bg-blue-900/20 border-blue-800/50'
              : 'bg-red-900/20 border-red-800/50'
          }`}
        >
          <div className={`text-xs mb-1 ${plannedSavings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {plannedSavings >= 0 ? 'Накопления' : 'Дефицит'}
          </div>
          <div className="text-white font-bold text-sm">{fmt(Math.abs(plannedSavings))}</div>
        </div>
      </div>

      {/* Income */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-400 text-sm font-bold">↑ ДОХОДЫ</span>
          <div className="flex-1 h-px bg-green-900/40" />
        </div>
        <div className="space-y-2">
          {incomeCategories.map(cat => (
            <PlanRow
              key={cat.id}
              icon={cat.icon}
              name={cat.name}
              value={localPlan[cat.id] || 0}
              onChange={v => handleChange(cat.id, v)}
              accentColor="green"
            />
          ))}
        </div>
      </div>

      {/* Expenses */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-400 text-sm font-bold">↓ РАСХОДЫ</span>
          <div className="flex-1 h-px bg-red-900/40" />
        </div>
        <div className="space-y-2">
          {expenseCategories.map(cat => (
            <PlanRow
              key={cat.id}
              icon={cat.icon}
              name={cat.name}
              value={localPlan[cat.id] || 0}
              onChange={v => handleChange(cat.id, v)}
              accentColor="red"
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all active:scale-98 ${
          saved
            ? 'bg-green-700 cursor-default'
            : 'bg-green-600 hover:bg-green-500 active:scale-95'
        }`}
      >
        {saved ? '✓ Сохранено!' : 'Сохранить план'}
      </button>

      <p className="text-center text-gray-600 text-xs mt-3">
        План сохраняется в памяти устройства
      </p>
    </div>
  )
}

function PlanRow({
  icon,
  name,
  value,
  onChange,
  accentColor,
}: {
  icon: string
  name: string
  value: number
  onChange: (v: string) => void
  accentColor: 'green' | 'red'
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{name}</div>
        {value > 0 && <div className="text-gray-500 text-xs mt-0.5">{fmt(value)}</div>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          min="0"
          className={`w-28 bg-gray-700 text-white text-right p-2 rounded-lg focus:outline-none focus:ring-2 text-sm ${
            accentColor === 'green' ? 'focus:ring-green-500' : 'focus:ring-red-500'
          }`}
        />
        <span className="text-gray-500 text-xs">{CURRENCY}</span>
      </div>
    </div>
  )
}
