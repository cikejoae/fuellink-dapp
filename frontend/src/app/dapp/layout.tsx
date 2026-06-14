'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { LayoutDashboard, Zap, BarChart2, Vote, Settings, Menu, X, ArrowLeft } from 'lucide-react'
import { clsx } from 'clsx'

const NAV = [
  { href: '/dapp',            label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/dapp/stake',      label: 'Staking',     Icon: Zap },
  { href: '/dapp/invest',     label: 'Inversiones', Icon: BarChart2 },
  { href: '/dapp/governance', label: 'Gobernanza',  Icon: Vote },
]

export default function DAppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-fuel-bg flex">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-40 w-60 glass border-r border-fuel-border flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-fuel-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-fuel-cyan/10 border border-fuel-cyan/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-fuel-cyan" />
            </div>
            <span className="font-display font-bold text-white text-base">fuel<span className="text-fuel-cyan">Link</span></span>
          </Link>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-fuel-cyan/10 text-fuel-cyan border border-fuel-cyan/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-fuel-cyan" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-fuel-border pt-4">
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 glass border-b border-fuel-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
        </header>

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
