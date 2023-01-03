import { Assets, Lucid, UTxO } from "lucid-cardano";
import { AC, BIGINT, CS, EUTxO, FundDatum, Master_Funder, Maybe, PoolDatum, POSIXTime, ScriptDatum, TxOutRef, UserDatum } from "../types";
import { searchValueInArray, toJson } from "./utils";

//---------------------------------------------------------------

//for adding two Assets into one
export function addAssets(as1: Assets, as2: Assets) {

    var units1 = Object.keys(as1);
    var units2 = Object.keys(as2);

    var res: Assets = {}

    for (var i = 0; i < units1.length; i++) {
        res[units1[i]] = as1[units1[i]]
    }

    for (var i = 0; i < units2.length; i++) {
        if (searchValueInArray(units1, units2[i])) {
            res[units2[i]] = as2[units2[i]] + as1[units2[i]]
        } else {
            res[units2[i]] = as2[units2[i]]
        }
    }

    var units3 = Object.keys(res);
    var res2: Assets = {}

    for (var i = 0; i < units3.length; i++) {
        if (res[units3[i]] != 0n) {
            res2[units3[i]] = res[units3[i]]
        }
    }

    return res2
}

//----------------------------------------------------------------------

export function addAssetsList(assetsList: Assets[]) {

    var res: Assets = {}

    for (var i = 0; i < assetsList.length; i++) {
        const as1 = assetsList[i]
        const units1 = Object.keys(as1);
        const units2 = Object.keys(res);
        res = addAssets(as1, res)
    }

    return res
}

//----------------------------------------------------------------------

export function subsAssets(as1: Assets, as2: Assets) {

    var units1 = Object.keys(as1);
    var units2 = Object.keys(as2);

    var res: Assets = {}

    for (var i = 0; i < units1.length; i++) {
        res[units1[i]] = as1[units1[i]]
    }

    for (var i = 0; i < units2.length; i++) {
        if (searchValueInArray(units1, units2[i])) {
            res[units2[i]] = res[units2[i]] - as2[units2[i]]
        } else {
            res[units2[i]] = - as2[units2[i]]
        }
    }

    var units3 = Object.keys(res);
    var res2: Assets = {}

    for (var i = 0; i < units3.length; i++) {
        if (res[units3[i]] != 0n) {
            res2[units3[i]] = res[units3[i]]
        }
    }

    return res2
}

//---------------------------------------------------------------

// Get new value from utxos substracting a value
export function subAssetsFromUtxos(utxos: UTxO[], value: Assets): Assets {
    let utxoVal: Assets = {};
    let valKs = Object.keys(value)
    utxos.forEach((u) => {
        let assets: Assets = u.assets;
        let ks = Object.keys(assets)
        ks.forEach((k) => {
            let kVal = assets[k]
            kVal = kVal != undefined ? kVal : 0n;
            let uVal = utxoVal[k];
            uVal = uVal != undefined ? uVal : 0n;
            utxoVal[k] = BigInt(kVal.toString()) + BigInt(uVal.toString())
        });
    });
    valKs.forEach((k) => {
        let kVal = value[k]
        kVal = kVal != undefined ? kVal : 0n;
        let uVal = utxoVal[k]
        uVal = uVal != undefined ? uVal : 0n;
        if (kVal > uVal) {
            throw 'Subtraction Failed.';
        }
        utxoVal[k] = BigInt(uVal.toString()) - BigInt(kVal.toString())
    })
    return utxoVal;
}

//---------------------------------------------------------------

export function sumTokensAmt_From_CS(assets: Assets, token_CS: CS): BIGINT {
    let total: BIGINT = 0n;
    for (const [key, value] of Object.entries(assets)) {
        const CS_ = key.slice(0, 56)
        if (token_CS == CS_) {
            total += value
        }
    }
    return total
}

//---------------------------------------------------------------

export function sumTokensAmt_From_AC_Lucid(assets: Assets, token_AC_Lucid: AC): BIGINT {
    let total: BIGINT = 0n;
    for (const [key, value] of Object.entries(assets)) {
        const AC_ = key
        if (token_AC_Lucid == AC_) {
            total += value
        }
    }
    return total
}

