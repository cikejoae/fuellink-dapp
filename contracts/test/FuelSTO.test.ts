import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FuelSTO', () => {
  const FUNDING_TARGET = ethers.parseUnits('250000', 6)   // $250k USDT
  const MIN_INVESTMENT = ethers.parseUnits('500', 6)       // $500 min
  const PROJECTED_APY  = 1600                              // 16%

  async function deployFixture() {
    const [admin, investor1, investor2, investor3] = await ethers.getSigners()

    const MockERC20 = await ethers.getContractFactory('MockERC20')
    const usdt = await MockERC20.deploy('Mock USDT', 'USDT', 6)
    await usdt.waitForDeployment()

    const deadline = (await time.latest()) + 90 * 24 * 60 * 60 // 90 days

    const FuelSTO = await ethers.getContractFactory('FuelSTO')
    const sto = await FuelSTO.deploy(
      await usdt.getAddress(),
      admin.address,
      'NanoGAS Tijuana Norte',
      'NGS-001',
      FUNDING_TARGET,
      MIN_INVESTMENT,
      deadline,
      PROJECTED_APY,
    )
    await sto.waitForDeployment()

    // Mint USDT to investors
    const investorFunds = ethers.parseUnits('100000', 6)
    await usdt.mint(investor1.address, investorFunds)
    await usdt.mint(investor2.address, investorFunds)
    await usdt.mint(investor3.address, investorFunds)

    // Approvals
    await usdt.connect(investor1).approve(await sto.getAddress(), ethers.MaxUint256)
    await usdt.connect(investor2).approve(await sto.getAddress(), ethers.MaxUint256)
    await usdt.connect(investor3).approve(await sto.getAddress(), ethers.MaxUint256)

    return { usdt, sto, admin, investor1, investor2, investor3, deadline }
  }

  describe('Deployment', () => {
    it('sets correct station info', async () => {
      const { sto } = await loadFixture(deployFixture)
      expect(await sto.stationName()).to.equal('NanoGAS Tijuana Norte')
      expect(await sto.stationId()).to.equal('NGS-001')
      expect(await sto.fundingTarget()).to.equal(FUNDING_TARGET)
      expect(await sto.minInvestment()).to.equal(MIN_INVESTMENT)
      expect(await sto.projectedAPY()).to.equal(PROJECTED_APY)
    })

    it('starts with zero raised', async () => {
      const { sto } = await loadFixture(deployFixture)
      expect(await sto.totalRaised()).to.equal(0n)
      expect(await sto.fundingComplete()).to.be.false
    })
  })

  describe('invest()', () => {
    it('accepts valid investment', async () => {
      const { sto, investor1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits('1000', 6)
      await sto.connect(investor1).invest(amount)
      expect(await sto.totalRaised()).to.equal(amount)
      expect(await sto.shares(investor1.address)).to.equal(amount)
    })

    it('emits InvestmentReceived', async () => {
      const { sto, investor1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits('5000', 6)
      await expect(sto.connect(investor1).invest(amount))
        .to.emit(sto, 'InvestmentReceived')
        .withArgs(investor1.address, amount)
    })

    it('adds investor to array on first investment only', async () => {
      const { sto, investor1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits('1000', 6)
      await sto.connect(investor1).invest(amount)
      await sto.connect(investor1).invest(amount)
      expect(await sto.getInvestorCount()).to.equal(1n)
    })

    it('reverts below minimum investment', async () => {
      const { sto, investor1 } = await loadFixture(deployFixture)
      await expect(sto.connect(investor1).invest(ethers.parseUnits('100', 6)))
        .to.be.revertedWith('STO: below minimum')
    })

    it('reverts when deadline has passed', async () => {
      const { sto, investor1, deadline } = await loadFixture(deployFixture)
      await time.increaseTo(deadline + 1)
      await expect(sto.connect(investor1).invest(MIN_INVESTMENT))
        .to.be.revertedWith('STO: deadline passed')
    })

    it('marks funding complete when target reached', async () => {
      const { sto, usdt, admin, investor1, investor2, investor3 } = await loadFixture(deployFixture)

      // Need to raise $250k total; each investor has $100k; use 3 investors
      const share1 = ethers.parseUnits('100000', 6)
      const share2 = ethers.parseUnits('100000', 6)
      const share3 = ethers.parseUnits('50000', 6)

      await usdt.mint(investor3.address, ethers.parseUnits('50000', 6))
      await sto.connect(investor1).invest(share1)
      await sto.connect(investor2).invest(share2)

      await expect(sto.connect(investor3).invest(share3))
        .to.emit(sto, 'FundingComplete')
        .withArgs(FUNDING_TARGET)

      expect(await sto.fundingComplete()).to.be.true
    })

    it('reverts when funding already complete', async () => {
      const { sto, usdt, investor1, investor2, investor3 } = await loadFixture(deployFixture)
      await usdt.mint(investor3.address, ethers.parseUnits('100000', 6))

      await sto.connect(investor1).invest(ethers.parseUnits('100000', 6))
      await sto.connect(investor2).invest(ethers.parseUnits('100000', 6))
      await sto.connect(investor3).invest(ethers.parseUnits('50000', 6))

      await expect(sto.connect(investor3).invest(MIN_INVESTMENT))
        .to.be.revertedWith('STO: funding complete')
    })
  })

  describe('getSharePercentage()', () => {
    it('returns correct basis points for an investor', async () => {
      const { sto, investor1, investor2 } = await loadFixture(deployFixture)
      const amount1 = ethers.parseUnits('10000', 6)  // 50%
      const amount2 = ethers.parseUnits('10000', 6)  // 50%
      await sto.connect(investor1).invest(amount1)
      await sto.connect(investor2).invest(amount2)

      expect(await sto.getSharePercentage(investor1.address)).to.equal(5000n) // 50% in bps
    })
  })

  describe('distributeReturns()', () => {
    async function fundedFixture() {
      const base = await deployFixture()
      const { sto, usdt, admin, investor1, investor2 } = base
      const share1 = ethers.parseUnits('150000', 6)
      const share2 = ethers.parseUnits('100000', 6)
      await usdt.mint(investor1.address, share1)
      await usdt.mint(investor2.address, share2)
      await sto.connect(investor1).invest(share1)
      await sto.connect(investor2).invest(share2)
      // total = 250k → funding complete
      return base
    }

    it('distributes returns proportionally', async () => {
      const { sto, usdt, admin, investor1, investor2 } = await fundedFixture()

      const returnAmount = ethers.parseUnits('25000', 6) // 10% return
      await usdt.mint(admin.address, returnAmount)
      await usdt.connect(admin).approve(await sto.getAddress(), returnAmount)

      const bal1Before = await usdt.balanceOf(investor1.address)
      const bal2Before = await usdt.balanceOf(investor2.address)

      await sto.connect(admin).distributeReturns(returnAmount)

      // investor1 has 150k/250k = 60% → 15000 USDT
      // investor2 has 100k/250k = 40% → 10000 USDT
      expect(await usdt.balanceOf(investor1.address)).to.equal(
        bal1Before + ethers.parseUnits('15000', 6)
      )
      expect(await usdt.balanceOf(investor2.address)).to.equal(
        bal2Before + ethers.parseUnits('10000', 6)
      )
    })

    it('emits ReturnsDistributed', async () => {
      const { sto, usdt, admin } = await fundedFixture()
      const returnAmount = ethers.parseUnits('1000', 6)
      await usdt.mint(admin.address, returnAmount)
      await usdt.connect(admin).approve(await sto.getAddress(), returnAmount)
      await expect(sto.connect(admin).distributeReturns(returnAmount))
        .to.emit(sto, 'ReturnsDistributed')
    })

    it('reverts if funding not complete', async () => {
      const { sto, usdt, admin } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits('1000', 6)
      await usdt.mint(admin.address, amount)
      await usdt.connect(admin).approve(await sto.getAddress(), amount)
      await expect(sto.connect(admin).distributeReturns(amount))
        .to.be.revertedWith('STO: not funded')
    })

    it('reverts from non-owner', async () => {
      const { sto, investor1 } = await fundedFixture()
      await expect(sto.connect(investor1).distributeReturns(100n))
        .to.be.revertedWithCustomError(sto, 'OwnableUnauthorizedAccount')
    })
  })

  describe('refund()', () => {
    it('refunds investor if deadline passed without funding', async () => {
      const { sto, usdt, investor1, deadline } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits('2000', 6)
      await sto.connect(investor1).invest(amount)

      const balBefore = await usdt.balanceOf(investor1.address)
      await time.increaseTo(deadline + 1)
      await sto.connect(investor1).refund()

      expect(await usdt.balanceOf(investor1.address)).to.equal(balBefore + amount)
      expect(await sto.shares(investor1.address)).to.equal(0n)
    })

    it('reverts refund before deadline', async () => {
      const { sto, investor1 } = await loadFixture(deployFixture)
      await sto.connect(investor1).invest(MIN_INVESTMENT)
      await expect(sto.connect(investor1).refund())
        .to.be.revertedWith('STO: deadline not passed')
    })

    it('reverts refund if no investment', async () => {
      const { sto, investor1, deadline } = await loadFixture(deployFixture)
      await time.increaseTo(deadline + 1)
      await expect(sto.connect(investor1).refund())
        .to.be.revertedWith('STO: no investment')
    })
  })

  describe('distributeDivest()', () => {
    it('distributes divest proportionally and marks complete', async () => {
      const { sto, usdt, admin, investor1, investor2 } = await loadFixture(deployFixture)

      // Partial investment (no need for full funding to test divest)
      const inv1 = ethers.parseUnits('10000', 6)
      const inv2 = ethers.parseUnits('10000', 6)
      await usdt.mint(investor1.address, inv1)
      await usdt.mint(investor2.address, inv2)
      await sto.connect(investor1).invest(inv1)
      await sto.connect(investor2).invest(inv2)

      // Admin distributes divest of 20k
      const divestAmount = ethers.parseUnits('20000', 6)
      await usdt.mint(admin.address, divestAmount)
      await usdt.connect(admin).approve(await sto.getAddress(), divestAmount)

      const bal1Before = await usdt.balanceOf(investor1.address)
      await sto.connect(admin).distributeDivest(divestAmount)

      // 50/50 split → each gets 10k
      expect(await usdt.balanceOf(investor1.address)).to.equal(
        bal1Before + ethers.parseUnits('10000', 6)
      )
      expect(await sto.divestComplete()).to.be.true
    })

    it('reverts double divest', async () => {
      const { sto, usdt, admin, investor1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits('1000', 6)
      await usdt.mint(investor1.address, amount)
      await sto.connect(investor1).invest(amount)

      await usdt.mint(admin.address, amount)
      await usdt.connect(admin).approve(await sto.getAddress(), amount)
      await sto.connect(admin).distributeDivest(amount)

      await usdt.mint(admin.address, amount)
      await usdt.connect(admin).approve(await sto.getAddress(), amount)
      await expect(sto.connect(admin).distributeDivest(amount))
        .to.be.revertedWith('STO: already divested')
    })
  })

  describe('emergencyWithdraw()', () => {
    it('allows admin to withdraw any token (admin only)', async () => {
      const { sto, usdt, admin, investor1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits('1000', 6)
      await sto.connect(investor1).invest(amount) // fund the contract

      const balBefore = await usdt.balanceOf(admin.address)
      await sto.connect(admin).emergencyWithdraw(await usdt.getAddress(), amount)
      expect(await usdt.balanceOf(admin.address)).to.equal(balBefore + amount)
    })
  })
})
