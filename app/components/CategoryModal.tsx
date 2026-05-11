'use client'

import { useState } from 'react'
import { Category, CategoryGroup } from '../lib/types'

const SUGGESTED_ICONS = [
  '💼','💻','📈','🎁','🏡','💵','💰','💳','🏠','⚡','🏦','🛡️','📱','📡',
  '🛒','🍕','🚗','💊','🏋️','💇','👕','🎮','📚','👶','✈️','📦','🎯','🎪',
  '🏪','🎸','🐾','🌿','🍔','☕','🎬','🎭','🏖️','⚽','🧴','🧹','🔧','💡',
]

interface Props {
  initial?: Category
  onSave: (cat: Omit<Category, 'id'> & { id?: string }) => void
  onClose: () => void
}

export default function CategoryModal({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '📦')
  const [group, setGroup] = useState<CategoryGroup>(initial?.group ?? 'current')
  const [customIcon, setCustomIcon] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) { setError('Введите название'); return }
    const finalIcon = customIcon.trim() || icon
    onSave({ id: initial?.id, name: name.trim(), icon: finalIcon, group })
  }

  const groupLabels: { key: CategoryGroup; label: string; color: string }[] = [
    { key: 'income', label: '💰 Доходы', color: 'border-green-500 bg-green-900/30 text-green-300' },
    { key: 'mandatory', label: '🔒 Обязательные', color: 'border-orange-500 bg-orange-900/30 text-orange-300' },
    { key: 'current', label: '🛒 Текущие', color: 'border-red-500 bg-red-900/30 text-red-300' },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base">
            {initial ? 'Редактировать категорию' : 'Новая категория'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        {/* Group selector */}
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-2">Группа</div>
          <div className="flex gap-2">
            {groupLabels.map(g => (
              <button
                key={g.key}
                onClick={() => setGroup(g.key)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  group === g.key ? g.color : 'border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-2">Название</div>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="Например: Такси"
            className="w-full bg-gray-800 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600 text-sm"
            autoFocus
          />
        </div>

        {/* Icon */}
        <div className="mb-4">
          <div className="text-gray-400 text-xs mb-2">Иконка — выберите или введите эмодзи</div>
          <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto">
            {SUGGESTED_ICONS.map(em => (
              <button
                key={em}
                onClick={() => { setIcon(em); setCustomIcon('') }}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  icon === em && !customIcon ? 'bg-green-700 ring-2 ring-green-500' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customIcon}
            onChange={e => { setCustomIcon(e.target.value); if (e.target.value) setIcon(e.target.value) }}
            placeholder="Или свой эмодзи: 🌟"
            className="w-full bg-gray-800 text-white p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-600 text-sm"
          />
        </div>

        {/* Preview */}
        <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3 mb-4">
          <span className="text-2xl">{customIcon || icon}</span>
          <span className="text-white text-sm">{name || 'Название категории'}</span>
        </div>

        {error && <div className="text-red-400 text-xs mb-3">⚠️ {error}</div>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
          >
            {initial ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}
