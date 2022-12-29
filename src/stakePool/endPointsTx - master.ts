//--------------------------------------
import { Address, Assets, Lucid, PaymentKeyHash, UTxO } from 'lucid-cardano';
//--------------------------------------
import {
    EUTxO, FundDatum, PoolDatum, Redeemer_Burn_TxID, Redeemer_Master_ClosePool,
    Redeemer_Master_DeleteFund, Redeemer_Master_Fund, Redeemer_Master_FundAndMerge, Redeemer_Master_SendBackDeposit, Redeemer_Master_SendBackFund, Redeemer_Master_SplitFund, Redeemer_Master_TerminatePool, Redeemer_Mint_TxID, ScriptDatum} from '../types';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { showPtrInHex } from '../utils/utils';
import { createTx, fixTx } from '../utils/cardano-helpersTx';
import { objToPlutusData } from "../utils/cardano-utils";
import { getHexFrom_Redeemer_TxID, getHexFrom_Validator_Datum, getHexFrom_Validator_Redeemer } from "./helpersDatums";
//--------------------------------------

export async function masterPreparePoolTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address,
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    poolID_UTxO: UTxO, value_For_Mint_PoolID: Assets,
    redeemer_For_Mint_TxID_Master_AddScripts: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_AddScripts: Assets ,
    scriptDatum : ScriptDatum, value_For_ScriptDatum : Assets ,
    script_TxID_Master_AddScripts_Datum: ScriptDatum, value_For_Script_TxID_Master_AddScripts: Assets 
) {
    //------------------
    const functionName = "Master Prepare Pool Tx"
    //------------------
    console.log(functionName + " - poolID_UTxO: " + poolID_UTxO.txHash + "#" + poolID_UTxO.outputIndex)
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const scriptDatum_Hex = await getHexFrom_Validator_Datum (scriptDatum, true);
    //------------------
    const script_TxID_Master_AddScripts_Datum_Hex = await getHexFrom_Validator_Datum (script_TxID_Master_AddScripts_Datum, true);
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
    //------------------
    // const redeemer_For_Mint_PoolID = new Redeemer_Mint_PoolID()
    const redeemer_For_Mint_PoolID = new Array() 
    // const redeemer_For_Mint_PoolID_Hex = getHexFrom_Redeemer_Mint_PoolID (redeemer_For_Mint_PoolID, true);
    //const redeemer_For_Mint_PoolID_Hex = Data.empty() //Data.to(new Construct (0, [])) // d87980 
    const plutusData = objToPlutusData(redeemer_For_Mint_PoolID);
    const redeemer_For_Mint_PoolID_Hex = showPtrInHex(plutusData);
    //------------------
    const redeemer_For_Mint_TxID_Master_AddScripts_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_TxID_Master_AddScripts, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    txComplete = await txComplete
        .collectFrom([poolID_UTxO])
        .attachMintingPolicy(poolInfo.poolID_Script)
        .attachMintingPolicy(poolInfo.txID_Master_AddScripts_Script) 
        .mintAssets(value_For_Mint_PoolID, redeemer_For_Mint_PoolID_Hex)
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex) 
        .mintAssets(value_For_Mint_TxID_Master_AddScripts, redeemer_For_Mint_TxID_Master_AddScripts_Hex) 
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum)
        .payToContract(scriptAddress, {
            inline: scriptDatum_Hex,
            scriptRef: poolInfo.script, 
        }, value_For_ScriptDatum)
        .payToContract(scriptAddress, {
            inline: script_TxID_Master_AddScripts_Datum_Hex,
            scriptRef: poolInfo.txID_Master_AddScripts_Script,
        }, value_For_Script_TxID_Master_AddScripts)
        .addSigner(addressWallet)
        // .validFrom(from)
        // .validTo(until)
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
    return txComplete_FIXED
}

//------------------

