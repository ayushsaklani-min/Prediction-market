// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockPredictionAMM {
    bytes32 public lastSettledMarketId;
    uint8 public lastWinningSide;

    function settleMarket(bytes32 marketId, uint8 winningSide) external {
        lastSettledMarketId = marketId;
        lastWinningSide = winningSide;
    }
}
