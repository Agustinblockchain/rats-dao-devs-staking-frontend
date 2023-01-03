//--------------------------------------
import { useEffect, useState } from "react";
import { EUTxO, Master_Funder, PoolDatum, UserDatum } from "../types";
import { fundID_TN, poolDatum_ClaimedFund, poolID_TN, scriptID_Master_AddScripts_TN, scriptID_Master_ClosePool_TN, scriptID_Master_DeleteFund_TN, scriptID_Master_DeleteScripts_TN, scriptID_Master_FundAndMerge_TN, scriptID_Master_Fund_TN, scriptID_Master_SendBackDeposit_TN, scriptID_Master_SendBackFund_TN, scriptID_Master_SplitFund_TN, scriptID_Master_TerminatePool_TN, scriptID_User_Deposit_TN, scriptID_User_Harvest_TN, scriptID_User_Withdraw_TN, scriptID_Validator_TN, txID_Master_AddScripts_TN, userID_TN } from "../types/constantes";
import { StakingPoolDBInterface } from "../types/stakePoolDBModel";
import { apiDeleteEUTxOsDBPreparingOrConsumingByAddress, apiGetEUTxOsDBByAddress, apiSaveEUTxODB } from "../utils/cardano-helpers";
import { strToHex, toJson } from "../utils/utils";
import { useStoreState } from "../utils/walletProvider";
import {
    getEUTxOs_With_FundDatum_InEUxTOList, getEUTxOs_With_UserDatum_InEUxTOList,
    getEUTxOs_With_UserDatum_InEUxTOList_OfUser, getEUTxO_With_PoolDatum_InEUxTOList, getEUTxO_With_ScriptDatum_InEUxTOList, getExtendedUTxOsWith_Datum, getMissingEUTxOs
} from "./helpersScripts";
import {
    apiUpdateStakingPoolDB, getIfUserRegistered, getTotalAvailaibleFunds, getTotalCashedOut, getTotalFundAmount, getTotalFundAmountsRemains_ForMasters, getTotalMastersMinAda_In_EUTxOs_With_UserDatum, getTotalRewardsToPay_In_EUTxOs_With_UserDatum, getTotalStakedAmount, getTotalUsersMinAda_In_EUTxOs_With_UserDatum, getUserRewardsPaid,
    getUserRewardsToPay, getUserStaked, sortFundDatum
} from "./helpersStakePool";
//--------------------------------------
export default function useStatePoolData(poolInfo: StakingPoolDBInterface) {
    // console.log("useStatePoolData - " + poolInfo.name + " - INIT")

    type UserStakedData = {
        eUTxO_With_UserDatum: EUTxO | undefined,
        userStaked: string | 0;
        userCreatedAt: string | 0;
        userLastClaimAt: string | 0;
        userRewardsPaid: string | 0;
        userRewardsToPay: string | 0;
        isLoading: boolean;
    }

    //string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
    const ui_loading = 0
    const ui_notConnected = '...'

    const [isPoolDataLoaded, setIsPoolDataLoaded] = useState(false)
    const [isPoolDataLoading, setIsPoolDataLoading] = useState(false)
    // const isPoolDataLoading = useRef(false)
    
    // const setIsPoolDataLoading = (value: boolean) => {
	// 	isPoolDataLoading.current = value
	// }
    // const [swFromDB, setSwFromDB] = useState<string | 0 | boolean>(ui_loading)

    const [swShowOnHome, setShowOnHome] = useState<string | 0 | boolean>(poolInfo.swShowOnHome ? poolInfo.swShowOnHome : ui_loading)

    const [swPreparado, setSwPreparado] = useState<string | 0 | boolean>(poolInfo.swPreparado ? poolInfo.swPreparado : ui_loading)
    const [swIniciado, setSwIniciado] = useState<string | 0 | boolean>(poolInfo.swIniciado ? poolInfo.swIniciado : ui_loading)
    const [swFunded, setSwFunded] = useState<string | 0 | boolean>(poolInfo.swFunded ? poolInfo.swFunded : ui_loading)
    const [swClosed, setSwClosed] = useState<string | 0 | boolean>(poolInfo.swClosed ? poolInfo.swClosed : ui_loading)
    const [swTerminated, setSwTerminated] = useState<string | 0 | boolean>(poolInfo.swTerminated ? poolInfo.swTerminated : ui_loading)
    const [swZeroFunds, setSwZeroFunds] = useState<string | 0 | boolean>(poolInfo.swZeroFunds ? poolInfo.swZeroFunds : ui_loading)
    const [swPoolReadyForDelete, setSwPoolReadyForDelete] = useState<string | 0 | boolean>(poolInfo.swPoolReadyForDelete ? poolInfo.swPoolReadyForDelete : ui_loading)

    const [closedAt, setClosedAt] = useState<string | 0 | Date | undefined>(poolInfo.closedAt !== undefined ? poolInfo.closedAt : ui_loading)

    var terminatedAt_: Date

    if (poolInfo.closedAt !== undefined) {
        terminatedAt_ = new Date(poolInfo.closedAt.getTime() + Number(poolInfo.graceTime))
    } else {
        terminatedAt_ = new Date(poolInfo.deadline.getTime() + Number(poolInfo.graceTime))
    }

    const [terminatedAt, setTerminatedAt] = useState<string | 0 | Date>(terminatedAt_)

    const [eUTxOs_With_Datum, setEUTxOs_With_Datum] = useState<EUTxO[]>([])
    const [countEUTxOs_With_Datum, setCountEUTxOs_With_Datum] = useState<string | 0>(ui_loading)

    const [eUTxO_With_PoolDatum, setEUTxO_With_PoolDatum] = useState<EUTxO | string | 0 | undefined>(ui_loading)
    const [masterFunders, setMasterFunders] = useState<Master_Funder[]>([])

    const [eUTxOs_With_FundDatum, setEUTxOs_With_FundDatum] = useState<EUTxO[]>([])
    const [countEUTxOs_With_FundDatum, setCountEUTxOs_With_FundDatum] = useState<string | 0>(ui_loading)

    const [eUTxOs_With_UserDatum, setEUTxOs_With_UserDatum] = useState<EUTxO[]>([])
    const [countEUTxOs_With_UserDatum, setCountEUTxOs_With_UserDatum] = useState<string | 0>(ui_loading)

    const [eUTxO_With_ScriptDatum, setEUTxO_With_ScriptDatum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_ScriptDatum ? poolInfo.eUTxO_With_ScriptDatum : ui_loading)

    const [eUTxO_With_Script_TxID_Master_Fund_Datum, setEUTxO_With_Script_TxID_Master_Fund_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_FundAndMerge_Datum, setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_SplitFund_Datum, setEUTxO_With_Script_TxID_Master_SplitFund_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_ClosePool_Datum, setEUTxO_With_Script_TxID_Master_ClosePool_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_TerminatePool_Datum, setEUTxO_With_Script_TxID_Master_TerminatePool_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_DeleteFund_Datum, setEUTxO_With_Script_TxID_Master_DeleteFund_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_SendBackFund_Datum, setEUTxO_With_Script_TxID_Master_SendBackFund_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum, setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_AddScripts_Datum, setEUTxO_With_Script_TxID_Master_AddScripts_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_Master_DeleteScripts_Datum, setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum : ui_loading)

    const [eUTxO_With_Script_TxID_User_Deposit_Datum, setEUTxO_With_Script_TxID_User_Deposit_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum ? poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_User_Harvest_Datum, setEUTxO_With_Script_TxID_User_Harvest_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum ? poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum : ui_loading)
    const [eUTxO_With_Script_TxID_User_Withdraw_Datum, setEUTxO_With_Script_TxID_User_Withdraw_Datum] = useState<EUTxO | string | 0 | undefined>(poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum ? poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum : ui_loading)


    const [swUserRegistered, setSwUserRegistered] = useState<boolean>(false)

    const [totalFundAmount, setTotalFundAmount] = useState<string | 0>(ui_loading)
    const [totalFundsAvailable, setTotalAvailaibleFunds] = useState<string | 0>(ui_loading)
    const [totalStaked, setTotalStaked] = useState<string | 0>(ui_loading)
    const [totalRewardsPaid, setTotalRewardsPaid] = useState<string | 0>(ui_loading)
    const [totalRewardsToPay, setTotalRewardsToPay] = useState<string | 0>(ui_loading)

    const [totalFundAmountsRemains_ForMaster, setTotalFundAmountsRemains_ForMaster] = useState<string | 0>(ui_loading)
    
    const [totalMastersMinAda, setTotalMastersMinAda] = useState<string | 0>(ui_loading)
    const [totalUsersMinAda, setTotalUsersMinAda] = useState<string | 0>(ui_loading)

    const [userRegistered, setUserRegistered] = useState<string | 0>(ui_loading)

    const [userStakedDatas, setUserStakedDatas] = useState<UserStakedData[]>([])

    const walletStore = useStoreState(state => state.wallet)

    const { isWalletDataLoaded } = useStoreState(state => {
        return { isWalletDataLoaded: state.isWalletDataLoaded };
    });

    const scriptAddress = poolInfo.scriptAddress

    const setLoading = (ui: string | 0) => {
        // console.log("useStatePoolData - " + poolInfo.name + " - setLoading: " + ui)

        setIsPoolDataLoaded(false)

        // setSwFromDB(ui)
        
        setSwPreparado(poolInfo.swPreparado ? poolInfo.swPreparado : ui)
        setSwIniciado(poolInfo.swIniciado ? poolInfo.swIniciado : ui)
        setSwFunded(poolInfo.swFunded ? poolInfo.swFunded : ui)
        setSwClosed(poolInfo.swClosed ? poolInfo.swClosed : ui)
        setSwTerminated(poolInfo.swTerminated ? poolInfo.swTerminated : ui)
        setSwZeroFunds(poolInfo.swZeroFunds ? poolInfo.swZeroFunds : ui)
        setSwPoolReadyForDelete(poolInfo.swPoolReadyForDelete ? poolInfo.swPoolReadyForDelete : ui)

        setClosedAt(poolInfo.closedAt !== undefined ? poolInfo.closedAt : ui)

        if (poolInfo.closedAt === undefined) {
            setTerminatedAt(ui)
        }

        setEUTxOs_With_Datum([])
        setCountEUTxOs_With_Datum(ui)

        setEUTxO_With_PoolDatum(ui)
        setMasterFunders([])

        // setEUTxOs_With_FundDatum([])
        setCountEUTxOs_With_FundDatum(ui)

        // setEUTxOs_With_UserDatum([])
        setCountEUTxOs_With_UserDatum(ui)

        setEUTxO_With_ScriptDatum(poolInfo.eUTxO_With_ScriptDatum ? poolInfo.eUTxO_With_ScriptDatum : ui)

        setEUTxO_With_Script_TxID_Master_Fund_Datum(poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum : ui)
        setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum(poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum : ui)
        setEUTxO_With_Script_TxID_Master_SplitFund_Datum(poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum : ui)
        setEUTxO_With_Script_TxID_Master_ClosePool_Datum(poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum : ui)
        setEUTxO_With_Script_TxID_Master_TerminatePool_Datum(poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum : ui)
        setEUTxO_With_Script_TxID_Master_DeleteFund_Datum(poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum : ui)
        setEUTxO_With_Script_TxID_Master_SendBackFund_Datum(poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum : ui)
        setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum(poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum : ui)
        setEUTxO_With_Script_TxID_Master_AddScripts_Datum(poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum : ui)
        setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum(poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum ? poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum : ui)

        setEUTxO_With_Script_TxID_User_Deposit_Datum(poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum ? poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum : ui)
        setEUTxO_With_Script_TxID_User_Harvest_Datum(poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum ? poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum : ui)
        setEUTxO_With_Script_TxID_User_Withdraw_Datum(poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum ? poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum : ui)

        setTotalFundAmount(ui)
        setTotalAvailaibleFunds(ui)

        setTotalStaked(ui)
        setTotalRewardsPaid(ui)
        setTotalRewardsToPay(ui)

        setTotalFundAmountsRemains_ForMaster(ui)
        setTotalMastersMinAda(ui)
        setTotalUsersMinAda(ui)

        setUserRegistered(ui)

        setSwUserRegistered(false)

        // var userStakedDatas_: UserStakedData[] = []

        // console.log("useStatePoolData - " + poolInfo.name + " - setLoading: " + ui + " userStakedDatas length: " + userStakedDatas.length)

        // for (var i = 0; i < userStakedDatas.length; i += 1) {
        //     const userStakedData: UserStakedData = {
        //         eUTxO_With_UserDatum: userStakedDatas[i].eUTxO_With_UserDatum,
        //         userStaked: 0,
        //         userCreatedAt: 0,
        //         userLastClaimAt: 0,
        //         userRewardsPaid: 0,
        //         userRewardsToPay: 0,
        //         isLoading: true
        //     }
        //     userStakedDatas_.push(userStakedData)
        // }   

        // // setUserStakedDatas([])
        // setUserStakedDatas(userStakedDatas_)


    }
    
    useEffect(() => {
        // console.log("useStatePoolData - " + poolInfo.name + " - useEffect - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)

        // if (walletStore.connected && !isWalletDataLoaded && !isPoolDataLoaded && !isPoolDataLoading) {
        //     setLoading(ui_loading)
        // } else if (walletStore.connected && isWalletDataLoaded && !isPoolDataLoaded && !isPoolDataLoading) {
        //     console.log("useStatePoolData2 - " + poolInfo.name + " - useEffect - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
        //     loadPoolData()
        // } else 

        if (!walletStore.connected) {
            setLoading(ui_notConnected)
        }


    }, [walletStore.connected])
    
    const loadPoolData = async () => {
        
        console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData - Init")
        
        // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData - isPoolDataLoading: " + isPoolDataLoading)
        
        setIsPoolDataLoading(true)
        setLoading(ui_loading)

        var swUpdate = false
        //------------------
        var swPreparado = poolInfo.swPreparado
        var swIniciado = poolInfo.swIniciado
        var swFunded = poolInfo.swFunded
        var swClosed = poolInfo.swClosed
        var swTerminated = poolInfo.swTerminated
        var swZeroFunds = poolInfo.swZeroFunds
        var swPoolReadyForDelete = poolInfo.swPoolReadyForDelete
        //----
        var closedAt = poolInfo.closedAt
        //------------------
        var poolDatum: PoolDatum | undefined = undefined
        //------------------
        const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
        //------------------
        const fundID_CS = poolInfo.txID_Master_Fund_CS
        const fundID_AC_Lucid = fundID_CS + strToHex(fundID_TN);
        //------------------
        const userID_CS = poolInfo.txID_User_Deposit_CS
        const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
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
        const now = new Date()
        //------------------
        // elimino todas las eutxos que estan en la base de datos marcadas como preparadas o consumidas y que paso el tiempo de espera
        await apiDeleteEUTxOsDBPreparingOrConsumingByAddress(scriptAddress)
        //------------------
        var eUTxOs_With_Datum : EUTxO [] = []
        eUTxOs_With_Datum = await apiGetEUTxOsDBByAddress(scriptAddress);
        console.log("useStatePoolData - eUTxOs - DB - length: " + eUTxOs_With_Datum.length)
        //------------------
        const lucid = walletStore.lucid
        console.log("useStatePoolData - eUTxOs - loading from lucid")
        const uTxOsAtScript = await lucid!.utxosAt(scriptAddress)
        console.log("useStatePoolData - eUTxOs - loaded from lucid")
        //------------------
        if (uTxOsAtScript.length != eUTxOs_With_Datum.length){
            console.log("useStatePoolData - eUTxOs - AtScript not match - length: " + uTxOsAtScript.length)
            var eUTxOs_With_Datum_Missing : EUTxO [] = await getMissingEUTxOs(lucid!, uTxOsAtScript, eUTxOs_With_Datum)   
            //------------------
            try{
                for (let i = 0; i < eUTxOs_With_Datum_Missing.length; i++) {
                    await apiSaveEUTxODB(eUTxOs_With_Datum_Missing[i])
                }
            } catch (error) {
                console.error("useStatePoolData - eUTxOs - apiSaveEUTxODB - Error: " + error)
                throw error
            }
            //------------------ 
            eUTxOs_With_Datum = eUTxOs_With_Datum.concat(eUTxOs_With_Datum_Missing)
            console.log("useStatePoolData - eUTxOs - Updated - length: " + eUTxOs_With_Datum.length)
        }
        //------------------
        setEUTxOs_With_Datum(eUTxOs_With_Datum)
        setCountEUTxOs_With_Datum(eUTxOs_With_Datum.length.toString())
        //------------------
        var eUTxO_With_PoolDatum: EUTxO | undefined = undefined //poolInfo.eUTxO_With_PoolDatum

        if (eUTxO_With_PoolDatum === undefined) {
            try{
                eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, false)
            }catch(error){
                eUTxO_With_PoolDatum = undefined
            }
            if (!eUTxO_With_PoolDatum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with PoolDatum");

                swPreparado = false

                setEUTxO_With_PoolDatum(undefined)

                setMasterFunders([])

                setEUTxOs_With_FundDatum([])
                setEUTxOs_With_UserDatum([])
                setCountEUTxOs_With_FundDatum('0')
                setCountEUTxOs_With_UserDatum('0')

                setTotalFundAmount('0')
                setTotalAvailaibleFunds('0')

                setTotalStaked('0')
                setTotalRewardsPaid('0')
                setTotalRewardsToPay('0')

                setTotalFundAmountsRemains_ForMaster('0')
                setTotalMastersMinAda('0')

                setTotalUsersMinAda('0')

                setUserRegistered('0')

                setUserStakedDatas([])


            } else {
                swPreparado = true

                console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
                setEUTxO_With_PoolDatum(eUTxO_With_PoolDatum)
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: pdMaster_Funders: " + toJson(eUTxO_With_PoolDatum.datum))

                setMasterFunders(eUTxO_With_PoolDatum.datum.pdMasterFunders)

                setTotalFundAmount(getTotalFundAmount(eUTxO_With_PoolDatum).toString())
                setTotalMastersMinAda(getTotalMastersMinAda_In_EUTxOs_With_UserDatum(poolInfo, eUTxO_With_PoolDatum).toString())

                // si la fecha del deadline ya paso, o hay closedAt en el poolDatum, entonces el pool debe estar closed
                // si la fecha del deadline ya paso, o hay closedAt en el poolDatum, y tambien el gracetime ya paso, entonces el pool debe estar terminated
                // si pdIsTerminated es true, entonces el pool debe estar terminated, significa que fue terminado forzado por el master

                poolDatum = eUTxO_With_PoolDatum.datum as PoolDatum

                if (poolDatum.pdIsTerminated === 1) {
                    swClosed = true
                    swTerminated = true
                } else {
                    if (poolDatum.pdClosedAt.val !== undefined || poolInfo.deadline < now) {
                        swClosed = true

                        closedAt = (poolDatum.pdClosedAt.val !== undefined && poolDatum.pdClosedAt.val < poolInfo.deadline.getTime()) ? new Date(parseInt(poolDatum.pdClosedAt.val.toString())) : undefined

                        if (BigInt(poolInfo.deadline.getTime()) + BigInt(poolInfo.graceTime) < BigInt(now.getTime())) {
                            swTerminated = true
                        }else{
                            swTerminated = false
                        }
                    }else{
                        swClosed = false
                        swTerminated = false
                    }
                }
            }
        } else {
            //console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
        }

        var eUTxOs_With_FundDatum: EUTxO[] = []
        if (eUTxO_With_PoolDatum) {

            eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum)
            if (eUTxOs_With_FundDatum.length === 0) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with FundDatum. Did you funded already?");

                setEUTxOs_With_FundDatum([])
                setEUTxOs_With_UserDatum([])
                setCountEUTxOs_With_FundDatum('0')
                setTotalAvailaibleFunds('0')

                swFunded = false
                swZeroFunds = true
            } else {
                swFunded = true
                swZeroFunds = false

                console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxOs with FundDatum lenght: " + eUTxOs_With_FundDatum.length)

                const sorted_EUTxOs_With_FundDatum = sortFundDatum(poolInfo, eUTxOs_With_FundDatum)
                setEUTxOs_With_FundDatum(sorted_EUTxOs_With_FundDatum)
                setCountEUTxOs_With_FundDatum(eUTxOs_With_FundDatum.length.toString())

                setTotalAvailaibleFunds(getTotalAvailaibleFunds(eUTxOs_With_FundDatum).toString())
            }

            setTotalFundAmountsRemains_ForMaster(getTotalFundAmountsRemains_ForMasters(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum)[0].toString())

        }

        if (eUTxO_With_PoolDatum) {
            //------------------
            // busco si hay UTxO con UserDatum válidos
            const userID_CS = poolInfo.txID_User_Deposit_CS
            const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
            const eUTxOs_With_UserDatum: EUTxO[] = getEUTxOs_With_UserDatum_InEUxTOList(userID_AC_Lucid, eUTxOs_With_Datum)
            if (eUTxOs_With_UserDatum.length === 0) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with UserDatum.");

                setEUTxOs_With_UserDatum([])
                setCountEUTxOs_With_UserDatum('0')

                setTotalStaked('0')
                setTotalRewardsPaid(getTotalCashedOut(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum).toString())
                setTotalRewardsToPay('0')

                setTotalUsersMinAda('0')

                setUserRegistered('TODO')

                setUserStakedDatas([])

            } else {

                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxOs with UserDatum lenght: " + eUTxOs_With_UserDatum.length)

                setEUTxOs_With_UserDatum(eUTxOs_With_UserDatum)
                setCountEUTxOs_With_UserDatum(eUTxOs_With_UserDatum.length.toString())

                setTotalStaked(getTotalStakedAmount(eUTxOs_With_UserDatum).toString())
                setTotalRewardsPaid(getTotalCashedOut(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum).toString())
                setTotalRewardsToPay(getTotalRewardsToPay_In_EUTxOs_With_UserDatum(poolInfo, eUTxO_With_PoolDatum, eUTxOs_With_UserDatum).toString())
                
                setTotalUsersMinAda(getTotalUsersMinAda_In_EUTxOs_With_UserDatum(poolInfo, eUTxOs_With_UserDatum).toString())

                setUserRegistered('TODO')

                if (getIfUserRegistered(walletStore.pkh!, eUTxOs_With_UserDatum)) {

                    setSwUserRegistered(true)

                    const eUTxOs_With_UserDatumOfUser = getEUTxOs_With_UserDatum_InEUxTOList_OfUser(eUTxOs_With_UserDatum, walletStore.pkh!)

                    var userStakedDatas: UserStakedData[] = []

                    for (var i = 0; i < eUTxOs_With_UserDatumOfUser.length; i += 1) {

                        const userDatum: UserDatum = eUTxOs_With_UserDatumOfUser[i].datum as UserDatum;

                        const userCreatedAt = new Date(parseInt(userDatum.udCreatedAt.toString())).toString()

                        const userLastClaimAt = ((userDatum.udLastClaimAt.val !== undefined) ?
                            new Date(parseInt(userDatum.udLastClaimAt.val.toString())).toString()
                            :
                            ui_notConnected
                        )

                        const userStaked = getUserStaked(walletStore.pkh!, [eUTxOs_With_UserDatumOfUser[i]]).toString()

                        const userRewardsPaid = getUserRewardsPaid(walletStore.pkh!, [eUTxOs_With_UserDatumOfUser[i]]).toString()

                        const userRewardsToPay = getUserRewardsToPay(poolInfo, walletStore.pkh!, eUTxO_With_PoolDatum, [eUTxOs_With_UserDatumOfUser[i]]).toString()

                        const userStakedData: UserStakedData = {
                            eUTxO_With_UserDatum: eUTxOs_With_UserDatumOfUser[i],
                            userStaked: userStaked,
                            userCreatedAt: userCreatedAt,
                            userLastClaimAt: userLastClaimAt,
                            userRewardsPaid: userRewardsPaid,
                            userRewardsToPay: userRewardsToPay,
                            isLoading: false
                        }

                        userStakedDatas.push(userStakedData)
                    }

                    setUserStakedDatas(userStakedDatas)

                } else {
                    setUserStakedDatas([])
                }
            }
        }

        var eUTxO_With_ScriptDatum: EUTxO | undefined = poolInfo.eUTxO_With_ScriptDatum
        if (eUTxO_With_ScriptDatum === undefined) {
            eUTxO_With_ScriptDatum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Validator_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_ScriptDatum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with 'Main Validator Script'. Did you created already?")
                setEUTxO_With_ScriptDatum(undefined)

            } else {
                // console.log ("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
                setEUTxO_With_ScriptDatum(eUTxO_With_ScriptDatum)
                poolInfo.eUTxO_With_ScriptDatum = eUTxO_With_ScriptDatum
                swUpdate = true
            }
        } else {
            setEUTxO_With_ScriptDatum(eUTxO_With_ScriptDatum)
            // console.log ("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_Fund_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum
        if (eUTxO_With_Script_TxID_Master_Fund_Datum === undefined) {
            eUTxO_With_Script_TxID_Master_Fund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_Fund_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_Fund_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master Fund'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_Fund_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master Fund': " + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_Fund_Datum(eUTxO_With_Script_TxID_Master_Fund_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum = eUTxO_With_Script_TxID_Master_Fund_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_Fund_Datum(eUTxO_With_Script_TxID_Master_Fund_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master Fund': " + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum
        if (eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === undefined) {
            eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_FundAndMerge_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master FundAndMerge'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master FundAndMerge': " + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = eUTxO_With_Script_TxID_Master_FundAndMerge_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master FundAndMerge': " + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_SplitFund_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum
        if (eUTxO_With_Script_TxID_Master_SplitFund_Datum === undefined) {

            eUTxO_With_Script_TxID_Master_SplitFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SplitFund_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_SplitFund_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master SplitFund'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_SplitFund_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master SplitFund': " + eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_SplitFund_Datum(eUTxO_With_Script_TxID_Master_SplitFund_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum = eUTxO_With_Script_TxID_Master_SplitFund_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_SplitFund_Datum(eUTxO_With_Script_TxID_Master_SplitFund_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master SplitFund': " + eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_ClosePool_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum
        if (eUTxO_With_Script_TxID_Master_ClosePool_Datum === undefined) {

            eUTxO_With_Script_TxID_Master_ClosePool_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_ClosePool_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_ClosePool_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master ClosePool'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_ClosePool_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master ClosePool': " + eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_ClosePool_Datum(eUTxO_With_Script_TxID_Master_ClosePool_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum = eUTxO_With_Script_TxID_Master_ClosePool_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_ClosePool_Datum(eUTxO_With_Script_TxID_Master_ClosePool_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master ClosePool': " + eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_TerminatePool_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum
        if (eUTxO_With_Script_TxID_Master_TerminatePool_Datum === undefined) {

            eUTxO_With_Script_TxID_Master_TerminatePool_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_TerminatePool_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_TerminatePool_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master TerminatePool'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_TerminatePool_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master TerminatePool': " + eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_TerminatePool_Datum(eUTxO_With_Script_TxID_Master_TerminatePool_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum = eUTxO_With_Script_TxID_Master_TerminatePool_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_TerminatePool_Datum(eUTxO_With_Script_TxID_Master_TerminatePool_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master TerminatePool': " + eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_DeleteFund_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum
        if (eUTxO_With_Script_TxID_Master_DeleteFund_Datum === undefined) {

            eUTxO_With_Script_TxID_Master_DeleteFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_DeleteFund_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_DeleteFund_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master DeleteFund'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_DeleteFund_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master DeleteFund': " + eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_DeleteFund_Datum(eUTxO_With_Script_TxID_Master_DeleteFund_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum = eUTxO_With_Script_TxID_Master_DeleteFund_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_DeleteFund_Datum(eUTxO_With_Script_TxID_Master_DeleteFund_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master DeleteFund': " + eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_SendBackFund_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum
        if (eUTxO_With_Script_TxID_Master_SendBackFund_Datum === undefined) {

            eUTxO_With_Script_TxID_Master_SendBackFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SendBackFund_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_SendBackFund_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master Send Back Fund'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_SendBackFund_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master Send Back Fund': " + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_SendBackFund_Datum(eUTxO_With_Script_TxID_Master_SendBackFund_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum = eUTxO_With_Script_TxID_Master_SendBackFund_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_SendBackFund_Datum(eUTxO_With_Script_TxID_Master_SendBackFund_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master Send Back Fund': " + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum
        if (eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === undefined) {

            eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SendBackDeposit_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master SendBackDeposit'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master SendBackDeposit': " + eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master SendBackDeposit': " + eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum
        if (eUTxO_With_Script_TxID_Master_AddScripts_Datum === undefined) {

            eUTxO_With_Script_TxID_Master_AddScripts_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_AddScripts_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_AddScripts_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master AddScripts'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_AddScripts_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_AddScripts_Datum(eUTxO_With_Script_TxID_Master_AddScripts_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum = eUTxO_With_Script_TxID_Master_AddScripts_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_AddScripts_Datum(eUTxO_With_Script_TxID_Master_AddScripts_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master AddScripts': " + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum
        if (eUTxO_With_Script_TxID_Master_DeleteScripts_Datum === undefined) {

            eUTxO_With_Script_TxID_Master_DeleteScripts_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_DeleteScripts_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_Master_DeleteScripts_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID Master DeleteScripts'. Did you added master scripts already?")
                setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID Master DeleteScripts': " + eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum(eUTxO_With_Script_TxID_Master_DeleteScripts_Datum)
                poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum = eUTxO_With_Script_TxID_Master_DeleteScripts_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum(eUTxO_With_Script_TxID_Master_DeleteScripts_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID Master DeleteScripts': " + eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_User_Deposit_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum
        if (eUTxO_With_Script_TxID_User_Deposit_Datum === undefined) {

            eUTxO_With_Script_TxID_User_Deposit_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Deposit_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_User_Deposit_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID User Deposit_Datum. Did you added user scripts already?")
                setEUTxO_With_Script_TxID_User_Deposit_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID User Deposit_Datum: " + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_User_Deposit_Datum(eUTxO_With_Script_TxID_User_Deposit_Datum)
                poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum = eUTxO_With_Script_TxID_User_Deposit_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_User_Deposit_Datum(eUTxO_With_Script_TxID_User_Deposit_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID User Deposit_Datum: " + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_User_Harvest_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum
        if (eUTxO_With_Script_TxID_User_Harvest_Datum === undefined) {

            eUTxO_With_Script_TxID_User_Harvest_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Harvest_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_User_Harvest_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID User Harvest_Datum. Did you added user scripts already?")
                setEUTxO_With_Script_TxID_User_Harvest_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID User Harvest_Datum: " + eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_User_Harvest_Datum(eUTxO_With_Script_TxID_User_Harvest_Datum)
                poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum = eUTxO_With_Script_TxID_User_Harvest_Datum
                swUpdate = true
            }

        } else {
            setEUTxO_With_Script_TxID_User_Harvest_Datum(eUTxO_With_Script_TxID_User_Harvest_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID User Harvest_Datum: " + eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.outputIndex)
        }

        var eUTxO_With_Script_TxID_User_Withdraw_Datum: EUTxO | undefined = poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum
        if (eUTxO_With_Script_TxID_User_Withdraw_Datum === undefined) {

            eUTxO_With_Script_TxID_User_Withdraw_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Withdraw_AC_Lucid, eUTxOs_With_Datum)
            if (!eUTxO_With_Script_TxID_User_Withdraw_Datum) {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: Can't find any UTxO with Script 'TxID User Withdraw_Datum. Did you added user scripts already?")
                setEUTxO_With_Script_TxID_User_Withdraw_Datum(undefined)
            } else {
                // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: UTxO with Script 'TxID User Withdraw_Datum: " + eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.outputIndex)
                setEUTxO_With_Script_TxID_User_Withdraw_Datum(eUTxO_With_Script_TxID_User_Withdraw_Datum)
                poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum = eUTxO_With_Script_TxID_User_Withdraw_Datum
                swUpdate = true
            }
        } else {
            setEUTxO_With_Script_TxID_User_Withdraw_Datum(eUTxO_With_Script_TxID_User_Withdraw_Datum)
            // console.log("useStatePoolData - " + poolInfo.name + " - loadPoolData: DB UTxO with Script 'TxID User Withdraw_Datum: " + eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.outputIndex)
        }

        if (eUTxO_With_PoolDatum === undefined || poolDatum === undefined) {
            swPoolReadyForDelete = true
        }else{
            const masterFunders = poolDatum.pdMasterFunders
            const allMasterFundersClaimed = masterFunders.every((masterFunder) => masterFunder.mfClaimedFund === poolDatum_ClaimedFund)   

            const scriptsMasters = (typeof eUTxO_With_Script_TxID_Master_Fund_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_Master_SplitFund_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_Master_ClosePool_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_Master_TerminatePool_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_Master_DeleteFund_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_Master_SendBackFund_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === "object")

            const scriptsUser = (typeof eUTxO_With_Script_TxID_User_Deposit_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_User_Withdraw_Datum === "object" ||
                typeof eUTxO_With_Script_TxID_User_Harvest_Datum === "object")

                                            
            swPoolReadyForDelete = allMasterFundersClaimed && (eUTxOs_With_FundDatum.length === 0) && (eUTxOs_With_UserDatum.length === 0) && !scriptsMasters && !scriptsUser
        }
        console.log ("useStatePoolData - " + poolInfo.name + " - swPoolReadyForDelete: " + swPoolReadyForDelete)

        // console.log ("useStatePoolData - " + poolInfo.name + " - swClosed: " + swClosed + " - setSwTerminated: " + swTerminated) 

        // console.log ("useStatePoolData - " + poolInfo.name + " - beginAt: " + poolInfo.beginAt.toLocaleTimeString() + " - now: " + now.toLocaleTimeString()) 

        if (poolInfo.beginAt < now) {
            // console.log ("useStatePoolData - " + poolInfo.name + " - swIniciado: " + swIniciado ) 
            swIniciado = true
        } else {
            // console.log ("useStatePoolData - " + poolInfo.name + " - NO swIniciado: " + swIniciado ) 
            swIniciado = false
        }

        // console.log ("useStatePoolData - " + poolInfo.name + " - swZeroFunds: " + swZeroFunds ) 
        setSwPreparado(swPreparado)
        setSwIniciado(swIniciado)
        setSwFunded(swFunded)
        setSwClosed(swClosed)
        setSwTerminated(swTerminated)
        setSwZeroFunds(swZeroFunds)
        setSwPoolReadyForDelete(swPoolReadyForDelete)

        var terminatedAt_: Date

        if (poolInfo.closedAt !== undefined) {
            terminatedAt_ = new Date(poolInfo.closedAt.getTime() + Number(poolInfo.graceTime))
        } else {
            terminatedAt_ = new Date(poolInfo.deadline.getTime() + Number(poolInfo.graceTime))
        }

        // console.log ("useStatePoolData - " + poolInfo.name + " - terminatedAt_: "+ new Date(terminatedAt_))

        setTerminatedAt(terminatedAt_)

        if (poolInfo.swPreparado != swPreparado) {
            poolInfo.swPreparado = swPreparado
            swUpdate = true
        }

        if (poolInfo.swIniciado != swIniciado) {
            poolInfo.swIniciado = swIniciado
            swUpdate = true
        }

        if (poolInfo.swFunded != swFunded) {
            poolInfo.swFunded = swFunded
            swUpdate = true
        }

        if (poolInfo.swClosed != swClosed) {
            poolInfo.swClosed = swClosed
            swUpdate = true
        }

        if (poolInfo.closedAt != closedAt) {
            poolInfo.closedAt = closedAt
            swUpdate = true
        }

        if (poolInfo.swTerminated != swTerminated) {
            poolInfo.swTerminated = swTerminated
            swUpdate = true
        }

        if (poolInfo.swZeroFunds != swZeroFunds) {
            poolInfo.swZeroFunds = swZeroFunds
            swUpdate = true
        }

        if (poolInfo.swPoolReadyForDelete != swPoolReadyForDelete) {
            poolInfo.swPoolReadyForDelete = swPoolReadyForDelete
            swUpdate = true
        }


        //if (poolInfo.eUTxO_With_PoolDatum != eUTxO_With_PoolDatum) { swUpdate = true }


        if (swUpdate) {

            console.log("useStatePoolData - " + poolInfo.name + " - UPDATING POOL DATA: " + poolInfo.name + " - swShowOnHome: " + poolInfo.swShowOnHome)

            let data = {
                nombrePool: poolInfo.name,

                swPreparado: swPreparado,

                swIniciado: swIniciado,

                swFunded: swFunded,

                swClosed: swClosed,

                closedAt: closedAt != undefined? closedAt.getTime() : undefined,
                
                swTerminated: swTerminated,

                swZeroFunds: swZeroFunds,
                
                swPoolReadyForDelete: swPoolReadyForDelete,
                
                eUTxO_With_ScriptDatum: eUTxO_With_ScriptDatum ? toJson(eUTxO_With_ScriptDatum) : "",

                eUTxO_With_Script_TxID_Master_Fund_Datum: eUTxO_With_Script_TxID_Master_Fund_Datum ? toJson(eUTxO_With_Script_TxID_Master_Fund_Datum) : "",
                eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: eUTxO_With_Script_TxID_Master_FundAndMerge_Datum ? toJson(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) : "",
                eUTxO_With_Script_TxID_Master_SplitFund_Datum: eUTxO_With_Script_TxID_Master_SplitFund_Datum ? toJson(eUTxO_With_Script_TxID_Master_SplitFund_Datum) : "",
                eUTxO_With_Script_TxID_Master_ClosePool_Datum: eUTxO_With_Script_TxID_Master_ClosePool_Datum ? toJson(eUTxO_With_Script_TxID_Master_ClosePool_Datum) : "",
                eUTxO_With_Script_TxID_Master_TerminatePool_Datum: eUTxO_With_Script_TxID_Master_TerminatePool_Datum ? toJson(eUTxO_With_Script_TxID_Master_TerminatePool_Datum) : "",
                eUTxO_With_Script_TxID_Master_DeleteFund_Datum: eUTxO_With_Script_TxID_Master_DeleteFund_Datum ? toJson(eUTxO_With_Script_TxID_Master_DeleteFund_Datum) : "",
                eUTxO_With_Script_TxID_Master_SendBackFund_Datum: eUTxO_With_Script_TxID_Master_SendBackFund_Datum ? toJson(eUTxO_With_Script_TxID_Master_SendBackFund_Datum) : "",
                eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum ? toJson(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum) : "",
                eUTxO_With_Script_TxID_Master_AddScripts_Datum: eUTxO_With_Script_TxID_Master_AddScripts_Datum ? toJson(eUTxO_With_Script_TxID_Master_AddScripts_Datum) : "",
                eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: eUTxO_With_Script_TxID_Master_DeleteScripts_Datum ? toJson(eUTxO_With_Script_TxID_Master_DeleteScripts_Datum) : "",

                eUTxO_With_Script_TxID_User_Deposit_Datum: eUTxO_With_Script_TxID_User_Deposit_Datum ? toJson(eUTxO_With_Script_TxID_User_Deposit_Datum) : "",
                eUTxO_With_Script_TxID_User_Harvest_Datum: eUTxO_With_Script_TxID_User_Harvest_Datum ? toJson(eUTxO_With_Script_TxID_User_Harvest_Datum) : "",
                eUTxO_With_Script_TxID_User_Withdraw_Datum: eUTxO_With_Script_TxID_User_Withdraw_Datum ? toJson(eUTxO_With_Script_TxID_User_Withdraw_Datum) : "",

            }
            //------------------	
            await apiUpdateStakingPoolDB(data)
            //------------------	
        }
        
        
        setIsPoolDataLoaded(true)
        setIsPoolDataLoading(false)
        //------------------
        return poolInfo
    }

    return {
    
        // swFromDB,
        swShowOnHome,
        swPreparado, swIniciado, swFunded,

        swClosed, swTerminated, closedAt, terminatedAt,
        swZeroFunds,

        swPoolReadyForDelete,

        eUTxOs_With_Datum, countEUTxOs_With_Datum,
        eUTxO_With_PoolDatum,
        eUTxOs_With_FundDatum, countEUTxOs_With_FundDatum,
        eUTxOs_With_UserDatum, countEUTxOs_With_UserDatum,

        eUTxO_With_ScriptDatum,

        eUTxO_With_Script_TxID_Master_Fund_Datum,
        eUTxO_With_Script_TxID_Master_FundAndMerge_Datum,
        eUTxO_With_Script_TxID_Master_SplitFund_Datum,
        eUTxO_With_Script_TxID_Master_ClosePool_Datum,
        eUTxO_With_Script_TxID_Master_TerminatePool_Datum,
        eUTxO_With_Script_TxID_Master_DeleteFund_Datum,
        eUTxO_With_Script_TxID_Master_SendBackFund_Datum,
        eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum,
        eUTxO_With_Script_TxID_Master_AddScripts_Datum,
        eUTxO_With_Script_TxID_Master_DeleteScripts_Datum,

        eUTxO_With_Script_TxID_User_Deposit_Datum,
        eUTxO_With_Script_TxID_User_Harvest_Datum,
        eUTxO_With_Script_TxID_User_Withdraw_Datum,

        setEUTxO_With_Script_TxID_Master_Fund_Datum,
        setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum,
        setEUTxO_With_Script_TxID_Master_SplitFund_Datum,
        setEUTxO_With_Script_TxID_Master_ClosePool_Datum,
        setEUTxO_With_Script_TxID_Master_TerminatePool_Datum,
        setEUTxO_With_Script_TxID_Master_DeleteFund_Datum,
        setEUTxO_With_Script_TxID_Master_SendBackFund_Datum,
        setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum,
        setEUTxO_With_Script_TxID_Master_AddScripts_Datum,
        setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum,

        setEUTxO_With_Script_TxID_User_Deposit_Datum,
        setEUTxO_With_Script_TxID_User_Harvest_Datum,
        setEUTxO_With_Script_TxID_User_Withdraw_Datum,

        masterFunders,

        totalFundsAvailable, totalFundAmount, totalFundAmountsRemains_ForMaster,

        totalStaked, totalRewardsPaid, totalRewardsToPay, totalUsersMinAda, totalMastersMinAda,

        swUserRegistered,

        userStakedDatas,

        isPoolDataLoading,
        isPoolDataLoaded,

        loadPoolData
    }

}


