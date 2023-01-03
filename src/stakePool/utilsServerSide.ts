import path from 'path';
import { InterestRate, Maybe } from '../types';
import { strToHex, toJson } from '../utils/utils';
//---------------------------------------------------------------
const fs = require('fs/promises');
//---------------------------------------------------------------
export async function getPABPoolParamsFromFile(filename: string) {

    try {

        const pathToFile = path.join(process.cwd(), 'public', 'scripts', filename);

        const data = await fs.readFile(pathToFile, { encoding: 'utf8' });
        //console.log(data);
        let jsonFile = JSON.parse(data);

        var staking_Lucid;
        var staking_UI = jsonFile!.pppStaking_UI;
        var staking_CS;
        var staking_TN_Hex;

        if (jsonFile!.pppPoolParams.ppStaking_CS.unCurrencySymbol === "") {
            staking_CS = "";
            staking_TN_Hex = "";
            staking_Lucid = "lovelace";
        } else {
            // ppStaking_CS = hexToStr(jsonFile!.pppPoolParams.ppStaking_CS)
            staking_CS = jsonFile!.pppPoolParams.ppStaking_CS.unCurrencySymbol;
            staking_TN_Hex = strToHex(jsonFile!.pppPoolParams.ppStaking_TN.unTokenName);
            staking_Lucid = staking_CS + staking_TN_Hex;
        }

        console.log("Staking Lucid: " + staking_Lucid);
        console.log("Staking UI: " + toJson(staking_UI));
        console.log("Staking CS: " + toJson(staking_CS));
        console.log("Staking TN Hex: " + toJson(staking_TN_Hex));


        var harvest_Lucid;
        // var ppHarvestUnit : AssetClass
        var harvest_UI = jsonFile!.pppHarvest_UI;
        var harvest_CS;
        var harvest_TN_Hex;

        if (jsonFile!.pppPoolParams.ppHarvest_CS.unCurrencySymbol === "") {
            harvest_CS = "";
            harvest_TN_Hex = "";
            harvest_Lucid = "lovelace";
        } else {
            // ppHarvest_CS = hexToStr(jsonFile!.pppPoolParams.ppHarvest_CS)
            harvest_CS = jsonFile!.pppPoolParams.ppHarvest_CS.unCurrencySymbol;
            harvest_TN_Hex = strToHex(jsonFile!.pppPoolParams.ppHarvest_TN.unTokenName);
            harvest_Lucid = harvest_CS + harvest_TN_Hex;
        }

        console.log("Harvest Lucid: " + harvest_Lucid);
        console.log("Harvest UI: " + toJson(harvest_UI));
        console.log("Harvest CS: " + toJson(harvest_CS));
        console.log("Harvest TN Hex: " + toJson(harvest_TN_Hex));

        const poolID_CS = (jsonFile!.pppCurSymbol_PoolID.unCurrencySymbol);
        console.log("PoolID CS: " + toJson(poolID_CS));

        const pabPoolParams = {
            poolID_TxOutRef: { txHash: jsonFile!.pppPoolID_TxOutRef.txOutRefId.getTxId, outputIndex: jsonFile!.pppPoolID_TxOutRef.txOutRefIdx },

            // ppMasters:           jsonFile!.pppPoolParams.ppMasters.map ((item: any) => { return hexToStr(item) }),  
            masters: jsonFile!.pppPoolParams.ppMasters.map((item: any) => { return (item.getPubKeyHash); }),
            beginAt: jsonFile!.pppPoolParams.ppBeginAt,
            deadline: jsonFile!.pppPoolParams.ppDeadline,
            graceTime: jsonFile!.pppPoolParams.ppGraceTime,

            staking_UI: staking_UI,
            staking_CS: staking_CS,
            staking_TN: staking_TN_Hex,

            harvest_UI: harvest_UI,
            harvest_CS: harvest_CS,
            harvest_TN: harvest_TN_Hex,

            staking_Lucid: staking_Lucid,
            harvest_Lucid: harvest_Lucid,

            interestRates: jsonFile!.pppPoolParams.ppInterestRates.map((item: any) => { return new InterestRate(new Maybe<number>(item.iMinDays), item.iPercentage); }),

            // pppPolicy_PoolID : createScriptFromHEXCBOR(jsonFile!.pppPolicy_PoolID.getMintingPolicy),
            // pppPolicy_TxID_Master_Fund : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_Fund.getMintingPolicy),
            // pppPolicy_TxID_Master_FundAndMerge : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_FundAndMerge.getMintingPolicy),
            // pppPolicy_TxID_Master_SplitFund : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_SplitFund.getMintingPolicy),
            // pppPolicy_TxID_Master_ClosePool : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_ClosePool.getMintingPolicy),
            // pppPolicy_TxID_Master_TerminatePool : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_TerminatePool.getMintingPolicy),
            // pppPolicy_TxID_Master_DeleteFund : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_DeleteFund.getMintingPolicy),
            // pppPolicy_TxID_Master_SendBackFund : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_SendBackFund.getMintingPolicy),
            // pppPolicy_TxID_Master_SendBackDeposit : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_SendBackDeposit.getMintingPolicy),
            // pppPolicy_TxID_Master_AddScripts : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_AddScripts.getMintingPolicy),
            // pppPolicy_TxID_Master_DeleteScripts : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_Master_DeleteScripts.getMintingPolicy),
            // pppPolicy_TxID_User_Deposit : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_User_Deposit.getMintingPolicy),
            // pppPolicy_TxID_User_Harvest : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_User_Harvest.getMintingPolicy),
            // pppPolicy_TxID_User_Withdraw : createScriptFromHEXCBOR(jsonFile!.pppPolicy_TxID_User_Withdraw.getMintingPolicy),
            poolID_CS: poolID_CS,
            txID_Master_Fund_CS: jsonFile!.pppCurSymbol_TxID_Master_Fund.unCurrencySymbol,
            txID_Master_FundAndMerge_CS: jsonFile!.pppCurSymbol_TxID_Master_FundAndMerge.unCurrencySymbol,
            txID_Master_SplitFund_CS: jsonFile!.pppCurSymbol_TxID_Master_SplitFund.unCurrencySymbol,
            txID_Master_ClosePool_CS: jsonFile!.pppCurSymbol_TxID_Master_ClosePool.unCurrencySymbol,
            txID_Master_TerminatePool_CS: jsonFile!.pppCurSymbol_TxID_Master_TerminatePool.unCurrencySymbol,
            txID_Master_DeleteFund_CS: jsonFile!.pppCurSymbol_TxID_Master_DeleteFund.unCurrencySymbol,
            txID_Master_SendBackFund_CS: jsonFile!.pppCurSymbol_TxID_Master_SendBackFund.unCurrencySymbol,
            txID_Master_SendBackDeposit_CS: jsonFile!.pppCurSymbol_TxID_Master_SendBackDeposit.unCurrencySymbol,
            txID_Master_AddScripts_CS: jsonFile!.pppCurSymbol_TxID_Master_AddScripts.unCurrencySymbol,
            txID_Master_DeleteScripts_CS: jsonFile!.pppCurSymbol_TxID_Master_DeleteScripts.unCurrencySymbol,
            txID_User_Deposit_CS: jsonFile!.pppCurSymbol_TxID_User_Deposit.unCurrencySymbol,
            txID_User_Harvest_CS: jsonFile!.pppCurSymbol_TxID_User_Harvest.unCurrencySymbol,
            txID_User_Withdraw_CS: jsonFile!.pppCurSymbol_TxID_User_Withdraw.unCurrencySymbol,
        };
        return pabPoolParams;
    } catch (error: any) {
        console.error("Error reading: " + filename + " " + error);
        throw "Error reading: " + filename + " " + error;
    }
}
//---------------------------------------------------------------
export async function getEstadoDeployFromFile(filename: string) {

    try {

        const pathToFile = path.join(process.cwd(), 'public', 'scripts', filename);

        const data = await fs.readFile(pathToFile, { encoding: 'utf8' });
        let jsonFile = JSON.parse(data);

        const estado: string = jsonFile!.getEstado;

        return estado;

    } catch (error: any) {
        console.error("Error reading: " + filename + " " + error);
        throw "Error reading: " + filename + " " + error;
    }
}
