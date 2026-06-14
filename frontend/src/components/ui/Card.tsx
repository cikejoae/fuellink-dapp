import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: 'cyan' | 'orange' | 'purple' | 'none'
  hover?: boolean
}

export function Card({ children, className, glow = 'none', hover = false }: CardProps) {
  const glows = {
    cyan:   'hover:border-fuel-cyan/40 hover:shadow-[0_0_30px_rgba(0,229,255,0.12)]',
    orange: 'hover:border-fuel-orange/40 hover:shadow-[0_0_30px_rgba(255,107,53,0.12)]',
    purple: 'hover:border-fuel-purple/40 hover:shadow-[0_0_30px_rgba(123,47,190,0.12)]',
    none:   '',
  }

  return (
    <div className={clsx(
      'glass rounded-2xl p-6',
      hover && `transition-all duration-300 ${glows[glow]}`,
      className,
    )}>
      {children}
    </div>
  )
}
