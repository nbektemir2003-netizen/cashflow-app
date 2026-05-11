'use client'

import { useState } from 'react'
import {
  CATEGORIES,
  INCOME_CATEGORIES,
  MANDATORY_CATEGORIES,
  CURRENT_CATEGORIES,
  CURRENCY,
  fmt,
  EXAMPLE_PLAN,
} from '../lib/data'
import { AnnualPlan } from '../lib/types'

interface Props {
  annualPlan: AnnualPlan
  transactions: any[]
  currentYear: number
  currentMonth: number
  onChange: (plan: AnnualPlan) => void
}

export default function AnnualPlanView({ annualPlan, transactions, currentYear, currentMonth, onChange }: Props) {
  const [localPlan, setLocalPlan] = useState<AnnualPlan>({ ...annualPlan })
  const [saved, setSaved] = useState(false)
  const [confirmExample, setConfirmExample] = useState(false)

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

  const handleCopyFromPrevious = () => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const prevTx = transactions.filter(t => {
      const d = new Date(t.timestamp)
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth
    })

    if (prevTx.length === 0) {
      alert('В предыдущем месяце нет данных для копирования')
      return
    }

    const newPlan: AnnualPlan = {}
    CATEGORIES.forEach(cat => {
      const actual = prevTx
        .filter(t => t.categoryId === cat.id)
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
      if (actual > 0) newPlan[cat.id] = actual
    })

    setLocalPlan(prev => ({ ...prev, ...newPlan }))
    setSaved(false)
  }

  const handleLoadExample = () => {
    setLocalPlan(EXAMPLE_PLAN)
    setConfirmExample(false)
    setSaved(false)
  }

  const totalIncome = INCOME_CATEGORIES.reduce((s, c) => s + (localPlan[c.id] || 0), 0)
  const totalMandatory = MANDATORY_CATEGORIES.reduce((s, c) => s + (localPlan[c.id] || 0), 0)
  const totalCurrent = CURRENT_CATEGORIES.reduce((s, c) => s + (localPlan[c.id] || 0), 0)
  const totalExpense = totalMandatory + totalCurrent
  const plannedSavings = totalIncome - totalExpense

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-white font-bold text-lg mb-1">Годовой план</h2>
        <p className="text-gray-400 text-sm">
          Плановые суммы на месяц — применяются ко всем месяцам
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={handleCopyFromPrevious}
          className="flex-1 py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded-xl transition-colors border border-gray-700 flex items-center justify-center gap-1.5"
        >
          📋 Копировать с пред.
        </button>
        <button
          onClick={() => setConfirmExample(true)}
          className="flex-1 py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded-xl transition-colors border border-gray-700 flex items-center justify-center gap-1.5"
        >
          💡 Пример
        </button>
      </div>

      {confirmExample && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 mb-5">
          <div className="text-yellow-300 text-sm font-medium mb-2">Загрузить пример данных?</div>
          <div className="text-gray-400 text-xs mb-3">Текущий план будет заменён примерными значениями</div>
          <div className="flex gap-2">
            <button
              onClick={handleLoadExample}
              className="flex-1 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium transition-colors"
            >
              Загрузить
            </button>
            <button
              onClick={() => setConfirmExample(false)}
              className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-3 text-center">
          <div className="text-green-400 text-xs mb-1">Доходы</div>
          <div className="text-white font-bold text-xs">{fmt(totalIncome)}</div>
        </div>
        <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-3 text-center">
          <div className="text-orange-400 text-xs mb-1">Расходы</div>
          <div className="text-white font-bold text-xs">{fmt(totalExpense)}</div>
        </div>
        <div
          className={`rounded-xl p-3 text-center border ${
            plannedSavings >= 0
              ? 'bg-blue-900/20 border-blue-800/40'
              : 'bg-red-900/20 border-red-800/40'
          }`}
        >
          <div className={`text-xs mb-1 ${plannedSavings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {plannedSavings >= 0 ? 'Накопления' : 'Дефицит'}
          </div>
          <div className="text-white font-bold text-xs">{fmt(Math.abs(plannedSavings))}</div>
        </div>
      </div>

      {/* Income */}
      <PlanSection
        title="💰 ДОХОДЫ"
        titleColor="text-green-400"
        lineColor="bg-green-900/40"
        accentColor="green"
        categories={INCOME_CATEGORIES}
        localPlan={localPlan}
        onChange={handleChange}
      />

      {/* Mandatory */}
      <PlanSection
        title="🔒 ОБЯЗАТЕЛЬНЫЕ РАСХОДЫ"
        titleColor="text-orange-400"
        lineColor="bg-orange-900/40"
        accentColor="orange"
        categories={MANDATORY_CATEGORIES}
        localPlan={localPlan}
        onChange={handleChange}
      />

      {/* Current */}
      <PlanSection
        title="🛒 ТЕКУЩИЕ РАСХОДЫ"
        titleColor="text-red-400"
        lineColor="bg-red-900/40"
        accentColor="red"
        categories={CURRENT_CATEGORIES}
        localPlan={localPlan}
        onChange={handleChange}
      />

      <button
        onClick={handleSave}
        className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all ${
          saved ? 'bg-green-700 cursor-default' : 'bg-green-600 hover:bg-green-500 active:scale-95'
        }`}
      >
        {saved ? '✓ Сохранено!' : 'Сохранить план'}
      </button>
      <p className="text-center text-gray-600 text-xs mt-3">
        Данные хранятся в памяти вашего устройства
      </p>
    </div>
  )
}

function PlanSection({
  title,
  titleColor,
  lineColor,
  accentColor,
  categories,
  localPlan,
  onChange,
}: {
  title: string
  titleColor: string
  lineColor: string
  accentColor: 'green' | 'orange' | 'red'
  categories: typeof INCOME_CATEGORIES
  localPlan: AnnualPlan
  onChange: (id: string, v: string) => void
}) {
  const ringColor = { green: 'focus:ring-green-500', orange: 'focus:ring-orange-500', red: 'focus:ring-red-500' }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`${titleColor} text-xs font-bold`}>{title}</span>
        <div className={`flex-1 h-px ${lineColor}`} />
      </div>
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{cat.name}</div>
              {(localPlan[cat.id] || 0) > 0 && (
                <div className="text-gray-500 text-xs mt-0.5">{fmt(localPlan[cat.id] || 0)}</div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <input
                type="number"
                value={localPlan[cat.id] || ''}
                onChange={e => onChange(cat.id, e.target.value)}
                placeholder="0"
                min="0"
                className={`w-28 bg-gray-700 text-white text-right p-2 rounded-lg focus:outline-none focus:ring-2 text-sm ${ringColor[accentColor]}`}
              />
              <span className="text-gray-500 text-xs">{CURRENCY}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
