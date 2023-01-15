import { Assets, C, Lucid, PaymentKeyHash, UTxO } from "lucid-cardano";
import { AC, EUTxO, FundDatum, Master_Funder, Maybe, mkFundDatum_FromCbor, mkPoolDatum_FromCbor, mkScriptDatum_FromCbor, mkUserDatum_FromCbor, PoolDatum, POSIXTime, ScriptDatum, UserDatum } from "../types";
import { StakingPoolDBInterface } from "../types/stakePoolDBModel";
import { findDatumIfMissing, isNFT_With_AC_Lucid_InValue, isToken_With_AC_Lucid_InValue } from "../utils/cardano-helpers";
import { objToPlutusData } from "../utils/cardano-utils";
import { apiDeleteEUTxOsDBByStakingPool } from "./apis";
import { isPoolDatum, isFundDatum, isUserDatum, isScriptDatum } from "./helpersDatumsAndRedeemers";

//---------------------------------------------------------------

export function eUTxODBParser(eUTxO: EUTxO | undefined): EUTxO | undefined {

    if (eUTxO === undefined){
        return eUTxO
    }

    var units = Object.keys(eUTxO.uTxO.assets);

    // console.log ("apiGetEUTxOsDBByAddress - units: " + toJson(units))
    // console.log ("apiGetEUTxOsDBByAddress - units length: " + units.length)

    var res: Assets = {}
    for (var j = 0; j < units.length; j++) {
        res[units[j]] = BigInt(eUTxO.uTxO.assets[units[j]])
    }

    eUTxO.uTxO.assets = res;

    if (eUTxO.datum.plutusDataIndex == PoolDatum.plutusDataIndex) {
        var pdClosedAt
        if (eUTxO.datum.pdClosedAt.plutusDataIndex == 0) {
            pdClosedAt = new Maybe(BigInt(eUTxO.datum.pdClosedAt.val))
        } else {
            pdClosedAt = new Maybe<POSIXTime>()
        }

        var masterFunders: Master_Funder[] = []
        for (var j = 0; j < eUTxO.datum.pdMasterFunders.length; j++) {
            masterFunders.push(new Master_Funder(
                eUTxO.datum.pdMasterFunders[j].mfMaster,
                BigInt(eUTxO.datum.pdMasterFunders[j].mfFundAmount),
                Number(eUTxO.datum.pdMasterFunders[j].mfClaimedFund),
                BigInt(eUTxO.datum.pdMasterFunders[j].mfMinAda)
            ))
        }

        eUTxO.datum = new PoolDatum(
            masterFunders,
            Number(eUTxO.datum.pdFundCount),
            BigInt(eUTxO.datum.pdTotalCashedOut),
            pdClosedAt,
            Number(eUTxO.datum.pdIsTerminated),
            BigInt(eUTxO.datum.pdMinAda),
        )
    }
    if (eUTxO.datum.plutusDataIndex == FundDatum.plutusDataIndex) {
        eUTxO.datum = new FundDatum(
            BigInt(eUTxO.datum.fdFundAmount),
            BigInt(eUTxO.datum.fdCashedOut),
            BigInt(eUTxO.datum.fdMinAda)
        )
    }
    if (eUTxO.datum.plutusDataIndex == UserDatum.plutusDataIndex) {
        var udLastClaimAt
        if (eUTxO.datum.udLastClaimAt.plutusDataIndex == 0) {
            udLastClaimAt = new Maybe(BigInt(eUTxO.datum.udLastClaimAt.val))
        } else {
            udLastClaimAt = new Maybe<POSIXTime>()
        }
        eUTxO.datum = new UserDatum(
            eUTxO.datum.udUser,
            BigInt(eUTxO.datum.udInvest),
            BigInt(eUTxO.datum.udCreatedAt),
            BigInt(eUTxO.datum.udCashedOut),
            BigInt(eUTxO.datum.udRewardsNotClaimed),
            udLastClaimAt,
            BigInt(eUTxO.datum.udMinAda)
        )
    }
    if (eUTxO.datum.plutusDataIndex == ScriptDatum.plutusDataIndex) {
        eUTxO.datum = new ScriptDatum(eUTxO.datum.sdMaster)
    }

    return eUTxO;

}

//---------------------------------------------------------------

