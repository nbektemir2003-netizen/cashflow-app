'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  onAuthenticated: (userId: string, email: string) => void
  onSkip: () => void
}

export default function AuthModal({ onAuthenticated, onSkip }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const switchMode = (m: 'login' | 'register') => {
    setMode(m)
    setError('')
    setConfirmPassword('')
  }

  const handleSubmit = async () => {
    setError('')
    if (!email.trim() || !password) { setError('Введите email и пароль'); return }
    if (password.length < 6) { setError('Пароль — минимум 6 символов'); return }
    if (mode === 'register' && password !== confirmPassword) { setError('Пароли не совпадают'); return }

    setLoading(true)

    if (mode === 'login') {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError('Неверный email или пароль')
      } else if (data.user) {
        onAuthenticated(data.user.id, data.user.email!)
      }
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) {
        setError(err.message.includes('already') ? 'Этот email уже зарегистрирован' : err.message)
      } else if (data.user) {
        onAuthenticated(data.user.id, data.user.email!)
      }
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💸</div>
          <h1 className="text-white font-bold text-2xl tracking-tight">КЭШ ФЛОУ</h1>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Войдите, чтобы данные синхронизировались<br />между телефоном и компьютером
          </p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700/50">
          {/* Toggle */}
          <div className="flex bg-gray-700/60 rounded-xl p-1 mb-5">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="space-y-3 mb-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Эл. почта"
              autoComplete="email"
              className="w-full bg-gray-700 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Пароль"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-gray-700 text-white p-3.5 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-lg select-none"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {mode === 'register' && (
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Подтвердите пароль"
                autoComplete="new-password"
                className="w-full bg-gray-700 text-white p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/40 rounded-xl p-3 mb-4 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading
              ? '⏳ Загрузка...'
              : mode === 'login'
              ? '→ Войти'
              : '✓ Создать аккаунт'}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="w-full mt-4 py-3 text-gray-600 hover:text-gray-400 text-xs transition-colors"
        >
          Продолжить без входа (данные только на этом устройстве)
        </button>
      </div>
    </div>
  )
}
