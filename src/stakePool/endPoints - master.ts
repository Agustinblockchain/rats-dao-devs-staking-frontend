//--------------------------------------
import { Address, Assets, UTxO } from 'lucid-cardano';
//--------------------------------------
import {
    AssetClass, EUTxO, FundDatum, Master, Master_Funder, Maybe, PoolDatum, POSIXTime,
    Redeemer_Burn_TxID,
    Redeemer_Master_AddScripts,
    Redeemer_Master_ClosePool, Redeemer_Master_DeleteFund, Redeemer_Master_Fund,
    Redeemer_Master_FundAndMerge, Redeemer_Master_SendBackDeposit, Redeemer_Master_SendBackFund, Redeemer_Master_SplitFund, Redeemer_Master_TerminatePool,
    Redeemer_Mint_TxID, ScriptDatum, UserDatum
} from '../types';
import {
    fundID_TN, maxDiffTokensForPoolAndFundDatum, poolDatum_NotTerminated, poolID_TN, scriptID_Master_AddScripts_TN, scriptID_Validator_TN, tokenNameLenght, txID_Master_AddScripts_TN, txID_Master_ClosePool_TN, txID_Master_DeleteFund_TN, txID_Master_FundAndMerge_TN, txID_Master_SendBackDeposit_TN, txID_Master_SendBackFund_TN, txID_Master_SplitFund_TN, txID_Master_TerminatePool_TN, userID_TN
} from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import {
    addAssets, addAssetsList, calculateMinAda, calculateMinAdaOfAssets, createValue_Adding_Tokens_Of_AC_Lucid, find_EUTxO_In_EUTxOs, find_TxOutRef_In_UTxOs, subsAssets, sumTokensAmt_From_AC_Lucid
} from '../utils/cardano-helpers';
import { makeTx_And_UpdateEUTxOsIsPreparing } from '../utils/cardano-helpersTx';
import { pubKeyHashToAddress } from "../utils/cardano-utils";
import { strToHex, toJson } from '../utils/utils';
import { Wallet } from '../utils/walletProvider';
import { apiGetEUTxOsDBByStakingPool } from './apis';
import {
    masterClosePoolTx, masterDeleteFundsTx, masterFundAndMergeTx, masterNewFundTx, masterPreparePoolTx, masterSendBackDepositTx, masterSendBackFundTx, masterSplitFundTx, masterTerminatePoolTx
} from './endPointsTx - master';
import { mkUpdated_FundDatum_With_NewFundAmountAndMerging, mkUpdated_FundDatum_With_SplitFund, mkUpdated_PoolDatum_With_ClosedAt, mkUpdated_PoolDatum_With_DeletingFunds, mkUpdated_PoolDatum_With_NewFund, mkUpdated_PoolDatum_With_NewFundAmountAndMerging, mkUpdated_PoolDatum_With_SendBackFund, mkUpdated_PoolDatum_With_SplitFundAmount, mkUpdated_PoolDatum_With_Terminated } from './helpersDatumsAndRedeemers';
import {
    getEUTxOs_With_FundDatum_InEUxTOList, getEUTxOs_With_UserDatum_InEUxTOList,
    getEUTxO_With_PoolDatum_InEUxTOList
} from './helpersEUTxOs';
import {
        getAvailaibleFunds_In_EUTxO_With_FundDatum, getFundAmountsRemains_ForMaster
} from "./helpersStakePool";

//--------------------------------------