export async function masterNewFundTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_Master_Fund_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_Fund,  
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    fundDatum_Out: FundDatum, value_For_FundDatum: Assets,
    redeemer_For_Mint_FundID: Redeemer_Mint_TxID, value_For_Mint_FundID: Assets  
    ) {
    //------------------
    const functionName = "Master New Fund Tx"
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
    const fundDatum_Out_Hex = await getHexFrom_Validator_Datum (fundDatum_Out, true);
    //------------------
    const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_PoolDatum, true);
    const redeemer_For_Mint_FundID_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_FundID, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_ScriptDatum){
        txComplete = await txComplete.readFrom([eUTxO_With_ScriptDatum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.script) 
    }
    //------------------
    if (eUTxO_With_Script_TxID_Master_Fund_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_Fund_Script) 
    }
    //------------------
    txComplete = await txComplete
        .mintAssets(value_For_Mint_FundID, redeemer_For_Mint_FundID_Hex) 
        .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex) 
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum) 
        .payToContract(scriptAddress, { inline: fundDatum_Out_Hex }, value_For_FundDatum)
        .addSigner(addressWallet)
        // .validFrom(from)
        // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
    return txComplete_FIXED
    //------------------
    // //     .complete();
    // // return txComplete
    // //------------------
    // for (const task of txComplete.tasks) {
    //     await task();
    // }
    // const utxos = await lucid.wallet.getUtxosCore();
    // const changeAddress = C.Address.from_bech32(await lucid.wallet.address());
    // txComplete.txBuilder.add_inputs_from(utxos, changeAddress); 
    // txComplete.txBuilder.balance(changeAddress, undefined);
    // const transaction_NOT_READY_ONLY_FOR_SHOWING = txComplete.txBuilder.build_tx()
    // // console.log(functionName + " - Tx Complete before sing: " + toJson(txComplete.toObject()))
    // console.log(functionName + " - Tx Complete before evaluate:")
    // console.log(transaction_NOT_READY_ONLY_FOR_SHOWING.to_json())
    // const transaction = await txComplete.txBuilder.construct(utxos, changeAddress);
    // const body  = transaction.body()
    // const witness_set  = transaction.witness_set()
    // const auxiliary_data  = transaction.auxiliary_data()
    // const costModels = createCostModels(protocolParameters.costModels)
    // const transaction_to_bytes = transaction.to_bytes()
    // const transaction_NEW_VERISON = Transaction.from_bytes(transaction_to_bytes)
    // //const body_NEW_VERISON  = transaction_NEW_VERISON.body()
    // const witness_set_NEW_VERISON  = transaction_NEW_VERISON.witness_set()
    // //const auxiliary_data_NEW_VERISON  = transaction_NEW_VERISON.auxiliary_data()
    // const redeemers = witness_set_NEW_VERISON.redeemers()
    // const datums = witness_set_NEW_VERISON.plutus_data()
    // const costModels_NEW_VERISON = createCostModels_NEW_VERISON(protocolParameters.costModels)
    // const scriptHash = hash_script_data(redeemers!, costModels_NEW_VERISON, datums)
    // console.log(functionName + " - scriptHash: " + showPtrInHex(scriptHash))
    // //body.set_script_data_hash(scriptHash)
    // body.set_script_data_hash( C.ScriptDataHash.from_bytes(scriptHash.to_bytes()))
    // const transaction_FIXED = C.Transaction.new(body, witness_set, auxiliary_data)
    // return new TxComplete (lucid, transaction_FIXED)
    //------------------
    // const utxos = await lucid.wallet.getUtxosCore();
    // const changeAddress = C.Address.from_bech32(await lucid.wallet.address());
    // txComplete.txBuilder.add_inputs_from(utxos, changeAddress); 
    // txComplete.txBuilder.balance(changeAddress, undefined);
    //------------------
    // const transaction_Lucid_NoComplete = txComplete.txBuilder.build_tx()
    // console.log("newFund - Tx Lucid before calc witness_set:")
    // console.log(transaction_Lucid_NoComplete.to_json())
    // const txBody_Lucid  = transaction_Lucid_NoComplete.body()
    // const witness_set_Lucid  = transaction_Lucid_NoComplete.witness_set()
    // const auxiliary_data_Lucid  = transaction_Lucid_NoComplete.auxiliary_data()
    // //------------------
    // const transaction_NoComplete_to_bytes = transaction_Lucid_NoComplete.to_bytes()
    // //------------------
    // // esta linea calculan el witness_set con el blockfrost evaluate, como lo hace lucid en la version vasil
    // // const transaction_Complete = await txComplete.txBuilder.construct(utxos, changeAddress);
    // // const body  = transaction_Complete.body()
    // // const witness_set  = transaction_Complete.witness_set()
    // // const auxiliary_data  = transaction_Complete.auxiliary_data()
    // // const transaction_Complete_to_bytes = transaction_Complete.to_bytes()
    // //------------------
    // // voy a usar ahora la version de cardano multiplataform:
    // const transaction_NoComplete_Multiplataform = Transaction.from_bytes(transaction_NoComplete_to_bytes)
    // console.log("newFund - Tx Multiplataform before calc witness_set:")
    // console.log(transaction_NoComplete_Multiplataform.to_json())
    // //------------------
    // const privateKey = Bip32PrivateKey.generate_ed25519_bip32()
    // // const addDetails = lucid.utils.getAddressDetails(addressWallet)
    // // const address_bytes = addressWallet.to_bytes()
    // const address = AddressMultiplataform.from_bech32 (addressWallet)
    // const ad1 = address.to_json()
    // console.log("newFund - ad1: "+ ad1)
    // //---------------
    // const byronAddress = ByronAddress.from_address(address)
    // //---------------
    // // con esto supuestamente calculo witness_set
    // const txBody_Multiplataform  = transaction_NoComplete_Multiplataform.body()
    // const txHash_Multiplataform = hash_transaction(txBody_Multiplataform);
    // const witnesses_Multiplataform = TransactionWitnessSet.new();
    // const bootstrapWitnesses_Multiplataform = BootstrapWitnesses.new();
    // const bootstrapWitness_Multiplataform = make_icarus_bootstrap_witness(txHash_Multiplataform, byronAddress!, privateKey);
    // bootstrapWitnesses_Multiplataform.add(bootstrapWitness_Multiplataform);
    // witnesses_Multiplataform.set_bootstraps(bootstrapWitnesses_Multiplataform);
    // const transaction_Complete_Multiplataform = Transaction.new(
    //     txBody_Multiplataform,
    //     witnesses_Multiplataform,
    //     undefined, // transaction metadata
    // );
    // console.log("newFund - Tx Multiplataform before calc witness_set:")
    // console.log(transaction_NoComplete_Multiplataform.to_json())
    // const transaction_Complete_to_bytes = transaction_Complete_Multiplataform.to_bytes()
    // const transaction_Complete_Lucid = C.Transaction.from_bytes(transaction_Complete_to_bytes)    
    // return new TxComplete (lucid, transaction_Complete_Lucid)
    // //------------------
    // // si recivo una tx completa, hecha con lucid la paso a multiplataform 
    // // no hace falta si ya vengo de multiplataform... 
    // // const transaction_Complete_Multiplataform = Transaction.from_bytes(transaction_Complete_to_bytes)
    // //------------------
    // // Uso multiplataform para poder calcular correctamente Script Hash
    // // const body_Multiplataform  = transaction_Complete_Multiplataform.body()
    // const witness_set_Multiplataform  = transaction_Complete_Multiplataform.witness_set()
    // // const auxiliary_data_Multiplataform  = transaction_Complete_Multiplataform.auxiliary_data()
    // const redeemers = witness_set_Multiplataform.redeemers()
    // const datums = witness_set_Multiplataform.plutus_data()
    // const costModels_Multiplataform = createCostModels_Multiplataform(protocolParameters.costModels)
    // const scriptHash = hash_script_data(redeemers!, costModels_Multiplataform, datums)
    // console.log("newFund - scriptHash: " + showPtrInHex(scriptHash))
    // //------------------
    // txBody_Lucid.set_script_data_hash( C.ScriptDataHash.from_bytes(scriptHash.to_bytes()))
    // const transaction_Lucid_FIXED = C.Transaction.new(txBody_Lucid, witness_set_Lucid, auxiliary_data_Lucid)
    // return new TxComplete (lucid, transaction_Lucid_FIXED)
}   

