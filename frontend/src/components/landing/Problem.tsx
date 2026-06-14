'use client'
import { motion } from 'framer-motion'
import { Users, Building2, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const PROBLEMS = [
  {
    icon: Users,
    title: 'Consumidores sin recompensas reales',
    points: ['Sin beneficios por fidelidad al consumir', 'Programas de puntos caducos y cerrados', 'Sin acceso a inversión en el sector'],
    color: '#00E5FF',
  },
  {
    icon: Building2,
    title: 'Gasolineras sin capital ni liquidez',
    points: ['Financiamiento difícil y costoso', 'Sin herramientas digitales de fidelización', 'Ticket promedio estancado'],
    color: '#FF6B35',
  },
  {
    icon: TrendingUp,
    title: 'Inversores excluidos del sector',
    points: ['Activo históricamente cerrado a grandes capitales', 'Opacidad en operaciones y rendimientos', 'Sin vehículo líquido de entrada'],
    color: '#7B2FBE',
  },
]

export function Problem() {
  return (
    <section id="problem" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuel-orange/30 bg-fuel-orange/5 text-fuel-orange text-xs font-semibold mb-4">
            El Problema
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Una industria de <span className="gradient-text-orange">$42B</span> desconectada
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            El sector de combustibles genera billones en ingresos, pero consumidores, gasolineros e inversionistas
            operan en silos con fricciones enormes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card hover glow={p.color === '#00E5FF' ? 'cyan' : p.color === '#FF6B35' ? 'orange' : 'purple'} className="h-full">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                  <p.icon className="w-6 h-6" style={{ color: p.color }} />
                </div>
                <h3 className="font-display font-semibold text-white text-lg mb-4">{p.title}</h3>
                <ul className="space-y-2">
                  {p.points.map(pt => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: p.color }} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
