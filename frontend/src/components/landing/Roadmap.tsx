'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

const PHASES = [
  {
    stage: 'Etapa 0',
    period: 'Q4 2025',
    title: 'Arranque del Protocolo',
    status: 'active',
    items: ['Constitución FuelLink INC (USA)', 'Deploy token $FUEL en Polygon', 'Lanzamiento DApp MVP', 'Venta privada $0.0010', 'Integración sistema control volumétrico', 'Campaña de marketing inicial'],
  },
  {
    stage: 'Etapa I',
    period: 'Q1–Q2 2026',
    title: 'La Liquidez & Primera STO',
    status: 'upcoming',
    items: ['Pool de liquidez FUEL/USDT', 'Lanzamiento Venta Fase I ($0.0012)', 'Primer grupo gasolinero MVP', 'Primera STO de gasolinera NanoGAS', 'earny App integración usuarios'],
  },
  {
    stage: 'Etapa II',
    period: 'Q4 2026',
    title: 'Marketplace & DeFi',
    status: 'upcoming',
    items: ['Venta Fase II ($0.0023)', 'Marketplace de proyectos de inversión', 'Launchpad para STOs', 'Integración protocolos DeFi', 'App comercios aliados', '1,200 gasolineras cliente directo'],
  },
  {
    stage: 'Etapa III',
    period: 'Q1 2027',
    title: 'DAO & Expansión',
    status: 'upcoming',
    items: ['Venta Fase III ($0.0038)', 'Lanzamiento completo de la DAO', 'NFT de niveles de usuario', '5,000 gasolineras socios comerciales', 'Campaña TV + redes sociales'],
  },
  {
    stage: 'Etapa IV',
    period: 'Q4 2027–2028',
    title: 'White Label & Global',
    status: 'upcoming',
    items: ['White Label para grupos gasolineros', 'Primera operación internacional', '500 gasolineras tokenizadas', 'Expansión LATAM (Brasil, Colombia, Argentina, Chile)', 'Protocolo global de referencia'],
  },
]

const STATUS_ICON = {
  done:     { Icon: CheckCircle2, color: '#10B981' },
  active:   { Icon: Clock,        color: '#00E5FF' },
  upcoming: { Icon: Circle,       color: '#475569' },
}

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuel-cyan/30 bg-fuel-cyan/5 text-fuel-cyan text-xs font-semibold mb-4">
            Roadmap
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            El camino al <span className="gradient-text">protocolo global</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-fuel-cyan/40 via-fuel-purple/30 to-transparent" />

          <div className="space-y-8">
            {PHASES.map((p, i) => {
              const { Icon, color } = STATUS_ICON[p.status as keyof typeof STATUS_ICON]
              const isRight = i % 2 === 0

              return (
                <motion.div
                  key={p.stage}
                  initial={{ opacity: 0, x: isRight ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex items-start gap-6 lg:gap-0 ${isRight ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-6 lg:left-1/2 w-3 h-3 rounded-full -translate-x-1.5 mt-6 ring-4 ring-fuel-bg" style={{ background: color }} />

                  {/* Spacer for desktop */}
                  <div className="hidden lg:block lg:w-1/2" />

                  {/* Card */}
                  <div className={`pl-14 lg:pl-0 lg:w-1/2 ${isRight ? 'lg:pr-12' : 'lg:pl-12'}`}>
                    <div className="glass rounded-2xl p-6 border border-fuel-border hover:border-fuel-cyan/20 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                          {p.stage} · {p.period}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-white text-lg mb-4">{p.title}</h3>
                      <ul className="space-y-1.5">
                        {p.items.map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                            <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
