'use client'
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { CONTRACTS, DAO_ABI, PROPOSAL_STATE, isDeployed } from '@/lib/contracts'

export interface Proposal {
  id:           number
  proposer:     string
  description:  string
  forVotes:     number
  againstVotes: number
  votingStart:  Date
  votingEnd:    Date
  emergency:    boolean
  executed:     boolean
  cancelled:    boolean
  state:        number
  stateLabel:   string
  stateColor:   string
}

export function useDAO() {
  const { address } = useAccount()
  const daoDeployed = isDeployed(CONTRACTS.DAO)

  const { data: countRaw } = useReadContract({
    address:      CONTRACTS.DAO,
    abi:          DAO_ABI,
    functionName: 'proposalCount',
    query:        { enabled: daoDeployed },
  })

  const proposalCount = countRaw != null ? Number(countRaw as bigint) : 0

  const proposalContracts = proposalCount > 0
    ? Array.from({ length: proposalCount }, (_, i) => ({
        address:      CONTRACTS.DAO as `0x${string}`,
        abi:          DAO_ABI,
        functionName: 'proposals' as const,
        args:         [BigInt(i + 1)] as [bigint],
      }))
    : []

  const stateContracts = proposalCount > 0
    ? Array.from({ length: proposalCount }, (_, i) => ({
        address:      CONTRACTS.DAO as `0x${string}`,
        abi:          DAO_ABI,
        functionName: 'getState' as const,
        args:         [BigInt(i + 1)] as [bigint],
      }))
    : []

  const hasVotedContracts = address && proposalCount > 0
    ? Array.from({ length: proposalCount }, (_, i) => ({
        address:      CONTRACTS.DAO as `0x${string}`,
        abi:          DAO_ABI,
        functionName: 'hasVoted' as const,
        args:         [BigInt(i + 1), address] as [bigint, `0x${string}`],
      }))
    : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proposalsRaw } = useReadContracts({ contracts: proposalContracts as any, query: { enabled: proposalCount > 0 && daoDeployed } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: statesRaw }    = useReadContracts({ contracts: stateContracts    as any, query: { enabled: proposalCount > 0 && daoDeployed } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hasVotedRaw }  = useReadContracts({ contracts: hasVotedContracts as any, query: { enabled: proposalCount > 0 && !!address && daoDeployed } })

  const proposals: Proposal[] = (proposalsRaw ?? []).flatMap((r, i) => {
    if (r.status !== 'success' || !r.result) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p       = r.result as any
    const stateN  = statesRaw?.[i]?.result != null ? Number(statesRaw[i].result as number) : 0
    const cfg     = PROPOSAL_STATE[stateN] ?? PROPOSAL_STATE[0]
    return [{
      id:           i + 1,
      proposer:     p.proposer as string,
      description:  p.description as string,
      forVotes:     parseFloat(formatUnits(p.forVotes as bigint, 18)),
      againstVotes: parseFloat(formatUnits(p.againstVotes as bigint, 18)),
      votingStart:  new Date(Number(p.votingStart as bigint) * 1000),
      votingEnd:    new Date(Number(p.votingEnd   as bigint) * 1000),
      emergency:    p.emergency as boolean,
      executed:     p.executed  as boolean,
      cancelled:    p.cancelled as boolean,
      state:        stateN,
      stateLabel:   cfg.label,
      stateColor:   cfg.color,
    }]
  })

  const hasVotedMap: Record<number, boolean> = {}
  ;(hasVotedRaw ?? []).forEach((r, i) => {
    if (r.status === 'success') hasVotedMap[i + 1] = r.result as boolean
  })

  return { proposals, proposalCount, hasVotedMap }
}

export function useVote() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function vote(proposalId: number, support: boolean) {
    writeContract({
      address:      CONTRACTS.DAO,
      abi:          DAO_ABI,
      functionName: 'vote',
      args:         [BigInt(proposalId), support],
    })
  }

  function propose(description: string) {
    writeContract({
      address:      CONTRACTS.DAO,
      abi:          DAO_ABI,
      functionName: 'propose',
      args:         [description, '0x0000000000000000000000000000000000000000', '0x'],
    })
  }

  function execute(proposalId: number) {
    writeContract({
      address:      CONTRACTS.DAO,
      abi:          DAO_ABI,
      functionName: 'execute',
      args:         [BigInt(proposalId)],
    })
  }

  return { vote, propose, execute, hash, isPending, isConfirming, isSuccess, error }
}