//--------------------------------------

export async function masterFundAndMergeTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_FundAndMerge, 
    uTxOs_fundDatum_Outs_To_Merge: UTxO [], redeemer_For_Consuming_FundDatum: Redeemer_Master_FundAndMerge, 
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    fundDatum_Out : FundDatum, value_For_FundDatum: Assets,
    redeemer_For_Mint_TxID_Master_FundAndMerge: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_FundAndMerge: Assets
    ){
    //------------------
    const functionName = "Master Fund And Merge Tx"
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
    const fundDatum_Out_Hex = await getHexFrom_Validator_Datum (fundDatum_Out, true);fundDatum_Out
    //------------------
    const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_PoolDatum, true);
    const redeemer_For_Consuming_FundDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_FundDatum, true);
    const redeemer_For_Mint_TxID_Master_FundAndMerge_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_TxID_Master_FundAndMerge, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    // console.log(functionName + " - eUTxO_With_ScriptDatum: " + toJson(eUTxO_With_ScriptDatum))
    if (eUTxO_With_ScriptDatum){
        txComplete = await txComplete.readFrom([eUTxO_With_ScriptDatum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.script) 
    }
    //------------------
    // console.log(functionName + " - eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: " + toJson(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum))
    if (eUTxO_With_Script_TxID_Master_FundAndMerge_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_FundAndMerge_Script) 
    }
    //------------------
    txComplete = await txComplete
        .mintAssets(value_For_Mint_TxID_Master_FundAndMerge, redeemer_For_Mint_TxID_Master_FundAndMerge_Hex) 

        .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex) 
        .collectFrom(uTxOs_fundDatum_Outs_To_Merge, redeemer_For_Consuming_FundDatum_Hex) 
        
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum) 
        .payToContract(scriptAddress, { inline: fundDatum_Out_Hex }, value_For_FundDatum)

        .addSigner(addressWallet)
        // .validFrom(from)
        // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
    return txComplete_FIXED
}

