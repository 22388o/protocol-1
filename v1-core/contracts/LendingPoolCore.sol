// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import { LendingPoolStorage } from './LendingPoolStorage.sol';
import { LendingPoolEvents } from './LendingPoolEvents.sol';
import { IFToken } from "./interfaces/IFToken.sol";
import { IDebtToken } from "./interfaces/IDebtToken.sol";
import { DataTypes } from './libraries/DataTypes.sol';
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import { ReserveLogic } from './libraries/ReserveLogic.sol';
import "./WadRayMath.sol";

import "hardhat/console.sol";

contract LendingPoolCore is LendingPoolStorage, LendingPoolEvents {
    using SafeMath for uint256;  
    using WadRayMath for uint256;

    // function getUtilizationRate(
    //     address asset
    // ) 
    //     public 
    //     returns (uint256)
    // {
    //     DataTypes.Reserve memory reserve = _reserves[asset];
    //     uint256 fTokenSupply = IFToken(reserve.fTokenAddress).totalSupply();
    //     uint256 utilizationRate = 0;
    //     if (fTokenSupply > 0) {
    //         utilizationRate = WadRayMath.wadToRay(
    //             WadRayMath.wadDiv(
    //                 IDebtToken(reserve.debtTokenAddress).getTotalSupply(), fTokenSupply
    //             )
    //         ); 
    //     }
    //     console.log('[logic] U=D/L', utilizationRate, IDebtToken(reserve.debtTokenAddress).getTotalSupply(), fTokenSupply);
    //     return utilizationRate;
    // }

    //     function getLiquidityRate(
    //     address asset,
    //     uint256 utilizationRate
    // ) 
    //     public
    //     view
    //     returns (uint256)
    // {
    //     DataTypes.Reserve memory reserve = _reserves[asset];
    //     console.log('[logic] LR = BR*UR', reserve.borrowRate.rayMul(utilizationRate), reserve.borrowRate, utilizationRate);
    //     return reserve.borrowRate.rayMul(utilizationRate);
    // }

    // function _updateLiquidityIndex(
    //     address asset
    // )
    //     internal
    //     returns (uint256)
    // {
    //     DataTypes.Reserve storage reserve = _reserves[asset];

    //     uint256 utilizationRate = getUtilizationRate(asset);
    //     uint256 liquidityRate = getLiquidityRate(asset, utilizationRate);

    //     uint256 timeDelta;
    //     if (reserve.latestUpdateTimestamp == 0) {
    //         // Initially set timeDelta to 0
    //         timeDelta = 0;
    //     } else {
    //         timeDelta = block.timestamp.sub(reserve.latestUpdateTimestamp);
    //         // timeDelta = 365 days;
    //     }

    //     console.log('B4 reserve.liquidityIndex', reserve.liquidityIndex);
    //     reserve.liquidityIndex = reserve.liquidityIndex.add(
    //         reserve.liquidityIndex.rayMul(liquidityRate).mul(timeDelta).div(365 days)
    //     );
    // }

    //     reserve.latestUpdateTimestamp = block.timestamp;

    //     emit UpdateReserve(asset, reserve.borrowRate, utilizationRate, reserve.liquidityIndex);
    //     return reserve.liquidityIndex;
    // }

    // function getReserveNormalizedIncome(
    //     address asset
    // )
    //     public
    //     view
    //     returns (uint256)
    // {
    //     DataTypes.Reserve storage reserve = _reserves[asset];
    //     uint256 totalFTokenSupply = IFToken(reserve.fTokenAddress).totalSupply();
    //     uint256 totalDebtTokenSupply = IDebtToken(reserve.debtTokenAddress).totalSupply();

    //     (, uint256 normalizedIncome) = ReserveLogic.getNormalizedIncome(
    //         reserve,
    //         totalFTokenSupply,
    //         totalDebtTokenSupply
    //     );
    //     return normalizedIncome;
    // }


    // function _updateUserScaledBalance(
    //     address user,
    //     address asset,
    //     uint256 amount,
    //     bool isDeposit
    // )
    //     internal
    //     returns (uint256)
    // {
    //     uint256 reserveNormalizedIncome = getReserveNormalizedIncome(asset);
        
    //     if (isDeposit) {
    //         userScaledBalances[user][asset] = userScaledBalances[user][asset].add(
    //             WadRayMath.rayToWad(
    //                 WadRayMath.wadToRay(amount).rayDiv(reserveNormalizedIncome)
    //             )
    //         );
    //     } else {
    //         userScaledBalances[user][asset] = userScaledBalances[user][asset].sub(
    //             WadRayMath.rayToWad(
    //                 WadRayMath.wadToRay(amount).div(reserveNormalizedIncome)
    //             )
    //         );
    //     }

    //     return userScaledBalances[user][asset];
    // }

    // function getUserFTokenBalance(
    //     address user,
    //     address asset
    // )
    //     public
    //     returns (uint256)
    // {
    //     console.log('reserve.normalizedIncome..', getReserveNormalizedIncome(asset));
    //     return WadRayMath.rayToWad(
    //         WadRayMath.rayMul(
    //             WadRayMath.wadToRay(userScaledBalances[user][asset]), getReserveNormalizedIncome(asset)
    //         )
    //     );
    // }
}