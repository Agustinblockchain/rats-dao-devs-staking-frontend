//----------------------------------------------------------------------

import { Assets, C, createCostModels, Lucid, TxComplete, TxSigned } from "lucid-cardano";
import { BigNum, Costmdls, CostModel, hash_script_data, Int, Language, Transaction } from "@dcspark/cardano-multiplatform-lib-browser";
import { SetStateAction } from "react";
import { explainErrorTx } from "../stakePool/explainError";
import { EUTxO, Master, Maybe, POSIXTime } from "../types";
import { maxTxExMem, maxTxExSteps, maxTxSize, TIME_OUT_TRY_TX, txConsumingTime, txPreparingTime, validTimeRangeInSlots } from "../types/constantes";
import { StakingPoolDBInterface } from "../types/stakePoolDBModel";
import { apiDeleteEUTxODB, apiUpdateEUTxODBIsConsuming, apiUpdateEUTxODBIsPreparing } from "../stakePool/apis";
import { showPtrInHex, toJson } from "./utils";
import { Wallet } from "./walletProvider";

//---------------------------------------------------------------

export async function newTransaction (title : string, walletStore: Wallet, poolInfo: StakingPoolDBInterface | undefined, endPoint: (wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets, master_Selected?: Master) => Promise <[string, EUTxO []]>, isWorkingInABuffer: boolean, setActionMessage: (value: SetStateAction<string>) => void, setActionHash: (value: SetStateAction<string>) => void, setIsWorking: (value: SetStateAction<string>) => void, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets, master_Selected?: Master) {
    
    //console.log(title + " - " + toJson(poolInfo?.name) + " - newTransaction - INIT")

    const lucid = walletStore.lucid

    if (!isWorkingInABuffer) {
        setActionMessage("Creating Transfer, please wait...")
    }

    var eUTxOs_for_consuming : EUTxO [] = []

    try {

        const [txHash, eUTxOs_for_consuming_] =  await endPoint(walletStore!, poolInfo!, eUTxOs_Selected, assets, master_Selected);
        eUTxOs_for_consuming = eUTxOs_for_consuming_

        if (!isWorkingInABuffer) {
            setActionMessage("Waiting for confirmation, please wait...")
        }

        setActionHash(txHash)

        await waitForTxConfirmation (lucid!, txHash, eUTxOs_for_consuming) 

        // if (isWorkingInABuffer) {
        console.log(title + " - Waiting extra safety time");
        await new Promise(r => setTimeout(r, 20000));
        // }

        if (!isWorkingInABuffer) setIsWorking("")

        return txHash.toString();

    } catch (error: any) {

        if (!isWorkingInABuffer) setIsWorking("")

        throw error
    }
}

//---------------------------------------------------------------

