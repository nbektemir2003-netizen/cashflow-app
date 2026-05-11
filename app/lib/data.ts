import { Category, AnnualPlan } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  // Доходы
  { id: 'salary', name: 'Зарплата', group: 'income', icon: '💼' },
  { id: 'freelance', name: 'Фриланс / подработка', group: 'income', icon: '💻' },
  { id: 'investments', name: 'Инвестиции / дивиденды', group: 'income', icon: '📈' },
  { id: 'gifts', name: 'Подарки / премии', group: 'income', icon: '🎁' },
  { id: 'rental_income', name: 'Аренда (сдаю)', group: 'income', icon: '🏡' },
  { id: 'other_income', name: 'Другие доходы', group: 'income', icon: '💵' },

  // Обязательные расходы
  { id: 'rent', name: 'Аренда / ипотека', group: 'mandatory', icon: '🏠' },
  { id: 'utilities', name: 'Коммунальные услуги', group: 'mandatory', icon: '⚡' },
  { id: 'loan', name: 'Кредит / рассрочка', group: 'mandatory', icon: '🏦' },
  { id: 'insurance', name: 'Страховка', group: 'mandatory', icon: '🛡️' },
  { id: 'subscriptions', name: 'Подписки', group: 'mandatory', icon: '📱' },
  { id: 'internet', name: 'Связь / интернет', group: 'mandatory', icon: '📡' },

  // Текущие расходы
  { id: 'food', name: 'Еда / продукты', group: 'current', icon: '🛒' },
  { id: 'cafe', name: 'Кафе / рестораны', group: 'current', icon: '🍕' },
  { id: 'transport', name: 'Транспорт', group: 'current', icon: '🚗' },
  { id: 'health', name: 'Здоровье / аптека', group: 'current', icon: '💊' },
  { id: 'sport', name: 'Спорт / фитнес', group: 'current', icon: '🏋️' },
  { id: 'beauty', name: 'Красота / гигиена', group: 'current', icon: '💇' },
  { id: 'clothing', name: 'Одежда / обувь', group: 'current', icon: '👕' },
  { id: 'entertainment', name: 'Развлечения', group: 'current', icon: '🎮' },
  { id: 'education', name: 'Образование', group: 'current', icon: '📚' },
  { id: 'children', name: 'Дети', group: 'current', icon: '👶' },
  { id: 'travel', name: 'Путешествия', group: 'current', icon: '✈️' },
  { id: 'other_expense', name: 'Прочие расходы', group: 'current', icon: '📦' },
]

// Legacy alias so old imports still work (used in HistoryView, ReportView)
export const CATEGORIES = DEFAULT_CATEGORIES

export const INCOME_CATEGORIES = DEFAULT_CATEGORIES.filter(c => c.group === 'income')
export const MANDATORY_CATEGORIES = DEFAULT_CATEGORIES.filter(c => c.group === 'mandatory')
export const CURRENT_CATEGORIES = DEFAULT_CATEGORIES.filter(c => c.group === 'current')
export const EXPENSE_CATEGORIES = DEFAULT_CATEGORIES.filter(c => c.group !== 'income')

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
  return (n < 0 ? '−' : '') + abs.toLocaleString('ru-RU') + ' ₸'
}

export const EXAMPLE_PLAN: AnnualPlan = {
  salary: 350000,
  freelance: 80000,
  investments: 20000,
  other_income: 10000,
  rent: 120000,
  utilities: 15000,
  loan: 40000,
  insurance: 8000,
  subscriptions: 5000,
  food: 60000,
  transport: 20000,
  health: 10000,
  entertainment: 25000,
  clothing: 15000,
  education: 10000,
  other_expense: 10000,
}