export async function getEUTxOsWith_Datum(lucid: Lucid, utxos: UTxO[]): Promise<EUTxO[]> {
    const eUTxOs: EUTxO[] = []

    // console.log ("getExtendedUTxOsWith_Datum - init: " + toJson (utxos))
    
    console.log ("getExtendedUTxOsWith_Datum - init - length: " + utxos.length)

    for (var i = 0; i < utxos.length; i += 1) {

        const uTxO = await findDatumIfMissing(lucid, utxos[i])

        if (uTxO.datum) {
            try {
                const poolDatum: PoolDatum | void = mkPoolDatum_FromCbor(uTxO.datum)

                if (!uTxO.datumHash) {
                    const plutusData = objToPlutusData(poolDatum)
                    const hash = C.hash_plutus_data(plutusData)
                    //uTxO.datumHash = showPtrInHex(hash)
                    //console.log ("getExtendedUTxOsWith_Datum - datumHash calc")
                }

                const eUTxO: EUTxO = {
                    datum: poolDatum,
                    uTxO: uTxO,
                    isPreparing: new Maybe<POSIXTime>(),
                    isConsuming: new Maybe<POSIXTime>()
                }
                //console.log ("getExtendedUTxOsWith_Datum - poolDatum:  " + toJson (eUTxO))

                eUTxOs.push(eUTxO)
                continue;
            }
            catch (error) {
            }
            try {
                const fundDatum: FundDatum | void = mkFundDatum_FromCbor(uTxO.datum)
                const eUTxO: EUTxO = {
                    datum: fundDatum,
                    uTxO: uTxO,
                    isPreparing: new Maybe<POSIXTime>(),
                    isConsuming: new Maybe<POSIXTime>()
                }
                eUTxOs.push(eUTxO)
                continue;
            }
            catch (error) {
            }
            try {
                const userDatum: UserDatum | void = mkUserDatum_FromCbor(uTxO.datum)
                const eUTxO: EUTxO = {
                    datum: userDatum,
                    uTxO: uTxO,
                    isPreparing: new Maybe<POSIXTime>(),
                    isConsuming: new Maybe<POSIXTime>()
                }
                eUTxOs.push(eUTxO)
                continue;
            }
            catch (error) {
            }
            try {
                const scriptDatum: ScriptDatum | undefined = mkScriptDatum_FromCbor(uTxO.datum)
                const eUTxO: EUTxO = {
                    datum: scriptDatum,
                    uTxO: uTxO,
                    isPreparing: new Maybe<POSIXTime>(),
                    isConsuming: new Maybe<POSIXTime>()
                }
                eUTxOs.push(eUTxO)
                continue;
            }
            catch (error) {
            }
        }
    }
    // console.log ("getExtendedUTxOsWith_Datum - result:  " + toJson (eUTxOs))
    console.log ("getExtendedUTxOsWith_Datum - result length:  " + eUTxOs.length)
    return eUTxOs
}

//---------------------------------------------------------------

export async function getMissingEUTxOsInDB(lucid: Lucid, utxos: UTxO[], eUTxOsDB: EUTxO[]): Promise<EUTxO[]> {
    const eUTxOs: EUTxO[] = []
    //console.log ("getMissingEUTxOs - init: " + toJson (utxos))
    //console.log ("getMissingEUTxOs - init - length script: " + utxos.length + " - db length: " + eUTxOsDB.length)
    for (var i = 0; i < utxos.length; i += 1) {

        if (!eUTxOsDB.find(eUTxO => eUTxO.uTxO.txHash === utxos[i].txHash && eUTxO.uTxO.outputIndex === utxos[i].outputIndex)) {
            const uTxO = await findDatumIfMissing(lucid, utxos[i])
            if (uTxO.datum) {
                try {
                    const poolDatum: PoolDatum | void = mkPoolDatum_FromCbor(uTxO.datum)

                    if (!uTxO.datumHash) {
                        const plutusData = objToPlutusData(poolDatum)
                        const hash = C.hash_plutus_data(plutusData)
                        //uTxO.datumHash = showPtrInHex(hash)
                        //console.log ("getMissingEUTxOs - datumHash calc")
                    }

                    const eUTxO: EUTxO = {
                        datum: poolDatum,
                        uTxO: uTxO,
                        isPreparing: new Maybe<POSIXTime>(),
                        isConsuming: new Maybe<POSIXTime>()
                    }
                    //console.log ("getMissingEUTxOs - poolDatum:  " + toJson (eUTxO))

                    eUTxOs.push(eUTxO)
                    continue;
                }
                catch (error) {
                }
                try {
                    const fundDatum: FundDatum | void = mkFundDatum_FromCbor(uTxO.datum)
                    const eUTxO: EUTxO = {
                        datum: fundDatum,
                        uTxO: uTxO,
                        isPreparing: new Maybe<POSIXTime>(),
                        isConsuming: new Maybe<POSIXTime>()
                    }
                    eUTxOs.push(eUTxO)
                    continue;
                }
                catch (error) {
                }
                try {
                    const userDatum: UserDatum | void = mkUserDatum_FromCbor(uTxO.datum)
                    const eUTxO: EUTxO = {
                        datum: userDatum,
                        uTxO: uTxO,
                        isPreparing: new Maybe<POSIXTime>(),
                        isConsuming: new Maybe<POSIXTime>()
                    }
                    eUTxOs.push(eUTxO)
                    continue;
                }
                catch (error) {
                }
                try {
                    const scriptDatum: ScriptDatum | undefined = mkScriptDatum_FromCbor(uTxO.datum)
                    const eUTxO: EUTxO = {
                        datum: scriptDatum,
                        uTxO: uTxO,
                        isPreparing: new Maybe<POSIXTime>(),
                        isConsuming: new Maybe<POSIXTime>()
                    }
                    eUTxOs.push(eUTxO)
                    continue;
                }
                catch (error) {
                }
            }
        }
    }
    //console.log ("getMissingEUTxOs - result:  " + toJson (eUTxOs))
    //console.log ("getMissingEUTxOs - result length:  " + eUTxOs.length)
    return eUTxOs
}

