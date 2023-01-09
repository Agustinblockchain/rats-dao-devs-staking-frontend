import { C } from "lucid-cardano";
import {
    BIGINT, FundDatum, FundID_TN, Master, Master_Funder, Maybe, PoolDatum, POSIXTime, Redeemer_Burn_TxID, Redeemer_Master_AddScripts,
    Redeemer_Master_ClosePool, Redeemer_Master_DeleteFund, Redeemer_Master_DeleteScripts, Redeemer_Master_Fund, Redeemer_Master_FundAndMerge, Redeemer_Master_SendBackDeposit, Redeemer_Master_SendBackFund, Redeemer_Master_SplitFund, Redeemer_Master_TerminatePool, Redeemer_Mint_TxID, Redeemer_TxID, Redeemer_User_Deposit, Redeemer_User_Harvest, Redeemer_User_Withdraw, ScriptDatum, UserDatum, ValidatorRedeemer, Validator_Datum
} from "../types";
import { poolDatum_ClaimedFund, poolDatum_NotClaimedFund, poolDatum_Terminated } from "../types/constantes";
import { apiSaveDatumDB } from "./apis";
import { objToPlutusData } from "../utils/cardano-utils";
import { showPtrInHex, toJson } from "../utils/utils";

//----------------------------------------------------------------------

export function getDatumType(datum: any) {
    if (datum instanceof PoolDatum || PoolDatum.plutusDataIndex == datum.plutusDataIndex) return "PoolDatum";
    if (datum instanceof FundDatum || FundDatum.plutusDataIndex == datum.plutusDataIndex) return "FundDatum";
    if (datum instanceof UserDatum || UserDatum.plutusDataIndex == datum.plutusDataIndex) return "UserDatum";
    if (datum instanceof ScriptDatum || ScriptDatum.plutusDataIndex == datum.plutusDataIndex) return "ScriptDatum";
    return "Unknown";
}

//----------------------------------------------------------------------

export function isPoolDatum(datum: any) {
    //check if datum is an instance of PoolDatum
    if (datum instanceof PoolDatum) return true
}

//---------------------------------------------------------------

export function isFundDatum(datum: any) {
    //check if datum is an instance of FundDatum
    if (datum instanceof FundDatum) return true
}
//---------------------------------------------------------------

export function isUserDatum(datum: any) {
    //check if datum is an instance of UserDatum
    if (datum instanceof UserDatum) return true
}

//---------------------------------------------------------------

export function isScriptDatum(datum: any) {
    //check if datum is an instance of UserDatum
    if (datum instanceof ScriptDatum) return true
}

//---------------------------------------------------------------

export async function getHexFrom_Validator_Datum(datum: Validator_Datum, swPrint: boolean = true) {
    const plutusData = objToPlutusData(datum);
    const hex = showPtrInHex(plutusData);
    const hash = C.hash_plutus_data(plutusData);
    swPrint = false;
    if (swPrint) {
        var tipo = "";
        if (datum instanceof PoolDatum) { tipo = "PoolDatum"; }
        if (datum instanceof FundDatum) { tipo = "FundDatum"; }
        if (datum instanceof UserDatum) { tipo = "UserDatum"; }
        if (datum instanceof ScriptDatum) { tipo = "ScriptDatum"; }
        console.log("getHexFrom_Validator_Datum - " + tipo + " - Hex: " + toJson(hex));
        console.log("getHexFrom_Validator_Datum - " + tipo + " - Hash: " + showPtrInHex(hash));
    }
    await apiSaveDatumDB(showPtrInHex(hash), hex);
    return hex;
}
//---------------------------------------------------------------

