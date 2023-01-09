//--------------------------------------
import { useEffect, useState } from "react";
import { EUTxO, Master_Funder, PoolDatum, UserDatum } from "../types";
import { fundID_TN, poolDatum_ClaimedFund, poolID_TN, scriptID_Master_AddScripts_TN, scriptID_Master_ClosePool_TN, scriptID_Master_DeleteFund_TN, scriptID_Master_DeleteScripts_TN, scriptID_Master_FundAndMerge_TN, scriptID_Master_Fund_TN, scriptID_Master_SendBackDeposit_TN, scriptID_Master_SendBackFund_TN, scriptID_Master_SplitFund_TN, scriptID_Master_TerminatePool_TN, scriptID_User_Deposit_TN, scriptID_User_Harvest_TN, scriptID_User_Withdraw_TN, scriptID_Validator_TN, txID_Master_AddScripts_TN, userID_TN } from "../types/constantes";
import { StakingPoolDBInterface } from "../types/stakePoolDBModel";
import { apiSaveEUTxODB, apiGetEUTxOsDBByStakingPool,
    apiGetStakingPoolDB } from "./apis";
import { strToHex, toJson } from "../utils/utils";
import { useStoreState } from "../utils/walletProvider";
import {
    getEUTxOs_With_FundDatum_InEUxTOList, getEUTxOs_With_UserDatum_InEUxTOList,
    getEUTxOs_With_UserDatum_InEUxTOList_OfUser, getEUTxO_With_PoolDatum_InEUxTOList, getEUTxO_With_ScriptDatum_InEUxTOList, getMissingEUTxOsInDB
} from "./helpersEUTxOs";
import {
    getIfUserRegistered, getTotalAvailaibleFunds, getTotalCashedOut, getTotalFundAmount, getTotalFundAmountsRemains_ForMasters, getTotalMastersMinAda_In_EUTxOs_With_UserDatum, getTotalRewardsToPay_In_EUTxOs_With_UserDatum, getTotalStakedAmount, getTotalUsersMinAda_In_EUTxOs_With_UserDatum, getUserRewardsPaid,
    getUserRewardsToPay, getUserStaked, sortFundDatum
} from "./helpersStakePool";
//--------------------------------------
type UserStakedData = {
    eUTxO_With_UserDatum: EUTxO | undefined,
    userStaked: string | 0;
    userCreatedAt: string | 0;
    userLastClaimAt: string | 0;
    userRewardsPaid: string | 0;
    userRewardsToPay: string | 0;
    isLoading: boolean;
}
//--------------------------------------
export default function useStatePoolData(stakingPoolInfo: StakingPoolDBInterface) {

    //string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
    const ui_loading = 0
    const ui_notConnected = '...'

    //console.log("useStatePoolData - " + stakingPoolInfo.name + " - INIT")
    
    const [poolInfo, setPoolInfo] = useState(stakingPoolInfo)

    const [isPoolDataLoaded, setIsPoolDataLoaded] = useState(false)
    const [isPoolDataLoading, setIsPoolDataLoading] = useState(false)
    
    const [swShowOnHome, setSwShowOnHome] = useState<string | 0 | boolean> (ui_loading)
    const [swPreparado, setSwPreparado] = useState<string | 0 | boolean> (ui_loading)
    const [swIniciado, setSwIniciado] = useState<string | 0 | boolean> (ui_loading)
    const [swFunded, setSwFunded] = useState<string | 0 | boolean> (ui_loading)
    const [swClosed, setSwClosed] = useState<string | 0 | boolean> (ui_loading)
    const [swTerminated, setSwTerminated] = useState<string | 0 | boolean> (ui_loading)
    const [swZeroFunds, setSwZeroFunds] = useState<string | 0 | boolean> (ui_loading)
    const [swPoolReadyForDelete, setSwPoolReadyForDelete] = useState<string | 0 | boolean> (ui_loading)
    const [closedAt, setClosedAt] = useState<string | 0 | Date | undefined> (ui_loading)
    const [terminatedAt, setTerminatedAt] = useState<string | 0 | Date>(ui_loading)

    const [eUTxOs_With_Datum, setEUTxOs_With_Datum] = useState<EUTxO[]>([])
    const [countEUTxOs_With_Datum, setCountEUTxOs_With_Datum] = useState<string | 0> (ui_loading)

    const [eUTxO_With_PoolDatum, setEUTxO_With_PoolDatum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [masterFunders, setMasterFunders] = useState<Master_Funder[]>([])

    const [eUTxOs_With_FundDatum, setEUTxOs_With_FundDatum] = useState<EUTxO[]>([])
    const [countEUTxOs_With_FundDatum, setCountEUTxOs_With_FundDatum] = useState<string | 0> (ui_loading)

    const [eUTxOs_With_UserDatum, setEUTxOs_With_UserDatum] = useState<EUTxO[]>([])
    const [countEUTxOs_With_UserDatum, setCountEUTxOs_With_UserDatum] = useState<string | 0> (ui_loading)

    const [eUTxO_With_ScriptDatum, setEUTxO_With_ScriptDatum] = useState<EUTxO | string | 0 | undefined> (ui_loading)

    const [eUTxO_With_Script_TxID_Master_Fund_Datum, setEUTxO_With_Script_TxID_Master_Fund_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_FundAndMerge_Datum, setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_SplitFund_Datum, setEUTxO_With_Script_TxID_Master_SplitFund_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_ClosePool_Datum, setEUTxO_With_Script_TxID_Master_ClosePool_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_TerminatePool_Datum, setEUTxO_With_Script_TxID_Master_TerminatePool_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_DeleteFund_Datum, setEUTxO_With_Script_TxID_Master_DeleteFund_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_SendBackFund_Datum, setEUTxO_With_Script_TxID_Master_SendBackFund_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum, setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_AddScripts_Datum, setEUTxO_With_Script_TxID_Master_AddScripts_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_Master_DeleteScripts_Datum, setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)

    const [eUTxO_With_Script_TxID_User_Deposit_Datum, setEUTxO_With_Script_TxID_User_Deposit_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_User_Harvest_Datum, setEUTxO_With_Script_TxID_User_Harvest_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)
    const [eUTxO_With_Script_TxID_User_Withdraw_Datum, setEUTxO_With_Script_TxID_User_Withdraw_Datum] = useState<EUTxO | string | 0 | undefined> (ui_loading)

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

    useEffect(() => {
        // console.log("useStatePoolData - " + poolInfo.name + " - useEffect - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
        if (!walletStore.connected) {
            setLoading(ui_notConnected)
        }
    }, [walletStore.connected])

    // useEffect(() => {
    //     //console.log("useStatePoolData - " + poolInfo.name + " - useEffectA - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
    //     if (poolInfo ) {
    //         console.log("useStatePoolData - " + poolInfo.name + " - useEffectB - callbackSetPoolInfo - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
    //         callbackSetPoolInfo();
    //     }
    //  }, [poolInfo])

    useEffect(() => {
       //console.log("useStatePoolData - " + poolInfo.name + " - useEffectA - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
        if (!isPoolDataLoaded && !isPoolDataLoading ) {
            console.log("useStatePoolData - " + poolInfo.name + " - useEffectB - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
            refreshEUTxOs()
        }
    }, [])
    
    const setLoading = (ui: string | 0) => {
        // console.log("useStatePoolData - " + poolInfo.name + " - setLoading: " + ui)

        setIsPoolDataLoaded(false)

        setSwShowOnHome(ui)
        setSwPreparado(ui)
        setSwIniciado(ui)
        setSwFunded(ui)
        setSwClosed(ui)
        setSwTerminated(ui)
        setSwZeroFunds(ui)
        setSwPoolReadyForDelete(ui)
        setClosedAt(ui)
        setTerminatedAt(ui)

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

    const getEUTxOs = async (poolInfo_ : StakingPoolDBInterface) => {
        console.log("useStatePoolData - " + poolInfo.name + " - getEUTxOs - Init")
        //------------------
        const poolID_AC_Lucid = poolInfo_.pParams.ppPoolID_CS + strToHex(poolID_TN);
        //------------------
        const fundID_CS = poolInfo_.txID_Master_Fund_CS
        const fundID_AC_Lucid = fundID_CS + strToHex(fundID_TN);
        //------------------
        const userID_CS = poolInfo_.txID_User_Deposit_CS
        const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
        //------------------
        const txID_Master_AddScripts_CS = poolInfo_.txID_Master_AddScripts_CS
        const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN)
        const txID_Master_AddScripts_AC_Lucid = txID_Master_AddScripts_CS + txID_Master_AddScripts_TN_Hex;
        //------------------
        var eUTxOs_With_Datum : EUTxO [] = []
        eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo_.name);
        console.log("useStatePoolData - getEUTxOs - DB - length: " + eUTxOs_With_Datum.length)
        //------------------
        //setEUTxOs_With_Datum(eUTxOs_With_Datum)
        setEUTxOs_With_Datum(eUTxOs_With_Datum.sort((a : EUTxO, b : EUTxO) => {
			if (a.datum.plutusDataIndex < b.datum.plutusDataIndex) return -1
			if (a.datum.plutusDataIndex > b.datum.plutusDataIndex) return 1
			return 0
		}))
        setCountEUTxOs_With_Datum(eUTxOs_With_Datum.length.toString())
        //------------------
        var eUTxO_With_PoolDatum: EUTxO | undefined = undefined 
        if (eUTxO_With_PoolDatum === undefined) {
            try{
                eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, false)
            }catch(error){
                eUTxO_With_PoolDatum = undefined
            }
            if (!eUTxO_With_PoolDatum) {
                // console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: Can't find any UTxO with PoolDatum");

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

                //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
                
                setEUTxO_With_PoolDatum(eUTxO_With_PoolDatum)
                
                setMasterFunders(eUTxO_With_PoolDatum.datum.pdMasterFunders)

                setTotalFundAmount(getTotalFundAmount(eUTxO_With_PoolDatum).toString())
                setTotalMastersMinAda(getTotalMastersMinAda_In_EUTxOs_With_UserDatum(poolInfo, eUTxO_With_PoolDatum).toString())

            }
        }


        var eUTxOs_With_FundDatum: EUTxO[] = []
        if (eUTxO_With_PoolDatum) {

            eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum)
            //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxOs with FundDatum lenght: " + eUTxOs_With_FundDatum.length)
            
            if (eUTxOs_With_FundDatum.length === 0) {
                // console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: Can't find any UTxO with FundDatum. Did you funded already?");

                setEUTxOs_With_FundDatum([])
                setCountEUTxOs_With_FundDatum('0')

                setTotalAvailaibleFunds('0')

            } else {

                //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxOs with FundDatum lenght: " + eUTxOs_With_FundDatum.length)

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
            const userID_CS = poolInfo_.txID_User_Deposit_CS
            const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
            const eUTxOs_With_UserDatum: EUTxO[] = getEUTxOs_With_UserDatum_InEUxTOList(userID_AC_Lucid, eUTxOs_With_Datum)
            //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxOs with UserDatum lenght: " + eUTxOs_With_UserDatum.length)

            if (eUTxOs_With_UserDatum.length === 0) {
                // console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: Can't find any UTxO with UserDatum.");

                setEUTxOs_With_UserDatum([])
                setCountEUTxOs_With_UserDatum('0')

                setTotalStaked('0')
                setTotalRewardsPaid(getTotalCashedOut(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum).toString())
                setTotalRewardsToPay('0')

                setTotalUsersMinAda('0')

                setUserRegistered('TODO')

                setUserStakedDatas([])

            } else {
                //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxOs with UserDatum lenght: " + eUTxOs_With_UserDatum.length)


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

        var eUTxO_With_ScriptDatum: EUTxO | undefined = poolInfo_.eUTxO_With_ScriptDatum
        if (eUTxO_With_ScriptDatum === undefined) {
            setEUTxO_With_ScriptDatum(undefined)
        } else {
            setEUTxO_With_ScriptDatum(eUTxO_With_ScriptDatum)
        }
        var eUTxO_With_Script_TxID_Master_Fund_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_Fund_Datum
        if (eUTxO_With_Script_TxID_Master_Fund_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_Fund_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_Fund_Datum(eUTxO_With_Script_TxID_Master_Fund_Datum)
        }
        var eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum
        if (eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum)
        }
        var eUTxO_With_Script_TxID_Master_SplitFund_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_SplitFund_Datum
        if (eUTxO_With_Script_TxID_Master_SplitFund_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_SplitFund_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_SplitFund_Datum(eUTxO_With_Script_TxID_Master_SplitFund_Datum)
        }
        var eUTxO_With_Script_TxID_Master_ClosePool_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_ClosePool_Datum
        if (eUTxO_With_Script_TxID_Master_ClosePool_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_ClosePool_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_ClosePool_Datum(eUTxO_With_Script_TxID_Master_ClosePool_Datum)
        }
        var eUTxO_With_Script_TxID_Master_TerminatePool_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_TerminatePool_Datum
        if (eUTxO_With_Script_TxID_Master_TerminatePool_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_TerminatePool_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_TerminatePool_Datum(eUTxO_With_Script_TxID_Master_TerminatePool_Datum)
        }
        var eUTxO_With_Script_TxID_Master_DeleteFund_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_DeleteFund_Datum
        if (eUTxO_With_Script_TxID_Master_DeleteFund_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_DeleteFund_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_DeleteFund_Datum(eUTxO_With_Script_TxID_Master_DeleteFund_Datum)
        }
        var eUTxO_With_Script_TxID_Master_SendBackFund_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_SendBackFund_Datum
        if (eUTxO_With_Script_TxID_Master_SendBackFund_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_SendBackFund_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_SendBackFund_Datum(eUTxO_With_Script_TxID_Master_SendBackFund_Datum)
        }
        var eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum
        if (eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum)
        }
        var eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_AddScripts_Datum
        if (eUTxO_With_Script_TxID_Master_AddScripts_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_AddScripts_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_AddScripts_Datum(eUTxO_With_Script_TxID_Master_AddScripts_Datum)
        }
        var eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum
        if (eUTxO_With_Script_TxID_Master_DeleteScripts_Datum === undefined) {
            setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_Master_DeleteScripts_Datum(eUTxO_With_Script_TxID_Master_DeleteScripts_Datum)
        }
        var eUTxO_With_Script_TxID_User_Deposit_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_User_Deposit_Datum
        if (eUTxO_With_Script_TxID_User_Deposit_Datum === undefined) {
            setEUTxO_With_Script_TxID_User_Deposit_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_User_Deposit_Datum(eUTxO_With_Script_TxID_User_Deposit_Datum)
        }
        var eUTxO_With_Script_TxID_User_Harvest_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_User_Harvest_Datum
        if (eUTxO_With_Script_TxID_User_Harvest_Datum === undefined) {
            setEUTxO_With_Script_TxID_User_Harvest_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_User_Harvest_Datum(eUTxO_With_Script_TxID_User_Harvest_Datum)
        }
        var eUTxO_With_Script_TxID_User_Withdraw_Datum: EUTxO | undefined = poolInfo_.eUTxO_With_Script_TxID_User_Withdraw_Datum
        if (eUTxO_With_Script_TxID_User_Withdraw_Datum === undefined) {
            setEUTxO_With_Script_TxID_User_Withdraw_Datum(undefined)
        } else {
            setEUTxO_With_Script_TxID_User_Withdraw_Datum(eUTxO_With_Script_TxID_User_Withdraw_Datum)
        }
       
    }

    const refreshPoolData = async () => {
        console.log("useStatePoolData - " + poolInfo.name + " - refreshPoolData - Init")
        //------------------
        setIsPoolDataLoading(true)
        setLoading(ui_loading)
        //------------------
        const poolInfo_ = await apiGetStakingPoolDB(poolInfo.name)
        setPoolInfo(poolInfo_)
        //------------------
        await getEUTxOs(poolInfo_)
        //------------------
        setSwShowOnHome(poolInfo_.swShowOnHome);
        setSwPreparado(poolInfo_.swPreparado);
        setSwIniciado(poolInfo_.swIniciado);
        setSwFunded(poolInfo_.swFunded);
        setSwClosed(poolInfo_.swClosed);
        setSwTerminated(poolInfo_.swTerminated);
        setSwZeroFunds(poolInfo_.swZeroFunds);
        setSwPoolReadyForDelete(poolInfo_.swPoolReadyForDelete);
        setClosedAt(poolInfo_.closedAt);
        if (poolInfo_.closedAt !== undefined) {
            setTerminatedAt(new Date(poolInfo_.closedAt.getTime() + Number(poolInfo_.graceTime)));
        } else {
            setTerminatedAt(new Date(poolInfo_.deadline.getTime() + Number(poolInfo_.graceTime)));
        }
        //------------------
        setIsPoolDataLoaded(true);
        setIsPoolDataLoading(false);
    }

    const refreshEUTxOs = async () => {
        console.log("useStatePoolData - " + poolInfo.name + " - refreshEUTxOs - Init")
        //------------------
        setIsPoolDataLoading(true)
        setLoading(ui_loading)
        //------------------
        await getEUTxOs(poolInfo)
        //------------------
        setSwShowOnHome(poolInfo.swShowOnHome);
        setSwPreparado(poolInfo.swPreparado);
        setSwIniciado(poolInfo.swIniciado);
        setSwFunded(poolInfo.swFunded);
        setSwClosed(poolInfo.swClosed);
        setSwTerminated(poolInfo.swTerminated);
        setSwZeroFunds(poolInfo.swZeroFunds);
        setSwPoolReadyForDelete(poolInfo.swPoolReadyForDelete);
        setClosedAt(poolInfo.closedAt);
        if (poolInfo.closedAt !== undefined) {
            setTerminatedAt(new Date(poolInfo.closedAt.getTime() + Number(poolInfo.graceTime)));
        } else {
            setTerminatedAt(new Date(poolInfo.deadline.getTime() + Number(poolInfo.graceTime)));
        }
        //------------------
        setIsPoolDataLoaded(true)
        setIsPoolDataLoading(false)
        //------------------
    }

    return {
    
        poolInfo,

        swShowOnHome,
        swPreparado, 
        swIniciado, 
        swFunded,
        swClosed, 
        swTerminated, 
        closedAt, 
        terminatedAt,
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

        refreshPoolData, refreshEUTxOs
    }


    
}


