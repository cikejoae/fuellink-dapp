# Roadmap y Plan de Desarrollo

## Estado actual (Junio 2026)

### ✅ Completado

| Área | Detalle |
|------|---------|
| Contratos | 5 contratos compilando limpio (Solidity 0.8.24, EVM Cancun) |
| Tests | 83 tests pasando, cobertura de todos los contratos |
| Deploy script | Deploy ordenado con MockERC20 en testnet, USDT real en mainnet |
| Frontend | Landing + DApp (dashboard, stake, governance, invest) |
| Hooks wagmi | useFuelTokens, useStaking, useDAO conectados a contratos reales |
| Infraestructura | Mumbai → Amoy (testnet actual de Polygon) |
| Docs | Esta carpeta |

### ⏳ Pendiente inmediato (antes de usar el DApp)

| Item | Dónde | Instrucción |
|------|-------|-------------|
| Credenciales en `.env` | Raíz del repo | `PRIVATE_KEY` + `NEXT_PUBLIC_ALCHEMY_API_KEY` |
| Deploy a Amoy | `contracts/` | `npm run deploy:amoy` |
| Poblar `frontend/.env.local` | `frontend/` | Copiar addresses del deploy |
| WalletConnect Project ID | `.env` | Crear proyecto en cloud.walletconnect.com |

---

## Plan de desarrollo — por prioridad

---

### 🔴 P0 — Bugs que afectan correctitud en producción

#### 1. `distributeRewards()` en FuelStaking (crítico)
**Problema:** `depositRewards()` suma al `rewardPool` global pero `claimRewards()` lee de `pendingRewards[user]`, que nunca se actualiza. Los stakers no pueden cobrar rewards aunque el Treasury haya depositado fondos.

**Solución:** Implementar distribución proporcional similar a FuelSTO:
```solidity
function distributeRewards() external onlyOwner {
    require(rewardPool > 0, "Staking: empty pool");
    for (uint256 i = 0; i < stakers.length; i++) {
        // proporcional a fuelxMinted activo de cada staker
    }
    rewardPool = 0;
}
```
O mejor: usar el patrón de "reward per token" acumulativo (más eficiente en gas, no itera todos los stakers).

#### 2. Quorum check en FuelDAO (crítico)
**Problema:** La condición `total * 1e18 < quorum / 1e18` tiene aritmética incorrecta — nunca activa el rechazo por quorum bajo en la práctica.

**Corrección:**
```solidity
// Actual (incorrecto):
if (total * 1e18 < quorum / 1e18) return State.Rejected;

// Correcto: comparar total de votos contra el quorum configurado
if (total < quorum) return State.Rejected;
```
El `quorum` actual está en 4,000,000 FUELx (ya en unidades de votos cuadráticos o tokens, hay que alinear la semántica).

---

### 🟠 P1 — Funcionalidad faltante para el MVP real

#### 3. Contrato FuelTreasury
Actualmente no existe. El Treasury recibe fees del protocolo y los distribuye al rewardPool de FuelStaking.

Funcionalidad mínima:
- Recibir MATIC/tokens de fees
- `fundStakingRewards(amount)` — transferir FUEL al staking
- Control de acceso (solo DAO puede ejecutar distribuciones grandes)

#### 4. Vesting contract para distribución inicial de FUEL
El MAX_SUPPLY se mintea completo al deployer en el constructor. En producción necesita:
- Vesting con cliff para el equipo (ej: 1 año cliff, 2 años vesting)
- Vesting para inversores semilla
- Asignación directa para liquidez inicial (DEX)
- Reserva para rewards comunitarios (gestionada por Treasury)

#### 5. Página de Invest — contratos reales
Actualmente `MicroGAS Monterrey` y `MacroGAS CDMX` son datos estáticos. Cada proyecto necesita:
- Deploy de su propio contrato FuelSTO
- Dirección en `.env.local`
- Hook `useSTO(address)` para leer datos on-chain

#### 6. Página de perfil de usuario
Falta una vista `/dapp/profile` con:
- Historial de stakes (activos + pasados)
- Historial de inversiones STO
- Historial de votos en DAO
- APY proyectado según posición actual

---

### 🟡 P2 — Mejoras de seguridad antes de mainnet

#### 7. Auditoría de contratos
Antes de mainnet, auditoría externa de los 5 contratos. Puntos de atención:
- `FuelDAO.execute()` puede hacer llamadas arbitrarias — vector de ataque si se aprueba propuesta maliciosa
- `FuelSTO.distributeReturns()` itera todos los inversores — potencial DOS si hay muchos (usar pull payments en su lugar)
- `FuelStaking.depositRewards()` solo el owner puede llamarlo — en producción debería ser el Treasury contract

#### 8. Timelock para el DAO
Antes de mainnet, el `execute()` del DAO debería pasar por un Timelock contract (OpenZeppelin TimelockController) para dar tiempo a la comunidad de reaccionar a propuestas maliciosas.

#### 9. Multisig como admin
El deployer (EOA) tiene todos los roles admin en los contratos. En producción:
- `DEFAULT_ADMIN_ROLE` → Gnosis Safe multisig (3-of-5 firmas)
- `MINTER_ROLE` en FUEL → FuelDAO contract
- `owner` de FuelStaking → FuelDAO o FuelTreasury

---

### 🟢 P3 — Mejoras de producto

#### 10. Notificaciones on-chain
Mostrar en la UI cuando:
- Un stake está próximo a vencer
- Hay rewards disponibles para reclamar
- Una propuesta DAO está en votación y el usuario no ha votado

#### 11. Gráficas de rendimiento
En el dashboard:
- Gráfica de APY histórico del protocolo
- Evolución del balance FUELx del usuario
- Progress hacia el siguiente tier

#### 12. Modo "simulate"
Antes de conectar wallet, permitir simular staking con valores hipotéticos (sin transacción real). Útil para marketing y onboarding.

#### 13. Internacionalización
El frontend mezcla español e inglés (labels en inglés como "$FUEL Balance"). Decidir idioma único o implementar i18n.

#### 14. Mobile wallet support
RainbowKit ya soporta WalletConnect, pero verificar flujo completo en MetaMask Mobile y Rainbow app en Polygon.

---

## Orden recomendado de ejecución

```
Semana 1:
  ├── [P0] Fix distributeRewards en FuelStaking
  ├── [P0] Fix quorum check en FuelDAO
  └── Deploy a Amoy + configurar .env

Semana 2:
  ├── [P1] FuelTreasury contract
  └── [P1] Vesting contract

Semana 3:
  ├── [P1] Contratos reales para STOs adicionales
  └── [P2] Multisig como admin en testnet

Semana 4-6:
  └── [P2] Auditoría externa

Después de auditoría:
  ├── [P2] Timelock + multisig en mainnet
  └── Deploy a Polygon Mainnet
```

---

## Deuda técnica documentada

| Item | Archivo | Descripción |
|------|---------|-------------|
| `pendingRewards` sin distribuidor | `FuelStaking.sol:49` | Nunca se llena — ver P0 #1 |
| Quorum check aritmética | `FuelDAO.sol:175` | `total * 1e18 < quorum / 1e18` incorrecto |
| STOs estáticos en invest | `dapp/invest/page.tsx` | 2 de 3 proyectos son hardcoded |
| Supply completo al deployer EOA | `FUELToken.sol:41` | Necesita vesting en producción |
| `distributeReturns` O(n) | `FuelSTO.sol:101` | Itera todos los inversores — DoS con muchos |
