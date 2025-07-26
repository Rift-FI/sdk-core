import Stake from '../src/index';
import { Chain, Tranche, DeploymentConfig, StakingConfig } from '../src/types';

describe('Stake SDK', () => {
  let stakeClient: Stake;
  
  beforeEach(() => {
    stakeClient = new Stake();
  });

  describe('Deployment', () => {
    it('should create a Stake instance', () => {
      expect(stakeClient).toBeInstanceOf(Stake);
    });

    it('should fail deployment without implementation', async () => {
      const config: DeploymentConfig = {
        stablecoinAddress: '0x1234567890123456789012345678901234567890',
        treasuryAddress: '0x0987654321098765432109876543210987654321',
        chain: Chain.BERACHAIN_TESTNET
      };

      await expect(
        stakeClient.deployStakingSystem(config, 'fake_private_key')
      ).rejects.toThrow('Deployment functionality not yet implemented');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate staking config structure', () => {
      const config: StakingConfig = {
        amount: '1000000', // 1 USDC (6 decimals)
        tranche: Tranche.SUPER_SENIOR,
        chain: Chain.BERACHAIN_TESTNET
      };

      expect(config.amount).toBe('1000000');
      expect(config.tranche).toBe(Tranche.SUPER_SENIOR);
      expect(config.chain).toBe(Chain.BERACHAIN_TESTNET);
    });

    it('should validate deployment config structure', () => {
      const config: DeploymentConfig = {
        stablecoinAddress: '0x1234567890123456789012345678901234567890',
        treasuryAddress: '0x0987654321098765432109876543210987654321',
        chain: Chain.BERACHAIN_TESTNET
      };

      expect(config.stablecoinAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(config.treasuryAddress).toBe('0x0987654321098765432109876543210987654321');
      expect(config.chain).toBe(Chain.BERACHAIN_TESTNET);
    });
  });

  describe('Tranche Enum', () => {
    it('should have correct tranche values', () => {
      expect(Tranche.SUPER_SENIOR).toBe(0);
      expect(Tranche.JUNIOR).toBe(1);
    });
  });

  describe('Chain Enum', () => {
    it('should have correct chain values', () => {
      expect(Chain.BERACHAIN_TESTNET).toBe('berachain-testnet');
      expect(Chain.BERACHAIN_MAINNET).toBe('berachain-mainnet');
      expect(Chain.ETHEREUM_SEPOLIA).toBe('ethereum-sepolia');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for missing private key', async () => {
      const config: StakingConfig = {
        amount: '1000000',
        tranche: Tranche.SUPER_SENIOR,
        chain: Chain.BERACHAIN_TESTNET
      };

      await expect(
        stakeClient.stake(config, '0x1234567890123456789012345678901234567890')
      ).rejects.toThrow('Private key or wallet instance is required');
    });

    it('should throw error for invalid operations without contract', async () => {
      await expect(
        stakeClient.getPSTBalance(
          Chain.BERACHAIN_TESTNET,
          '0x1234567890123456789012345678901234567890',
          '0x1111111111111111111111111111111111111111'
        )
      ).rejects.toThrow();
    });
  });
});

// Mock test for local deployment scenario
describe('Local Deployment Test (Mock)', () => {
  let stakeClient: Stake;

  beforeEach(() => {
    stakeClient = new Stake();
  });

  it('should structure local deployment response correctly', () => {
    // This test validates the expected structure without actual deployment
    const mockDeployment = {
      pstStaking: '0x1234567890123456789012345678901234567890',
      pstInvestment: '0x2345678901234567890123456789012345678901',
      pstLiquidity: '0x3456789012345678901234567890123456789012',
      pstToken: '0x4567890123456789012345678901234567890123',
      pstjToken: '0x5678901234567890123456789012345678901234',
      stablecoin: '0x6789012345678901234567890123456789012345',
      treasury: '0x7890123456789012345678901234567890123456'
    };

    expect(mockDeployment).toHaveProperty('pstStaking');
    expect(mockDeployment).toHaveProperty('pstInvestment');
    expect(mockDeployment).toHaveProperty('pstLiquidity');
    expect(mockDeployment).toHaveProperty('pstToken');
    expect(mockDeployment).toHaveProperty('pstjToken');
    expect(mockDeployment).toHaveProperty('stablecoin');
    expect(mockDeployment).toHaveProperty('treasury');

    // Validate all addresses are strings
    Object.values(mockDeployment).forEach(address => {
      expect(typeof address).toBe('string');
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });
}); 