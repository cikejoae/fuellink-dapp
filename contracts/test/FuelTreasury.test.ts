import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FuelTreasury', () => {
  async function deployFixture() {
    const [admin, other] = await ethers.getSigners()

    // Deploy supporting contracts
    const FUELToken = await ethers.getContractFactory('FUELToken')
    const fuel = await FUELToken.deploy(admin.address, admin.address)
    await fuel.waitForDeployment()

    const FUELxToken = await ethers.getContractFactory('FUELxToken')
    const fuelx = await FUELxToken.deploy(admin.address)
    await fuelx.waitForDeployment()

    const FuelStaking = await ethers.getContractFactory('FuelStaking')
    const staking = await FuelStaking.deploy(
      await fuel.getAddress(), await fuelx.getAddress(), admin.address
    )
    await staking.waitForDeployment()

    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'))
    await fuelx.grantRole(MINTER_ROLE, await staking.getAddress())

    const FuelTreasury = await ethers.getContractFactory('FuelTreasury')
    const treasury = await FuelTreasury.deploy(
      await fuel.getAddress(),
      await staking.getAddress(),
      admin.address,
    )
    await treasury.waitForDeployment()

    // Transfer FUEL to treasury so it has funds to distribute
    const treasuryFunds = ethers.parseEther('100000')
    await fuel.transfer(await treasury.getAddress(), treasuryFunds)

    // Treasury must own FuelStaking to call depositRewards (production architecture)
    await staking.connect(admin).transferOwnership(await treasury.getAddress())

    return { fuel, fuelx, staking, treasury, admin, other }
  }

  describe('Deployment', () => {
    it('stores correct fuelToken and stakingContract', async () => {
      const { fuel, staking, treasury } = await loadFixture(deployFixture)
      expect(await treasury.fuelToken()).to.equal(await fuel.getAddress())
      expect(await treasury.stakingContract()).to.equal(await staking.getAddress())
    })
  })

  describe('fundStakingRewards()', () => {
    it('transfers FUEL to staking and calls depositRewards', async () => {
      const { fuel, staking, treasury, admin, other } = await loadFixture(deployFixture)

      // A user needs to be staked so there is FUELx supply for the accumulator
      await fuel.transfer(other.address, ethers.parseEther('1000'))
      await fuel.connect(other).approve(await staking.getAddress(), ethers.MaxUint256)
      await staking.connect(other).stake(ethers.parseEther('1000'), 10n)

      const amount = ethers.parseEther('500')
      const accBefore = await staking.rewardPerFuelxStored()

      await treasury.connect(admin).fundStakingRewards(amount)

      // Accumulator should have increased
      expect(await staking.rewardPerFuelxStored()).to.be.gt(accBefore)
      // staker should have earned something
      expect(await staking.earned(other.address)).to.be.gt(0n)
    })

    it('emits StakingFunded', async () => {
      const { treasury, admin } = await loadFixture(deployFixture)
      await expect(treasury.connect(admin).fundStakingRewards(ethers.parseEther('100')))
        .to.emit(treasury, 'StakingFunded').withArgs(ethers.parseEther('100'))
    })

    it('reverts if stakingContract is zero', async () => {
      const { fuel, admin } = await loadFixture(deployFixture)
      const FuelTreasury = await ethers.getContractFactory('FuelTreasury')
      const t = await FuelTreasury.deploy(await fuel.getAddress(), ethers.ZeroAddress, admin.address)
      await fuel.transfer(await t.getAddress(), ethers.parseEther('100'))
      await expect(t.connect(admin).fundStakingRewards(ethers.parseEther('10')))
        .to.be.revertedWith('Treasury: staking not set')
    })

    it('reverts from non-owner', async () => {
      const { treasury, other } = await loadFixture(deployFixture)
      await expect(treasury.connect(other).fundStakingRewards(100n))
        .to.be.revertedWithCustomError(treasury, 'OwnableUnauthorizedAccount')
    })
  })

  describe('setStakingContract()', () => {
    it('updates stakingContract and emits event', async () => {
      const { treasury, admin, other } = await loadFixture(deployFixture)
      await expect(treasury.connect(admin).setStakingContract(other.address))
        .to.emit(treasury, 'StakingContractUpdated')
      expect(await treasury.stakingContract()).to.equal(other.address)
    })

    it('reverts from non-owner', async () => {
      const { treasury, other } = await loadFixture(deployFixture)
      await expect(treasury.connect(other).setStakingContract(other.address))
        .to.be.revertedWithCustomError(treasury, 'OwnableUnauthorizedAccount')
    })
  })

  describe('withdraw()', () => {
    it('sends ERC-20 to target and emits Withdrawn', async () => {
      const { fuel, treasury, admin, other } = await loadFixture(deployFixture)
      const amount = ethers.parseEther('1000')
      const balBefore = await fuel.balanceOf(other.address)
      await expect(treasury.connect(admin).withdraw(await fuel.getAddress(), other.address, amount))
        .to.emit(treasury, 'Withdrawn')
      expect(await fuel.balanceOf(other.address)).to.equal(balBefore + amount)
    })

    it('reverts from non-owner', async () => {
      const { fuel, treasury, other } = await loadFixture(deployFixture)
      await expect(treasury.connect(other).withdraw(await fuel.getAddress(), other.address, 1n))
        .to.be.revertedWithCustomError(treasury, 'OwnableUnauthorizedAccount')
    })
  })

  describe('withdrawMATIC()', () => {
    it('sends MATIC to target', async () => {
      const { treasury, admin, other } = await loadFixture(deployFixture)
      // Fund treasury with some MATIC
      await admin.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther('1') })

      const balBefore = await ethers.provider.getBalance(other.address)
      await treasury.connect(admin).withdrawMATIC(other.address, ethers.parseEther('0.5'))
      expect(await ethers.provider.getBalance(other.address)).to.equal(
        balBefore + ethers.parseEther('0.5')
      )
    })

    it('reverts from non-owner', async () => {
      const { treasury, other } = await loadFixture(deployFixture)
      await expect(treasury.connect(other).withdrawMATIC(other.address, 1n))
        .to.be.revertedWithCustomError(treasury, 'OwnableUnauthorizedAccount')
    })
  })

  describe('receive()', () => {
    it('accepts MATIC deposits', async () => {
      const { treasury, admin } = await loadFixture(deployFixture)
      await admin.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther('2') })
      expect(await ethers.provider.getBalance(await treasury.getAddress()))
        .to.equal(ethers.parseEther('2'))
    })
  })
})
