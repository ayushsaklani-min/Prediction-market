// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title Market Positions (ERC1155)
/// @notice Tokenized YES/NO positions for prediction markets
/// @dev Each market has 2 token IDs: marketId*2 (NO) and marketId*2+1 (YES)
contract MarketPositions is
    Initializable,
    ERC1155Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    string public name;
    string public symbol;

    // marketId => metadata URI
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => uint256) private _totalSupply;

    event PositionMinted(address indexed user, uint256 indexed tokenId, uint256 amount);
    event PositionBurned(address indexed user, uint256 indexed tokenId, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _uri, address defaultAdmin) public initializer {
        __ERC1155_init(_uri);
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        name = "OracleX Market Positions";
        symbol = "ORX-POS";

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
        _grantRole(UPGRADER_ROLE, defaultAdmin);
    }

    /// @notice Mint position tokens (called by AMM)
    /// @param to Recipient address
    /// @param tokenId Token ID (marketId*2 for NO, marketId*2+1 for YES)
    /// @param amount Amount to mint
    function mint(address to, uint256 tokenId, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, tokenId, amount, "");
        _totalSupply[tokenId] += amount;
        emit PositionMinted(to, tokenId, amount);
    }

    /// @notice Burn position tokens (called by AMM)
    /// @param from Address to burn from
    /// @param tokenId Token ID
    /// @param amount Amount to burn
    function burn(address from, uint256 tokenId, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, tokenId, amount);
        _totalSupply[tokenId] -= amount;
        emit PositionBurned(from, tokenId, amount);
    }

    /// @notice Get total supply for a position token
    /// @param tokenId Token ID
    function totalSupply(uint256 tokenId) external view returns (uint256) {
        return _totalSupply[tokenId];
    }

    /// @notice Set metadata URI for a token
    /// @param tokenId Token ID
    /// @param tokenURI Metadata URI
    function setTokenURI(uint256 tokenId, string memory tokenURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _tokenURIs[tokenId] = tokenURI;
    }

    /// @notice Get metadata URI for a token
    /// @param tokenId Token ID
    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenURI = _tokenURIs[tokenId];
        return bytes(tokenURI).length > 0 ? tokenURI : super.uri(tokenId);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal override whenNotPaused {
        super._update(from, to, ids, amounts);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