//---------------------------------------------------------------

export async function getExtraEUTxOsInDB(lucid: Lucid, utxos: UTxO[], eUTxOsDB: EUTxO[]): Promise<EUTxO[]> {
    const eUTxOs: EUTxO[] = []
    //console.log ("getExtraEUTxOsInDB - init - length script: " + utxos.length + " - db length: " + eUTxOsDB.length)
    for (var i = 0; i < eUTxOsDB.length; i += 1) {
        if (!utxos.find(uTxO => uTxO.txHash === eUTxOsDB[i].uTxO.txHash && uTxO.outputIndex === eUTxOsDB[i].uTxO.outputIndex)) {
            eUTxOs.push(eUTxOsDB[i])
        }
    }
    //console.log ("getExtraEUTxOsInDB - result length:  " + eUTxOs.length)
    return eUTxOs
}

//---------------------------------------------------------------

export async function getEUTxO_With_PoolDatum_InEUxTOList(poolInfo: StakingPoolDBInterface, poolID_AC_Lucid: AC, eUTxOs: EUTxO[], checkConsumingOrPreparing?: boolean | undefined): Promise<EUTxO | undefined> {
    var eUTxOs_With_PoolDatum: EUTxO[] = []
    for (var i = 0; i < eUTxOs.length; i += 1) {
        if (isPoolDatum(eUTxOs[i].datum))
            eUTxOs_With_PoolDatum.push(eUTxOs[i])
    }
    //-------------------
    var eUTxOs_With_PoolDatum_And_Token: EUTxO[] = []
    for (var i = 0; i < eUTxOs_With_PoolDatum.length; i += 1) {
        if (isNFT_With_AC_Lucid_InValue(eUTxOs_With_PoolDatum[i].uTxO.assets, poolID_AC_Lucid))
            eUTxOs_With_PoolDatum_And_Token.push(eUTxOs_With_PoolDatum[i])
    }
    //-------------------
    var eUTxOs_With_PoolDatum_And_Token_Availaible: EUTxO[] = []
    for (var i = 0; i < eUTxOs_With_PoolDatum_And_Token.length; i += 1) {
        if (eUTxOs_With_PoolDatum_And_Token[i].isPreparing.plutusDataIndex === 1 && eUTxOs_With_PoolDatum_And_Token[i].isConsuming.plutusDataIndex === 1)
            eUTxOs_With_PoolDatum_And_Token_Availaible.push(eUTxOs_With_PoolDatum_And_Token[i])
    }
    //-------------------
    if (eUTxOs_With_PoolDatum_And_Token_Availaible.length > 1){
        await apiDeleteEUTxOsDBByStakingPool(poolInfo!.name)
        throw "There is an error in EUTxO list in DB. We're updating EUTxO list, please try again later..."
    }
    //-------------------
    if (checkConsumingOrPreparing === true){
        if (eUTxOs_With_PoolDatum_And_Token_Availaible.length == 1){
            return eUTxOs_With_PoolDatum_And_Token_Availaible[0]
        }else if (eUTxOs_With_PoolDatum_And_Token.length == 1){
            throw "EUTxO with PoolDatum is being consumed, wait for next block."
        }else{
            return undefined
        }
    }else{
        if (eUTxOs_With_PoolDatum_And_Token_Availaible.length == 1){
            return eUTxOs_With_PoolDatum_And_Token_Availaible[0]
        }else if (eUTxOs_With_PoolDatum_And_Token.length == 1){
            return eUTxOs_With_PoolDatum_And_Token[0]
        }else{
            return undefined
        }
    }
}

