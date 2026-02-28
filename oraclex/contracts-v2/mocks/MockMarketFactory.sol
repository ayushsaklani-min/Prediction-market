// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockMarketFactory {
    struct Market {
        uint256 closeTimestamp;
        uint256 resolutionTimestamp;
        bool active;
    }

    mapping(bytes32 => Market) public markets;

    function setMarket(
        bytes32 marketId,
        uint256 closeTimestamp,
        uint256 resolutionTimestamp,
        bool active
    ) external {
        markets[marketId] = Market({
            closeTimestamp: closeTimestamp,
            resolutionTimestamp: resolutionTimestamp,
            active: active
        });
    }

    function getMarket(bytes32 marketId) external view returns (
        string memory eventId,
        string memory description,
        uint8 category,
        uint256 closeTimestamp,
        uint256 resolutionTimestamp,
        address creator,
        bool active
    ) {
        Market memory market = markets[marketId];
        return (
            "mock-event",
            "mock-description",
            0,
            market.closeTimestamp,
            market.resolutionTimestamp,
            address(0),
            market.active
        );
    }
}
