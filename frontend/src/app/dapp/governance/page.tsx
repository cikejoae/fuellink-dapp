'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Vote, Clock, CheckCircle2, XCircle, Plus, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const PROPOSALS = [
  {
    id: 1,
    title: 'Reducir fee de vendedores de 5.5% a 4.0%',
    description: 'Propuesta para aumentar la competitividad del token $FUEL en mercados secundarios reduciendo la fee de venta.',
    status: 'active',
    forVotes: 2_840_000,
    againstVotes: 580_000,
    totalVotes: 3_420_000,
    quorum: 4_000_000,
    endDate: '2025-07-01',
    proposer: '0x1234...abcd',
  },
  {
    id: 2,
    title: 'Incluir gasolinera Sonora GAS-08 en el protocolo',
    description: 'Propuesta para tokenizar una nueva estación en Hermosillo, Sonora. Capacidad: 4 dispensarios, volumen proyectado 80,000L/mes.',
    status: 'active',
    forVotes: 5_120_000,
    againstVotes: 210_000,
    totalVotes: 5_330_000,
    quorum: 4_000_000,
    endDate: '2025-06-28',
    proposer: '0xabcd...5678',
  },
  {
    id: 3,
    title: 'Aumentar recompensas de staking del 12% al 15% APY',
    description: 'Ajuste de parámetros tokenómicos para aumentar incentivos de staking y reducir presión de venta.',
    status: 'passed',
    forVotes: 7_800_000,
    againstVotes: 400_000,
    totalVotes: 8_200_000,
    quorum: 4_000_000,
    endDate: '2025-06-10',
    proposer: '0xef01...9abc',
  },
  {
    id: 4,
    title: 'Añadir par $FUEL/MATIC en Uniswap v3',
    description: 'Ampliar la liquidez del token $FUEL añadiendo un nuevo par en Uniswap v3 sobre Polygon.',
    status: 'rejected',
    forVotes: 1_200_000,
    againstVotes: 3_500_000,
    totalVotes: 4_700_000,
    quorum: 4_000_000,
    endDate: '2025-06-05',
    proposer: '0xdead...beef',
  },
]

const STATUS_CONFIG = {
  active:   { label: 'Activa',    color: '#00E5FF', Icon: Clock },
  passed:   { label: 'Aprobada',  color: '#10B981', Icon: CheckCircle2 },
  rejected: { label: 'Rechazada', color: '#EF4444', Icon: XCircle },
  pending:  { label: 'Pendiente', color: '#F59E0B', Icon: AlertCircle },
}

function VoteBar({ forPct, againstPct }: { forPct: number; againstPct: number }) {
  return (
    <div className="w-full h-1.5 bg-fuel-border rounded-full overflow-hidden flex">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${forPct}%` }}
        transition={{ duration: 0.8 }}
        className="h-full bg-emerald-500"
      />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${againstPct}%` }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="h-full bg-red-500"
      />
    </div>
  )
}

export default function GovernancePage() {
  const [voting, setVoting] = useState<number | null>(null)
  const fuelxBalance = 84.3

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Gobernanza DAO</h1>
          <p className="text-slate-400 text-sm mt-1">Vota con $FUELx. Umbral: 75% votos a favor para aprobar.</p>
        </div>
        <div className="glass rounded-xl px-4 py-2 border border-fuel-purple/30 text-sm">
          <span className="text-slate-400">Tu poder: </span>
          <span className="font-bold text-fuel-purple">{fuelxBalance} $FUELx</span>
        </div>
      </div>

      {/* Proposals */}
      <div className="space-y-4">
        {PROPOSALS.map((p, i) => {
          const { label, color, Icon } = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]
          const forPct     = (p.forVotes / p.totalVotes) * 100
          const againstPct = (p.againstVotes / p.totalVotes) * 100
          const quorumPct  = Math.min((p.totalVotes / p.quorum) * 100, 100)
          const isActive   = p.status === 'active'

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card hover={isActive} glow={isActive ? 'purple' : 'none'}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}30`, background: `${color}10` }}>
                        <Icon className="w-3 h-3 inline mr-1" />{label}
                      </span>
                      <span className="text-xs text-slate-600">#{p.id} · {p.endDate}</span>
                    </div>
                    <h3 className="font-display font-semibold text-white">{p.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{p.description}</p>
                  </div>
                </div>

                {/* Vote breakdown */}
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-400">A favor: {forPct.toFixed(1)}%</span>
                    <span className="text-red-400">En contra: {againstPct.toFixed(1)}%</span>
                  </div>
                  <VoteBar forPct={forPct} againstPct={againstPct} />

                  {/* Quorum */}
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-500">Quórum: {quorumPct.toFixed(0)}% de {(p.quorum / 1_000_000).toFixed(0)}M votos requeridos</span>
                    {p.totalVotes >= p.quorum
                      ? <span className="text-emerald-400 font-semibold">✓ Quórum alcanzado</span>
                      : <span className="text-yellow-500">Quórum pendiente</span>
                    }
                  </div>
                  <div className="w-full h-1 bg-fuel-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${quorumPct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full bg-fuel-cyan/40 rounded-full"
                    />
                  </div>
                </div>

                {/* Actions */}
                {isActive && (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setVoting(p.id); alert('Voto simulado. Integra useWriteContract()') }}
                      disabled={!fuelxBalance}
                    >
                      <Vote className="w-3.5 h-3.5" /> Votar a favor
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 border border-red-500/20 text-red-400 hover:bg-red-500/10"
                      onClick={() => alert('Voto en contra simulado')}
                    >
                      Votar en contra
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Create proposal */}
      <Card className="border-dashed border-fuel-border/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-fuel-purple/10 border border-fuel-purple/20 flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5 text-fuel-purple" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">Nueva propuesta</div>
            <div className="text-xs text-slate-500">Requiere 500 $FUELx bloqueados para proponer</div>
          </div>
          <Button variant="secondary" size="sm" disabled={fuelxBalance < 500}>
            Proponer
          </Button>
        </div>
      </Card>
    </div>
  )
}
