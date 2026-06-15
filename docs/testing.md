# Testing

## Stack de tests

- **Hardhat** — entorno de ejecución
- **Chai** — assertions
- **@nomicfoundation/hardhat-network-helpers** — manipulación de tiempo y bloques (`time.increase`, `loadFixture`)
- **@nomicfoundation/hardhat-chai-matchers** — matchers como `revertedWith`, `revertedWithCustomError`, `emit`

---

## Correr los tests

```bash
cd contracts
npm test                  # todos los tests
npx hardhat test --grep "FUELToken"    # filtrar por contrato
npx hardhat test --grep "mintToRewards"  # filtrar por nombre de test
```

Estado actual: **83 tests, 0 failing, ~0.5s**

---

## Archivos de test

| Archivo | Contrato | Tests |
|---------|----------|-------|
| `test/FUELToken.test.ts` | FUELToken | 13 |
| `test/FUELxToken.test.ts` | FUELxToken | 9 |
| `test/FuelStaking.test.ts` | FuelStaking | 22 |
| `test/FuelDAO.test.ts` | FuelDAO | 22 |
| `test/FuelSTO.test.ts` | FuelSTO | 17 |

---

## Patrón de fixtures

Cada archivo usa `loadFixture` para compartir el estado de deploy entre tests sin re-deployar en cada `it()`:

```typescript
async function deployFixture() {
  const [admin, user1, user2] = await ethers.getSigners()
  const Token = await ethers.getContractFactory('FUELToken')
  const token = await Token.deploy(admin.address, admin.address)
  // ...setup adicional...
  return { token, admin, user1, user2 }
}

it('hace algo', async () => {
  const { token, user1 } = await loadFixture(deployFixture)
  // El estado siempre parte del mismo punto inicial
})
```

---

## Manipulación de tiempo

Para tests de cooldowns, locks y períodos de votación:

```typescript
import { time } from '@nomicfoundation/hardhat-network-helpers'

// Avanzar N segundos
await time.increase(365 * 24 * 60 * 60)  // 1 año

// Avanzar al timestamp exacto
await time.increaseTo(deadline + 1)
```

---

## Cobertura de cada contrato

### FUELToken
- ✅ Deploy: supply total mintado a recipient, nombre/símbolo, roles
- ✅ `mintToRewardsPool`: pool no configurado, cooldown activo, pasa después de 365d, pool > 20%, sin rol
- ✅ Pause: transfiere cuando activo, bloquea cuando pausado, unpause restaura, rol requerido
- ✅ Burn: reduce supply
- ✅ `setRewardsPool`: emite evento, restringe a admin

### FUELxToken
- ✅ Deploy: nombre/símbolo, supply cero
- ✅ Mint: solo MINTER_ROLE puede mintear, reverts sin rol
- ✅ Burn: solo MINTER_ROLE puede quemar, reverts sin rol
- ✅ Soulbound: `transfer()` y `transferFrom()` siempre revertan

### FuelStaking
- ✅ Deploy: addresses de tokens, totalStaked cero
- ✅ `stake()`: tokens transferidos, FUELx minteado, fórmula (lock largo > lock corto), reverts (0 amount, < MIN, > MAX), evento emitido
- ✅ `unstake()`: fee 20% inmediato, fee 0% al vencer lock, FUELx quemado, revert stake inactivo, evento
- ✅ `claimRewards()`: revert sin rewards pendientes
- ✅ `depositRewards()`: suma al rewardPool, solo owner
- ✅ Pause: bloquea stake, solo owner
- ✅ `setCConstant()`: actualiza valor, solo owner, emite evento
- ✅ `getStake()`: devuelve datos correctos

### FuelDAO
- ✅ Deploy: fuelxToken correcto, count cero
- ✅ `propose()`: incrementa count, emite evento, revert sin FUELx, estado inicial Debate
- ✅ `vote()`: funciona después del debate, revert si aún en debate, revert si votación cerrada, revert doble voto, cuadrático (sqrt verificado)
- ✅ `execute()`: pasa con umbral, rechaza sin umbral, revert durante votación, revert antes del delay
- ✅ `proposeEmergency()`: solo owner, votación inmediata, umbral 55%
- ✅ Params: quorum, threshold (válido e inválido)

### FuelSTO
- ✅ Deploy: datos de la estación, estado inicial
- ✅ `invest()`: válida, evento, inversor único por address, revert bajo mínimo, revert deadline, funding complete, revert cuando ya funded
- ✅ `getSharePercentage()`: cálculo en basis points
- ✅ `distributeReturns()`: distribución proporcional, evento, revert sin funding, revert sin owner
- ✅ `refund()`: devuelve USDT después de deadline, revert antes, revert sin inversión
- ✅ `distributeDivest()`: distribución final, marca divestComplete, revert doble
- ✅ `emergencyWithdraw()`: solo admin

---

## Limitaciones conocidas del test suite

### `claimRewards()` — solo el revert
El contrato tiene `pendingRewards[user]` que nunca se llena automáticamente (falta `distributeRewards()`). El único test posible actualmente es verificar el revert cuando está vacío.

### FuelDAO — quorum check
El quorum check en el contrato tiene un bug de cálculo (`total * 1e18 < quorum / 1e18`). En los tests se usa `setQuorum(1)` para neutralizarlo y probar la lógica de threshold. Ver [contracts.md](./contracts.md#fueldaosol) para detalles.

---

## Cómo agregar tests

1. Agregar casos en el archivo `.test.ts` correspondiente
2. Usar el mismo fixture base del archivo — si necesitas estado adicional, crea un fixture anidado:

```typescript
async function fundedStoFixture() {
  const base = await loadFixture(deployFixture)
  // setup adicional...
  return { ...base, extraVar }
}

it('test con estado adicional', async () => {
  const { sto, extraVar } = await fundedStoFixture()
})
```

3. Para probar eventos:
```typescript
await expect(contract.funcion(args))
  .to.emit(contract, 'NombreEvento')
  .withArgs(arg1, arg2)
```

4. Para probar reverts con custom error (OZ):
```typescript
await expect(contract.connect(unauthorizedUser).funcion())
  .to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount')
```
