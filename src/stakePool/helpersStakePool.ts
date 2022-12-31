import { Assets, PaymentKeyHash } from "lucid-cardano";
import { BIGINT, EUTxO, FundDatum, InterestRate, Master, Maybe, PoolDatum, POSIXTime, UserDatum, UTxO_Simple } from "../types";
import { strToHex, toJson } from "../utils/utils";
import { maxRewards, poolDatum_ClaimedFund, txID_User_Withdraw_TN } from "../types/constantes";
import { StakingPoolDBInterface } from "../types/stakePoolDBModel";
import { sumTokensAmt_From_AC_Lucid, addAssetsList } from "../utils/cardano-helpers";

//---------------------------------------------------------------

export function stakingPoolDBParser(stakingPoolDB: any) {

    const stakingPoolDB_: StakingPoolDBInterface = {
        name: stakingPoolDB.name,
        imageSrc: stakingPoolDB.imageSrc,

        swShowOnSite: stakingPoolDB.swShowOnSite,
        swShowOnHome: stakingPoolDB.swShowOnHome,
        swPreparado: stakingPoolDB.swPreparado,
        swIniciado: stakingPoolDB.swIniciado,
        swFunded: stakingPoolDB.swFunded,
        swClosed: stakingPoolDB.swClosed,
        closedAt: (stakingPoolDB.closedAt !== undefined ? new Date(stakingPoolDB.closedAt) : undefined),
        swTerminated: stakingPoolDB.swTerminated,
        swZeroFunds: stakingPoolDB.swZeroFunds,
        swPoolReadyForDelete: stakingPoolDB.swPoolReadyForDelete,

        beginAt: new Date(stakingPoolDB.beginAt),
        deadline: new Date(stakingPoolDB.deadline),
        graceTime: stakingPoolDB.graceTime,

        masters: stakingPoolDB.masters,

        uTxO_With_PoolDatum: stakingPoolDB.uTxO_With_PoolDatum === "" ? undefined : JSON.parse(stakingPoolDB.uTxO_With_PoolDatum),

        eUTxO_With_ScriptDatum: stakingPoolDB.eUTxO_With_ScriptDatum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_ScriptDatum),

        eUTxO_With_Script_TxID_Master_Fund_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_Fund_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_Fund_Datum),
        eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum),
        eUTxO_With_Script_TxID_Master_SplitFund_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_SplitFund_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_SplitFund_Datum),
        eUTxO_With_Script_TxID_Master_ClosePool_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_ClosePool_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_ClosePool_Datum),
        eUTxO_With_Script_TxID_Master_TerminatePool_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_TerminatePool_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_TerminatePool_Datum),
        eUTxO_With_Script_TxID_Master_DeleteFund_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_DeleteFund_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_DeleteFund_Datum),
        eUTxO_With_Script_TxID_Master_SendBackFund_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_SendBackFund_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_SendBackFund_Datum),
        eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum),
        eUTxO_With_Script_TxID_Master_AddScripts_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_AddScripts_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_AddScripts_Datum),
        eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: stakingPoolDB.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum),

        eUTxO_With_Script_TxID_User_Deposit_Datum: stakingPoolDB.eUTxO_With_Script_TxID_User_Deposit_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_User_Deposit_Datum),
        eUTxO_With_Script_TxID_User_Harvest_Datum: stakingPoolDB.eUTxO_With_Script_TxID_User_Harvest_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_User_Harvest_Datum),
        eUTxO_With_Script_TxID_User_Withdraw_Datum: stakingPoolDB.eUTxO_With_Script_TxID_User_Withdraw_Datum === "" ? undefined : JSON.parse(stakingPoolDB.eUTxO_With_Script_TxID_User_Withdraw_Datum),

        scriptAddress: stakingPoolDB.scriptAddress,
        script: JSON.parse(stakingPoolDB.script),

        staking_UI: stakingPoolDB.staking_UI,
        harvest_UI: stakingPoolDB.harvest_UI,

        staking_Lucid: stakingPoolDB.staking_Lucid,
        harvest_Lucid: stakingPoolDB.harvest_Lucid,

        pParams: JSON.parse(stakingPoolDB.pParams),

        poolID_TxOutRef: JSON.parse(stakingPoolDB.poolID_TxOutRef),
        poolID_CS: stakingPoolDB.poolID_CS,
        poolID_Script: JSON.parse(stakingPoolDB.poolID_Script),

        txID_Master_Fund_CS: stakingPoolDB.txID_Master_Fund_CS,
        txID_Master_Fund_Script: JSON.parse(stakingPoolDB.txID_Master_Fund_Script),

        txID_Master_FundAndMerge_CS: stakingPoolDB.txID_Master_FundAndMerge_CS,
        txID_Master_FundAndMerge_Script: JSON.parse(stakingPoolDB.txID_Master_FundAndMerge_Script),

        txID_Master_SplitFund_CS: stakingPoolDB.txID_Master_SplitFund_CS,
        txID_Master_SplitFund_Script: JSON.parse(stakingPoolDB.txID_Master_SplitFund_Script),

        txID_Master_TerminatePool_CS: stakingPoolDB.txID_Master_TerminatePool_CS,
        txID_Master_TerminatePool_Script: JSON.parse(stakingPoolDB.txID_Master_TerminatePool_Script),

        txID_Master_ClosePool_CS: stakingPoolDB.txID_Master_ClosePool_CS,
        txID_Master_ClosePool_Script: JSON.parse(stakingPoolDB.txID_Master_ClosePool_Script),

        txID_Master_DeleteFund_CS: stakingPoolDB.txID_Master_DeleteFund_CS,
        txID_Master_DeleteFund_Script: JSON.parse(stakingPoolDB.txID_Master_DeleteFund_Script),

        txID_Master_SendBackFund_CS: stakingPoolDB.txID_Master_SendBackFund_CS,
        txID_Master_SendBackFund_Script: JSON.parse(stakingPoolDB.txID_Master_SendBackFund_Script),

        txID_Master_SendBackDeposit_CS: stakingPoolDB.txID_Master_SendBackDeposit_CS,
        txID_Master_SendBackDeposit_Script: JSON.parse(stakingPoolDB.txID_Master_SendBackDeposit_Script),

        txID_Master_AddScripts_CS: stakingPoolDB.txID_Master_AddScripts_CS,
        txID_Master_AddScripts_Script: JSON.parse(stakingPoolDB.txID_Master_AddScripts_Script),

        txID_Master_DeleteScripts_CS: stakingPoolDB.txID_Master_DeleteScripts_CS,
        txID_Master_DeleteScripts_Script: JSON.parse(stakingPoolDB.txID_Master_DeleteScripts_Script),

        txID_User_Deposit_CS: stakingPoolDB.txID_User_Deposit_CS,
        txID_User_Deposit_Script: JSON.parse(stakingPoolDB.txID_User_Deposit_Script),

        txID_User_Harvest_CS: stakingPoolDB.txID_User_Harvest_CS,
        txID_User_Harvest_Script: JSON.parse(stakingPoolDB.txID_User_Harvest_Script),

        txID_User_Withdraw_CS: stakingPoolDB.txID_User_Withdraw_CS,
        txID_User_Withdraw_Script: JSON.parse(stakingPoolDB.txID_User_Withdraw_Script)
    };

    stakingPoolDB_.pParams.ppInterestRates = stakingPoolDB_.pParams.ppInterestRates.map((item: any) => { return new InterestRate(item.iMinDays, item.iPercentage); });

    return stakingPoolDB_;

}
//----------------------------------------------------------------------

