'use client'

import { useState } from 'react'

interface Props {
  onDone: () => void
}

const SLIDES = [
  {
    icon: '💸',
    title: 'Добро пожаловать в Финик!',
    desc: 'Личный финансовый учёт — просто и удобно. Давай покажем как всё работает за 1 минуту.',
    color: 'from-green-900/40 to-gray-900',
  },
  {
    icon: '📅',
    title: 'Вкладка «Месяц»',
    desc: 'Здесь добавляешь доходы и расходы. Нажми «+» рядом с категорией — введи сумму. Нажми «−» чтобы исправить ошибку.',
    color: 'from-blue-900/40 to-gray-900',
    tip: '💡 Выбирай счёт: Карта, Наличные или Депозит',
  },
  {
    icon: '📋',
    title: 'Вкладка «План»',
    desc: 'Задай бюджет на каждую категорию. Например: на еду — 50 000 ₸. Финик покажет сколько уже потратил и сколько осталось.',
    color: 'from-orange-900/40 to-gray-900',
    tip: '💡 Планируй в начале каждого месяца',
  },
  {
    icon: '📊',
    title: 'Отчёты и синхронизация',
    desc: 'Во вкладке «Отчёт» смотри итоги за любой период. Все данные синхронизируются между телефоном и компьютером автоматически.',
    color: 'from-purple-900/40 to-gray-900',
    tip: '💡 История покажет как менялись расходы по месяцам',
  },
]

export default function OnboardingModal({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const slide = SLIDES[step]
  const isLast = step === SLIDES.length - 1

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className={`bg-gradient-to-b ${slide.color} rounded-2xl border border-gray-300 dark:border-gray-700/50 overflow-hidden`}>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pt-5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-green-400' : i < step ? 'w-3 bg-green-700' : 'w-3 bg-gray-400 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-6 py-8 text-center">
            <div className="text-6xl mb-5">{slide.icon}</div>
            <h2 className="text-gray-900 dark:text-white font-bold text-xl mb-3 leading-snug">{slide.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{slide.desc}</p>
            {slide.tip && (
              <div className="bg-gray-200 dark:bg-gray-800/60 rounded-xl px-4 py-2.5 text-gray-700 dark:text-gray-300 text-xs">
                {slide.tip}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm transition-colors"
              >
                ← Назад
              </button>
            )}
            <button
              onClick={() => isLast ? onDone() : setStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all active:scale-95"
            >
              {isLast ? '🚀 Начать' : 'Далее →'}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={onDone}
              className="w-full pb-4 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 text-xs transition-colors"
            >
              Пропустить
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
