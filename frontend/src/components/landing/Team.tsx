'use client'
import { motion } from 'framer-motion'
import { Linkedin } from 'lucide-react'

const TEAM = [
  { name: 'Erick R. Sánchez', role: 'CEO & Co-Founder', exp: '30 años · Combustibles & TI', bio: 'Master Mind. Liderazgo y desarrollo del negocio.' },
  { name: 'Edgar E. Sánchez', role: 'COO & Co-Founder', exp: '20 años · Combustibles & TI', bio: 'Liderazgo, operación e implementación del negocio.' },
  { name: 'Oscar Vazquez',    role: 'CPO & Co-Founder', exp: '25 años · Combustibles & Retail', bio: 'Liderazgo, estrategia y desarrollo de producto.' },
  { name: 'Ruben Matturano',  role: 'CFO',              exp: '30 años · Banca & Finanzas', bio: 'Liderazgo, alianzas estratégicas e inversiones.' },
]

const PARTNERS = ['WellLink Technology', 'INTECS', 'AllyGas']

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('')
}

const COLORS = ['#00E5FF', '#7B2FBE', '#FF6B35', '#10B981']

export function Team() {
  return (
    <section id="team" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuel-cyan/30 bg-fuel-cyan/5 text-fuel-cyan text-xs font-semibold mb-4">
            Equipo
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Fundadores con décadas en el sector
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            El equipo FuelLink combina más de 100 años de experiencia acumulada en combustibles, tecnología, finanzas y retail.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {TEAM.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 border border-fuel-border hover:border-fuel-cyan/20 transition-all duration-300 group text-center"
            >
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 font-display font-bold text-2xl"
                style={{ background: `${COLORS[i]}15`, border: `1px solid ${COLORS[i]}30`, color: COLORS[i] }}
              >
                {getInitials(m.name)}
              </div>
              <div className="font-display font-semibold text-white mb-1">{m.name}</div>
              <div className="text-xs font-semibold mb-2" style={{ color: COLORS[i] }}>{m.role}</div>
              <div className="text-xs text-slate-500 mb-3">{m.exp}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{m.bio}</p>
            </motion.div>
          ))}
        </div>

        {/* Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm text-slate-500 mb-6">Partners estratégicos</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {PARTNERS.map(p => (
              <div key={p} className="glass rounded-xl px-6 py-3 border border-fuel-border text-sm font-semibold text-slate-300">
                {p}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
