// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import { IFToken } from "../interfaces/IFToken.sol";
import { IDebtToken } from "../interfaces/IDebtToken.sol";
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "../WadRayMath.sol";
import { DataTypes } from './DataTypes.sol';

import "hardhat/console.sol";

library ReserveLogic {
    using SafeMath for uint256;
    using WadRayMath for uint256;
    using SafeERC20 for IERC20;


    // event ReserveDataUpdated(
    //     address indexed asset,
    //     uint256 interestRate
    // );

    struct reserveDataLocalVars {  
        uint256 totalDebt;
        uint256 totalLiquidity;
        uint256 utilizationRate;
        uint256 liquidityRate;
        uint256 borrowRate;
        uint256 timeDelta;
    }

    using ReserveLogic for DataTypes.Reserve;

    function updateState(
        DataTypes.Reserve storage reserve
    )
        internal
        returns (uint256)
    {
        (reserve.latestUpdateTimestamp, reserve.liquidityIndex) = getNormalizedIncome(reserve);
        return reserve.liquidityIndex;
    }

    function getUtilizationRate(
        DataTypes.Reserve storage reserve
    )
        internal
        view
        returns (uint256)
    {
        reserveDataLocalVars memory vars;
        vars.totalDebt = IDebtToken(reserve.debtTokenAddress).totalSupply(); // TODO: change to IDebtToken after this is implemented
        vars.totalLiquidity = IFToken(reserve.fTokenAddress).totalSupply();
        
        vars.utilizationRate = 0;
        if (vars.totalLiquidity > 0) {
            vars.utilizationRate = vars.totalDebt.wadToRay().rayDiv(vars.totalLiquidity.wadToRay());
        }
        return vars.utilizationRate;
    }

    function getLiquidityRate(
        DataTypes.Reserve storage reserve
    )
        internal 
        view
        returns (uint256)
    {
        reserveDataLocalVars memory vars;
        vars.utilizationRate = getUtilizationRate(reserve);
        return reserve.borrowRate.rayMul(vars.utilizationRate);
    }

    function getNormalizedIncome(
        DataTypes.Reserve storage reserve
    )
        internal
        view
        returns (uint40, uint256)
    {
        reserveDataLocalVars memory vars;
        vars.liquidityRate = getLiquidityRate(reserve);

        uint256 timestamp = block.timestamp;
        if (reserve.latestUpdateTimestamp == 0) {
            vars.timeDelta = 0;
        } else {
            vars.timeDelta = timestamp.sub(reserve.latestUpdateTimestamp);
        }

        return (uint40(timestamp), reserve.liquidityIndex.add(
            reserve.liquidityIndex.rayMul(vars.liquidityRate).mul(vars.timeDelta).div(365 days)
        ));
    }

    function getUserFTokenBalance(
        DataTypes.Reserve storage reserve,
        address user
    )
        internal
        view
        returns (uint256)
    {
        return IFToken(reserve.fTokenAddress).balanceOf(user);
    }

    function getUserDebtTokenBalance(
        DataTypes.Reserve storage reserve,
        address user
    )
        internal
        view
        returns (uint256)
    {
        return IFToken(reserve.debtTokenAddress).balanceOf(user); // TODO: change to IDebtToken
    }

    // function getFTokenTotalSupply(
    //     DataTypes.Reserve storage reserve
    // )
    //     internal
    //     view
    //     returns (uint256)
    // {
    //     return IFToken(reserve.fTokenAddress).totalSupply();
    // }

    // function getDebtTokenTotalSupply(
    //     DataTypes.Reserve storage reserve
    // )
    //     internal
    //     view
    //     returns (uint256)
    // {
    //     return IDebtToken(reserve.debtTokenAddress).totalSupply();
    // }
}