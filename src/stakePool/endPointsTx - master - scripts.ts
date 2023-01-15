import { Address, Assets, Lucid, UTxO } from 'lucid-cardano';
import { EUTxO, PoolDatum, Redeemer_Burn_TxID, Redeemer_Master_DeleteScripts, Redeemer_Mint_TxID, ScriptDatum } from '../types';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { createTx, fixTx } from '../utils/cardano-helpersTx';
import { getHexFrom_Redeemer_TxID, getHexFrom_Validator_Datum, getHexFrom_Validator_Redeemer } from "./helpersDatumsAndRedeemers";

//--------------------------------------


export async function masterAddScriptsMasterFundTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_Fund_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Fund";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_Fund_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_Fund_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_Fund_Datum_Hex,
            scriptRef: poolInfo.txID_Master_Fund_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsMasterFundAndMergeTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_FundAndMerge_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Fund And Merge";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_FundAndMerge_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_FundAndMerge_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_FundAndMerge_Datum_Hex,
            scriptRef: poolInfo.txID_Master_FundAndMerge_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsMasterSplitFundTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_SplitFund_Datum: ScriptDatum

) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Split Fund";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_SplitFund_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_SplitFund_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_SplitFund_Datum_Hex,
            scriptRef: poolInfo.txID_Master_SplitFund_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsMasterClosePoolTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_ClosePool_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Close Pool";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_ClosePool_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_ClosePool_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_ClosePool_Datum_Hex,
            scriptRef: poolInfo.txID_Master_ClosePool_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsMasterTerminatePoolTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_TerminatePool_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Terminate Pool";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_TerminatePool_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_TerminatePool_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_TerminatePool_Datum_Hex,
            scriptRef: poolInfo.txID_Master_TerminatePool_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsMasterDeleteFundTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_DeleteFund_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Delete Fund";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_DeleteFund_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_DeleteFund_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_DeleteFund_Datum_Hex,
            scriptRef: poolInfo.txID_Master_DeleteFund_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsMasterDeleteScriptsTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_DeleteScriptsDatum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Delete Scripts";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_DeleteScriptsDatum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_DeleteScriptsDatum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_DeleteScriptsDatum_Hex,
            scriptRef: poolInfo.txID_Master_DeleteScripts_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsMasterSendBackFundTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_SendBackFund_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Send Back Fund";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_SendBackFund_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_SendBackFund_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_SendBackFund_Datum_Hex,
            scriptRef: poolInfo.txID_Master_SendBackFund_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsMasterSendBackDepositTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_Master_SendBackDeposit_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - Master Send Back Deposit";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_Master_SendBackDeposit_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_Master_SendBackDeposit_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_Master_SendBackDeposit_Datum_Hex,
            scriptRef: poolInfo.txID_Master_SendBackDeposit_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterAddScriptsUserDepositTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_User_Deposit_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - User Deposit";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_User_Deposit_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_User_Deposit_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_User_Deposit_Datum_Hex,
            scriptRef: poolInfo.txID_User_Deposit_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//------------------

export async function masterAddScriptsUserHarvestTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_User_Harvest_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - User Harvest";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_User_Harvest_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_User_Harvest_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_User_Harvest_Datum_Hex,
            scriptRef: poolInfo.txID_User_Harvest_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//------------------

export async function masterAddScriptsUserWithdrawTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets,
    script_TxID_User_Withdraw_Datum: ScriptDatum
) {
    //------------------
    const functionName = "EndPoint Tx Master - Add Script - User Withdraw";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const script_TxID_User_Withdraw_Datum_Hex = await getHexFrom_Validator_Datum(script_TxID_User_Withdraw_Datum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex)

        .payToContract(scriptAddress, {
            inline: script_TxID_User_Withdraw_Datum_Hex,
            scriptRef: poolInfo.txID_User_Withdraw_Script,
        }, value_For_Mint_TxID_Master_AddScripts)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function masterDeleteScriptsTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined,
    eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
    eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_DeleteScripts,
    uTxOsWithScripts: UTxO[], redeemer_For_Consuming_Scripts_Datum: Redeemer_Master_DeleteScripts,
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    addrsAndValues_For_Masters_Wallets: { addr: string; value: Assets; }[],
    redeemer_For_Mint_TxID_Master_DeleteScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_DeleteScripts: Assets,
    redeemer_For_Burn_ScriptIDs: Redeemer_Burn_TxID, value_For_Burn_ScriptIDs: Assets
) {
    //------------------
    const functionName = "EndPoint Tx Master - Delete Scripts";
    //------------------
    console.log(functionName + " - init");
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum(poolDatum_Out, true);
    //------------------
    const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer(redeemer_For_Consuming_PoolDatum, true);
    const redeemer_For_Consuming_Scripts_Datum_Hex = await getHexFrom_Validator_Redeemer(redeemer_For_Consuming_Scripts_Datum, true);
    const redeemer_For_Mint_TxID_Master_DeleteScripts_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_Master_DeleteScripts, true);
    const redeemer_For_Burn_ScriptIDs_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Burn_ScriptIDs, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_ScriptDatum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_ScriptDatum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.script);
    }
    //------------------
    if (eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script);
    }
    //------------------
    if (eUTxO_With_Script_TxID_Master_DeleteScripts_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_Master_DeleteScripts_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_Master_DeleteScripts, redeemer_For_Mint_TxID_Master_DeleteScripts_Hex)
        .mintAssets(value_For_Burn_ScriptIDs, redeemer_For_Burn_ScriptIDs_Hex)
        .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex)
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum)
        .collectFrom(uTxOsWithScripts, redeemer_For_Consuming_Scripts_Datum_Hex);
    //------------------
    for (const addrAndValue_For_Masters_Wallets of addrsAndValues_For_Masters_Wallets) {
        tx_Building = await tx_Building
            .payToAddress(addrAndValue_For_Masters_Wallets.addr, addrAndValue_For_Masters_Wallets.value);
    }
    //------------------
    tx_Building = await tx_Building
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
