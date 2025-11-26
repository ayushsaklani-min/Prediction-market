// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMarketPositions {
    function mint(address to, uint256 tokenId, uint256 amount) external;
    function burn(address from, uint256 tokenId, uint256 amount) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/// @title Prediction AMM (Constant Function Market Maker)
/// @notice Automated market maker for prediction markets using CFMM (k = x * y)
/// @dev Implements continuous trading with dynamic pricing
contract PredictionAMM is
    Initializable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20 public usdc;
    IMarketPositions public positions;
    address public treasury;
    address public feeDistributor;

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public tradingFee; // 30 = 0.3%
    uint256 public constant MIN_LIQUIDITY = 1000; // Minimum liquidity to prevent manipulation

    struct Market {
        bytes32 marketId;
        uint256 yesPool;
        uint256 noPool;
        uint256 k; // Constant product
        uint256 totalVolume;
        uint256 totalFees;
        bool active;
        bool settled;
        uint8 winningSide; // 0 = NO, 1 = YES
    }

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => mapping(address => uint256)) public lpShares; // LP tokens
    mapping(bytes32 => uint256) public totalLpShares;

    event MarketCreated(bytes32 indexed marketId, uint256 initialYes, uint256 initialNo);
    event Trade(
        bytes32 indexed marketId,
        address indexed trader,
        uint8 side,
        bool isBuy,
        uint256 amountIn,
        uint256 sharesOut,
        uint256 fee
    );
    event LiquidityAdded(bytes32 indexed marketId, address indexed provider, uint256 yesAmount, uint256 noAmount, uint256 lpShares);
    event LiquidityRemoved(bytes32 indexed marketId, address indexed provider, uint256 yesAmount, uint256 noAmount, uint256 lpShares);
    event MarketSettled(bytes32 indexed marketId, uint8 winningSide);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdc,
        address _positions,
        address _treasury,
        address _feeDistributor,
        address defaultAdmin
    ) public initializer {
        __ReentrancyGuard_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        usdc = IERC20(_usdc);
        positions = IMarketPositions(_positions);
        treasury = _treasury;
        feeDistributor = _feeDistributor;
        tradingFee = 30; // 0.3%

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(OPERATOR_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /// @notice Create a new market with initial liquidity
    /// @param marketId Unique market identifier
    /// @param initialYes Initial YES pool liquidity
    /// @param initialNo Initial NO pool liquidity
    function createMarket(
        bytes32 marketId,
        uint256 initialYes,
        uint256 initialNo
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(markets[marketId].marketId == bytes32(0), "AMM: market exists");
        require(initialYes >= MIN_LIQUIDITY && initialNo >= MIN_LIQUIDITY, "AMM: insufficient liquidity");

        uint256 k = initialYes * initialNo;
        
        markets[marketId] = Market({
            marketId: marketId,
            yesPool: initialYes,
            noPool: initialNo,
            k: k,
            totalVolume: 0,
            totalFees: 0,
            active: true,
            settled: false,
            winningSide: 0
        });

        // Transfer initial liquidity from operator
        require(usdc.transferFrom(msg.sender, address(this), initialYes + initialNo), "AMM: transfer failed");

        // Mint initial LP shares
        uint256 initialShares = sqrt(k);
        lpShares[marketId][msg.sender] = initialShares;
        totalLpShares[marketId] = initialShares;

        emit MarketCreated(marketId, initialYes, initialNo);
    }

    /// @notice Buy YES or NO shares
    /// @param marketId Market identifier
    /// @param side 0 = NO, 1 = YES
    /// @param amountIn USDC amount to spend
    /// @param minSharesOut Minimum shares to receive (slippage protection)
    /// @return sharesOut Amount of shares received
    function buy(
        bytes32 marketId,
        uint8 side,
        uint256 amountIn,
        uint256 minSharesOut
    ) external nonReentrant whenNotPaused returns (uint256 sharesOut) {
        Market storage market = markets[marketId];
        require(market.active && !market.settled, "AMM: market not active");
        require(side == 0 || side == 1, "AMM: invalid side");
        require(amountIn > 0, "AMM: zero amount");

        // Calculate fee
        uint256 fee = (amountIn * tradingFee) / FEE_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - fee;

        // Calculate shares using CFMM formula
        if (side == 1) {
            // Buying YES: shares = yesPool - (k / (noPool + amountIn))
            uint256 newNoPool = market.noPool + amountInAfterFee;
            uint256 newYesPool = market.k / newNoPool;
            sharesOut = market.yesPool - newYesPool;
            
            market.yesPool = newYesPool;
            market.noPool = newNoPool;
        } else {
            // Buying NO: shares = noPool - (k / (yesPool + amountIn))
            uint256 newYesPool = market.yesPool + amountInAfterFee;
            uint256 newNoPool = market.k / newYesPool;
            sharesOut = market.noPool - newNoPool;
            
            market.noPool = newNoPool;
            market.yesPool = newYesPool;
        }

        require(sharesOut >= minSharesOut, "AMM: slippage exceeded");

        // Update stats
        market.totalVolume += amountIn;
        market.totalFees += fee;

        // Transfer USDC from user
        require(usdc.transferFrom(msg.sender, address(this), amountIn), "AMM: transfer failed");

        // Distribute fee
        if (fee > 0) {
            uint256 treasuryFee = fee / 3;
            uint256 lpFee = fee - treasuryFee;
            require(usdc.transfer(treasury, treasuryFee), "AMM: treasury transfer failed");
            require(usdc.transfer(feeDistributor, lpFee), "AMM: fee distributor transfer failed");
        }

        // Mint position tokens
        uint256 tokenId = uint256(marketId) * 2 + side;
        positions.mint(msg.sender, tokenId, sharesOut);

        emit Trade(marketId, msg.sender, side, true, amountIn, sharesOut, fee);
    }

    /// @notice Sell YES or NO shares
    /// @param marketId Market identifier
    /// @param side 0 = NO, 1 = YES
    /// @param sharesIn Amount of shares to sell
    /// @param minAmountOut Minimum USDC to receive (slippage protection)
    /// @return amountOut USDC received
    function sell(
        bytes32 marketId,
        uint8 side,
        uint256 sharesIn,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        Market storage market = markets[marketId];
        require(market.active && !market.settled, "AMM: market not active");
        require(side == 0 || side == 1, "AMM: invalid side");
        require(sharesIn > 0, "AMM: zero shares");

        // Calculate USDC out using CFMM formula
        if (side == 1) {
            // Selling YES: amountOut = noPool - (k / (yesPool + sharesIn))
            uint256 newYesPool = market.yesPool + sharesIn;
            uint256 newNoPool = market.k / newYesPool;
            amountOut = market.noPool - newNoPool;
            
            market.yesPool = newYesPool;
            market.noPool = newNoPool;
        } else {
            // Selling NO: amountOut = yesPool - (k / (noPool + sharesIn))
            uint256 newNoPool = market.noPool + sharesIn;
            uint256 newYesPool = market.k / newNoPool;
            amountOut = market.yesPool - newYesPool;
            
            market.noPool = newNoPool;
            market.yesPool = newYesPool;
        }

        // Calculate fee
        uint256 fee = (amountOut * tradingFee) / FEE_DENOMINATOR;
        uint256 amountOutAfterFee = amountOut - fee;

        require(amountOutAfterFee >= minAmountOut, "AMM: slippage exceeded");

        // Update stats
        market.totalVolume += amountOut;
        market.totalFees += fee;

        // Burn position tokens
        uint256 tokenId = uint256(marketId) * 2 + side;
        positions.burn(msg.sender, tokenId, sharesIn);

        // Transfer USDC to user
        require(usdc.transfer(msg.sender, amountOutAfterFee), "AMM: transfer failed");

        // Distribute fee
        if (fee > 0) {
            uint256 treasuryFee = fee / 3;
            uint256 lpFee = fee - treasuryFee;
            require(usdc.transfer(treasury, treasuryFee), "AMM: treasury transfer failed");
            require(usdc.transfer(feeDistributor, lpFee), "AMM: fee distributor transfer failed");
        }

        emit Trade(marketId, msg.sender, side, false, sharesIn, amountOut, fee);
    }

    /// @notice Add liquidity to a market
    /// @param marketId Market identifier
    /// @param yesAmount YES pool liquidity to add
    /// @param noAmount NO pool liquidity to add
    /// @return shares LP shares minted
    function addLiquidity(
        bytes32 marketId,
        uint256 yesAmount,
        uint256 noAmount
    ) external nonReentrant whenNotPaused returns (uint256 shares) {
        Market storage market = markets[marketId];
        require(market.active && !market.settled, "AMM: market not active");
        require(yesAmount > 0 && noAmount > 0, "AMM: zero amount");

        // Calculate LP shares proportional to existing pool
        uint256 totalShares = totalLpShares[marketId];
        if (totalShares == 0) {
            shares = sqrt(yesAmount * noAmount);
        } else {
            uint256 yesShares = (yesAmount * totalShares) / market.yesPool;
            uint256 noShares = (noAmount * totalShares) / market.noPool;
            shares = yesShares < noShares ? yesShares : noShares;
        }

        require(shares > 0, "AMM: insufficient shares");

        // Update pools
        market.yesPool += yesAmount;
        market.noPool += noAmount;
        market.k = market.yesPool * market.noPool;

        // Update LP shares
        lpShares[marketId][msg.sender] += shares;
        totalLpShares[marketId] += shares;

        // Transfer USDC from user
        require(usdc.transferFrom(msg.sender, address(this), yesAmount + noAmount), "AMM: transfer failed");

        emit LiquidityAdded(marketId, msg.sender, yesAmount, noAmount, shares);
    }

    /// @notice Remove liquidity from a market
    /// @param marketId Market identifier
    /// @param shares LP shares to burn
    /// @return yesAmount YES pool liquidity removed
    /// @return noAmount NO pool liquidity removed
    function removeLiquidity(
        bytes32 marketId,
        uint256 shares
    ) external nonReentrant returns (uint256 yesAmount, uint256 noAmount) {
        Market storage market = markets[marketId];
        require(shares > 0, "AMM: zero shares");
        require(lpShares[marketId][msg.sender] >= shares, "AMM: insufficient shares");

        uint256 totalShares = totalLpShares[marketId];
        yesAmount = (shares * market.yesPool) / totalShares;
        noAmount = (shares * market.noPool) / totalShares;

        // Update pools
        market.yesPool -= yesAmount;
        market.noPool -= noAmount;
        market.k = market.yesPool * market.noPool;

        // Update LP shares
        lpShares[marketId][msg.sender] -= shares;
        totalLpShares[marketId] -= shares;

        // Transfer USDC to user
        require(usdc.transfer(msg.sender, yesAmount + noAmount), "AMM: transfer failed");

        emit LiquidityRemoved(marketId, msg.sender, yesAmount, noAmount, shares);
    }

    /// @notice Settle market and enable redemptions
    /// @param marketId Market identifier
    /// @param winningSide 0 = NO, 1 = YES
    function settleMarket(bytes32 marketId, uint8 winningSide) external onlyRole(OPERATOR_ROLE) {
        Market storage market = markets[marketId];
        require(market.active, "AMM: market not active");
        require(!market.settled, "AMM: already settled");
        require(winningSide == 0 || winningSide == 1, "AMM: invalid side");

        market.settled = true;
        market.winningSide = winningSide;
        market.active = false;

        emit MarketSettled(marketId, winningSide);
    }

    /// @notice Redeem winning shares for USDC
    /// @param marketId Market identifier
    /// @param side 0 = NO, 1 = YES
    /// @param shares Amount of shares to redeem
    /// @return payout USDC payout
    function redeem(
        bytes32 marketId,
        uint8 side,
        uint256 shares
    ) external nonReentrant returns (uint256 payout) {
        Market storage market = markets[marketId];
        require(market.settled, "AMM: not settled");
        require(side == market.winningSide, "AMM: losing side");
        require(shares > 0, "AMM: zero shares");

        // Calculate payout: 1 share = 1 USDC
        payout = shares;

        // Burn position tokens
        uint256 tokenId = uint256(marketId) * 2 + side;
        positions.burn(msg.sender, tokenId, shares);

        // Transfer USDC
        require(usdc.transfer(msg.sender, payout), "AMM: transfer failed");
    }

    /// @notice Get current price for a side
    /// @param marketId Market identifier
    /// @param side 0 = NO, 1 = YES
    /// @return price Price in basis points (10000 = 100%)
    function getPrice(bytes32 marketId, uint8 side) external view returns (uint256 price) {
        Market storage market = markets[marketId];
        if (side == 1) {
            price = (market.noPool * FEE_DENOMINATOR) / (market.yesPool + market.noPool);
        } else {
            price = (market.yesPool * FEE_DENOMINATOR) / (market.yesPool + market.noPool);
        }
    }

    /// @notice Square root function (Babylonian method)
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