export async function getEstadoDeployAPI(nombrePool: string, swFrontEnd: boolean = true) {

    let data = {
        nombrePool: nombrePool
    };

    const urlApi = "/api/getEstadoDeploy";

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };

    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;

    switch (response.status) {
        case 500:
            console.error("getEstadoDeploy - api/getEstadoDeploy - Error 500")
            throw "Error 500";
        case 400:
            console.error("getEstadoDeploy - api/getEstadoDeploy - Error: " + message);
            throw message;
        case 201:
        case 200:
            console.log("getEstadoDeploy - api/getEstadoDeploy: " + message);
            return message;
        default:
    }
}

export function getRewardsPerInvest(poolInfo: StakingPoolDBInterface, closedAt: POSIXTime | undefined, interestRates: InterestRate[], lastClaim: Maybe<POSIXTime>, now: POSIXTime, depositTime: POSIXTime, invest: BIGINT, rewardsNotClaimed: BIGINT): BIGINT {
    // console.log ("getRewardsPerInvest - Init")  
    var upperTime;
    if (closedAt !== undefined) {
        // console.log ("getRewardsPerInvest - deadlineOrCloseTime - usando closedAt: " + closedAt)
        upperTime = BigInt(closedAt);
    } else if (now > BigInt(poolInfo.deadline.getTime())) {
        // console.log ("getRewardsPerInvest - deadlineOrCloseTime - usando deadline: " + poolInfo.deadline)
        upperTime = BigInt(poolInfo.deadline.getTime());
    } else {
        // console.log ("getRewardsPerInvest - deadlineOrCloseTime - usando now: " + now)
        upperTime = now;
    }

    function lowerTime(upperTime: BIGINT, depositOrLClaim: BIGINT) {
        if (depositOrLClaim > upperTime) {
            return upperTime;
        } else {
            return depositOrLClaim;
        }
    }


    let diffForInterestRate = upperTime - depositTime;
    let msPerDay = 1000 * 60 * 60 * 24;
    let msPerYear = msPerDay * 365;

    function days(n: number): number {
        return (n * msPerDay);
    }

    function isDiffLessThanMinDays(diffForInterestRate: number, minDays: number | undefined): boolean {
        return minDays === undefined ? true : diffForInterestRate <= minDays;
    }

    function getInterestRate(interestRates: InterestRate[]): number {
        if (interestRates.length == 0) {
            throw "It shouldn't happen that you don't find a suitable rate...";
        }
        const [x, ...xs] = interestRates;
        if (x.iMinDays.val === undefined || isDiffLessThanMinDays(Number(diffForInterestRate), x.iMinDays.val)) {
            return x.iPercentage;
        }
        return getInterestRate(xs);
    }

    function getRewards(duration: BIGINT): BIGINT {
        const rewards = (BigInt(getInterestRate(interestRates)) * duration * invest) / BigInt(msPerYear);
        if (rewards + rewardsNotClaimed > maxRewards)
            return maxRewards - rewardsNotClaimed;

        else
            return rewards;
    }

    if (lastClaim.val === undefined) {
        return getRewards(upperTime - lowerTime(upperTime, depositTime));
    } else {
        return getRewards(upperTime - lowerTime(upperTime, lastClaim.val));
    }

}

