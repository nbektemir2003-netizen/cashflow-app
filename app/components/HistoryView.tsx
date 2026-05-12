'use client'

import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, MONTHS_RU, MONTHS_RU_SHORT, fmt } from '../lib/data'
import { Transaction } from '../lib/types'
import { MonthlyPlans, monthKey } from '../lib/storage'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  monthlyPlans: MonthlyPlans
  transactions: Transaction[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm shadow-xl">
      <div className="text-gray-300 font-medium mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4" style={{ color: p.fill }}>
          <span>{p.dataKey}</span>
          <span className="font-semibold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const tickFmt = (v: number) =>
  v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'М' : v >= 1_000 ? (v / 1_000).toFixed(0) + 'К' : String(v)

export default function HistoryView({ monthlyPlans, transactions }: Props) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const monthlyData = MONTHS_RU_SHORT.map((shortName, monthIdx) => {
    const monthTx = transactions.filter(t => {
      const d = new Date(t.timestamp)
      return d.getFullYear() === currentYear && d.getMonth() === monthIdx
    })

    const income = monthTx
      .filter(t => INCOME_CATEGORIES.find(c => c.id === t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = monthTx
      .filter(t => EXPENSE_CATEGORIES.find(c => c.id === t.categoryId))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const plan = monthlyPlans[monthKey(currentYear, monthIdx)] || {}
    const plannedIncome = INCOME_CATEGORIES.reduce((s, c) => s + (plan[c.id] || 0), 0)
    const plannedExpense = EXPENSE_CATEGORIES.reduce((s, c) => s + (plan[c.id] || 0), 0)

    return {
      month: shortName,
      fullMonth: MONTHS_RU[monthIdx],
      'Доходы': income,
      'Расходы': expense,
      plannedIncome,
      plannedExpense,
      savings: income - expense,
      hasTx: monthTx.length > 0,
    }
  })

  const visibleData = monthlyData.slice(0, now.getMonth() + 1)
  const totalIncome = visibleData.reduce((s, m) => s + m['Доходы'], 0)
  const totalExpense = visibleData.reduce((s, m) => s + m['Расходы'], 0)
  const totalSavings = totalIncome - totalExpense
  const hasAnyData = visibleData.some(m => m.hasTx)

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-white font-bold text-lg mb-1">История {currentYear}</h2>
        <p className="text-gray-400 text-sm">Доходы и расходы по месяцам</p>
      </div>

      {/* Year totals */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-green-400 text-xs mb-1">Доходы</div>
          <div className="text-white font-bold text-xs">{fmt(totalIncome)}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-red-400 text-xs mb-1">Расходы</div>
          <div className="text-white font-bold text-xs">{fmt(totalExpense)}</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <div className={`text-xs mb-1 ${totalSavings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {totalSavings >= 0 ? 'Накоплено' : 'Перерасход'}
          </div>
          <div className="text-white font-bold text-xs">{fmt(Math.abs(totalSavings))}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-800 rounded-xl p-4 mb-5">
        <div className="text-gray-400 text-xs mb-3">Доходы и расходы по месяцам</div>
        {!hasAnyData ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-gray-600">
            <div className="text-3xl">📊</div>
            <div className="text-sm">Нет данных — добавьте транзакции</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={visibleData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} tickFormatter={tickFmt} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '11px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
              <Bar dataKey="Доходы" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Bar dataKey="Расходы" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-2.5 border-b border-gray-700">
          <div className="text-gray-500 text-xs font-medium">Месяц</div>
          <div className="text-gray-500 text-xs font-medium text-right">Доходы</div>
          <div className="text-gray-500 text-xs font-medium text-right">Расходы</div>
          <div className="text-gray-500 text-xs font-medium text-right">Итог</div>
        </div>
        {visibleData.map((m, i) => (
          <div key={i} className={`grid grid-cols-4 px-4 py-3 border-b border-gray-700/40 last:border-0 ${!m.hasTx ? 'opacity-35' : ''}`}>
            <div className="text-white text-sm">{m.fullMonth}</div>
            <div className="text-green-400 text-sm text-right">{m['Доходы'] > 0 ? fmt(m['Доходы']) : '—'}</div>
            <div className="text-red-400 text-sm text-right">{m['Расходы'] > 0 ? fmt(m['Расходы']) : '—'}</div>
            <div className={`text-sm text-right font-medium ${!m.hasTx ? 'text-gray-600' : m.savings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {!m.hasTx ? '—' : fmt(m.savings)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
