'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function JoinPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!name.trim()) { setError('Введите ваше имя'); return }
    if (!email.trim() || !email.includes('@')) { setError('Введите корректный email'); return }

    setLoading(true)
    const { error: err } = await supabase
      .from('cashflow_leads')
      .insert({ name: name.trim(), email: email.trim().toLowerCase() })

    if (err) {
      setError('Что-то пошло не так. Попробуйте ещё раз.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-6xl mb-4">💸</div>
        <h1 className="text-4xl font-bold text-center mb-3 tracking-tight">Финик</h1>
        <p className="text-gray-400 text-center text-lg max-w-sm mb-12 leading-relaxed">
          Личный финансовый учёт — просто, удобно и всегда под рукой
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 max-w-sm w-full mb-12">
          {[
            { icon: '📅', title: 'Учёт расходов', desc: 'По категориям каждый день' },
            { icon: '📋', title: 'Планирование', desc: 'Бюджет на каждый месяц' },
            { icon: '📊', title: 'Отчёты', desc: 'Видите куда уходят деньги' },
            { icon: '☁', title: 'Синхронизация', desc: 'С телефона и компьютера' },
          ].map(f => (
            <div key={f.title} className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-white font-semibold text-sm mb-0.5">{f.title}</div>
              <div className="text-gray-500 text-xs">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        {!done ? (
          <div className="w-full max-w-sm">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-white font-bold text-lg mb-1 text-center">Получить доступ</h2>
              <p className="text-gray-500 text-sm text-center mb-5">Оставьте заявку — мы свяжемся с вами</p>

              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full bg-gray-700 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-gray-700 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              {error && (
                <div className="mt-3 bg-red-900/30 border border-red-700/40 rounded-xl p-3 text-red-300 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-4 py-3.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm"
              >
                {loading ? '⏳ Отправка...' : '✓ Получить доступ'}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="bg-green-900/20 border border-green-700/40 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-white font-bold text-xl mb-2">Заявка принята!</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Спасибо, {name}! Мы скоро свяжемся с вами на <span className="text-green-400">{email}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-gray-700 text-xs">
        © 2026 Финик
      </footer>
    </div>
  )
}