export function sortFundDatum(poolInfo: StakingPoolDBInterface, eUTxOs_With_FundDatum: EUTxO[]) {
    return eUTxOs_With_FundDatum.sort((a, b) => {


        const fundsA = getAvailaibleFunds_In_EUTxO_With_FundDatum(a);
        const fundsB = getAvailaibleFunds_In_EUTxO_With_FundDatum(b);

        if (fundsA > fundsB) {
            return -1;
        } else if (fundsA < fundsB) {
            return 1;
        } else {
            const fundDatum1: FundDatum = a.datum as FundDatum;
            const fundDatum2: FundDatum = b.datum as FundDatum;

            const fdFundAmount1 = fundDatum1.fdFundAmount;
            const fdFundAmount2 = fundDatum2.fdFundAmount;

            if (fdFundAmount1 > fdFundAmount2) {
                return -1;
            } else if (fdFundAmount1 < fdFundAmount2) {
                return 1;
            } else {
                const fdCashedOut1 = fundDatum1.fdCashedOut;
                const fdCashedOut2 = fundDatum2.fdCashedOut;
                if (fdCashedOut1 > fdCashedOut2) {
                    return -1;
                } else if (fdCashedOut1 < fdCashedOut2) {
                    return 1;
                } else {
                    const value1 = a.uTxO.assets;
                    const value2 = b.uTxO.assets;
                    const ada1 = value1["lovelace"];
                    const ada2 = value2["lovelace"];
                    if (ada1 > ada2) {
                        return -1;
                    } else if (ada1 < ada2) {
                        return 1;
                    } else {
                        // TODO : ordenar mejor los values
                        if (value1 > value2) {
                            return -1;
                        } else {
                            return 1;
                        }
                    }
                }
            }
        }

        // const valA = calculate_Sort_FundDatum(poolInfo, a);
        // const valB = calculate_Sort_FundDatum(poolInfo, b);
        // // console.log("fundsA: " + fundsA + " - afterA: " + afterA + " - userA: " + userA + " - valA: " + valA);
        // // console.log("fundsB: " + fundsB + " - afterB: " + afterB + " - userB: " + userB + " - valB: " + valB);
        // if (valA < valB)
        //     return 1;
        // if (valA > valB)
        //     return -1;
        // // if (userA < userB)
        // //     return 1;
        // // if (userA > userB)
        // //     return -1;
        // return 0;
    });
}
//---------------------------------------------------------------

