import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FUELxToken', () => {
  async function deployFixture() {
    const [admin, minter, user1, user2] = await ethers.getSigners()

    const FUELxToken = await ethers.getContractFactory('FUELxToken')
    const token = await FUELxToken.deploy(admin.address)
    await token.waitForDeployment()

    const MINTER_ROLE = await token.MINTER_ROLE()
    await token.connect(admin).grantRole(MINTER_ROLE, minter.address)

    return { token, admin, minter, user1, user2, MINTER_ROLE }
  }

  describe('Deployment', () => {
    it('has correct name and symbol', async () => {
      const { token } = await loadFixture(deployFixture)
      expect(await token.name()).to.equal('FuelLink Governance Token')
      expect(await token.symbol()).to.equal('FUELx')
    })

    it('starts with zero supply', async () => {
      const { token } = await loadFixture(deployFixture)
      expect(await token.totalSupply()).to.equal(0n)
    })
  })

  describe('Mint', () => {
    it('allows MINTER_ROLE to mint', async () => {
      const { token, minter, user1 } = await loadFixture(deployFixture)
      const amount = ethers.parseEther('1000')
      await token.connect(minter).mint(user1.address, amount)
      expect(await token.balanceOf(user1.address)).to.equal(amount)
    })

    it('reverts mint from non-minter', async () => {
      const { token, user1 } = await loadFixture(deployFixture)
      await expect(token.connect(user1).mint(user1.address, 100n))
        .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount')
    })
  })

  describe('Burn', () => {
    it('allows MINTER_ROLE to burn', async () => {
      const { token, minter, user1 } = await loadFixture(deployFixture)
      const amount = ethers.parseEther('500')
      await token.connect(minter).mint(user1.address, amount)
      await token.connect(minter).burn(user1.address, amount)
      expect(await token.balanceOf(user1.address)).to.equal(0n)
    })

    it('reverts burn from non-minter', async () => {
      const { token, minter, user1, user2 } = await loadFixture(deployFixture)
      await token.connect(minter).mint(user1.address, ethers.parseEther('100'))
      await expect(token.connect(user1).burn(user1.address, ethers.parseEther('100')))
        .to.be.revertedWithCustomError(token, 'AccessControlUnauthorizedAccount')
    })
  })

  describe('Non-transferable (soulbound)', () => {
    it('reverts transfer()', async () => {
      const { token, minter, user1, user2 } = await loadFixture(deployFixture)
      await token.connect(minter).mint(user1.address, ethers.parseEther('100'))
      await expect(token.connect(user1).transfer(user2.address, 1n))
        .to.be.revertedWith('FUELx: non-transferable')
    })

    it('reverts transferFrom()', async () => {
      const { token, minter, user1, user2 } = await loadFixture(deployFixture)
      await token.connect(minter).mint(user1.address, ethers.parseEther('100'))
      await expect(token.connect(user2).transferFrom(user1.address, user2.address, 1n))
        .to.be.revertedWith('FUELx: non-transferable')
    })
  })
})
