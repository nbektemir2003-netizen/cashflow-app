'use client'

import { useState } from 'react'
import { CATEGORIES, MONTHS_RU, fmt } from '../lib/data'
import { AnnualPlan, Transaction } from '../lib/types'

interface Props {
  annualPlan: AnnualPlan
  transactions: Transaction[]
  currentYear: number
  currentMonth: number
}

export default function ReportView({ annualPlan, transactions, currentYear, currentMonth }: Props) {
  const [fromMonth, setFromMonth] = useState(0)
  const [toMonth, setToMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)

  const monthCount = toMonth - fromMonth + 1

  const getActualForPeriod = (categoryId: string) =>
    transactions
      .filter(t => {
        const d = new Date(t.timestamp)
        return (
          d.getFullYear() === year &&
          d.getMonth() >= fromMonth &&
          d.getMonth() <= toMonth &&
          t.categoryId === categoryId
        )
      })
      .reduce((sum, t) => sum + t.amount, 0)

  const categories = CATEGORIES.map(cat => {
    const planned = (annualPlan[cat.id] || 0) * monthCount
    const actual = getActualForPeriod(cat.id)
    const diff = cat.type === 'income' ? actual - planned : planned - actual
    return { ...cat, planned, actual, diff }
  })

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  const totalIncomePlanned = income.reduce((s, c) => s + c.planned, 0)
  const totalIncomeActual = income.reduce((s, c) => s + c.actual, 0)
  const totalExpensePlanned = expense.reduce((s, c) => s + c.planned, 0)
  const totalExpenseActual = expense.reduce((s, c) => s + c.actual, 0)
  const savings = totalIncomeActual - totalExpenseActual

  const monthWord = (n: number) => {
    if (n === 1) return 'месяц'
    if (n >= 2 && n <= 4) return 'месяца'
    return 'месяцев'
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-white font-bold text-lg mb-1">Отчёт</h2>
      </div>

      {/* Period selector */}
      <div className="bg-gray-800 rounded-xl p-4 mb-5">
        <div className="text-gray-400 text-sm font-medium mb-3">Период</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">С месяца</label>
            <select
              value={fromMonth}
              onChange={e => {
                const v = Number(e.target.value)
                setFromMonth(v)
                if (v > toMonth) setToMonth(v)
              }}
              className="w-full bg-gray-700 text-white p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS_RU.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">По месяц</label>
            <select
              value={toMonth}
              onChange={e => {
                const v = Number(e.target.value)
                setToMonth(v)
                if (v < fromMonth) setFromMonth(v)
              }}
              className="w-full bg-gray-700 text-white p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS_RU.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-gray-500 text-xs">
            {MONTHS_RU[fromMonth]} — {MONTHS_RU[toMonth]} {year} · {monthCount} {monthWord(monthCount)}
          </div>
          <div className="flex gap-1.5">
            {[currentYear - 1, currentYear].map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  year === y
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-3 text-center">
          <div className="text-green-400 text-xs mb-1">Доходы</div>
          <div className="text-white font-bold text-sm">{fmt(totalIncomeActual)}</div>
          <div className="text-gray-600 text-xs mt-0.5">план {fmt(totalIncomePlanned)}</div>
        </div>
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-center">
          <div className="text-red-400 text-xs mb-1">Расходы</div>
          <div className="text-white font-bold text-sm">{fmt(totalExpenseActual)}</div>
          <div className="text-gray-600 text-xs mt-0.5">план {fmt(totalExpensePlanned)}</div>
        </div>
        <div
          className={`rounded-xl p-3 text-center border ${
            savings >= 0
              ? 'bg-green-900/20 border-green-800/40'
              : 'bg-red-900/20 border-red-800/40'
          }`}
        >
          <div className={`text-xs mb-1 ${savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {savings >= 0 ? 'Сэкономлено' : 'Перерасход'}
          </div>
          <div className="text-white font-bold text-sm">{fmt(Math.abs(savings))}</div>
          <div className="text-gray-600 text-xs mt-0.5">факт</div>
        </div>
      </div>

      {/* Income breakdown */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-400 text-sm font-bold">↑ ДОХОДЫ</span>
          <div className="flex-1 h-px bg-green-900/40" />
        </div>
        <div className="space-y-2">
          {income.map(cat => (
            <ReportRow key={cat.id} cat={cat} />
          ))}
        </div>
      </div>

      {/* Expense breakdown */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-400 text-sm font-bold">↓ РАСХОДЫ</span>
          <div className="flex-1 h-px bg-red-900/40" />
        </div>
        <div className="space-y-2">
          {expense.map(cat => (
            <ReportRow key={cat.id} cat={cat} />
          ))}
        </div>
      </div>
    </div>
  )
}

type ReportCat = (typeof CATEGORIES)[0] & { planned: number; actual: number; diff: number }

function ReportRow({ cat }: { cat: ReportCat }) {
  const { planned, actual, diff, type } = cat
  const isPositive = diff >= 0
  const hasData = planned > 0 || actual !== 0

  if (!hasData) return null

  const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0

  return (
    <div className="bg-gray-800 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <span className="text-xl flex-shrink-0">{cat.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white text-sm font-medium truncate">{cat.name}</span>
            <span
              className={`text-sm font-semibold flex-shrink-0 ${
                planned === 0 ? 'text-gray-500' : isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {planned === 0 ? '—' : (isPositive ? '+' : '') + fmt(diff)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>факт: <span className="text-gray-300">{fmt(actual)}</span></span>
            {planned > 0 && <span>план: {fmt(planned)}</span>}
          </div>
          {planned > 0 && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  type === 'income' ? 'bg-green-500' : pct >= 100 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
