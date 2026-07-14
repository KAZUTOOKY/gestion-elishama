'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  className?: string
  accent?: 'emerald' | 'amber' | 'red' | 'teal' | 'slate'
}

const accentMap = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className, accent = 'emerald' }: StatCardProps) {
  return (
    <Card className={cn('p-4 sm:p-5 relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold mt-1 truncate">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1 font-medium', trendUp ? 'text-emerald-600' : 'text-red-500')}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-2.5 shrink-0', accentMap[accent])}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </Card>
  )
}