export async function getHexFrom_Validator_Redeemer(redeemer: ValidatorRedeemer, swPrint: boolean = true) {
    const plutusData = objToPlutusData(redeemer);
    const hex = showPtrInHex(plutusData);
    const hash = C.hash_plutus_data(plutusData);
    swPrint = false;
    if (swPrint) {
        var tipo = "";
        if (redeemer instanceof Redeemer_Master_Fund) { tipo = "Redeemer_Master_Fund"; }
        if (redeemer instanceof Redeemer_Master_FundAndMerge) { tipo = "Redeemer_Master_FundAndMerge"; }
        if (redeemer instanceof Redeemer_Master_SplitFund) { tipo = "Redeemer_Master_SplitFund"; }
        if (redeemer instanceof Redeemer_Master_ClosePool) { tipo = "Redeemer_Master_ClosePool"; }
        if (redeemer instanceof Redeemer_Master_TerminatePool) { tipo = "Redeemer_Master_TerminatePool"; }
        if (redeemer instanceof Redeemer_Master_DeleteFund) { tipo = "Redeemer_Master_DeleteFund"; }
        if (redeemer instanceof Redeemer_Master_SendBackFund) { tipo = "Redeemer_Master_SendBackFund"; }
        if (redeemer instanceof Redeemer_Master_SendBackDeposit) { tipo = "Redeemer_Master_SendBackDeposit"; }
        if (redeemer instanceof Redeemer_Master_AddScripts) { tipo = "Redeemer_Master_AddScripts"; }
        if (redeemer instanceof Redeemer_Master_DeleteScripts) { tipo = "Redeemer_Master_DeleteScripts"; }
        if (redeemer instanceof Redeemer_User_Deposit) { tipo = "Redeemer_User_Deposit"; }
        if (redeemer instanceof Redeemer_User_Harvest) { tipo = "Redeemer_User_Harvest"; }
        if (redeemer instanceof Redeemer_User_Withdraw) { tipo = "Redeemer_User_Withdraw"; }

        console.log("getHexFrom_Validator_Redeemer - " + tipo + " - Hex: " + toJson(hex));
        console.log("getHexFrom_Validator_Redeemer - " + tipo + " - Hash: " + showPtrInHex(hash));
    }
    await apiSaveDatumDB(showPtrInHex(hash), hex);
    return hex;
}
// //---------------------------------------------------------------
// export async function getHexFrom_Redeemer_Mint_PoolID (redeemer: Redeemer_Mint_PoolID, swPrint : boolean = true) {
//     const plutusData = objToPlutusData(redeemer);
//     const hex = showPtrInHex(plutusData);
//     const hash = C.hash_plutus_data(plutusData);
//     if(swPrint){
//         var tipo = ""
//         if(redeemer instanceof Redeemer_Mint_PoolID ){ tipo = "Redeemer_Mint_PoolID" }
//         console.log("getHexFrom_Redeemer_Mint_PoolID - " + tipo + " - Hex: " + toJson(hex))
//         console.log("getHexFrom_Redeemer_Mint_PoolID - " + tipo + " - Hash: " + showPtrInHex(hash))
//     }
//     await apiSaveDatumDB(showPtrInHex(hash), hex);
//     return hex;
// }
//---------------------------------------------------------------

export async function getHexFrom_Redeemer_TxID(redeemer: Redeemer_TxID, swPrint: boolean = true) {
    const plutusData = objToPlutusData(redeemer);
    const hex = showPtrInHex(plutusData);
    const hash = C.hash_plutus_data(plutusData);
    swPrint = false;

    if (swPrint) {

        var tipo = "";
        if (redeemer instanceof Redeemer_Mint_TxID) {
            tipo = "Redeemer_Mint_TxID";

            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_Fund) { tipo += " - Redeemer_Master_Fund"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_FundAndMerge) { tipo += " - Redeemer_Master_FundAndMerge"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_SplitFund) { tipo += " - Redeemer_Master_SplitFund"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_ClosePool) { tipo += " - Redeemer_Master_ClosePool"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_TerminatePool) { tipo += " - Redeemer_Master_TerminatePool"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_DeleteFund) { tipo += " - Redeemer_Master_DeleteFund"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_SendBackFund) { tipo += " - Redeemer_Master_SendBackFund"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_SendBackDeposit) { tipo += " - Redeemer_Master_SendBackDeposit"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_AddScripts) { tipo += " - Redeemer_Master_AddScripts"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_Master_DeleteScripts) { tipo += " - Redeemer_Master_DeleteScripts"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_User_Deposit) { tipo += " - Redeemer_User_Deposit"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_User_Harvest) { tipo += " - Redeemer_User_Harvest"; }
            if (redeemer.mrValidatorRedeemer instanceof Redeemer_User_Withdraw) { tipo += " - Redeemer_User_Withdraw"; }
        }

        if (redeemer instanceof Redeemer_Burn_TxID) { tipo = "Redeemer_Burn_TxID"; }

        console.log("getHexFrom_Redeemer_TxID - " + tipo + " - Hex: " + toJson(hex));
        console.log("getHexFrom_Redeemer_TxID - " + tipo + " - Hash: " + showPtrInHex(hash));
    }
    await apiSaveDatumDB(showPtrInHex(hash), hex);
    return hex;
}

