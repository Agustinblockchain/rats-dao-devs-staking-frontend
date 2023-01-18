import path from 'path';

import { EUTxO, InterestRate, Maybe, PoolDatum, UserDatum } from '../types';
import { fundID_TN, poolDatum_ClaimedFund, poolID_TN, scriptID_Master_AddScripts_TN, scriptID_Master_ClosePool_TN, scriptID_Master_DeleteFund_TN, scriptID_Master_DeleteScripts_TN, scriptID_Master_FundAndMerge_TN, scriptID_Master_Fund_TN, scriptID_Master_SendBackDeposit_TN, scriptID_Master_SendBackFund_TN, scriptID_Master_SplitFund_TN, scriptID_Master_TerminatePool_TN, scriptID_User_Deposit_TN, scriptID_User_Harvest_TN, scriptID_User_Withdraw_TN, scriptID_Validator_TN, txID_Master_AddScripts_TN, userID_TN } from '../types/constantes';
import { deleteEUTxOsFromDBByTxHashAndIndex, deleteEUTxOsFromDBPreparingOrConsumingByAddress, getEUTxODBModel, getEUTxOFromDBByTxHashAndIndex, getEUTxOsFromDBByAddress } from '../types/eUTxODBModel';
import { getStakingPoolDBModel, StakingPoolDBInterface } from '../types/stakePoolDBModel';

import { apiSaveEUTxODB } from "./apis";
import { initializeLucid } from '../utils/initializeLucid';
import { isEqual, strToHex, toJson } from '../utils/utils';
import { getMissingEUTxOsInDB, getEUTxO_With_PoolDatum_InEUxTOList, getEUTxOs_With_FundDatum_InEUxTOList, getEUTxOs_With_UserDatum_InEUxTOList, getEUTxOs_With_UserDatum_InEUxTOList_OfUser, getEUTxO_With_ScriptDatum_InEUxTOList, eUTxODBParser, getExtraEUTxOsInDB, getEUTxO_With_AnyScriptDatum_InEUxTOList } from './helpersEUTxOs';
import { getTotalFundAmount, getTotalMastersMinAda_In_EUTxOs_With_UserDatum, sortFundDatum, getTotalAvailaibleFunds, getTotalFundAmountsRemains_ForMasters, getTotalCashedOut, getTotalStakedAmount, getTotalRewardsToPay_In_EUTxOs_With_UserDatum, getTotalUsersMinAda_In_EUTxOs_With_UserDatum, getIfUserRegistered, getUserStaked, getUserRewardsPaid, getUserRewardsToPay } from './helpersStakePool';
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

//---------------------------------------------------------------

