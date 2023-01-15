import { AC, AssetClass, EUTxO } from "../types";
import { StakingPoolDBInterface } from "../types/stakePoolDBModel";
import { toJson } from "../utils/utils";
import { eUTxODBParser } from "./helpersEUTxOs";
import { stakingPoolDBParser } from "./helpersStakePool";

//----------------------------------------------------------------------

export async function getEstadoDeployAPI(nombrePool: string) {

    let data = {
        nombrePool: nombrePool
    };

    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/getEstadoDeploy";

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
            console.error("getEstadoDeploy - api/getEstadoDeploy - Error 500")
            throw "Error 500";
        case 400:
            console.error("getEstadoDeploy - api/getEstadoDeploy - Error: " + message);
            throw message;
        default:
            console.error("getEstadoDeploy - api/getEstadoDeploy: Error Unknown")
            throw "Error Unknown";
        case 200:
            console.log("getEstadoDeploy - api/getEstadoDeploy: " + message);
            return message;
    }
}

//------------------------------------------------------

export async function apiGetDatumDB(datumHash: string) {
    let data = {
        datumHash: datumHash
    };
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/getDatum";
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
            console.error("apiGetDatumDB - /api/getDatum - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiGetDatumDB - /api/getDatum - Error: " + message);
            throw message;
        default:
            console.error("apiGetDatumDB - /api/getDatum: Error Unknown");
            throw "Error Unknown";
        case 201:
            //console.log ("apiGetDatumDB - /api/getDatum: " + message)
            return undefined;
        case 200:
            //console.log ("apiGetDatumDB - /api/getDatum: " + message)
            const datum = json.datum;
            return datum;
    }
}

//------------------------------------------------------

export async function apiSaveDatumDB(datumHash: string, datum: string) {
    let data = {
        datumHash: datumHash,
        datum: datum
    };
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/saveDatum";
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
            console.error("apiSaveDatumDB - /api/saveDatum - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiSaveDatumDB - /api/saveDatum - Error: " + message);
            throw message;
        default:
            console.error("apiSaveDatumDB - /api/saveDatum: Error Unknown");
            throw "Error Unknown";
        case 201:
            // console.log ("apiSaveDatumDB - /api/saveDatum: " + message)
            return;
        case 200:
            //console.log ("apiSaveDatumDB - /api/saveDatum: " + message)
            return;
    }
}

//------------------------------------------------------

export async function apiGetDatumsCountDB() {
    let data = undefined
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/getAllDatumsCount";
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
            console.error("apiGetDatumsCountDB - /api/getAllDatumsCount - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiGetDatumsCountDB - /api/getAllDatumsCount - Error: " + message);
            throw message;
        default:
            console.error("apiGetDatumsCountDB - /api/getAllDatumsCount: Error Unknown");
            throw "Error Unknown";
        case 201:
            // console.log ("apiGetDatumsCountDB - /api/getAllDatumsCount: " + message)
            return;
        case 200:
            //console.log ("apiGetDatumsCountDB - /api/getAllDatumsCount: " + message)
            const count = json.count;
            return count;
    }
}

//------------------------------------------------------


export async function apiDeleteAllDatumDB() {
    let data = undefined
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/deleteAllDatums";
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
            console.error("apiDeleteAllDatumDB - /api/deleteAllDatums - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiDeleteAllDatumDB - /api/deleteAllDatums - Error: " + message);
            throw message;
        default:
            console.error("apiDeleteAllDatumDB - /api/deleteAllDatums: Error Unknown");
            throw "Error Unknown";
        case 201:
            // console.log ("apiDeleteAllDatumDB - /api/deleteAllDatums: " + message)
            return;
        case 200:
            //console.log ("apiDeleteAllDatumDB - /api/deleteAllDatums: " + message)
            return;
    }
}

//----------------------------------------------------------------------

export async function apiCreateStakingPoolDB(data: any) {

    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/createStakingPool"

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: toJson(data)
    };

    const response = await fetch(urlApi, requestOptions)
    const json = await response.json()
    const message = json.msg

    switch (response.status) {
        case 500:
            console.error("apiCreateStakingPoolDB - api/createStakingPool: Error 500")
            throw "Error 500";
        case 400:
            console.error("apiCreateStakingPoolDB - api/createStakingPool - Error: " + message)
            throw message;
        default:
            console.error("apiCreateStakingPoolDB - api/createStakingPool: Error Unknown")
            throw "Error Unknown";
        case 200:
            console.log("apiCreateStakingPoolDB - api/createStakingPool: " + message)
            const stakingPool : StakingPoolDBInterface = stakingPoolDBParser(json.stakingPool)
            return stakingPool
    }
}

