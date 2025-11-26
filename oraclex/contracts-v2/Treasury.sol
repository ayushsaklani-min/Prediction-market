// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Protocol Treasury
/// @notice Manages protocol funds and revenue distribution
/// @dev Controlled by governance
contract Treasury is
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address public feeDistributor;
    address public insuranceFund;
    
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public feeDistributorShare; // Basis points (e.g., 5000 = 50%)
    uint256 public insuranceFundShare; // Basis points

    mapping(address => uint256) public tokenBalances;

    event FundsReceived(address indexed token, uint256 amount, address indexed from);
    event FundsDistributed(address indexed token, uint256 amount, address indexed to);
    event FeeSharesUpdated(uint256 feeDistributorShare, uint256 insuranceFundShare);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _feeDistributor,
        address _insuranceFund,
        address defaultAdmin
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        feeDistributor = _feeDistributor;
        insuranceFund = _insuranceFund;
        feeDistributorShare = 5000; // 50%
        insuranceFundShare = 1000; // 10%

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(TREASURER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /// @notice Receive funds
    /// @param token Token address
    /// @param amount Amount received
    function receiveFunds(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Treasury: zero amount");
        
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "Treasury: transfer failed"
        );

        tokenBalances[token] += amount;

        emit FundsReceived(token, amount, msg.sender);
    }

    /// @notice Distribute accumulated fees
    /// @param token Token address
    function distributeFees(address token) external nonReentrant whenNotPaused {
        uint256 balance = tokenBalances[token];
        require(balance > 0, "Treasury: no balance");

        uint256 toFeeDistributor = (balance * feeDistributorShare) / FEE_DENOMINATOR;
        uint256 toInsurance = (balance * insuranceFundShare) / FEE_DENOMINATOR;
        uint256 remaining = balance - toFeeDistributor - toInsurance;

        tokenBalances[token] = remaining;

        if (toFeeDistributor > 0) {
            require(
                IERC20(token).transfer(feeDistributor, toFeeDistributor),
                "Treasury: fee distributor transfer failed"
            );
            emit FundsDistributed(token, toFeeDistributor, feeDistributor);
        }

        if (toInsurance > 0) {
            require(
                IERC20(token).transfer(insuranceFund, toInsurance),
                "Treasury: insurance transfer failed"
            );
            emit FundsDistributed(token, toInsurance, insuranceFund);
        }
    }

    /// @notice Update fee distribution shares
    /// @param _feeDistributorShare New fee distributor share (basis points)
    /// @param _insuranceFundShare New insurance fund share (basis points)
    function setFeeShares(
        uint256 _feeDistributorShare,
        uint256 _insuranceFundShare
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            _feeDistributorShare + _insuranceFundShare <= FEE_DENOMINATOR,
            "Treasury: invalid shares"
        );

        feeDistributorShare = _feeDistributorShare;
        insuranceFundShare = _insuranceFundShare;

        emit FeeSharesUpdated(_feeDistributorShare, _insuranceFundShare);
    }

    /// @notice Update fee distributor address
    /// @param _feeDistributor New fee distributor address
    function setFeeDistributor(address _feeDistributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeDistributor != address(0), "Treasury: zero address");
        feeDistributor = _feeDistributor;
    }

    /// @notice Update insurance fund address
    /// @param _insuranceFund New insurance fund address
    function setInsuranceFund(address _insuranceFund) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_insuranceFund != address(0), "Treasury: zero address");
        insuranceFund = _insuranceFund;
    }

    /// @notice Emergency withdraw (governance only)
    /// @param token Token address
    /// @param amount Amount to withdraw
    /// @param to Recipient address
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Treasury: zero address");
        require(amount <= tokenBalances[token], "Treasury: insufficient balance");

        tokenBalances[token] -= amount;

        require(
            IERC20(token).transfer(to, amount),
            "Treasury: transfer failed"
        );

        emit EmergencyWithdraw(token, amount, to);
    }

    /// @notice Get token balance
    /// @param token Token address
    function getBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
