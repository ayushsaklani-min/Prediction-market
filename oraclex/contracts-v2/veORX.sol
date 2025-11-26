// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title veORX - Vote-Escrowed ORX
/// @notice Lock ORX tokens to receive voting power and protocol benefits
/// @dev Non-transferable voting power that decays linearly over time
contract veORX is 
    Initializable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
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

        // Linear decay: veORX = amount * (timeRemaining / MAX_LOCK_DURATION)
        uint256 timeRemaining = lock.end - block.timestamp;
        return (lock.amount * timeRemaining) / MAX_LOCK_DURATION;
    }

    /// @notice Get total veORX supply
    function totalSupply() public view returns (uint256) {
        // This is a simplified version - production would need checkpointing
        return totalLockedSupply;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