export async function serverSide_updateStakingPool (poolInfo: StakingPoolDBInterface) {
    console.log("------------------------------")
    console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - INIT")
    try{
        //------------------
        const lucid = await initializeLucid ()
        //------------------
        var swUpdate = false
        //------------------
        const scriptAddress = poolInfo.scriptAddress
        //-----------------
        var tx_count = poolInfo.tx_count
        //-----------------
        var swPreparado = poolInfo.swPreparado
        var swIniciado = poolInfo.swIniciado
        var swFunded = poolInfo.swFunded
        var swClosed = poolInfo.swClosed
        var swTerminated = poolInfo.swTerminated
        var swZeroFunds = poolInfo.swZeroFunds
        var swPoolReadyForDeleteMasterAndUserScripts = poolInfo.swPoolReadyForDeleteMasterAndUserScripts
        var swPoolReadyForDeleteMainScripts = poolInfo.swPoolReadyForDeleteMainScripts
        var swPoolReadyForDeletePoolInDB = poolInfo.swPoolReadyForDeletePoolInDB
        var closedAt = poolInfo.closedAt
        //------------------
        const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
        //------------------
        const fundID_CS = poolInfo.txID_Master_Fund_CS
        const fundID_AC_Lucid = fundID_CS + strToHex(fundID_TN);
        //------------------
        const userID_CS = poolInfo.txID_User_Deposit_CS
        // const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
        //------------------
        const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS
        const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN)
        const txID_Master_AddScripts_AC_Lucid = txID_Master_AddScripts_CS + txID_Master_AddScripts_TN_Hex;
        //------------------
        const scriptID_Validator_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Validator_TN)
        const scriptID_Master_Fund_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_Fund_TN)
        const scriptID_Master_FundAndMerge_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_FundAndMerge_TN)
        const scriptID_Master_SplitFund_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_SplitFund_TN)
        const scriptID_Master_ClosePool_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_ClosePool_TN)
        const scriptID_Master_TerminatePool_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_TerminatePool_TN)
        const scriptID_Master_DeleteFund_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_DeleteFund_TN)
        const scriptID_Master_SendBackFund_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_SendBackFund_TN)
        const scriptID_Master_SendBackDeposit_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_SendBackDeposit_TN)
        const scriptID_Master_AddScripts_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_AddScripts_TN)
        const scriptID_Master_DeleteScripts_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_Master_DeleteScripts_TN)
        const scriptID_User_Deposit_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_User_Deposit_TN)
        const scriptID_User_Harvest_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_User_Harvest_TN)
        const scriptID_User_Withdraw_AC_Lucid = txID_Master_AddScripts_CS + strToHex(scriptID_User_Withdraw_TN)
        //------------------
        var new_tx_count: number | undefined = undefined
        const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/blockfrost" + '/addresses/' + scriptAddress + '/total'
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
                new_tx_count = Number(json.tx_count)
            }
            );
        if (new_tx_count === undefined) {
            console.log ("ServerSide - Update StakingPool - " + poolInfo.name + " - Error: Can't get tx_count from Blockfrost")	
            // throw "Error: Can't get tx_count from Blockfrost"
        }
        //------------------
        var poolDatum: PoolDatum | undefined
        var eUTxOs_With_Datum : EUTxO [] = []
        //------------------
        eUTxOs_With_Datum  = await getEUTxOsFromDBByAddress(scriptAddress);
        for (var i = 0; i < eUTxOs_With_Datum.length; i++) {
            const eUTxO = eUTxOs_With_Datum[i]
            const eUTxOParsed = eUTxODBParser(eUTxO);
            if (eUTxOParsed) eUTxOs_With_Datum[i] = eUTxOParsed
        }
        //------------------
        if (new_tx_count !== undefined && new_tx_count > tx_count) {
            console.log ("ServerSide - Update StakingPool - " + poolInfo.name + " - new_tx_count: " +  new_tx_count + " > old_tx_count: " + tx_count)	
            //------------------ 
            tx_count = new_tx_count
            swUpdate = true
            // elimino todas las eutxos que estan en la base de datos marcadas como preparadas o consumidas y que paso el tiempo de espera
            const count = await deleteEUTxOsFromDBPreparingOrConsumingByAddress(scriptAddress) 
            console.log ("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxOs Delete in DB Preparing Or Consuming: "+count)
            //------------------
            const uTxOsAtScript = await lucid!.utxosAt(scriptAddress)
            //------------------
            var eUTxOs_With_Datum_Extras : EUTxO [] = await getExtraEUTxOsInDB(lucid!, uTxOsAtScript, eUTxOs_With_Datum)   
            for (let i = 0; i < eUTxOs_With_Datum_Extras.length; i++) {
                const eUTxO = eUTxOs_With_Datum_Extras[i]
                await deleteEUTxOsFromDBByTxHashAndIndex(eUTxO.uTxO.txHash, eUTxO.uTxO.outputIndex) 
                eUTxOs_With_Datum = eUTxOs_With_Datum.filter(eUTxO_ => ! (eUTxO_.uTxO.txHash == eUTxO.uTxO.txHash && eUTxO_.uTxO.outputIndex == eUTxO.uTxO.outputIndex))
            }
            console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxOs Delete in db ones that not exist in blockchain: " + eUTxOs_With_Datum_Extras.length)
            //------------------
            if (uTxOsAtScript.length != eUTxOs_With_Datum.length){
                console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxOs At Script ("+uTxOsAtScript.length+") and DB ("+eUTxOs_With_Datum.length+") Not Match")
                var eUTxOs_With_Datum_Missing : EUTxO [] = await getMissingEUTxOsInDB(lucid!, uTxOsAtScript, eUTxOs_With_Datum)   
                for (let i = 0; i < eUTxOs_With_Datum_Missing.length; i++) {
                    const eUTxO = eUTxOs_With_Datum_Missing[i]
                    const eUTxO_ = await getEUTxOFromDBByTxHashAndIndex (eUTxO.uTxO.txHash, eUTxO.uTxO.outputIndex)
                    if (eUTxO_.length == 0 ){
                        var EUTxODBModel = getEUTxODBModel()
                        const newEUTxODB = new EUTxODBModel({
                            eUTxO: JSON.parse(toJson(eUTxO))
                        });
                        try {
                            await newEUTxODB.save()
                            console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxO added")
                        } catch (error) {
                            console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxO Error saving in DB")
                            console.log(error)
                        }
                    } else {
                        console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxO Error saving in DB, already there")
                    }
                }
                eUTxOs_With_Datum = eUTxOs_With_Datum.concat(eUTxOs_With_Datum_Missing)
                console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxOs added (" + eUTxOs_With_Datum_Missing.length + ")")
            }else{
                console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxOs At Script Match (" + uTxOsAtScript.length + ")")
            }
        }else{
            console.log ("ServerSide - Update StakingPool - " + poolInfo.name + " - new_tx_count: " +  new_tx_count + " == old_tx_count: " + tx_count)
        }
        //------------------
        console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - eUTxOs final: " + eUTxOs_With_Datum.length + "")
        //------------------
        const now = new Date()
        console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - now: " + now.getTime() + " - " + now.toISOString() + "")
        //------------------
        var eUTxO_With_PoolDatum: EUTxO | undefined 
        try{
            eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, false)
        }catch(error){
        }
        if (!eUTxO_With_PoolDatum) {
            console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Can't find any UTxO with PoolDatum");
            swPreparado = false
        } else {
            console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
            swPreparado = true
            //TODO : chekear que este andando bien el cierre y el terminate del fondo.
            // si la fecha del deadline ya paso, o hay closedAt en el poolDatum, entonces el pool debe estar closed
            // si la fecha del deadline ya paso, o hay closedAt en el poolDatum, y tambien el gracetime ya paso, entonces el pool debe estar terminated
            // si pdIsTerminated es true, entonces el pool debe estar terminated, significa que fue terminado forzado por el master
            poolDatum = eUTxO_With_PoolDatum.datum as PoolDatum
            if (poolDatum.pdIsTerminated === 1 ) {
                if (!swTerminated){
                    console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Dates: poolDatum.pdIsTerminated FOUND - setting forzed closed and forzed terminated")
                }    
                swClosed = true
                swTerminated = true
            } else {
                if (poolDatum.pdClosedAt.val !== undefined && poolDatum.pdClosedAt.val < BigInt(poolInfo.deadline.getTime()) && poolDatum.pdClosedAt.val < BigInt(now.getTime())) {
                    if (!swClosed){
                        console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Dates: poolDatum.pdClosedAt FOUND - setting forzed closed")
                        console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - pdClosedAt: " + poolDatum.pdClosedAt.val + " - " + new Date(parseInt(poolDatum.pdClosedAt.val.toString())).toISOString() + "")
                    }    
                    swClosed = true
                    closedAt = new Date(parseInt(poolDatum.pdClosedAt.val.toString()))
                    if (BigInt(closedAt.getTime()) + BigInt(poolInfo.graceTime) < BigInt(now.getTime())) {
                        if (!swTerminated){
                            console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Dates: forzed closedAt plus grace Time REACHED - setting terminated")
                        }
                        swTerminated = true
                    }
                }
            }
        }
        if (poolInfo.deadline < now) {
            if (!swClosed){
                console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Dates: deadline REACHED - setting closed")
            }
            swClosed = true
            closedAt = undefined
            if (BigInt(poolInfo.deadline.getTime()) + BigInt(poolInfo.graceTime) < BigInt(now.getTime())) {
                if (!swTerminated){
                    console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Dates: deadline plus grace Time REACHED - setting terminated")
                }
                swTerminated = true
            }
        }
        //------------------
        var eUTxOs_With_FundDatum: EUTxO[] = []
        if (eUTxO_With_PoolDatum) {
            eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum)
            if (eUTxOs_With_FundDatum.length === 0) {
                // console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Can't find any UTxO with FundDatum. Did you funded already?");
                swFunded = false
                swZeroFunds = true
            } else {
                //console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - UTxOs with FundDatum lenght: " + eUTxOs_With_FundDatum.length)
                swFunded = true
                swZeroFunds = false
            }
        }
        //------------------
        var eUTxOs_With_UserDatum: EUTxO[] = []
        if (eUTxO_With_PoolDatum) {
            const userID_CS = poolInfo.txID_User_Deposit_CS
            const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
            eUTxOs_With_UserDatum = getEUTxOs_With_UserDatum_InEUxTOList(userID_AC_Lucid, eUTxOs_With_Datum)
            if (eUTxOs_With_UserDatum.length === 0) {
                // console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Can't find any UTxO with UserDatum.");
            } else {
                // console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - UTxOs with UserDatum lenght: " + eUTxOs_With_UserDatum.length)
            }
        }
        //------------------
        const eUTxOs_With_ScriptDatum = getEUTxO_With_AnyScriptDatum_InEUxTOList (txID_Master_AddScripts_AC_Lucid, eUTxOs_With_Datum)
        //------------------
        var eUTxO_With_ScriptDatum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Validator_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_ScriptDatum, poolInfo.eUTxO_With_ScriptDatum)) {
            poolInfo.eUTxO_With_ScriptDatum = eUTxO_With_ScriptDatum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_Fund_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_Fund_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_Fund_Datum, poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum = eUTxO_With_Script_TxID_Master_Fund_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_FundAndMerge_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_FundAndMerge_Datum, poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = eUTxO_With_Script_TxID_Master_FundAndMerge_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_SplitFund_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_SplitFund_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_SplitFund_Datum, poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum = eUTxO_With_Script_TxID_Master_SplitFund_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_ClosePool_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_ClosePool_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_ClosePool_Datum, poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum = eUTxO_With_Script_TxID_Master_ClosePool_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_TerminatePool_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_TerminatePool_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_TerminatePool_Datum, poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum = eUTxO_With_Script_TxID_Master_TerminatePool_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_DeleteFund_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_DeleteFund_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_DeleteFund_Datum, poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum = eUTxO_With_Script_TxID_Master_DeleteFund_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_SendBackFund_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_SendBackFund_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_SendBackFund_Datum, poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum = eUTxO_With_Script_TxID_Master_SendBackFund_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_SendBackDeposit_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum, poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_AddScripts_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_AddScripts_Datum, poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum = eUTxO_With_Script_TxID_Master_AddScripts_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_Master_DeleteScripts_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_Master_DeleteScripts_Datum, poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum = eUTxO_With_Script_TxID_Master_DeleteScripts_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_User_Deposit_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_User_Deposit_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_User_Deposit_Datum, poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum = eUTxO_With_Script_TxID_User_Deposit_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_User_Harvest_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_User_Harvest_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_User_Harvest_Datum, poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum = eUTxO_With_Script_TxID_User_Harvest_Datum
            swUpdate = true
        } 
        var eUTxO_With_Script_TxID_User_Withdraw_Datum: EUTxO | undefined = getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_User_Withdraw_AC_Lucid, eUTxOs_With_ScriptDatum)
        if (!isEqual (eUTxO_With_Script_TxID_User_Withdraw_Datum, poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum)) {
            poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum = eUTxO_With_Script_TxID_User_Withdraw_Datum
            swUpdate = true
        } 
        //------------------
        if (eUTxO_With_PoolDatum === undefined || poolDatum === undefined) {
            swPoolReadyForDeleteMasterAndUserScripts = true
            swPoolReadyForDeleteMainScripts = true
            swPoolReadyForDeletePoolInDB = true
        }else{
            const masterFunders = poolDatum.pdMasterFunders
            var swAllMasterFundersClaimed = true
            masterFunders.forEach(mf => {
                if (mf.mfClaimedFund != poolDatum_ClaimedFund) {
                    swAllMasterFundersClaimed = false
                    return
                }
            });

            const swAnyScriptsMaster = (
                eUTxO_With_Script_TxID_Master_Fund_Datum !== undefined ||
                eUTxO_With_Script_TxID_Master_FundAndMerge_Datum !== undefined ||
                eUTxO_With_Script_TxID_Master_SplitFund_Datum !== undefined ||
                eUTxO_With_Script_TxID_Master_ClosePool_Datum !== undefined ||
                eUTxO_With_Script_TxID_Master_TerminatePool_Datum !== undefined ||
                eUTxO_With_Script_TxID_Master_DeleteFund_Datum !== undefined ||
                eUTxO_With_Script_TxID_Master_SendBackFund_Datum !== undefined ||
                eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum !== undefined)

            const swAnyScriptsUser = (
                eUTxO_With_Script_TxID_User_Deposit_Datum !== undefined ||
                eUTxO_With_Script_TxID_User_Withdraw_Datum !== undefined ||
                eUTxO_With_Script_TxID_User_Harvest_Datum !== undefined)

            const swAnyMainScript = (
                eUTxO_With_ScriptDatum !== undefined ||
                eUTxO_With_Script_TxID_Master_AddScripts_Datum !== undefined ||
                eUTxO_With_Script_TxID_Master_DeleteScripts_Datum !== undefined)    

            const swAnyScriptsAtAll = swAnyScriptsMaster || swAnyScriptsUser || swAnyMainScript
            
            swPoolReadyForDeleteMasterAndUserScripts = swAllMasterFundersClaimed && (eUTxOs_With_FundDatum.length === 0) && (eUTxOs_With_UserDatum.length === 0) && swTerminated
            swPoolReadyForDeleteMainScripts = swAllMasterFundersClaimed && (eUTxOs_With_FundDatum.length === 0) && (eUTxOs_With_UserDatum.length === 0) && !swAnyScriptsMaster && !swAnyScriptsUser && swTerminated
            swPoolReadyForDeletePoolInDB = swAllMasterFundersClaimed && (eUTxOs_With_FundDatum.length === 0) && (eUTxOs_With_UserDatum.length === 0) && !swAnyScriptsAtAll
        
            // console.log ("swAnyScriptsMasters: " + swAnyScriptsMaster)
            // console.log ("swAnyScriptsUser: " + swAnyScriptsUser)
            // console.log ("swAnyMainScript: " + swAnyMainScript)
            // console.log ("swAnyScriptsAtAll: " + swAnyScriptsAtAll)
            // console.log ("swAllMasterFundersClaimed: " + swAllMasterFundersClaimed)
            // console.log ("swPoolReadyForDeleteMasterAndUserScripts: " + swPoolReadyForDeleteMasterAndUserScripts)
            // console.log ("swPoolReadyForDeleteMainScripts: " + swPoolReadyForDeleteMainScripts)
            // console.log ("swPoolReadyForDeletePoolInDB: " + swPoolReadyForDeletePoolInDB)
            // console.log ("eUTxOs_With_Datum.length: " + eUTxOs_With_Datum.length)
            // console.log ("eUTxOs_With_FundDatum.length: " + eUTxOs_With_FundDatum.length)
            // console.log ("eUTxOs_With_UserDatum.length: " + eUTxOs_With_UserDatum.length)

        }

        if (poolInfo.beginAt < now) {
            swIniciado = true
        } else {
            swIniciado = false
        }

        if (poolInfo.swPreparado != swPreparado) {
            swUpdate = true
        }

        if (poolInfo.swIniciado != swIniciado) {
            swUpdate = true
        }

        if (poolInfo.swFunded != swFunded) {
            swUpdate = true
        }

        if (poolInfo.swClosed != swClosed) {
            swUpdate = true
        }

        if (poolInfo.closedAt?.getTime() != closedAt?.getTime()) {
            poolInfo.closedAt = closedAt
            swUpdate = true
        }

        if (poolInfo.swTerminated != swTerminated) {
            swUpdate = true
        }

        if (poolInfo.swZeroFunds != swZeroFunds) {
            swUpdate = true
        }

        if (poolInfo.swPoolReadyForDeleteMasterAndUserScripts != swPoolReadyForDeleteMasterAndUserScripts) {
            swUpdate = true
        }

        if (poolInfo.swPoolReadyForDeleteMainScripts != swPoolReadyForDeleteMainScripts) {
            swUpdate = true
        }

        if (poolInfo.swPoolReadyForDeletePoolInDB != swPoolReadyForDeletePoolInDB) {
            swUpdate = true
        }

        if (swUpdate) {
            console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - Saving StakingPool in DB")
            var StakingPoolDBModel = getStakingPoolDBModel()
            const filter = {name : poolInfo.name};
            const update = { 
                tx_count : tx_count,
                swPreparado: swPreparado, 
                swIniciado: swIniciado, 
                swFunded: swFunded,
                swClosed: swClosed,
                closedAt: closedAt != undefined? new Date(closedAt) : undefined,
                swTerminated: swTerminated,
                swZeroFunds: swZeroFunds,
                swPoolReadyForDeleteMasterAndUserScripts: swPoolReadyForDeleteMasterAndUserScripts,
                swPoolReadyForDeleteMainScripts: swPoolReadyForDeleteMainScripts,
                swPoolReadyForDeletePoolInDB: swPoolReadyForDeletePoolInDB,
                eUTxO_With_ScriptDatum: eUTxO_With_ScriptDatum? JSON.parse(toJson(eUTxO_With_ScriptDatum)) : undefined,
                eUTxO_With_Script_TxID_Master_Fund_Datum: eUTxO_With_Script_TxID_Master_Fund_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_Fund_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: eUTxO_With_Script_TxID_Master_FundAndMerge_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_SplitFund_Datum: eUTxO_With_Script_TxID_Master_SplitFund_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_SplitFund_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_ClosePool_Datum: eUTxO_With_Script_TxID_Master_ClosePool_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_ClosePool_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_TerminatePool_Datum: eUTxO_With_Script_TxID_Master_TerminatePool_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_TerminatePool_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_DeleteFund_Datum: eUTxO_With_Script_TxID_Master_DeleteFund_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_DeleteFund_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_SendBackFund_Datum: eUTxO_With_Script_TxID_Master_SendBackFund_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_SendBackFund_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_AddScripts_Datum: eUTxO_With_Script_TxID_Master_AddScripts_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_AddScripts_Datum)) : undefined,
                eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: eUTxO_With_Script_TxID_Master_DeleteScripts_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_DeleteScripts_Datum)) : undefined,
                eUTxO_With_Script_TxID_User_Deposit_Datum: eUTxO_With_Script_TxID_User_Deposit_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_User_Deposit_Datum)) : undefined,
                eUTxO_With_Script_TxID_User_Harvest_Datum: eUTxO_With_Script_TxID_User_Harvest_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_User_Harvest_Datum)) : undefined,
                eUTxO_With_Script_TxID_User_Withdraw_Datum: eUTxO_With_Script_TxID_User_Withdraw_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_User_Withdraw_Datum)) : undefined
            };

            var updateSet = {}
            var updateUnSet = {}
            for (var key in update) {
                if (update[key as keyof typeof update] == undefined) {
                    updateUnSet = {...updateUnSet, [key]: ""}
                }else{
                    updateSet = {...updateSet, [key]: update[key as keyof typeof update]}
                }
            }
            try{
                await StakingPoolDBModel.findOneAndUpdate(filter, { $set : updateSet , $unset : updateUnSet })
            }catch(error){
                console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - ERROR UPDATING POOL DATA: " + poolInfo.name)
                console.log(error)
            }
        }else{
            //console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - NO UPDATING POOL DATA")
        }
        poolInfo.tx_count = tx_count
        poolInfo.swPreparado = swPreparado
        poolInfo.swIniciado = swIniciado
        poolInfo.swFunded = swFunded
        poolInfo.swClosed = swClosed
        poolInfo.closedAt = closedAt != undefined? new Date(closedAt) : undefined,
        poolInfo.swTerminated = swTerminated,
        poolInfo.swZeroFunds = swZeroFunds,
        poolInfo.swPoolReadyForDeleteMasterAndUserScripts = swPoolReadyForDeleteMasterAndUserScripts,
        poolInfo.swPoolReadyForDeleteMainScripts = swPoolReadyForDeleteMainScripts,
        poolInfo.swPoolReadyForDeletePoolInDB = swPoolReadyForDeletePoolInDB,
        poolInfo.eUTxO_With_ScriptDatum = eUTxO_With_ScriptDatum? JSON.parse(toJson(eUTxO_With_ScriptDatum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum = eUTxO_With_Script_TxID_Master_Fund_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_Fund_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = eUTxO_With_Script_TxID_Master_FundAndMerge_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum = eUTxO_With_Script_TxID_Master_SplitFund_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_SplitFund_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum = eUTxO_With_Script_TxID_Master_ClosePool_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_ClosePool_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum = eUTxO_With_Script_TxID_Master_TerminatePool_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_TerminatePool_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum = eUTxO_With_Script_TxID_Master_DeleteFund_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_DeleteFund_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum = eUTxO_With_Script_TxID_Master_SendBackFund_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_SendBackFund_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum = eUTxO_With_Script_TxID_Master_AddScripts_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_AddScripts_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum = eUTxO_With_Script_TxID_Master_DeleteScripts_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_Master_DeleteScripts_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum = eUTxO_With_Script_TxID_User_Deposit_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_User_Deposit_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum = eUTxO_With_Script_TxID_User_Harvest_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_User_Harvest_Datum)) : undefined,
        poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum = eUTxO_With_Script_TxID_User_Withdraw_Datum? JSON.parse(toJson(eUTxO_With_Script_TxID_User_Withdraw_Datum)) : undefined
        console.log("------------------------------")
    }catch(error){
        console.log("ServerSide - Update StakingPool - " + poolInfo.name + " - ERROR: " + error)
    }
    return poolInfo 
}

