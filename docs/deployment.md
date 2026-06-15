# Guía de Deploy

## Prerequisitos

1. **Node.js ≥ 18** y **npm ≥ 9**
2. **Wallet con MATIC** en Polygon Amoy para pagar gas en testnet
3. Cuenta en [Alchemy](https://dashboard.alchemy.com) — crear apps para Polygon Mainnet y Polygon Amoy
4. Cuenta en [WalletConnect Cloud](https://cloud.walletconnect.com) — crear proyecto para obtener Project ID
5. Cuenta en [PolygonScan](https://polygonscan.com/myapikey) — para verificar contratos (opcional)

---

## 1. Configurar variables de entorno

```bash
# Raíz del repositorio
cp .env.example .env
```

Editar `.env`:
```bash
PRIVATE_KEY=<clave_privada_sin_0x>
NEXT_PUBLIC_ALCHEMY_API_KEY=<api_key_de_alchemy>
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<project_id_de_walletconnect>
POLYGONSCAN_API_KEY=<api_key_de_polygonscan>   # opcional, para verificación
```

> **Seguridad:** `.env` está en `.gitignore`. Nunca commitear claves privadas.

---

## 2. Instalar dependencias

```bash
cd contracts && npm install
cd ../frontend && npm install
```

---

## 3. Compilar contratos

```bash
cd contracts
npm run compile
# Salida esperada: "Compiled X Solidity files successfully (evm target: cancun)"
```

---

## 4. Correr tests

```bash
npm test
# Esperado: 130 passing (~0.7s)
```

---

## 5. Deploy en Amoy (testnet)

```bash
cd contracts
npm run deploy:amoy
```

Salida esperada:
```
Deploying with: 0xTuDireccion
Balance: X.XX MATIC
Network: amoy
✅ MockUSDT (testnet): 0x...
✅ FUELToken: 0x...
✅ FUELxToken: 0x...
✅ FuelStaking: 0x...
✅ FUELx MINTER_ROLE granted to Staking
✅ FuelDAO: 0x...
✅ FuelSTO NGS-001: 0x...

─── Deployment Summary ────────────────────────────────
NEXT_PUBLIC_FUEL_TOKEN_ADDRESS  = 0x...
NEXT_PUBLIC_FUELX_TOKEN_ADDRESS = 0x...
NEXT_PUBLIC_STAKING_ADDRESS     = 0x...
NEXT_PUBLIC_DAO_ADDRESS         = 0x...
NEXT_PUBLIC_STO_ADDRESS         = 0x...
NEXT_PUBLIC_USDT_ADDRESS        = 0x... (mock testnet USDT)
```

### Poblar frontend/.env.local

```bash
cp frontend/.env.local.example frontend/.env.local
```

Copiar las direcciones del summary al `frontend/.env.local`:
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<id>
NEXT_PUBLIC_ALCHEMY_API_KEY=<key>
NEXT_PUBLIC_FUEL_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_FUELX_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_STAKING_ADDRESS=0x...
NEXT_PUBLIC_DAO_ADDRESS=0x...
NEXT_PUBLIC_STO_ADDRESS=0x...
```

---

## 6. Correr el frontend (local)

```bash
cd frontend
npm run dev       # desarrollo en localhost:3000
npm run build     # verificar que build pasa sin errores
```

---

## 7. Deploy en Cloudflare Pages

El frontend se genera como export estático (`out/`) y se sube a Cloudflare Pages.

### Opción A — GitHub + Cloudflare Pages dashboard (recomendado)

1. Conectar el repositorio en [pages.cloudflare.com](https://pages.cloudflare.com)
2. Configurar el proyecto:
   - **Build command:** `cd frontend && npm run build`
   - **Build output directory:** `frontend/out`
   - **Root directory:** `/` (raíz del repo)
3. Agregar las variables de entorno en **Settings → Environment variables → Build variables**:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID = <id>
   NEXT_PUBLIC_ALCHEMY_API_KEY           = <key>
   NEXT_PUBLIC_FUEL_TOKEN_ADDRESS        = 0x...
   NEXT_PUBLIC_FUELX_TOKEN_ADDRESS       = 0x...
   NEXT_PUBLIC_STAKING_ADDRESS           = 0x...
   NEXT_PUBLIC_DAO_ADDRESS               = 0x...
   NEXT_PUBLIC_TREASURY_ADDRESS          = 0x...
   NEXT_PUBLIC_VESTING_ADDRESS           = 0x...
   NEXT_PUBLIC_STO_ADDRESS               = 0x...
   NEXT_PUBLIC_TIMELOCK_ADDRESS          = 0x...
   NEXT_PUBLIC_USDT_ADDRESS              = 0x...
   ```
   > **IMPORTANTE:** estas variables son de *build time*, no de runtime. Se compilan en el bundle. Cada vez que cambies una dirección necesitas un nuevo deploy.

4. Click **Save and Deploy**.

### Opción B — Wrangler CLI

```bash
# Instalar wrangler (una vez)
npm install -g wrangler
wrangler login

# Desde frontend/
cd frontend
npm run deploy             # build + deploy a producción
npm run deploy:preview     # build + deploy a rama preview
```

### Notas importantes para Cloudflare

| Archivo | Propósito |
|---------|-----------|
| `frontend/wrangler.toml` | Config del proyecto CF Pages para CLI |
| `frontend/public/_headers` | Security headers HTTP (CSP, HSTS, etc.) |
| `frontend/public/_redirects` | Fallback para rutas del router de Next.js |
| `frontend/next.config.js` | `output: 'export'` + `images.unoptimized` |

El servidor `next start` **no funciona** en Cloudflare Pages porque no hay Node.js en runtime. El export estático es la arquitectura correcta para este DApp (todas las páginas son `'use client'`).

---

## 8. Verificar contratos en PolygonScan (opcional)

```bash
cd contracts

# Verificar FUELToken (ejemplo)
npx hardhat verify --network amoy 0x<FUEL_ADDRESS> <admin_address> <recipient_address>

# FUELxToken
npx hardhat verify --network amoy 0x<FUELX_ADDRESS> <admin_address>

# FuelStaking
npx hardhat verify --network amoy 0x<STAKING_ADDRESS> 0x<FUEL> 0x<FUELX> <admin>

# FuelDAO
npx hardhat verify --network amoy 0x<DAO_ADDRESS> 0x<FUELX> <admin>

# FuelSTO
npx hardhat verify --network amoy 0x<STO_ADDRESS> 0x<USDT> <admin> "NanoGAS Tijuana Norte" "NGS-001" 250000000000 500000000 <deadline> 1600
```

---

## 8. Deploy en Polygon Mainnet

> ⚠️ Solo después de auditoría y tests extensivos en testnet.

```bash
cd contracts
npm run deploy:polygon
```

Diferencias con testnet:
- Usa USDT real de Polygon (`0xc2132D05D31c914a87C6611C10748AEb04B58e8F`)
- Gas en MATIC real
- No despliega MockERC20

---

## Configuración de redes en hardhat.config.ts

| Red | chainId | RPC | Comando |
|-----|---------|-----|---------|
| hardhat (local) | 31337 | in-memory | `npx hardhat test` |
| amoy (testnet) | 80002 | polygon-amoy.g.alchemy.com | `deploy:amoy` |
| polygon (mainnet) | 137 | polygon-mainnet.g.alchemy.com | `deploy:polygon` |

> **Nota histórica:** Mumbai (chainId 80001) fue deprecado por Polygon en abril 2024. Este proyecto usa Amoy como testnet oficial.

---

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `insufficient funds` | Wallet sin MATIC | Obtener MATIC de testnet faucet |
| `No se puede conectar` | `ALCHEMY_API_KEY` incorrecto | Verificar en dashboard.alchemy.com |
| Contratos no aparecen en UI | `.env.local` vacío | Copiar direcciones del deploy summary |
| WalletConnect no funciona | Project ID faltante o `fuellink_dev` | Crear proyecto en cloud.walletconnect.com |
