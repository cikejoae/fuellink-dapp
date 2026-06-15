'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Lock, Info, Calculator, ChevronDown } from 'lucide-react'
import { useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useFuelTokens } from '@/hooks/useFuelTokens'
import { useStaking, useStakeWrite, useAllowance } from '@/hooks/useStaking'

function calcFuelx(amount: number, weeks: number): number {
  if (amount <= 0 || weeks <= 0) return 0
  return +(amount * ((1 / 129) * weeks + 1)).toFixed(4)
}

const DURATION_OPTIONS = [
  { weeks: 4,   label: '1 mes'   },
  { weeks: 13,  label: '3 meses' },
  { weeks: 26,  label: '6 meses' },
  { weeks: 52,  label: '1 año'   },
  { weeks: 104, label: '2 años'  },
]

// ─── Simulator (no wallet required) ──────────────────────────────────────────
function StakingSimulator() {
  const [open, setOpen]       = useState(false)
  const [simAmt, setSimAmt]   = useState('1000')
  const [simWeeks, setSimWeeks] = useState(52)

  const amt     = parseFloat(simAmt) || 0
  const fuelxOut = calcFuelx(amt, simWeeks)
  const multiplier = amt > 0 ? (fuelxOut / amt).toFixed(3) : '—'

  // Comparison across all durations
  const rows = DURATION_OPTIONS.map(o => ({
    ...o,
    fuelx:  calcFuelx(amt, o.weeks),
    mult:   amt > 0 ? (calcFuelx(amt, o.weeks) / amt).toFixed(3) : '—',
  }))

  return (
    <Card className="border-fuel-border/50">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-fuel-purple" />
          <span className="font-display font-semibold text-white text-sm">Simulador de staking</span>
          <span className="text-xs text-slate-500">· sin wallet requerida</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Cantidad $FUEL</label>
                  <input
                    type="number"
                    min="1"
                    value={simAmt}
                    onChange={e => setSimAmt(e.target.value)}
                    className="w-full bg-fuel-bg border border-fuel-border rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-fuel-purple/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Duración</label>
                  <select
                    value={simWeeks}
                    onChange={e => setSimWeeks(Number(e.target.value))}
                    className="w-full bg-fuel-bg border border-fuel-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-fuel-purple/50 transition-colors"
                  >
                    {DURATION_OPTIONS.map(o => (
                      <option key={o.weeks} value={o.weeks}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Result highlight */}
              <div className="glass rounded-xl p-4 border border-fuel-purple/20 text-center">
                <div className="text-xs text-slate-500 mb-1">Recibirías</div>
                <div className="text-2xl font-display font-bold text-fuel-purple">{fuelxOut.toLocaleString(undefined, { maximumFractionDigits: 2 })} $FUELx</div>
                <div className="text-xs text-slate-500 mt-1">× {multiplier} multiplicador</div>
              </div>

              {/* Comparison table */}
              <div>
                <div className="text-xs text-slate-500 mb-2">Comparativa para {amt.toLocaleString()} $FUEL</div>
                <div className="space-y-1.5">
                  {rows.map(r => (
                    <div
                      key={r.weeks}
                      onClick={() => setSimWeeks(r.weeks)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-all ${
                        r.weeks === simWeeks
                          ? 'bg-fuel-purple/10 border border-fuel-purple/25'
                          : 'border border-transparent hover:border-fuel-border'
                      }`}
                    >
                      <span className={`text-xs ${r.weeks === simWeeks ? 'text-white font-semibold' : 'text-slate-500'}`}>{r.label}</span>
                      <div className="text-right">
                        <span className={`text-xs font-semibold ${r.weeks === simWeeks ? 'text-fuel-purple' : 'text-slate-400'}`}>
                          {amt > 0 ? r.fuelx.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'} $FUELx
                        </span>
                        <span className="text-xs text-slate-600 ml-2">×{r.mult}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default function StakePage() {
  const { address, isConnected } = useAccount()
  const { fuelBalance, fuelRaw } = useFuelTokens()
  const { stakes, pendingRewards, isLoading } = useStaking()
  const allowance = useAllowance(address)
  const { approveAndStake, stakeAfterApproval, unstake, claimRewards, isPending, isConfirming, isSuccess, error } = useStakeWrite()

  const [amount, setAmount]           = useState('')
  const [selectedWeeks, setSelectedWeeks] = useState(52)
  const [step, setStep]               = useState<'idle' | 'approving' | 'staking'>('idle')

  const amt     = parseFloat(amount) || 0
  const fuelxOut = calcFuelx(amt, selectedWeeks)
  const amtWei  = amt > 0 ? parseUnits(amount, 18) : 0n
  const needsApproval = allowance != null && amtWei > 0n && allowance < amtWei

  // After approval tx confirms, auto-proceed to stake
  useEffect(() => {
    if (isSuccess && step === 'approving') {
      setStep('staking')
      stakeAfterApproval(amount, selectedWeeks)
    } else if (isSuccess && step === 'staking') {
      setAmount('')
      setStep('idle')
    }
  }, [isSuccess]) // eslint-disable-line

  const handleStakeClick = () => {
    if (!isConnected || !amt) return
    if (needsApproval) {
      setStep('approving')
      approveAndStake(amount, selectedWeeks)
    } else {
      setStep('staking')
      stakeAfterApproval(amount, selectedWeeks)
    }
  }

  const isBusy     = isPending || isConfirming
  const btnLabel   = isBusy
    ? step === 'approving' ? 'Aprobando...' : 'Stakeando...'
    : needsApproval ? 'Aprobar y Stakear' : 'Stakear $FUEL'

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Staking</h1>
        <p className="text-slate-400 text-sm mt-1">Bloquea $FUEL para ganar $FUELx y participar en la gobernanza DAO.</p>
      </div>

      <div className="flex items-start gap-3 glass rounded-xl p-4 border border-fuel-cyan/20">
        <Info className="w-4 h-4 text-fuel-cyan mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          $FUELx = $FUEL × ((1/129) × semanas + 1). Mayor tiempo de bloqueo = más $FUELx = mayor peso de voto en la DAO y acceso a tiers premium.
        </p>
      </div>

      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 text-xs text-red-400">
          {(error as Error).message?.slice(0, 120)}
        </div>
      )}

      {/* Stake form */}
      <Card>
        <h2 className="font-display font-semibold text-white mb-5">Nuevo stake</h2>

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
              onClick={() => fuelBalance != null && setAmount(fuelBalance.toFixed(6))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fuel-cyan font-semibold hover:text-cyan-300"
            >
              MAX
            </button>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-600">
              Balance: {fuelBalance != null ? fuelBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '…'} $FUEL
            </span>
          </div>
        </div>

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

        <div className="glass rounded-xl p-4 border border-fuel-border mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">$FUEL a bloquear</span>
            <span className="text-white font-semibold">{amt || '–'} $FUEL</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Período</span>
            <span className="text-white">{DURATION_OPTIONS.find(o => o.weeks === selectedWeeks)?.label}</span>
          </div>
          {needsApproval && (
            <div className="flex justify-between text-xs text-yellow-400/80">
              <span>Paso 1 de 2</span>
              <span>Requiere aprobación de token</span>
            </div>
          )}
          <div className="border-t border-fuel-border/50 pt-2 flex justify-between text-sm">
            <span className="text-slate-400">$FUELx obtenidos</span>
            <span className="font-bold text-fuel-purple">{amt ? fuelxOut : '–'} $FUELx</span>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleStakeClick}
          disabled={!isConnected || !amt || isBusy}
        >
          {isBusy ? btnLabel : btnLabel}
          <Lock className="w-4 h-4" />
        </Button>
      </Card>

      {/* Pending rewards */}
      {pendingRewards != null && pendingRewards > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Recompensas disponibles</div>
              <div className="text-2xl font-display font-bold text-emerald-400 mt-1">{pendingRewards.toFixed(4)} $FUEL</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => claimRewards()} disabled={isBusy}>
              Reclamar
            </Button>
          </div>
        </Card>
      )}

      {/* Staking simulator */}
      <StakingSimulator />

      {/* Active stakes */}
      <Card>
        <h2 className="font-display font-semibold text-white mb-4">Stakes activos</h2>
        {isLoading ? (
          <div className="text-sm text-slate-500 py-4 text-center">Cargando...</div>
        ) : stakes.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center">Sin stakes activos.</div>
        ) : (
          <div className="space-y-3">
            {stakes.map(s => {
              const canUnstake = new Date() >= s.endDate
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between py-3 border-b border-fuel-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-fuel-purple/15 border border-fuel-purple/25 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-fuel-purple" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{s.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $FUEL</div>
                      <div className="text-xs text-slate-500">Vence: {s.endDate.toLocaleDateString('es-MX')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-fuel-purple">{s.fuelxMinted.toFixed(2)} $FUELx</div>
                    <button
                      disabled={!canUnstake || isBusy}
                      onClick={() => canUnstake && unstake(s.id)}
                      className="text-xs text-slate-600 disabled:opacity-40 hover:text-red-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {canUnstake ? 'Unstake' : `${s.lockWeeks} sem lock`}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
