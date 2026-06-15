# Frontend

## Stack

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| Next.js | 14.2.5 | App Router, SSR/SSG |
| wagmi | 2.12.2 | Hooks para Ethereum |
| viem | 2.17.0 | Cliente Ethereum low-level |
| RainbowKit | 2.1.6 | UI de conexión de wallets |
| TanStack Query | 5.51.1 | Cache y async state |
| Framer Motion | 11.3.8 | Animaciones |
| Tailwind CSS | 3.x | Estilos |
| Lucide React | 0.414.0 | Iconos |

---

## Estructura de páginas

### `/` — Landing page
`frontend/src/app/page.tsx`

Compone los 9 componentes de marketing en orden:
```
Hero → Problem → HowItWorks → Tokenomics → Roadmap → Team → FAQ → CTA → Footer
```

### `/dapp` — Dashboard
`frontend/src/app/dapp/page.tsx`

Muestra al usuario conectado:
- Balance $FUEL, $FUELx, rewards pendientes, total stakeado en el protocolo
- Tier badge con progreso al siguiente nivel
- Acciones rápidas (stake, invest, vote)
- Resumen de stakes activos

Si la wallet no está conectada, muestra pantalla de bienvenida con botón que abre el modal de RainbowKit (`useConnectModal`).

### `/dapp/stake` — Staking
`frontend/src/app/dapp/stake/page.tsx`

- Input de amount con botón MAX
- Selector de duración (4 sem – 104 sem)
- Preview en tiempo real de FUELx a recibir
- Flujo de 2 pasos: Approve → Stake
- Lista de stakes activos con botones de unstake y claim

### `/dapp/invest` — Inversiones RWA
`frontend/src/app/dapp/invest/page.tsx`

Muestra cards de STOs (gasolineras tokenizadas):
- NanoGAS Tijuana Norte (NGS-001) — abierta
- MicroGAS Monterrey Sur (MGS-001) — próximamente
- MacroGAS CDMX Oriente (MCG-001) — cerrada

Cada card muestra: progreso de financiamiento, APY, ROI estimado, monto mínimo.
> Actualmente las últimas dos son estáticas (sin contrato desplegado).

### `/dapp/governance` — DAO
`frontend/src/app/dapp/governance/page.tsx`

- Lista de propuestas con estado visual
- Barras de votos (% for / against)
- Botones de votar (requiere FUELx)
- Crear propuesta (requiere 500 FUELx)
- Estado: Debate, Votación, En cola, Ejecutada, Rechazada, Cancelada

---

## Layout del DApp
`frontend/src/app/dapp/layout.tsx`

Sidebar con 4 links de navegación. En móvil colapsa con hamburger menu.
Header con ConnectButton de RainbowKit.

---

## Hooks

### `useFuelTokens`
`frontend/src/hooks/useFuelTokens.ts`

Lee balances on-chain usando wagmi `useReadContracts`.

```typescript
const { fuelBalance, fuelxBalance, totalSupply, tier, isLoading } = useFuelTokens()
```

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `fuelBalance` | `number \| null` | Balance FUEL del usuario en tokens (no wei) |
| `fuelxBalance` | `number \| null` | Balance FUELx del usuario |
| `totalSupply` | `number \| null` | Supply total de FUEL |
| `tier` | `{ name, color, next? }` | Tier actual del usuario |
| `isLoading` | `boolean` | |

**Tiers:**
```typescript
NITROFUEL  ≥ 500 FUEL  → cyan
TURBOFUEL  ≥ 200 FUEL  → purple
ECOFUEL    ≥ 100 FUEL  → orange
Sin Tier   <  100 FUEL  → slate
```

---

### `useStaking`
`frontend/src/hooks/useStaking.ts`

Reads:
```typescript
const { stakes, pendingRewards, totalStaked, stakeCount, isLoading } = useStaking()
```

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `stakes` | `StakePosition[]` | Posiciones activas del usuario |
| `pendingRewards` | `number \| null` | FUEL pendiente de reclamar |
| `totalStaked` | `number \| null` | Total stakeado en el protocolo |

```typescript
interface StakePosition {
  id: number
  amount: number        // FUEL stakeado
  fuelxMinted: number   // FUELx recibido
  startTime: Date
  lockWeeks: number
  endDate: Date
  active: boolean
}
```

Writes:
```typescript
const { approveAndStake, stakeAfterApproval, unstake, claimRewards,
        hash, isPending, isConfirming, isSuccess, error } = useStakeWrite()
```

```typescript
const { allowance } = useAllowance(ownerAddress)
```

---

### `useDAO`
`frontend/src/hooks/useDAO.ts`

Reads:
```typescript
const { proposals, proposalCount, hasVotedMap } = useDAO()
```

```typescript
interface Proposal {
  id: number
  proposer: string
  description: string
  forVotes: bigint
  againstVotes: bigint
  votingStart: bigint
  votingEnd: bigint
  emergency: boolean
  executed: boolean
  cancelled: boolean
  state: number          // 0-5 según enum State
  stateLabel: string     // "Debate", "Votación", etc.
  stateColor: string     // color hex para el badge
}
```

Writes:
```typescript
const { vote, propose, execute, hash, isPending, isConfirming, isSuccess, error } = useVote()
```

---

## Librería de contratos
`frontend/src/lib/contracts.ts`

Centraliza:
- **Direcciones** — leídas de `process.env.NEXT_PUBLIC_*`, fallback a `ethers.ZeroAddress`
- **ABIs** — mínimos necesarios para wagmi (solo las funciones usadas)
- **`isDeployed(addr)`** — devuelve `false` si la dirección es zero, para condicionar la UI
- **`getTier(balance)`** — devuelve el tier del usuario
- **`PROPOSAL_STATES`** — mapa de estado → { label, color }

---

## Componentes UI

### `Button`
`frontend/src/components/ui/Button.tsx`

```typescript
<Button
  variant="primary" | "secondary" | "ghost" | "orange"
  size="sm" | "md" | "lg"
  onClick?: () => void
  href?: string          // renderiza como <a> si se pasa
  disabled?: boolean
  type?: "button" | "submit"
>
```

### `Card`
`frontend/src/components/ui/Card.tsx`

```typescript
<Card
  hover?: boolean         // efecto hover
  glow?: "cyan" | "orange" | "purple"
  className?: string
>
```

---

## Paleta de colores (Tailwind)

```typescript
// tailwind.config.ts
colors: {
  'fuel-bg':     '#0A0B1A',  // fondo profundo
  'fuel-card':   '#0F1629',  // cards
  'fuel-border': '#1E2A45',  // bordes
  'fuel-cyan':   '#00E5FF',  // acento principal
  'fuel-orange': '#FF6B35',  // acento secundario
  'fuel-purple': '#7B2FBE',  // gobernanza
}
```

---

## Variables de entorno requeridas

```bash
# frontend/.env.local
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=   # cloud.walletconnect.com
NEXT_PUBLIC_ALCHEMY_API_KEY=             # dashboard.alchemy.com
NEXT_PUBLIC_FUEL_TOKEN_ADDRESS=          # del deploy script
NEXT_PUBLIC_FUELX_TOKEN_ADDRESS=
NEXT_PUBLIC_STAKING_ADDRESS=
NEXT_PUBLIC_DAO_ADDRESS=
NEXT_PUBLIC_STO_ADDRESS=
```

Si alguna dirección está vacía, `isDeployed()` retorna `false` y la UI muestra estado de "contratos no desplegados".