export function calculate_Sort_FundDatum(poolInfo: StakingPoolDBInterface, eUTxO_With_FundDatum: EUTxO) {
    const fundsA = getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxO_With_FundDatum);
    return fundsA;
}
//---------------------------------------------------------------

export function selectFundDatum_WithEnoughValueToClaim(eUTxOs_With_FundDatum: EUTxO[], claimLeft: BIGINT) {

    var eUTxOs_With_FundDatum_WithEnoughValueToClaim: EUTxO[] = [];

    for (var i = 0; i < eUTxOs_With_FundDatum.length; i += 1) {
        var eUTxO = eUTxOs_With_FundDatum[i];
        var valueCanUse = getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxO);
        claimLeft = claimLeft - valueCanUse;
        eUTxOs_With_FundDatum_WithEnoughValueToClaim.push(eUTxO);
        if (claimLeft <= 0) {
            break;
        }
    }

    return eUTxOs_With_FundDatum_WithEnoughValueToClaim;
}

//---------------------------------------------------------------


export function getTotalFundAmountsRemains_ForMasters(eUTxO_With_PoolDatum: EUTxO, eUTxOs_With_FundDatum: EUTxO[]) {

    var total = 0n;
    var totalMinAda = 0n;

    const poolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;
    var masterFunders = poolDatum.pdMasterFunders;

    for (var i = 0; i < masterFunders.length; i += 1) {
        var [total_,totalMinAda_] = getFundAmountsRemains_ForMaster(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum, masterFunders[i].mfMaster);
        total += total_;
        totalMinAda += totalMinAda_;
    }

    return [total, totalMinAda];
}

//---------------------------------------------------------------

export function getFundAmountsRemains_ForMaster(eUTxO_With_PoolDatum: EUTxO, eUTxOs_With_FundDatum: EUTxO[], master: Master) {

    const poolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;

    var masterFunders = poolDatum.pdMasterFunders;

    var totalFunding = masterFunders.map(mf => mf.mfFundAmount).reduce((acc, val) => acc + val, 0n);
    var totalRewardsCashedOut = getTotalCashedOut(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum);
    var remaindFunds = totalFunding - totalRewardsCashedOut;
    //---------------------
    var totalMinAda = masterFunders.map(mf => mf.mfMinAda).reduce((acc, val) => acc + val, 0n);
    //---------------------
    const masterFunder = masterFunders.find(x => x.mfMaster == master);
    if (masterFunder !== undefined) {
        if (masterFunder.mfClaimedFund == poolDatum_ClaimedFund) {
            return [0n, 0n];
        } else {
            var masterFundAmount = masterFunder.mfFundAmount;
            var masterParticipation = (masterFundAmount * 1000000000n) / totalFunding;
            var masterMinAda = masterFunder.mfMinAda;
            var masterParticipationAda = (masterMinAda * 1000000000n) / totalMinAda;
            return [
                (masterParticipation * remaindFunds) / 1000000000n,
                (masterParticipationAda * totalMinAda) / 1000000000n
            ];
        }
    } else {
        return [0n, 0n];
    }
}
//---------------------------------------------------------------

export function getTotalFundAmount(eUTxO_With_PoolDatum: EUTxO) {

    const poolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;

    const total = poolDatum.pdMasterFunders.map(mf => mf.mfFundAmount).reduce((acc, val) => acc + val, 0n);

    return total;
}
//---------------------------------------------------------------

export function getFundAmount_In_EUTxO_With_FundDatum(eUTxO_With_FundDatum: EUTxO) {

    const fundDatum = eUTxO_With_FundDatum.datum as FundDatum;

    return fundDatum.fdFundAmount;
}
//---------------------------------------------------------------

