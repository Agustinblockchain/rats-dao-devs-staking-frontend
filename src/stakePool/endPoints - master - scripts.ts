import { Address, Assets, UTxO } from 'lucid-cardano';
import {
    AssetClass, EUTxO, PoolDatum, Redeemer_Burn_TxID,
    Redeemer_Master_AddScripts, Redeemer_Master_DeleteScripts, Redeemer_Mint_TxID, ScriptDatum
} from '../types';
import { poolID_TN, scriptID_Master_AddScripts_TN, scriptID_Master_ClosePool_TN, scriptID_Master_DeleteFund_TN, scriptID_Master_DeleteScripts_TN, scriptID_Master_FundAndMerge_TN, scriptID_Master_Fund_TN, scriptID_Master_SendBackDeposit_TN, scriptID_Master_SendBackFund_TN, scriptID_Master_SplitFund_TN, scriptID_Master_TerminatePool_TN, scriptID_User_Deposit_TN, scriptID_User_Harvest_TN, scriptID_User_Withdraw_TN, scriptID_Validator_TN, txID_Master_AddScripts_TN, txID_Master_DeleteScripts_TN } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { addAssets, addAssetsList, getAssetsFromCS, subsAssets } from '../utils/cardano-helpers';
import { makeTx_And_UpdateEUTxOsIsPreparing } from '../utils/cardano-helpersTx';
import { pubKeyHashToAddress } from "../utils/cardano-utils";
import { strToHex, toJson } from '../utils/utils';
import { Wallet } from '../utils/walletProvider';
import {
    masterAddScriptsMasterClosePoolTx, masterAddScriptsMasterDeleteFundTx, masterAddScriptsMasterDeleteScriptsTx, masterAddScriptsMasterFundAndMergeTx, masterAddScriptsMasterFundTx, masterAddScriptsMasterSendBackDepositTx, masterAddScriptsMasterSendBackFundTx, masterAddScriptsMasterSplitFundTx, masterAddScriptsMasterTerminatePoolTx, masterAddScriptsUserDepositTx, masterAddScriptsUserHarvestTx, masterAddScriptsUserWithdrawTx, masterDeleteScriptsTx
} from "./endPointsTx - master - scripts";
import { getEUTxO_With_PoolDatum_InEUxTOList, getEUTxO_With_ScriptDatum_InEUxTOList } from './helpersEUTxOs';
import { apiGetEUTxOsDBByStakingPool } from './apis';

//--------------------------------------

