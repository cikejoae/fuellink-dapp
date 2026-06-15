# Arquitectura del Sistema

## Diagrama general

```
┌─────────────────────────────────────────────────────────────┐
│                      Usuario / Browser                       │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                  Next.js 14 App Router                       │
│                                                             │
│  /              → Landing page (marketing)                  │
│  /dapp          → Dashboard  (requires wallet)              │
│  /dapp/stake    → Staking                                   │
│  /dapp/invest   → STOs (inversiones RWA)                    │
│  /dapp/governance → DAO voting                              │
└────────────────────────────┬────────────────────────────────┘
                             │ wagmi v2 + viem
┌────────────────────────────▼────────────────────────────────┐
│                  Polygon PoS / Amoy testnet                  │
│                                                             │
│  FUELToken ──→ FUELxToken                                   │
│       │             │                                       │
│  FuelStaking ────────┘                                      │
│       │                                                     │
│  FuelDAO (gobernanza sobre todos)                           │
│  FuelSTO  (por cada gasolinera)                             │
└─────────────────────────────────────────────────────────────┘
```

## Flujo principal del protocolo

```
1. Usuario compra $FUEL (mercado secundario / DEX)
         │
         ▼
2. Aprueba FuelStaking como spender (ERC-20 approve)
         │
         ▼
3. stake(amount, semanas) → recibe $FUELx según fórmula
         │
         ├──→ $FUELx sirve para votar en FuelDAO
         │
         └──→ Acumula rewards en FUEL (depositados por Treasury)
         │
         ▼
4. Invierte USDT en FuelSTO de una gasolinera
         │
         ▼
5. Operador construye/opera la estación
         │
         ▼
6. distributeReturns() → rendimientos en USDT proporcionales
```

## Árbol de dependencias entre contratos

```
FUELToken
    └── no depende de nadie

FUELxToken
    └── no depende de nadie (solo AccessControl)

FuelStaking
    ├── lee/transfiere FUELToken
    └── mint/burn FUELxToken  (requiere MINTER_ROLE)

FuelDAO
    └── lee balances de FUELxToken (voting power)

FuelSTO
    └── transfiere USDT (cualquier ERC-20 con 6 decimales)
```

## Estructura de carpetas

```
fuellink-dapp/
├── contracts/                  # Proyecto Hardhat
│   ├── contracts/
│   │   ├── FUELToken.sol
│   │   ├── FUELxToken.sol
│   │   ├── FuelStaking.sol
│   │   ├── FuelDAO.sol
│   │   ├── FuelSTO.sol
│   │   └── mocks/
│   │       └── MockERC20.sol   # solo testnet / tests
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   ├── FUELToken.test.ts
│   │   ├── FUELxToken.test.ts
│   │   ├── FuelStaking.test.ts
│   │   ├── FuelDAO.test.ts
│   │   └── FuelSTO.test.ts
│   └── hardhat.config.ts
│
├── frontend/                   # Proyecto Next.js
│   └── src/
│       ├── app/                # App Router pages
│       │   ├── layout.tsx      # Root: wagmi + RainbowKit providers
│       │   ├── page.tsx        # Landing
│       │   └── dapp/
│       │       ├── layout.tsx  # Sidebar + navbar del DApp
│       │       ├── page.tsx    # Dashboard
│       │       ├── stake/
│       │       ├── invest/
│       │       └── governance/
│       ├── components/
│       │   ├── ui/             # Button, Card, Navbar
│       │   └── landing/        # Hero, Problem, HowItWorks, Tokenomics, Roadmap, Team, FAQ, CTA, Footer
│       ├── hooks/
│       │   ├── useFuelTokens.ts
│       │   ├── useStaking.ts
│       │   └── useDAO.ts
│       └── lib/
│           ├── contracts.ts    # Addresses, ABIs, utilidades
│           └── wagmi.ts        # Config de red
│
└── docs/                       # Esta carpeta
```

## Decisiones de diseño clave

### $FUELx no transferible (soulbound)
`transfer()` y `transferFrom()` siempre hacen revert. El voto de gobernanza refleja un compromiso de stake real, no especulación. Solo FuelStaking puede mint/burn.

### Votación cuadrática
`votes = floor(sqrt(FUELxBalance / 1e18))`. Previene que ballenas con 100× más tokens tengan 100× más poder de voto. Con la raíz cuadrada, tienen solo 10× más influencia.

### OMEGA_MAX = 129 vs MAX_WEEKS = 104
`MAX_WEEKS = 104` (2 años) es el tope de staking. `OMEGA_MAX = 129` es la constante de la fórmula FUELx. El multiplicador máximo alcanzable es ~1.806×, no 2×. Esto crea espacio para futuras extensiones del período máximo sin cambiar la fórmula.

### Deploy condicional de USDT
En `deploy.ts`: si la red es `polygon` usa la dirección real del USDT de Polygon (`0xc2132D...`). En cualquier otra red (Amoy, hardhat) despliega `MockERC20` con 6 decimales.

### Tesnet: Amoy (no Mumbai)
Mumbai (chainId 80001) fue deprecado por Polygon en abril 2024. El proyecto usa Amoy (chainId 80002) con endpoint `polygon-amoy.g.alchemy.com`.
