import { toast } from 'sonner'

// Pool Service per gestione completa dei pool di tokenizzazione
class PoolService {
  constructor() {
    this.pools = new Map()
    this.userPositions = new Map()
    this.rewardDistributor = new RewardDistributor()
    this.liquidityManager = new LiquidityManager()
    this.governanceSystem = new GovernanceSystem()
  }

  // Crea un nuovo pool per un asset tokenizzato
  async createAssetPool(assetData, poolConfig) {
    try {
      const poolId = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const pool = {
        id: poolId,
        assetId: assetData.id,
        assetName: assetData.assetName,
        poolType: poolConfig.type || 'liquidity', // liquidity, staking, yield, governance
        
        // Pool Configuration
        totalSupply: parseFloat(assetData.tokenSupply),
        availableSupply: parseFloat(assetData.tokenSupply),
        tokenPrice: parseFloat(assetData.tokenPrice),
        minimumStake: parseFloat(poolConfig.minimumStake || 100),
        
        // Liquidity Pool Data
        liquidityPool: {
          totalLiquidity: 0,
          token0: { symbol: assetData.tokenSymbol || 'AST', amount: 0 },
          token1: { symbol: 'USDC', amount: 0 },
          lpTokens: 0,
          fee: poolConfig.fee || 0.003, // 0.3%
          volume24h: 0,
          apr: 0
        },
        
        // Staking Pool Data
        stakingPool: {
          totalStaked: 0,
          totalRewards: 0,
          rewardRate: parseFloat(assetData.expectedReturn || 8.5) / 100,
          lockPeriod: parseInt(assetData.duration || 12) * 30 * 24 * 3600, // in seconds
          earlyWithdrawalPenalty: 0.05, // 5%
          compoundingEnabled: true
        },
        
        // Yield Farming Data
        yieldFarming: {
          enabled: poolConfig.yieldFarming || false,
          multiplier: poolConfig.yieldMultiplier || 1.5,
          bonusRewards: [],
          farmingPeriod: poolConfig.farmingPeriod || 365 * 24 * 3600
        },
        
        // Governance Data
        governance: {
          enabled: poolConfig.governance || true,
          votingPower: 0,
          proposals: [],
          quorum: 0.1, // 10%
          votingPeriod: 7 * 24 * 3600 // 7 days
        },
        
        // Pool Metrics
        metrics: {
          tvl: 0, // Total Value Locked
          apy: 0, // Annual Percentage Yield
          participants: 0,
          volume: 0,
          fees: 0,
          impermanentLoss: 0
        },
        
        // Pool Status
        status: 'active',
        createdAt: new Date().toISOString(),
        creator: assetData.creator,
        
        // Risk Management
        riskParameters: {
          maxSlippage: 0.05, // 5%
          maxLeverage: poolConfig.maxLeverage || 1,
          liquidationThreshold: 0.8,
          riskScore: this.calculateRiskScore(assetData)
        }
      }
      
      // Salva il pool
      this.pools.set(poolId, pool)
      this.savePoolToStorage(pool)
      
      // Inizializza la liquidità iniziale se fornita
      if (poolConfig.initialLiquidity) {
        await this.addLiquidity(poolId, poolConfig.initialLiquidity)
      }
      
      toast.success(`Pool ${pool.assetName} creato con successo!`)
      return pool
      
    } catch (error) {
      toast.error(`Errore creazione pool: ${error.message}`)
      throw error
    }
  }
  
  // Aggiunge liquidità al pool
  async addLiquidity(poolId, liquidityData) {
    try {
      const pool = this.pools.get(poolId)
      if (!pool) throw new Error('Pool non trovato')
      
      const { token0Amount, token1Amount, userAddress } = liquidityData
      
      // Calcola LP tokens da emettere
      const lpTokens = this.calculateLPTokens(pool, token0Amount, token1Amount)
      
      // Aggiorna pool
      pool.liquidityPool.token0.amount += parseFloat(token0Amount)
      pool.liquidityPool.token1.amount += parseFloat(token1Amount)
      pool.liquidityPool.lpTokens += lpTokens
      pool.liquidityPool.totalLiquidity = pool.liquidityPool.token0.amount * pool.tokenPrice + pool.liquidityPool.token1.amount
      pool.metrics.tvl = pool.liquidityPool.totalLiquidity + pool.stakingPool.totalStaked * pool.tokenPrice
      
      // Aggiorna posizione utente
      this.updateUserPosition(userAddress, poolId, {
        type: 'liquidity',
        lpTokens: lpTokens,
        token0Amount: parseFloat(token0Amount),
        token1Amount: parseFloat(token1Amount),
        timestamp: Date.now()
      })
      
      this.savePoolToStorage(pool)
      toast.success('Liquidità aggiunta con successo!')
      
      return { lpTokens, pool }
      
    } catch (error) {
      toast.error(`Errore aggiunta liquidità: ${error.message}`)
      throw error
    }
  }
  