//--------------------------------------

export async function masterSplitFundTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_Master_SplitFund_Datum: EUTxO | undefined,
    eUTxO_With_Script_TxID_Master_Fund_Datum: EUTxO | undefined, 
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_SplitFund, 
    uTxO_fundDatum_Outs_To_Split: UTxO, redeemer_For_Consuming_FundDatum: Redeemer_Master_SplitFund, 
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    fundDatum_Split_Out : FundDatum, value_For_FundDatum_Split: Assets,
    fundDatum_New_Out : FundDatum, value_For_FundDatum_New: Assets,
    redeemer_For_Mint_TxID_Master_SplitFund: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_SplitFund: Assets,
    redeemer_For_Mint_Fund_ID: Redeemer_Mint_TxID, value_For_Mint_FundID: Assets
    ){
    //------------------
    const functionName = "Master Split Fund Tx"
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
    const fundDatum_Split_Out_Hex = await getHexFrom_Validator_Datum (fundDatum_Split_Out, true);
    const fundDatum_New_Out_Hex = await getHexFrom_Validator_Datum (fundDatum_New_Out, true);
    //------------------
    const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_PoolDatum, true);
    const redeemer_For_Consuming_FundDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_FundDatum, true);
    const redeemer_For_Mint_TxID_Master_SplitFund_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_TxID_Master_SplitFund, true);
    const redeemer_For_Mint_FundID_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_Fund_ID, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    // console.log(functionName + " - eUTxO_With_ScriptDatum: " + toJson(eUTxO_With_ScriptDatum))
    if (eUTxO_With_ScriptDatum){
        txComplete = await txComplete.readFrom([eUTxO_With_ScriptDatum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.script) 
    }
    //------------------
    // console.log(functionName + " - eUTxO_With_Script_TxID_Master_SplitFund_Datum: " + toJson(eUTxO_With_Script_TxID_Master_SplitFund_Datum))
    if (eUTxO_With_Script_TxID_Master_SplitFund_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_SplitFund_Script) 
    }
    //------------------
    // console.log(functionName + " - eUTxO_With_Script_TxID_Master_Fund_Datum: " + toJson(eUTxO_With_Script_TxID_Master_Fund_Datum))
    if (eUTxO_With_Script_TxID_Master_Fund_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_Fund_Script) 
    }
    //------------------
    txComplete = await txComplete
        .mintAssets(value_For_Mint_TxID_Master_SplitFund, redeemer_For_Mint_TxID_Master_SplitFund_Hex) 
        .mintAssets(value_For_Mint_FundID, redeemer_For_Mint_FundID_Hex) 
        .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex) 
        .collectFrom([uTxO_fundDatum_Outs_To_Split], redeemer_For_Consuming_FundDatum_Hex) 
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum) 
        .payToContract(scriptAddress, { inline: fundDatum_Split_Out_Hex }, value_For_FundDatum_Split)
        .payToContract(scriptAddress, { inline: fundDatum_New_Out_Hex }, value_For_FundDatum_New)
        .addSigner(addressWallet)
        // .validFrom(from)
        // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
    return txComplete_FIXED
}

