// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

/// @title Lending Pool Events contract.
/// @author Niftrr
/// @notice Contains Lending Pool events
/// @dev To help organize and limit size of Lending Pool contract.
contract LendingPoolEvents {    
    /// @notice Emitted when a new reserve is initialized.
    /// @param collateral The reserve's underlying collateral contract address.
    /// @param asset The ERC20, reserve asset address.
    /// @param fTokenAddress The derivative fToken address.
    /// @param debtTokenAddress The derivative debtToken address.
    event InitReserve(address collateral, address asset, address fTokenAddress, address debtTokenAddress);
    
    /// @notice Emitted when an asset deposit is made.
    /// @param collateral The Lending Pool underlying reserve collateral.
    /// @param asset The ERC20, reserve asset address.
    /// @param amount The amount of ERC20 tokens.
    /// @param lender The lender account.
    /// @param liquidityIndex The reserve liquidity index.
    event Deposit(
        address collateral,
        address asset, 
        uint256 amount, 
        address lender, 
        uint256 liquidityIndex
    );

    /// @notice Emitted when an asset withdraw is made.
    /// @param collateral The Lending Pool underlying reserve collateral.
    /// @param asset The ERC20, reserve asset address.
    /// @param amount The amount of ERC20 tokens.
    /// @param lender The lender account.
    /// @param liquidityIndex The reserve liquidity index.
    event Withdraw(
        address collateral,
        address asset, 
        uint256 amount, 
        address lender, 
        uint256 liquidityIndex
        );

    /// @notice Emitted when a bid is made against a defaulted borrow.
    /// @param asset The ERC20 address of the bid asset.
    /// @param amount The amount of ERC20 tokens bid.
    /// @param borrowId The unique identifier of the borrow.
    /// @param bidder The bidder account.
    event Bid(
        address asset, 
        uint256 amount, 
        uint256 borrowId, 
        address bidder
    );

    /// @notice Emitted when a borrow is activated.
    /// @param asset The ERC20 address of the borrowed asset.
    /// @param amount The amount of ERC20 tokens borrowed.
    /// @param collateral The ERC721 token used as collateral.
    /// @param tokenId The tokenId of the ERC721 token to be deposited in escrow.
    /// @param borrower The borrower account.
    /// @param liquidityIndex The updated liquidity index.
    event Borrow(
        address asset, 
        uint256 amount, 
        address collateral, 
        uint256 tokenId, 
        address borrower,
        uint256 liquidityIndex
    );

    /// @notice Emitted when a borrow position is redeemed.
    /// @param borrowId The unique identifier of the borrow.
    /// @param asset The ERC20 address of the borrowed asset.
    /// @param redeemAmount The amount of ERC20 tokens to be repaid.
    /// @param borrower The borrower account.
    event Redeem(
        uint256 borrowId, 
        address asset, 
        uint256 redeemAmount, 
        address borrower
    );

    /// @notice Emitted when a borrow is repaid.
    /// @param borrowId The unique identifier of the borrow.
    /// @param asset The ERC20 address of the borrowed asset.
    /// @param repaymentAmount The amount of ERC20 tokens to be repaid.
    /// @param borrower The borrower account.
    event Repay(
        uint256 borrowId, 
        address asset, 
        uint256 repaymentAmount, 
        address borrower
    );

    /// @notice Emitted when a borrow is liquidated.
    /// @param borrowId The unique identifier of the borrow.
    /// @param msgSender The msgSender account.
    event Liquidate(
        uint256 borrowId, 
        address msgSender
    );

    /// @notice Emitted when the asset reserve is updated.
    /// @param collateral The reserve collateral.
    /// @param asset The reserve asset.
    /// @param asset The reserve borrowRate.
    /// @param asset The reserve utilizationRate.
    /// @param asset The reserve liquidityIndex.
    event UpdateReserve(
        address collateral,
        address asset,
        uint256 borrowRate,
        uint256 utilizationRate,
        uint256 liquidityIndex
    );

    /// @notice Emitted when the reserve state is updated.
    /// @param collateral The reserve collateral.
    /// @param asset The reserve asset.
    /// @param status Status of the reserve.
    event ReserveStatus(
        address collateral,
        address asset,
        bytes32 status
    ); 

    /// @notice Emitted when LendingPool connects with a given contract.
    /// @param contractName The name of the contract to connect.
    /// @param contractAddress The address of the contract to connect.
    event LendingPoolConnected(
        bytes32 contractName,
        address contractAddress
    );
}