export function createTx (lucid: Lucid, protocolParameters: any, tx: any) {
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

export async function fixTx(tx_Building: any, lucid: Lucid, protocolParameters: any) {

    for (const task of tx_Building.tasks) {
        await task();
    }

    var blockLast: number | undefined = undefined

    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/blockfrost" + '/blocks/latest'
    const requestOptions = {
        method: 'GET',
        headers: {
          'project_id': "xxxxx"
        },
      }

    await fetch(urlApi, requestOptions)
        .then(response => response.json())
        .then(json => {
            //console.log(toJson(json))
            blockLast = Number(json.slot)
        }
        );
    if (blockLast === undefined) {
        throw "Error: Can't get last block from Blockfrost"
    }
    console.log ("blockLast: " +  blockLast)	
    const from = blockLast! + 0
    const until = blockLast! + validTimeRangeInSlots

    // console.log ("from: " +  from!.toString())	
    // console.log ("until: " +  until.toString())	

    tx_Building.txBuilder.set_validity_start_interval(C.BigNum.from_str(from!.toString()));
    tx_Building.txBuilder.set_ttl(C.BigNum.from_str(until.toString()));
   
    const utxos = await lucid.wallet.getUtxosCore();
    const changeAddress = C.Address.from_bech32(await lucid.wallet.address());

    tx_Building.txBuilder.add_inputs_from(utxos, changeAddress);
    tx_Building.txBuilder.balance(changeAddress, undefined);

    const transaction_NOT_READY_ONLY_FOR_SHOWING = tx_Building.txBuilder.build_tx();

    // console.log("fixTx - Tx Complete before evaluate:");
    // console.log(transaction_NOT_READY_ONLY_FOR_SHOWING.to_json());

    const feeActual = tx_Building.txBuilder.get_fee_if_set()

    const transaction = await tx_Building.txBuilder.construct(utxos, changeAddress);

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
    // console.log("fixTx - witness_set_NEW_VERISON: " + witness_set_NEW_VERISON.to_json());

    //const witness_set_NEW_VERISON_Json = witness_set_NEW_VERISON.to_json()
    //const auxiliary_data_NEW_VERISON  = transaction_NEW_VERISON.auxiliary_data()


    if (
        witness_set_NEW_VERISON.redeemers() === undefined ||witness_set_NEW_VERISON.redeemers() === null 
        ) {
        console.log("fixTx - No redeemers");
        
    }else{
        const redeemers = witness_set_NEW_VERISON.redeemers();
        console.log("fixTx - With Redeemers: " + redeemers?.len());

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

function createCostModels_NEW_VERISON(costModels: any) {
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

export async function makeTx_And_UpdateEUTxOsIsPreparing(functionName: string, wallet: Wallet, protocolParameters: any, tx_Binded: (...args: any) => Promise<TxComplete>, eUTxOs_for_consuming: EUTxO[]): Promise<[string,EUTxO[]]> {
    var timeOut : any = undefined;
    async function updateIsPreparing (setIsPrearing: boolean) {
        console.log ("updateIsPreparing: " + (setIsPrearing? "SET":"UNSET") + " - " + eUTxOs_for_consuming.length);
        if (timeOut) clearTimeout(timeOut)
        for (let i = 0; i < eUTxOs_for_consuming.length; i++) {
            const eUTxO_Updated = await apiUpdateEUTxODBIsPreparing(eUTxOs_for_consuming[i], setIsPrearing);
            eUTxOs_for_consuming[i] = eUTxO_Updated;
        }
    }
    try {
        //------------------
        const now = new Date();
        await updateIsPreparing(true);
        //------------------
        timeOut = setTimeout(updateIsPreparing, txPreparingTime, false);
        //------------------
        var txHash = await makeTx(functionName, wallet, protocolParameters, tx_Binded);
        return [txHash, eUTxOs_for_consuming];
    } catch (error) {
        updateIsPreparing(false)
        console.error(functionName + " - Error: " + error);
        throw error;
    }
}
    
//---------------------------------------------------------------

export async function makeTx(functionName: string, wallet: Wallet, protocolParameters: any, tx_Binded: (...args: any) => Promise<TxComplete>): Promise<string> {
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
            txComplete = await tx_Binded ();
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

export async function waitForTxConfirmation (lucid: Lucid, txhash: string, eUTxOs_for_consuming: EUTxO[]) {
    var timeOut : any = undefined;
    async function updateIsConsuming(setIsConsuming: boolean) {
        console.log("waitForTxConfirmation - updateIsConsuming: " + (setIsConsuming? "SET":"UNSET") + " - " + eUTxOs_for_consuming.length);
        if (timeOut) clearTimeout(timeOut);
        for (let i = 0; i < eUTxOs_for_consuming.length; i++) {
            const eUTxO_Updated = await apiUpdateEUTxODBIsConsuming(eUTxOs_for_consuming[i], setIsConsuming);
            eUTxOs_for_consuming[i] = eUTxO_Updated;
        }
    }
    async function deleteIsConsuming() {
        console.log("waitForTxConfirmation - deleteIsConsuming: " + eUTxOs_for_consuming.length);
        if (timeOut) clearTimeout(timeOut);
        for (let i = 0; i < eUTxOs_for_consuming.length; i++) {
            await apiDeleteEUTxODB(eUTxOs_for_consuming[i]);
        }
    }
    try {
        //------------------
        await updateIsConsuming(true);
        //------------------
        timeOut = setTimeout(updateIsConsuming, txConsumingTime, false);
        //------------------
        if (await lucid.awaitTx(txhash)) {
            console.log("waitForTxConfirmation - Tx confirmed");
            await deleteIsConsuming();
        } else {
            console.log("waitForTxConfirmation - Tx not confirmed");
            await updateIsConsuming(false);
        }
    } catch (error) {
        updateIsConsuming(false)
        console.error("waitForTxConfirmation - Error: " + error);
        throw error;
    } 
}

export function errorIsBecauseEUTxOsAreNotUpdated (error: string) : boolean {

    const error_explained = explainErrorTx(error)
    
    if (error_explained.includes("You have canceled the transfer!")) {
        return false;
    }

    return true;

}