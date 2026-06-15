'use client'
import { useReadContract, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { CONTRACTS, FUEL_TOKEN_ABI, FUELX_TOKEN_ABI, isDeployed, getTier } from '@/lib/contracts'

export function useFuelTokens() {
  const { address } = useAccount()

  const fuelEnabled  = !!address && isDeployed(CONTRACTS.FUEL_TOKEN)
  const fuelxEnabled = !!address && isDeployed(CONTRACTS.FUELX_TOKEN)

  const { data: fuelRaw,  isLoading: loadFuel  } = useReadContract({
    address: CONTRACTS.FUEL_TOKEN,
    abi: FUEL_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: fuelEnabled },
  })

  const { data: fuelxRaw, isLoading: loadFuelx } = useReadContract({
    address: CONTRACTS.FUELX_TOKEN,
    abi: FUELX_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: fuelxEnabled },
  })

  const { data: totalSupplyRaw } = useReadContract({
    address: CONTRACTS.FUEL_TOKEN,
    abi: FUEL_TOKEN_ABI,
    functionName: 'totalSupply',
    query: { enabled: isDeployed(CONTRACTS.FUEL_TOKEN) },
  })

  const { data: fuelxTotalRaw } = useReadContract({
    address: CONTRACTS.FUELX_TOKEN,
    abi: FUELX_TOKEN_ABI,
    functionName: 'totalSupply',
    query: { enabled: isDeployed(CONTRACTS.FUELX_TOKEN) },
  })

  const fuelBalance      = fuelRaw       != null ? parseFloat(formatUnits(fuelRaw       as bigint, 18)) : null
  const fuelxBalance     = fuelxRaw      != null ? parseFloat(formatUnits(fuelxRaw      as bigint, 18)) : null
  const totalSupply      = totalSupplyRaw != null ? parseFloat(formatUnits(totalSupplyRaw as bigint, 18)) : null
  const fuelxTotalSupply = fuelxTotalRaw  != null ? parseFloat(formatUnits(fuelxTotalRaw  as bigint, 18)) : null

  return {
    fuelBalance,
    fuelxBalance,
    totalSupply,
    fuelxTotalSupply,
    tier: getTier(fuelBalance ?? 0),
    isLoading: loadFuel || loadFuelx,
    fuelRaw:   fuelRaw  as bigint | undefined,
    fuelxRaw:  fuelxRaw as bigint | undefined,
  }
}