export function getTotalStakedAmount(eUTxOs_With_UserDatum: EUTxO[]) {

    var total = 0n;

    for (var i = 0; i < eUTxOs_With_UserDatum.length; i += 1) {
        total += getStakedAmount_In_EUTxO_With_UserDatum(eUTxOs_With_UserDatum[i]);
    }

    return total;
}

//---------------------------------------------------------------

export function getStakedAmount_In_EUTxO_With_UserDatum(eUTxO_With_UserDatum: EUTxO) {

    const userDatum: UserDatum = eUTxO_With_UserDatum.datum as UserDatum;

    return userDatum.udInvest;
}
//---------------------------------------------------------------

export function getTotalAvailaibleFunds(eUTxOs_With_FundDatum: EUTxO[]) {
    var total: BIGINT = 0n;

    for (var i = 0; i < eUTxOs_With_FundDatum.length; i += 1) {
        const eUTxO = eUTxOs_With_FundDatum[i];

        total += getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxO);
    }

    return total;

}
//---------------------------------------------------------------

export function getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxO_With_FundDatum: EUTxO): BIGINT {
    const fundDatum: FundDatum = eUTxO_With_FundDatum.datum as FundDatum;
    return BigInt(fundDatum.fdFundAmount - fundDatum.fdCashedOut);
}

//---------------------------------------------------------------

export function getTotalRewardsToPay_In_EUTxOs_With_UserDatum(poolInfo: StakingPoolDBInterface, eUTxO_With_PoolDatum: EUTxO, eUTxOs_With_UserDatum: EUTxO[]) {
    var total: BIGINT = 0n;
    for (var i = 0; i < eUTxOs_With_UserDatum.length; i += 1) {
        const eUTxO = eUTxOs_With_UserDatum[i];
        total += getRewardsToPay_In_EUTxO_With_UserDatum(poolInfo, eUTxO_With_PoolDatum, eUTxO);
    }
    return total;
}

//---------------------------------------------------------------

export function getRewardsToPay_In_EUTxO_With_UserDatum(poolInfo: StakingPoolDBInterface, eUTxO_With_PoolDatum: EUTxO, eUTxO_With_UserDatum: EUTxO) {

    const poolDatum: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;
    const userDatum: UserDatum = eUTxO_With_UserDatum.datum as UserDatum;

    const closedAt = poolDatum.pdClosedAt.val;

    const claimAt: POSIXTime = BigInt(new Date().getTime());
    const rewards = getRewardsPerInvest(poolInfo, closedAt, poolInfo.pParams.ppInterestRates, userDatum.udLastClaimAt, claimAt, userDatum.udCreatedAt, userDatum.udInvest, userDatum.udRewardsNotClaimed);
    const totalNewRewards = rewards + userDatum.udRewardsNotClaimed;
    // const totalRewardsCashedOut = userDatum.udCashedOut;
    return totalNewRewards;
}

//----------------------------------------------------------

export function getTotalMastersMinAda_In_EUTxOs_With_UserDatum(poolInfo: StakingPoolDBInterface, eUTxO_With_PoolDatum: EUTxO) {
    const poolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;

    const total = poolDatum.pdMasterFunders.map(mf => mf.mfMinAda).reduce((acc, val) => acc + val, 0n);

    return total;
}

//----------------------------------------------------------

export function getTotalUsersMinAda_In_EUTxOs_With_UserDatum(poolInfo: StakingPoolDBInterface, eUTxOs_With_UserDatum: EUTxO[]) {
    var total: BIGINT = 0n;
    for (var i = 0; i < eUTxOs_With_UserDatum.length; i += 1) {
        const eUTxO = eUTxOs_With_UserDatum[i];
        const userDatum: UserDatum = eUTxO.datum as UserDatum;

        total += userDatum.udMinAda;
    }
    return total;
}


//---------------------------------------------------------------

