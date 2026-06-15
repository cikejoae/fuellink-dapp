'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Users, Clock, CheckCircle, AlertCircle, Loader2, Wallet } from 'lucide-react'
import { parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSTO, useSTOWrite, useUSDTAllowance, useUSDTBalance } from '@/hooks/useSTO'
import { CONTRACTS, isDeployed } from '@/lib/contracts'

// ─── Static upcoming STOs ─────────────────────────────────────────────────────
const UPCOMING = [
  {
    id: 'MGS-002',
    name: 'MicroGAS Monterrey Sur',
    type: 'MicroGasolinera',
    location: 'Monterrey, NL · México',
    target: 500_000,
    apy: '16–22%',
    roi: '24 meses',
    minInvestment: 1_000,
    desc: 'Microestación de 4 dispensarios en zona industrial. Capital para construcción y equipamiento.',
    tags: ['RWA', 'STO', 'DeFi'],
  },
  {
    id: 'MKT-003',
    name: 'MacroGAS CDMX Poniente',
    type: 'MacroGasolinera',
    location: 'CDMX · México',
    target: 2_000_000,
    apy: '12–16%',
    roi: '36 meses',
    minInvestment: 5_000,
    desc: 'Megaestación con tienda de conveniencia, lavado y taller. Próximamente disponible para inversión.',
    tags: ['RWA', 'STO', 'Premium'],
  },
]

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
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