//------------------------------------------------------

export async function apiGetStakingPoolDB(nombrePool: string)  {
    console.log("apiGetStakingPoolDB - /api/getStakingPool - get: " + nombrePool)
    
    let data = {
        nombrePool: nombrePool
    }

    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/getStakingPool";

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
            console.error("apiGetStakingPoolDB - /api/getStakingPool - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiGetStakingPoolDB - /api/getStakingPool - Error: " + message);
            throw message;
        default:
            console.error("apiGetStakingPoolDB - api/getStakingPool: Error Unknown")
            throw "Error Unknown";
        case 200:
            console.log("apiGetStakingPoolDB - /api/getStakingPool: " + message)
            const stakingPool : StakingPoolDBInterface = stakingPoolDBParser(json.stakingPool)
            return stakingPool
    }

}

//------------------------------------------------------

export async function apiUpdateStakingPoolShowOnHomeDB(nombrePool: string, swShowOnHome: boolean = true) {

    let data = {
        nombrePool: nombrePool,
        swShowOnHome: swShowOnHome,
    }

    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/updateStakingPoolShowOnHome";

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
            console.error("apiUpdateStakingPoolShowOnHomeDB - /api/updateStakingPoolShowOnHome - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiUpdateStakingPoolShowOnHomeDB - /api/updateStakingPoolShowOnHome - Error: " + message);
            throw message;
        default:
            console.error("apiUpdateStakingPoolShowOnHomeDB - api/updateStakingPoolShowOnHome: Error Unknown")
            throw "Error Unknown";
        case 200:
            console.log("apiUpdateStakingPoolShowOnHomeDB - /api/updateStakingPoolShowOnHome: " + message)
            const stakingPool : StakingPoolDBInterface = stakingPoolDBParser(json.stakingPool)
            return stakingPool;
    }
}

//------------------------------------------------------

export async function apiDeleteStakingPoolDB(nombrePool: string) {

    let data = {
        nombrePool: nombrePool
    };

    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/deleteStakingPool";

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
            console.error("apiDeleteStakingPool - /api/deleteStakingPool - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiDeleteStakingPool - /api/deleteStakingPool - Error: " + message);
            throw message;
        default:
            console.error("apiDeleteStakingPool - api/deleteStakingPool: Error Unknown")
            throw "Error Unknown";
        case 200:
            //console.log("apiDeleteStakingPool - /api/deleteStakingPool: " + message)
            return message;
    }
}

//------------------------------------------------------

export async function apiSaveEUTxODB(eUTxO: EUTxO) {
    let data = {
        eUTxO: eUTxO,
    };
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/saveEUTxO";
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
            console.error("apiSaveEUTxODB - /api/saveEUTxO - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiSaveEUTxODB - /api/saveEUTxO - Error: " + message);
            throw message;
        default:
            console.error("apiSaveEUTxODB - /api/saveEUTxO: Error Unknown");
            throw "Error Unknown";
        case 201:
            // console.log ("apiSaveEUTxODB - /api/saveEUTxO: " + message)
            return;
        case 200:
            // console.log ("apiSaveEUTxODB - /api/saveEUTxOs: " + message)
            return;
    }
}

//------------------------------------------------------

export async function apiUpdateEUTxODBIsPreparing(eUTxO: EUTxO, isPreparing: boolean) {
    let data = {
        txHash: eUTxO.uTxO.txHash,
        outputIndex: eUTxO.uTxO.outputIndex,
        isPreparing: isPreparing,
    };
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/updateEUTxOIsPreparing";
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
            console.error("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing - Error: " + message);
            throw message;
        default:
            console.error("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing: Error Unknown");
            throw "Error Unknown";
        case 201:
            // console.log ("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing: " + message)
            return eUTxO
        case 200:
            // console.log ("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing: " + message)
            const eUTxOUpdated : EUTxO = eUTxODBParser(json.eUTxO)!
            return eUTxOUpdated
    }
}

//------------------------------------------------------

