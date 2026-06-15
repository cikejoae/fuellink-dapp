# Contratos Solidity

Todos los contratos están en `contracts/contracts/`. Solidity 0.8.24, EVM Cancun, OpenZeppelin 5.

---

## FUELToken.sol

Token utilitario principal del protocolo.

**Hereda:** ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable

### Parámetros
| Constante | Valor |
|-----------|-------|
| `MAX_SUPPLY` | 12,752,901,000 FUEL (12.75B × 1e18) |
| `MINTER_ROLE` | `keccak256("MINTER_ROLE")` |
| `PAUSER_ROLE` | `keccak256("PAUSER_ROLE")` |
| `BURNER_ROLE` | `keccak256("BURNER_ROLE")` |

### Constructor
```solidity
constructor(address admin, address initialRecipient)
```
Mintea el `MAX_SUPPLY` completo a `initialRecipient` (debe ser multisig o contrato de vesting en producción).

### Funciones clave

#### `mintToRewardsPool(uint256 amount)`
Condiciones que deben cumplirse simultáneamente:
1. Caller tiene `MINTER_ROLE`
2. `rewardsPool` está configurado (≠ address(0))
3. Han pasado al menos 365 días desde el último mint
4. Balance de `rewardsPool` < 20% del `MAX_SUPPLY`
5. `totalSupply + amount <= MAX_SUPPLY`

> **Nota:** Como el MAX_SUPPLY se mintea completo en el constructor, solo es posible llamar esta función después de que haya habido burns suficientes para crear headroom.

#### `setRewardsPool(address pool)`
Solo `DEFAULT_ADMIN_ROLE`. Emite `RewardsPoolUpdated`.

#### `pause()` / `unpause()`
Solo `PAUSER_ROLE`. Bloquea todos los `_update` (transfers, mints, burns).

---

## FUELxToken.sol

Token de gobernanza soulbound. No transferible.

**Hereda:** ERC20, AccessControl

### Funciones

#### `mint(address to, uint256 amount)`
Solo `MINTER_ROLE` (exclusivamente el contrato FuelStaking).

#### `burn(address from, uint256 amount)`
Solo `MINTER_ROLE`. Se llama al hacer unstake.

#### `transfer()` / `transferFrom()`
Siempre hacen `revert("FUELx: non-transferable")`. El token representa un compromiso, no es negociable.

---

## FuelStaking.sol

Gestiona el staking de $FUEL y la emisión de $FUELx.

**Hereda:** ReentrancyGuard, Ownable, Pausable

### Parámetros
| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `OMEGA_MAX` | 129 | Denominador de la fórmula FUELx |
| `C_DEFAULT` | 1e18 | Constante C (modificable por DAO) |
| `CLAIM_FEE` | 25 (2.5%) | Fee al reclamar rewards |
| `FEE_INIT` | 2000 (20%) | Fee de unstake anticipado al inicio |
| `FEE_FINAL` | 200 (2%) | Fee de unstake al llegar al lock |
| `MAX_WEEKS` | 104 | Duración máxima (2 años) |
| `MIN_WEEKS` | 1 | Duración mínima |

### Fórmula FUELx
```
FUELx = amount × ((1e18 × weeks / OMEGA_MAX) + cConstant) / 1e18
```
Ejemplo: 1000 FUEL × 52 semanas = 1000 × (52/129 + 1) = 1000 × 1.403 ≈ **1403 FUELx**

### Struct StakeInfo
```solidity
struct StakeInfo {
    uint256 amount;       // FUEL stakeado
    uint256 fuelxMinted;  // FUELx emitido para este stake
    uint256 startTime;    // timestamp de inicio
    uint256 lockWeeks;    // semanas de lock elegidas
    bool    active;       // false después de unstake
}
```

### Funciones

#### `stake(uint256 amount, uint256 weeks_)`
1. Transfiere FUEL del usuario al contrato
2. Calcula y mintea FUELx
3. Crea `StakeInfo` en `stakes[msg.sender][]`
4. Emite `Staked(user, stakeId, amount, lockWeeks, fuelxMinted)`

#### `unstake(uint256 stakeId)`
1. Marca el stake como inactivo
2. Calcula la fee según el tiempo transcurrido (lineal)
3. Quema los FUELx del usuario
4. Fee va al `rewardPool`
5. Transfiere `amount - fee` al usuario

