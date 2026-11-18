import { Account } from '../lib/types'
import { fmt } from '../lib/data'

interface Props {
  accounts: Account[]
  balances: Record<string, number>
  opening: number
  closing: number
}

// Компактная полоса остатков, закреплённая в шапке: остатки по счетам, начальный и конечный остаток.
export default function BalancesBar({ accounts, balances, opening, closing }: Props) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-lg mx-auto px-3 py-1.5">
        {accounts.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {accounts.map(a => {
              const bal = balances[a.id] ?? 0
              return (
                <div key={a.id} className="bg-gray-200 dark:bg-gray-800 rounded-lg px-1.5 py-1 text-center border border-gray-300 dark:border-gray-700/50 min-w-0">
                  <div className="text-gray-600 dark:text-gray-400 text-[10px] leading-none truncate">{a.icon} {a.name}</div>
                  <div className={`font-bold text-xs mt-1 whitespace-nowrap ${bal >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-400'}`}>{fmt(bal)}</div>
                </div>
              )
            })}
          </div>
        )}
        <div className="flex justify-between gap-2 text-[11px] mt-1.5 text-gray-600 dark:text-gray-400">
          <span className="whitespace-nowrap">Начальный <b className="text-gray-900 dark:text-white">{fmt(opening)}</b></span>
          <span className="whitespace-nowrap">Конечный <b className={closing >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt(closing)}</b></span>
        </div>
      </div>
    </div>
  )
}