//---------------------------------------------------------------

export function getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid: AC, eUTxOs: EUTxO[], checkConsumingOrPreparing?: boolean | undefined): EUTxO[] {
    var eUTxOs_With_FundDatum: EUTxO[] = []
    for (var i = 0; i < eUTxOs.length; i += 1) {
        if (isFundDatum(eUTxOs[i].datum))
            eUTxOs_With_FundDatum.push(eUTxOs[i])
    }
    //-------------------
    var eUTxOs_With_FundDatum_And_Token: EUTxO[] = []
    for (var i = 0; i < eUTxOs_With_FundDatum.length; i += 1) {
        if (isToken_With_AC_Lucid_InValue(eUTxOs_With_FundDatum[i].uTxO.assets, fundID_AC_Lucid)) {
            eUTxOs_With_FundDatum_And_Token.push(eUTxOs_With_FundDatum[i])
        }
    }
    if (checkConsumingOrPreparing === true){
        var eUTxOs_With_FundDatum_And_Token_And_NotConsumed: EUTxO[] = []
        for (var i = 0; i < eUTxOs_With_FundDatum_And_Token.length; i += 1) {
            if (eUTxOs_With_FundDatum_And_Token[i].isPreparing.plutusDataIndex === 1  && eUTxOs_With_FundDatum_And_Token[i].isConsuming.plutusDataIndex === 1 ){
                eUTxOs_With_FundDatum_And_Token_And_NotConsumed.push(eUTxOs_With_FundDatum_And_Token[i])
            }
        }
        return eUTxOs_With_FundDatum_And_Token_And_NotConsumed
    }else{
        return eUTxOs_With_FundDatum_And_Token;
    }
}

//---------------------------------------------------------------

export function getEUTxOs_With_UserDatum_InEUxTOList(userID_AC_Lucid: AC, eUTxOs: EUTxO[], checkConsumingOrPreparing?: boolean | undefined): EUTxO[] {
    var eUTxOs_With_UserDatum: EUTxO[] = []
    for (var i = 0; i < eUTxOs.length; i += 1) {
        if (isUserDatum(eUTxOs[i].datum))
            eUTxOs_With_UserDatum.push(eUTxOs[i])
    }
    //-------------------
    var eUTxOs_With_UserDatum_And_Token: EUTxO[] = []
    for (var i = 0; i < eUTxOs_With_UserDatum.length; i += 1) {
        if (isNFT_With_AC_Lucid_InValue(eUTxOs_With_UserDatum[i].uTxO.assets, userID_AC_Lucid)) {
            eUTxOs_With_UserDatum_And_Token.push(eUTxOs_With_UserDatum[i])
        }
    }
    if (checkConsumingOrPreparing === true){
        var eUTxOs_With_UserDatum_And_Token_And_NotConsumed: EUTxO[] = []
        for (var i = 0; i < eUTxOs_With_UserDatum_And_Token.length; i += 1) {
            if (eUTxOs_With_UserDatum_And_Token[i].isPreparing.plutusDataIndex === 1  && eUTxOs_With_UserDatum_And_Token[i].isConsuming.plutusDataIndex === 1 ){
                eUTxOs_With_UserDatum_And_Token_And_NotConsumed.push(eUTxOs_With_UserDatum_And_Token[i])
            }
        }
        return eUTxOs_With_UserDatum_And_Token_And_NotConsumed
    }else{
        return eUTxOs_With_UserDatum_And_Token;
    }
}

//---------------------------------------------------------------

export function getEUTxOs_With_UserDatum_InEUxTOList_OfUser(eUTxOs_With_UserDatum: EUTxO[], user: PaymentKeyHash) {
    var eUTxOs_With_UserDatum_OfUser: EUTxO[] = []
    for (var i = 0; i < eUTxOs_With_UserDatum.length; i += 1) {
        const userDatum: UserDatum = eUTxOs_With_UserDatum[i].datum as UserDatum;
        if (userDatum.udUser === user) {
            eUTxOs_With_UserDatum_OfUser.push(eUTxOs_With_UserDatum[i])
        }
    }
    return eUTxOs_With_UserDatum_OfUser;
}

//---------------------------------------------------------------

