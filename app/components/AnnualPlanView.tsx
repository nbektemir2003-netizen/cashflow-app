'use client'

import { useState, useEffect } from 'react'
import { EXAMPLE_PLAN, fmt, CURRENCY, MONTHS_RU_SHORT, MONTHS_RU } from '../lib/data'
import { AnnualPlan, Category, CategoryGroup } from '../lib/types'
import { MonthlyPlans, monthKey } from '../lib/storage'
import CategoryModal from './CategoryModal'

interface Props {
  monthlyPlans: MonthlyPlans
  transactions: any[]
  currentYear: number
  currentMonth: number
  categories: Category[]
  onChange: (plans: MonthlyPlans) => void
  onCategoriesChange: (cats: Category[]) => void
}

type EditCatModal = { cat?: Category; group: CategoryGroup } | null

export default function AnnualPlanView({
  monthlyPlans,
  transactions,
  currentYear,
  currentMonth,
  categories,
  onChange,
  onCategoriesChange,
}: Props) {
  const [selYear, setSelYear] = useState(currentYear)
  const [selMonth, setSelMonth] = useState(currentMonth)

  const selKey = monthKey(selYear, selMonth)
  const [localPlan, setLocalPlan] = useState<AnnualPlan>(monthlyPlans[selKey] || {})
  const [saved, setSaved] = useState(false)
  const [editCatModal, setEditCatModal] = useState<EditCatModal>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Sync localPlan when selected month changes
  useEffect(() => {
    setLocalPlan(monthlyPlans[selKey] || {})
    setSaved(false)
  }, [selKey, monthlyPlans])

  const incomeCategories = categories.filter(c => c.group === 'income')
  const mandatoryCategories = categories.filter(c => c.group === 'mandatory')
  const currentCategories = categories.filter(c => c.group === 'current')

  const handleChange = (categoryId: string, value: string) => {
    const num = parseFloat(value.replace(/\s/g, '').replace(',', '.'))
    setLocalPlan(prev => ({ ...prev, [categoryId]: isNaN(num) || num < 0 ? 0 : num }))
    setSaved(false)
  }

  const handleSave = () => {
    const updated = { ...monthlyPlans, [selKey]: localPlan }
    onChange(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleCopyFromPrevious = () => {
    const prevM = selMonth === 0 ? 11 : selMonth - 1
    const prevY = selMonth === 0 ? selYear - 1 : selYear
    const prevKey = monthKey(prevY, prevM)
    const prevPlan = monthlyPlans[prevKey]
    if (!prevPlan || Object.keys(prevPlan).length === 0) {
      alert(`В ${MONTHS_RU[prevM]} нет плана для копирования`)
      return
    }
    setLocalPlan({ ...prevPlan })
    setSaved(false)
  }

  const handleLoadExample = () => {
    setLocalPlan(EXAMPLE_PLAN)
    setSaved(false)
  }

  const handleSaveCategory = (data: Omit<Category, 'id'> & { id?: string }) => {
    if (data.id) {
      onCategoriesChange(categories.map(c => c.id === data.id ? { ...c, ...data, id: c.id } : c))
    } else {
      const newCat: Category = { id: `custom_${Date.now()}`, name: data.name, icon: data.icon, group: data.group }
      onCategoriesChange([...categories, newCat])
    }
    setEditCatModal(null)
  }

  const handleDeleteCategory = (catId: string) => {
    onCategoriesChange(categories.filter(c => c.id !== catId))
    const updated = { ...localPlan }
    delete updated[catId]
    setLocalPlan(updated)
    setDeleteConfirm(null)
  }

  const totalIncome = incomeCategories.reduce((s, c) => s + (localPlan[c.id] || 0), 0)
  const totalMandatory = mandatoryCategories.reduce((s, c) => s + (localPlan[c.id] || 0), 0)
  const totalCurrent = currentCategories.reduce((s, c) => s + (localPlan[c.id] || 0), 0)
  const totalExpense = totalMandatory + totalCurrent
  const plannedSavings = totalIncome - totalExpense

  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth()

  const monthHasPlan = (y: number, m: number) => {
    const k = monthKey(y, m)
    return monthlyPlans[k] && Object.values(monthlyPlans[k]).some(v => v > 0)
  }

  return (
    <div>
      {/* Year selector */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setSelYear(y => y - 1)}
          className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center"
        >←</button>
        <span className="text-white font-bold">{selYear}</span>
        <button
          onClick={() => setSelYear(y => y + 1)}
          className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center"
        >→</button>
      </div>

      {/* Month pills */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {MONTHS_RU_SHORT.map((name, m) => {
          const isCurrent = m === nowMonth && selYear === nowYear
          const isSelected = m === selMonth && selYear === selYear
          const hasPlan = monthHasPlan(selYear, m)
          return (
            <button
              key={m}
              onClick={() => setSelMonth(m)}
              className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : hasPlan
                  ? 'bg-green-900/60 text-green-300 hover:bg-green-800/70'
                  : isCurrent
                  ? 'bg-gray-700 text-white ring-1 ring-green-500/50'
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
              }`}
            >
              {name}
            </button>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCopyFromPrevious}
          className="flex-1 py-2 px-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs rounded-xl transition-colors border border-gray-700 flex items-center justify-center gap-1"
        >
          📋 С предыдущего
        </button>
        <button
          onClick={handleSave}
          className={`flex-1 py-2 px-2 text-xs rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
            saved ? 'bg-green-700 text-white cursor-default' : 'bg-green-600 hover:bg-green-500 text-white active:scale-95'
          }`}
        >
          {saved ? '✓ Сохранено!' : '💾 Сохранить'}
        </button>
        <button
          onClick={handleLoadExample}
          className="flex-1 py-2 px-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs rounded-xl transition-colors border border-gray-700 flex items-center justify-center gap-1"
        >
          🎯 Пример
        </button>
      </div>

      {/* Selected month title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-yellow-400 text-sm font-bold">📅 {MONTHS_RU[selMonth]} {selYear}</span>
        {!monthHasPlan(selYear, selMonth) && (
          <span className="text-gray-600 text-xs">— план не задан</span>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-2.5 text-center">
          <div className="text-green-400 text-xs mb-1">Доходы</div>
          <div className="text-white font-bold text-xs">{fmt(totalIncome)}</div>
        </div>
        <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-2.5 text-center">
          <div className="text-orange-400 text-xs mb-1">Расходы</div>
          <div className="text-white font-bold text-xs">{fmt(totalExpense)}</div>
        </div>
        <div className={`rounded-xl p-2.5 text-center border ${plannedSavings >= 0 ? 'bg-blue-900/20 border-blue-800/40' : 'bg-red-900/20 border-red-800/40'}`}>
          <div className={`text-xs mb-1 ${plannedSavings >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {plannedSavings >= 0 ? 'Остаток' : 'Дефицит'}
          </div>
          <div className="text-white font-bold text-xs">{fmt(Math.abs(plannedSavings))}</div>
        </div>
      </div>

      {/* Sections */}
      <PlanSection
        title="💰 ДОХОДЫ" titleColor="text-green-400" lineColor="bg-green-900/40" accentColor="green"
        categories={incomeCategories} localPlan={localPlan} group="income"
        onChange={handleChange} onEdit={cat => setEditCatModal({ cat, group: cat.group })}
        onDelete={id => setDeleteConfirm(id)} onAdd={() => setEditCatModal({ group: 'income' })}
      />
      <PlanSection
        title="🔒 ОБЯЗАТЕЛЬНЫЕ" titleColor="text-orange-400" lineColor="bg-orange-900/40" accentColor="orange"
        categories={mandatoryCategories} localPlan={localPlan} group="mandatory"
        onChange={handleChange} onEdit={cat => setEditCatModal({ cat, group: cat.group })}
        onDelete={id => setDeleteConfirm(id)} onAdd={() => setEditCatModal({ group: 'mandatory' })}
      />
      <PlanSection
        title="🛒 ТЕКУЩИЕ" titleColor="text-red-400" lineColor="bg-red-900/40" accentColor="red"
        categories={currentCategories} localPlan={localPlan} group="current"
        onChange={handleChange} onEdit={cat => setEditCatModal({ cat, group: cat.group })}
        onDelete={id => setDeleteConfirm(id)} onAdd={() => setEditCatModal({ group: 'current' })}
      />

      <p className="text-center text-gray-600 text-xs mt-1 mb-4">
        Нажмите ✏ чтобы редактировать или + добавить категорию
      </p>

      {/* Delete confirm */}
      {deleteConfirm && (() => {
        const cat = categories.find(c => c.id === deleteConfirm)
        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-gray-900 rounded-2xl border border-gray-700 p-5">
              <div className="text-white font-bold mb-2">Удалить категорию?</div>
              <div className="text-gray-400 text-sm mb-4">{cat?.icon} {cat?.name}</div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm">Отмена</button>
                <button onClick={() => handleDeleteCategory(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold">Удалить</button>
              </div>
            </div>
          </div>
        )
      })()}

      {editCatModal && (
        <CategoryModal
          initial={editCatModal.cat}
          onSave={handleSaveCategory}
          onClose={() => setEditCatModal(null)}
        />
      )}
    </div>
  )
}

function PlanSection({
  title, titleColor, lineColor, accentColor,
  categories, localPlan, group,
  onChange, onEdit, onDelete, onAdd,
}: {
  title: string; titleColor: string; lineColor: string; accentColor: 'green' | 'orange' | 'red'
  categories: Category[]; localPlan: AnnualPlan; group: CategoryGroup
  onChange: (id: string, v: string) => void
  onEdit: (cat: Category) => void; onDelete: (id: string) => void; onAdd: () => void
}) {
  const ringColor = { green: 'focus:ring-green-500', orange: 'focus:ring-orange-500', red: 'focus:ring-red-500' }
  const total = categories.reduce((s, c) => s + (localPlan[c.id] || 0), 0)

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`${titleColor} text-xs font-bold`}>{title}</span>
        <div className={`flex-1 h-px ${lineColor}`} />
        <span className="text-gray-500 text-xs">{fmt(total)}</span>
      </div>
      <div className="space-y-1.5">
        {categories.map(cat => (
          <div key={cat.id} className="bg-gray-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-lg flex-shrink-0">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm truncate">{cat.name}</div>
            </div>
            <input
              type="number"
              value={localPlan[cat.id] || ''}
              onChange={e => onChange(cat.id, e.target.value)}
              placeholder="0"
              min="0"
              className={`w-24 bg-gray-700 text-white text-right px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 text-sm ${ringColor[accentColor]}`}
            />
            <span className="text-gray-600 text-xs w-3">{CURRENCY}</span>
            <button onClick={() => onEdit(cat)} className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-blue-800/50 text-gray-400 hover:text-blue-300 flex items-center justify-center text-sm transition-colors flex-shrink-0" title="Редактировать">✏</button>
            <button onClick={() => onDelete(cat.id)} className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-red-900/50 text-gray-500 hover:text-red-400 flex items-center justify-center text-sm transition-colors flex-shrink-0" title="Удалить">×</button>
          </div>
        ))}
        <button
          onClick={onAdd}
          className={`w-full py-1.5 rounded-xl border border-dashed text-xs flex items-center justify-center gap-1.5 transition-colors ${
            accentColor === 'green' ? 'border-green-800/60 text-green-700 hover:text-green-400 hover:border-green-600'
            : accentColor === 'orange' ? 'border-orange-800/60 text-orange-700 hover:text-orange-400 hover:border-orange-600'
            : 'border-red-800/60 text-red-700 hover:text-red-400 hover:border-red-600'
          }`}
        >
          + Добавить категорию
        </button>
      </div>
    </div>
  )
}