//--------------------------------------

export async function masterClosePoolTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_Master_ClosePool_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_ClosePool, 
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    redeemer_For_Mint_TxID_Master_ClosePool: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_ClosePool: Assets
    ){
    //------------------
    const functionName = "Master Close Pool Tx"
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
    //------------------
    const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_PoolDatum, true);
    const redeemer_For_Mint_TxID_Master_ClosePool_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_TxID_Master_ClosePool, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    // console.log(functionName + " - eUTxO_With_ScriptDatum: " + toJson(eUTxO_With_ScriptDatum))
    if (eUTxO_With_ScriptDatum){
        txComplete = await txComplete.readFrom([eUTxO_With_ScriptDatum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.script) 
    }
    //------------------
    // console.log(functionName + " - eUTxO_With_Script_TxID_Master_ClosePool_Datum: " + toJson(eUTxO_With_Script_TxID_Master_ClosePool_Datum))
    if (eUTxO_With_Script_TxID_Master_ClosePool_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_ClosePool_Script) 
    }
    //------------------
    txComplete = await txComplete
        .mintAssets(value_For_Mint_TxID_Master_ClosePool, redeemer_For_Mint_TxID_Master_ClosePool_Hex) 
        .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex) 
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum) 
        .addSigner(addressWallet)
        // .validFrom(from)
        // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
    return txComplete_FIXED
}

//--------------------------------------

export async function masterTerminatePoolTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_Master_TerminatePool_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_TerminatePool, 
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    redeemer_For_Mint_TxID_Master_TerminatePool: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_TerminatePool: Assets
    ){
    //------------------
    const functionName = "Master Terminate Pool Tx"
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
    //------------------
    const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_PoolDatum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_TerminatePool_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_TxID_Master_TerminatePool, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    // console.log(functionName + " - eUTxO_With_ScriptDatum: " + toJson(eUTxO_With_ScriptDatum))
    if (eUTxO_With_ScriptDatum){
        txComplete = await txComplete.readFrom([eUTxO_With_ScriptDatum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.script) 
    }
    //------------------
    // console.log(functionName + " - eUTxO_With_Script_TxID_Master_TerminatePool_Datum: " + toJson(eUTxO_With_Script_TxID_Master_TerminatePool_Datum))
    if (eUTxO_With_Script_TxID_Master_TerminatePool_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_TerminatePool_Script) 
    }
    //------------------
    txComplete = await txComplete
        .mintAssets(value_For_Mint_TxID_Master_TerminatePool, redeemer_For_Mint_TxID_Master_TerminatePool_Hex) 
        .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex) 
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum) 
        .addSigner(addressWallet)
        // .validFrom(from)
        // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
    return txComplete_FIXED
}

//--------------------------------------

