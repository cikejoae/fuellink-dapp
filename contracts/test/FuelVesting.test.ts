import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FuelVesting', () => {
  const VEST_AMOUNT = ethers.parseEther('120000') // 120k FUEL

  async function deployFixture() {
    const [admin, beneficiary, other] = await ethers.getSigners()

    const FUELToken = await ethers.getContractFactory('FUELToken')
    const fuel = await FUELToken.deploy(admin.address, admin.address)
    await fuel.waitForDeployment()

    const FuelVesting = await ethers.getContractFactory('FuelVesting')
    const vesting = await FuelVesting.deploy(await fuel.getAddress(), admin.address)
    await vesting.waitForDeployment()

    // Fund the vesting contract
    await fuel.transfer(await vesting.getAddress(), VEST_AMOUNT)

    return { fuel, vesting, admin, beneficiary, other }
  }

  describe('createSchedule()', () => {
    it('creates a schedule with correct parameters', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      const startTs = await time.latest()
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 365, 1095, startTs)

      const s = await vesting.schedules(1n)
      expect(s.beneficiary).to.equal(beneficiary.address)
      expect(s.amount).to.equal(VEST_AMOUNT)
      expect(s.released).to.equal(0n)
      expect(s.cliff).to.equal(BigInt(365 * 24 * 60 * 60))
      expect(s.duration).to.equal(BigInt(1095 * 24 * 60 * 60))
      expect(s.revoked).to.be.false
    })

    it('emits ScheduleCreated', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await expect(vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 365, 1095, 0))
        .to.emit(vesting, 'ScheduleCreated')
    })

    it('reverts with zero beneficiary', async () => {
      const { vesting, admin } = await loadFixture(deployFixture)
      await expect(vesting.connect(admin).createSchedule(ethers.ZeroAddress, VEST_AMOUNT, 0, 365, 0))
        .to.be.revertedWith('Vesting: zero beneficiary')
    })

    it('reverts with zero amount', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await expect(vesting.connect(admin).createSchedule(beneficiary.address, 0, 0, 365, 0))
        .to.be.revertedWith('Vesting: zero amount')
    })

    it('reverts when cliff > duration', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await expect(vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 400, 365, 0))
        .to.be.revertedWith('Vesting: cliff > duration')
    })

    it('reverts from non-owner', async () => {
      const { vesting, other, beneficiary } = await loadFixture(deployFixture)
      await expect(vesting.connect(other).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0))
        .to.be.revertedWithCustomError(vesting, 'OwnableUnauthorizedAccount')
    })
  })

  describe('releasable() — cliff and linear vesting', () => {
    it('returns 0 before cliff ends', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 365, 1095, 0)
      expect(await vesting.releasable(1n)).to.equal(0n)
    })

    it('returns partial amount after cliff (linear)', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      const startTs = await time.latest()
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, startTs + 1)

      // Advance 180 days (≈ 49.3% of 365)
      await time.increase(180 * 24 * 60 * 60)
      const rel = await vesting.releasable(1n)
      expect(rel).to.be.gt(0n)
      expect(rel).to.be.lt(VEST_AMOUNT)
    })

    it('returns full amount after full duration', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)
      await time.increase(366 * 24 * 60 * 60)
      expect(await vesting.releasable(1n)).to.equal(VEST_AMOUNT)
    })

    it('no cliff: vesting begins immediately after start', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      const startTs = await time.latest()
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, startTs)
      await time.increase(1 * 24 * 60 * 60) // 1 day
      expect(await vesting.releasable(1n)).to.be.gt(0n)
    })
  })

  describe('release()', () => {
    it('transfers vested tokens to beneficiary', async () => {
      const { fuel, vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)
      await time.increase(366 * 24 * 60 * 60)

      const balBefore = await fuel.balanceOf(beneficiary.address)
      await vesting.connect(beneficiary).release(1n)
      expect(await fuel.balanceOf(beneficiary.address)).to.equal(balBefore + VEST_AMOUNT)
    })

    it('emits Released', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)
      await time.increase(366 * 24 * 60 * 60)
      await expect(vesting.connect(beneficiary).release(1n))
        .to.emit(vesting, 'Released')
    })

    it('subsequent releases only pay newly vested tokens', async () => {
      const { fuel, vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)

      await time.increase(180 * 24 * 60 * 60)
      await vesting.connect(beneficiary).release(1n)
      const midBalance = await fuel.balanceOf(beneficiary.address)

      await time.increase(186 * 24 * 60 * 60) // past full duration
      await vesting.connect(beneficiary).release(1n)
      const finalBalance = await fuel.balanceOf(beneficiary.address)

      expect(finalBalance - midBalance).to.be.gt(0n)
      expect(finalBalance).to.be.closeTo(VEST_AMOUNT, ethers.parseEther('0.01'))
    })

    it('reverts if caller is not beneficiary', async () => {
      const { vesting, admin, other } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(other.address, VEST_AMOUNT, 0, 365, 0)
      await time.increase(366 * 24 * 60 * 60)
      await expect(vesting.connect(admin).release(1n))
        .to.be.revertedWith('Vesting: not beneficiary')
    })

    it('reverts if nothing to release', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 365, 1095, 0)
      await expect(vesting.connect(beneficiary).release(1n))
        .to.be.revertedWith('Vesting: nothing to release')
    })

    it('reverts if schedule is revoked', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)
      await vesting.connect(admin).revoke(1n)
      await time.increase(400 * 24 * 60 * 60)
      await expect(vesting.connect(beneficiary).release(1n))
        .to.be.revertedWith('Vesting: schedule revoked')
    })
  })

  describe('revoke()', () => {
    it('returns unvested tokens to owner and pays vested to beneficiary', async () => {
      const { fuel, vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)

      // Advance to 50% through vesting
      await time.increase(182 * 24 * 60 * 60)

      const adminBefore = await fuel.balanceOf(admin.address)
      const benBefore   = await fuel.balanceOf(beneficiary.address)

      await vesting.connect(admin).revoke(1n)

      const adminAfter = await fuel.balanceOf(admin.address)
      const benAfter   = await fuel.balanceOf(beneficiary.address)

      // Beneficiary received ~50% (vested portion)
      expect(benAfter - benBefore).to.be.gt(0n)
      // Owner received ~50% (unvested portion)
      expect(adminAfter - adminBefore).to.be.gt(0n)
      // Total returned ≈ VEST_AMOUNT
      expect((benAfter - benBefore) + (adminAfter - adminBefore))
        .to.be.closeTo(VEST_AMOUNT, ethers.parseEther('1'))
    })

    it('emits Revoked with unvested amount', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)
      await expect(vesting.connect(admin).revoke(1n))
        .to.emit(vesting, 'Revoked')
    })

    it('reverts double revoke', async () => {
      const { vesting, admin, beneficiary } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)
      await vesting.connect(admin).revoke(1n)
      await expect(vesting.connect(admin).revoke(1n))
        .to.be.revertedWith('Vesting: already revoked')
    })

    it('reverts from non-owner', async () => {
      const { vesting, admin, beneficiary, other } = await loadFixture(deployFixture)
      await vesting.connect(admin).createSchedule(beneficiary.address, VEST_AMOUNT, 0, 365, 0)
      await expect(vesting.connect(other).revoke(1n))
        .to.be.revertedWithCustomError(vesting, 'OwnableUnauthorizedAccount')
    })
  })
})