export function getEUTxO_With_AnyScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid: AC, eUTxOs: EUTxO[]): EUTxO [] {
    //-------------------
    var eUTxOs_With_ScriptDatum: EUTxO[] = []
    for (var i = 0; i < eUTxOs.length; i += 1) {
        if (isScriptDatum(eUTxOs[i].datum))
            eUTxOs_With_ScriptDatum.push(eUTxOs[i])
    }
    //-------------------
    var eUTxOs_With_ScriptDatum_And_Token: EUTxO[] = []
    for (var i = 0; i < eUTxOs_With_ScriptDatum.length; i += 1) {
        if (
            isNFT_With_AC_Lucid_InValue(eUTxOs_With_ScriptDatum[i].uTxO.assets, txID_Master_AddScripts_AC_Lucid)
        ) {
            eUTxOs_With_ScriptDatum_And_Token.push(eUTxOs_With_ScriptDatum[i])
        }
    }
    return eUTxOs_With_ScriptDatum_And_Token;
    //-------------------
}

//---------------------------------------------------------------

export function getEUTxO_With_ScriptDatum_InEUxTOList(scriptID_AC_Lucid: AC, eUTxOs_With_ScriptDatum: EUTxO[], checkConsumingOrPreparing?: boolean | undefined): EUTxO | undefined {
    //-------------------
    var eUTxOs_With_ScriptDatum_And_Token: EUTxO[] = []
    for (var i = 0; i < eUTxOs_With_ScriptDatum.length; i += 1) {
        if (
            isNFT_With_AC_Lucid_InValue(eUTxOs_With_ScriptDatum[i].uTxO.assets, scriptID_AC_Lucid)
        ) {
            eUTxOs_With_ScriptDatum_And_Token.push(eUTxOs_With_ScriptDatum[i])
        }
    }
    //-------------------
    if (eUTxOs_With_ScriptDatum_And_Token.length > 0){
        for (var i = 0; i < eUTxOs_With_ScriptDatum_And_Token.length; i += 1) {
            if (Boolean(eUTxOs_With_ScriptDatum_And_Token[i].uTxO.scriptRef)){
                if (checkConsumingOrPreparing === true){
                    if (eUTxOs_With_ScriptDatum_And_Token[i].isPreparing.plutusDataIndex === 1  && eUTxOs_With_ScriptDatum_And_Token[i].isConsuming.plutusDataIndex === 1 ){
                        return eUTxOs_With_ScriptDatum_And_Token[i]
                    }
                }else{
                    return eUTxOs_With_ScriptDatum_And_Token[i]
                }
            }
        }
        return undefined
    }else{
        return undefined
    }
}


// export function getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid: AC, scriptID_AC_Lucid: AC, eUTxOs: EUTxO[], checkConsumingOrPreparing?: boolean | undefined): EUTxO | undefined {
//     //-------------------
//     var eUTxOs_With_ScriptDatum: EUTxO[] = []
//     for (var i = 0; i < eUTxOs.length; i += 1) {
//         if (isScriptDatum(eUTxOs[i].datum))
//             eUTxOs_With_ScriptDatum.push(eUTxOs[i])
//     }
//     //-------------------
//     var eUTxOs_With_ScriptDatum_And_Token: EUTxO[] = []
//     for (var i = 0; i < eUTxOs_With_ScriptDatum.length; i += 1) {
//         if (
//             isNFT_With_AC_Lucid_InValue(eUTxOs_With_ScriptDatum[i].uTxO.assets, txID_Master_AddScripts_AC_Lucid) &&
//             isNFT_With_AC_Lucid_InValue(eUTxOs_With_ScriptDatum[i].uTxO.assets, scriptID_AC_Lucid)
//         ) {
//             eUTxOs_With_ScriptDatum_And_Token.push(eUTxOs_With_ScriptDatum[i])
//         }
//     }
//     //-------------------
//     if (eUTxOs_With_ScriptDatum_And_Token.length > 0){
//         for (var i = 0; i < eUTxOs_With_ScriptDatum_And_Token.length; i += 1) {
//             if (Boolean(eUTxOs_With_ScriptDatum_And_Token[i].uTxO.scriptRef)){
//                 if (checkConsumingOrPreparing === true){
//                     if (eUTxOs_With_ScriptDatum_And_Token[i].isPreparing.plutusDataIndex === 1  && eUTxOs_With_ScriptDatum_And_Token[i].isConsuming.plutusDataIndex === 1 ){
//                         return eUTxOs_With_ScriptDatum_And_Token[i]
//                     }
//                 }else{
//                     return eUTxOs_With_ScriptDatum_And_Token[i]
//                 }
//             }
//         }
//         return undefined
//     }else{
//         return undefined
//     }
// }

//---------------------------------------------------------------