export async function masterAddScriptsMasterFund(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Fund";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_Fund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum;
    if (eUTxO_With_Script_TxID_Master_Fund_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_Fund_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_Fund_Datum = new ScriptDatum(master);
    //------------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterFundTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_Fund_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}
//--------------------------------------

export async function masterAddScriptsMasterFundAndMerge(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Fund And Merge";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum;
    if (eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_FundAndMerge_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_FundAndMerge_Datum = new ScriptDatum(master);
    //------------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterFundAndMergeTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_FundAndMerge_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}
//--------------------------------------

export async function masterAddScriptsMasterSplitFund(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Split Fund";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_SplitFund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum;
    if (eUTxO_With_Script_TxID_Master_SplitFund_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_SplitFund_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_SplitFund_Datum = new ScriptDatum(master);
    //------------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterSplitFundTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_SplitFund_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}
//--------------------------------------

export async function masterAddScriptsMasterClosePool(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Close Pool";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_ClosePool_Datum = poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum;
    if (eUTxO_With_Script_TxID_Master_ClosePool_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_ClosePool_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_ClosePool_Datum = new ScriptDatum(master);
    //------------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterClosePoolTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_ClosePool_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterAddScriptsMasterTerminatePool(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Terminate Pool";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_TerminatePool_Datum = poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum;
    if (eUTxO_With_Script_TxID_Master_TerminatePool_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_TerminatePool_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_TerminatePool_Datum = new ScriptDatum(master);
    //-----------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterTerminatePoolTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_TerminatePool_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterAddScriptsMasterDeleteFund(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Delete Fund";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_DeleteFund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum;
    if (eUTxO_With_Script_TxID_Master_DeleteFund_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_DeleteFund_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_DeleteFund_Datum = new ScriptDatum(master);
    //-----------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterDeleteFundTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_DeleteFund_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterAddScriptsMasterDeleteScripts(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Delete Scripts";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_DeleteScriptsDatum = poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum;
    if (eUTxO_With_Script_TxID_Master_DeleteScriptsDatum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_DeleteScripts_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_DeleteScripts_Datum = new ScriptDatum(master);
    //------------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterDeleteScriptsTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_DeleteScripts_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterAddScriptsMasterSendBackFund(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Send Back Fund";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_SendBackFund_Datum = poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum;
    if (eUTxO_With_Script_TxID_Master_SendBackFund_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_SendBackFund_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_SendBackFund_Datum = new ScriptDatum(master);
    //-----------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterSendBackFundTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_SendBackFund_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterAddScriptsMasterSendBackDeposit(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - Master Send Back Deposit";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum;
    if (eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_Master_SendBackDeposit_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_Master_SendBackDeposit_Datum = new ScriptDatum(master);
    //-----------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsMasterSendBackDepositTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_Master_SendBackDeposit_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterAddScriptsUserDeposit(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - User Deposit";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    console.log(functionName + " - uTxOsAtWallet: " + uTxOsAtWallet.length);
    console.log(functionName + " - uTxOsAtWallet: " + toJson(uTxOsAtWallet));
    //------------------
    const eUTxO_With_Script_TxID_User_Deposit_Datum = poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum;
    if (eUTxO_With_Script_TxID_User_Deposit_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_User_Deposit_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_User_Deposit_Datum = new ScriptDatum(master);
    //-----------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsUserDepositTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_User_Deposit_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterAddScriptsUserHarvest(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - User Harvest";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_User_Harvest_Datum = poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum;
    if (eUTxO_With_Script_TxID_User_Harvest_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_User_Harvest_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_User_Harvest_Datum = new ScriptDatum(master);
    //------------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsUserHarvestTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_User_Harvest_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterAddScriptsUserWithdraw(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Add Script - User Withdraw";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const eUTxO_With_Script_TxID_User_Withdraw_Datum = poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum;
    if (eUTxO_With_Script_TxID_User_Withdraw_Datum) {
        throw "The script is already added";
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const value_For_Mint_TxID_Master_AddScripts: Assets = { [txID_Master_AddScripts_AC.currencySymbol + txID_Master_AddScripts_AC.tokenName]: 1n };
    const value_For_Mint_ScriptID: Assets = { [txID_Master_AddScripts_AC.currencySymbol + strToHex(scriptID_User_Withdraw_TN)]: 1n };
    const value_For_Mint_ScriptIDs: Assets = addAssets(value_For_Mint_TxID_Master_AddScripts, value_For_Mint_ScriptID);
    console.log(functionName + " - Value For Mint ScriptIDs: " + toJson(value_For_Mint_ScriptIDs));
    //------------------
    const script_TxID_User_Withdraw_Datum = new ScriptDatum(master);
    //-----------------
    const redeemer_Master_AddScripts = new Redeemer_Master_AddScripts(master);
    const redeemer_For_Mint_ScriptIDs = new Redeemer_Mint_TxID(redeemer_Master_AddScripts);
    //------------------
   var tx_Binded = masterAddScriptsUserWithdrawTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        redeemer_For_Mint_ScriptIDs, value_For_Mint_ScriptIDs,
        script_TxID_User_Withdraw_Datum
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function masterDeleteScripts(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint Master - Delete Scripts";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS;
    const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN);
    const txID_Master_AddScripts_AC: AssetClass = { currencySymbol: txID_Master_AddScripts_CS, tokenName: txID_Master_AddScripts_TN_Hex };
    const txID_Master_AddScripts_AC_Lucid = txID_Master_AddScripts_CS + txID_Master_AddScripts_TN_Hex;
    console.log(functionName + " - txID_Master_AddScripts_AC: " + toJson(txID_Master_AddScripts_AC));
    //------------------
    const txID_Master_DeleteScripts_CS = poolInfo.txID_Master_DeleteScripts_CS;
    const txID_Master_DeleteScripts_TN_Hex = strToHex(txID_Master_DeleteScripts_TN);
    const txID_Master_DeleteScripts_AC: AssetClass = { currencySymbol: txID_Master_DeleteScripts_CS, tokenName: txID_Master_DeleteScripts_TN_Hex };
    console.log(functionName + " - txID_Master_DeleteScripts_AC: " + toJson(txID_Master_DeleteScripts_AC));
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!);
    //------------------
    if (eUTxOs_Selected === undefined || eUTxOs_Selected.length === 0) {
        throw 'No scripts found to remove';
    }
    var eUTxOsWithScripts: EUTxO[] = eUTxOs_Selected;
    eUTxOsWithScripts = eUTxOsWithScripts.slice(0, 1);
    //------------------
    eUTxOsWithScripts.forEach(eUTxO => {
        console.log(functionName + " - UTxO with Script to Delete: " + eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex);
    })
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum;
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_AddScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master AddScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_Script_TxID_Master_DeleteScripts_Datum = poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum;
    if (!eUTxO_With_Script_TxID_Master_DeleteScripts_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'Master DeleteScripts'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'Master DeleteScripts': " + eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true);
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex);
    //------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In));
    const poolDatum_Out = poolDatum_In;
    console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out));
    //------------------
    const value_For_Mint_TxID_Master_DeleteScripts: Assets = { [txID_Master_DeleteScripts_AC.currencySymbol + txID_Master_DeleteScripts_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID Master DeleteScripts: " + toJson(value_For_Mint_TxID_Master_DeleteScripts));
    //------------------
    const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets;
    console.log(functionName + " - Value In PoolDatum: " + toJson(value_In_PoolDatum));
    const value_For_PoolDatum = addAssets(value_In_PoolDatum, value_For_Mint_TxID_Master_DeleteScripts);
    console.log(functionName + " - Value For PoolDatum: " + toJson(value_For_PoolDatum));
    //------------------
    var value_For_Burn_ScriptIDs: Assets = {};
    //------------------
    const addrsAndValues_For_Masters: { addr: string; value: Assets; }[] = [];
    eUTxOsWithScripts.forEach(eUTxO => {
        const scriptDatum = eUTxO.datum as ScriptDatum;
        const master_In_ScriptDatum = scriptDatum.sdMaster;
        if (master_In_ScriptDatum !== undefined) {
            const master_To_Send_Back_Addr = pubKeyHashToAddress(master_In_ScriptDatum!, process.env.NEXT_PUBLIC_USE_MAINNET === 'true' ? 1 : 0);
            const value_In_ScriptDatum = eUTxO.uTxO.assets;
            const value_ScriptIDS = getAssetsFromCS(value_In_ScriptDatum, txID_Master_AddScripts_CS);
            const value_For_Burn_ScriptIDS: Assets = subsAssets({}, value_ScriptIDS);
            value_For_Burn_ScriptIDs = addAssets(value_For_Burn_ScriptIDs, value_For_Burn_ScriptIDS);
            const value_For_Master = addAssetsList([value_In_ScriptDatum, value_For_Burn_ScriptIDS]);
            addrsAndValues_For_Masters.push({ addr: master_To_Send_Back_Addr, value: value_For_Master });
            console.log(functionName + " - Value For Master: " + toJson(value_For_Master) + " - Addr: " + master_To_Send_Back_Addr);
        }
    });
    console.log(functionName + " - Value For Burn ScriptIDs: " + toJson(value_For_Burn_ScriptIDs));
    //------------------
    var uTxOsWithScripts: UTxO[] = [];
    eUTxOsWithScripts.forEach(eUTxO => {
        uTxOsWithScripts.push(eUTxO.uTxO);
    });
    //------------------
    const redeemer_For_Consuming_Scripts_Datum = new Redeemer_Master_DeleteScripts(master);
    const redeemer_For_Mint_TxID_Master_DeleteScripts = new Redeemer_Mint_TxID(redeemer_For_Consuming_Scripts_Datum);
    const redeemer_For_Burn_ScriptIDs = new Redeemer_Burn_TxID();
    //------------------
   var tx_Binded = masterDeleteScriptsTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, masterAddr,
        eUTxO_With_ScriptDatum, eUTxO_With_Script_TxID_Master_AddScripts_Datum, eUTxO_With_Script_TxID_Master_DeleteScripts_Datum,
        eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Scripts_Datum,
        uTxOsWithScripts, redeemer_For_Consuming_Scripts_Datum,
        poolDatum_Out, value_For_PoolDatum,
        addrsAndValues_For_Masters,
        redeemer_For_Mint_TxID_Master_DeleteScripts, value_For_Mint_TxID_Master_DeleteScripts,
        redeemer_For_Burn_ScriptIDs, value_For_Burn_ScriptIDs
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    eUTxOs_for_consuming.push(eUTxO_With_PoolDatum);
    for (let i = 0; i < eUTxOsWithScripts.length; i++) {
        eUTxOs_for_consuming.push(eUTxOsWithScripts[i]);
    }
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------