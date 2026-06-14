'use client'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const STATS = [
  { label: 'Estaciones objetivo',  value: '6,000+' },
  { label: 'Consumidores México',  value: '70M' },
  { label: 'Mercado anual',        value: '$42B' },
  { label: 'Precio inicial token', value: '$0.0015' },
]

const BADGES = [
  { icon: Shield,     text: 'Polygon PoS' },
  { icon: Zap,        text: 'ERC-20' },
  { icon: TrendingUp, text: 'Auditado' },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-orange-glow pointer-events-none" />

      {/* Floating orb */}
      <motion.div
        animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-24 right-8 lg:right-24 w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, rgba(123,47,190,0.08) 60%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuel-cyan/30 bg-fuel-cyan/5 text-fuel-cyan text-xs font-semibold mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-fuel-cyan animate-pulse-slow" />
            Protocolo en lanzamiento · Q4 2025
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6"
          >
            <span className="text-white">Cada litro,</span>
            <br />
            <span className="gradient-text">un activo digital.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
          >
            FuelLink tokeniza el consumo de combustible y democratiza la inversión en estaciones de servicio
            mediante blockchain. Gana <span className="text-fuel-cyan font-semibold">$FUEL</span> por cada carga e invierte en gasolineras reales desde cualquier lugar.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            <Button variant="primary" size="lg" href="/dapp">
              Ir a la DApp <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="lg" href="#protocol">
              Ver el Protocolo
            </Button>
          </motion.div>

          {/* Tech badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-3 mb-16"
          >
            {BADGES.map(b => (
              <div key={b.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-fuel-border bg-fuel-card/60 text-xs text-slate-400">
                <b.icon className="w-3.5 h-3.5 text-fuel-cyan" />
                {b.text}
              </div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="glass rounded-xl p-4 border border-fuel-border"
              >
                <div className="text-2xl font-bold font-display text-white mb-1">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-fuel-bg to-transparent pointer-events-none" />
    </section>
  )
}
