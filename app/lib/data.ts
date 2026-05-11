import { Category } from './types'

export const CATEGORIES: Category[] = [
  { id: 'salary', name: 'Зарплата', type: 'income', icon: '💼' },
  { id: 'freelance', name: 'Фриланс', type: 'income', icon: '💻' },
  { id: 'investments', name: 'Инвестиции', type: 'income', icon: '📈' },
  { id: 'other_income', name: 'Другие доходы', type: 'income', icon: '💵' },
  { id: 'housing', name: 'Жильё / Аренда', type: 'expense', icon: '🏠' },
  { id: 'food', name: 'Еда', type: 'expense', icon: '🍽️' },
  { id: 'transport', name: 'Транспорт', type: 'expense', icon: '🚗' },
  { id: 'entertainment', name: 'Развлечения', type: 'expense', icon: '🎮' },
  { id: 'health', name: 'Здоровье', type: 'expense', icon: '💊' },
  { id: 'utilities', name: 'Коммунальные', type: 'expense', icon: '⚡' },
  { id: 'clothing', name: 'Одежда', type: 'expense', icon: '👕' },
  { id: 'education', name: 'Образование', type: 'expense', icon: '📚' },
  { id: 'subscriptions', name: 'Подписки', type: 'expense', icon: '📱' },
  { id: 'other_expense', name: 'Прочие расходы', type: 'expense', icon: '📦' },
]

export const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export const MONTHS_RU_SHORT = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
]

export const CURRENCY = '₸'

export function fmt(n: number): string {
  const abs = Math.abs(n)
  return (n < 0 ? '−' : '') + abs.toLocaleString('ru-RU') + ' ' + CURRENCY
}
