'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Menu, X, Zap } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Protocolo',    href: '#protocol' },
  { label: 'Solución',     href: '#solution' },
  { label: 'Tokenomics',   href: '#tokenomics' },
  { label: 'Roadmap',      href: '#roadmap' },
  { label: 'Equipo',       href: '#team' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-fuel-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-fuel-cyan/10 border border-fuel-cyan/30 flex items-center justify-center group-hover:bg-fuel-cyan/20 transition-colors">
              <Zap className="w-4 h-4 text-fuel-cyan" />
            </div>
            <span className="font-display font-bold text-white text-lg">fuel<span className="text-fuel-cyan">Link</span></span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/dapp" className="text-sm font-semibold text-fuel-cyan border border-fuel-cyan/30 px-4 py-2 rounded-lg hover:bg-fuel-cyan/10 transition-colors">
              Launch App
            </a>
            <ConnectButton />
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass border-t border-fuel-border px-4 pb-4 pt-2 space-y-3"
        >
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="block text-sm text-slate-400 hover:text-white py-2" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <a href="/dapp" className="text-center text-sm font-semibold text-fuel-cyan border border-fuel-cyan/30 px-4 py-2 rounded-lg">
              Launch App
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
