import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FUELToken', () => {
  async function deployFixture() {
    const [owner, minter, pauser, user1, user2] = await ethers.getSigners()

    const FUELToken = await ethers.getContractFactory('FUELToken')
    const token = await FUELToken.deploy(owner.address, owner.address)
    await token.waitForDeployment()

    const MINTER_ROLE = await token.MINTER_ROLE()
    const PAUSER_ROLE = await token.PAUSER_ROLE()
    const BURNER_ROLE = await token.BURNER_ROLE()
    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE()

    return { token, owner, minter, pauser, user1, user2, MINTER_ROLE, PAUSER_ROLE, BURNER_ROLE, DEFAULT_ADMIN_ROLE }
  }

  describe('Deployment', () => {
    it('mints full MAX_SUPPLY to initialRecipient', async () => {
      const { token, owner } = await loadFixture(deployFixture)
      const maxSupply = await token.MAX_SUPPLY()
      expect(await token.totalSupply()).to.equal(maxSupply)
      expect(await token.balanceOf(owner.address)).to.equal(maxSupply)
    })

    it('sets correct name and symbol', async () => {
      const { token } = await loadFixture(deployFixture)
      expect(await token.name()).to.equal('FuelLink Token')
      expect(await token.symbol()).to.equal('FUEL')
    })

    it('grants all roles to admin', async () => {
      const { token, owner, MINTER_ROLE, PAUSER_ROLE, BURNER_ROLE, DEFAULT_ADMIN_ROLE } = await loadFixture(deployFixture)
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true
      expect(await token.hasRole(MINTER_ROLE, owner.address)).to.be.true
      expect(await token.hasRole(PAUSER_ROLE, owner.address)).to.be.true
      expect(await token.hasRole(BURNER_ROLE, owner.address)).to.be.true
    })
  })

  describe('mintToRewardsPool', () => {
    it('reverts if rewards pool not set', async () => {
      const { token } = await loadFixture(deployFixture)
      await expect(token.mintToRewardsPool(100n))
        .to.be.revertedWith('FUEL: rewards pool not set')
    })

    it('reverts within 12-month cooldown', async () => {
      const { token, owner, user1 } = await loadFixture(deployFixture)

      // Set rewards pool; burn enough supply to allow minting (totalSupply starts at MAX_SUPPLY)
      await token.setRewardsPool(user1.address)
      const mintAmount = ethers.parseEther('1000')
      await token.burn(mintAmount) // create headroom under MAX_SUPPLY

      // First mint succeeds (cooldown starts at 0)
      await token.mintToRewardsPool(mintAmount)

      // Second mint within 12 months should revert on cooldown
      await token.burn(mintAmount)
      await expect(token.mintToRewardsPool(mintAmount))
        .to.be.revertedWith('FUEL: mint cooldown active')
    })

    it('mints after 365 days when pool is below 20%', async () => {
      const { token, owner, user1 } = await loadFixture(deployFixture)
      await token.setRewardsPool(user1.address)
      const mintAmount = ethers.parseEther('1000')

      // Burn to create headroom, then first mint
      await token.burn(mintAmount)
      await token.mintToRewardsPool(mintAmount)

      // Advance 365 days and burn again for headroom
      await time.increase(365 * 24 * 60 * 60)
      await token.burn(mintAmount)

      const balBefore = await token.balanceOf(user1.address)
      await token.mintToRewardsPool(mintAmount)
      expect(await token.balanceOf(user1.address)).to.equal(balBefore + mintAmount)
    })

    it('reverts when rewards pool exceeds 20% of MAX_SUPPLY', async () => {
      const { token, owner } = await loadFixture(deployFixture)
      // Make owner the rewards pool (owner holds full MAX_SUPPLY = 100%)
      await token.setRewardsPool(owner.address)

      await expect(token.mintToRewardsPool(1n))
        .to.be.revertedWith('FUEL: rewards pool > 20% of supply')
    })

    it('reverts if caller lacks MINTER_ROLE', async () => {
      const { token, user1, user2, MINTER_ROLE } = await loadFixture(deployFixture)
      await token.setRewardsPool(user2.address)
      await expect(token.connect(user1).mintToRewardsPool(100n))
        .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount')
    })
  })

  describe('Pause', () => {
    it('blocks transfers when paused', async () => {
      const { token, owner, user1 } = await loadFixture(deployFixture)
      await token.pause()
      await expect(token.transfer(user1.address, 100n))
        .to.be.revertedWithCustomError(token, 'EnforcedPause')
    })

    it('allows transfers after unpause', async () => {
      const { token, owner, user1 } = await loadFixture(deployFixture)
      await token.pause()
      await token.unpause()
      await expect(token.transfer(user1.address, 100n)).to.not.be.reverted
    })

    it('reverts pause from non-pauser', async () => {
      const { token, user1 } = await loadFixture(deployFixture)
      await expect(token.connect(user1).pause())
        .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount')
    })
  })

  describe('Burn', () => {
    it('allows token holders to burn their own tokens', async () => {
      const { token, owner } = await loadFixture(deployFixture)
      const burnAmount = ethers.parseEther('1000')
      const balBefore = await token.balanceOf(owner.address)
      await token.burn(burnAmount)
      expect(await token.balanceOf(owner.address)).to.equal(balBefore - burnAmount)
    })
  })

  describe('setRewardsPool', () => {
    it('emits RewardsPoolUpdated', async () => {
      const { token, owner, user1 } = await loadFixture(deployFixture)
      await expect(token.setRewardsPool(user1.address))
        .to.emit(token, 'RewardsPoolUpdated')
        .withArgs(ethers.ZeroAddress, user1.address)
    })

    it('reverts from non-admin', async () => {
      const { token, user1 } = await loadFixture(deployFixture)
      await expect(token.connect(user1).setRewardsPool(user1.address))
        .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount')
    })
  })
})