export async function masterDeleteFundsTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_Master_DeleteFund_Datum: EUTxO | undefined,
    eUTxO_With_Script_TxID_Master_Fund_Datum: EUTxO | undefined, 
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_DeleteFund, 
    uTxOs_fundDatums_Outs_To_Delete: UTxO [], redeemer_For_Consuming_FundDatum: Redeemer_Master_DeleteFund, 
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    redeemer_For_Mint_TxID_Master_DeleteFund: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_DeleteFund: Assets,
    redeemer_For_Burn_FundIDs: Redeemer_Burn_TxID, value_For_Burn_FundIDs: Assets
    ){
    //------------------
    const functionName = "Master Delete Funds Tx"
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
    //------------------
    const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_PoolDatum, true);
    const redeemer_For_Consuming_FundDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_FundDatum, true);
    const redeemer_For_Mint_TxID_Master_DeleteFund_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_TxID_Master_DeleteFund, true);
    const redeemer_For_Burn_FundIDs_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Burn_FundIDs, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    // console.log(functionName + " - eUTxO_With_ScriptDatum: " + toJson(eUTxO_With_ScriptDatum))
    if (eUTxO_With_ScriptDatum){
        txComplete = await txComplete.readFrom([eUTxO_With_ScriptDatum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.script) 
    }
    //------------------
    // console.log(functionName + " - eUTxO_With_Script_TxID_Master_DeleteFund_Datum: " + toJson(eUTxO_With_Script_TxID_Master_DeleteFund_Datum))
    if (eUTxO_With_Script_TxID_Master_DeleteFund_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_DeleteFund_Script) 
    }
    //------------------
    // console.log(functionName + " - eUTxO_With_Script_TxID_Master_Fund_Datum: " + toJson(eUTxO_With_Script_TxID_Master_Fund_Datum))
    if (eUTxO_With_Script_TxID_Master_Fund_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_Fund_Script) 
    }
    //------------------
    txComplete = await txComplete
        .mintAssets(value_For_Mint_TxID_Master_DeleteFund, redeemer_For_Mint_TxID_Master_DeleteFund_Hex) 
        .mintAssets(value_For_Burn_FundIDs, redeemer_For_Burn_FundIDs_Hex) 
        .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex) 
        .collectFrom(uTxOs_fundDatums_Outs_To_Delete, redeemer_For_Consuming_FundDatum_Hex) 
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum) 
        .addSigner(addressWallet)
        // .validFrom(from)
        // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
    return txComplete_FIXED
}

//--------------------------------------

export async function masterSendBackFundTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address,  
    eUTxO_With_ScriptDatum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_Master_SendBackFund_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_SendBackFund, 
    poolDatum_Out: PoolDatum, value_For_PoolDatum: Assets,
    addressMasterWalletToSendBack: Address,  value_For_Master_WalletToSendBack: Assets,
    redeemer_For_Mint_TxID_Master_SendBackFund: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_SendBackFund: Assets
    ){
    //------------------
    const functionName = "Master Send Back Fund Tx"
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
    //------------------
    const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_PoolDatum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_SendBackFund_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_TxID_Master_SendBackFund, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    // console.log(functionName + " - eUTxO_With_ScriptDatum: " + toJson(eUTxO_With_ScriptDatum))
    if (eUTxO_With_ScriptDatum){
        txComplete = await txComplete.readFrom([eUTxO_With_ScriptDatum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.script) 
    }
    //------------------
    // console.log(functionName + " - eUTxO_With_Script_TxID_Master_SendBackFund_Datum: " + toJson(eUTxO_With_Script_TxID_Master_SendBackFund_Datum))
    if (eUTxO_With_Script_TxID_Master_SendBackFund_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_SendBackFund_Script) 
    }
    //------------------
    txComplete = await txComplete
        .mintAssets(value_For_Mint_TxID_Master_SendBackFund, redeemer_For_Mint_TxID_Master_SendBackFund_Hex) 
        .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex) 
        .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum) 
        .payToAddress(addressMasterWalletToSendBack, value_For_Master_WalletToSendBack)
        .addSigner(addressWallet)
        // .validFrom(from)
        // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
    return txComplete_FIXED
}

//--------------------------------------

