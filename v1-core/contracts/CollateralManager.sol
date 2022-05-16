// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import { DataTypes } from './libraries/DataTypes.sol';
import { InterestLogic } from "./libraries/InterestLogic.sol";
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "./WadRayMath.sol";
import "hardhat/console.sol";

/// @title A contract for managing borrows and their underlying collateral
/// @author Niftrr
/// @notice Allows for the deposit/withdraw of collateral to open/close a borrow position
/// @dev Acts as the NFT collateral escrow.
contract CollateralManager is Context, IERC721Receiver, AccessControl, Pausable, ReentrancyGuard {
    using SafeMath for uint256;
    using WadRayMath for uint256;
    using Counters for Counters.Counter;

    bytes32 public constant CONFIGURATOR_ROLE = keccak256("CONFIGURATOR_ROLE");
    bytes32 public constant LENDING_POOL_ROLE = keccak256("LENDING_POOL_ROLE");

    address[] public whitelist;

    mapping(uint256 => DataTypes.Borrow) public borrows;
    mapping(address => uint256[]) public userBorrows;
    mapping(bytes32 => uint256) public nftBorrows;
    mapping(address => uint256) public liquidationThresholds;
    mapping(bytes32 => uint256) public interestRates;
    mapping(address => bool) private whitelisted;

    Counters.Counter private counter;
    
    /// @notice Emitted when collateral is deposited to open a Borrow position.
    /// @param borrower The borrower account.
    /// @param erc721Token The ERC721 token for the NFT project.
    /// @param tokenId The unique identifier for the NFT project item.
    /// @param id The unique identifier for the Borrow.
    event DepositCollateral(
        address borrower,
        address erc721Token, 
        uint256 tokenId, 
        uint256 id
    );

    /// @notice Emitted when collateral is withdrawn to close a Borrow position.
    /// @param borrower The borrower account.
    /// @param erc721Token The ERC721 token for the NFT project.
    /// @param tokenId The unique identifier for the NFT project item.
    /// @param id The unique identifier for the Borrow.
    event WithdrawCollateral(
        address borrower,
        address erc721Token, 
        uint256 tokenId, 
        uint256 id
    );

    /// @notice Emitted when collateral is liquidated to close a Borrow position.
    /// @param liquidator The liquidator account.
    /// @param erc721Token The ERC721 token for the NFT project.
    /// @param tokenId The unique identifier for the NFT project item.
    /// @param id The unique identifier for the Borrow.
    event LiquidateCollateral(
        address liquidator,
        address erc721Token, 
        uint256 tokenId, 
        uint256 id
    );

    /// @notice Emitted when the interest rate is set for a given reserve.
    /// @param collateral The collateral contract address.
    /// @param asset The asset contract address
    /// @param interestRate Interest rate in RAY (1e27)
    event SetInterestRate(
        address collateral,
        address asset,
        uint256 interestRate
    );

    /// @notice Emitted when the liquidation threshold is set for a given NFT project.
    /// @param erc721Token The ERC721 token for the NFT project.
    /// @param liquidationThreshold The 18 decimal liquidationThreshold percentage.
    event SetLiquidationThreshold(
        address erc721Token, 
        uint256 liquidationThreshold
    );

    /// @notice Emitted when the an NFT project whitelist status is updated.
    /// @param erc721Token The ERC721 token for the NFT project.
    /// @param isWhitelisted Boolean for if the project is whitelisted.
    event Whitelisted(
        address erc721Token,
        bool isWhitelisted
    );

    constructor(address configurator, address lendingPool) {
        _setupRole(CONFIGURATOR_ROLE, configurator);
        _setupRole(LENDING_POOL_ROLE, lendingPool);
        counter.increment(); // to start borrow ids at 1
    }

    modifier onlyConfigurator() {
        require(hasRole(CONFIGURATOR_ROLE, _msgSender()), "Caller is not the Configurator");
        _;
    }

    modifier onlyLendingPool() {
        require(hasRole(LENDING_POOL_ROLE, _msgSender()), "Caller is not the Lending Pool");
        _;
    }

    modifier whenBorrowActive(uint256 _id) {
        require(
            borrows[_id].status == DataTypes.BorrowStatus.Active ||
            borrows[_id].status == DataTypes.BorrowStatus.ActiveAuction, 
            "Borrow / auction is not active");
        _;
    }

    modifier whenBorrowActiveAuction(uint256 _id) {
        require(borrows[_id].status == DataTypes.BorrowStatus.ActiveAuction, "Borrow auction is not active");
        _;
    }

    /// @notice To deposit an ERC721 token in escrow and create a borrow position.
    /// @param borrower The borrower account.
    /// @param erc20Token The ERC20 token to be borrowed.
    /// @param erc721Token The ERC721 token to be used as collateral.
    /// @param tokenId The tokenId of the ERC721 token to be deposited.
    /// @param borrowAmount The amount of ERC20 tokens to be borrowed.
    /// @param interestRate The interest rate APR on the borrowed amount in RAY (1e27).
    /// @param collateralFloorPrice The current floor price of the ERC721 token.
    /// @param timestamp When the borrow was executed.
    /// @dev Calls internal `_deposit` function if modifiers are succeeded.  
    /// @return Boolean for success
    function deposit(
        address borrower,
        address erc20Token,
        address erc721Token, 
        uint256 tokenId, 
        uint256 borrowAmount,
        uint256 interestRate,
        uint256 collateralFloorPrice,
        uint40 timestamp
    ) 
        external 
        nonReentrant
        onlyLendingPool
        whenNotPaused
        returns (bool)
    {
        bool success = _deposit(
            borrower,
            erc20Token,
            erc721Token, 
            tokenId, 
            borrowAmount,
            interestRate,
            collateralFloorPrice,
            timestamp
        );
        return success;
    }

    /// @notice To withdraw an ERC721 token from escrow and removes a borrow position.
    /// @param _id The borrower id.
    /// @param _asset The ERC20 token to be repaid.
    /// @param _repaymentAmount The amount of ERC20 tokens to be repaid. 
    /// @dev Calls internal `_withdraw` function if modifiers are succeeded. 
    function withdraw(
        uint256 _id, 
        address _asset, 
        uint256 _repaymentAmount
    ) 
        external 
        nonReentrant
        onlyLendingPool 
        whenNotPaused 
        whenBorrowActive(_id)
        returns (
            bool,
            uint256,
            uint256
        )
    {
        (
            bool success,
            uint256 borrowAmount,
            uint256 interestRate
        ) = _withdraw(
            _id, 
            _asset, 
            _repaymentAmount
        );

        return (success, borrowAmount, interestRate);
    }

    /// @notice To retrieve the ERC721 token collateral for a borrow position liquidator.
    /// @param _id The borrower id.
    /// @param _asset The ERC20 token to be repaid.
    /// @param _repaymentAmount The amount of ERC20 tokens to be repaid. 
    /// @param _liquidator The liquidator.
    /// @dev Calls internal `_retrieve` function if modifiers are succeeded. 
    /// @return Boolean for success.
    function retrieve(
        uint256 _id, 
        address _asset, 
        uint256 _repaymentAmount, 
        address _liquidator
    )
        public 
        nonReentrant
        onlyLendingPool
        whenNotPaused 
        whenBorrowActiveAuction(_id)
        returns (bool)
    {
        bool success = _retrieve(
            _id, 
            _asset, 
            _repaymentAmount, 
            _liquidator 
        );

        return success;
    } 

    /// @notice Pauses the contract deposit and withdraw functions.
    /// @dev Functions paused via modifiers using Pausable contract.
    function pause() external onlyConfigurator {
        _pause();
    }

    /// @notice Unpauses the contract deposit and withdraw functions.
    /// @dev Functions unpaused via modifiers using Pausable contract.
    function unpause() external onlyConfigurator {
        _unpause();
    }

    /// @notice Sets the interest rate APY for a given reserve.
    /// @param collateral The collateral contract address.
    /// @param asset The asset contract address.
    /// @param interestRate The (new) interest rate APY to set for the reserve.
    /// @dev Mapping used to keep track of interest rates, set per reserve.
    function setInterestRate(address collateral, address asset, uint256 interestRate) external onlyConfigurator {
        interestRates[keccak256(abi.encode(collateral, asset))] = interestRate;

        emit SetInterestRate(collateral, asset, interestRate);
    }

    /// @notice Sets the liquidation threshold for a given ERC721 token.
    /// @param _erc721Token The ERC721 token.
    /// @param _threshold The minimum collateralization theshold as an 18 decimal percentage.
    /// @dev Mapping used to keep track of liquidation thresholds, set per NFT project.
    function setLiquidationThreshold(address _erc721Token, uint256 _threshold) external onlyConfigurator {
        liquidationThresholds[_erc721Token] = _threshold;

        emit SetLiquidationThreshold(_erc721Token, _threshold);
    }

    /// @notice Updates the NFT project whitelist with a given ERC721 token.
    /// @param erc721Token The ERC721 token.
    /// @param isWhitelisted The boolean for whether to set as whitelisted.
    /// @dev Both the whitelisted mapping a whitelist array are updated.
    function updateWhitelist(address erc721Token, bool isWhitelisted) external onlyConfigurator {
        whitelisted[erc721Token] = isWhitelisted;
        if (isWhitelisted) {
            whitelist.push(erc721Token);
        } else {
            for (uint i = 0; i < whitelist.length-1; i++){
                if (whitelist[i] == erc721Token) {
                    whitelist[i] = whitelist[whitelist.length-1];
                    whitelist.pop();
                }
            }
        }

        emit Whitelisted(erc721Token, isWhitelisted);
    }

    /// @notice For the receiving of ERC721 tokens to this contract address.
    /// @dev An ERC721 `safeTransferFrom` will revert unless this Solidity selector is returned.
    /// @return Always returns `IERC721Receiver.onERC721Received.selector`.
    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /// @notice Gets a list of borrow ids for a given user account.
    /// @param user The user account.
    /// @dev Uses a mapping.
    /// @return Returns an array of the user borrow ids.
    function getUserBorrowIds(address user) public view returns (uint256[] memory) {
        return userBorrows[user];
    }

    function getLastBorrowId() public view returns (uint256) {
        return counter._value;
    }

    /// @notice retrieves the Borrow for a given id.
    /// @dev Uses a mapping and returns a struct.
    /// @return Returns the Borrow for a given id.
    function getBorrow(uint256 borrowId) public view returns (DataTypes.Borrow memory) {
        return borrows[borrowId];
    }

    /// @notice retrieves the Borrow id for given collateral and tokenId.
    /// @param collateral Collateral contract address
    /// @param tokenId Collatera token id.
    /// @dev Returns 0 if doesn't exists. Borrow Ids starting from 1.
    /// @return Returns the Borrow for a given id.
    function getBorrowId(address collateral, uint256 tokenId) public view returns (uint256) {
        return nftBorrows[keccak256(abi.encode(collateral, tokenId))];
    }

    function getBorrowBalance(address collateral, uint256 tokenId) public view returns (uint256) {
        uint256 borrowBalanceAmount;
        uint256 borrowId = nftBorrows[keccak256(abi.encode(collateral, tokenId))];
        DataTypes.Borrow memory borrowItem = borrows[borrowId];
        if (borrowItem.borrowAmount > 0) {
            borrowBalanceAmount = borrowItem.borrowAmount
            .add(
                (borrowItem.borrowAmount)
                .rayMul(borrowItem.interestRate)
                .mul(block.timestamp.sub(borrowItem.timestamp))
                .div(365 days)
            );
        }
        return borrowBalanceAmount;
    }

    function setBorrowAuctionBid(
        uint256 borrowId, 
        uint256 auctionBid, 
        address auctionBidder
    ) 
        public 
        onlyLendingPool
        returns (bool) 
    {
        borrows[borrowId].auction.bid = auctionBid;
        borrows[borrowId].auction.bidder = auctionBidder;
        return true;
    }

    function setBorrowAuctionCall(
        uint256 borrowId, 
        uint256 auctionBid, 
        uint256 auctionLiquidationFee,
        uint40 auctionTimestamp,
        address auctionCaller
    ) 
        public 
        onlyLendingPool
        returns (bool) 
    {
        borrows[borrowId].auction.bid = auctionBid;
        borrows[borrowId].auction.liquidationFee = auctionLiquidationFee;
        borrows[borrowId].auction.timestamp = auctionTimestamp;
        borrows[borrowId].auction.caller = auctionCaller;
        borrows[borrowId].auction.bidder = auctionCaller;
        borrows[borrowId].status = DataTypes.BorrowStatus.ActiveAuction;
        return true;
    }


    function updateBorrow(
        uint256 _id,
        address _asset,
        uint256 _updateAmount, 
        uint256 _collateralFloorPrice,
        DataTypes.BorrowStatus _status,
        bool _isRepayment,
        address _msgSender
    ) 
        public 
        onlyLendingPool
        returns (bool, uint256, uint256) 
    {
        return _updateBorrow(
            _id, 
            _asset, 
            _updateAmount, 
            _collateralFloorPrice,
            _status,
            _isRepayment,
            _msgSender
        );
    }

    function setBorrowStatus(
        uint256 borrowId, 
        DataTypes.BorrowStatus status
    ) 
        public 
        onlyLendingPool
        returns (bool) 
    {
        borrows[borrowId].status = status;
        return true;
    }

    /// @notice Gets the interest rate APY for a reserve.
    /// @param collateral The collateral contract address.
    /// @param asset The asset contract address.
    /// @dev Retrieves the reserve interest rate back from the mapping.
    /// @return Interest rate in RAY (1e27)
    function getInterestRate(address collateral, address asset) public view returns (uint256) {
        return interestRates[keccak256(abi.encode(collateral, asset))];
    }

    /// @notice Gets the liquidation threshold for a given ERC721 token.
    /// @param _erc721Token The ERC721 token.
    /// @dev Retrieves the NFT project liquidation threshold from the mapping.
    /// @return Returns the liquidation threshold as an 18 decimal percentage.
    function getLiquidationThreshold(address _erc721Token) public view returns (uint256) {
        return liquidationThresholds[_erc721Token];
    }

    /// @notice Retrieves an array of whitelisted NFT projects.
    /// @dev Returns a dynamic array.
    /// @return The NFT project whitelist as an array.
    function getWhitelist() public view returns (address[] memory) {
        return whitelist;
    }
    /// @notice Gets the liquidation for given borrow parameters.
    /// @param erc721Token The ERC721 token to be used as collateral.
    /// @param borrowAmount The amount of ERC20 tokens to be borrowed.
    /// @dev Logic separated from _deposit function.
    /// @return Returns the liquidationPrice.
    function _getLiquidationPrice(
        address erc721Token,
        uint256 borrowAmount,
        uint256 collateralFloorPrice
    ) 
        private
        view
        returns (uint256)
    {
        uint256 liquidationThreshold = getLiquidationThreshold(erc721Token);
        uint256 maxAmount = collateralFloorPrice.mul(100).div(liquidationThreshold); // TODO: use global var for liquidationThreshold
        require(borrowAmount <= maxAmount, "UNDERCOLLATERALIZED"); 

        uint256 liquidationPrice = borrowAmount.mul(liquidationThreshold).div(100);
        return liquidationPrice;
    }

    /// @notice Private function to deposit ERC721 token in escrow and create a borrow.
    /// @param borrower The borrower account.
    /// @param erc20Token The ERC20 token to be borrowed.
    /// @param erc721Token The ERC721 token to be used as collateral.
    /// @param tokenId The tokenId of the ERC721 token to be deposited.
    /// @param borrowAmount The amount of ERC20 tokens to be borrowed.
    /// @param interestRate The interest rate APR on the borrowed amount in RAY (1e27).
    /// @param collateralFloorPrice The current floor price of the ERC721 token.
    /// @param timestamp When the borrow was executed.
    /// @dev Transfers the ERC721 to this contract address for escrow and creates a borrow. 
    /// @return Boolean for success.
    function _deposit(
        address borrower,
        address erc20Token,
        address erc721Token, 
        uint256 tokenId, 
        uint256 borrowAmount,
        uint256 interestRate,
        uint256 collateralFloorPrice,
        uint40 timestamp
    ) 
        private 
        returns (bool)
    {
        address newOwner;
        require(whitelisted[erc721Token], "NFT not whitelisted"); 
        
        IERC721(erc721Token).transferFrom(borrower, address(this), tokenId);
        newOwner = IERC721(erc721Token).ownerOf(tokenId);
        require(newOwner == address(this), "UNSUCCESSFUL_TRANSFER");

        uint256 id = counter.current();
        uint256 liquidationPrice = _getLiquidationPrice(
            erc721Token,
            borrowAmount,
            collateralFloorPrice
        );

        borrows[id] = DataTypes.Borrow({
            status: DataTypes.BorrowStatus.Active,
            collateral: DataTypes.Collateral({
                erc721Token: erc721Token,
                tokenId: tokenId
            }),
            borrower: borrower,
            erc20Token: erc20Token,
            borrowAmount: borrowAmount,
            interestRate: interestRate,
            liquidationPrice: liquidationPrice,
            timestamp: timestamp,
            auction: DataTypes.Auction({
                caller: address(0),
                bidder: address(0),
                bid: 0,
                liquidationFee: 0,
                timestamp: 0
            })
        });

        nftBorrows[keccak256(abi.encode(erc721Token, tokenId))] = id;

        userBorrows[borrower].push(id);
        counter.increment();

        emit DepositCollateral(
            borrower,
            erc721Token,
            tokenId,
            id
        );

        return true;
    }    

    /// @notice Private function to withdraw ERC721 token from escrow and remove a borrow.
    /// @param _id The borrow id.
    /// @param _asset The ERC20 token to be repaid.
    /// @param _repaymentAmount The amount of ERC20 tokens to be repaid. 
    /// @dev Removes a borrow and transfers the ERC721 from escrow back to the borrower.
    /// @return Boolean for success and interestRate of borrow. 
    function _withdraw(
        uint256 _id, 
        address _asset, 
        uint256 _repaymentAmount
    ) 
        private
        returns (
            bool, 
            uint256,
            uint256
        )
    {
        address newOwner;

        address borrowAsset = borrows[_id].erc20Token;
        require(borrowAsset == _asset, "Repayment asset doesn't match borrow");

        uint256 accruedBorrowAmount = borrows[_id].borrowAmount.rayMul(
            InterestLogic.calculateLinearInterest(borrows[_id].interestRate, borrows[_id].timestamp)
        );
        require(accruedBorrowAmount == _repaymentAmount, "Repayment amount doesn't match borrow");

        address borrower = borrows[_id].borrower;
        address erc721Token = borrows[_id].collateral.erc721Token;
        uint256 tokenId = borrows[_id].collateral.tokenId;

        IERC721(erc721Token).transferFrom(address(this), borrower, tokenId);
        newOwner = IERC721(erc721Token).ownerOf(tokenId);
        require(newOwner == borrower, "UNSUCCESSFUL_TRANSFER");

        borrows[_id].status = DataTypes.BorrowStatus.Repaid;
        borrows[_id].borrowAmount = 0;
        borrows[_id].liquidationPrice = 0;
        borrows[_id].timestamp = uint40(block.timestamp);
        
        // Setting ID to zero so that a new borrow is created in future
        nftBorrows[keccak256(abi.encode(erc721Token, tokenId))] = 0;
        
        emit WithdrawCollateral(
            borrower,
            erc721Token,
            tokenId,
            _id
        );

        return (true, borrows[_id].borrowAmount, borrows[_id].interestRate);
    }

    /// @notice Private function to retrieve the collateral for a borrow liquidator.
    /// @param _id The borrower id.
    /// @param _asset The ERC20 token to be repaid.
    /// @param _repaymentAmount The amount of ERC20 tokens to be repaid. 
    /// @param _liquidator The liquidator.
    /// @dev Removes a borrow and transfers the ERC721 from escrow to the liquidator. 
    /// @return Boolean for success.
    function _retrieve(
        uint256 _id, 
        address _asset, 
        uint256 _repaymentAmount, 
        address _liquidator
    )
        private
        returns (bool)
    {
        address newOwner;

        address borrowAsset = borrows[_id].erc20Token;
        require(borrowAsset == _asset, "Repayment asset doesn't match borrow");

        uint256 accruedBorrowAmount = borrows[_id].borrowAmount.rayMul(
            InterestLogic.calculateLinearInterest(borrows[_id].interestRate, borrows[_id].timestamp)
        );
        require(accruedBorrowAmount == _repaymentAmount, "Repayment amount doesn't match borrow");

        address erc721Token = borrows[_id].collateral.erc721Token;
        uint256 tokenId = borrows[_id].collateral.tokenId;

        IERC721(erc721Token).transferFrom(address(this), _liquidator, tokenId);
        newOwner = IERC721(erc721Token).ownerOf(tokenId);
        require(newOwner == _liquidator, "UNSUCCESSFUL_TRANSFER");

        borrows[_id].status = DataTypes.BorrowStatus.Liquidated;
        
        emit LiquidateCollateral(
            _liquidator,
            erc721Token,
            tokenId,
            _id
        );

        return true;
    } 

    struct UpdateVars {
        address borrowAsset;
        uint256 accruedBorrowAmount;
        uint256 updatedBorrowAmount;
    }

    /// @notice Private function to update (partial borrow/repay) against borrow position.
    /// @param _id The borrow id.
    /// @param _asset The ERC20 token to be borrowed/repaid.
    /// @param _updateAmount The amount of ERC20 tokens to be borrowed/repaid. 
    /// @param _isRepayment True if a partial repayment. False if update is to borrow more. 
    /// @dev Updates the borrow position with amount + accrued interest, and updates timestamp for interest accrual calculation.
    /// @return Boolean for success, borrowAmount and interestRate. 
    function _updateBorrow(
        uint256 _id,
        address _asset,
        uint256 _updateAmount,
        uint256 _collateralFloorPrice,
        DataTypes.BorrowStatus _status,
        bool _isRepayment,
        address _msgSender
    )
        private
        returns (bool, uint256, uint256)
    {
        UpdateVars memory vars;
        require(_msgSender == borrows[_id].borrower, "NOT_BORROWER");

        vars.accruedBorrowAmount = borrows[_id].borrowAmount.rayMul(
            InterestLogic.calculateLinearInterest(borrows[_id].interestRate, borrows[_id].timestamp)
        );

        vars.updatedBorrowAmount = _isRepayment ? vars.accruedBorrowAmount - _updateAmount : vars.accruedBorrowAmount + _updateAmount;
        
        require(vars.updatedBorrowAmount < _collateralFloorPrice.mul(100).div(150) , "UNDERCOLLATERALIZED"); // TODO: updata 150 to dynamic amount

        vars.borrowAsset = borrows[_id].erc20Token;
        require(vars.borrowAsset == _asset, "Repayment asset doesn't match borrow");


        borrows[_id].status = _status;
        borrows[_id].borrowAmount = vars.updatedBorrowAmount;
        borrows[_id].liquidationPrice = _getLiquidationPrice(
            borrows[_id].collateral.erc721Token,
            borrows[_id].borrowAmount,
            _collateralFloorPrice
        );
        borrows[_id].timestamp = uint40(block.timestamp);

        return (true, borrows[_id].borrowAmount, borrows[_id].interestRate);
    }
}