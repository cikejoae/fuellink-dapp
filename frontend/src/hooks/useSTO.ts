'use client'
import { useReadContracts, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useAccount } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { CONTRACTS, STO_ABI, USDT_ABI, isDeployed } from '@/lib/contracts'

const USDT_DEC = 6

export interface STOInfo {
  stationName:     string
  stationId:       string
  fundingTarget:   number
  totalRaised:     number
  minInvestment:   number
  fundingDeadline: Date | null
  projectedAPY:    number   // basis points (e.g. 1600 = 16%)
  fundingComplete: boolean
  divestComplete:  boolean
  investorCount:   number
  userShares:      number   // USDT invested by current user
  userSharePct:    number   // basis points (e.g. 250 = 2.5%)
  isLoading:       boolean
}

export function useSTO(stoAddress: `0x${string}`): STOInfo {
  const { address: user } = useAccount()
  const deployed = isDeployed(stoAddress)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reads, isLoading } = useReadContracts({
    contracts: [
      { address: stoAddress, abi: STO_ABI, functionName: 'stationName'     },
      { address: stoAddress, abi: STO_ABI, functionName: 'stationId'       },
      { address: stoAddress, abi: STO_ABI, functionName: 'fundingTarget'   },
      { address: stoAddress, abi: STO_ABI, functionName: 'totalRaised'     },
      { address: stoAddress, abi: STO_ABI, functionName: 'minInvestment'   },
      { address: stoAddress, abi: STO_ABI, functionName: 'fundingDeadline' },
      { address: stoAddress, abi: STO_ABI, functionName: 'projectedAPY'    },
      { address: stoAddress, abi: STO_ABI, functionName: 'fundingComplete' },
      { address: stoAddress, abi: STO_ABI, functionName: 'divestComplete'  },
      { address: stoAddress, abi: STO_ABI, functionName: 'getInvestorCount'},
    ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    query: { enabled: deployed },
  })

  const { data: userReads } = useReadContracts({
    contracts: (user ? [
      { address: stoAddress, abi: STO_ABI, functionName: 'shares',             args: [user] },
      { address: stoAddress, abi: STO_ABI, functionName: 'getSharePercentage', args: [user] },
    ] : []) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    query: { enabled: !!user && deployed },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = <T>(idx: number): T | undefined => (reads as any)?.[idx]?.status === 'success' ? (reads as any)[idx].result as T : undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ug = <T>(idx: number): T | undefined => (userReads as any)?.[idx]?.status === 'success' ? (userReads as any)[idx].result as T : undefined

  const toBigNum = (v: bigint | undefined) => v !== undefined ? parseFloat(formatUnits(v, USDT_DEC)) : 0

  const deadlineTs = g<bigint>(5)

  return {
    stationName:     g<string>(0)   ?? '',
    stationId:       g<string>(1)   ?? '',
    fundingTarget:   toBigNum(g<bigint>(2)),
    totalRaised:     toBigNum(g<bigint>(3)),
    minInvestment:   toBigNum(g<bigint>(4)),
    fundingDeadline: deadlineTs ? new Date(Number(deadlineTs) * 1000) : null,
    projectedAPY:    g<bigint>(6) != null ? Number(g<bigint>(6)) : 0,
    fundingComplete: g<boolean>(7)  ?? false,
    divestComplete:  g<boolean>(8)  ?? false,
    investorCount:   g<bigint>(9)  != null ? Number(g<bigint>(9))  : 0,
    userShares:      toBigNum(ug<bigint>(0)),
    userSharePct:    ug<bigint>(1) != null ? Number(ug<bigint>(1)) : 0,
    isLoading,
  }
}

export function useSTOWrite(stoAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function approveUSDT(amountUsdt: string) {
    writeContract({
      address:      CONTRACTS.USDT,
      abi:          USDT_ABI,
      functionName: 'approve',
      args:         [stoAddress, parseUnits(amountUsdt, USDT_DEC)],
    })
  }

  function invest(amountUsdt: string) {
    writeContract({
      address:      stoAddress,
      abi:          STO_ABI,
      functionName: 'invest',
      args:         [parseUnits(amountUsdt, USDT_DEC)],
    })
  }

  function refund() {
    writeContract({
      address:      stoAddress,
      abi:          STO_ABI,
      functionName: 'refund',
    })
  }

  return { approveUSDT, invest, refund, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useUSDTAllowance(owner: `0x${string}` | undefined, spender: `0x${string}`) {
  const { data } = useReadContract({
    address:      CONTRACTS.USDT,
    abi:          USDT_ABI,
    functionName: 'allowance',
    args:         owner ? [owner, spender] : undefined,
    query:        { enabled: !!owner && isDeployed(CONTRACTS.USDT) },
  })
  return data as bigint | undefined
}

export function useUSDTBalance(owner: `0x${string}` | undefined) {
  const { data } = useReadContract({
    address:      CONTRACTS.USDT,
    abi:          USDT_ABI,
    functionName: 'balanceOf',
    args:         owner ? [owner] : undefined,
    query:        { enabled: !!owner && isDeployed(CONTRACTS.USDT) },
  })
  return data != null ? parseFloat(formatUnits(data as bigint, USDT_DEC)) : null
}
