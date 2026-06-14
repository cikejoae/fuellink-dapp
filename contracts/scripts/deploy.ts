import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)
  console.log('Balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'MATIC')

  // 1. FUELToken
  const FUELToken = await ethers.getContractFactory('FUELToken')
  const fuel = await FUELToken.deploy(deployer.address, deployer.address)
  await fuel.waitForDeployment()
  console.log('✅ FUELToken:', await fuel.getAddress())

  // 2. FUELxToken
  const FUELxToken = await ethers.getContractFactory('FUELxToken')
  const fuelx = await FUELxToken.deploy(deployer.address)
  await fuelx.waitForDeployment()
  console.log('✅ FUELxToken:', await fuelx.getAddress())

  // 3. FuelStaking
  const FuelStaking = await ethers.getContractFactory('FuelStaking')
  const staking = await FuelStaking.deploy(
    await fuel.getAddress(),
    await fuelx.getAddress(),
    deployer.address,
  )
  await staking.waitForDeployment()
  console.log('✅ FuelStaking:', await staking.getAddress())

  // Grant staking contract MINTER_ROLE on FUELx
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'))
  await fuelx.grantRole(MINTER_ROLE, await staking.getAddress())
  console.log('✅ FUELx MINTER_ROLE granted to Staking')

  // 4. FuelDAO
  const FuelDAO = await ethers.getContractFactory('FuelDAO')
  const dao = await FuelDAO.deploy(await fuelx.getAddress(), deployer.address)
  await dao.waitForDeployment()
  console.log('✅ FuelDAO:', await dao.getAddress())

  // 5. Example STO — NanoGAS Tijuana Norte
  const USDT_POLYGON = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' // USDT on Polygon mainnet
  const deadline     = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60 // 90 days
  const FuelSTO      = await ethers.getContractFactory('FuelSTO')
  const sto = await FuelSTO.deploy(
    USDT_POLYGON,
    deployer.address,
    'NanoGAS Tijuana Norte',
    'NGS-001',
    ethers.parseUnits('250000', 6), // $250,000 USDT
    ethers.parseUnits('500', 6),    // $500 min
    deadline,
    1600, // 16% APY
  )
  await sto.waitForDeployment()
  console.log('✅ FuelSTO NGS-001:', await sto.getAddress())

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log('\n─── Deployment Summary ────────────────────────────────')
  console.log('NEXT_PUBLIC_FUEL_TOKEN_ADDRESS  =', await fuel.getAddress())
  console.log('NEXT_PUBLIC_FUELX_TOKEN_ADDRESS =', await fuelx.getAddress())
  console.log('NEXT_PUBLIC_STAKING_ADDRESS     =', await staking.getAddress())
  console.log('NEXT_PUBLIC_DAO_ADDRESS         =', await dao.getAddress())
  console.log('STO_NGS001_ADDRESS              =', await sto.getAddress())
  console.log('───────────────────────────────────────────────────────')
  console.log('Copy the above values into your .env file.')
}

main().catch(err => { console.error(err); process.exit(1) })