  // Staking di token nel pool
  async stakeTokens(poolId, amount, userAddress, lockPeriod = null) {
    try {
      const pool = this.pools.get(poolId)
      if (!pool) throw new Error('Pool non trovato')
      
      const stakeAmount = parseFloat(amount)
      if (stakeAmount < pool.stakingPool.minimumStake) {
        throw new Error(`Importo minimo: ${pool.stakingPool.minimumStake}`)
      }
      
      // Calcola rewards
      const expectedRewards = stakeAmount * pool.stakingPool.rewardRate * (lockPeriod || 365) / 365
      
      // Aggiorna pool
      pool.stakingPool.totalStaked += stakeAmount
      pool.metrics.tvl += stakeAmount * pool.tokenPrice
      pool.metrics.participants += 1
      
      // Crea posizione staking
      const stakePosition = {
        type: 'staking',
        amount: stakeAmount,
        lockPeriod: lockPeriod || pool.stakingPool.lockPeriod,
        startTime: Date.now(),
        expectedRewards: expectedRewards,
        claimedRewards: 0,
        status: 'active'
      }
      
      this.updateUserPosition(userAddress, poolId, stakePosition)
      this.savePoolToStorage(pool)
      
      // Avvia distribuzione rewards
      this.rewardDistributor.startRewardDistribution(poolId, userAddress, stakePosition)
      
      toast.success(`${stakeAmount} token messi in staking!`)
      return stakePosition
      
    } catch (error) {
      toast.error(`Errore staking: ${error.message}`)
      throw error
    }
  }
  
  // Yield Farming
  async enterYieldFarm(poolId, lpTokenAmount, userAddress) {
    try {
      const pool = this.pools.get(poolId)
      if (!pool || !pool.yieldFarming.enabled) {
        throw new Error('Yield farming non disponibile')
      }
      
      const farmPosition = {
        type: 'yield_farming',
        lpTokens: parseFloat(lpTokenAmount),
        multiplier: pool.yieldFarming.multiplier,
        startTime: Date.now(),
        expectedYield: 0,
        claimedYield: 0,
        status: 'active'
      }
      
      // Calcola yield atteso
      farmPosition.expectedYield = this.calculateYieldFarmingRewards(pool, farmPosition)
      
      this.updateUserPosition(userAddress, poolId, farmPosition)
      this.savePoolToStorage(pool)
      
      toast.success('Yield farming attivato!')
      return farmPosition
      
    } catch (error) {
      toast.error(`Errore yield farming: ${error.message}`)
      throw error
    }
  }
  
  // Distribuzione automatica dividendi
  async distributeRewards(poolId, rewardAmount, rewardType = 'dividend') {
    try {
      const pool = this.pools.get(poolId)
      if (!pool) throw new Error('Pool non trovato')
      
      const totalStaked = pool.stakingPool.totalStaked
      if (totalStaked === 0) return
      
      // Ottieni tutti gli staker
      const stakers = this.getUsersByPool(poolId, 'staking')
      
      for (const [userAddress, position] of stakers) {
        const userShare = position.amount / totalStaked
        const userReward = rewardAmount * userShare
        
        // Distribuisci reward
        await this.rewardDistributor.distributeReward(
          userAddress,
          poolId,
          userReward,
          rewardType
        )
      }
      
      pool.stakingPool.totalRewards += rewardAmount
      this.savePoolToStorage(pool)
      
      toast.success(`${rewardAmount} distribuiti come ${rewardType}`)
      
    } catch (error) {
      toast.error(`Errore distribuzione rewards: ${error.message}`)
      throw error
    }
  }
  