//---------------------------------------------------------------

export function createValue_Adding_Tokens_Of_AC_Lucid(uTxOsAtWallet: UTxO[], aC_Lucid: AC, amount: BIGINT) {

    // console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - unit: " + unit + " - amount: " + amount)

    const CS = aC_Lucid.slice(0, 56)
    const TN = aC_Lucid.slice(56)

    const isAda = (aC_Lucid === 'lovelace')
    const isWithoutTokenName = !isAda && TN == ""

    var assets: Assets = {}

    // console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - isAda: " + isAda + " - isWithoutTokenName: " + isWithoutTokenName)

    if (isWithoutTokenName) {

        let total: BIGINT = 0n;

        uTxOsAtWallet.forEach(u => {

            if (total < amount) {

                for (const [key, value] of Object.entries(u.assets)) {

                    if (total < amount) {

                        const CS_ = key.slice(0, 56)

                        if (CS == CS_) {
                            //console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - CS: " + CS + " - CS_: " + CS_ + " - value: " + value)

                            if (total + value < amount) {
                                total += value
                                assets[key] = value
                            } else if (total + value == amount) {
                                total += value
                                assets[key] = value
                                return assets
                            } else {
                                const rest = amount - total
                                total += rest
                                assets[key] = rest
                                return assets
                            }
                        }
                    }
                }
            }

        })
    } else {
        assets[aC_Lucid] = amount
    }

    // console.log("storeWallet - createValue_Adding_Tokens_Of_AC_Lucid - assets: " + toJson( assets))

    return assets
}

//---------------------------------------------------------------

export function getAssetsFromCS(assets: Assets, token_CS: CS): Assets {
    let assetsRes: Assets = {};
    for (const [key, value] of Object.entries(assets)) {
        const CS_ = key.slice(0, 56)
        if (token_CS == CS_) {
            assetsRes[key] = value
        }
    }
    return assetsRes
}

//---------------------------------------------------------------

