'use client'
import { motion } from 'framer-motion'
import { Fuel, Coins, BarChart3, Vote } from 'lucide-react'

const STEPS = [
  { icon: Fuel,      step: '01', title: 'Recarga combustible',    desc: 'En una estación afiliada al protocolo FuelLink. Cada litro es registrado off-chain en tiempo real.' },
  { icon: Coins,     step: '02', title: 'Gana $FUEL tokens',       desc: 'Tu consumo se tokeniza on-chain. Recibes $FUEL en tu wallet automáticamente como recompensa.' },
  { icon: BarChart3, step: '03', title: 'Stake & genera $FUELx',   desc: 'Bloquea tus $FUEL para acumular $FUELx. Mayor tiempo = más governance power y tier premium.' },
  { icon: Vote,      step: '04', title: 'Invierte y gobierna',     desc: 'Usa $FUEL para invertir en STOs de gasolineras reales. Con $FUELx vota en la DAO del protocolo.' },
]

export function HowItWorks() {
  return (
    <section id="solution" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuel-cyan/2 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuel-cyan/30 bg-fuel-cyan/5 text-fuel-cyan text-xs font-semibold mb-4">
            Cómo funciona
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            De litros a <span className="gradient-text">activos digitales</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Arquitectura híbrida off-chain / on-chain que convierte cada transacción física en valor tokenizado.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-12 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px bg-gradient-to-r from-fuel-cyan/20 via-fuel-purple/40 to-fuel-orange/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative"
              >
                <div className="glass rounded-2xl p-6 border border-fuel-border hover:border-fuel-cyan/30 transition-all duration-300 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-fuel-cyan/10 border border-fuel-cyan/20 flex items-center justify-center">
                      <s.icon className="w-6 h-6 text-fuel-cyan" />
                    </div>
                    <span className="font-display font-bold text-4xl text-fuel-cyan/15 select-none">{s.step}</span>
                  </div>
                  <h3 className="font-display font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Off-chain / On-chain diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="glass rounded-2xl p-6 border border-fuel-orange/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-fuel-orange animate-pulse-slow" />
              <span className="font-display font-semibold text-white">Off-chain</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-400">
              {['POS en gasolinera + control volumétrico','Procesamiento SAT / facturación electrónica','Integración CRE, NOM, ASEA, ISO','Membresías y licencias por estación','Datos de consumo en tiempo real'].map(t => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-fuel-orange/60 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6 border border-fuel-cyan/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-fuel-cyan animate-pulse-slow" />
              <span className="font-display font-semibold text-white">On-chain (Polygon PoS)</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-400">
              {['Mint de $FUEL por consumo verificado','Staking → $FUELx → tiers de usuario','DAO con votación cuadrática','STOs de gasolineras (security tokens)','Smart contracts auditados, inmutables'].map(t => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-fuel-cyan/60 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
