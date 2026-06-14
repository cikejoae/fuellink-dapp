'use client'
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { CONTRACTS, STAKING_ABI, FUEL_TOKEN_ABI, isDeployed } from '@/lib/contracts'

export interface StakePosition {
  id:          number
  amount:      number
  fuelxMinted: number
  startTime:   Date
  lockWeeks:   number
  endDate:     Date
  active:      boolean
  amountRaw:   bigint
}

export function useStaking() {
  const { address } = useAccount()
  const stakingDeployed = isDeployed(CONTRACTS.STAKING)

  const { data: countRaw } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: STAKING_ABI,
    functionName: 'getStakeCount',
    args: address ? [address] : undefined,
    query: { enabled: !!address && stakingDeployed },
  })

  const { data: pendingRaw } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: STAKING_ABI,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address && stakingDeployed },
  })

  const { data: totalStakedRaw } = useReadContract({
    address: CONTRACTS.STAKING,
    abi: STAKING_ABI,
    functionName: 'totalStaked',
    query: { enabled: stakingDeployed },
  })

  const stakeCount = countRaw != null ? Number(countRaw as bigint) : 0

  const stakeContracts = address && stakeCount > 0
    ? Array.from({ length: stakeCount }, (_, i) => ({
        address:      CONTRACTS.STAKING as `0x${string}`,
        abi:          STAKING_ABI,
        functionName: 'getStake' as const,
        args:         [address, BigInt(i)] as [`0x${string}`, bigint],
      }))
    : []

  const { data: stakesRaw, isLoading } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: stakeContracts as any,
    query: { enabled: stakeCount > 0 && stakingDeployed },
  })

  const stakes: StakePosition[] = (stakesRaw ?? []).flatMap((r, i) => {
    if (r.status !== 'success' || !r.result) return []
    const s = r.result as { amount: bigint; fuelxMinted: bigint; startTime: bigint; lockWeeks: bigint; active: boolean }
    const start   = new Date(Number(s.startTime) * 1000)
    const endDate = new Date(start.getTime() + Number(s.lockWeeks) * 7 * 24 * 3600 * 1000)
    return [{
      id:          i,
      amount:      parseFloat(formatUnits(s.amount, 18)),
      fuelxMinted: parseFloat(formatUnits(s.fuelxMinted, 18)),
      startTime:   start,
      lockWeeks:   Number(s.lockWeeks),
      endDate,
      active:      s.active,
      amountRaw:   s.amount,
    }]
  })

  return {
    stakes:         stakes.filter(s => s.active),
    pendingRewards: pendingRaw != null ? parseFloat(formatUnits(pendingRaw as bigint, 18)) : null,
    totalStaked:    totalStakedRaw != null ? parseFloat(formatUnits(totalStakedRaw as bigint, 18)) : null,
    stakeCount,
    isLoading,
  }
}

export function useStakeWrite() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function approveAndStake(amountEther: string, weeks: number) {
    const amountWei = parseUnits(amountEther, 18)
    writeContract({
      address:      CONTRACTS.FUEL_TOKEN,
      abi:          FUEL_TOKEN_ABI,
      functionName: 'approve',
      args:         [CONTRACTS.STAKING, amountWei],
    })
  }

  function stakeAfterApproval(amountEther: string, weeks: number) {
    const amountWei = parseUnits(amountEther, 18)
    writeContract({
      address:      CONTRACTS.STAKING,
      abi:          STAKING_ABI,
      functionName: 'stake',
      args:         [amountWei, BigInt(weeks)],
    })
  }

  function unstake(stakeId: number) {
    writeContract({
      address:      CONTRACTS.STAKING,
      abi:          STAKING_ABI,
      functionName: 'unstake',
      args:         [BigInt(stakeId)],
    })
  }

  function claimRewards() {
    writeContract({
      address:      CONTRACTS.STAKING,
      abi:          STAKING_ABI,
      functionName: 'claimRewards',
    })
  }

  return { approveAndStake, stakeAfterApproval, unstake, claimRewards, hash, isPending, isConfirming, isSuccess, error }
}

export function useAllowance(owner: `0x${string}` | undefined) {
  const { data: allowanceRaw } = useReadContract({
    address: CONTRACTS.FUEL_TOKEN,
    abi:     FUEL_TOKEN_ABI,
    functionName: 'allowance',
    args:    owner ? [owner, CONTRACTS.STAKING] : undefined,
    query:   { enabled: !!owner && isDeployed(CONTRACTS.FUEL_TOKEN) },
  })
  return allowanceRaw as bigint | undefined
}
