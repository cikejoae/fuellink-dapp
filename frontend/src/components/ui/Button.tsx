'use client'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'orange'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  href?: string
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}

export function Button({ children, variant = 'primary', size = 'md', onClick, href, className, disabled, type = 'button' }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer'

  const variants = {
    primary:   'bg-fuel-cyan text-fuel-bg hover:bg-cyan-300 glow-cyan',
    secondary: 'border border-fuel-cyan/40 text-fuel-cyan hover:bg-fuel-cyan/10 hover:border-fuel-cyan',
    orange:    'bg-fuel-orange text-white hover:bg-orange-400 glow-orange',
    ghost:     'text-slate-400 hover:text-white hover:bg-white/5',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  const cls = clsx(base, variants[variant], sizes[size], disabled && 'opacity-50 cursor-not-allowed', className)

  const el = (
    <motion.button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {children}
    </motion.button>
  )

  if (href) return <a href={href}>{el}</a>
  return el
}
