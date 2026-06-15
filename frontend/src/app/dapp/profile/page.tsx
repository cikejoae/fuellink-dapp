'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Lock, BarChart2, Vote, Zap, TrendingUp, Layers, ExternalLink } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useFuelTokens } from '@/hooks/useFuelTokens'
import { useStaking } from '@/hooks/useStaking'
import { useSTO } from '@/hooks/useSTO'
import { useDAO } from '@/hooks/useDAO'
import { CONTRACTS, isDeployed } from '@/lib/contracts'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addrColor(addr: string) {
  const hue = parseInt(addr.slice(2, 6), 16) % 360
  return `hsl(${hue}, 65%, 55%)`
}

function fmtAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-fuel-border rounded ${className}`} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [copied, setCopied] = useState(false)

  const { fuelBalance, fuelxBalance, fuelxTotalSupply, tier, isLoading: tokensLoading } = useFuelTokens()
  const { allStakes, pendingRewards, isLoading: stakingLoading } = useStaking()
  const sto = useSTO(CONTRACTS.STO_NGS001)
  const { proposals, hasVotedMap } = useDAO()

  const isLoading = tokensLoading || stakingLoading

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-fuel-purple/10 border border-fuel-purple/20 flex items-center justify-center mb-6">
          <Layers className="w-10 h-10 text-fuel-purple" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-3">Tu perfil on-chain</h2>
        <p className="text-slate-400 max-w-sm mb-8">Conecta tu wallet para ver tu posición en el protocolo FuelLink.</p>
        <Button variant="primary" size="lg" onClick={openConnectModal}>Conectar Wallet</Button>
      </div>
    )
  }

  const color      = addrColor(address!)
  const activeStakes  = allStakes.filter(s => s.active)
  const expiredStakes = allStakes.filter(s => !s.active)
  const totalStakedByUser = allStakes.filter(s => s.active).reduce((a, s) => a + s.amount, 0)
  const fuelxPct = fuelxBalance != null && fuelxTotalSupply != null && fuelxTotalSupply > 0
    ? (fuelxBalance / fuelxTotalSupply) * 100
    : null
  const votingPower = fuelxBalance != null ? Math.sqrt(fuelxBalance) : null
  const votedProposals = proposals.filter(p => hasVotedMap[p.id])

  const copyAddress = () => {
    navigator.clipboard.writeText(address!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* ─── Identity header ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}33, ${color}66)`, border: `2px solid ${color}44` }}
            >
              {address!.slice(2, 4).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-white font-semibold text-base">{fmtAddr(address!)}</span>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copiado</span></>
                    : <><Copy className="w-3.5 h-3.5" />Copiar</>
                  }
                </button>
                <a
                  href={`https://amoy.polygonscan.com/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-fuel-cyan transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Polygonscan
                </a>
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}30`, color: tier.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.color }} />
                {tier.name}
                {tier.next && fuelBalance != null && (
                  <span className="font-normal opacity-60 ml-1">· {(tier.next - fuelBalance).toFixed(0)} para siguiente tier</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Position stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '$FUELx balance',    value: fuelxBalance,  fmt: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }), unit: '$FUELx', icon: Layers,    color: '#7B2FBE' },
          { label: '% del supply FUELx', value: fuelxPct,    fmt: (v: number) => v.toFixed(4) + '%',                                         unit: null,     icon: TrendingUp, color: '#00E5FF' },
          { label: 'Poder de voto',     value: votingPower,   fmt: (v: number) => '√' + fuelxBalance!.toFixed(0) + ' = ' + v.toFixed(2),     unit: 'votos',  icon: Vote,      color: '#FF6B35' },
          { label: 'FUEL stakeado',     value: totalStakedByUser, fmt: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }), unit: '$FUEL', icon: Lock, color: '#10B981' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full translate-x-4 -translate-y-4" style={{ background: `${s.color}08` }} />
              <div className="relative">
                <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                </div>
                {isLoading || s.value == null
                  ? <Skeleton className="h-6 w-20 mb-1" />
                  : <div className="font-display font-bold text-lg text-white leading-tight">{s.fmt(s.value)}</div>
                }
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Stakes history ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-fuel-purple" />
              <h2 className="font-display font-semibold text-white">Historial de stakes</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{activeStakes.length} activos</span>
              {expiredStakes.length > 0 && <span>· {expiredStakes.length} vencidos</span>}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : allStakes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 mb-3">Sin historial de stakes.</p>
              <a href="/dapp/stake" className="text-xs text-fuel-cyan hover:underline">Stakear ahora →</a>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-5 gap-4 text-xs text-slate-500 px-3 mb-2">
                <span>Monto</span>
                <span>$FUELx</span>
                <span>Duración</span>
                <span>Vence</span>
                <span className="text-right">Estado</span>
              </div>

              <div className="space-y-2">
                {allStakes.map(s => {
                  const expired = new Date() > s.endDate
                  const canUnstake = expired && s.active
                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl px-3 py-3 border transition-colors ${
                        s.active
                          ? 'border-fuel-border bg-fuel-bg/40'
                          : 'border-fuel-border/30 bg-transparent opacity-50'
                      }`}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {s.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $FUEL
                          </div>
                          <div className="text-xs text-slate-500 sm:hidden">
                            {s.lockWeeks} sem · {s.endDate.toLocaleDateString('es-MX')}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-fuel-purple hidden sm:block">
                          {s.fuelxMinted.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400 hidden sm:block">
                          {s.lockWeeks} semanas
                        </div>
                        <div className="text-xs text-slate-400 hidden sm:block">
                          {s.endDate.toLocaleDateString('es-MX')}
                        </div>
                        <div className="text-right">
                          {!s.active ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500 border border-slate-500/20">
                              Retirado
                            </span>
                          ) : canUnstake ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                              Listo para retirar
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-fuel-purple/15 text-fuel-purple border border-fuel-purple/20">
                              Activo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {pendingRewards != null && pendingRewards > 0.001 && (
                <div className="mt-4 flex items-center justify-between glass rounded-xl p-3 border border-emerald-500/20">
                  <div className="text-sm text-slate-300">
                    Recompensas pendientes:
                    <span className="text-emerald-400 font-semibold ml-1">{pendingRewards.toFixed(4)} $FUEL</span>
                  </div>
                  <a href="/dapp/stake" className="text-xs text-fuel-cyan hover:underline">Reclamar →</a>
                </div>
              )}
            </>
          )}
        </Card>
      </motion.div>

      {/* ─── STO Investments ──────────────────────────────────────────────── */}
      {isDeployed(CONTRACTS.STO_NGS001) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="w-4 h-4 text-fuel-orange" />
              <h2 className="font-display font-semibold text-white">Inversiones STO</h2>
            </div>

            {sto.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : sto.userShares > 0 ? (
              <div className="rounded-xl border border-fuel-border bg-fuel-bg/40 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {sto.stationName || 'NanoGAS Tijuana Norte'}
                    </div>
                    <div className="text-xs text-slate-500">{sto.stationId || 'NGS-001'} · Tijuana, BC</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    sto.fundingComplete
                      ? 'bg-fuel-purple/15 text-fuel-purple border border-fuel-purple/20'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {sto.fundingComplete ? 'Fondeado' : 'Activo'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Invertido', value: `$${sto.userShares.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT` },
                    { label: 'Participación', value: `${(sto.userSharePct / 100).toFixed(3)}%` },
                    { label: 'APY estimado', value: sto.projectedAPY > 0 ? `${(sto.projectedAPY / 100).toFixed(0)}%` : '16%' },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <div className="text-sm font-bold text-white">{item.value}</div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 mb-3">Sin inversiones STO activas.</p>
                <a href="/dapp/invest" className="text-xs text-fuel-orange hover:underline">Ver proyectos disponibles →</a>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* ─── DAO Activity ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-fuel-cyan" />
              <h2 className="font-display font-semibold text-white">Actividad en DAO</h2>
            </div>
            {proposals.length > 0 && (
              <span className="text-xs text-slate-500">
                {votedProposals.length} de {proposals.length} propuestas votadas
              </span>
            )}
          </div>

          {proposals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-3">Sin propuestas en el DAO todavía.</p>
              <a href="/dapp/governance" className="text-xs text-fuel-cyan hover:underline">Ir a Gobernanza →</a>
            </div>
          ) : votedProposals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 mb-3">No has votado en ninguna propuesta.</p>
              <a href="/dapp/governance" className="text-xs text-fuel-cyan hover:underline">Ver propuestas activas →</a>
            </div>
          ) : (
            <div className="space-y-2">
              {votedProposals.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-fuel-border px-4 py-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-sm text-white truncate">#{p.id} — {p.description.slice(0, 80)}{p.description.length > 80 ? '…' : ''}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.forVotes.toFixed(0)} a favor · {p.againstVotes.toFixed(0)} en contra
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border font-semibold flex-shrink-0"
                    style={{ background: `${p.stateColor}15`, borderColor: `${p.stateColor}30`, color: p.stateColor }}
                  >
                    {p.stateLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