export async function masterPreparePool(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Prepare Pool"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const poolID_CS = poolInfo.pParams.ppPoolID_CS;
    const poolID_TxOutRef = poolInfo.poolID_TxOutRef;
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const poolID_UTxO = find_TxOutRef_In_UTxOs(poolID_TxOutRef, uTxOsAtWallet);
    if (typeof poolID_UTxO == 'undefined') {
        throw "Can't find UTxO (" + toJson(poolID_TxOutRef) + ") for Mint PoolID";
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN)
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    // const scriptID_Validator_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Validator_TN)
    // const scriptID_Master_Fund_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_Fund_TN)
    // const scriptID_Master_FundAndMerge_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_FundAndMerge_TN)
    // const scriptID_Master_SplitFund_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_SplitFund_TN)
    // const scriptID_Master_ClosePool_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_ClosePool_TN)
    // const scriptID_Master_TerminatePool_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_TerminatePool_TN)
    // const scriptID_Master_DeleteFund_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_DeleteFund_TN)
    // const scriptID_Master_SendBackFund_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_SendBackFund_TN)
    // const scriptID_Master_SendBackDeposit_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_SendBackDeposit_TN)
    // const scriptID_Master_AddScripts_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_AddScripts_TN)
    // const scriptID_Master_DeleteScripts_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_Master_DeleteScripts_TN)
    // const scriptID_User_Deposit_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_User_Deposit_TN)
    // const scriptID_User_Harvest_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_User_Harvest_TN)
    // const scriptID_User_Withdraw_AC_Lucid =  txID_Master_AddScripts_CS + strToHex(scriptID_User_Withdraw_TN)
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 2n };
    const value_For_Each_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID_Validator: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Validator_TN)]: 1n };
    const value_For_Mint_ScriptID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_AddScripts_TN)]: 1n };
    //------------------
    const value_For_Mint_ScriptIDs = addAssetsList([value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID_Validator, value_For_Mint_ScriptID_Master_AddScripts])
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs))
    //------------------
    const value_For_ScriptDatum: Assets = addAssets(value_For_Mint_ScriptID_Validator, value_For_Each_TxID_Master_AddScripts)
    const value_For_Script_TxID_Master_AddScripts: Assets = addAssets(value_For_Mint_ScriptID_Master_AddScripts, value_For_Each_TxID_Master_AddScripts)
    //------------------
    const value_For_Mint_PoolID: Assets = { [poolID_CS + strToHex(poolID_TN)]: 1n };
    console.log(functionName + " - Value For Mint PoolID: " + toJson(value_For_Mint_PoolID))
    //------------------
    var value_For_PoolDatum: Assets = value_For_Mint_PoolID
    const minAda_For_PoolDatum_Normal = calculateMinAdaOfAssets(value_For_PoolDatum, true)
    const minAda_For_PoolDatum_ExtraTokens = calculateMinAda(maxDiffTokensForPoolAndFundDatum, maxDiffTokensForPoolAndFundDatum * tokenNameLenght, maxDiffTokensForPoolAndFundDatum, false)
    const minAda_For_PoolDatum = minAda_For_PoolDatum_Normal + minAda_For_PoolDatum_ExtraTokens
    const value_MinAda_For_PoolDatum: Assets = { lovelace: minAda_For_PoolDatum }
    value_For_PoolDatum = addAssets(value_MinAda_For_PoolDatum, value_For_PoolDatum);
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    const masterFunders: Master_Funder[] = []
    const fundCount = 0
    const totalCashedOut = 0n
    const isClosedAt = new Maybe<POSIXTime>()
    const isTerminated = poolDatum_NotTerminated
    const minAda = minAda_For_PoolDatum
    //------------------
    const poolDatum_Out = new PoolDatum(masterFunders, fundCount, totalCashedOut, isClosedAt, isTerminated, minAda);
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const scriptDatum = new ScriptDatum(master)
    const script_TxID_Master_AddScripts_Datum = scriptDatum
    //-----------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master)
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts)
    //------------------
   var tx_Binded = masterPreparePoolTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        poolDatum_Out, value_For_PoolDatum,
        poolID_UTxO, value_For_Mint_PoolID,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        scriptDatum, value_For_ScriptDatum,
        script_TxID_Master_AddScripts_Datum, value_For_Script_TxID_Master_AddScripts,
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterNewFund(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - New Fund"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS
    const fundID_TN_Hex = strToHex(fundID_TN)
    const fundID_AC: AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    // const fundID_AC_Lucid = fundID_CS+fundID_TN_Hex;
    //------------------
    // const harvest_CS = poolInfo.harvest_Lucid.slice(0,56)
    // const harvest_TN = poolInfo.harvest_Lucid.slice(56)
    // const harvest_AC_isAda = (harvest_CS=== 'lovelace')
    // const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_Fund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum
    if (!eUTxO_With_Script_TxID_Master_Fund_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master Fund'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master Fund': " + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    console.log(functionName + " - FundID AC: " + toJson(fundID_AC));
    //------------------
    const fundAmount = assets![poolInfo!.harvest_Lucid]
    const value_FundAmount = createValue_Adding_Tokens_Of_AC_Lucid(uTxOsAtWallet, poolInfo!.harvest_Lucid, fundAmount);
    // var fundAmount: Fund = sumTokensAmt_From_CS(assets, harvest_CS)
    // var value_FundAmount: Assets = getAssetsFromCS(assets, harvest_CS);
    console.log(functionName + " - Value Fund Amount: " + toJson(value_FundAmount))
    //------------------
    const value_For_Mint_FundID: Assets = { [fundID_AC.currencySymbol + fundID_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint FundID: " + toJson(value_For_Mint_FundID))
    //------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    const value_For_PoolDatum = value_In_PoolDatum
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    var value_For_FundDatum: Assets = addAssets(value_FundAmount, value_For_Mint_FundID);
    //------------------
    // el min ada del fund datum debe considerar los futuros tokens que va a contener.
    // todas las acciones que eliminen user datums, generan un token que no quiero regresar al usuarioo ni al master.
    const minAda_For_FundDatum_Normal = calculateMinAdaOfAssets(value_For_FundDatum, true)
    const minAda_For_FundDatum_ExtraTokens = calculateMinAda(maxDiffTokensForPoolAndFundDatum, tokenNameLenght * maxDiffTokensForPoolAndFundDatum, maxDiffTokensForPoolAndFundDatum, false)
    const minAda_For_FundDatum = minAda_For_FundDatum_Normal + minAda_For_FundDatum_ExtraTokens
    const value_MinAda_For_FundDatum: Assets = { lovelace: minAda_For_FundDatum }
    //------------------
    value_For_FundDatum = addAssets(value_For_FundDatum, value_MinAda_For_FundDatum);
    console.log(functionName + " - Value For FundDatum: " + toJson(value_For_FundDatum))
    //------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const poolDatum_Out = mkUpdated_PoolDatum_With_NewFund(poolDatum_In, master, fundAmount, minAda_For_FundDatum)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const cashedOut = 0n
    //------------------
    const fundDatum_Out = new FundDatum(fundAmount, cashedOut, minAda_For_FundDatum);
    console.log(functionName + " - FundDatum Out: " + toJson(fundDatum_Out))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_Fund(master, fundAmount, minAda_For_FundDatum)
    //-----------------
    const redeemer_For_Mint_FundID = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    //------------------
   var tx_Binded = masterNewFundTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_Fund_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        fundDatum_Out, value_For_FundDatum,
        redeemer_For_Mint_FundID, value_For_Mint_FundID
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)   
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterFundAndMerge(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Fund And Merge"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS
    const fundID_TN_Hex = strToHex(fundID_TN)
    // const fundID_AC : AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    // const harvest_CS = poolInfo.harvest_Lucid.slice(0,56)
    // const harvest_TN = poolInfo.harvest_Lucid.slice(56)
    // const harvest_AC_isAda = (harvest_CS=== 'lovelace')
    // const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
    //------------------
    const txID_Master_FundAndMerge_CS = poolInfo.txID_Master_FundAndMerge_CS
    const txID_Master_FundAndMerge_TN_Hex = strToHex(txID_Master_FundAndMerge_TN)
    const txID_Master_FundAndMerge_AC: AssetClass = { currencySymbol: txID_Master_FundAndMerge_CS, tokenName: txID_Master_FundAndMerge_TN_Hex };
    console.log(functionName + " - txID_Master_FundAndMerge_AC: " + toJson(txID_Master_FundAndMerge_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum
    if (!eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master FundAndMerge'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master FundAndMerge': " + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxOs_With_FundDatum) {
        throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
    }
    console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length)
    //------------------
    console.log(functionName + " - eUTxOs Selected - length: " + eUTxOs_Selected!.length)
    //------------------
    var eUTxOs_fundDatums_To_Merge: EUTxO[] = []
    for (let i = 0; i < eUTxOs_Selected!.length; i++) {
        const eUTxO = eUTxOs_Selected![i];
        if (find_EUTxO_In_EUTxOs(eUTxO, eUTxOs_With_FundDatum) !== undefined) {
            eUTxOs_fundDatums_To_Merge.push(eUTxO)
        }
    }
    if (eUTxOs_fundDatums_To_Merge.length == 0) {
        throw "Can't find any available UTxO with FundDatum at the choosen UTxOs, please wait for the next block and try again";
    }
    //------------------
    const fundAmount = assets![poolInfo!.harvest_Lucid]
    const value_FundAmount = createValue_Adding_Tokens_Of_AC_Lucid(uTxOsAtWallet, poolInfo!.harvest_Lucid, fundAmount);
    console.log(functionName + " - Value Fund Amount: " + toJson(value_FundAmount))
    //------------------
    const value_For_Mint_TxID_Master_FundAndMerge: Assets = { [txID_Master_FundAndMerge_AC.currencySymbol + txID_Master_FundAndMerge_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master Fund And Merge: " + toJson(value_For_Mint_TxID_Master_FundAndMerge))
    //------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    const value_For_PoolDatum = value_In_PoolDatum
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    var value_In_FundDatum_To_Merge: Assets = {}
    eUTxOs_fundDatums_To_Merge.map((eUTxO: EUTxO) => {
        value_In_FundDatum_To_Merge = addAssets(value_In_FundDatum_To_Merge, eUTxO.uTxO.assets);
    }
    )
    console.log(functionName + " - Value In FundDatum To Merge: " + toJson(value_In_FundDatum_To_Merge))
    //------------------
    var value_For_FundDatum: Assets = addAssetsList([value_FundAmount, value_In_FundDatum_To_Merge, value_For_Mint_TxID_Master_FundAndMerge]);
    console.log(functionName + " - Value For Fund Datum: " + toJson(value_For_FundDatum))
    //------------------
    // Actualizando PoolDatum con nuevo Fund
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const mergingCount = eUTxOs_fundDatums_To_Merge.length
    const poolDatum_Out = mkUpdated_PoolDatum_With_NewFundAmountAndMerging(poolDatum_In, master, fundAmount, mergingCount)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const uTxOs_fundDatums_To_Merge: UTxO[] = eUTxOs_fundDatums_To_Merge.map((eUTxO: EUTxO) => {
        console.log(functionName + " - uTxO FundDatum To Merge: " + eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex)
        return eUTxO.uTxO
    })
    //------------------
    const fundDatums_To_Merge: FundDatum[] = eUTxOs_fundDatums_To_Merge.map((eUTxO: EUTxO) => eUTxO.datum as FundDatum)
    //------------------
    fundDatums_To_Merge.map((fundDatum_To_Merge: FundDatum) => {
        console.log(functionName + " - FundDatum To Merge: " + toJson(fundDatum_To_Merge))
        // const fundDatum_To_Merge_PlutusData = objToPlutusData(fundDatum_To_Merge)
        // const fundDatum_To_Merge_Hex = showPtrInHex(fundDatum_To_Merge_PlutusData)
        // const fundDatum_To_Merge_Hash = C.hash_plutus_data(fundDatum_To_Merge_PlutusData)
        // console.log("fundAndMergePoolTx - fundDatum_To_Merge_Hex: " + toJson(fundDatum_To_Merge_Hex))
    }
    )
    //------------------
    const fundDatum_Out = mkUpdated_FundDatum_With_NewFundAmountAndMerging(fundDatums_To_Merge, fundAmount)
    console.log(functionName + " - FundDatum Out: " + toJson(fundDatum_Out))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_FundAndMerge(master, fundAmount)
    //-----------------
    const redeemer_For_Mint_TxID_Master_FundAndMerge = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    //------------------
   var tx_Binded = masterFundAndMergeTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_FundAndMerge_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        uTxOs_fundDatums_To_Merge, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        fundDatum_Out, value_For_FundDatum,
        redeemer_For_Mint_TxID_Master_FundAndMerge, value_For_Mint_TxID_Master_FundAndMerge
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
    for (let i = 0; i < eUTxOs_fundDatums_To_Merge.length; i++) {
        eUTxOs_for_consuming.push(eUTxOs_fundDatums_To_Merge[i]);
    } 
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterMergeFunds(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Merge Funds"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS
    const fundID_TN_Hex = strToHex(fundID_TN)
    // const fundID_AC : AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    // const harvest_CS = poolInfo.harvest_Lucid.slice(0,56)
    // const harvest_TN = poolInfo.harvest_Lucid.slice(56)
    // const harvest_AC_isAda = (harvest_CS=== 'lovelace')
    // const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
    //------------------
    const txID_Master_FundAndMerge_CS = poolInfo.txID_Master_FundAndMerge_CS
    const txID_Master_FundAndMerge_TN_Hex = strToHex(txID_Master_FundAndMerge_TN)
    const txID_Master_FundAndMerge_AC: AssetClass = { currencySymbol: txID_Master_FundAndMerge_CS, tokenName: txID_Master_FundAndMerge_TN_Hex };
    console.log(functionName + " - txID_Master_FundAndMerge_AC: " + toJson(txID_Master_FundAndMerge_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum
    if (!eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master FundAndMerge'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master FundAndMerge': " + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxOs_With_FundDatum) {
        throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
    }
    console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length)
    //------------------
    console.log(functionName + " - eUTxOs Selected - length: " + eUTxOs_Selected!.length)
    //------------------
    var eUTxOs_fundDatums_To_Merge: EUTxO[] = []
    for (let i = 0; i < eUTxOs_Selected!.length; i++) {
        const eUTxO = eUTxOs_Selected![i];
        if (find_EUTxO_In_EUTxOs(eUTxO, eUTxOs_With_FundDatum) !== undefined) {
            eUTxOs_fundDatums_To_Merge.push(eUTxO)
        }
    }
    if (eUTxOs_fundDatums_To_Merge.length == 0) {
        throw "Can't find any available UTxO with FundDatum at the choosen UTxOs, please wait for the next block and try again";
    }
    if (eUTxOs_fundDatums_To_Merge.length == 1) {
        throw "Can't merge less than two FundDatums";
    }
    //------------------
    const fundAmount = 0n
    const value_FundAmount = createValue_Adding_Tokens_Of_AC_Lucid(uTxOsAtWallet, poolInfo!.harvest_Lucid, fundAmount);
    console.log(functionName + " - Value Fund Amount: " + toJson(value_FundAmount))
    //------------------
    const value_For_Mint_TxID_Master_FundAndMerge: Assets = { [txID_Master_FundAndMerge_AC.currencySymbol + txID_Master_FundAndMerge_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master FundAndMerge: " + toJson(value_For_Mint_TxID_Master_FundAndMerge))
    //------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    const value_For_PoolDatum = value_In_PoolDatum
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    var value_In_FundDatum_To_Merge: Assets = {}
    eUTxOs_fundDatums_To_Merge.map((eUTxO: EUTxO) => {
        value_In_FundDatum_To_Merge = addAssets(value_In_FundDatum_To_Merge, eUTxO.uTxO.assets);
    }
    )
    console.log(functionName + " - Value In FundDatum To Merge: " + toJson(value_In_FundDatum_To_Merge))
    //------------------
    var value_For_FundDatum: Assets = addAssetsList([value_FundAmount, value_In_FundDatum_To_Merge, value_For_Mint_TxID_Master_FundAndMerge]);
    console.log(functionName + " - Value For FundDatum: " + toJson(value_For_FundDatum))
    //------------------
    // Actualizando PoolDatum con nuevo Fund
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const mergingCount = eUTxOs_fundDatums_To_Merge.length
    const poolDatum_Out = mkUpdated_PoolDatum_With_NewFundAmountAndMerging(poolDatum_In, master, fundAmount, mergingCount)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const uTxOs_fundDatums_To_Merge: UTxO[] = eUTxOs_fundDatums_To_Merge.map((eUTxO: EUTxO) => {
        console.log(functionName + " - uTxO FundDatum To Merge: " + eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex)
        return eUTxO.uTxO
    })
    //------------------
    const fundDatums_To_Merge: FundDatum[] = eUTxOs_fundDatums_To_Merge.map((eUTxO: EUTxO) => eUTxO.datum as FundDatum)
    //------------------
    fundDatums_To_Merge.map((fundDatum_To_Merge: FundDatum) => {
        console.log(functionName + " - FundDatum To Merge: " + toJson(fundDatum_To_Merge))
        // const fundDatum_To_Merge_PlutusData = objToPlutusData(fundDatum_To_Merge)
        // const fundDatum_To_Merge_Hex = showPtrInHex(fundDatum_To_Merge_PlutusData)
        // const fundDatum_To_Merge_Hash = C.hash_plutus_data(fundDatum_To_Merge_PlutusData)
        // console.log("fundAndMergePoolTx - fundDatum_To_Merge_Hex: " + toJson(fundDatum_To_Merge_Hex))
    }
    )
    //------------------
    const fundDatum_Out = mkUpdated_FundDatum_With_NewFundAmountAndMerging(fundDatums_To_Merge, fundAmount)
    console.log(functionName + " - FundDatum Out: " + toJson(fundDatum_Out))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_FundAndMerge(master, fundAmount)
    //-----------------
    const redeemer_For_Mint_TxID_Master_FundAndMerge = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    //------------------
   var tx_Binded = masterFundAndMergeTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_FundAndMerge_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        uTxOs_fundDatums_To_Merge, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        fundDatum_Out, value_For_FundDatum,
        redeemer_For_Mint_TxID_Master_FundAndMerge, value_For_Mint_TxID_Master_FundAndMerge
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
    for (let i = 0; i < eUTxOs_fundDatums_To_Merge.length; i++) {
        eUTxOs_for_consuming.push(eUTxOs_fundDatums_To_Merge[i]);
    } 
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterSplitFund(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Split Fund"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS
    const fundID_TN_Hex = strToHex(fundID_TN)
    const fundID_AC: AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    // const harvest_CS = poolInfo.harvest_Lucid.slice(0,56)
    // const harvest_TN = poolInfo.harvest_Lucid.slice(56)
    // const harvest_AC_isAda = (harvest_CS=== 'lovelace')
    // const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
    //------------------
    const txID_Master_SplitFund_CS = poolInfo.txID_Master_SplitFund_CS
    const txID_Master_SplitFund_TN_Hex = strToHex(txID_Master_SplitFund_TN)
    const txID_Master_SplitFund_AC: AssetClass = { currencySymbol: txID_Master_SplitFund_CS, tokenName: txID_Master_SplitFund_TN_Hex };
    console.log(functionName + " - txID_Master_SplitFund_AC: " + toJson(txID_Master_SplitFund_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_Fund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum
    if (!eUTxO_With_Script_TxID_Master_Fund_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master Fund'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master Fund': " + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_SplitFund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum
    if (!eUTxO_With_Script_TxID_Master_SplitFund_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master SplitFund'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master SplitFund': " + eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxOs_With_FundDatum) {
        throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
    }
    console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length)
    //------------------
    console.log(functionName + " - eUTxOs Selected - length: " + eUTxOs_Selected!.length)
    //------------------
    var eUTxOs_fundDatums_To_Split: EUTxO[] = []
    for (let i = 0; i < eUTxOs_Selected!.length; i++) {
        const eUTxO = eUTxOs_Selected![i];
        if (find_EUTxO_In_EUTxOs(eUTxO, eUTxOs_With_FundDatum) !== undefined) {
            eUTxOs_fundDatums_To_Split.push(eUTxO)
        }
    }
    if (eUTxOs_fundDatums_To_Split.length == 0) {
        throw "Can't find any available UTxO with FundDatum at the choosen UTxOs, please wait for the next block and try again";
    }
    if (eUTxOs_fundDatums_To_Split.length > 1) {
        throw "Can't split more than one FundDatum";
    }
    const eUTxO_fundDatum_To_Split = eUTxOs_fundDatums_To_Split[0]
    //------------------
    const splitFundAmount = assets![poolInfo!.harvest_Lucid]
    const maxFundAmount_To_Split = getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxO_fundDatum_To_Split)
    //---------------------
    if (splitFundAmount > maxFundAmount_To_Split) {
        throw "Wrong Split Fund Amount"
    }
    //------------------
    const value_For_Mint_FundID: Assets = { [fundID_AC.currencySymbol + fundID_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint FundID: " + toJson(value_For_Mint_FundID))
    //------------------
    const value_For_Mint_TxID_Master_SplitFund: Assets = { [txID_Master_SplitFund_AC.currencySymbol + txID_Master_SplitFund_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master Split Fund: " + toJson(value_For_Mint_TxID_Master_SplitFund))
    //------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    const value_For_PoolDatum = value_In_PoolDatum
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    const value_SplitFundAmount = createValue_Adding_Tokens_Of_AC_Lucid([eUTxO_fundDatum_To_Split.uTxO], poolInfo!.harvest_Lucid, splitFundAmount);
    console.log(functionName + " - Value Split Fund Amount: " + toJson(value_SplitFundAmount))
    //------------------
    var value_For_FundDatum_New = addAssetsList([value_SplitFundAmount, value_For_Mint_FundID, value_For_Mint_TxID_Master_SplitFund])
    const minAda_For_FundDatum_New_Normal = calculateMinAdaOfAssets(value_For_FundDatum_New, true)
    const minAda_For_FundDatum_New_ExtraTokens = calculateMinAda(maxDiffTokensForPoolAndFundDatum, (tokenNameLenght * maxDiffTokensForPoolAndFundDatum), maxDiffTokensForPoolAndFundDatum, false)
    const minAda_For_FundDatum_New = minAda_For_FundDatum_New_Normal + minAda_For_FundDatum_New_ExtraTokens
    const value_MinAda_For_FundDatum_New: Assets = { lovelace: minAda_For_FundDatum_New }
    value_For_FundDatum_New = addAssets(value_For_FundDatum_New, value_MinAda_For_FundDatum_New)
    console.log(functionName + " - Value For FundDatum New: " + toJson(value_For_FundDatum_New))
    //---------------------
    const value_In_FundDatum_To_Split = eUTxO_fundDatum_To_Split.uTxO.assets
    console.log(functionName + " - Value In FundDatum To Split: " + toJson(value_In_FundDatum_To_Split))
    const value_For_FundDatum_Split = subsAssets(value_In_FundDatum_To_Split, value_SplitFundAmount)
    console.log(functionName + " - Value For FundDatum Split: " + toJson(value_For_FundDatum_Split))
    //---------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const poolDatum_Out = mkUpdated_PoolDatum_With_SplitFundAmount(poolDatum_In, master, minAda_For_FundDatum_New)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const uTxO_fundDatums_To_Split: UTxO = eUTxO_fundDatum_To_Split.uTxO
    //------------------
    const fundDatum_To_Split = eUTxO_fundDatum_To_Split.datum as FundDatum
    console.log(functionName + " - FundDatum To Split: " + toJson(fundDatum_To_Split))
    //---------------------
    const fundDatum_Split = mkUpdated_FundDatum_With_SplitFund(fundDatum_To_Split, splitFundAmount)
    console.log(functionName + " - FundDatum Split Out: " + toJson(fundDatum_Split))
    //---------------------
    const cashedOut = 0n
    const fundDatum_New = new FundDatum(splitFundAmount, cashedOut, minAda_For_FundDatum_New);
    console.log(functionName + " - FundDatum New Out: " + toJson(fundDatum_New))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_SplitFund(master, splitFundAmount, minAda_For_FundDatum_New)
    //-----------------
    const redeemer_For_Mint_TxID_Master_SplitFund = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    const redeemer_For_Mint_Fund_ID = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    //------------------
   var tx_Binded = masterSplitFundTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_SplitFund_Datum,
        eUTxO_With_Script_TxID_Master_Fund_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        uTxO_fundDatums_To_Split, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        fundDatum_Split, value_For_FundDatum_Split,
        fundDatum_New, value_For_FundDatum_New,
        redeemer_For_Mint_TxID_Master_SplitFund, value_For_Mint_TxID_Master_SplitFund,
        redeemer_For_Mint_Fund_ID, value_For_Mint_FundID
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
    eUTxOs_for_consuming.push(eUTxO_fundDatum_To_Split);
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterClosePool(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Close Pool"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const txID_Master_ClosePool_CS = poolInfo.txID_Master_ClosePool_CS
    const txID_Master_ClosePool_TN_Hex = strToHex(txID_Master_ClosePool_TN)
    const txID_Master_ClosePool_AC: AssetClass = { currencySymbol: txID_Master_ClosePool_CS, tokenName: txID_Master_ClosePool_TN_Hex };
    console.log(functionName + " - txID_Master_ClosePool_AC: " + toJson(txID_Master_ClosePool_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_ClosePool_Datum = poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum
    if (!eUTxO_With_Script_TxID_Master_ClosePool_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master ClosePool'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master ClosePool': " + eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    const value_For_Mint_TxID_Master_ClosePool: Assets = { [txID_Master_ClosePool_AC.currencySymbol + txID_Master_ClosePool_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master ClosePool: " + toJson(value_For_Mint_TxID_Master_ClosePool))
    //------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    const value_For_PoolDatum = addAssets(value_In_PoolDatum, value_For_Mint_TxID_Master_ClosePool);
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    // Actualizando PoolDatum 
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const closetAt: POSIXTime = BigInt(new Date().getTime());
    const poolDatum_Out = mkUpdated_PoolDatum_With_ClosedAt(poolDatum_In, closetAt)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_ClosePool(master, closetAt)
    //-----------------
    const redeemer_For_Mint_TxID_Master_ClosePool = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    //------------------
   var tx_Binded = masterClosePoolTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_ClosePool_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        redeemer_For_Mint_TxID_Master_ClosePool, value_For_Mint_TxID_Master_ClosePool
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterTerminatePool(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Terminate Pool"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const txID_Master_TerminatePool_CS = poolInfo.txID_Master_TerminatePool_CS
    const txID_Master_TerminatePool_TN_Hex = strToHex(txID_Master_TerminatePool_TN)
    const txID_Master_TerminatePool_AC: AssetClass = { currencySymbol: txID_Master_TerminatePool_CS, tokenName: txID_Master_TerminatePool_TN_Hex };
    console.log(functionName + " - txID_Master_TerminatePool_AC: " + toJson(txID_Master_TerminatePool_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_TerminatePool_Datum = poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum
    if (!eUTxO_With_Script_TxID_Master_TerminatePool_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master TerminatePool'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master TerminatePool': " + eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    const value_For_Mint_TxID_Master_TerminatePool: Assets = { [txID_Master_TerminatePool_AC.currencySymbol + txID_Master_TerminatePool_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master TerminatePool: " + toJson(value_For_Mint_TxID_Master_TerminatePool))
    //------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    const value_For_PoolDatum = addAssets(value_In_PoolDatum, value_For_Mint_TxID_Master_TerminatePool);
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    // Actualizando PoolDatum con nuevo FundId
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const poolDatum_Out = mkUpdated_PoolDatum_With_Terminated(poolDatum_In)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_TerminatePool(master)
    //-----------------
    const redeemer_For_Mint_TxID_Master_TerminatePool = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    //------------------
   var tx_Binded = masterTerminatePoolTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_TerminatePool_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        redeemer_For_Mint_TxID_Master_TerminatePool, value_For_Mint_TxID_Master_TerminatePool
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterDeleteFunds(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Delete Funds"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS
    const fundID_TN_Hex = strToHex(fundID_TN)
    const fundID_AC: AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    const harvest_CS = poolInfo.harvest_Lucid.slice(0, 56)
    const harvest_TN = poolInfo.harvest_Lucid.slice(56)
    const harvest_AC_isAda = (harvest_CS === 'lovelace')
    const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
    //------------------
    const txID_Master_DeleteFund_CS = poolInfo.txID_Master_DeleteFund_CS
    const txID_Master_DeleteFund_TN_Hex = strToHex(txID_Master_DeleteFund_TN)
    const txID_Master_DeleteFund_AC: AssetClass = { currencySymbol: txID_Master_DeleteFund_CS, tokenName: txID_Master_DeleteFund_TN_Hex };
    console.log(functionName + " - txID_Master_DeleteFund_AC: " + toJson(txID_Master_DeleteFund_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_Fund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum
    if (!eUTxO_With_Script_TxID_Master_Fund_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master Fund'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master Fund': " + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_DeleteFund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum
    if (!eUTxO_With_Script_TxID_Master_DeleteFund_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master DeleteFund'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master DeleteFund': " + eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxOs_With_FundDatum) {
        throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
    }
    console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length)
    //------------------
    console.log(functionName + " - eUTxOs Selected - length: " + eUTxOs_Selected!.length)
    //------------------
    var eUTxOs_fundDatums_To_Delete: EUTxO[] = []
    for (let i = 0; i < eUTxOs_Selected!.length; i++) {
        const eUTxO = eUTxOs_Selected![i];
        if (find_EUTxO_In_EUTxOs(eUTxO, eUTxOs_With_FundDatum) !== undefined) {
            eUTxOs_fundDatums_To_Delete.push(eUTxO)
        }
    }
    if (eUTxOs_fundDatums_To_Delete.length == 0) {
        throw "Can't find any available UTxO with FundDatum at the choosen UTxOs, please wait for the next block and try again";
    }
    //------------------
    const value_For_Mint_TxID_Master_DeleteFund: Assets = { [txID_Master_DeleteFund_AC.currencySymbol + txID_Master_DeleteFund_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master DeleteFund: " + toJson(value_For_Mint_TxID_Master_DeleteFund))
    //------------------
    var value_In_FundDatum_To_Delete: Assets = {}
    eUTxOs_fundDatums_To_Delete.map((eUTxO: EUTxO) => {
        value_In_FundDatum_To_Delete = addAssets(value_In_FundDatum_To_Delete, eUTxO.uTxO.assets);
    }
    )
    console.log(functionName + " - Value In FundDatum To Delete: " + toJson(value_In_FundDatum_To_Delete))
    //------------------
    const fundDatums_To_Delete: FundDatum[] = eUTxOs_fundDatums_To_Delete.map((eUTxO: EUTxO) => eUTxO.datum as FundDatum)
    //------------------
    const fundIDs_To_Burn_Amount = sumTokensAmt_From_AC_Lucid(value_In_FundDatum_To_Delete, fundID_AC_Lucid)
    const value_For_Burn_FundIDs: Assets = { [fundID_AC.currencySymbol + fundID_AC.tokenName]: BigInt(-fundIDs_To_Burn_Amount) }
    console.log(functionName + " - Value For Burn FundIDs: " + toJson(value_For_Burn_FundIDs))
    //------------------
    const mergingCount = eUTxOs_fundDatums_To_Delete.length
    var mergingCashedOut = fundDatums_To_Delete.map(fundDatum => fundDatum.fdCashedOut).reduce((acc, val) => acc + val, 0n)
    //------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    var value_For_PoolDatum = addAssetsList([value_In_PoolDatum, value_In_FundDatum_To_Delete, value_For_Mint_TxID_Master_DeleteFund])
    value_For_PoolDatum = addAssets(value_For_PoolDatum, value_For_Burn_FundIDs)
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const poolDatum_Out = mkUpdated_PoolDatum_With_DeletingFunds(poolDatum_In, mergingCount, mergingCashedOut)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const uTxOs_fundDatums_To_Delete: UTxO[] = eUTxOs_fundDatums_To_Delete.map((eUTxO: EUTxO) => {
        console.log(functionName + " - uTxO FundDatum To Delete: " + eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex)
        return eUTxO.uTxO
    })
    //------------------
    fundDatums_To_Delete.map((fundDatum_To_Merge: FundDatum) => {
        console.log(functionName + " - FundDatum To Delete: " + toJson(fundDatum_To_Merge))
        // const fundDatum_To_Merge_PlutusData = objToPlutusData(fundDatum_To_Merge)
        // const fundDatum_To_Merge_Hex = showPtrInHex(fundDatum_To_Merge_PlutusData)
        // const fundDatum_To_Merge_Hash = C.hash_plutus_data(fundDatum_To_Merge_PlutusData)
        // console.log("fundAndMergePoolTx - fundDatum_To_Merge_Hex: " + toJson(fundDatum_To_Merge_Hex))
    }
    )
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_DeleteFund(master)
    //-----------------
    const redeemer_For_Mint_TxID_Master_DeleteFund = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    const redeemer_For_Burn_FundIDs = new Redeemer_Burn_TxID()
    //------------------
   var tx_Binded = masterDeleteFundsTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_DeleteFund_Datum,
        eUTxO_With_Script_TxID_Master_Fund_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        uTxOs_fundDatums_To_Delete, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        redeemer_For_Mint_TxID_Master_DeleteFund, value_For_Mint_TxID_Master_DeleteFund,
        redeemer_For_Burn_FundIDs, value_For_Burn_FundIDs
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
    for (let i = 0; i < eUTxOs_fundDatums_To_Delete.length; i++) {
        eUTxOs_for_consuming.push(eUTxOs_fundDatums_To_Delete[i]);
    }
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterGetBackFund(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Get Back Fund"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const masterToSendBack = master
    const masterToSendBackAddr = pubKeyHashToAddress(masterToSendBack!, process.env.NEXT_PUBLIC_USE_MAINNET === 'true' ? 1 : 0)
    console.log(functionName + " - Master To Send Back Addr: " + toJson(masterToSendBackAddr))
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS
    const fundID_TN_Hex = strToHex(fundID_TN)
    const fundID_AC: AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    const harvest_CS = poolInfo.harvest_Lucid.slice(0, 56)
    const harvest_TN = poolInfo.harvest_Lucid.slice(56)
    const harvest_AC_isAda = (harvest_CS === 'lovelace')
    // const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
    //------------------
    const txID_Master_SendBackFund_CS = poolInfo.txID_Master_SendBackFund_CS
    const txID_Master_SendBackFund_TN_Hex = strToHex(txID_Master_SendBackFund_TN)
    const txID_Master_SendBackFund_AC: AssetClass = { currencySymbol: txID_Master_SendBackFund_CS, tokenName: txID_Master_SendBackFund_TN_Hex };
    console.log(functionName + " - txID_Master_SendBackFund_AC: " + toJson(txID_Master_SendBackFund_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_SendBackFund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum
    if (!eUTxO_With_Script_TxID_Master_SendBackFund_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master Send Back Fund'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master Send Back Fund': " + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxOs_With_FundDatum) {
        throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
    }
    console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length)
    //------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    //------------------
    const [getBackFundAmount, getBackMinAdaAmount] = getFundAmountsRemains_ForMaster(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum, masterToSendBack)
    const value_For_GetBackFundAmount = createValue_Adding_Tokens_Of_AC_Lucid([eUTxO_With_PoolDatum.uTxO], poolInfo!.harvest_Lucid, getBackFundAmount);
    const value_For_GetBackMinAda: Assets = { lovelace: getBackMinAdaAmount }
    console.log(functionName + " - value For Get Back Fund: " + toJson(value_For_GetBackFundAmount))
    console.log(functionName + " - value For Get Back MinAda: " + toJson(value_For_GetBackMinAda))
    //------------------
    // TODO
    // if (getbackFundAmount === 0n ){
    //     throw "No hay fondos para recuperar.";
    // }
    //------------------
    const value_For_Mint_TxID_Master_SendBackFund: Assets = { [txID_Master_SendBackFund_AC.currencySymbol + txID_Master_SendBackFund_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master Send Back Fund: " + toJson(value_For_Mint_TxID_Master_SendBackFund))
    //------------------
    const value_For_GetBackFundPlusAda = addAssets(value_For_GetBackFundAmount, value_For_GetBackMinAda)
    //---------------------
    const value_For_SendBackFund_To_Master = value_For_GetBackFundPlusAda
    console.log(functionName + " - Value For Master Wallet: " + toJson(value_For_SendBackFund_To_Master))
    //---------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    var value_For_PoolDatum = addAssets(value_In_PoolDatum, value_For_Mint_TxID_Master_SendBackFund)
    value_For_PoolDatum = subsAssets(value_For_PoolDatum, value_For_SendBackFund_To_Master)
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    // Actualizando PoolDatum con nuevo FundId
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const poolDatum_Out = mkUpdated_PoolDatum_With_SendBackFund(poolDatum_In, masterToSendBack)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_SendBackFund(master, master)
    //-----------------
    const redeemer_For_Mint_TxID_Master_SendBackFund = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    //------------------
   var tx_Binded = masterSendBackFundTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_SendBackFund_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        masterToSendBackAddr, value_For_SendBackFund_To_Master,
        redeemer_For_Mint_TxID_Master_SendBackFund, value_For_Mint_TxID_Master_SendBackFund
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterSendBackFund(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets, master_Selected?: Master) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Get Back Fund"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const masterToSendBack = master_Selected
    const masterToSendBackAddr = pubKeyHashToAddress(masterToSendBack!, process.env.NEXT_PUBLIC_USE_MAINNET === 'true' ? 1 : 0)
    console.log(functionName + " - Master To Send Back Addr: " + toJson(masterToSendBackAddr))
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS
    const fundID_TN_Hex = strToHex(fundID_TN)
    const fundID_AC: AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    // const harvest_CS = poolInfo.harvest_Lucid.slice(0,56)
    // const harvest_TN = poolInfo.harvest_Lucid.slice(56)
    // const harvest_AC_isAda = (harvest_CS=== 'lovelace')
    // const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
    //------------------
    const txID_Master_SendBackFund_CS = poolInfo.txID_Master_SendBackFund_CS
    const txID_Master_SendBackFund_TN_Hex = strToHex(txID_Master_SendBackFund_TN)
    const txID_Master_SendBackFund_AC: AssetClass = { currencySymbol: txID_Master_SendBackFund_CS, tokenName: txID_Master_SendBackFund_TN_Hex };
    console.log(functionName + " - txID_Master_SendBackFund_AC: " + toJson(txID_Master_SendBackFund_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_SendBackFund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum
    if (!eUTxO_With_Script_TxID_Master_SendBackFund_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master Send Back Fund'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master Send Back Fund': " + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxOs_With_FundDatum) {
        throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
    }
    console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length)
    //------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    //------------------
    // if (chekIfAll_FundDatums_ArePresent (poolDatum_In, fundDatums_All)){
    //     throw "Necesito que todos los FundDatums válidos esten presentes";
    // }
    //------------------
    //calculate fund amount to get back
    const [getBackFundAmount, getBackMinAdaAmount] = getFundAmountsRemains_ForMaster(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum, master_Selected!)
    const value_For_GetBackFundAmount = createValue_Adding_Tokens_Of_AC_Lucid([eUTxO_With_PoolDatum.uTxO], poolInfo!.harvest_Lucid, getBackFundAmount);
    const value_For_GetBackMinAda: Assets = { lovelace: getBackMinAdaAmount }
    console.log(functionName + " - value For Get Back Fund Amount: " + toJson(value_For_GetBackFundAmount))
    console.log(functionName + " - value For Get Back MinAda: " + toJson(value_For_GetBackMinAda))
    //------------------
    // if (getbackFundAmount === 0n ){
    //     throw "No hay fondos para recuperar.";
    // }
    //------------------
    const value_For_Mint_TxID_Master_SendBackFund: Assets = { [txID_Master_SendBackFund_AC.currencySymbol + txID_Master_SendBackFund_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master Send Back Fund: " + toJson(value_For_Mint_TxID_Master_SendBackFund))
    //------------------
    const value_For_GetBackFundPlusAda = addAssets(value_For_GetBackFundAmount, value_For_GetBackMinAda)
    //---------------------
    const value_For_SendBackFund_To_Master = value_For_GetBackFundPlusAda
    console.log(functionName + " - Value For Master Wallet: " + toJson(value_For_SendBackFund_To_Master))
    //---------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum))
    var value_For_PoolDatum = addAssets(value_In_PoolDatum, value_For_Mint_TxID_Master_SendBackFund)
    value_For_PoolDatum = subsAssets(value_For_PoolDatum, value_For_SendBackFund_To_Master)
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum))
    //------------------
    // Actualizando PoolDatum con nuevo FundId
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    const poolDatum_Out = mkUpdated_PoolDatum_With_SendBackFund(poolDatum_In, master_Selected!)
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_SendBackFund(master, master_Selected!)
    //-----------------
    const redeemer_For_Mint_TxID_Master_SendBackFund = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    //------------------
   var tx_Binded = masterSendBackFundTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_Master_SendBackFund_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
        poolDatum_Out, value_For_PoolDatum,
        masterToSendBackAddr, value_For_SendBackFund_To_Master,
        redeemer_For_Mint_TxID_Master_SendBackFund, value_For_Mint_TxID_Master_SendBackFund
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterSendBackDeposit(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Send Back Deposit"
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    //------------------
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS
    const fundID_TN_Hex = strToHex(fundID_TN)
    // const fundID_AC : AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    const userID_CS = poolInfo.txID_User_Deposit_CS
    const userID_TN_Hex = strToHex(userID_TN)
    const userID_AC: AssetClass = { currencySymbol: userID_CS, tokenName: userID_TN_Hex };
    const userID_AC_Lucid = userID_CS + userID_TN_Hex;
    //------------------
    const staking_CS = poolInfo.staking_Lucid.slice(0, 56)
    const staking_TN = poolInfo.staking_Lucid.slice(56)
    const staking_AC_isAda = (staking_CS === 'lovelace')
    // const staking_AC_isWithoutTokenName = !staking_AC_isAda && staking_TN == ""
    //------------------
    const txID_Master_SendBackDeposit_CS = poolInfo.txID_Master_SendBackDeposit_CS
    const txID_Master_SendBackDeposit_TN_Hex = strToHex(txID_Master_SendBackDeposit_TN)
    const txID_Master_SendBackDeposit_AC: AssetClass = { currencySymbol: txID_Master_SendBackDeposit_CS, tokenName: txID_Master_SendBackDeposit_TN_Hex };
    console.log(functionName + " - txID_Master_SendBackDeposit_AC: " + toJson(txID_Master_SendBackDeposit_AC));
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!)
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum
    if (!eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master SendBackDeposit'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master SendBackDeposit': " + eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_Script_TxID_User_Deposit_Datum = poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum
    if (!eUTxO_With_Script_TxID_User_Deposit_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'User Deposit_Datum. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'User Deposit_Datum: " + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.outputIndex)
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
    //------------------
    // busco el utxo que tengan UserDatum validos
    const eUTxOs_With_UserDatum = getEUTxOs_With_UserDatum_InEUxTOList(userID_AC_Lucid, eUTxOs_With_Datum, true)
    if (!eUTxOs_With_UserDatum) {
        throw "Can't find any available UTxO with UserDatum, please wait for the next block and try again";
    }
    console.log(functionName + " - UTxOs with UserDatum that are not being consumed - length: " + eUTxOs_With_UserDatum.length)
    //------------------
    console.log(functionName + " - eUTxOs Selected - length: " + eUTxOs_Selected!.length)
    //------------------
    var eUTxOs_userDatums_To_SendBackDeposit: EUTxO[] = []
    for (let i = 0; i < eUTxOs_Selected!.length; i++) {
        const eUTxO = eUTxOs_Selected![i];
        if (find_EUTxO_In_EUTxOs(eUTxO, eUTxOs_With_UserDatum) !== undefined) {
            eUTxOs_userDatums_To_SendBackDeposit.push(eUTxO)
        }
    }
    if (eUTxOs_userDatums_To_SendBackDeposit.length == 0) {
        throw "Can't find any available UTxO with UserDatum at the choosen UTxOs, please wait for the next block and try again";
    }
    if (eUTxOs_userDatums_To_SendBackDeposit.length > 1) {
        throw "Can't Send Back Deposit to more than one UserDatum";
    }
    const eUTxO_userDatums_To_SendBackDeposit = eUTxOs_userDatums_To_SendBackDeposit[0]
    //------------------
    const userDatum_In: UserDatum = eUTxO_userDatums_To_SendBackDeposit.datum as UserDatum
    //------------------
    console.log(functionName + " - User to send Back Deposit: " + toJson(userDatum_In.udUser))
    const user_To_SendBack = userDatum_In.udUser
    const user_To_SendBackAddr = pubKeyHashToAddress(userDatum_In.udUser, process.env.NEXT_PUBLIC_USE_MAINNET === 'true' ? 1 : 0)
    console.log(functionName + " - User to send Back Deposit Addr: " + toJson(user_To_SendBackAddr))
    //------------------
    const value_In_UserDatum = eUTxO_userDatums_To_SendBackDeposit.uTxO.assets
    console.log(functionName + " - Value In UserDatum: " + toJson(value_In_UserDatum))
    //------------------
    const value_For_Mint_TxID_Master_SendBackDeposit: Assets = { [txID_Master_SendBackDeposit_AC.currencySymbol + txID_Master_SendBackDeposit_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master SendBackDeposit: " + toJson(value_For_Mint_TxID_Master_SendBackDeposit))
    //------------------
    const investAmount_In_UserDatum = userDatum_In.udInvest
    const minAda_In_UserDatum = userDatum_In.udMinAda
    const value_InvestAmount = createValue_Adding_Tokens_Of_AC_Lucid([eUTxO_userDatums_To_SendBackDeposit.uTxO], poolInfo!.staking_Lucid, investAmount_In_UserDatum);
    const value_MinAda_In_UserDatum: Assets = { lovelace: minAda_In_UserDatum }
    //------------------
    const value_InvestAmountPlusAda = addAssets(value_InvestAmount, value_MinAda_In_UserDatum)
    //------------------
    const value_For_SendBackDeposit_To_User = value_InvestAmountPlusAda
    console.log(functionName + " - Value For Send Back Deposit To User: " + toJson(value_For_SendBackDeposit_To_User))
    //------------------
    const value_For_Burn_UserID: Assets = { [userID_AC.currencySymbol + userID_AC.tokenName]: -1n }
    console.log(functionName + " - Value For Burn UserID: " + toJson(value_For_Burn_UserID))
    //------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In))
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_Master_SendBackDeposit(master, user_To_SendBack)
    //-----------------
    const redeemer_For_Mint_TxID_Master_SendBackDeposit = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum)
    const redeemer_Burn_UserID = new Redeemer_Burn_TxID()
    //------------------
    if (poolDatum_In.pdFundCount == 0) {
        const poolDatum_Out = poolDatum_In
        console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out))
        //------------------
        const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets
        console.log(functionName + " - value In PoolDatum: " + toJson(value_In_PoolDatum))
        var value_For_PoolDatum = addAssetsList([value_In_PoolDatum, value_For_Mint_TxID_Master_SendBackDeposit, value_In_UserDatum, value_For_Burn_UserID])
        value_For_PoolDatum = subsAssets(value_For_PoolDatum, value_For_SendBackDeposit_To_User)
        console.log(functionName + " - value For PoolDatum: " + toJson(value_For_PoolDatum))
        //------------------
       var tx_Binded = masterSendBackDepositTx.bind(functionName,
            lucid!, protocolParameters, poolInfo, masterAddr,
            eUTxO_With_ScriptDatum,
            eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum,
            eUTxO_With_Script_TxID_User_Deposit_Datum,
            eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
            undefined, undefined,
            eUTxO_userDatums_To_SendBackDeposit.uTxO, redeemer_For_Consuming_Validator_Datum,
            poolDatum_Out, value_For_PoolDatum,
            undefined, undefined,
            user_To_SendBackAddr, value_For_SendBackDeposit_To_User,
            redeemer_For_Mint_TxID_Master_SendBackDeposit, value_For_Mint_TxID_Master_SendBackDeposit,
            redeemer_Burn_UserID, value_For_Burn_UserID
        );
        //------------------
        var eUTxOs_for_consuming: EUTxO[] = [];
        eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)  
        eUTxOs_for_consuming.push(eUTxO_userDatums_To_SendBackDeposit)  
        //------------------
        const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
        return [txHash, eUTxOs_for_consuming_];
    } else {
        //------------------
        // busco el utxo que tengan FundDatum validos
        const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true)
        if (!eUTxOs_With_FundDatum) {
            throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
        }
        console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length)
        //------------------
        const eUTxO_With_FundDatum = eUTxOs_With_FundDatum[0]
        //------------------
        const fundDatum_In: FundDatum = eUTxO_With_FundDatum.datum as FundDatum
        console.log(functionName + " - FundDatum In: " + toJson(fundDatum_In))
        const fundDatum_Out = fundDatum_In
        console.log(functionName + " - FundDatum Out: " + toJson(fundDatum_Out))
        //------------------
        const value_In_FundDatum = eUTxO_With_FundDatum.uTxO.assets
        console.log(functionName + " - value In FundDatum: " + toJson(value_In_FundDatum))
        var value_For_FundDatum = addAssetsList([value_In_FundDatum, value_For_Mint_TxID_Master_SendBackDeposit, value_In_UserDatum, value_For_Burn_UserID])
        value_For_FundDatum = subsAssets(value_For_FundDatum, value_For_SendBackDeposit_To_User)
        console.log(functionName + " - value For FundDatum: " + toJson(value_For_FundDatum))
        //------------------
       var tx_Binded = masterSendBackDepositTx.bind(functionName,
            lucid!, protocolParameters, poolInfo, masterAddr,
            eUTxO_With_ScriptDatum,
            eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum,
            eUTxO_With_Script_TxID_User_Deposit_Datum,
            eUTxO_With_PoolDatum.uTxO, undefined,
            eUTxO_With_FundDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
            eUTxO_userDatums_To_SendBackDeposit.uTxO, redeemer_For_Consuming_Validator_Datum,
            undefined, undefined,
            fundDatum_Out, value_For_FundDatum,
            user_To_SendBackAddr, value_For_SendBackDeposit_To_User,
            redeemer_For_Mint_TxID_Master_SendBackDeposit, value_For_Mint_TxID_Master_SendBackDeposit,
            redeemer_Burn_UserID, value_For_Burn_UserID
        );
        //------------------
        var eUTxOs_for_consuming: EUTxO[] = [];
        eUTxOs_for_consuming.push(eUTxO_With_FundDatum)  
        eUTxOs_for_consuming.push(eUTxO_userDatums_To_SendBackDeposit)  
        //------------------
        const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming)
        return [txHash, eUTxOs_for_consuming_];
    }
}


