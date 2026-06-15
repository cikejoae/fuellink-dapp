export const CONTRACTS = {
  FUEL_TOKEN:  (process.env.NEXT_PUBLIC_FUEL_TOKEN_ADDRESS  ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  FUELX_TOKEN: (process.env.NEXT_PUBLIC_FUELX_TOKEN_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  STAKING:     (process.env.NEXT_PUBLIC_STAKING_ADDRESS     ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  DAO:         (process.env.NEXT_PUBLIC_DAO_ADDRESS          ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  TREASURY:    (process.env.NEXT_PUBLIC_TREASURY_ADDRESS     ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  STO_NGS001:  (process.env.NEXT_PUBLIC_STO_ADDRESS          ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  USDT:        (process.env.NEXT_PUBLIC_USDT_ADDRESS         ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
} as const

const ZERO = '0x0000000000000000000000000000000000000000'
export function isDeployed(addr: string): boolean {
  return addr !== ZERO && addr !== '0x0' && addr.length === 42
}

export const FUEL_TOKEN_ABI = [
  { name: 'balanceOf',   type: 'function', stateMutability: 'view',       inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view',       inputs: [],                                     outputs: [{ type: 'uint256' }] },
  { name: 'transfer',    type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'approve',     type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance',   type: 'function', stateMutability: 'view',       inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export const FUELX_TOKEN_ABI = [
  { name: 'balanceOf',   type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [],                                     outputs: [{ type: 'uint256' }] },
] as const

export const STAKING_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }, { name: 'weeks_', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'unstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'stakeId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getStakeCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getStake',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }, { name: 'id', type: 'uint256' }],
    outputs: [{
      name: '',
      type: 'tuple',
      components: [
        { name: 'amount',      type: 'uint256' },
        { name: 'fuelxMinted', type: 'uint256' },
        { name: 'startTime',   type: 'uint256' },
        { name: 'lockWeeks',   type: 'uint256' },
        { name: 'active',      type: 'bool'    },
      ],
    }],
  },
  {
    name: 'earned',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalStaked',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const

export const DAO_ABI = [
  {
    name: 'propose',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'description', type: 'string' },
      { name: 'target',      type: 'address' },
      { name: 'data',        type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'vote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'support', type: 'bool' }],
    outputs: [],
  },
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'proposalCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'proposals',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'proposer',     type: 'address' },
      { name: 'description',  type: 'string'  },
      { name: 'callData',     type: 'bytes'   },
      { name: 'target',       type: 'address' },
      { name: 'forVotes',        type: 'uint256' },
      { name: 'againstVotes',   type: 'uint256' },
      { name: 'totalFuelxVoted',type: 'uint256' },
      { name: 'debateStart',    type: 'uint256' },
      { name: 'votingStart',  type: 'uint256' },
      { name: 'votingEnd',    type: 'uint256' },
      { name: 'emergency',    type: 'bool'    },
      { name: 'executed',     type: 'bool'    },
      { name: 'cancelled',    type: 'bool'    },
    ],
  },
  {
    name: 'hasVoted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getState',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ type: 'uint8' }],
  },
] as const

export const STO_ABI = [
  { name: 'stationName',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'stationId',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'fundingTarget',  type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalRaised',    type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'minInvestment',  type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'fundingDeadline',type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'projectedAPY',   type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'fundingComplete',type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'divestComplete', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'shares',         type: 'function', stateMutability: 'view', inputs: [{ name: 'investor', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'getInvestorCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'getSharePercentage', type: 'function', stateMutability: 'view', inputs: [{ name: 'investor', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'invest', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'refund', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const

export const USDT_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view',       inputs: [{ name: 'account', type: 'address' }],                                                   outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view',       inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],                outputs: [{ type: 'uint256' }] },
  { name: 'approve',   type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],               outputs: [{ type: 'bool'    }] },
] as const

// State enum (matches FuelDAO.sol)
export const PROPOSAL_STATE: Record<number, { label: string; color: string }> = {
  0: { label: 'Debate',    color: '#F59E0B' },
  1: { label: 'Votación',  color: '#00E5FF' },
  2: { label: 'En cola',   color: '#7B2FBE' },
  3: { label: 'Ejecutada', color: '#10B981' },
  4: { label: 'Rechazada', color: '#EF4444' },
  5: { label: 'Cancelada', color: '#64748B' },
}

export const TIER_THRESHOLDS = { NITROFUEL: 500, TURBOFUEL: 200, ECOFUEL: 100 } as const

export function getTier(balance: number): { name: string; color: string; next?: number } {
  if (balance >= TIER_THRESHOLDS.NITROFUEL) return { name: 'NitroFUEL', color: '#00E5FF' }
  if (balance >= TIER_THRESHOLDS.TURBOFUEL) return { name: 'TurboFUEL', color: '#7B2FBE', next: TIER_THRESHOLDS.NITROFUEL }
  if (balance >= TIER_THRESHOLDS.ECOFUEL)   return { name: 'EcoFUEL',   color: '#FF6B35', next: TIER_THRESHOLDS.TURBOFUEL }
  return { name: 'Sin Tier', color: '#64748B', next: TIER_THRESHOLDS.ECOFUEL }
}
