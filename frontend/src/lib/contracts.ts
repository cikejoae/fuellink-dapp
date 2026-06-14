export const CONTRACTS = {
  FUEL_TOKEN:  (process.env.NEXT_PUBLIC_FUEL_TOKEN_ADDRESS  ?? '0x0') as `0x${string}`,
  FUELX_TOKEN: (process.env.NEXT_PUBLIC_FUELX_TOKEN_ADDRESS ?? '0x0') as `0x${string}`,
  STAKING:     (process.env.NEXT_PUBLIC_STAKING_ADDRESS     ?? '0x0') as `0x${string}`,
  DAO:         (process.env.NEXT_PUBLIC_DAO_ADDRESS          ?? '0x0') as `0x${string}`,
  TREASURY:    (process.env.NEXT_PUBLIC_TREASURY_ADDRESS     ?? '0x0') as `0x${string}`,
} as const

export const FUEL_TOKEN_ABI = [
  { name: 'balanceOf',   type: 'function', stateMutability: 'view',       inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view',       inputs: [],                                     outputs: [{ type: 'uint256' }] },
  { name: 'transfer',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'approve',     type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance',   type: 'function', stateMutability: 'view',       inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export const STAKING_ABI = [
  { name: 'stake',          type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }, { name: 'weeks', type: 'uint256' }], outputs: [] },
  { name: 'unstake',        type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'stakeId', type: 'uint256' }], outputs: [] },
  { name: 'claimRewards',   type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'getStake',       type: 'function', stateMutability: 'view',       inputs: [{ name: 'user', type: 'address' }, { name: 'id', type: 'uint256' }], outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }] },
  { name: 'pendingRewards', type: 'function', stateMutability: 'view',       inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalStaked',    type: 'function', stateMutability: 'view',       inputs: [],                                  outputs: [{ type: 'uint256' }] },
] as const

export const DAO_ABI = [
  { name: 'propose',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'description', type: 'string' }, { name: 'data', type: 'bytes' }], outputs: [{ name: 'proposalId', type: 'uint256' }] },
  { name: 'vote',       type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'support', type: 'bool' }], outputs: [] },
  { name: 'execute',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }], outputs: [] },
  { name: 'getProposal',type: 'function', stateMutability: 'view',       inputs: [{ name: 'id', type: 'uint256' }], outputs: [{ type: 'string' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint8' }] },
] as const

export const TIER_THRESHOLDS = { NITROFUEL: 500, TURBOFUEL: 200, ECOFUEL: 100 } as const

export function getTier(balance: number): { name: string; color: string; next?: number } {
  if (balance >= TIER_THRESHOLDS.NITROFUEL) return { name: 'NitroFUEL', color: '#00E5FF' }
  if (balance >= TIER_THRESHOLDS.TURBOFUEL) return { name: 'TurboFUEL', color: '#7B2FBE', next: TIER_THRESHOLDS.NITROFUEL }
  if (balance >= TIER_THRESHOLDS.ECOFUEL)   return { name: 'EcoFUEL',   color: '#FF6B35', next: TIER_THRESHOLDS.TURBOFUEL }
  return { name: 'Sin Tier', color: '#64748B', next: TIER_THRESHOLDS.ECOFUEL }
}
