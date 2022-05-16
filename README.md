# [NFTlend.xyz](https://nftlend.xyz/)

The end of searching for liquidity. 

## Design statement

How might we improve liquidity for NFT owners, so that they have immediate access to funds without having to first find a lender, agree to a deal, or sell below market?

## Overview

NFTlend is building the first automated market maker for instant, permissionless NFT-backed loans.

- **Borrowers** escrow NFTs to instantly access over-collateralized, fixed-term loans priced at the project floor. 

- **Lenders** deposit assets into the lending pool to receive yield generated from borrower interest payments. 

- **Liquidators** repay any loan defaults (those expired or undercollateralized) to purchase the underlying NFT at a discount.

## Live dApp 

Deployed on Ropsten and IPFS: [ropsten.nftlend.xyz](https://ropsten.nftlend.xyz/#/).

Note that test `DAI`, `USDC` or `WETH` is required to interact with the protocol. 

Contact me on Twitter [@niftrr](https://twitter.com/niftrr) with your Ethereum address and I will send you some. 

## Video demo

[![Video Demo](assets/nftlend-ui-landingpage.png)](https://youtu.be/iT2rJXup3eQ)

## Protocol system design

### System diagram

![System Diagram](assets/nftlend-system-diagram.png?raw=true "System diagram")

### Summary

- **Lending Pool** is the main contract of the protocol exposing all user interaction endpoints; `deposit`, `withdraw`, `borrow`, `repay` and `liquidate`.

- **Collateral Manager** contract handles the escrow of NFTs and loan creation.

- **fTokens** are interest-bearing derivative tokens that are minted and burned upon the `deposit` and `withdraw` of asset tokens to / from the `Lending Pool` at a 1:1 ratio.

- **debtTokens** are non-transferable derivative tokens that are minted and burned upon the `borrow` and `repay` of loans to the `Lending Pool` a 1:1 ratio with the asset token repayment amount. It is the ratio of `debtTokens` to `fTokens`, updated at every user interaction, that is used to calculate the interest generated by the protocol.

- **NFT Pricing Oracles** are used to update NFT project floor prices, to price new loans and signal if the underlying loan collateral price falls below threshold for liquidation.

- **Token Pricing Oracles** are used to calculate exchange rates from the `NFT Pricing Oracles`, priced in ETH, to other loaned assets; DAI and USDC.

- **Libraries** contain reusable code, refactored from the protocol to save gas.

- **Configurator** is the admin contract used to set / update protocol variables. 

### Design pattern decisions

Link to detail on [design pattern decisions](docs/design_pattern_decisions.md).

### Security measures

Link to detail on [avoiding common attacks](docs/avoiding_common_attacks.md).

## User interface

### Landing page

![Landing page](assets/nftlend-ui-landingpage.png?raw=true "Landing page")

### Dashboard

![Dashboard](assets/nftlend-ui-dashboard.png?raw=true "Dashboard")

### Borrow

![Borrow](assets/nftlend-ui-borrow.png?raw=true "Borrow")

### Lend

![Lend](assets/nftlend-ui-lend.png?raw=true "Lend")

### Liquidate

![Liquidate](assets/nftlend-ui-liquidate.png?raw=true "Liquidate")

### Asset

![Asset](assets/nftlend-ui-asset.png?raw=true "Asset")

## Directory structure

    .
    ├── assets                                      # README assets
    ├── docs                                        # Documentation 
    │   ├── avoiding_common_attacks.md              # Security measures 
    │   ├── deployed_address.txt                    # Deployed smart contract addresses
    │   └── design_pattern_decisions.md             # Design patterns 
    ├── interface                                   # Front-end interface
    │   ├── components                              # React components 
    │   ├── hooks                                   # React hooks 
    │   ├── App.jsx                                 # React app
    │   ├── AppContext.jsx                          # React app state management
    │   ├── LICENCE                          
    │   ├── README.md                        
    │   └── ...   
    ├── v1-core                                     # Protocol 
    │   ├── contracts                               # Smart contracts
    │   │   ├── interfaces                          # Interfaces
    │   │   │   ├── ICollateralManager.sol          # CollateralManager interface
    │   │   │   ├── IDebtToken.sol                  # DebtToken interface
    │   │   │   ├── ILendingPool.sol                # LendingPool interface
    │   │   │   └── IFToken.sol                     # FToken interface
    │   │   ├── libraries                           # Libraries
    │   │   │   ├── DataTypes.sol                   # DataTypes library
    │   │   │   └── ReserveLogic.sol                # ReserveLogic library
    │   │   ├── mocks                               # Mocks
    │   │   │   ├── AssetToken.sol                  # ERC20 contract
    │   │   │   └── NFT.sol                         # ERC721 contract
    │   │   ├── CollateralManager.sol               # CollateralManager contract
    │   │   ├── Configurator.sol                    # Configurator contract
    │   │   ├── DebtToken.sol                       # DebtToken contract
    │   │   ├── LendingPool.sol                     # LendingPool contract
    │   │   ├── LendingPoolEvents.sol               # LendingPoolEvents contract
    │   │   ├── LendingPoolStorage.sol              # LendingPoolStorage contract
    │   │   ├── FToken.sol                          # FToken contract
    │   │   └── TokenPriceOracle.sol                # TokenPriceOracle contract (WIP)
    │   ├── scripts                                 # Scripts 
    │   │   └── deploy.js                           # Deployment script
    │   ├── test                                    # Unit tests
    │   ├── LICENCE  
    │   ├── README.md      
    │   └── ...  
    └── ...

## Local development

### Protocol

Follow the instructions in [v1-core/README.md](v1-core/README.md).

### Interface

Follow the instruction in [interface/README.md](interface/README.md).

## Next steps

* Connect with [Opensea Chainlink external adapter](https://github.com/niftrr/opensea-cl-ea) for NFT floor prices. (Note: external adapter development already complete and being supported by node operators).
* Connect to [Chainlink data feeds](https://chain.link/data-feeds) for price-feed integration. 
* Add logic to generage interest payment accrual to lenders.
* Update liquidate function to trigger a timed auction with a feature to allow the original owner to purchase back their deposited price at the cost of the outstanding debt plus a fee; to provide better protection and compensation for NFT owners during liquidation events. 
* Add flash loan functionality.
* Audit smart contracts.
* Update the Interface in terms of UX, with full test coverage.

## Licensing

The primary license for both the NFTlend V1 Core and Interface is the Business Source License 1.1 (`BUSL-1.1`), see:
* [`./v1-core/LICENSE`](./v1-core/LICENCE),
* [`./interface/LICENSE`](./interface/LICENCE).

## Public Ethereum Address

niftrr.eth
