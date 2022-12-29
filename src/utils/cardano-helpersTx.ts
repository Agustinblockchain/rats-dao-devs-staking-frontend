//----------------------------------------------------------------------

import { C, createCostModels, Lucid, TxComplete, TxSigned } from "lucid-cardano";

import { BigNum, Costmdls, CostModel, hash_script_data, Int, Language, Transaction } from "@dcspark/cardano-multiplatform-lib-browser";
import { isPreparingTime, maxTxExMem, maxTxExSteps, maxTxSize, TIME_OUT_TRY_TX, validTimeRangeInSlots } from "../types/constantes";
import { showPtrInHex, toJson } from "./utils";
import { Wallet } from "./walletProvider";
import { EUTxO, Maybe, POSIXTime } from "../types";
import { apiDeleteEUTxODB, apiUpdateEUTxODB } from "./cardano-helpers";
import { objToPlutusData } from "./cardano-utils";

//---------------------------------------------------------------

export const saveTxCompleteToFile = async (txComplete: TxComplete) => {

    const cbor = Buffer.from(
        txComplete.txComplete.to_bytes()
    ).toString('hex')

    const myData = {
        "type": "Tx BabbageEra",
        "description": "",
        "cborHex": cbor
    }

    const fileName = "tx";
    const json = JSON.stringify(myData);
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".signed";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

//---------------------------------------------------------------

export const saveTxSignedToFile = async (txSigned: TxSigned) => {

    const cbor = Buffer.from(
        txSigned.txSigned.to_bytes()
    ).toString('hex')

    const myData = {
        "type": "Tx BabbageEra",
        "description": "",
        "cborHex": cbor
    }

    const fileName = "tx";
    const json = JSON.stringify(myData);
    const blob = new Blob([json], { type: 'application/json' });
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".signed";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

//---------------------------------------------------------------

export function createCostModels_NEW_VERISON(costModels: any) {
    const costmdls = Costmdls.new();
    //add plutus v2
    const costmdlV2 = CostModel.empty_model(Language.new_plutus_v2());
    Object.values(costModels.PlutusV2 || []).forEach((cost: any, index) => {
        costmdlV2.set(index, Int.new(BigNum.from_str(cost.toString())));
    });
    costmdls.insert(costmdlV2);
    return costmdls;
}

//---------------------------------------------------------------

export function createTx(lucid: Lucid, protocolParameters: any, tx: any) {
    //---------------------------------------------
    // console.log("createTx - minFeeA", protocolParameters.minFeeA)
    // console.log("createTx - minFeeB", protocolParameters.minFeeB)
    //---------------------------------------------
    const minFeeA = Math.floor(protocolParameters.minFeeA * 1.1);
    const minFeeB = Math.floor(protocolParameters.minFeeB * 1.1);
    const nimFeeA_ = C.BigNum.from_str((minFeeA.toString()));
    const nimFeeB_ = C.BigNum.from_str((minFeeB.toString()));
    //---------------------------------------------
    // const linearFee = CardanoWasm.LinearFee.new(
    //     CardanoWasm.BigNum.from_str('44'),
    //     CardanoWasm.BigNum.from_str('155381')
    // );

    //---------------------------------------------
    //const costModels = createCostModels(protocolParameters.costModels)
    //---------------------------------------------
    const txBuilderConfig = C.TransactionBuilderConfigBuilder.new()
        .coins_per_utxo_byte(C.BigNum.from_str(protocolParameters.coinsPerUtxoByte.toString()))
        .fee_algo(C.LinearFee.new(nimFeeA_, nimFeeB_))
        .key_deposit(C.BigNum.from_str(protocolParameters.keyDeposit.toString()))
        .pool_deposit(C.BigNum.from_str(protocolParameters.poolDeposit.toString()))
        .max_tx_size(protocolParameters.maxTxSize)
        .max_value_size(protocolParameters.maxValSize)
        .collateral_percentage(protocolParameters.collateralPercentage)
        .max_collateral_inputs(protocolParameters.maxCollateralInputs)
        .ex_unit_prices(C.ExUnitPrices.from_float(protocolParameters.priceMem, protocolParameters.priceStep))
        .blockfrost(
            // Provider needs to be blockfrost in this case. Maybe we have better/more ways in the future to evaluate ex units
            C.Blockfrost.new(lucid.provider.data.url + "/utils/txs/evaluate", lucid.provider.data.projectId))
        .costmdls(createCostModels(protocolParameters.costModels))
        .build();
    //---------------------------------------------
    tx.txBuilder = C.TransactionBuilder.new(txBuilderConfig);
    return tx;
}

//---------------------------------------------------------------

export async function makeTx_And_UpdateEUTxOsIsPreparing(functionName: string, wallet: Wallet, protocolParameters: any, tx: Promise<TxComplete>, eUTxO_for_consuming: EUTxO[]): Promise<string> {
    async function clearIsPreparing (){
        console.log ("makeTx_And_UpdateEUTxOsIsPreparing - clearIsPreparing")
        for (let i = 0; i < eUTxO_for_consuming.length; i++) {
            eUTxO_for_consuming[i].isPreparing = new Maybe<POSIXTime>();
            await apiUpdateEUTxODB(eUTxO_for_consuming[i]);
        }
    }
    try {
        //------------------
        const now = new Date()
        //------------------
        for (let i = 0; i < eUTxO_for_consuming.length; i++) {
            eUTxO_for_consuming[i].isPreparing = new Maybe<POSIXTime>(BigInt(now.getTime()));
            await apiUpdateEUTxODB(eUTxO_for_consuming[i]);
        }
        //------------------
        const timeOut = setTimeout(clearIsPreparing, isPreparingTime);
        //------------------
        var txHash = await makeTx(functionName, wallet, protocolParameters, tx);
        return txHash;
    } catch (error) {
        clearIsPreparing()
        console.error(functionName + " - Error: " + error);
        throw error;
    }
}
    
//---------------------------------------------------------------


export async function makeTx(functionName: string, wallet: Wallet, protocolParameters: any, tx: Promise<TxComplete>): Promise<string> {
    //------------------
    const lucid = wallet.lucid;
    //------------------
    var txComplete: TxComplete
    //------------------
    var count = 0;
    var maxTries = 5;
    while (true) {
        try {
            console.log(functionName + " - try (" + count + ") Tx")
            txComplete = await tx;
            break;
        } catch (error: any) {
            console.error(functionName + " - Error Tx: " + error)
            if (++count == maxTries || error !== null) {
                throw error;
            }
            await new Promise(r => setTimeout(r, TIME_OUT_TRY_TX));
        }
    }
    //------------------
    // console.log(functionName + " - Tx Complete:")
    // console.log(txComplete.txComplete.to_json())
    // console.log(functionName + " - Tx Complete Hex:")
    // console.log(txComplete.toString())
    console.log(functionName + " - Tx Complete Resources:")
    const txSize = txComplete.txComplete.to_bytes().length
    console.error(toJson(getTxMemAndStepsUse(protocolParameters, txSize, txComplete.txComplete.to_json())))
    //------------------
    var txCompleteSigned: TxSigned
    try {
        txCompleteSigned = await (txComplete.sign()).complete();
    } catch (error: any) {
        console.error(functionName + " - Error txCompleteSigned: " + error)
        throw error
    }
    // console.log(functionName + " - Tx txCompleteSigned: " + txCompleteSigned.txSigned.to_json())
    // console.log(functionName + " - Tx txCompleteSigned: " + txCompleteSigned.toString())
    //------------------
    // await saveTxSignedToFile(txCompleteSigned)
    //------------------
    var txCompleteHash
    try {
        if (wallet.swEnviarPorBlockfrost && lucid!.provider) {
            console.log(functionName + " - Tx Using Provider")
            //txCompleteHash = await lucid!.provider.submitTx(toHex(txCompleteSigned.txSigned.to_bytes()));
            txCompleteHash = await lucid!.provider.submitTx(txCompleteSigned.txSigned);
        } else {
            console.log(functionName + " - Tx Using Wallet")
            //txCompleteHash = await lucid!.wallet.submitTx(toHex(txCompleteSigned.txSigned.to_bytes()));
            txCompleteHash = await lucid!.wallet.submitTx(txCompleteSigned.txSigned);
            //txCompleteHash = await txCompleteSigned.submit();
        }
    } catch (error: any) {
        console.error(functionName + " - Error txCompleteHash: " + error)
        throw error
    }
    console.log(functionName + " - Tx txCompleteHash: " + txCompleteHash)
    return txCompleteHash;
}

//---------------------------------------------------------------

export async function fixTx(txComplete: any, lucid: Lucid, protocolParameters: any) {

    for (const task of txComplete.tasks) {
        await task();
    }

    var blockLast: number | undefined = undefined

    await fetch(process.env.NEXT_PUBLIC_BLOCKFROST_URL! + '/blocks/latest', {
        headers: {
            'project_id': process.env.NEXT_PUBLIC_BLOCKFROST_KEY!
        }
    })
        .then(response => response.json())
        .then(json => {
            //console.log(toJson(json))
            blockLast = Number(json.slot)
        }
        );
    if (blockLast === undefined) {
        throw "Error: Can't get last block from Blockfrost"
    }
    // console.log ("blockLast: " +  blockLast)	
    const from = blockLast! + 0
    const until = blockLast! + validTimeRangeInSlots

    // console.log ("from: " +  from!.toString())	
    // console.log ("until: " +  until.toString())	

    txComplete.txBuilder.set_validity_start_interval(C.BigNum.from_str(from!.toString()));
    txComplete.txBuilder.set_ttl(C.BigNum.from_str(until.toString()));
   
    const utxos = await lucid.wallet.getUtxosCore();
    const changeAddress = C.Address.from_bech32(await lucid.wallet.address());

    txComplete.txBuilder.add_inputs_from(utxos, changeAddress);
    txComplete.txBuilder.balance(changeAddress, undefined);

    const transaction_NOT_READY_ONLY_FOR_SHOWING = txComplete.txBuilder.build_tx();

    console.log("fixTx - Tx Complete before evaluate:");
    console.log(transaction_NOT_READY_ONLY_FOR_SHOWING.to_json());

    const feeActual = txComplete.txBuilder.get_fee_if_set()

    const transaction = await txComplete.txBuilder.construct(utxos, changeAddress);

    const body = transaction.body();

    const feeActual_ = body.fee()
    console.log("fixTx - fee: " + feeActual?.to_str() + " - fee Fixed:" + feeActual_?.to_str());

    const witness_set = transaction.witness_set();

    // console.log("witness_set: " + witness_set.to_json());

    const auxiliary_data = transaction.auxiliary_data();

    const transaction_to_bytes = transaction.to_bytes();

    const transaction_NEW_VERISON = Transaction.from_bytes(transaction_to_bytes);

    // const body_NEW_VERISON  = transaction_NEW_VERISON.body()
    // const feeActual___ = body_NEW_VERISON.fee()
    // console.log("feeActual__:" + feeActual___?.to_str());

    const witness_set_NEW_VERISON = transaction_NEW_VERISON.witness_set();

    console.log("fixTx - witness_set_NEW_VERISON: " + witness_set_NEW_VERISON.to_json());

    //const witness_set_NEW_VERISON_Json = witness_set_NEW_VERISON.to_json()
    //const auxiliary_data_NEW_VERISON  = transaction_NEW_VERISON.auxiliary_data()


    if (
        witness_set_NEW_VERISON.redeemers() === undefined ||witness_set_NEW_VERISON.redeemers() === null 
        ) {
        console.log("fixTx - No redeemers");
        
    }else{
        const redeemers = witness_set_NEW_VERISON.redeemers();
        console.log("fixTx - With Redeemers: " + redeemers?.len);

        const datums = witness_set_NEW_VERISON.plutus_data();

        //const costModels = createCostModels(protocolParameters.costModels);
        const costModels_NEW_VERISON = createCostModels_NEW_VERISON(protocolParameters.costModels);

        const scriptHash = hash_script_data(redeemers!, costModels_NEW_VERISON, datums);

        console.log("fixTx - scriptHash: " + showPtrInHex(scriptHash));

        //body.set_script_data_hash(scriptHash)
        body.set_script_data_hash(C.ScriptDataHash.from_bytes(scriptHash.to_bytes()));
    }

    const transaction_FIXED = C.Transaction.new(body, witness_set, auxiliary_data);

    const newTx = new TxComplete(lucid, transaction_FIXED);

    return newTx;
}

//---------------------------------------------------------------

export function getTxMemAndStepsUse(protocolParameters: any, txSize: number, txJson: string) {

    const tx = JSON.parse(txJson)
    const witness_set = tx.witness_set
    const redeemers = witness_set.redeemers
    const result = []

    var mem = 0
    var steps = 0

    if (redeemers?.length) {
        for (var i = 0; i < redeemers.length; i += 1) {
            result.push({ "TAG": redeemers[i].tag, "MEM": Number(redeemers[i].ex_units.mem) / 1000000, "STEPS": Number(redeemers[i].ex_units.steps) / 1000000000 })
            mem += Number(redeemers[i].ex_units.mem)
            steps += Number(redeemers[i].ex_units.steps)
        }
    }

    //console.log ("getTxMemAndStepsUse - protocolParameters: " + toJson (protocolParameters))

    result.push({ "SIZE": txSize, "MEM": mem / 1000000, "STEPS": steps / 1000000000 })
    result.push({ "MAX SIZE": maxTxSize, "MAX MEM": maxTxExMem / 1000000, "MAX STEPS": maxTxExSteps / 1000000000 })

    return result
}