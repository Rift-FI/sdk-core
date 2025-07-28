// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ISwapRouter {
    function exactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        address recipient,
        uint256 deadline,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function mint(MintParams calldata params) external returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
    function decreaseLiquidity(DecreaseLiquidityParams calldata params) external returns (uint256 amount0, uint256 amount1);
    function collect(CollectParams calldata params) external returns (uint256 amount0, uint256 amount1);
}

interface IUniswapV3Pool {
    function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked);
}

interface ISphereDex {
    function provideLiquidity(string memory poolIdentifier, uint256 amount0, uint256 amount1) external;
}

contract PSTLiquidity is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public stablecoin;
    IERC20 public rewardToken;
    ISwapRouter public swapRouter;
    INonfungiblePositionManager public positionManager;
    ISphereDex public sphereDex;
    string public spherePoolId;
    address public treasury;

    uint24 public constant poolFee = 3000; // 0.3% fee tier for Uniswap V3
    uint256 public liquidityTokenId; // Uniswap V3 LP token ID

    event LiquidityProvided(uint256 amountStablecoin, uint256 liquidity, uint256 tokenId);
    event LiquidityRemoved(uint256 amountStablecoin);
    event FeesCollected(uint256 amount0, uint256 amount1);
    event DexDetailsUpdated(address dex, string poolId);

    constructor(
        address _stablecoin,
        address _rewardToken,
        address _swapRouter,
        address _positionManager,
        address _sphereDex,
        string memory _spherePoolId,
        address _treasury,
        address _admin
    ) {
        require(_stablecoin != address(0), "Stablecoin address cannot be zero");
        require(_rewardToken != address(0), "Reward token address cannot be zero");
        require(_swapRouter != address(0), "SwapRouter address cannot be zero");
        require(_positionManager != address(0), "PositionManager address cannot be zero");
        require(_sphereDex != address(0), "SphereDex address cannot be zero");
        require(_treasury != address(0), "Treasury address cannot be zero");
        require(_admin != address(0), "Admin address cannot be zero");

        stablecoin = IERC20(_stablecoin);
        rewardToken = IERC20(_rewardToken);
        swapRouter = ISwapRouter(_swapRouter);
        positionManager = INonfungiblePositionManager(_positionManager);
        sphereDex = ISphereDex(_sphereDex);
        spherePoolId = _spherePoolId;
        treasury = _treasury;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    function provideLiquidity(uint256 amount) external onlyRole(ADMIN_ROLE) whenNotPaused nonReentrant {
        require(amount > 0, "Cannot add 0 liquidity");

        stablecoin.approve(address(positionManager), amount);

        // Simplified price fetching (assumes stablecoin is token0)
        (uint160 sqrtPriceX96, , , , , , ) = IUniswapV3Pool(address(positionManager)).slot0();
        uint256 price = (uint256(sqrtPriceX96) * uint256(sqrtPriceX96)) / (2 ** 192);
        uint256 amount1Desired = (amount * price) / 1e18;

        uint256 amount0Min = (amount * 95) / 100; // 5% slippage
        uint256 amount1Min = (amount1Desired * 95) / 100;

        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: address(stablecoin),
            token1: address(rewardToken),
            fee: poolFee,
            tickLower: -887272,
            tickUpper: 887272,
            amount0Desired: amount,
            amount1Desired: amount1Desired,
            amount0Min: amount0Min,
            amount1Min: amount1Min,
            recipient: address(this),
            deadline: block.timestamp + 600
        });

        (uint256 tokenId, uint128 liquidity, , ) = positionManager.mint(params);
        require(liquidity > 0, "Liquidity provision failed");

        liquidityTokenId = tokenId;
        emit LiquidityProvided(amount, liquidity, tokenId);
    }

    function removeLiquidity(uint256 amount) external onlyRole(ADMIN_ROLE) whenNotPaused nonReentrant {
        require(liquidityTokenId > 0, "No liquidity position exists");

        INonfungiblePositionManager.DecreaseLiquidityParams memory params = INonfungiblePositionManager.DecreaseLiquidityParams({
            tokenId: liquidityTokenId,
            liquidity: uint128(amount),
            amount0Min: 0,
            amount1Min: 0,
            deadline: block.timestamp + 600
        });

        positionManager.decreaseLiquidity(params);

        INonfungiblePositionManager.CollectParams memory collectParams = INonfungiblePositionManager.CollectParams({
            tokenId: liquidityTokenId,
            recipient: address(this),
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });

        (uint256 amount0, uint256 amount1) = positionManager.collect(collectParams);
        emit FeesCollected(amount0, amount1);
        emit LiquidityRemoved(amount);
    }

    function collectFees() external onlyRole(ADMIN_ROLE) nonReentrant {
        require(liquidityTokenId > 0, "No liquidity position exists");

        INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
            tokenId: liquidityTokenId,
            recipient: treasury, // Send fees to treasury
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });

        (uint256 amount0, uint256 amount1) = positionManager.collect(params);
        emit FeesCollected(amount0, amount1);
    }

    function setDexDetails(address _sphereDex, string memory _poolId) external onlyRole(ADMIN_ROLE) {
        require(_sphereDex != address(0), "Invalid dex");
        require(bytes(_poolId).length > 0, "Invalid pool ID");
        sphereDex = ISphereDex(_sphereDex);
        spherePoolId = _poolId;
        emit DexDetailsUpdated(_sphereDex, _poolId);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function withdrawToken(IERC20 token, address recipient, uint256 amount) external onlyRole(ADMIN_ROLE) {
        token.transfer(recipient, amount);
    }
}