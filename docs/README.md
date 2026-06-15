# FuelLink — Documentación Técnica

FuelLink es un protocolo DeFi sobre Polygon PoS que tokeniza estaciones de gasolina como activos reales (RWA). Los inversores compran fracciones de proyectos de infraestructura energética y reciben rendimientos en USDT.

## Índice

| Documento | Descripción |
|-----------|-------------|
| [architecture.md](./architecture.md) | Arquitectura del sistema, flujos de datos y decisiones de diseño |
| [contracts.md](./contracts.md) | Referencia técnica de los 5 contratos Solidity |
| [frontend.md](./frontend.md) | Estructura del frontend, hooks y componentes |
| [tokenomics.md](./tokenomics.md) | Economía del token $FUEL y $FUELx |
| [deployment.md](./deployment.md) | Guía paso a paso para deploy en Amoy y Polygon mainnet |
| [testing.md](./testing.md) | Suite de tests, cómo correrlos y cómo extenderlos |
| [roadmap.md](./roadmap.md) | Estado actual y plan de desarrollo |

## Stack

| Capa | Tecnología |
|------|-----------|
| Smart contracts | Solidity 0.8.24, OpenZeppelin 5, Hardhat |
| EVM target | Cancun, Polygon PoS (chainId 137) / Amoy testnet (chainId 80002) |
| Frontend | Next.js 14 App Router, TypeScript |
| Web3 | wagmi v2, viem, RainbowKit |
| Estilos | Tailwind CSS, Framer Motion |
| Tests | Hardhat + Chai + @nomicfoundation/hardhat-network-helpers |

## Inicio rápido

```bash
# 1. Instalar dependencias
cd contracts && npm install
cd ../frontend && npm install

# 2. Configurar variables de entorno
cp .env.example .env          # llenar PRIVATE_KEY, ALCHEMY_API_KEY, etc.
cp frontend/.env.local.example frontend/.env.local

# 3. Compilar y testear contratos
cd contracts
npm run compile   # npx hardhat compile
npm test          # 83 tests — ~0.5s

# 4. Deploy en testnet Amoy
npm run deploy:amoy   # copia las direcciones al frontend/.env.local

# 5. Correr el frontend
cd ../frontend && npm run dev
```