//---------------------------------------------------------------

export function mkUpdated_PoolDatum_With_NewFund(
    poolDatum: PoolDatum,
    master: FundID_TN,
    fundAmount: BIGINT,
    minAda: BIGINT
) {
    const masterFunders = poolDatum.pdMasterFunders
    const masterFunder_others = masterFunders.filter(x => x.mfMaster != master)
    const masterFunder_ToUpdate = masterFunders.find(x => x.mfMaster == master)
    var masterFundersNew: Master_Funder[] = []
    var masterFunderNew: Master_Funder
    if (masterFunder_ToUpdate !== undefined) {
        masterFunderNew = new Master_Funder(master, fundAmount + masterFunder_ToUpdate.mfFundAmount, masterFunder_ToUpdate.mfClaimedFund, minAda + masterFunder_ToUpdate.mfMinAda);
    } else {
        masterFunderNew = new Master_Funder(master, fundAmount, poolDatum_NotClaimedFund, minAda);
    }
    masterFundersNew = [masterFunderNew].concat(masterFunder_others)
    return new PoolDatum(
        masterFundersNew,
        Number(poolDatum.pdFundCount) + 1,
        poolDatum.pdTotalCashedOut,
        poolDatum.pdClosedAt,
        poolDatum.pdIsTerminated,
        poolDatum.pdMinAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_PoolDatum_With_NewFundAmountAndMerging(
    poolDatum: PoolDatum,
    master: FundID_TN,
    fundAmount: BIGINT,
    mergingCount: number,
) {
    const masterFunders = poolDatum.pdMasterFunders
    const masterFunder_others = masterFunders.filter(x => x.mfMaster != master)
    const masterFunder_ToUpdate = masterFunders.find(x => x.mfMaster == master)
    var masterFundersNew: Master_Funder[] = []
    var masterFunderNew: Master_Funder
    if (masterFunder_ToUpdate !== undefined) {
        masterFunderNew = new Master_Funder(master, fundAmount + masterFunder_ToUpdate.mfFundAmount, masterFunder_ToUpdate.mfClaimedFund, masterFunder_ToUpdate.mfMinAda);
    } else {
        masterFunderNew = new Master_Funder(master, fundAmount, poolDatum_NotClaimedFund, 0n);
    }
    masterFundersNew = [masterFunderNew].concat(masterFunder_others)

    return new PoolDatum(
        masterFundersNew,
        poolDatum.pdFundCount - mergingCount + 1,
        poolDatum.pdTotalCashedOut,
        poolDatum.pdClosedAt,
        poolDatum.pdIsTerminated,
        poolDatum.pdMinAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_PoolDatum_With_SplitFundAmount(
    poolDatum: PoolDatum,
    master: FundID_TN,
    minAda: BIGINT
) {
    const masterFunders = poolDatum.pdMasterFunders
    const masterFunder_others = masterFunders.filter(x => x.mfMaster != master)
    const masterFunder_ToUpdate = masterFunders.find(x => x.mfMaster == master)
    var masterFundersNew: Master_Funder[] = []
    var masterFunderNew: Master_Funder
    if (masterFunder_ToUpdate !== undefined) {
        masterFunderNew = new Master_Funder(master, masterFunder_ToUpdate.mfFundAmount, masterFunder_ToUpdate.mfClaimedFund, masterFunder_ToUpdate.mfMinAda + minAda);
    } else {
        masterFunderNew = new Master_Funder(master, 0n, poolDatum_NotClaimedFund, minAda);
    }
    masterFundersNew = [masterFunderNew].concat(masterFunder_others)

    return new PoolDatum(
        masterFundersNew,
        poolDatum.pdFundCount + 1,
        poolDatum.pdTotalCashedOut,
        poolDatum.pdClosedAt,
        poolDatum.pdIsTerminated,
        poolDatum.pdMinAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_PoolDatum_With_ClosedAt(poolDatum: PoolDatum, closetAt_: POSIXTime) {
    const closetAt: Maybe<POSIXTime> = new Maybe(closetAt_)
    return new PoolDatum(
        poolDatum.pdMasterFunders,
        poolDatum.pdFundCount,
        poolDatum.pdTotalCashedOut,
        closetAt,
        poolDatum.pdIsTerminated,
        poolDatum.pdMinAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_PoolDatum_With_Terminated(poolDatum: PoolDatum) {
    return new PoolDatum(
        poolDatum.pdMasterFunders,
        poolDatum.pdFundCount,
        poolDatum.pdTotalCashedOut,
        poolDatum.pdClosedAt,
        poolDatum_Terminated,
        poolDatum.pdMinAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_PoolDatum_With_DeletingFunds(poolDatum: PoolDatum, mergingCount: number, mergingCashedOut: BIGINT) {
    return new PoolDatum(
        poolDatum.pdMasterFunders,
        poolDatum.pdFundCount - mergingCount,
        poolDatum.pdTotalCashedOut + mergingCashedOut,
        poolDatum.pdClosedAt,
        poolDatum.pdIsTerminated,
        poolDatum.pdMinAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_PoolDatum_With_SendBackFund(poolDatum: PoolDatum, master: Master) {

    const masterFunders = poolDatum.pdMasterFunders
    const masterFunder_others = masterFunders.filter(x => x.mfMaster != master)
    const masterFunder_ToUpdate = masterFunders.find(x => x.mfMaster == master)
    var masterFundersNew: Master_Funder[] = []
    var masterFunderNew: Master_Funder
    if (masterFunder_ToUpdate !== undefined) {
        masterFunderNew = new Master_Funder(master, masterFunder_ToUpdate.mfFundAmount, poolDatum_ClaimedFund, masterFunder_ToUpdate.mfMinAda);
    } else {
        throw "MF"
    }
    masterFundersNew = [masterFunderNew].concat(masterFunder_others)

    return new PoolDatum(
        masterFundersNew,
        poolDatum.pdFundCount,
        poolDatum.pdTotalCashedOut,
        poolDatum.pdClosedAt,
        poolDatum.pdIsTerminated,
        poolDatum.pdMinAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_FundDatum_With_NewFundAmountAndMerging(fundDatums_To_Merge: FundDatum[], fundAmount: BIGINT) {
    const fundAmount_ = fundAmount + fundDatums_To_Merge.map(x => x.fdFundAmount).reduce((a, b) => a + b, 0n)
    const cashedout = fundDatums_To_Merge.map(x => x.fdCashedOut).reduce((a, b) => a + b, 0n)
    const minAda = fundDatums_To_Merge.map(x => x.fdMinAda).reduce((a, b) => a + b, 0n)
    return new FundDatum(
        fundAmount_,
        cashedout,
        minAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_FundDatum_With_NewClaimRewards(fundDatum: FundDatum, cashedout: BIGINT) {
    return new FundDatum(
        fundDatum.fdFundAmount,
        fundDatum.fdCashedOut + cashedout,
        fundDatum.fdMinAda
    )
}

//---------------------------------------------------------------

export function mkUpdated_FundDatum_With_SplitFund(fundDatum: FundDatum, splitFundAmount: BIGINT) {
    return new FundDatum(
        fundDatum.fdFundAmount - splitFundAmount,
        fundDatum.fdCashedOut,
        fundDatum.fdMinAda
    )
}

//---------------------------------------------------------------
