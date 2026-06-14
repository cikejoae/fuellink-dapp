'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Vote, Clock, CheckCircle2, XCircle, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useFuelTokens } from '@/hooks/useFuelTokens'
import { useDAO, useVote } from '@/hooks/useDAO'
import type { Proposal } from '@/hooks/useDAO'

const STATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Debate':    Clock,
  'Votación':  Vote,
  'En cola':   AlertCircle,
  'Ejecutada': CheckCircle2,
  'Rechazada': XCircle,
  'Cancelada': XCircle,
}

function VoteBar({ forPct, againstPct }: { forPct: number; againstPct: number }) {
  return (
    <div className="w-full h-1.5 bg-fuel-border rounded-full overflow-hidden flex">
      <motion.div initial={{ width: 0 }} animate={{ width: `${forPct}%` }} transition={{ duration: 0.8 }} className="h-full bg-emerald-500" />
      <motion.div initial={{ width: 0 }} animate={{ width: `${againstPct}%` }} transition={{ duration: 0.8, delay: 0.1 }} className="h-full bg-red-500" />
    </div>
  )
}

const QUORUM = 4_000_000

export default function GovernancePage() {
  const { isConnected, address } = useAccount()
  const { fuelxBalance } = useFuelTokens()
  const { proposals, hasVotedMap } = useDAO()
  const { vote, propose, isPending, isConfirming, error } = useVote()
  const [showPropose, setShowPropose] = useState(false)
  const [propText, setPropText]       = useState('')
  const isBusy = isPending || isConfirming

  const canPropose = (fuelxBalance ?? 0) >= 500

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Gobernanza DAO</h1>
          <p className="text-slate-400 text-sm mt-1">Vota con $FUELx. Umbral: 75% votos a favor para aprobar.</p>
        </div>
        <div className="glass rounded-xl px-4 py-2 border border-fuel-purple/30 text-sm">
          <span className="text-slate-400">Tu poder: </span>
          <span className="font-bold text-fuel-purple">
            {fuelxBalance != null ? fuelxBalance.toFixed(2) : '…'} $FUELx
          </span>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 text-xs text-red-400">
          {(error as Error).message?.slice(0, 120)}
        </div>
      )}

      {/* Proposals */}
      {proposals.length === 0 ? (
        <Card>
          <p className="text-slate-500 text-sm text-center py-8">No hay propuestas en cadena todavía. Crea la primera.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((p: Proposal, i) => {
            const Icon        = STATE_ICONS[p.stateLabel] ?? Clock
            const totalVotes  = p.forVotes + p.againstVotes
            const forPct      = totalVotes > 0 ? (p.forVotes     / totalVotes) * 100 : 0
            const againstPct  = totalVotes > 0 ? (p.againstVotes / totalVotes) * 100 : 0
            const quorumPct   = Math.min((totalVotes / QUORUM) * 100, 100)
            const isVoting    = p.stateLabel === 'Votación'
            const alreadyVoted = hasVotedMap[p.id] ?? false

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card hover={isVoting} glow={isVoting ? 'purple' : 'none'}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color: p.stateColor, borderColor: `${p.stateColor}30`, background: `${p.stateColor}10` }}>
                          <Icon className="w-3 h-3 inline mr-1" />{p.stateLabel}
                        </span>
                        <span className="text-xs text-slate-600">
                          #{p.id} · {p.votingEnd.toLocaleDateString('es-MX')}
                          {p.emergency && <span className="ml-1 text-yellow-400">⚡ emergencia</span>}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-white">{p.description.slice(0, 120)}{p.description.length > 120 ? '…' : ''}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">{p.proposer.slice(0, 6)}...{p.proposer.slice(-4)}</p>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400">A favor: {forPct.toFixed(1)}%</span>
                      <span className="text-red-400">En contra: {againstPct.toFixed(1)}%</span>
                    </div>
                    <VoteBar forPct={forPct} againstPct={againstPct} />
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-slate-500">Quórum: {quorumPct.toFixed(0)}% de {(QUORUM / 1_000_000).toFixed(0)}M votos</span>
                      {totalVotes >= QUORUM
                        ? <span className="text-emerald-400 font-semibold">✓ Quórum alcanzado</span>
                        : <span className="text-yellow-500">Quórum pendiente</span>
                      }
                    </div>
                    <div className="w-full h-1 bg-fuel-border rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${quorumPct}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-fuel-cyan/40 rounded-full" />
                    </div>
                  </div>

                  {isVoting && isConnected && (
                    alreadyVoted ? (
                      <div className="text-xs text-slate-500 text-center py-1">Ya votaste en esta propuesta</div>
                    ) : (
                      <div className="flex gap-3">
                        <Button variant="primary" size="sm" className="flex-1" onClick={() => vote(p.id, true)} disabled={!fuelxBalance || isBusy}>
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Vote className="w-3.5 h-3.5" />} Votar a favor
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 border border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={() => vote(p.id, false)} disabled={!fuelxBalance || isBusy}>
                          Votar en contra
                        </Button>
                      </div>
                    )
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create proposal */}
      {showPropose ? (
        <Card>
          <h3 className="font-display font-semibold text-white mb-4">Nueva propuesta</h3>
          <textarea
            value={propText}
            onChange={e => setPropText(e.target.value)}
            placeholder="Describe tu propuesta..."
            rows={4}
            className="w-full bg-fuel-bg border border-fuel-border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-fuel-purple/50 transition-colors resize-none mb-4"
          />
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setShowPropose(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={() => { propose(propText); setShowPropose(false); setPropText('') }} disabled={!propText.trim() || isBusy}>
              {isBusy ? 'Enviando...' : 'Enviar propuesta'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed border-fuel-border/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-fuel-purple/10 border border-fuel-purple/20 flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 text-fuel-purple" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">Nueva propuesta</div>
              <div className="text-xs text-slate-500">Requiere 500 $FUELx para proponer</div>
            </div>
            <Button variant="secondary" size="sm" disabled={!canPropose || !isConnected} onClick={() => setShowPropose(true)}>
              Proponer
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
