'use client'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const DISTRIBUTION = [
  { name: 'Recompensas',     value: 40,    color: '#00E5FF' },
  { name: 'Reserva/Tesorería',value: 16,   color: '#7B2FBE' },
  { name: 'Equipo',          value: 12,    color: '#FF6B35' },
  { name: 'Liquidity Mining', value: 5.447, color: '#10B981' },
  { name: 'Gasolineras',     value: 5,     color: '#F59E0B' },
  { name: 'Venta Privada',   value: 5,     color: '#EC4899' },
  { name: 'Venta Pública I', value: 5,     color: '#6366F1' },
  { name: 'Venta Pública II',value: 4,     color: '#84CC16' },
  { name: 'Asesores',        value: 2,     color: '#F97316' },
  { name: 'Airdrops',        value: 2,     color: '#A78BFA' },
  { name: 'Venta Pública III',value: 3,    color: '#34D399' },
  { name: 'Liquidez Inicial',value: 0.523, color: '#60A5FA' },
]

const TOKEN_SALES = [
  { phase: 'Venta Privada', price: '$0.0010', vesting: '24 meses', color: '#EC4899' },
  { phase: 'Fase I',        price: '$0.0020', vesting: '12 meses', color: '#6366F1' },
  { phase: 'Fase II',       price: '$0.0030', vesting: '9 meses',  color: '#84CC16' },
  { phase: 'Fase III',      price: '$0.0040', vesting: '6 meses',  color: '#34D399' },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass rounded-xl px-3 py-2 border border-fuel-border text-xs">
      <div className="font-semibold text-white">{d.name}</div>
      <div style={{ color: d.color }}>{d.value}%</div>
    </div>
  )
}

export function Tokenomics() {
  return (
    <section id="tokenomics" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuel-purple/3 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuel-purple/30 bg-fuel-purple/5 text-fuel-purple text-xs font-semibold mb-4">
            Tokenomics
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            El token <span className="gradient-text">$FUEL</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            ERC-20 en Polygon PoS. Suministro fijo de 12,752,901,000 $FUEL. Diseñado para captura de valor, escasez y participación activa.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Pie chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DISTRIBUTION} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={2} dataKey="value">
                  {DISTRIBUTION.map((d, i) => (
                    <Cell key={i} fill={d.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-2"
          >
            {DISTRIBUTION.map(d => (
              <div key={d.name} className="flex items-center gap-2 glass rounded-lg px-3 py-2 border border-fuel-border">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-slate-400 flex-1 truncate">{d.name}</span>
                <span className="text-xs font-semibold text-white">{d.value}%</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Token sale phases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h3 className="font-display font-semibold text-white text-xl mb-6 text-center">Fases de venta</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TOKEN_SALES.map((s, i) => (
              <motion.div
                key={s.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-xl p-4 border border-fuel-border text-center"
              >
                <div className="text-xs text-slate-500 mb-1">{s.phase}</div>
                <div className="font-display font-bold text-xl text-white mb-1" style={{ color: s.color }}>{s.price}</div>
                <div className="text-xs text-slate-500">Vesting: {s.vesting}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12"
        >
          <h3 className="font-display font-semibold text-white text-xl mb-6 text-center">Sistema de Tiers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'EcoFUEL',   min: '100',  color: '#FF6B35', benefits: ['Recompensas base', 'Acceso a staking', 'Programa de referidos'] },
              { name: 'TurboFUEL',min: '200',  color: '#7B2FBE', benefits: ['Recompensas x1.5', 'Acceso prioritario', 'Descuentos exclusivos'] },
              { name: 'NitroFUEL',min: '500',  color: '#00E5FF', benefits: ['Recompensas x2', 'FuelLink Tank VIP', 'Gobernanza amplificada'] },
            ].map(t => (
              <div key={t.name} className="glass rounded-2xl p-5 border" style={{ borderColor: `${t.color}30` }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-bold text-lg" style={{ color: t.color }}>{t.name}</span>
                  <span className="text-xs text-slate-500 bg-fuel-card px-2 py-1 rounded-full border border-fuel-border">
                    ≥{t.min} $FUEL
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {t.benefits.map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: t.color }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
