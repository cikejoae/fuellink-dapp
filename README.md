# fuelLink DApp

> **"every drop counts"** — Protocolo blockchain que tokeniza el consumo de combustible y democratiza la inversión en estaciones de servicio.

[![Polygon](https://img.shields.io/badge/Network-Polygon_PoS-8247E5)](https://polygon.technology)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636)](https://soliditylang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Smart Contracts](#smart-contracts)
- [Instalación](#instalación)
- [Despliegue](#despliegue)
- [Variables de entorno](#variables-de-entorno)
- [Roadmap técnico](#roadmap-técnico)
- [Pendientes recomendados](#pendientes-recomendados)

---

## Descripción

FuelLink es un protocolo Web3 construido sobre Polygon PoS que:

1. **Tokeniza el consumo de combustible** — Cada litro recargado en estaciones afiliadas genera $FUEL tokens para el consumidor.
2. **Democratiza la inversión en gasolineras** — Security Token Offerings (STOs) permiten inversión fraccionada desde $500 USDT.
3. **Gobernanza descentralizada** — DAO con votación cuadrática mediante $FUELx.

### Usuarios del protocolo

| Tipo | Descripción |
|------|-------------|
| **Consumidor** | Recarga combustible → gana $FUEL → stake → sube de tier |
| **Gasolinero** | Compra licencia + membresía → integra protocolo → atrae más clientes |
| **Inversionista** | Compra $FUEL → participa en STOs → recibe rendimientos USDT |

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Animaciones | Framer Motion |
| Web3 | wagmi v2 + viem + RainbowKit |
| Blockchain | Polygon PoS (mainnet / Mumbai testnet) |
| Contratos | Solidity 0.8.24 + OpenZeppelin 5 |
| Dev contracts | Hardhat + TypeScript |
| Gráficas | Recharts |

---

## Arquitectura

```
fuellink-dapp/
├── frontend/                    # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx         # Landing page
│       │   └── dapp/
│       │       ├── page.tsx     # Dashboard
│       │       ├── stake/       # Staking $FUEL → $FUELx
│       │       ├── invest/      # STOs de gasolineras
│       │       └── governance/  # DAO proposals & voting
│       ├── components/
│       │   ├── landing/         # Secciones de la landing
│       │   ├── dapp/            # Componentes del DApp
│       │   └── ui/              # Primitivos reutilizables
│       └── lib/
│           ├── wagmi.ts         # Configuración de red
│           └── contracts.ts     # ABIs y addresses
└── contracts/                   # Hardhat project
    └── contracts/
        ├── FUELToken.sol        # ERC-20 utility token
        ├── FUELxToken.sol       # Governance token (soulbound)
        ├── FuelStaking.sol      # Staking + FUELx mint
        ├── FuelDAO.sol          # Quadratic voting DAO
        └── FuelSTO.sol          # Security Token Offering
```

---

## Smart Contracts

### FUELToken.sol
- Estándar: ERC-20 con ERC20Permit
- Suministro: 12,752,901,000 $FUEL (fijo + mint controlado)
- Minting: 1x por año, solo al pool de recompensas, cuando < 20% queda
- Roles: MINTER_ROLE, PAUSER_ROLE, BURNER_ROLE
- Red: Polygon PoS

### FUELxToken.sol
- Estándar: ERC-20 no-transferible (soulbound)
- Propósito: Poder de gobernanza, proporcional al staking
- Minting: Solo FuelStaking.sol (MINTER_ROLE)

### FuelStaking.sol
- Fórmula FUELx: `S × ((1/129) × semanas + 1)`
- Duración: 1 semana – 2 años
- Penalización early unstake: 20% → 2% (lineal)
- Claim fee: 2.5%
- APY base: ~12.5% (configurable por DAO)

### FuelDAO.sol
- Votación cuadrática: `votos = √(FUELx_balance)`
- Aprobación: 75% a favor (emergencia: 55%)
- Quórum: 4M $FUELx por defecto
- Ciclo: Debate 7d → Votación 7d → Ejecución delay 2d

### FuelSTO.sol
- Una instancia por gasolinera (FUEL-ESG-No.CRE LLC)
- Inversión en USDT, distribución proporcional
- Flujo: Funding → Operación → Distribución de rendimientos → Desinversión
- Refund automático si no alcanza objetivo en deadline

---

## Instalación

```bash
# 1. Clonar
git clone https://github.com/cikejoae/fuellink-dapp.git
cd fuellink-dapp

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Frontend
cd frontend
npm install
npm run dev
# Abre http://localhost:3000

# 4. Contratos
cd ../contracts
npm install
npx hardhat compile
npx hardhat test
```

---

## Despliegue

### Contratos (Mumbai testnet primero)

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network mumbai
```

Copia las addresses del output a tu `.env`.

```bash
# Verificar en Polygonscan
npx hardhat verify --network mumbai <ADDRESS> <CONSTRUCTOR_ARGS>
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
# o conectar repo a Vercel (recomendado)
```

---

## Variables de entorno

```bash
# .env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=  # WalletConnect Cloud
NEXT_PUBLIC_ALCHEMY_API_KEY=            # Alchemy API key
NEXT_PUBLIC_CHAIN_ID=137                # 137 mainnet, 80001 testnet

NEXT_PUBLIC_FUEL_TOKEN_ADDRESS=         # Post-deploy
NEXT_PUBLIC_FUELX_TOKEN_ADDRESS=
NEXT_PUBLIC_STAKING_ADDRESS=
NEXT_PUBLIC_DAO_ADDRESS=

PRIVATE_KEY=                            # Deployer wallet (contracts only)
POLYGONSCAN_API_KEY=                    # Para verificación
```

---

## Roadmap técnico

| Fase | Ítem |
|------|------|
| MVP | ✅ Landing + DApp estructura |
| MVP | ✅ Smart contracts core |
| V1  | Integrar wagmi `useReadContract`/`useWriteContract` en todas las páginas |
| V1  | Subgraph (The Graph) para historial de transacciones |
| V1  | Oráculo off-chain para consumo de combustible (Chainlink Functions o custom) |
| V2  | FuelLink Tank — access gating por tier |
| V2  | Marketplace de STOs completo |
| V2  | White Label framework |
| V3  | Integración earny App (React Native) |
| V3  | NFTs de nivel de usuario |

---

## Pendientes recomendados

1. **Auditoría de contratos** — Contratar una firma auditora (Trail of Bits, Certik, Hacken) antes de mainnet.
2. **Oráculo de consumo** — Implementar Chainlink Functions o API3 para validar datos off-chain del control volumétrico.
3. **Vesting contracts** — Contratos de vesting para equipo (12m lock + 24m vesting), asesores, etc.
4. **Multisig** — Usar Gnosis Safe para admin roles en producción.
5. **Subgraph** — The Graph para queries históricas de staking, rewards, DAO.
6. **Tests E2E** — Playwright para flujo completo de la DApp.
7. **Legal/Compliance** — STO requiere revisión bajo Ley del Mercado de Valores de cada jurisdicción.

---

## Branding

| Elemento | Valor |
|----------|-------|
| Nombre | fuelLink |
| Tagline | "every drop counts" |
| Color primario | `#00E5FF` (Electric Cyan) |
| Color secundario | `#FF6B35` (Fuel Orange) |
| Acento | `#7B2FBE` (Deep Purple) |
| Background | `#0A0B1A` (Deep Space) |
| Red | Polygon PoS |
| Token | $FUEL (ERC-20) |

---

## Contacto FuelLink

- Web: [fuellink.io](https://fuellink.io)
- Email: hola@fuellink.io
- Tel MX: +52 (664) 674.1854
- Tel US: +1 (619) 386.5100

---

*© 2025 FuelLink INC. Este repositorio es un MVP técnico. No constituye asesoramiento financiero.*
