// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPredictionAMM {
    function createMarket(bytes32 marketId, uint256 initialYes, uint256 initialNo) external;
}

/// @title Market Factory V2
/// @notice Creates and manages prediction markets
/// @dev Implements market creation fees and categorization
contract MarketFactoryV2 is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20 public usdc;
    IPredictionAMM public amm;
    address public treasury;

    uint256 public marketCreationFee; // In USDC (e.g., 10 * 10^6 for 10 USDC)
    uint256 public minInitialLiquidity; // Minimum liquidity required
    uint256 public maxMarketsPerCreator; // Rate limit per creator

    enum MarketCategory {
        Crypto,
        Sports,
        Politics,
        Entertainment,
        Science,
        Other
    }

    struct Market {
        bytes32 marketId;
        string eventId;
        string description;
        MarketCategory category;
        string[] tags;
        uint256 closeTimestamp;
        uint256 resolutionTimestamp;
        address creator;
        uint256 createdAt;
        bool active;
    }

    mapping(bytes32 => Market) public markets;
    mapping(address => uint256) public creatorMarketCount;
    mapping(MarketCategory => bytes32[]) public marketsByCategory;
    
    bytes32[] public allMarketIds;

    event MarketCreated(
        bytes32 indexed marketId,
        string eventId,
        string description,
        MarketCategory category,
        address indexed creator,
        uint256 closeTimestamp
    );
    event MarketClosed(bytes32 indexed marketId);
    event MarketCreationFeeUpdated(uint256 newFee);
    event MinLiquidityUpdated(uint256 newMin);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _usdc,
        address _amm,
        address _treasury,
        uint256 _marketCreationFee,
        uint256 _minInitialLiquidity,
        address defaultAdmin
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        usdc = IERC20(_usdc);
        amm = IPredictionAMM(_amm);
        treasury = _treasury;
        marketCreationFee = _marketCreationFee;
        minInitialLiquidity = _minInitialLiquidity;
        maxMarketsPerCreator = 100; // Default limit

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(OPERATOR_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /// @notice Create a new prediction market
    /// @param eventId Unique event identifier
    /// @param description Market description
    /// @param category Market category
    /// @param tags Array of tags
    /// @param closeTimestamp When market closes for trading
    /// @param resolutionTimestamp When market should be resolved
    /// @param initialYes Initial YES pool liquidity
    /// @param initialNo Initial NO pool liquidity
    /// @return marketId Created market ID
    function createMarket(
        string calldata eventId,
        string calldata description,
        MarketCategory category,
        string[] calldata tags,
        uint256 closeTimestamp,
        uint256 resolutionTimestamp,
        uint256 initialYes,
        uint256 initialNo
    ) external nonReentrant whenNotPaused returns (bytes32 marketId) {
        // Validation
        require(bytes(eventId).length > 0 && bytes(eventId).length <= 100, "Factory: invalid eventId");
        require(bytes(description).length > 0 && bytes(description).length <= 500, "Factory: invalid description");
        require(closeTimestamp > block.timestamp, "Factory: close in past");
        require(resolutionTimestamp > closeTimestamp, "Factory: invalid resolution time");
        require(initialYes >= minInitialLiquidity && initialNo >= minInitialLiquidity, "Factory: insufficient liquidity");
        require(creatorMarketCount[msg.sender] < maxMarketsPerCreator, "Factory: rate limit exceeded");

        // Generate market ID
        marketId = keccak256(abi.encodePacked(
            eventId,
            description,
            closeTimestamp,
            msg.sender,
            block.chainid,
            block.timestamp
        ));
        require(markets[marketId].marketId == bytes32(0), "Factory: market exists");

        // Collect creation fee
        if (marketCreationFee > 0) {
            require(
                usdc.transferFrom(msg.sender, treasury, marketCreationFee),
                "Factory: fee transfer failed"
            );
        }

        // Collect initial liquidity
        uint256 totalLiquidity = initialYes + initialNo;
        require(
            usdc.transferFrom(msg.sender, address(amm), totalLiquidity),
            "Factory: liquidity transfer failed"
        );

        // Store market
        markets[marketId] = Market({
            marketId: marketId,
            eventId: eventId,
            description: description,
            category: category,
            tags: tags,
            closeTimestamp: closeTimestamp,
            resolutionTimestamp: resolutionTimestamp,
            creator: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        allMarketIds.push(marketId);
        marketsByCategory[category].push(marketId);
        creatorMarketCount[msg.sender]++;

        // Create market in AMM
        amm.createMarket(marketId, initialYes, initialNo);

        emit MarketCreated(marketId, eventId, description, category, msg.sender, closeTimestamp);
    }

    /// @notice Close a market (called when closeTimestamp reached)
    /// @param marketId Market identifier
    function closeMarket(bytes32 marketId) external {
        Market storage market = markets[marketId];
        require(market.active, "Factory: not active");
        require(block.timestamp >= market.closeTimestamp, "Factory: not yet closeable");

        market.active = false;

        emit MarketClosed(marketId);
    }

    /// @notice Get market details
    /// @param marketId Market identifier
    function getMarket(bytes32 marketId) external view returns (
        string memory eventId,
        string memory description,
        MarketCategory category,
        uint256 closeTimestamp,
        uint256 resolutionTimestamp,
        address creator,
        bool active
    ) {
        Market storage market = markets[marketId];
        return (
            market.eventId,
            market.description,
            market.category,
            market.closeTimestamp,
            market.resolutionTimestamp,
            market.creator,
            market.active
        );
    }

    /// @notice Get all markets in a category
    /// @param category Market category
    function getMarketsByCategory(MarketCategory category) external view returns (bytes32[] memory) {
        return marketsByCategory[category];
    }

    /// @notice Get total number of markets
    function getTotalMarkets() external view returns (uint256) {
        return allMarketIds.length;
    }

    /// @notice Get market tags
    /// @param marketId Market identifier
    function getMarketTags(bytes32 marketId) external view returns (string[] memory) {
        return markets[marketId].tags;
    }

    /// @notice Update market creation fee
    /// @param newFee New fee amount
    function setMarketCreationFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        marketCreationFee = newFee;
        emit MarketCreationFeeUpdated(newFee);
    }

    /// @notice Update minimum initial liquidity
    /// @param newMin New minimum amount
    function setMinInitialLiquidity(uint256 newMin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minInitialLiquidity = newMin;
        emit MinLiquidityUpdated(newMin);
    }

    /// @notice Update max markets per creator
    /// @param newMax New maximum
    function setMaxMarketsPerCreator(uint256 newMax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxMarketsPerCreator = newMax;
    }

    /// @notice Update AMM address
    /// @param _amm New AMM address
    function setAMM(address _amm) external onlyRole(DEFAULT_ADMIN_ROLE) {
        amm = IPredictionAMM(_amm);
    }

    /// @notice Update treasury address
    /// @param _treasury New treasury address
    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = _treasury;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
