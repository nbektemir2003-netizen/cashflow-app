'use client'

import { useEffect } from 'react'
import { AppNotification } from '../lib/types'

interface Props {
  notification: AppNotification
  onDismiss: (id: string) => void
}

export default function NotificationToast({ notification, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000)
    return () => clearTimeout(timer)
  }, [notification.id, onDismiss])

  return (
    <div className="bg-red-950 border border-red-500/60 rounded-xl p-4 min-w-72 max-w-80 shadow-2xl animate-slide-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-400 text-sm">⚠️</span>
            <span className="text-red-300 font-semibold text-sm truncate">{notification.categoryName}</span>
          </div>
          <div className="text-white text-sm">{notification.message}</div>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-red-500 hover:text-white flex-shrink-0 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 h-0.5 bg-red-800 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 rounded-full animate-[shrink_5s_linear_forwards]" />
      </div>
    </div>
  )
}