  // Governance - Crea proposta
  async createProposal(poolId, proposalData, userAddress) {
    try {
      const pool = this.pools.get(poolId)
      if (!pool || !pool.governance.enabled) {
        throw new Error('Governance non abilitata')
      }
      
      // Verifica voting power minimo
      const userPosition = this.getUserPosition(userAddress, poolId)
      const votingPower = this.calculateVotingPower(userPosition)
      
      if (votingPower < pool.governance.quorum) {
        throw new Error('Voting power insufficiente per creare proposte')
      }
      
      const proposal = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: proposalData.title,
        description: proposalData.description,
        type: proposalData.type, // 'parameter_change', 'reward_distribution', 'pool_upgrade'
        proposer: userAddress,
        createdAt: Date.now(),
        votingEnds: Date.now() + pool.governance.votingPeriod * 1000,
        votes: {
          for: 0,
          against: 0,
          abstain: 0
        },
        voters: new Set(),
        status: 'active',
        executionData: proposalData.executionData || {}
      }
      
      pool.governance.proposals.push(proposal)
      this.savePoolToStorage(pool)
      
      toast.success('Proposta creata con successo!')
      return proposal
      
    } catch (error) {
      toast.error(`Errore creazione proposta: ${error.message}`)
      throw error
    }
  }
  
  // Governance - Vota proposta
  async voteProposal(poolId, proposalId, vote, userAddress) {
    try {
      const pool = this.pools.get(poolId)
      const proposal = pool.governance.proposals.find(p => p.id === proposalId)
      
      if (!proposal || proposal.status !== 'active') {
        throw new Error('Proposta non valida o scaduta')
      }
      
      if (proposal.voters.has(userAddress)) {
        throw new Error('Hai già votato questa proposta')
      }
      
      const userPosition = this.getUserPosition(userAddress, poolId)
      const votingPower = this.calculateVotingPower(userPosition)
      
      // Registra voto
      proposal.votes[vote] += votingPower
      proposal.voters.add(userAddress)
      
      // Verifica se la proposta può essere eseguita
      if (Date.now() > proposal.votingEnds) {
        await this.executeProposal(poolId, proposalId)
      }
      
      this.savePoolToStorage(pool)
      toast.success('Voto registrato!')
      
    } catch (error) {
      toast.error(`Errore voto: ${error.message}`)
      throw error
    }
  }
  
  // Calcola metriche pool
  calculatePoolMetrics(poolId) {
    const pool = this.pools.get(poolId)
    if (!pool) return null
    
    // TVL (Total Value Locked)
    const tvl = pool.liquidityPool.totalLiquidity + (pool.stakingPool.totalStaked * pool.tokenPrice)
    
    // APY (Annual Percentage Yield)
    const stakingAPY = pool.stakingPool.rewardRate * 100
    const liquidityAPY = this.calculateLiquidityAPY(pool)
    const farmingAPY = pool.yieldFarming.enabled ? this.calculateFarmingAPY(pool) : 0
    
    // Impermanent Loss
    const impermanentLoss = this.calculateImpermanentLoss(pool)
    
    return {
      tvl,
      stakingAPY,
      liquidityAPY,
      farmingAPY,
      totalAPY: stakingAPY + liquidityAPY + farmingAPY,
      impermanentLoss,
      volume24h: pool.liquidityPool.volume24h,
      participants: pool.metrics.participants,
      riskScore: pool.riskParameters.riskScore
    }
  }
  
  // Utility functions
  calculateLPTokens(pool, token0Amount, token1Amount) {
    if (pool.liquidityPool.lpTokens === 0) {
      return Math.sqrt(token0Amount * token1Amount)
    }
    
    const share0 = token0Amount / pool.liquidityPool.token0.amount
    const share1 = token1Amount / pool.liquidityPool.token1.amount
    const share = Math.min(share0, share1)
    
    return pool.liquidityPool.lpTokens * share
  }
  
  calculateRiskScore(assetData) {
    let score = 50 // Base score
    
    // Adjust based on asset type
    const riskMultipliers = {
      'real-estate': 0.8,
      'precious-metals': 0.9,
      'art': 1.2,
      'business': 1.3,
      'commodities': 1.1,
      'other': 1.4
    }
    
    score *= riskMultipliers[assetData.assetType] || 1.0
    
    // Adjust based on expected return
    const expectedReturn = parseFloat(assetData.expectedReturn || 8.5)
    if (expectedReturn > 15) score *= 1.3
    else if (expectedReturn > 10) score *= 1.1
    else if (expectedReturn < 5) score *= 0.8
    
    return Math.min(100, Math.max(0, Math.round(score)))
  }
  
  calculateVotingPower(userPosition) {
    if (!userPosition) return 0
    
    let power = 0
    if (userPosition.staking) power += userPosition.staking.amount
    if (userPosition.liquidity) power += userPosition.liquidity.lpTokens * 0.5
    
    return power
  }
  
  // Storage functions
  savePoolToStorage(pool) {
    const pools = JSON.parse(localStorage.getItem('solcraft_pools') || '{}')
    pools[pool.id] = pool
    localStorage.setItem('solcraft_pools', JSON.stringify(pools))
  }
  
  loadPoolsFromStorage() {
    const pools = JSON.parse(localStorage.getItem('solcraft_pools') || '{}')
    for (const [poolId, poolData] of Object.entries(pools)) {
      this.pools.set(poolId, poolData)
    }
  }
  
  updateUserPosition(userAddress, poolId, positionData) {
    const key = `${userAddress}_${poolId}`
    const existing = this.userPositions.get(key) || {}
    
    if (positionData.type === 'liquidity') {
      existing.liquidity = positionData
    } else if (positionData.type === 'staking') {
      existing.staking = positionData
    } else if (positionData.type === 'yield_farming') {
      existing.yieldFarming = positionData
    }
    
    this.userPositions.set(key, existing)
    
    // Save to localStorage
    const positions = JSON.parse(localStorage.getItem('solcraft_positions') || '{}')
    positions[key] = existing
    localStorage.setItem('solcraft_positions', JSON.stringify(positions))
  }
  
  getUserPosition(userAddress, poolId) {
    return this.userPositions.get(`${userAddress}_${poolId}`)
  }
  
  getUsersByPool(poolId, positionType) {
    const result = new Map()
    for (const [key, position] of this.userPositions) {
      if (key.includes(poolId) && position[positionType]) {
        const userAddress = key.split('_')[0]
        result.set(userAddress, position[positionType])
      }
    }
    return result
  }
  
  // Get all pools
  getAllPools() {
    return Array.from(this.pools.values())
  }
  
  // Get pool by ID
  getPool(poolId) {
    return this.pools.get(poolId)
  }
  
  // Get user pools
  getUserPools(userAddress) {
    const userPools = []
    for (const [key, position] of this.userPositions) {
      if (key.startsWith(userAddress)) {
        const poolId = key.split('_').slice(1).join('_')
        const pool = this.pools.get(poolId)
        if (pool) {
          userPools.push({
            pool,
            position,
            metrics: this.calculatePoolMetrics(poolId)
          })
        }
      }
    }
    return userPools
  }
}