export function isNFT_With_AC_Lucid_InValue(assets: Assets, aC_Lucid: AC) {
    if (aC_Lucid in assets) {
        if (assets[aC_Lucid] == 1n) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

//---------------------------------------------------------------

export function isToken_With_AC_Lucid_InValue(assets: Assets, aC_Lucid: AC) {
    if (aC_Lucid in assets) {
        if (assets[aC_Lucid] > 0n) {
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

//---------------------------------------------------------------

//for finding UTxO that is different to txOutRef
export function find_UTxO_Excluding_UTxO_In_UTxOs(uTxO: UTxO, UTxOs: UTxO[]) {

    for (var i = 0; i < UTxOs.length; i++) {
        if (UTxOs[i] != uTxO) return UTxOs[i]
    }

    return undefined
}

//---------------------------------------------------------------

//for finding UTxO that is different to txOutRef
export function find_UTxO_Excluding_TxOutRef_In_UTxOs(txOutRef: TxOutRef, UTxOs: UTxO[]) {

    for (var i = 0; i < UTxOs.length; i++) {
        if (UTxOs[i].txHash != txOutRef.txHash || UTxOs[i].outputIndex != txOutRef.outputIndex) {
            return UTxOs[i]
        }
    }
    return undefined
}

//---------------------------------------------------------------

//for finding UTxO that match the txOutRef. Is just the same txOutRef with more data.

export function find_TxOutRef_In_UTxOs(txOutRef: TxOutRef, uTxOs: UTxO[]) {

    for (var i = 0; i < uTxOs.length; i++) {
        if (uTxOs[i].txHash == txOutRef.txHash && uTxOs[i].outputIndex == txOutRef.outputIndex) {
            return uTxOs[i]
        }
    }

    return undefined
}

//---------------------------------------------------------------

//for finding UTxO that match the txOutRef. Is just the same txOutRef with more data.

export function find_EUTxO_In_EUTxOs(eUTxO: EUTxO, eUTxOs: EUTxO[]) {

    for (var i = 0; i < eUTxOs.length; i++) {
        if (eUTxOs[i].uTxO.txHash == eUTxO.uTxO.txHash && eUTxOs[i].uTxO.outputIndex == eUTxO.uTxO.outputIndex) {
            return eUTxOs[i]
        }
    }

    return undefined
}

//------------------------------------------------------

export async function findDatumIfMissing(lucid: Lucid, uTxO: UTxO): Promise<UTxO> {
    //console.log ("findDatumIfMissing")
    if (uTxO.datumHash && !uTxO.datum) {
        console.log ("findDatumIfMissing - searching datumHash in Database: " + uTxO.datumHash)
        const datum = await apiGetDatumDB(uTxO.datumHash);
        if (datum) {
            console.log ("findDatumIfMissing - datum in Database: " + uTxO.datum)
            uTxO.datum = datum;
        } else {
            console.log ("findDatumIfMissing - looking for datumHash in lucid")
            uTxO.datum = await lucid.provider.getDatum(uTxO.datumHash);
            if (uTxO.datum) {
                //console.log ("findDatumIfMissing - datum in lucid: " + uTxO.datum )
                console.log ("findDatumIfMissing - saving datumHash in Database")
                await apiSaveDatumDB(uTxO.datumHash, uTxO.datum);
            } else {
                console.error ("findDatumIfMissing - datumHash not found in lucid" )
            }
        }
        return uTxO;
    }
    return uTxO;
}

//------------------------------------------------------

export async function apiGetDatumDB(datumHash: string) {
    let data = {
        datumHash: datumHash
    };
    const urlApi = "/api/getDatum";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    const datum = json.datum;
    switch (response.status) {
        case 500:
            console.error("apiGetDatumDB - /api/getDatum - Error 500")
            throw "Error 500";
        case 400:
            console.error("apiGetDatumDB - /api/getDatum - Error: " + message)
            throw message;
        default:
            console.error("apiGetDatumDB - /api/getDatum: Error Unknown")
            throw "Error Unknown";
        case 201:
            //console.log ("apiGetDatumDB - /api/getDatum: " + message)
            return undefined;
        case 200:
            //console.log ("apiGetDatumDB - /api/getDatum: " + message)
            return datum;
    }
}

//------------------------------------------------------

export async function apiSaveDatumDB(datumHash: string, datum: string) {
    let data = {
        datumHash: datumHash,
        datum: datum
    };
    const urlApi = "/api/saveDatum";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;

    switch (response.status) {
        case 500:
            console.error("apiSaveDatumDB - /api/saveDatum - Error 500")
            throw "Error 500";
        case 400:
            console.error("apiSaveDatumDB - /api/saveDatum - Error: " + message)
            throw message;
        default:
            console.error("apiSaveDatumDB - /api/saveDatum: Error Unknown")
            throw "Error Unknown";
        case 201:
            // console.log ("apiSaveDatumDB - /api/saveDatum: " + message)
            return
        case 200:
            //console.log ("apiSaveDatumDB - /api/saveDatum: " + message)
            return;
    }
}

//------------------------------------------------------

export async function apiGetEUTxOsDBByAddress(address: string) {
    let data = {
        address: address
    };
    const urlApi = "/api/getEUTxOsByAddress";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    const eUTxOs = json.eUTxOs;
    switch (response.status) {
        case 500:
            console.error("apiGetEUTxOsDBByAddress - /api/getEUTxOsByAddress - Error 500")
            throw "Error 500";
        case 400:
            console.error("apiGetEUTxOsDBByAddress - /api/getEUTxOsByAddress - Error: " + message)
            throw message;
        default:
            console.error("apiGetEUTxOsDBByAddress - /api/getEUTxOsByAddress: Error Unknown")
            throw "Error Unknown";
        case 201:
            // console.log ("apiGetEUTxOsDBByAddress - /api/getEUTxOsByAddress: " + message)
            return [];
        case 200:
            // console.log ("apiGetEUTxOsDBByAddress - /api/getEUTxOsByAddress: " + message)
            for (var i = 0; i < eUTxOs.length; i++) {

                var units = Object.keys(eUTxOs[i].uTxO.assets);

                // console.log ("apiGetEUTxOsDBByAddress - units: " + toJson(units))
                // console.log ("apiGetEUTxOsDBByAddress - units length: " + units.length)

                var res: Assets = {}
                for (var j = 0; j < units.length; j++) {
                    res[units[j]] = BigInt(eUTxOs[i].uTxO.assets[units[j]])
                }

                eUTxOs[i].uTxO.assets = res;

                if (eUTxOs[i].datum.plutusDataIndex == PoolDatum.plutusDataIndex) {
                    var pdClosedAt
                    if (eUTxOs[i].datum.pdClosedAt.plutusDataIndex == 0) {
                        pdClosedAt = new Maybe(BigInt(eUTxOs[i].datum.pdClosedAt.val))
                    } else {
                        pdClosedAt = new Maybe<POSIXTime>()
                    }

                    var masterFunders: Master_Funder[] = []
                    for (var j = 0; j < eUTxOs[i].datum.pdMasterFunders.length; j++) {
                        masterFunders.push(new Master_Funder(
                            eUTxOs[i].datum.pdMasterFunders[j].mfMaster,
                            BigInt(eUTxOs[i].datum.pdMasterFunders[j].mfFundAmount),
                            Number(eUTxOs[i].datum.pdMasterFunders[j].mfClaimedFund),
                            BigInt(eUTxOs[i].datum.pdMasterFunders[j].mfMinAda)
                        ))
                    }

                    eUTxOs[i].datum = new PoolDatum(
                        masterFunders,
                        Number(eUTxOs[i].datum.pdFundCount),
                        BigInt(eUTxOs[i].datum.pdTotalCashedOut),
                        pdClosedAt,
                        Number(eUTxOs[i].datum.pdIsTerminated),
                        BigInt(eUTxOs[i].datum.pdMinAda),
                    )
                }
                if (eUTxOs[i].datum.plutusDataIndex == FundDatum.plutusDataIndex) {
                    eUTxOs[i].datum = new FundDatum(
                        BigInt(eUTxOs[i].datum.fdFundAmount),
                        BigInt(eUTxOs[i].datum.fdCashedOut),
                        BigInt(eUTxOs[i].datum.fdMinAda)
                    )
                }
                if (eUTxOs[i].datum.plutusDataIndex == UserDatum.plutusDataIndex) {
                    var udLastClaimAt
                    if (eUTxOs[i].datum.udLastClaimAt.plutusDataIndex == 0) {
                        udLastClaimAt = new Maybe(BigInt(eUTxOs[i].datum.udLastClaimAt.val))
                    } else {
                        udLastClaimAt = new Maybe<POSIXTime>()
                    }
                    eUTxOs[i].datum = new UserDatum(
                        eUTxOs[i].datum.udUser,
                        BigInt(eUTxOs[i].datum.udInvest),
                        BigInt(eUTxOs[i].datum.udCreatedAt),
                        BigInt(eUTxOs[i].datum.udCashedOut),
                        BigInt(eUTxOs[i].datum.udRewardsNotClaimed),
                        udLastClaimAt,
                        BigInt(eUTxOs[i].datum.udMinAda)
                    )
                }
                if (eUTxOs[i].datum.plutusDataIndex == ScriptDatum.plutusDataIndex) {
                    eUTxOs[i].datum = new ScriptDatum(eUTxOs[i].datum.sdMaster)
                }
            }
            return eUTxOs;
    }
}

//------------------------------------------------------

export async function apiGetEUTxOsDBByAddressAndPkh(address: string, pkh: string) {
    let data = {
        address: address,
        pkh: pkh
    };
    const urlApi = "/api/getEUTxOsByAddressAndPkh";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    const eUTxOs = json.eUTxOs;
    switch (response.status) {
        case 500:
            console.error("apiGetEUTxOsDBByAddressAndPkh - /api/getEUTxOsByAddressAndPkh - Error 500")
            throw "Error 500";
        case 400:
            console.error("apiGetEUTxOsDBByAddressAndPkh - /api/getEUTxOsByAddressAndPkh - Error: " + message)
            throw message;
        default:
            console.error("apiGetEUTxOsDBByAddressAndPkh - /api/getEUTxOsByAddressAndPkh: Error Unknown")
            throw "Error Unknown";
        case 201:
            // console.log ("apiGetEUTxOsDBByAddressAndPkh - /api/getEUTxOsByAddressAndPkh: " + message)
            return [];
        case 200:
            // console.log ("apiGetEUTxOsDBByAddressAndPkh - /api/getEUTxOsByAddressAndPkh: " + message)
            for (var i = 0; i < eUTxOs.length; i++) {

                var units = Object.keys(eUTxOs[i].uTxO.assets);

                // console.log ("apiGetEUTxOsDBByAddressAndPkh - units: " + toJson(units))
                // console.log ("apiGetEUTxOsDBByAddressAndPkh - units length: " + units.length)

                var res: Assets = {}
                for (var j = 0; j < units.length; j++) {
                    res[units[j]] = BigInt(eUTxOs[i].uTxO.assets[units[j]])
                }

                eUTxOs[i].uTxO.assets = res;

                if (eUTxOs[i].datum.plutusDataIndex == PoolDatum.plutusDataIndex) {
                    var pdClosedAt
                    if (eUTxOs[i].datum.pdClosedAt.plutusDataIndex == 0) {
                        pdClosedAt = new Maybe(BigInt(eUTxOs[i].datum.pdClosedAt.val))
                    } else {
                        pdClosedAt = new Maybe<POSIXTime>()
                    }

                    var masterFunders: Master_Funder[] = []
                    for (var j = 0; j < eUTxOs[i].datum.pdMasterFunders.length; j++) {
                        masterFunders.push(new Master_Funder(
                            eUTxOs[i].datum.pdMasterFunders[j].mfMaster,
                            BigInt(eUTxOs[i].datum.pdMasterFunders[j].mfFundAmount),
                            Number(eUTxOs[i].datum.pdMasterFunders[j].mfClaimedFund),
                            BigInt(eUTxOs[i].datum.pdMasterFunders[j].mfMinAda)
                        ))
                    }

                    eUTxOs[i].datum = new PoolDatum(
                        masterFunders,
                        Number(eUTxOs[i].datum.pdFundCount),
                        BigInt(eUTxOs[i].datum.pdTotalCashedOut),
                        pdClosedAt,
                        Number(eUTxOs[i].datum.pdIsTerminated),
                        BigInt(eUTxOs[i].datum.pdMinAda),
                    )
                }
                if (eUTxOs[i].datum.plutusDataIndex == FundDatum.plutusDataIndex) {
                    eUTxOs[i].datum = new FundDatum(
                        BigInt(eUTxOs[i].datum.fdFundAmount),
                        BigInt(eUTxOs[i].datum.fdCashedOut),
                        BigInt(eUTxOs[i].datum.fdMinAda)
                    )
                }
                if (eUTxOs[i].datum.plutusDataIndex == UserDatum.plutusDataIndex) {
                    var udLastClaimAt
                    if (eUTxOs[i].datum.udLastClaimAt.plutusDataIndex == 0) {
                        udLastClaimAt = new Maybe(BigInt(eUTxOs[i].datum.udLastClaimAt.val))
                    } else {
                        udLastClaimAt = new Maybe<POSIXTime>()
                    }
                    eUTxOs[i].datum = new UserDatum(
                        eUTxOs[i].datum.udUser,
                        BigInt(eUTxOs[i].datum.udInvest),
                        BigInt(eUTxOs[i].datum.udCreatedAt),
                        BigInt(eUTxOs[i].datum.udCashedOut),
                        BigInt(eUTxOs[i].datum.udRewardsNotClaimed),
                        udLastClaimAt,
                        BigInt(eUTxOs[i].datum.udMinAda)
                    )
                }
                if (eUTxOs[i].datum.plutusDataIndex == ScriptDatum.plutusDataIndex) {
                    eUTxOs[i].datum = new ScriptDatum(eUTxOs[i].datum.sdMaster)
                }
            }
            return eUTxOs;
    }
}

//------------------------------------------------------

export async function apiSaveEUTxODB(eUTxO: EUTxO) {
    let data = {
        eUTxO: eUTxO,
    };
    const urlApi = "/api/saveEUTxO";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    switch (response.status) {
        case 500:
            console.error("apiSaveEUTxODB - /api/saveEUTxO - Error 500")
            throw "Error 500";
        case 400:
            console.error("apiSaveEUTxODB - /api/saveEUTxO - Error: " + message)
            throw message;
        default:
            console.error("apiSaveEUTxODB - /api/saveEUTxO: Error Unknown")
            throw "Error Unknown";
        case 201:
            // console.log ("apiSaveEUTxODB - /api/saveEUTxO: " + message)
            return
        case 200:
            // console.log ("apiSaveEUTxODB - /api/saveEUTxOs: " + message)
            return;
    }
}


export async function apiUpdateEUTxODBIsPreparing(eUTxO: EUTxO) {
    let data = {
        eUTxO: eUTxO,
    };
    const urlApi = "/api/updateEUTxOIsPreparing";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    switch (response.status) {
        case 500:
            console.error("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing - Error 500")
            throw "Error 500";
        case 400:
            console.error("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing - Error: " + message)
            throw message;
        default:
            console.error("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing: Error Unknown")
            throw "Error Unknown";
        case 201:
            // console.log ("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing: " + message)
            return;
        case 200:
            // console.log ("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing: " + message)
            return;
    }
}

export async function apiUpdateEUTxODBIsConsuming(eUTxO: EUTxO) {
    let data = {
        eUTxO: eUTxO,
    };
    const urlApi = "/api/updateEUTxOIsConsuming";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    switch (response.status) {
        case 500:
            console.error("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming - Error 500")
            throw "Error 500";
        case 400:
            console.error("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming - Error: " + message)
            throw message;
        default:
            console.error("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming: Error Unknown")
            throw "Error Unknown";
        case 201:
            // console.log ("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming: " + message)
            return;
        case 200:
            // console.log ("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming: " + message)
            return;
    }
}

//------------------------------------------------------

export async function apiDeleteEUTxOsDBPreparingOrConsumingByAddress(address: string) {
    let data = {
        address: address
    };
    const urlApi = "/api/deleteEUTxOsPreparingOrConsumingByAddress";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    switch (response.status) {
        case 400:
            console.error("apiDeleteEUTxOsDBPreparingOrConsumingByAddress - /api/deleteEUTxOsPreparingOrConsumingByAddress - Error: " + message)
            throw message;
        default:
            console.error("apiDeleteEUTxOsDBPreparingOrConsumingByAddress - /api/deleteEUTxOsPreparingOrConsumingByAddress: Error Unknown")
            throw "Error Unknown";
        case 200:
            // console.log ("apiDeleteEUTxOsDBPreparingOrConsumingByAddress - /api/deleteEUTxOsPreparingOrConsumingByAddress: " + message)
            return
    }
}

//------------------------------------------------------

export async function apiDeleteEUTxOsDBByAddress(address: string) {
    let data = {
        address: address
    };
    const urlApi = "/api/deleteEUTxOsByAddress";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    switch (response.status) {
        case 400:
            console.error("apiDeleteEUTxOsDBByAddress - /api/deleteEUTxOsByAddress - Error: " + message)
            throw message;
        default:
            console.error("apiDeleteEUTxOsDBByAddress - /api/deleteEUTxOsByAddress: Error Unknown")
            throw "Error Unknown";
        case 200:
            // console.log ("apiDeleteEUTxOsDBByAddress - /api/deleteEUTxOsByAddress: " + message)
            return
    }
}

//------------------------------------------------------

export async function apiDeleteEUTxODB(eUTxO: EUTxO) {
    let data = {
        eUTxO: eUTxO,
    };
    const urlApi = "/api/deleteEUTxO";
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };
    const response = await fetch(urlApi, requestOptions);
    const json = await response.json();
    const message = json.msg;
    switch (response.status) {
        case 400:
            console.error("apiDeleteEUTxOsDB - /api/deleteEUTxO - Error: " + message)
            throw message;
        default:
            console.error("apiDeleteEUTxOsDB - /api/deleteEUTxO: Error Unknown")
            throw "Error Unknown";
        case 200:
            // console.log ("apiDeleteEUTxOsDB - /api/deleteEUTxO: " + message)
            return
    }
}

//---------------------------------------------------------------

export function calculateMinAda(numAssets: number, sumAssetNameLengths: number, numPIDs: number, isHash: boolean): BIGINT {
    //Fixed parameters
    const minUTxOValue = 1000000;
    //ADA	The minimum number of ADA that must be present in ADA-only UTxOs.
    const pidSize = 28;
    //Bytes	The number of bytes in a policy ID.
    const coinSize = 2;
    //Bytes	At the Alonzo HFC, this parameter was corrected to be 2 because the original value 0 was an implementation error.
    const utxoEntrySizeWithoutVal = 27;
    //Bytes	The number of bytes in a transaction if there were no value at all in it.
    const adaOnlyUTxOSize = Math.round(utxoEntrySizeWithoutVal + coinSize);
    //Bytes	The number of bytes in a transaction if it were to only contain ADA.
    const coinsPerUTxOWord = Math.floor(minUTxOValue / adaOnlyUTxOSize); // = 34482 
    const coinsPerUTxOByte = Math.floor(coinsPerUTxOWord / 8); // = 4310.25

    const hash = isHash ? 10 : 0; //si hay data hash suman 10 words

    function roundupBytesToWords(b: number) {
        return Math.floor((b + 7) / 8);
    }

    var sizeWords = 6 + roundupBytesToWords(
        numAssets * 12 +
        sumAssetNameLengths +
        numPIDs * pidSize
    );

    var minAda = Math.max(
        minUTxOValue,
        coinsPerUTxOWord * (utxoEntrySizeWithoutVal + sizeWords + hash)
    );

    minAda = Math.floor(130 * minAda / 100); // 10% mas

    //TODO usando calculo de min ada anterior, es que si uso el nuevo calculo, cuando la construyo a la tx los min ada son mayores y me cambia todo.
    // en cambio con el calculo anterior, los min ada mio son buenos y quedan.
    // var minAda2 = 
    //   Math.max(
    //     minUTxOValue,
    //     coinsPerUTxOByte * (160 + (sizeWords + hash) * 8 )
    //   )
    // console.log ("calculateMinAda - numPIDs: " + numPIDs + " numAssets: " + numAssets + " sumAssetNameLengths: " + sumAssetNameLengths + " = " + minAda)
    //   console.log ("calculateMinAda - minAda1: " + minAda1)
    //   console.log ("calculateMinAda - minAda2: " + minAda2)
    return BigInt(minAda);
}

//---------------------------------------------------------------

export function calculateMinAdaOfAssets(assets: Assets, isHash: boolean): BIGINT {

    var numPIDs: number = 0, numAssets: number = 0, sumAssetNameLengths: number = 0;
    var pIds = [];

    for (const [key, value] of Object.entries(assets)) {
        if (key !== "lovelace") {
            var pId = key.slice(0, 56);
            var tn = key.slice(56);
            if (!searchValueInArray(pIds, pId)) {
                pIds.push(pId);
                numPIDs++;
            }
            sumAssetNameLengths += tn.length / 2;
            numAssets++;
        }
    }

    const minAda = calculateMinAda(numAssets, sumAssetNameLengths, numPIDs, isHash);

    return minAda;
}

//---------------------------------------------------------------


