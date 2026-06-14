'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, TrendingUp, Users, DollarSign, ExternalLink, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const PROJECTS = [
  {
    id: 'NGS-001',
    name: 'NanoGAS Tijuana Norte',
    type: 'NanoGasolinera',
    location: 'Tijuana, BC · México',
    target:  250_000,
    raised:  187_500,
    apy:     '14–18%',
    minInvestment: 500,
    roi: '18 meses',
    status: 'open',
    tags: ['RWA', 'STO', 'Polygon'],
    desc: 'Gasolinera NanoGAS en corredor comercial de alta demanda. Rendimiento proyectado via flujo de operación y apreciación del activo.',
  },
  {
    id: 'MGS-002',
    name: 'MicroGAS Monterrey Sur',
    type: 'MicroGasolinera',
    location: 'Monterrey, NL · México',
    target:  500_000,
    raised:  125_000,
    apy:     '16–22%',
    minInvestment: 1_000,
    roi: '24 meses',
    status: 'open',
    tags: ['RWA', 'STO', 'DeFi'],
    desc: 'Microestación de 4 dispensarios en zona industrial. Capital para construcción y equipamiento.',
  },
  {
    id: 'MKT-003',
    name: 'MacroGAS CDMX Poniente',
    type: 'MacroGasolinera',
    location: 'CDMX · México',
    target: 2_000_000,
    raised: 0,
    apy: '12–16%',
    minInvestment: 5_000,
    roi: '36 meses',
    status: 'coming',
    tags: ['RWA', 'STO', 'Premium'],
    desc: 'Megaestación con tienda de conveniencia, lavado y taller. Próximamente disponible para inversión.',
  },
]

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="w-full h-1.5 bg-fuel-border rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  )
}

export default function InvestPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [investAmt, setInvestAmt] = useState('')

  const proj = PROJECTS.find(p => p.id === selected)

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Inversiones · STOs</h1>
        <p className="text-slate-400 text-sm mt-1">Invierte en gasolineras reales tokenizadas. Rendimientos en USDT, liquidez on-chain.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {PROJECTS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              hover
              glow={p.status === 'open' ? 'orange' : 'none'}
              className={`cursor-pointer transition-all ${selected === p.id ? 'border-fuel-orange/50 shadow-[0_0_30px_rgba(255,107,53,0.15)]' : ''}`}
              onClick={() => setSelected(p.id === selected ? null : p.id)}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  p.status === 'open'   ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                  p.status === 'coming' ? 'bg-fuel-cyan/10 text-fuel-cyan border border-fuel-cyan/20' :
                  'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                }`}>
                  {p.status === 'open' ? '🟢 Abierto' : p.status === 'coming' ? '🔵 Próximo' : 'Cerrado'}
                </span>
                <span className="text-xs text-slate-500">{p.type}</span>
              </div>

              <h3 className="font-display font-bold text-white mb-1">{p.name}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                <MapPin className="w-3 h-3" />
                {p.location}
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{p.desc}</p>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Recaudado</span>
                  <span className="text-white font-semibold">${p.raised.toLocaleString()} / ${p.target.toLocaleString()}</span>
                </div>
                <ProgressBar value={p.raised} max={p.target} color={p.status === 'open' ? '#FF6B35' : '#475569'} />
                <div className="text-right text-xs text-slate-600 mt-1">{((p.raised / p.target) * 100).toFixed(0)}%</div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-fuel-bg/60 rounded-lg p-2.5 text-center">
                  <div className="text-xs text-slate-500">APY estimado</div>
                  <div className="text-sm font-bold text-fuel-orange">{p.apy}</div>
                </div>
                <div className="bg-fuel-bg/60 rounded-lg p-2.5 text-center">
                  <div className="text-xs text-slate-500">ROI mín.</div>
                  <div className="text-sm font-bold text-white">{p.roi}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-fuel-border text-slate-500">{t}</span>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Investment panel */}
      {selected && proj && proj.status === 'open' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-fuel-orange/30">
            <h2 className="font-display font-semibold text-white mb-5">Invertir en {proj.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Monto (USDT)</label>
                <input
                  type="number"
                  placeholder={`Mín. $${proj.minInvestment}`}
                  value={investAmt}
                  onChange={e => setInvestAmt(e.target.value)}
                  className="w-full bg-fuel-bg border border-fuel-border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-fuel-orange/50 transition-colors"
                />
              </div>
              <div className="glass rounded-xl p-4 border border-fuel-border">
                <div className="text-xs text-slate-500 mb-2">Rendimiento proyectado anual</div>
                <div className="text-xl font-bold text-fuel-orange">
                  ${investAmt ? (parseFloat(investAmt) * 0.16).toFixed(2) : '—'} USDT
                </div>
                <div className="text-xs text-slate-600 mt-1">Estimado al {proj.apy} APY</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="orange" size="md" className="flex-1" onClick={() => alert('Integra contrato STO')}>
                Confirmar inversión <CheckCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="md" onClick={() => setSelected(null)}>
                Cancelar
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