export function getTotalUserRegistered(poolInfo: StakingPoolDBInterface, eUTxO_With_PoolDatum: EUTxO, eUTxOs_With_FundDatum: EUTxO[], eUTxOs_With_UserDatum: EUTxO[]) {

    const txID_GetBackInvest_CS = poolInfo.txID_User_Withdraw_CS;
    const txID_GetBackInvest_TN_Hex = strToHex(txID_User_Withdraw_TN);
    const txID_GetBackInvest_AC_Lucid = txID_GetBackInvest_CS + txID_GetBackInvest_TN_Hex;

    const txID_GetBackInvest_In_PoolDatum = sumTokensAmt_From_AC_Lucid(eUTxO_With_PoolDatum.uTxO.assets, txID_GetBackInvest_AC_Lucid);

    const assetsList_In_FundDatum = eUTxOs_With_FundDatum.map(eUTxO => eUTxO.uTxO.assets).reduce((acc: Assets[], val) => acc.concat(val), []);
    const assets_In_FundDatum = addAssetsList(assetsList_In_FundDatum);

    const txID_GetBackInvest_In_FundDatum = sumTokensAmt_From_AC_Lucid(assets_In_FundDatum, txID_GetBackInvest_AC_Lucid);

    const total = eUTxOs_With_UserDatum.length + Number(txID_GetBackInvest_In_PoolDatum) + Number(txID_GetBackInvest_In_FundDatum);

    return total;
}
//----------------------------------------------------------

export function getTotalUserActive(eUTxOs_With_UserDatum: EUTxO[]) {
    return eUTxOs_With_UserDatum.length;
}
//----------------------------------------------------------

export function getTotalCashedOut(eUTxO_With_PoolDatum: EUTxO, eUTxOs_With_FundDatum: EUTxO[]) {
    var total: BIGINT = 0n;

    const poolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;
    total += BigInt(poolDatum.pdTotalCashedOut);

    for (var i = 0; i < eUTxOs_With_FundDatum.length; i += 1) {
        const eUTxO = eUTxOs_With_FundDatum[i];
        const fundDatum = eUTxO.datum as FundDatum;
        total += BigInt(fundDatum.fdCashedOut);
    }
    return total;
}
//----------------------------------------------------------

export function getIfUserRegistered(pkh: PaymentKeyHash, eUTxOs_With_UserDatum: EUTxO[]) {
    var sw = false;
    eUTxOs_With_UserDatum.forEach((u: EUTxO) => {
        const userDatum: UserDatum = u.datum as UserDatum;
        if (userDatum.udUser === pkh) {
            sw = true;
        }
    });
    return sw;
}
//----------------------------------------------------------

export function getUserStaked(pkh: PaymentKeyHash, eUTxOs_With_UserDatum: EUTxO[]) {
    var total: BIGINT = 0n;
    eUTxOs_With_UserDatum.forEach((u: EUTxO) => {
        const userDatum: UserDatum = u.datum as UserDatum;
        if (userDatum.udUser === pkh)
            total += (userDatum.udInvest as BIGINT);
    });
    return total;
}
//----------------------------------------------------------

export function getUserRewardsPaid(pkh: PaymentKeyHash, eUTxOs_With_UserDatum: EUTxO[]) {
    var total: BIGINT = 0n;
    eUTxOs_With_UserDatum.forEach((u: EUTxO) => {
        const userDatum: UserDatum = u.datum as UserDatum;
        if (userDatum.udUser === pkh)
            total += (userDatum.udCashedOut as BIGINT);
    });
    return total;
}
//----------------------------------------------------------

export function getUserRewardsToPay(poolInfo: StakingPoolDBInterface, pkh: PaymentKeyHash, eUTxO_With_PoolDatum: EUTxO, eUTxOs_With_UserDatum: EUTxO[]) {

    const poolDatum: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;
    const closedAt = poolDatum.pdClosedAt.val;

    var total: BIGINT = 0n;
    eUTxOs_With_UserDatum.forEach((u: EUTxO) => {
        const userDatum: UserDatum = u.datum as UserDatum;
        if (userDatum.udUser === pkh) {
            const claimAt: POSIXTime = BigInt(new Date().getTime());
            const rewards = getRewardsPerInvest(poolInfo, closedAt, poolInfo.pParams.ppInterestRates, userDatum.udLastClaimAt, claimAt, userDatum.udCreatedAt, userDatum.udInvest, userDatum.udRewardsNotClaimed);
            const totalNewRewards = rewards + userDatum.udRewardsNotClaimed;
            // const totalRewardsCashedOut = userDatum.udCashedOut 
            total += totalNewRewards;

        }
    });
    return total;
}
//----------------------------------------------------------
