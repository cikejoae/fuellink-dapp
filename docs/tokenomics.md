# Tokenomics

## $FUEL — Token utilitario

| Propiedad | Valor |
|-----------|-------|
| Nombre | FuelLink Token |
| Símbolo | $FUEL |
| Supply máximo | 12,752,901,000 (12.75B) |
| Decimales | 18 |
| Red | Polygon PoS |
| Estándar | ERC-20 + ERC-20Permit + Burnable |

### Usos de $FUEL
- **Staking** → bloquear para obtener $FUELx y rewards
- **Rewards** → distribuidos desde el Treasury a stakers
- **Inversión** → acceso preferente a STOs (según tier)

### Distribución inicial
El supply completo se mintea en el constructor a `initialRecipient` (multisig/vesting).
La distribución final (equipo, inversores, comunidad, etc.) se gestiona vía el contrato de vesting — aún no implementado.

### Minting adicional
Solo posible cumpliendo **todas** estas condiciones:
1. Caller tiene `MINTER_ROLE` (DAO)
2. Cooldown de 12 meses desde el último mint
3. Balance del `rewardsPool` < 20% del MAX_SUPPLY
4. `totalSupply + amount ≤ MAX_SUPPLY`
5. Se hayan hecho burns suficientes para crear headroom

---

## $FUELx — Token de gobernanza

| Propiedad | Valor |
|-----------|-------|
| Nombre | FuelLink Governance Token |
| Símbolo | $FUELx |
| Supply | Dinámico (mint/burn por FuelStaking) |
| Decimales | 18 |
| Transferible | No (soulbound) |

### Fórmula de emisión

```
$FUELx = $FUEL × ((semanas / 129) + 1)
```

| Semanas de lock | Multiplicador | FUELx por 1000 FUEL |
|----------------|--------------|---------------------|
| 1              | 1.0078×      | 1,007.8 FUELx       |
| 13 (3 meses)   | 1.1008×      | 1,100.8 FUELx       |
| 26 (6 meses)   | 1.2016×      | 1,201.6 FUELx       |
| 52 (1 año)     | 1.4031×      | 1,403.1 FUELx       |
| 104 (2 años)   | 1.8062×      | 1,806.2 FUELx       |

El multiplicador máximo alcanzable (104 semanas) es ~1.806×.

### Usos de $FUELx
- **Votación DAO** — poder de voto cuadrático: `votes = sqrt(FUELxBalance / 1e18)`
- **Crear propuestas** — requiere ≥ 500 $FUELx
- **Acceso a tiers** — determina privilegios en el protocolo

### Se destruye al
- Hacer unstake (total del stake)
- No se puede transferir ni vender

---

## Sistema de Tiers

Basado en el balance de $FUEL del usuario:

| Tier | Requisito | Color | Beneficios (planificados) |
|------|-----------|-------|---------------------------|
| NitroFUEL | ≥ 500 FUEL | Cyan (#00E5FF) | Acceso prioritario a STOs, fees reducidos |
| TurboFUEL | ≥ 200 FUEL | Morado (#7B2FBE) | Acceso anticipado a nuevos proyectos |
| EcoFUEL | ≥ 100 FUEL | Naranja (#FF6B35) | Participación en STOs básicos |
| Sin Tier | < 100 FUEL | Gris | Solo visualización |

---

## Flujo económico del protocolo

```
Inversores USDT
      │
      ▼ invest()
FuelSTO (por gasolinera)
      │
      ▼ Operador construye y opera
Gasolinera genera ingresos
      │
      ▼ distributeReturns()
Inversores reciben USDT
      │
Parte del margen del protocolo → FuelTreasury (pendiente)
      │
      ▼ depositRewards()
FuelStaking.rewardPool
      │
      ▼ distributeRewards() (pendiente de implementar)
Stakers reclaman FUEL
```

---

## Fees del protocolo

| Operación | Fee | Destino |
|-----------|-----|---------|
| Unstake anticipado | 20% → 2% lineal según tiempo | `rewardPool` de FuelStaking |
| Claim rewards | 2.5% flat | `rewardPool` de FuelStaking |
| Inversión STO | 0% (MVP) | — |
| Distribución de returns | 0% (MVP) | — |