#### Fee de unstake anticipado
```
feeRate = FEE_INIT - ((FEE_INIT - FEE_FINAL) × elapsed / lockWeeks)
```
Si `elapsed >= lockWeeks` → fee = 0 (sin penalización).

#### `claimRewards()`
Transfiere `pendingRewards[msg.sender]` al usuario con 2.5% de fee.
> ⚠️ **Gap conocido:** `pendingRewards` nunca se llena automáticamente. Falta implementar `distributeRewards()` que reparta el `rewardPool` proporcionalmente entre stakers activos.

#### `depositRewards(uint256 amount)`
Solo owner. Transfiere FUEL al contrato y suma al `rewardPool`.

---

## FuelDAO.sol

Gobernanza con votación cuadrática.

**Hereda:** ReentrancyGuard, Ownable

### Parámetros
| Constante | Valor |
|-----------|-------|
| `DEBATE_PERIOD` | 7 días |
| `VOTING_PERIOD` | 7 días |
| `EXECUTION_DELAY` | 2 días |
| `EMERGENCY_PERIOD` | 1 día |
| `approvalThreshold` | 7500 (75%) — modificable |
| `emergencyThreshold` | 5500 (55%) |
| `quorum` | 4,000,000 FUELx — modificable |
| `proposalStake` | 500 FUELx para proponer |

### Enum State
```solidity
enum State { Debate, Voting, Queued, Executed, Rejected, Cancelled }
//           0       1       2       3         4         5
```

### Ciclo de vida de una propuesta
```
Debate (7d) → Voting (7d) → [Queued si pasa] → Execution delay (2d) → Executed
                           → [Rejected si no pasa]
```

### Votación cuadrática
```
votes = floor(sqrt(fuelxBalance / 1e18))
```
Ejemplo: 10,000 FUELx → sqrt(10000) = 100 votos.

### Funciones

#### `propose(description, target, data)`
Requiere ≥ 500 FUELx. Devuelve el ID de la propuesta.

#### `proposeEmergency(description, target, data)`
Solo owner. Salta el período de debate, umbral de aprobación 55%.

#### `vote(uint256 proposalId, bool support)`
Un voto por address por propuesta. Poder de voto = sqrt(FUELx).

#### `execute(uint256 proposalId)`
Requiere estado `Queued` + que hayan pasado 2 días desde el fin de votación.
Si `callData.length > 0`, ejecuta llamada arbitraria a `target` — permite que el DAO modifique parámetros del protocolo on-chain.

> ⚠️ **Bug en quorum check:** La condición actual es `total * 1e18 < quorum / 1e18`, que en práctica nunca se activa correctamente. Requiere corrección antes de mainnet.

---

## FuelSTO.sol

Security Token Offering por gasolinera individual.

**Hereda:** ReentrancyGuard, Ownable

### Parámetros del constructor
```solidity
constructor(
    address usdtAddr,    // token de inversión (USDT, 6 decimales)
    address admin,
    string  name_,       // ej: "NanoGAS Tijuana Norte"
    string  id_,         // ej: "NGS-001"
    uint256 target,      // objetivo en USDT (6 dec)
    uint256 minInv,      // mínimo por inversión
    uint256 deadline,    // timestamp de cierre
    uint256 apy          // basis points (1600 = 16%)
)
```

### Flujo
```
invest() → funding completo → [operador construye] → distributeReturns() (periódico)
                                                   → distributeDivest()  (al cierre)

Si no se llega al objetivo antes del deadline:
→ refund() devuelve cada inversor su USDT
```

### Funciones

#### `invest(uint256 amount)`
Condiciones: no fundingComplete, antes del deadline, ≥ minInvestment, no excede target.

#### `distributeReturns(uint256 amount)`
Solo owner. Distribuye `amount` USDT proporcionalmente entre todos los inversores.

#### `distributeDivest(uint256 amount)`
Solo owner. Distribución final (cierre del proyecto). Marca `divestComplete = true`.

#### `refund()`
Solo si deadline pasó y no se completó el funding. Devuelve la inversión completa.

---

## MockERC20.sol

Token ERC-20 minteable para testnet y tests. Se ubica en `contracts/mocks/`.

```solidity
constructor(string name_, string symbol_, uint8 decimals_)
function mint(address to, uint256 amount) external  // sin restricciones
```

> **Solo para desarrollo.** No se despliega en mainnet.