// Reward Distribution System
class RewardDistributor {
  constructor() {
    this.distributionQueue = []
    this.isProcessing = false
  }
  
  async startRewardDistribution(poolId, userAddress, stakePosition) {
    const distributionId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    this.distributionQueue.push({
      id: distributionId,
      poolId,
      userAddress,
      stakePosition,
      startTime: Date.now(),
      lastDistribution: Date.now(),
      status: 'active'
    })
    
    if (!this.isProcessing) {
      this.processDistributions()
    }
  }
  
  async processDistributions() {
    this.isProcessing = true
    
    while (this.distributionQueue.length > 0) {
      const distribution = this.distributionQueue.shift()
      
      try {
        await this.calculateAndDistributeReward(distribution)
      } catch (error) {
        console.error('Errore distribuzione reward:', error)
      }
      
      // Wait 1 second between distributions
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    this.isProcessing = false
  }
  
  async calculateAndDistributeReward(distribution) {
    const now = Date.now()
    const timeSinceLastDistribution = now - distribution.lastDistribution
    const dailyReward = distribution.stakePosition.expectedRewards / 365
    const reward = (dailyReward * timeSinceLastDistribution) / (24 * 60 * 60 * 1000)
    
    if (reward > 0) {
      await this.distributeReward(
        distribution.userAddress,
        distribution.poolId,
        reward,
        'staking_reward'
      )
      
      distribution.lastDistribution = now
      distribution.stakePosition.claimedRewards += reward
    }
    
    // Re-queue if still active
    if (distribution.status === 'active') {
      this.distributionQueue.push(distribution)
    }
  }
  
  async distributeReward(userAddress, poolId, amount, type) {
    // Simula distribuzione reward
    const rewardData = {
      userAddress,
      poolId,
      amount,
      type,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`
    }
    
    // Salva reward history
    const rewards = JSON.parse(localStorage.getItem(`rewards_${userAddress}`) || '[]')
    rewards.push(rewardData)
    localStorage.setItem(`rewards_${userAddress}`, JSON.stringify(rewards))
    
    console.log(`Reward distribuito: ${amount} ${type} a ${userAddress}`)
  }
}

// Liquidity Management System
class LiquidityManager {
  constructor() {
    this.autoRebalanceEnabled = true
    this.rebalanceThreshold = 0.05 // 5%
  }
  
  async autoRebalance(poolId) {
    // Implementa auto-rebalancing della liquidità
    console.log(`Auto-rebalancing pool ${poolId}`)
  }
  
  calculateOptimalLiquidity(pool) {
    // Calcola liquidità ottimale basata su volume e volatilità
    return {
      token0: pool.liquidityPool.token0.amount,
      token1: pool.liquidityPool.token1.amount,
      ratio: pool.liquidityPool.token0.amount / pool.liquidityPool.token1.amount
    }
  }
}

// Governance System
class GovernanceSystem {
  constructor() {
    this.proposalTypes = ['parameter_change', 'reward_distribution', 'pool_upgrade', 'emergency_action']
  }
  
  async executeProposal(poolId, proposalId) {
    // Implementa esecuzione automatica delle proposte approvate
    console.log(`Esecuzione proposta ${proposalId} per pool ${poolId}`)
  }
  
  calculateQuorum(pool, proposal) {
    const totalVotingPower = pool.stakingPool.totalStaked + (pool.liquidityPool.lpTokens * 0.5)
    const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain
    
    return totalVotes / totalVotingPower
  }
}

// Export singleton instance
export const poolService = new PoolService()
export default poolService

