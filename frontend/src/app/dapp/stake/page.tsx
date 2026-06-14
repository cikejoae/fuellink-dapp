'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Lock, TrendingUp, Info } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

// FUELx formula: S * ((1/129) * weeks + 1)
function calcFuelx(amount: number, weeks: number): number {
  if (amount <= 0 || weeks <= 0) return 0
  return +(amount * ((1 / 129) * weeks + 1)).toFixed(4)
}

const DURATION_OPTIONS = [
  { weeks: 4,   label: '1 mes',    mult: 1.03 },
  { weeks: 13,  label: '3 meses',  mult: 1.10 },
  { weeks: 26,  label: '6 meses',  mult: 1.20 },
  { weeks: 52,  label: '1 año',    mult: 1.40 },
  { weeks: 104, label: '2 años',   mult: 1.81 },
]

export default function StakePage() {
  const { isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [selectedWeeks, setSelectedWeeks] = useState(52)
  const [loading, setLoading] = useState(false)

  const amt = parseFloat(amount) || 0
  const fuelxOut = calcFuelx(amt, selectedWeeks)

  const handleStake = async () => {
    if (!isConnected || !amt) return
    setLoading(true)
    // TODO: call contract via wagmi writeContract
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    alert('Stake simulado. Integra tu contrato en src/lib/contracts.ts')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Staking</h1>
        <p className="text-slate-400 text-sm mt-1">Bloquea $FUEL para ganar $FUELx y participar en la gobernanza DAO.</p>
      </div>

      {/* Explainer */}
      <div className="flex items-start gap-3 glass rounded-xl p-4 border border-fuel-cyan/20">
        <Info className="w-4 h-4 text-fuel-cyan mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          $FUELx = $FUEL × ((1/129) × semanas + 1). Mayor tiempo de bloqueo = más $FUELx = mayor peso de voto en la DAO y acceso a tiers premium.
        </p>
      </div>

      {/* Stake form */}
      <Card>
        <h2 className="font-display font-semibold text-white mb-5">Nuevo stake</h2>

        {/* Amount input */}
        <div className="mb-5">
          <label className="block text-xs text-slate-400 mb-2">Cantidad de $FUEL</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-fuel-bg border border-fuel-border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-fuel-cyan/50 transition-colors pr-20"
            />
            <button
              onClick={() => setAmount('1250')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fuel-cyan font-semibold hover:text-cyan-300"
            >
              MAX
            </button>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-600">Balance: 1,250 $FUEL</span>
          </div>
        </div>

        {/* Duration */}
        <div className="mb-6">
          <label className="block text-xs text-slate-400 mb-2">Duración de bloqueo</label>
          <div className="grid grid-cols-5 gap-2">
            {DURATION_OPTIONS.map(opt => (
              <button
                key={opt.weeks}
                onClick={() => setSelectedWeeks(opt.weeks)}
                className={`rounded-xl py-2 px-1 text-xs font-medium transition-all ${
                  selectedWeeks === opt.weeks
                    ? 'bg-fuel-cyan/15 border border-fuel-cyan/40 text-fuel-cyan'
                    : 'border border-fuel-border text-slate-500 hover:border-fuel-cyan/20 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="glass rounded-xl p-4 border border-fuel-border mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">$FUEL a bloquear</span>
            <span className="text-white font-semibold">{amt || '–'} $FUEL</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Período</span>
            <span className="text-white">{DURATION_OPTIONS.find(o => o.weeks === selectedWeeks)?.label}</span>
          </div>
          <div className="border-t border-fuel-border/50 pt-2 flex justify-between text-sm">
            <span className="text-slate-400">$FUELx obtenidos</span>
            <span className="font-bold text-fuel-purple">{amt ? fuelxOut : '–'} $FUELx</span>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStake}
          disabled={!isConnected || !amt || loading}
        >
          {loading ? 'Procesando...' : 'Stakear $FUEL'}
          <Lock className="w-4 h-4" />
        </Button>
      </Card>

      {/* Active stakes */}
      <Card>
        <h2 className="font-display font-semibold text-white mb-4">Stakes activos</h2>
        <div className="space-y-3">
          {[
            { id: 1, amount: 500,  weeks: 52,  fuelx: 28.49, endDate: '2026-06-14', canUnstake: false },
            { id: 2, amount: 750,  weeks: 26,  fuelx: 18.18, endDate: '2025-12-14', canUnstake: false },
          ].map(s => (
            <div key={s.id} className="flex items-center justify-between py-3 border-b border-fuel-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-fuel-purple/15 border border-fuel-purple/25 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-fuel-purple" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{s.amount.toLocaleString()} $FUEL</div>
                  <div className="text-xs text-slate-500">Vence: {s.endDate}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-fuel-purple">{s.fuelx} $FUELx</div>
                <button
                  disabled={!s.canUnstake}
                  className="text-xs text-slate-600 disabled:opacity-40 hover:text-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  Unstake
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
