'use client'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Layers, Users, ArrowUpRight, Fuel } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getTier } from '@/lib/contracts'

// Mock data — replace with real contract reads via wagmi useReadContract
const MOCK = {
  fuelBalance:    1250,
  fuelxBalance:   84.3,
  stakingAPY:     12.5,
  totalStaked:    45_000_000,
  pendingRewards: 23.7,
  usdtEarned:     142.80,
}

const STATS = [
  { label: '$FUEL Balance',        value: MOCK.fuelBalance.toLocaleString(), unit: '$FUEL',   icon: Zap,       color: '#00E5FF' },
  { label: '$FUELx (Gobernanza)',   value: MOCK.fuelxBalance.toFixed(2),     unit: '$FUELx',  icon: Layers,    color: '#7B2FBE' },
  { label: 'Recompensas pendientes',value: MOCK.pendingRewards.toFixed(2),   unit: '$FUEL',   icon: TrendingUp,color: '#10B981' },
  { label: 'USDT de STOs',          value: `$${MOCK.usdtEarned.toFixed(2)}`, unit: 'USDT',    icon: Fuel,      color: '#FF6B35' },
]

const ACTIVITY = [
  { type: 'stake',    label: 'Staking 500 $FUEL',           time: 'hace 2h',    status: 'success' },
  { type: 'reward',   label: 'Recompensa +12.4 $FUEL',      time: 'hace 5h',    status: 'success' },
  { type: 'invest',   label: 'Inversión STO NanoGAS-001',   time: 'hace 1d',    status: 'success' },
  { type: 'dividend', label: 'Dividendo +$8.50 USDT',       time: 'hace 3d',    status: 'success' },
]

const STATUS_COLOR: Record<string, string> = { success: '#10B981', pending: '#F59E0B', failed: '#EF4444' }

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const tier = getTier(MOCK.fuelBalance)

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
          {tier.next && <span className="text-xs opacity-60 font-normal">· {tier.next - MOCK.fuelBalance} para siguiente tier</span>}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
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
                <div className="font-display font-bold text-2xl text-white">{s.value}</div>
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
              { label: 'Hacer Staking',    href: '/dapp/stake',      color: '#7B2FBE', desc: 'Bloquea $FUEL → gana $FUELx' },
              { label: 'Invertir en STO',  href: '/dapp/invest',     color: '#FF6B35', desc: 'Gasolineras tokenizadas' },
              { label: 'Votar en DAO',     href: '/dapp/governance', color: '#00E5FF', desc: 'Participa en gobernanza' },
            ].map(a => (
              <a key={a.label} href={a.href}>
                <Card hover className="cursor-pointer group" glow={a.color === '#7B2FBE' ? 'purple' : a.color === '#FF6B35' ? 'orange' : 'cyan'}>
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
              <h3 className="font-display font-semibold text-white">Staking activo</h3>
              <span className="text-xs text-fuel-cyan font-semibold">{MOCK.stakingAPY}% APY</span>
            </div>
            <div className="space-y-3">
              {[
                { amount: '500 $FUEL', weeks: '52 semanas', fuelx: '28.5 $FUELx', ends: '2026-06-14' },
                { amount: '750 $FUEL', weeks: '26 semanas', fuelx: '18.2 $FUELx', ends: '2025-12-14' },
              ].map((stake, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-fuel-border last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-white">{stake.amount}</div>
                    <div className="text-xs text-slate-500">{stake.weeks} · vence {stake.ends}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-fuel-purple">{stake.fuelx}</div>
                    <div className="text-xs text-slate-500">acumulado</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" href="/dapp/stake">Gestionar staking</Button>
            </div>
          </Card>
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="font-display font-semibold text-white mb-4">Actividad reciente</h2>
          <Card className="h-full">
            <div className="space-y-4">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-fuel-border last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: STATUS_COLOR[a.status] }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{a.label}</div>
                    <div className="text-xs text-slate-500">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
