'use client'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Layers, ArrowUpRight, Fuel } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useFuelTokens } from '@/hooks/useFuelTokens'
import { useStaking } from '@/hooks/useStaking'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-fuel-border rounded ${className}`} />
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { fuelBalance, fuelxBalance, tier, isLoading: tokensLoading } = useFuelTokens()
  const { stakes, pendingRewards, totalStaked, isLoading: stakingLoading } = useStaking()

  const isLoading = tokensLoading || stakingLoading

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-fuel-cyan/10 border border-fuel-cyan/20 flex items-center justify-center mb-6">
          <Zap className="w-10 h-10 text-fuel-cyan" />
        </div>
        <h2 className="font-display text-2xl font-bold text-white mb-3">Conecta tu wallet</h2>
        <p className="text-slate-400 max-w-sm mb-8">Para acceder al dashboard, conecta tu wallet de Polygon PoS.</p>
        <Button variant="primary" size="lg">Conectar Wallet</Button>
      </div>
    )
  }

  const stats = [
    { label: '$FUEL Balance',         value: fuelBalance  != null ? fuelBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : null, unit: '$FUEL',  icon: Zap,       color: '#00E5FF' },
    { label: '$FUELx (Gobernanza)',    value: fuelxBalance != null ? fuelxBalance.toFixed(2)                                              : null, unit: '$FUELx', icon: Layers,    color: '#7B2FBE' },
    { label: 'Recompensas pendientes', value: pendingRewards != null ? pendingRewards.toFixed(2)                                          : null, unit: '$FUEL',  icon: TrendingUp,color: '#10B981' },
    { label: 'Total stakeado (proto)', value: totalStaked != null ? (totalStaked / 1_000_000).toFixed(2) + 'M'                            : null, unit: '$FUEL',  icon: Fuel,      color: '#FF6B35' },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 font-mono mt-1">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold"
          style={{ background: `${tier.color}10`, borderColor: `${tier.color}30`, color: tier.color }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: tier.color }} />
          {tier.name}
          {tier.next && fuelBalance != null && (
            <span className="text-xs opacity-60 font-normal">· {(tier.next - fuelBalance).toFixed(0)} para siguiente tier</span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8" style={{ background: `${s.color}08` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600" />
                </div>
                {isLoading || s.value == null
                  ? <Skeleton className="h-8 w-24 mb-1" />
                  : <div className="font-display font-bold text-2xl text-white">{s.value}</div>
                }
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display font-semibold text-white">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Hacer Staking',    href: '/dapp/stake',      color: '#7B2FBE', glow: 'purple' as const, desc: 'Bloquea $FUEL → gana $FUELx' },
              { label: 'Invertir en STO',  href: '/dapp/invest',     color: '#FF6B35', glow: 'orange' as const, desc: 'Gasolineras tokenizadas' },
              { label: 'Votar en DAO',     href: '/dapp/governance', color: '#00E5FF', glow: 'cyan'   as const, desc: 'Participa en gobernanza' },
            ].map(a => (
              <a key={a.label} href={a.href}>
                <Card hover className="cursor-pointer group" glow={a.glow}>
                  <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                    <Zap className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="font-semibold text-white text-sm mb-1">{a.label}</div>
                  <div className="text-xs text-slate-500">{a.desc}</div>
                </Card>
              </a>
            ))}
          </div>

          {/* Staking summary */}
          <Card className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white">Stakes activos</h3>
              {pendingRewards != null && pendingRewards > 0 && (
                <span className="text-xs text-emerald-400 font-semibold">+{pendingRewards.toFixed(2)} $FUEL pendiente</span>
              )}
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : stakes.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Sin stakes activos. <a href="/dapp/stake" className="text-fuel-cyan hover:underline">Stakear ahora →</a></p>
            ) : (
              <div className="space-y-3">
                {stakes.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3 border-b border-fuel-border last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-white">{s.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $FUEL</div>
                      <div className="text-xs text-slate-500">{s.lockWeeks} sem · vence {s.endDate.toLocaleDateString('es-MX')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-fuel-purple">{s.fuelxMinted.toFixed(2)} $FUELx</div>
                      <div className="text-xs text-slate-500">acumulado</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" href="/dapp/stake">Gestionar staking</Button>
            </div>
          </Card>
        </div>

        {/* Info panel */}
        <div>
          <h2 className="font-display font-semibold text-white mb-4">Tu posición</h2>
          <Card className="h-full space-y-4">
            {[
              { label: 'Stakes activos',    value: isLoading ? '…' : String(stakes.length)                                         },
              { label: 'FUELx total',       value: isLoading || fuelxBalance == null ? '…' : fuelxBalance.toFixed(2) + ' $FUELx'   },
              { label: 'Poder de voto',     value: isLoading || fuelxBalance == null ? '…' : `√${fuelxBalance.toFixed(0)} = ${Math.sqrt(fuelxBalance).toFixed(2)}` },
              { label: 'Protocolo stakeado',value: isLoading || totalStaked == null ? '…' : (totalStaked / 1_000_000).toFixed(1) + 'M $FUEL' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between pb-3 border-b border-fuel-border last:border-0 last:pb-0">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
