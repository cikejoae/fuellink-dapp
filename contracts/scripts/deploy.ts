import { ethers, network } from 'hardhat'

const USDT_POLYGON_MAINNET = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'

// Timelock: 2-day min delay on mainnet, 5-min on testnet for easier testing
const TIMELOCK_DELAY = network.name === 'polygon'
  ? 2 * 24 * 60 * 60
  : 5 * 60

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)
  console.log('Balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'MATIC')
  console.log('Network:', network.name)
  console.log()

  // ─── 1. USDT ──────────────────────────────────────────────────────────────
  let usdtAddress: string
  if (network.name === 'polygon') {
    usdtAddress = USDT_POLYGON_MAINNET
    console.log('Using mainnet USDT:', usdtAddress)
  } else {
    const MockERC20 = await ethers.getContractFactory('MockERC20')
    const mockUsdt  = await MockERC20.deploy('Mock USDT', 'USDT', 6)
    await mockUsdt.waitForDeployment()
    usdtAddress = await mockUsdt.getAddress()
    console.log('✅ MockUSDT (testnet):', usdtAddress)
  }

  // ─── 2. FUELToken ─────────────────────────────────────────────────────────
  const FUELToken = await ethers.getContractFactory('FUELToken')
  const fuel = await FUELToken.deploy(deployer.address, deployer.address)
  await fuel.waitForDeployment()
  console.log('✅ FUELToken:', await fuel.getAddress())

  // ─── 3. FUELxToken ────────────────────────────────────────────────────────
  const FUELxToken = await ethers.getContractFactory('FUELxToken')
  const fuelx = await FUELxToken.deploy(deployer.address)
  await fuelx.waitForDeployment()
  console.log('✅ FUELxToken:', await fuelx.getAddress())

  // ─── 4. FuelStaking ───────────────────────────────────────────────────────
  const FuelStaking = await ethers.getContractFactory('FuelStaking')
  const staking = await FuelStaking.deploy(
    await fuel.getAddress(),
    await fuelx.getAddress(),
    deployer.address,
  )
  await staking.waitForDeployment()
  console.log('✅ FuelStaking:', await staking.getAddress())

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'))
  await fuelx.grantRole(MINTER_ROLE, await staking.getAddress())
  console.log('   FUELx MINTER_ROLE → Staking')

  // ─── 5. FuelDAO ───────────────────────────────────────────────────────────
  const FuelDAO = await ethers.getContractFactory('FuelDAO')
  const dao = await FuelDAO.deploy(await fuelx.getAddress(), deployer.address)
  await dao.waitForDeployment()
  console.log('✅ FuelDAO:', await dao.getAddress())

  // ─── 6. FuelTreasury ──────────────────────────────────────────────────────
  const FuelTreasury = await ethers.getContractFactory('FuelTreasury')
  const treasury = await FuelTreasury.deploy(
    await fuel.getAddress(),
    await staking.getAddress(),
    deployer.address,
  )
  await treasury.waitForDeployment()
  console.log('✅ FuelTreasury:', await treasury.getAddress())

  // ─── 7. FuelVesting ───────────────────────────────────────────────────────
  const FuelVesting = await ethers.getContractFactory('FuelVesting')
  const vesting = await FuelVesting.deploy(await fuel.getAddress(), deployer.address)
  await vesting.waitForDeployment()
  console.log('✅ FuelVesting:', await vesting.getAddress())

  // ─── 8. FuelSTO — NanoGAS Tijuana Norte ──────────────────────────────────
  const deadline = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60
  const FuelSTO  = await ethers.getContractFactory('FuelSTO')
  const sto = await FuelSTO.deploy(
    usdtAddress,
    deployer.address,
    'NanoGAS Tijuana Norte',
    'NGS-001',
    ethers.parseUnits('250000', 6),
    ethers.parseUnits('500', 6),
    deadline,
    1600,
  )
  await sto.waitForDeployment()
  console.log('✅ FuelSTO NGS-001:', await sto.getAddress())

  // ─── 9. TimelockController (P2 security) ─────────────────────────────────
  // Proposers: DAO only. Executors: anyone (open execution). Admin: deployer (renounce after audit).
  const TimelockController = await ethers.getContractFactory('TimelockController')
  const timelock = await TimelockController.deploy(
    TIMELOCK_DELAY,
    [await dao.getAddress()],   // proposers
    [ethers.ZeroAddress],       // executors (anyone)
    deployer.address,           // admin — renounce after prod setup
  )
  await timelock.waitForDeployment()
  console.log('✅ TimelockController:', await timelock.getAddress())
  console.log(`   Delay: ${TIMELOCK_DELAY}s (${network.name === 'polygon' ? '2 days' : '5 min testnet'})`)

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n─── Deployment Summary ────────────────────────────────────')
  console.log('NEXT_PUBLIC_FUEL_TOKEN_ADDRESS  =', await fuel.getAddress())
  console.log('NEXT_PUBLIC_FUELX_TOKEN_ADDRESS =', await fuelx.getAddress())
  console.log('NEXT_PUBLIC_STAKING_ADDRESS     =', await staking.getAddress())
  console.log('NEXT_PUBLIC_DAO_ADDRESS         =', await dao.getAddress())
  console.log('NEXT_PUBLIC_TREASURY_ADDRESS    =', await treasury.getAddress())
  console.log('NEXT_PUBLIC_VESTING_ADDRESS     =', await vesting.getAddress())
  console.log('NEXT_PUBLIC_STO_ADDRESS         =', await sto.getAddress())
  console.log('NEXT_PUBLIC_TIMELOCK_ADDRESS    =', await timelock.getAddress())
  if (network.name !== 'polygon') {
    console.log('NEXT_PUBLIC_USDT_ADDRESS        =', usdtAddress, '(mock testnet USDT)')
  }
  console.log('──────────────────────────────────────────────────────────')
  console.log('Copy the above values into frontend/.env.local')
  console.log()
  console.log('⚠️  Before mainnet: transfer ownership of all contracts to TimelockController,')
  console.log('    then renounce deployer admin role. See docs/deployment.md.')
}

main().catch(err => { console.error(err); process.exit(1) })
