// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVeORX {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/// @title Fee Distributor
/// @notice Distributes protocol fees to veORX holders
/// @dev Implements pro-rata distribution based on veORX balance
contract FeeDistributor is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IVeORX public veOrx;
    IERC20 public rewardToken; // USDC

    uint256 public totalDistributed;
    uint256 public currentEpoch;
    uint256 public constant EPOCH_DURATION = 1 weeks;

    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        uint256 totalRewards;
        uint256 totalVeORXSupply;
        mapping(address => bool) claimed;
    }

    mapping(uint256 => Epoch) public epochs;
    mapping(address => uint256) public lastClaimedEpoch;

    event RewardsAdded(uint256 indexed epoch, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed epoch, uint256 amount);
    event EpochFinalized(uint256 indexed epoch, uint256 totalRewards, uint256 totalVeORX);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _veOrx,
        address _rewardToken,
        address defaultAdmin
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        veOrx = IVeORX(_veOrx);
        rewardToken = IERC20(_rewardToken);
        currentEpoch = 0;

        // Initialize first epoch
        epochs[0].startTime = block.timestamp;
        epochs[0].endTime = block.timestamp + EPOCH_DURATION;

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /// @notice Add rewards for current epoch
    /// @param amount Amount of reward tokens to add
    function addRewards(uint256 amount) external nonReentrant {
        require(amount > 0, "FeeDistributor: zero amount");

        require(
            rewardToken.transferFrom(msg.sender, address(this), amount),
            "FeeDistributor: transfer failed"
        );

        epochs[currentEpoch].totalRewards += amount;
        totalDistributed += amount;

        emit RewardsAdded(currentEpoch, amount);
    }

    /// @notice Finalize current epoch and start new one
    function finalizeEpoch() external {
        Epoch storage epoch = epochs[currentEpoch];
        require(block.timestamp >= epoch.endTime, "FeeDistributor: epoch not ended");

        // Snapshot veORX total supply
        epoch.totalVeORXSupply = veOrx.totalSupply();

        emit EpochFinalized(currentEpoch, epoch.totalRewards, epoch.totalVeORXSupply);

        // Start new epoch
        currentEpoch++;
        epochs[currentEpoch].startTime = block.timestamp;
        epochs[currentEpoch].endTime = block.timestamp + EPOCH_DURATION;
    }

    /// @notice Claim rewards for a specific epoch
    /// @param epochId Epoch to claim from
    function claimRewards(uint256 epochId) external nonReentrant {
        require(epochId < currentEpoch, "FeeDistributor: epoch not finalized");
        
        Epoch storage epoch = epochs[epochId];
        require(!epoch.claimed[msg.sender], "FeeDistributor: already claimed");
        require(epoch.totalVeORXSupply > 0, "FeeDistributor: no veORX supply");

        // Calculate user's share based on veORX balance at epoch end
        uint256 userVeORX = veOrx.balanceOf(msg.sender);
        require(userVeORX > 0, "FeeDistributor: no veORX balance");

        uint256 userReward = (epoch.totalRewards * userVeORX) / epoch.totalVeORXSupply;
        require(userReward > 0, "FeeDistributor: no rewards");

        epoch.claimed[msg.sender] = true;
        lastClaimedEpoch[msg.sender] = epochId;

        require(
            rewardToken.transfer(msg.sender, userReward),
            "FeeDistributor: transfer failed"
        );

        emit RewardsClaimed(msg.sender, epochId, userReward);
    }

    /// @notice Claim rewards for multiple epochs
    /// @param epochIds Array of epoch IDs to claim from
    function claimMultipleEpochs(uint256[] calldata epochIds) external nonReentrant {
        uint256 totalReward = 0;

        for (uint256 i = 0; i < epochIds.length; i++) {
            uint256 epochId = epochIds[i];
            require(epochId < currentEpoch, "FeeDistributor: epoch not finalized");

            Epoch storage epoch = epochs[epochId];
            if (epoch.claimed[msg.sender] || epoch.totalVeORXSupply == 0) {
                continue;
            }

            uint256 userVeORX = veOrx.balanceOf(msg.sender);
            if (userVeORX == 0) {
                continue;
            }

            uint256 userReward = (epoch.totalRewards * userVeORX) / epoch.totalVeORXSupply;
            if (userReward == 0) {
                continue;
            }

            epoch.claimed[msg.sender] = true;
            totalReward += userReward;

            emit RewardsClaimed(msg.sender, epochId, userReward);
        }

        require(totalReward > 0, "FeeDistributor: no rewards");

        lastClaimedEpoch[msg.sender] = epochIds[epochIds.length - 1];

        require(
            rewardToken.transfer(msg.sender, totalReward),
            "FeeDistributor: transfer failed"
        );
    }

    /// @notice Get claimable rewards for a user in a specific epoch
    /// @param user User address
    /// @param epochId Epoch ID
    function getClaimableRewards(address user, uint256 epochId) external view returns (uint256) {
        if (epochId >= currentEpoch) {
            return 0;
        }

        Epoch storage epoch = epochs[epochId];
        if (epoch.claimed[user] || epoch.totalVeORXSupply == 0) {
            return 0;
        }

        uint256 userVeORX = veOrx.balanceOf(user);
        if (userVeORX == 0) {
            return 0;
        }

        return (epoch.totalRewards * userVeORX) / epoch.totalVeORXSupply;
    }

    /// @notice Get total claimable rewards for a user across all unclaimed epochs
    /// @param user User address
    function getTotalClaimableRewards(address user) external view returns (uint256) {
        uint256 totalReward = 0;

        for (uint256 i = 0; i < currentEpoch; i++) {
            Epoch storage epoch = epochs[i];
            if (epoch.claimed[user] || epoch.totalVeORXSupply == 0) {
                continue;
            }

            uint256 userVeORX = veOrx.balanceOf(user);
            if (userVeORX == 0) {
                continue;
            }

            uint256 userReward = (epoch.totalRewards * userVeORX) / epoch.totalVeORXSupply;
            totalReward += userReward;
        }

        return totalReward;
    }

    /// @notice Check if user has claimed rewards for an epoch
    /// @param user User address
    /// @param epochId Epoch ID
    function hasClaimed(address user, uint256 epochId) external view returns (bool) {
        return epochs[epochId].claimed[user];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
