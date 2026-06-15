import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FuelStaking', () => {
  async function deployFixture() {
    const [admin, user1, user2, user3] = await ethers.getSigners()

    const FUELToken = await ethers.getContractFactory('FUELToken')
    const fuel = await FUELToken.deploy(admin.address, admin.address)
    await fuel.waitForDeployment()

    const FUELxToken = await ethers.getContractFactory('FUELxToken')
    const fuelx = await FUELxToken.deploy(admin.address)
    await fuelx.waitForDeployment()

    const FuelStaking = await ethers.getContractFactory('FuelStaking')
    const staking = await FuelStaking.deploy(
      await fuel.getAddress(),
      await fuelx.getAddress(),
      admin.address,
    )
    await staking.waitForDeployment()

    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'))
    await fuelx.connect(admin).grantRole(MINTER_ROLE, await staking.getAddress())

    const userAmount = ethers.parseEther('100000')
    await fuel.connect(admin).transfer(user1.address, userAmount)
    await fuel.connect(admin).transfer(user2.address, userAmount)
    await fuel.connect(admin).transfer(user3.address, userAmount)

    await fuel.connect(user1).approve(await staking.getAddress(), ethers.MaxUint256)
    await fuel.connect(user2).approve(await staking.getAddress(), ethers.MaxUint256)
    await fuel.connect(user3).approve(await staking.getAddress(), ethers.MaxUint256)
    await fuel.connect(admin).approve(await staking.getAddress(), ethers.MaxUint256)

    return { fuel, fuelx, staking, admin, user1, user2, user3 }
  }

  describe('Deployment', () => {
    it('stores correct token addresses', async () => {
      const { fuel, fuelx, staking } = await loadFixture(deployFixture)
      expect(await staking.fuelToken()).to.equal(await fuel.getAddress())
      expect(await staking.fuelxToken()).to.equal(await fuelx.getAddress())
    })

    it('starts with zero totalStaked and zero accumulator', async () => {
      const { staking } = await loadFixture(deployFixture)
      expect(await staking.totalStaked()).to.equal(0n)
      expect(await staking.rewardPerFuelxStored()).to.equal(0n)
    })
  })

  describe('stake()', () => {
    it('stakes tokens and mints FUELx', async () => {
      const { fuelx, staking, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 52n)
      expect(await staking.totalStaked()).to.equal(ethers.parseEther('1000'))
      expect(await fuelx.balanceOf(user1.address)).to.be.gt(0n)
    })

    it('longer lock produces more FUELx', async () => {
      const { fuelx, staking, user1, user2 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 4n)
      await staking.connect(user2).stake(ethers.parseEther('1000'), 104n)
      expect(await fuelx.balanceOf(user2.address)).to.be.gt(await fuelx.balanceOf(user1.address))
    })

    it('reverts for zero amount', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await expect(staking.connect(user1).stake(0n, 4n)).to.be.revertedWith('Stake: amount = 0')
    })

    it('reverts for duration below MIN_WEEKS', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await expect(staking.connect(user1).stake(ethers.parseEther('100'), 0n))
        .to.be.revertedWith('Stake: invalid duration')
    })

    it('reverts for duration above MAX_WEEKS', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await expect(staking.connect(user1).stake(ethers.parseEther('100'), 105n))
        .to.be.revertedWith('Stake: invalid duration')
    })

    it('emits Staked event', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await expect(staking.connect(user1).stake(ethers.parseEther('500'), 10n))
        .to.emit(staking, 'Staked')
    })
  })

  describe('unstake()', () => {
    it('returns tokens minus 20% early-exit fee when unstaking immediately', async () => {
      const { fuel, staking, user1 } = await loadFixture(deployFixture)
      const amount = ethers.parseEther('1000')
      const balBefore = await fuel.balanceOf(user1.address)
      await staking.connect(user1).stake(amount, 52n)
      await staking.connect(user1).unstake(0n)
      const received = (await fuel.balanceOf(user1.address)) - (balBefore - amount)
      expect(amount - received).to.equal(ethers.parseEther('200')) // 20% fee
    })

    it('returns full amount after lock period', async () => {
      const { fuel, staking, user1 } = await loadFixture(deployFixture)
      const amount = ethers.parseEther('1000')
      const balBefore = await fuel.balanceOf(user1.address)
      await staking.connect(user1).stake(amount, 4n)
      await time.increase(4 * 7 * 24 * 60 * 60 + 1)
      await staking.connect(user1).unstake(0n)
      expect(await fuel.balanceOf(user1.address)).to.equal(balBefore)
    })

    it('burns FUELx on unstake', async () => {
      const { fuelx, staking, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 4n)
      await staking.connect(user1).unstake(0n)
      expect(await fuelx.balanceOf(user1.address)).to.equal(0n)
    })

    it('early-exit fee re-enters accumulator for remaining stakers', async () => {
      const { staking, user1, user2 } = await loadFixture(deployFixture)
      const amount = ethers.parseEther('1000')
      await staking.connect(user1).stake(amount, 4n)
      await staking.connect(user2).stake(amount, 52n)

      const earnedBefore = await staking.earned(user2.address)
      // user1 unstakes early → 20% fee goes to accumulator
      await staking.connect(user1).unstake(0n)
      // user2 should now have earned the fee
      const earnedAfter = await staking.earned(user2.address)
      expect(earnedAfter).to.be.gt(earnedBefore)
    })

    it('reverts unstaking inactive stake', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('100'), 2n)
      await staking.connect(user1).unstake(0n)
      await expect(staking.connect(user1).unstake(0n)).to.be.revertedWith('Stake: not active')
    })

    it('emits Unstaked event', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('100'), 2n)
      await expect(staking.connect(user1).unstake(0n)).to.emit(staking, 'Unstaked')
    })
  })

  describe('earned() + reward accumulator', () => {
    it('earned() returns 0 before any deposits', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 10n)
      expect(await staking.earned(user1.address)).to.equal(0n)
    })

    it('distributes deposited rewards proportionally to FUELx holders', async () => {
      const { fuel, staking, admin, user1, user2 } = await loadFixture(deployFixture)
      // user1: 1000 FUEL × 52 weeks; user2: 1000 FUEL × 104 weeks → more FUELx
      await staking.connect(user1).stake(ethers.parseEther('1000'), 52n)
      await staking.connect(user2).stake(ethers.parseEther('1000'), 104n)

      const depositAmount = ethers.parseEther('1000')
      await staking.connect(admin).depositRewards(depositAmount)

      const earned1 = await staking.earned(user1.address)
      const earned2 = await staking.earned(user2.address)

      // Both earned something
      expect(earned1).to.be.gt(0n)
      expect(earned2).to.be.gt(0n)
      // user2 has more FUELx → earns more
      expect(earned2).to.be.gt(earned1)
      // Total ~= depositAmount (tiny rounding difference ok)
      expect(earned1 + earned2).to.be.closeTo(depositAmount, ethers.parseEther('0.001'))
    })

    it('new stake does NOT retroactively earn past rewards', async () => {
      const { fuel, staking, admin, user1, user2 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 52n)
      await staking.connect(admin).depositRewards(ethers.parseEther('500'))

      // user2 stakes AFTER the deposit
      await staking.connect(user2).stake(ethers.parseEther('1000'), 52n)

      // user2 should NOT have earned any of the past rewards
      expect(await staking.earned(user2.address)).to.equal(0n)
      // user1 should have all 500
      expect(await staking.earned(user1.address)).to.be.closeTo(
        ethers.parseEther('500'), ethers.parseEther('0.001')
      )
    })

    it('multiple deposits accumulate correctly', async () => {
      const { fuel, staking, admin, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 52n)
      await staking.connect(admin).depositRewards(ethers.parseEther('100'))
      await staking.connect(admin).depositRewards(ethers.parseEther('200'))
      expect(await staking.earned(user1.address)).to.be.closeTo(
        ethers.parseEther('300'), ethers.parseEther('0.001')
      )
    })
  })

  describe('claimRewards()', () => {
    it('reverts when earned = 0', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('100'), 4n)
      await expect(staking.connect(user1).claimRewards()).to.be.revertedWith('Stake: nothing to claim')
    })

    it('pays earned rewards minus 2.5% fee', async () => {
      const { fuel, staking, admin, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 52n)
      await staking.connect(admin).depositRewards(ethers.parseEther('1000'))

      const balBefore = await fuel.balanceOf(user1.address)
      await staking.connect(user1).claimRewards()
      const received = (await fuel.balanceOf(user1.address)) - balBefore

      // Should receive 1000 * 97.5% = 975 FUEL
      expect(received).to.be.closeTo(ethers.parseEther('975'), ethers.parseEther('0.01'))
    })

    it('claim fee re-enters accumulator', async () => {
      const { fuel, staking, admin, user1, user2 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 52n)
      await staking.connect(user2).stake(ethers.parseEther('1000'), 52n)
      await staking.connect(admin).depositRewards(ethers.parseEther('1000'))

      // user1 claims → their 2.5% fee goes back to accumulator
      await staking.connect(user1).claimRewards()

      // user2 should now earn a bit more (received user1's fee share)
      const earned2 = await staking.earned(user2.address)
      // user2's share ≈ 500 (half of 1000) + small fee share
      expect(earned2).to.be.gt(ethers.parseEther('500'))
    })

    it('rewards reset to 0 after claiming', async () => {
      const { staking, admin, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 52n)
      await staking.connect(admin).depositRewards(ethers.parseEther('100'))
      await staking.connect(user1).claimRewards()
      expect(await staking.rewards(user1.address)).to.equal(0n)
    })

    it('emits RewardsClaimed', async () => {
      const { staking, admin, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 52n)
      await staking.connect(admin).depositRewards(ethers.parseEther('100'))
      await expect(staking.connect(user1).claimRewards()).to.emit(staking, 'RewardsClaimed')
    })
  })

  describe('depositRewards()', () => {
    it('adds to accumulator (owner only)', async () => {
      const { staking, admin, user1 } = await loadFixture(deployFixture)
      await staking.connect(user1).stake(ethers.parseEther('1000'), 10n)
      const accBefore = await staking.rewardPerFuelxStored()
      await staking.connect(admin).depositRewards(ethers.parseEther('100'))
      expect(await staking.rewardPerFuelxStored()).to.be.gt(accBefore)
    })

    it('reverts from non-owner', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await expect(staking.connect(user1).depositRewards(100n))
        .to.be.revertedWithCustomError(staking, 'OwnableUnauthorizedAccount')
    })

    it('no-ops accumulator when there are no stakers (FUEL stays in contract)', async () => {
      const { fuel, staking, admin } = await loadFixture(deployFixture)
      await staking.connect(admin).depositRewards(ethers.parseEther('100'))
      // Accumulator stays 0 — no FUELx supply yet
      expect(await staking.rewardPerFuelxStored()).to.equal(0n)
    })
  })

  describe('Pause', () => {
    it('blocks staking when paused', async () => {
      const { staking, admin, user1 } = await loadFixture(deployFixture)
      await staking.connect(admin).pause()
      await expect(staking.connect(user1).stake(ethers.parseEther('100'), 4n))
        .to.be.revertedWithCustomError(staking, 'EnforcedPause')
    })

    it('reverts pause from non-owner', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await expect(staking.connect(user1).pause())
        .to.be.revertedWithCustomError(staking, 'OwnableUnauthorizedAccount')
    })
  })

  describe('setCConstant()', () => {
    it('updates cConstant and emits event', async () => {
      const { staking, admin } = await loadFixture(deployFixture)
      const newC = ethers.parseEther('2')
      await expect(staking.connect(admin).setCConstant(newC))
        .to.emit(staking, 'CConstantUpdated')
      expect(await staking.cConstant()).to.equal(newC)
    })

    it('reverts from non-owner', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      await expect(staking.connect(user1).setCConstant(1n))
        .to.be.revertedWithCustomError(staking, 'OwnableUnauthorizedAccount')
    })
  })

  describe('getStake()', () => {
    it('returns correct stake info', async () => {
      const { staking, user1 } = await loadFixture(deployFixture)
      const amount = ethers.parseEther('1000')
      await staking.connect(user1).stake(amount, 10n)
      const info = await staking.getStake(user1.address, 0n)
      expect(info.amount).to.equal(amount)
      expect(info.lockWeeks).to.equal(10n)
      expect(info.active).to.be.true
    })
  })
})
