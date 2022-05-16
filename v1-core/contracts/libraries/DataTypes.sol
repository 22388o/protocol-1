// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

library DataTypes {

    enum ReserveStatus {
        Active, // Able to perform all reserve operations.
        Frozen, // Only able to `withdraw`, `repay` and `liquidate`. Not `borrow` or `deposit`
        Paused, // Not able to perform any reserve operation.
        Protected // Only able to `withdraw` and `repay`. Not `borrow`, `deposit` or `liquidate`.
    }

    enum BorrowStatus { 
        Active, // Open
        ActiveAuction, // Open with open auction
        Repaid, // Closed, paid by borrower
        Liquidated // Closed, paid by liquidator
    }
    
    struct Reserve {
        ReserveStatus status;
        address fTokenAddress;
        address debtTokenAddress;
        uint256 liquidityIndex;
        uint256 interestRate;
        uint256 borrowAmount;
        uint256 borrowRate;
        uint256 normalizedIncome;
        uint256 latestUpdateTimestamp;
    }

    struct Collateral {
        address erc721Token;
        uint256 tokenId;
    }

    struct Auction {
        address caller;
        address bidder;
        uint256 bid;
        uint256 liquidationFee;
        uint40 timestamp;
    }

    struct Borrow {
        BorrowStatus status;
        Collateral collateral;
        Auction auction;
        address borrower;
        address erc20Token;
        uint256 borrowAmount;
        uint256 interestRate;
        uint256 liquidationPrice;
        uint40 timestamp;
    }
}