export async function masterSendBackDepositTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, pkhf: PaymentKeyHash, addressWallet: Address, 
    eUTxO_With_ScriptDatum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: EUTxO | undefined, 
    eUTxO_With_Script_TxID_User_Deposit_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_Master_SendBackDeposit | undefined, 
    utxoAtScript_With_FundDatum: UTxO | undefined, redeemer_For_Consuming_FundDatum: Redeemer_Master_SendBackDeposit | undefined, 
    utxoAtScript_With_UserDatum: UTxO, redeemer_For_Consuming_UserDatum: Redeemer_Master_SendBackDeposit,
    poolDatum_Out: PoolDatum | undefined, value_For_PoolDatum: Assets | undefined,
    fundDatum_Out: FundDatum | undefined, value_For_FundDatum: Assets | undefined,
    userToSendBackAddr: Address, value_For_User_Wallet: Assets,
    redeemer_For_Mint_TxID_Master_SendBackDeposit: Redeemer_Mint_TxID, value_For_Mint_TxID_Master_SendBackDeposit: Assets, 
    redeemer_Burn_UserID: Redeemer_Burn_TxID, value_For_Burn_UserID: Assets
    ){
    //------------------
    const functionName = "Master Send Back Deposit Tx"
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress
    //------------------
    const redeemer_For_Consuming_UserDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_UserDatum, true);
    //------------------
    const redeemer_For_Mint_TxID_Master_SendBackDeposit_Hex = await getHexFrom_Redeemer_TxID (redeemer_For_Mint_TxID_Master_SendBackDeposit, true);
    const redeemer_Burn_UserID_Hex = await getHexFrom_Redeemer_TxID (redeemer_Burn_UserID, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx()
    var txComplete = createTx( lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_ScriptDatum){
        txComplete = await txComplete.readFrom([eUTxO_With_ScriptDatum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.script) 
    }
    //------------------
    if (eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_Master_SendBackDeposit_Script) 
    }
    //------------------
    if (eUTxO_With_Script_TxID_User_Deposit_Datum){
        txComplete = await txComplete.readFrom([eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO])
    }else{
        txComplete = await txComplete.attachMintingPolicy(poolInfo.txID_User_Deposit_Script) 
    }
    //------------------
    if (poolDatum_Out !== undefined){
        const poolDatum_Out_Hex = await getHexFrom_Validator_Datum (poolDatum_Out, true);
        const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_PoolDatum!, true);
        txComplete = await txComplete
            .mintAssets(value_For_Mint_TxID_Master_SendBackDeposit, redeemer_For_Mint_TxID_Master_SendBackDeposit_Hex) 
            .mintAssets(value_For_Burn_UserID, redeemer_Burn_UserID_Hex)
            .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex) 
            .collectFrom([utxoAtScript_With_UserDatum], redeemer_For_Consuming_UserDatum_Hex) 
            .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum) 
            .payToAddress(userToSendBackAddr, value_For_User_Wallet)
            .addSigner(addressWallet)
            // .validFrom(from)
            // .validTo(until) 
        //------------------
        const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
        return txComplete_FIXED
    }else{
        //------------------
        // console.log(functionName + " - fundDatum_Out: " + toJson(fundDatum_Out))
        const fundDatum_Out_Hex = await getHexFrom_Validator_Datum (fundDatum_Out!, true);
        //------------------
        // console.log(functionName + " - redeemer_For_Consuming_FundDatum: " + toJson(redeemer_For_Consuming_FundDatum))
        const redeemer_For_Consuming_FundDatum_Hex = await getHexFrom_Validator_Redeemer (redeemer_For_Consuming_FundDatum!, true);
        txComplete = await txComplete
            .mintAssets(value_For_Mint_TxID_Master_SendBackDeposit, redeemer_For_Mint_TxID_Master_SendBackDeposit_Hex) 
            .mintAssets(value_For_Burn_UserID, redeemer_Burn_UserID_Hex)
            .readFrom([utxoAtScript_With_PoolDatum])
            .collectFrom([utxoAtScript_With_FundDatum], redeemer_For_Consuming_FundDatum_Hex) 
            .collectFrom([utxoAtScript_With_UserDatum], redeemer_For_Consuming_UserDatum_Hex) 
            .payToContract(scriptAddress, { inline: fundDatum_Out_Hex }, value_For_FundDatum) 
            .payToAddress(userToSendBackAddr, value_For_User_Wallet)
            .addSigner(addressWallet)
            // .validFrom(from)
            // .validTo(until) 
        //------------------
        const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters)
        return txComplete_FIXED
    }
}


