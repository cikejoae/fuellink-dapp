import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('FuelDAO', () => {
  // Quorum = 4M FUELx — we give each voter enough to easily pass quorum
  const VOTER_BALANCE   = ethers.parseEther('2000000') // 2M FUELx per voter
  const PROPOSER_STAKE  = ethers.parseEther('1000')    // > 500 FUELx threshold

  async function deployFixture() {
    const [admin, voter1, voter2, voter3, proposer] = await ethers.getSigners()

    const FUELxToken = await ethers.getContractFactory('FUELxToken')
    const fuelx = await FUELxToken.deploy(admin.address)
    await fuelx.waitForDeployment()

    const FuelDAO = await ethers.getContractFactory('FuelDAO')
    const dao = await FuelDAO.deploy(await fuelx.getAddress(), admin.address)
    await dao.waitForDeployment()

    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'))
    await fuelx.connect(admin).grantRole(MINTER_ROLE, admin.address)

    await fuelx.connect(admin).mint(proposer.address, PROPOSER_STAKE)
    await fuelx.connect(admin).mint(voter1.address,   VOTER_BALANCE)
    await fuelx.connect(admin).mint(voter2.address,   VOTER_BALANCE)
    await fuelx.connect(admin).mint(voter3.address,   VOTER_BALANCE)

    return { fuelx, dao, admin, voter1, voter2, voter3, proposer }
  }

  // Helper: advance past debate + create snapshot with passed proposal
  async function proposedFixture() {
    const base = await deployFixture()
    await base.dao.connect(base.proposer).propose('Test', ethers.ZeroAddress, '0x')
    return { ...base, proposalId: 1n }
  }

  async function passedFixture() {
    const base = await proposedFixture()
    await time.increase(7 * 24 * 60 * 60 + 1) // past debate
    await base.dao.connect(base.voter1).vote(1n, true)
    await base.dao.connect(base.voter2).vote(1n, true)
    await base.dao.connect(base.voter3).vote(1n, true)
    await time.increase(7 * 24 * 60 * 60 + 1) // past voting
    return base
  }

  // ─── Deployment ──────────────────────────────────────────────────────────────

  describe('Deployment', () => {
    it('sets correct fuelxToken', async () => {
      const { fuelx, dao } = await loadFixture(deployFixture)
      expect(await dao.fuelxToken()).to.equal(await fuelx.getAddress())
    })

    it('starts with zero proposals', async () => {
      const { dao } = await loadFixture(deployFixture)
      expect(await dao.proposalCount()).to.equal(0n)
    })
  })

  // ─── propose() ───────────────────────────────────────────────────────────────

  describe('propose()', () => {
    it('creates a proposal and increments count', async () => {
      const { dao, proposer } = await loadFixture(deployFixture)
      await dao.connect(proposer).propose('Test proposal', ethers.ZeroAddress, '0x')
      expect(await dao.proposalCount()).to.equal(1n)
    })

    it('emits ProposalCreated', async () => {
      const { dao, proposer } = await loadFixture(deployFixture)
      await expect(dao.connect(proposer).propose('Test', ethers.ZeroAddress, '0x'))
        .to.emit(dao, 'ProposalCreated').withArgs(1n, proposer.address, 'Test', false)
    })

    it('reverts if proposer lacks 500 FUELx', async () => {
      const { dao } = await loadFixture(deployFixture)
      const signers = await ethers.getSigners()
      await expect(dao.connect(signers[5]).propose('No stake', ethers.ZeroAddress, '0x'))
        .to.be.revertedWith('DAO: insufficient FUELx')
    })

    it('proposal starts in Debate state (0)', async () => {
      const { dao, proposer } = await loadFixture(deployFixture)
      await dao.connect(proposer).propose('Debate me', ethers.ZeroAddress, '0x')
      expect(await dao.getState(1n)).to.equal(0)
    })
  })

  // ─── vote() ──────────────────────────────────────────────────────────────────

  describe('vote()', () => {
    it('allows voting after 7-day debate period', async () => {
      const { dao, proposer, voter1 } = await loadFixture(deployFixture)
      await dao.connect(proposer).propose('Vote test', ethers.ZeroAddress, '0x')
      await time.increase(7 * 24 * 60 * 60 + 1)
      await expect(dao.connect(voter1).vote(1n, true)).to.emit(dao, 'VoteCast')
    })

    it('reverts if debate not over', async () => {
      const { dao, proposer, voter1 } = await loadFixture(deployFixture)
      await dao.connect(proposer).propose('Too early', ethers.ZeroAddress, '0x')
      await expect(dao.connect(voter1).vote(1n, true)).to.be.revertedWith('DAO: voting not started')
    })

    it('reverts if voting period closed', async () => {
      const { dao, proposer, voter1 } = await loadFixture(deployFixture)
      await dao.connect(proposer).propose('Expired', ethers.ZeroAddress, '0x')
      await time.increase(15 * 24 * 60 * 60)
      await expect(dao.connect(voter1).vote(1n, true)).to.be.revertedWith('DAO: voting ended')
    })

    it('reverts double vote', async () => {
      const { dao, proposer, voter1 } = await loadFixture(deployFixture)
      await dao.connect(proposer).propose('No double', ethers.ZeroAddress, '0x')
      await time.increase(7 * 24 * 60 * 60 + 1)
      await dao.connect(voter1).vote(1n, true)
      await expect(dao.connect(voter1).vote(1n, false)).to.be.revertedWith('DAO: already voted')
    })

    it('uses quadratic voting power: votes = sqrt(balance / 1e18)', async () => {
      const { fuelx, dao, admin, proposer } = await loadFixture(deployFixture)
      // Give a fresh voter exactly 10000 FUELx → sqrt(10000) = 100 votes
      const signers = await ethers.getSigners()
      const freshVoter = signers[5]
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'))
      await fuelx.connect(admin).grantRole(MINTER_ROLE, admin.address)
      await fuelx.connect(admin).mint(freshVoter.address, ethers.parseEther('10000'))

      await dao.connect(proposer).propose('Quadratic', ethers.ZeroAddress, '0x')
      await time.increase(7 * 24 * 60 * 60 + 1)
      await dao.connect(freshVoter).vote(1n, true)

      const p = await dao.proposals(1n)
      expect(p.forVotes).to.equal(100n)
    })

    it('tracks totalFuelxVoted for quorum', async () => {
      const { dao, proposer, voter1 } = await loadFixture(deployFixture)
      await dao.connect(proposer).propose('Quorum track', ethers.ZeroAddress, '0x')
      await time.increase(7 * 24 * 60 * 60 + 1)
      await dao.connect(voter1).vote(1n, true)
      const p = await dao.proposals(1n)
      expect(p.totalFuelxVoted).to.equal(VOTER_BALANCE)
    })
  })

  // ─── Quorum ───────────────────────────────────────────────────────────────────

  describe('Quorum', () => {
    it('rejects proposal when totalFuelxVoted < quorum', async () => {
      const { fuelx, dao, admin } = await loadFixture(deployFixture)
      // Create fresh proposer and voter with tiny balances
      const signers = await ethers.getSigners()
      const tinyProposer = signers[5]
      const tinyVoter    = signers[6]
      await fuelx.connect(admin).mint(tinyProposer.address, ethers.parseEther('1000'))
      await fuelx.connect(admin).mint(tinyVoter.address,    ethers.parseEther('100')) // < 4M quorum

      await dao.connect(tinyProposer).propose('Low quorum', ethers.ZeroAddress, '0x')
      await time.increase(7 * 24 * 60 * 60 + 1)
      await dao.connect(tinyVoter).vote(1n, true)
      await time.increase(7 * 24 * 60 * 60 + 1)

      // State.Rejected = 4
      expect(await dao.getState(1n)).to.equal(4)
    })

    it('approves proposal when quorum is met and 75% threshold passed', async () => {
      const base = await passedFixture()
      // State.Queued = 2
      expect(await base.dao.getState(1n)).to.equal(2)
    })
  })

  // ─── execute() ───────────────────────────────────────────────────────────────

  describe('execute()', () => {
    it('executes a queued proposal after execution delay', async () => {
      const base = await passedFixture()
      await time.increase(2 * 24 * 60 * 60 + 1) // execution delay
      await expect(base.dao.execute(1n)).to.emit(base.dao, 'ProposalExecuted').withArgs(1n)
    })

    it('proposal is Rejected when forVotes < 75% threshold', async () => {
      const { fuelx, dao, admin, proposer, voter1, voter2 } = await loadFixture(deployFixture)
      // Give voter2 much more FUELx to dominate with against votes
      await fuelx.connect(admin).mint(voter2.address, ethers.parseEther('10000000'))

      await dao.connect(proposer).propose('Fail', ethers.ZeroAddress, '0x')
      await time.increase(7 * 24 * 60 * 60 + 1)
      await dao.connect(voter1).vote(1n, true)  // small for
      await dao.connect(voter2).vote(1n, false) // large against
      await time.increase(7 * 24 * 60 * 60 + 1)

      expect(await dao.getState(1n)).to.equal(4) // Rejected
    })

    it('reverts execute during voting period', async () => {
      const { dao, proposer } = await loadFixture(deployFixture)
      await dao.connect(proposer).propose('Too early', ethers.ZeroAddress, '0x')
      await time.increase(7 * 24 * 60 * 60 + 1)
      await expect(dao.execute(1n)).to.be.revertedWith('DAO: voting ongoing')
    })

    it('reverts execute before execution delay', async () => {
      const base = await passedFixture()
      await expect(base.dao.execute(1n)).to.be.revertedWith('DAO: execution delay')
    })

    it('reverts double execute', async () => {
      const base = await passedFixture()
      await time.increase(2 * 24 * 60 * 60 + 1)
      await base.dao.execute(1n)
      await expect(base.dao.execute(1n)).to.be.revertedWith('DAO: already closed')
    })
  })

  // ─── proposeEmergency() ───────────────────────────────────────────────────────

  describe('proposeEmergency()', () => {
    it('voting starts immediately without debate period', async () => {
      const { dao, admin, voter1 } = await loadFixture(deployFixture)
      await dao.connect(admin).proposeEmergency('Emergency!', ethers.ZeroAddress, '0x')
      expect(await dao.getState(1n)).to.equal(1) // State.Voting
      await expect(dao.connect(voter1).vote(1n, true)).to.not.be.reverted
    })

    it('reverts from non-owner', async () => {
      const { dao, proposer } = await loadFixture(deployFixture)
      await expect(dao.connect(proposer).proposeEmergency('Nope', ethers.ZeroAddress, '0x'))
        .to.be.revertedWithCustomError(dao, 'OwnableUnauthorizedAccount')
    })
  })

  // ─── Governance params ────────────────────────────────────────────────────────

  describe('Governance params', () => {
    it('setQuorum updates quorum', async () => {
      const { dao, admin } = await loadFixture(deployFixture)
      await dao.connect(admin).setQuorum(ethers.parseEther('1000000'))
      expect(await dao.quorum()).to.equal(ethers.parseEther('1000000'))
    })

    it('setApprovalThreshold rejects values out of [5500, 10000]', async () => {
      const { dao, admin } = await loadFixture(deployFixture)
      await expect(dao.connect(admin).setApprovalThreshold(1000n)).to.be.reverted
      await expect(dao.connect(admin).setApprovalThreshold(10001n)).to.be.reverted
    })

    it('setApprovalThreshold accepts valid range', async () => {
      const { dao, admin } = await loadFixture(deployFixture)
      await dao.connect(admin).setApprovalThreshold(6000n)
      expect(await dao.approvalThreshold()).to.equal(6000n)
    })

    it('setProposalStake updates stake requirement', async () => {
      const { dao, admin } = await loadFixture(deployFixture)
      await dao.connect(admin).setProposalStake(ethers.parseEther('1000'))
      expect(await dao.proposalStake()).to.equal(ethers.parseEther('1000'))
    })
  })
})