// ─── Days remaining helper ────────────────────────────────────────────────────
function daysLeft(deadline: Date | null): number | null {
  if (!deadline) return null
  return Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 86_400_000))
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InvestPage() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  const [selected, setSelected]   = useState<string | null>(null)
  const [investAmt, setInvestAmt] = useState('')
  const [step, setStep]           = useState<'idle' | 'approving' | 'investing'>('idle')

  const stoDeployed = isDeployed(CONTRACTS.STO_NGS001)
  const sto         = useSTO(CONTRACTS.STO_NGS001)
  const stoWrite    = useSTOWrite(CONTRACTS.STO_NGS001)
  const allowance   = useUSDTAllowance(address, CONTRACTS.STO_NGS001)
  const usdtBalance = useUSDTBalance(address)

  // Resolve NGS-001 display data (live contract or static fallback)
  const ngsTarget    = stoDeployed && sto.fundingTarget > 0 ? sto.fundingTarget   : 250_000
  const ngsRaised    = stoDeployed ? sto.totalRaised   : 187_500
  const ngsMin       = stoDeployed && sto.minInvestment > 0 ? sto.minInvestment   : 500
  const ngsAPY       = stoDeployed && sto.projectedAPY > 0 ? `${(sto.projectedAPY / 100).toFixed(0)}%` : '16%'
  const ngsAPYNum    = stoDeployed && sto.projectedAPY > 0 ? sto.projectedAPY / 10_000 : 0.16
  const ngsFunded    = stoDeployed && sto.fundingComplete
  const ngsDeadline  = stoDeployed ? sto.fundingDeadline : null
  const ngsDays      = daysLeft(ngsDeadline)
  const ngsInvestors = stoDeployed ? sto.investorCount : 0
  const ngsName      = stoDeployed && sto.stationName ? sto.stationName : 'NanoGAS Tijuana Norte'
  const ngsStatus    = ngsFunded ? 'funded' : (ngsDays !== null && ngsDays === 0) ? 'closed' : 'open'
  const ngsUserShares   = stoDeployed ? sto.userShares   : 0
  const ngsUserSharePct = stoDeployed ? sto.userSharePct : 0

  // Approve → invest chained flow
  const amtWei        = investAmt ? parseUnits(investAmt, 6) : 0n
  const needsApproval = isConnected && allowance != null && amtWei > 0n && allowance < amtWei

  useEffect(() => {
    if (stoWrite.isSuccess && step === 'approving') {
      setStep('investing')
      stoWrite.invest(investAmt)
    } else if (stoWrite.isSuccess && step === 'investing') {
      setInvestAmt('')
      setStep('idle')
    }
  }, [stoWrite.isSuccess]) // eslint-disable-line

  const handleInvest = () => {
    if (!isConnected || !investAmt) return
    if (needsApproval) {
      setStep('approving')
      stoWrite.approveUSDT(investAmt)
    } else {
      setStep('investing')
      stoWrite.invest(investAmt)
    }
  }

  const isBusy    = stoWrite.isPending || stoWrite.isConfirming
  const btnLabel  = isBusy
    ? step === 'approving' ? 'Aprobando USDT...' : 'Confirmando inversión...'
    : needsApproval        ? 'Aprobar y invertir' : 'Confirmar inversión'

  // ─── Projected yield ────────────────────────────────────────────────────────
  const projectedYield = investAmt ? (parseFloat(investAmt) * ngsAPYNum).toFixed(2) : null

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Inversiones · STOs</h1>
        <p className="text-slate-400 text-sm mt-1">Invierte en gasolineras reales tokenizadas. Rendimientos en USDT, liquidez on-chain.</p>
      </div>

      {/* ─── STO Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* NGS-001 — Live card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            hover
            glow={ngsStatus === 'open' ? 'orange' : 'none'}
            className={`cursor-pointer transition-all ${selected === 'NGS-001' ? 'border-fuel-orange/50 shadow-[0_0_30px_rgba(255,107,53,0.15)]' : ''}`}
            onClick={() => setSelected(selected === 'NGS-001' ? null : 'NGS-001')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                ngsStatus === 'open'   ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                ngsStatus === 'funded' ? 'bg-fuel-purple/15 text-fuel-purple border border-fuel-purple/20' :
                'bg-slate-500/15 text-slate-400 border border-slate-500/20'
              }`}>
                {ngsStatus === 'open' ? '🟢 Activo' : ngsStatus === 'funded' ? '✅ Fondeado' : '⚫ Cerrado'}
              </span>
              <div className="flex items-center gap-1.5">
                {ngsUserShares > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    Invertido
                  </span>
                )}
                <span className="text-xs text-slate-500">NanoGasolinera</span>
              </div>
            </div>

            <h3 className="font-display font-bold text-white mb-1">{ngsName}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
              <MapPin className="w-3 h-3" /> Tijuana, BC · México
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Gasolinera NanoGAS en corredor comercial de alta demanda. Rendimiento proyectado via flujo de operación y apreciación del activo.
            </p>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">Recaudado</span>
                <span className="text-white font-semibold">
                  ${ngsRaised.toLocaleString()} / ${ngsTarget.toLocaleString()}
                </span>
              </div>
              <ProgressBar value={ngsRaised} max={ngsTarget} color={ngsStatus === 'open' ? '#FF6B35' : '#475569'} />
              <div className="text-right text-xs text-slate-600 mt-1">
                {ngsTarget > 0 ? ((ngsRaised / ngsTarget) * 100).toFixed(0) : 0}%
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-fuel-bg/60 rounded-lg p-2.5 text-center">
                <div className="text-xs text-slate-500">APY estimado</div>
                <div className="text-sm font-bold text-fuel-orange">{ngsAPY}</div>
              </div>
              <div className="bg-fuel-bg/60 rounded-lg p-2.5 text-center">
                <div className="text-xs text-slate-500">
                  {ngsDays !== null ? 'Días restantes' : 'ROI mín.'}
                </div>
                <div className="text-sm font-bold text-white">
                  {ngsDays !== null ? ngsDays : '18 meses'}
                </div>
              </div>
            </div>

            {/* Footer stats */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-fuel-border/50">
              {stoDeployed && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users className="w-3 h-3" /> {ngsInvestors} inversores
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 ml-auto">
                {['RWA', 'STO', 'Polygon'].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-fuel-border text-slate-500">{t}</span>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Upcoming STOs */}
        {UPCOMING.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.1 }}
          >
            <Card className="opacity-80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-fuel-cyan/10 text-fuel-cyan border border-fuel-cyan/20">
                  🔵 Próximo
                </span>
                <span className="text-xs text-slate-500">{p.type}</span>
              </div>

              <h3 className="font-display font-bold text-white mb-1">{p.name}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                <MapPin className="w-3 h-3" /> {p.location}
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">{p.desc}</p>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Objetivo</span>
                  <span className="text-slate-400">${p.target.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 bg-fuel-border rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-fuel-bg/60 rounded-lg p-2.5 text-center">
                  <div className="text-xs text-slate-500">APY estimado</div>
                  <div className="text-sm font-bold text-slate-400">{p.apy}</div>
                </div>
                <div className="bg-fuel-bg/60 rounded-lg p-2.5 text-center">
                  <div className="text-xs text-slate-500">ROI mín.</div>
                  <div className="text-sm font-bold text-slate-400">{p.roi}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.tags.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-fuel-border/50 text-slate-600">{t}</span>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Investment panel ──────────────────────────────────────────────── */}
      {selected === 'NGS-001' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-fuel-orange/30">
            <h2 className="font-display font-semibold text-white mb-5">Invertir en {ngsName}</h2>

            {/* User's current position */}
            {ngsUserShares > 0 && (
              <div className="flex items-center gap-3 glass rounded-xl p-3 border border-emerald-500/20 mb-5">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="text-xs text-slate-300">
                  Tu posición actual: <span className="text-white font-semibold">${ngsUserShares.toLocaleString()} USDT</span>
                  {ngsUserSharePct > 0 && (
                    <span className="text-slate-500"> · {(ngsUserSharePct / 100).toFixed(2)}% del fondo</span>
                  )}
                </div>
              </div>
            )}

            {/* Closed / funded state */}
            {ngsStatus !== 'open' && (
              <div className="flex items-center gap-3 glass rounded-xl p-4 border border-slate-500/20 mb-5 text-sm text-slate-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {ngsStatus === 'funded'
                  ? 'Este STO ha alcanzado su objetivo de financiamiento. Ya no acepta nuevas inversiones.'
                  : 'El plazo de financiamiento ha vencido. Ya no acepta nuevas inversiones.'}
              </div>
            )}

            {ngsStatus === 'open' && (
              <>
                {!isConnected ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm mb-4">Conecta tu wallet para invertir</p>
                    <Button variant="orange" size="md" onClick={openConnectModal}>
                      <Wallet className="w-4 h-4" /> Conectar wallet
                    </Button>
                  </div>
                ) : (
                  <>
                    {stoWrite.error && (
                      <div className="glass rounded-xl p-3 border border-red-500/20 text-xs text-red-400 mb-4">
                        {(stoWrite.error as Error).message?.slice(0, 120)}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div>
                        <label className="block text-xs text-slate-400 mb-2">Monto (USDT)</label>
                        <input
                          type="number"
                          min={ngsMin}
                          step="1"
                          placeholder={`Mín. $${ngsMin.toLocaleString()}`}
                          value={investAmt}
                          onChange={e => setInvestAmt(e.target.value)}
                          disabled={isBusy}
                          className="w-full bg-fuel-bg border border-fuel-border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-fuel-orange/50 transition-colors disabled:opacity-50"
                        />
                        {usdtBalance != null && (
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-slate-600">
                              Balance: {usdtBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
                            </span>
                            <button
                              onClick={() => setInvestAmt(usdtBalance.toFixed(2))}
                              className="text-xs text-fuel-orange font-semibold hover:text-orange-300"
                            >
                              MAX
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="glass rounded-xl p-4 border border-fuel-border">
                        <div className="text-xs text-slate-500 mb-2">Rendimiento proyectado anual</div>
                        <div className="text-xl font-bold text-fuel-orange">
                          {projectedYield ? `$${projectedYield} USDT` : '—'}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">Estimado al {ngsAPY} APY</div>
                      </div>
                    </div>

                    {needsApproval && (
                      <div className="flex items-center gap-2 text-xs text-yellow-400/80 mb-4">
                        <Clock className="w-3.5 h-3.5" />
                        Paso 1 de 2: Primero se aprobará el gasto de USDT, luego la inversión.
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="orange"
                        size="md"
                        className="flex-1"
                        onClick={handleInvest}
                        disabled={!investAmt || parseFloat(investAmt) < ngsMin || isBusy}
                      >
                        {isBusy ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> {btnLabel}</>
                        ) : (
                          <><CheckCircle className="w-4 h-4" /> {btnLabel}</>
                        )}
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => { setSelected(null); setInvestAmt(''); setStep('idle') }}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Refund option after deadline */}
            {ngsStatus === 'closed' && ngsUserShares > 0 && (
              <Button
                variant="secondary"
                size="md"
                className="mt-4"
                onClick={() => stoWrite.refund()}
                disabled={isBusy}
              >
                Solicitar reembolso
              </Button>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  )
}