export async function apiUpdateEUTxODBIsConsuming(eUTxO: EUTxO, isConsuming: boolean) {
    let data = {
        txHash: eUTxO.uTxO.txHash,
        outputIndex: eUTxO.uTxO.outputIndex,
        isConsuming: isConsuming,
    };
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/updateEUTxOIsConsuming";
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
            console.error("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming - Error 500");
            throw "Error 500";
        case 400:
            console.error("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming - Error: " + message);
            throw message;
        default:
            console.error("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming: Error Unknown");
            throw "Error Unknown";
        case 201:
            // console.log ("apiUpdateEUTxODBIsConsuming - /api/updateEUTxOIsConsuming: " + message)
            return eUTxO;
        case 200:
            // console.log ("apiUpdateEUTxODBIsPreparing - /api/updateEUTxOIsPreparing: " + message)
            const eUTxOUpdated : EUTxO = eUTxODBParser(json.eUTxO)!
            return eUTxOUpdated;
    }
}

//------------------------------------------------------

export async function apiGetEUTxOsDBByStakingPool(nombrePool: string) {
    // console.log ("getEUTxOsDBByStakingPool - Init")
    let data = {
        nombrePool: nombrePool
    };
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/getEUTxOsByStakingPool";
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
            console.error("getEUTxOsDBByStakingPool - /api/getEUTxOsByStakingPool - Error 500")
            throw "Error 500";
        case 400:
            console.error("getEUTxOsDBByStakingPool - /api/getEUTxOsByStakingPool - Error: " + message)
            throw message;
        default:
            console.error("getEUTxOsDBByStakingPool - /api/getEUTxOsByStakingPool: Error Unknown")
            throw "Error Unknown";
        case 201:
            // console.log ("getEUTxOsDBByStakingPool - /api/getEUTxOsByStakingPool: " + message)
            return [];
        case 200:
            console.log ("getEUTxOsDBByStakingPool - /api/getEUTxOsByStakingPool: " + message)
            const eUTxOs = json.eUTxOs;
            for (var i = 0; i < eUTxOs.length; i++) {
                eUTxOs[i] = eUTxODBParser(eUTxOs[i])!;
            }

            return eUTxOs;
    }
}

//------------------------------------------------------

export async function apiDeleteEUTxODB(eUTxO: EUTxO) {
    let data = {
        eUTxO: eUTxO,
    };
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/deleteEUTxO";
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
            console.error("apiDeleteEUTxOsDB - /api/deleteEUTxO - Error: " + message);
            throw message;
        default:
            console.error("apiDeleteEUTxOsDB - /api/deleteEUTxO: Error Unknown");
            throw "Error Unknown";
        case 200:
            // console.log ("apiDeleteEUTxOsDB - /api/deleteEUTxO: " + message)
            return;
    }
}

//------------------------------------------------------

export async function apiDeleteEUTxOsDBByStakingPool(nombrePool: string) {
    let data = {
        nombrePool: nombrePool
    };
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/deleteEUTxOsByStakingPool";
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
            console.error("apiDeleteEUTxOsDBByStakingPool - /api/deleteEUTxOsByStakingPool - Error: " + message)
            throw message;
        default:
            console.error("apiDeleteEUTxOsDBByStakingPool - /api/deleteEUTxOsByStakingPool: Error Unknown")
            throw "Error Unknown";
        case 200:
            // console.log ("apiDeleteEUTxOsDBByStakingPool - /api/deleteEUTxOsByStakingPool: " + message)
            return
    }
}

//------------------------------------------------------

export async function apiGetTokenMetadata(token_AC: AssetClass) {
    // console.log("getTokenMetadataFromMintTransaction: " + toJson(token))
    const urlApi = process.env.NEXT_PUBLIC_REACT_SERVER_URL + "/api/blockfrost" + '/assets/' + token_AC.currencySymbol + token_AC.tokenName
    const requestOptions = {
      method: 'GET',
      headers: {
        'project_id': "xxxxx"
      },
    }
    try{
        const response = await fetch(urlApi, requestOptions)
        const json = await response.json()
        //console.log(`apiGetTokenMetadata: ` + toJson(json))
        switch (response.status) {
            case 404:
                console.error("apiGetTokenMetadata - /api/blockfrost - Error: " + toJson(json))
                return undefined;
            case 400:
                console.error("apiGetTokenMetadata - /api/blockfrost - Error: " + toJson(json))
                return undefined;
            default:
                console.error("apiGetTokenMetadata - /api/blockfrost: Error: " + toJson(json))
                return undefined;
            case 200:
                // console.log ("apiGetTokenMetadata - /api/blockfrost: " + message)
                return json;
        }
    }catch(error){
        console.error(`apiGetTokenMetadata - /api/blockfrost: Error : ${error}`)
        return undefined
    }
}

//------------------------------------------------------
