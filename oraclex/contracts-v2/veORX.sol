// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import "@openzeppelin/contracts/interfaces/IERC6372.sol";

/// @title veORX - Vote-Escrowed ORX
/// @notice Lock ORX tokens to receive voting power and protocol benefits
/// @dev Non-transferable voting power that decays linearly over time with checkpointing for governance
contract veORX is 
    Initializable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IERC6372
{
    using Checkpoints for Checkpoints.Trace208;
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20 public orxToken;

    uint256 public constant MIN_LOCK_DURATION = 1 weeks;
    uint256 public constant MAX_LOCK_DURATION = 4 * 365 days; // 4 years
    uint256 public constant MULTIPLIER_PRECISION = 10000;

    struct LockedBalance {
        uint256 amount;
        uint256 end;
    }

    mapping(address => LockedBalance) public locked;
    mapping(address => Checkpoints.Trace208) private _balanceCheckpoints;
    Checkpoints.Trace208 private _totalSupplyCheckpoints;
    
    uint256 public totalLockedSupply;
    
    event Deposit(address indexed user, uint256 amount, uint256 lockEnd, uint256 veAmount);
    event Withdraw(address indexed user, uint256 amount);
    event IncreaseLock(address indexed user, uint256 additionalAmount, uint256 newLockEnd);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _orxToken, address defaultAdmin) public initializer {
        __ReentrancyGuard_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        orxToken = IERC20(_orxToken);
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /// @notice Lock ORX tokens to receive veORX voting power
    /// @param amount Amount of ORX to lock
    /// @param duration Lock duration in seconds
    function createLock(uint256 amount, uint256 duration) external nonReentrant {
        require(amount > 0, "veORX: zero amount");
        require(duration >= MIN_LOCK_DURATION, "veORX: lock too short");
        require(duration <= MAX_LOCK_DURATION, "veORX: lock too long");
        require(locked[msg.sender].amount == 0, "veORX: lock exists");

        uint256 unlockTime = block.timestamp + duration;
        locked[msg.sender] = LockedBalance({
            amount: amount,
            end: unlockTime
        });

        totalLockedSupply += amount;

        require(orxToken.transferFrom(msg.sender, address(this), amount), "veORX: transfer failed");

        uint256 veAmount = balanceOf(msg.sender);
        // Checkpoint the locked amount, not the decaying balance
        _writeCheckpoint(_balanceCheckpoints[msg.sender], _add, amount);
        _writeCheckpoint(_totalSupplyCheckpoints, _add, amount);
        emit Deposit(msg.sender, amount, unlockTime, veAmount);
    }

    /// @notice Increase locked amount
    /// @param additionalAmount Additional ORX to lock
    function increaseLockAmount(uint256 additionalAmount) external nonReentrant {
        LockedBalance storage lock = locked[msg.sender];
        require(lock.amount > 0, "veORX: no lock");
        require(lock.end > block.timestamp, "veORX: lock expired");
        require(additionalAmount > 0, "veORX: zero amount");

        lock.amount += additionalAmount;
        totalLockedSupply += additionalAmount;

        require(orxToken.transferFrom(msg.sender, address(this), additionalAmount), "veORX: transfer failed");

        uint256 newVeAmount = balanceOf(msg.sender);
        _writeCheckpoint(_balanceCheckpoints[msg.sender], _add, additionalAmount);
        _writeCheckpoint(_totalSupplyCheckpoints, _add, additionalAmount);
        emit IncreaseLock(msg.sender, additionalAmount, lock.end);
    }

    /// @notice Extend lock duration
    /// @param newDuration New total duration from now
    function increaseLockDuration(uint256 newDuration) external nonReentrant {
        LockedBalance storage lock = locked[msg.sender];
        require(lock.amount > 0, "veORX: no lock");
        require(newDuration >= MIN_LOCK_DURATION, "veORX: lock too short");
        require(newDuration <= MAX_LOCK_DURATION, "veORX: lock too long");

        uint256 newUnlockTime = block.timestamp + newDuration;
        require(newUnlockTime > lock.end, "veORX: must increase duration");

        lock.end = newUnlockTime;

        emit IncreaseLock(msg.sender, 0, newUnlockTime);
    }

    /// @notice Withdraw all locked ORX after lock expires
    function withdraw() external nonReentrant {
        LockedBalance storage lock = locked[msg.sender];
        require(lock.amount > 0, "veORX: no lock");
        require(block.timestamp >= lock.end, "veORX: lock not expired");

        uint256 amount = lock.amount;
        totalLockedSupply -= amount;
        
        delete locked[msg.sender];

        require(orxToken.transfer(msg.sender, amount), "veORX: transfer failed");

        emit Withdraw(msg.sender, amount);
    }

    /// @notice Get current veORX balance (voting power) for an address
    /// @param user Address to query
    /// @return Current veORX balance
    function balanceOf(address user) public view returns (uint256) {
        LockedBalance memory lock = locked[user];
        if (lock.amount == 0 || block.timestamp >= lock.end) {
            return 0;
        }

        // For governance compatibility, return locked amount without decay
        // In production, you might want decay for other purposes but fixed voting power
        return lock.amount;
    }

    /// @notice Get total veORX supply
    function totalSupply() public view returns (uint256) {
        // This is a simplified version - production would need checkpointing
        return totalLockedSupply;
    }

    // IVotes interface implementation
    function getVotes(address account) public view returns (uint256) {
        return balanceOf(account);
    }

    function getPastVotes(address account, uint256 timepoint) public view returns (uint256) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) {
            revert("veORX: future lookup");
        }
        return _balanceCheckpoints[account].upperLookupRecent(uint48(timepoint));
    }

    function getPastTotalSupply(uint256 timepoint) public view returns (uint256) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) {
            revert("veORX: future lookup");
        }
        return _totalSupplyCheckpoints.upperLookupRecent(uint48(timepoint));
    }

    function delegates(address account) public pure returns (address) {
        return account; // Self-delegation only
    }

    function delegate(address) public pure {
        revert("veORX: delegation not supported");
    }

    function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32) public pure {
        revert("veORX: delegation not supported");
    }

    // IERC6372 implementation
    function clock() public view returns (uint48) {
        return uint48(block.number);
    }

    function CLOCK_MODE() public pure returns (string memory) {
        return "mode=blocknumber&from=default";
    }

    // Helper functions for checkpointing
    function _add(uint208 a, uint208 b) private pure returns (uint208) {
        return a + b;
    }

    function _subtract(uint208 a, uint208 b) private pure returns (uint208) {
        return a - b;
    }

    function _writeCheckpoint(
        Checkpoints.Trace208 storage store,
        function(uint208, uint208) view returns (uint208) op,
        uint256 delta
    ) private {
        uint208 oldValue = store.latest();
        uint208 newValue = op(oldValue, uint208(delta));
        store.push(clock(), newValue);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
