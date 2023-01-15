//--------------------------------------
import { useEffect, useRef, useState } from "react";
import { EUTxO, Master_Funder, PoolDatum, UserDatum } from "../types";
import { ADA_UI, fundID_TN, poolDatum_ClaimedFund, poolID_TN, scriptID_Master_AddScripts_TN, scriptID_Master_ClosePool_TN, scriptID_Master_DeleteFund_TN, scriptID_Master_DeleteScripts_TN, scriptID_Master_FundAndMerge_TN, scriptID_Master_Fund_TN, scriptID_Master_SendBackDeposit_TN, scriptID_Master_SendBackFund_TN, scriptID_Master_SplitFund_TN, scriptID_Master_TerminatePool_TN, scriptID_User_Deposit_TN, scriptID_User_Harvest_TN, scriptID_User_Withdraw_TN, scriptID_Validator_TN, txID_Master_AddScripts_TN, userID_TN } from "../types/constantes";
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
    
    const [swShowOnHomeUI, setSwShowOnHomeUI] = useState<string | 0 > (ui_loading)
    const [swPreparadoUI, setSwPreparadoUI] = useState<string | 0 > (ui_loading)
    const [swIniciadoUI, setSwIniciadoUI] = useState<string | 0 > (ui_loading)
    const [swFundedUI, setSwFundedUI] = useState<string | 0 > (ui_loading)
    const [swClosedUI, setSwClosedUI] = useState<string | 0 > (ui_loading)
    const [swTerminatedUI, setSwTerminatedUI] = useState<string | 0 > (ui_loading)
    const [swPoolReadyForGiveBackFundsUI, setSwPoolReadyForGiveBackFundsUI] = useState<string | 0 > (ui_loading)
    const [swPoolReadyForDeleteMainScriptsUI, setSwPoolReadyForDeleteMainScriptsUI] = useState<string | 0 > (ui_loading)
    const [swPoolReadyForDeletePoolInDBUI, setSwPoolReadyForDeletePoolInDBUI] = useState<string | 0 > (ui_loading)
    const [graceTimeUI, setGraceTimeUI] = useState<string | 0 > (ui_loading)
    const [closedAtUI, setClosedAtUI] = useState<string | 0 > (ui_loading)
    const [terminatedAtUI, setTerminatedAtUI] = useState<string | 0 >(ui_loading)

    const [swAnyScriptsMaster, setSwAnyScriptsMaster] = useState<boolean>(false)
    const [swAnyScriptsUser, setSwAnyScriptsUser] = useState<boolean>(false)
    const [swAnyMainScripts, setSwAnyMainScripts] = useState<boolean>(false)
    const [swAllScriptsMaster, setSwAllScriptsMaster] = useState<boolean>(false)
    const [swAllScriptsUser, setSwAllScriptsUser] = useState<boolean>(false)
    const [swAllMainScripts, setSwAllMainScripts] = useState<boolean>(false)

    const [masterFunders, setMasterFunders] = useState<Master_Funder[]>([])
    const [userStakedDatas, setUserStakedDatas] = useState<UserStakedData[]>([])
    const [swUserRegistered, setSwUserRegistered] = useState<boolean>(false)

    const [eUTxOs_With_Datum, setEUTxOs_With_Datum] = useState<EUTxO[]>([])
    const [eUTxO_With_PoolDatum, setEUTxO_With_PoolDatum] = useState<EUTxO | undefined> (undefined)
    const [eUTxOs_With_FundDatum, setEUTxOs_With_FundDatum] = useState<EUTxO[]>([])
    const [eUTxOs_With_UserDatum, setEUTxOs_With_UserDatum] = useState<EUTxO[]>([])

    const [countEUTxOs_With_DatumUI, setCountEUTxOs_With_DatumUI] = useState<string | 0> (ui_loading)
    const [countEUTxOs_With_FundDatumUI, setCountEUTxOs_With_FundDatumUI] = useState<string | 0> (ui_loading)
    const [countEUTxOs_With_UserDatumUI, setCountEUTxOs_With_UserDatumUI] = useState<string | 0> (ui_loading)

    const [totalFundAmountUI, setTotalFundAmountUI] = useState<string | 0>(ui_loading)
    const [totalFundsAvailableUI, setTotalAvailaibleFundsUI] = useState<string | 0>(ui_loading)
    const [totalStakedUI, setTotalStakedUI] = useState<string | 0>(ui_loading)
    const [totalRewardsPaidUI, setTotalRewardsPaidUI] = useState<string | 0>(ui_loading)
    const [totalRewardsToPayUI, setTotalRewardsToPayUI] = useState<string | 0>(ui_loading)
    const [totalFundAmountsRemains_ForMasterUI, setTotalFundAmountsRemains_ForMasterUI] = useState<string | 0>(ui_loading)
    const [totalMastersMinAdaUI, setTotalMastersMinAdaUI] = useState<string | 0>(ui_loading)
    const [totalUsersMinAdaUI, setTotalUsersMinAdaUI] = useState<string | 0>(ui_loading)

    const [userRegisteredUI, setUserRegisteredUI] = useState<string | 0>(ui_loading)

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

    useEffect(() => {
       //console.log("useStatePoolData - " + poolInfo.name + " - useEffectA - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
        if (!isPoolDataLoaded && !isPoolDataLoading ) {
            console.log("useStatePoolData - " + poolInfo.name + " - useEffectB - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
            refreshEUTxOs()
        }
    }, [])
    
    // const isPoolInfoSet = useRef(false);
	// const setIsPoolInfoSet = (value: boolean) => {
	// 	isPoolInfoSet.current = value
	// }

    // useEffect(() => {
    //     if (poolInfo && !isPoolInfoSet.current ) {
    //         console.log("useStatePoolData - " + poolInfo.name + " - useEffectC - callbackSetPoolInfo - isPoolInfoSet.current: " + isPoolInfoSet.current)
    //         setIsPoolInfoSet(true);
    //     }
    // }, [poolInfo])

    const setLoading = (ui: string | 0) => {
        // console.log("useStatePoolData - " + poolInfo.name + " - setLoading: " + ui)

        setIsPoolDataLoaded(false)

        setSwShowOnHomeUI(ui)
        setSwPreparadoUI(ui)
        setSwIniciadoUI(ui)
        setSwFundedUI(ui)
        setSwClosedUI(ui)
        setSwTerminatedUI(ui)
        setSwPoolReadyForGiveBackFundsUI(ui)
        setSwPoolReadyForDeleteMainScriptsUI(ui)
        setSwPoolReadyForDeletePoolInDBUI(ui)
        setClosedAtUI(ui)
        setGraceTimeUI(ui)
        setTerminatedAtUI(ui)

        setMasterFunders([])
        setSwUserRegistered(false)

        setCountEUTxOs_With_DatumUI(ui)
        setCountEUTxOs_With_FundDatumUI(ui)
        setCountEUTxOs_With_UserDatumUI(ui)

        setTotalFundAmountUI(ui)
        setTotalAvailaibleFundsUI(ui)
        setTotalStakedUI(ui)
        setTotalRewardsPaidUI(ui)
        setTotalRewardsToPayUI(ui)
        setTotalFundAmountsRemains_ForMasterUI(ui)
        setTotalMastersMinAdaUI(ui)
        setTotalUsersMinAdaUI(ui)
        setUserRegisteredUI(ui)

    }

    const getEUTxOs = async (poolInfo_ : StakingPoolDBInterface) => {
        console.log("useStatePoolData - " + poolInfo.name + " - getEUTxOs - Init")
        //------------------
        const poolID_AC_Lucid = poolInfo_.pParams.ppPoolID_CS + strToHex(poolID_TN);
        //------------------
        const fundID_CS = poolInfo_.txID_Master_Fund_CS
        const fundID_AC_Lucid = fundID_CS + strToHex(fundID_TN);
        //------------------
        // const userID_CS = poolInfo_.txID_User_Deposit_CS
        // const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
        //------------------
        // const txID_Master_AddScripts_CS = poolInfo_.txID_Master_AddScripts_CS
        // const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN)
        // const txID_Master_AddScripts_AC_Lucid = txID_Master_AddScripts_CS + txID_Master_AddScripts_TN_Hex;
        //------------------
        var eUTxOs_With_Datum : EUTxO [] = []
        eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo_.name);
        console.log("useStatePoolData - getEUTxOs - DB - length: " + eUTxOs_With_Datum.length)
        //------------------
        setEUTxOs_With_Datum(eUTxOs_With_Datum.sort((a : EUTxO, b : EUTxO) => {
			if (a.datum.plutusDataIndex < b.datum.plutusDataIndex) return -1
			if (a.datum.plutusDataIndex > b.datum.plutusDataIndex) return 1
			return 0
		}))
        setCountEUTxOs_With_DatumUI(eUTxOs_With_Datum.length.toString())
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
                setEUTxOs_With_FundDatum([])
                setEUTxOs_With_UserDatum([])
                setMasterFunders([])
                setUserStakedDatas([])
                setCountEUTxOs_With_FundDatumUI('0')
                setCountEUTxOs_With_UserDatumUI('0')
                setTotalFundAmountUI(Number(0).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalAvailaibleFundsUI(Number(0).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalStakedUI(Number(0).toLocaleString("en-US") + " " + poolInfo.staking_UI)
                setTotalRewardsPaidUI(Number(0).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalRewardsToPayUI(Number(0).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalFundAmountsRemains_ForMasterUI(Number(0).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalMastersMinAdaUI(Number(0).toLocaleString("en-US") + " " + ADA_UI)
                setTotalUsersMinAdaUI(Number(0).toLocaleString("en-US") + " " + ADA_UI)
                setUserRegisteredUI('0')
            } else {
                //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
                setEUTxO_With_PoolDatum(eUTxO_With_PoolDatum)
                setMasterFunders(eUTxO_With_PoolDatum.datum.pdMasterFunders)
                setTotalFundAmountUI(getTotalFundAmount(eUTxO_With_PoolDatum).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalMastersMinAdaUI(getTotalMastersMinAda_In_EUTxOs_With_UserDatum(poolInfo, eUTxO_With_PoolDatum).toLocaleString("en-US") + " " + ADA_UI)
            }
        }
        var eUTxOs_With_FundDatum: EUTxO[] = []
        if (eUTxO_With_PoolDatum) {
            eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum)
            //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxOs with FundDatum lenght: " + eUTxOs_With_FundDatum.length)
            if (eUTxOs_With_FundDatum.length === 0) {
                // console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: Can't find any UTxO with FundDatum. Did you funded already?");
                setEUTxOs_With_FundDatum([])
                setCountEUTxOs_With_FundDatumUI('0')
                setTotalAvailaibleFundsUI(Number(0).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
            } else {
                //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxOs with FundDatum lenght: " + eUTxOs_With_FundDatum.length)
                const sorted_EUTxOs_With_FundDatum = sortFundDatum(poolInfo, eUTxOs_With_FundDatum)
                setEUTxOs_With_FundDatum(sorted_EUTxOs_With_FundDatum)
                setCountEUTxOs_With_FundDatumUI(eUTxOs_With_FundDatum.length.toString())
                setTotalAvailaibleFundsUI(getTotalAvailaibleFunds(eUTxOs_With_FundDatum).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
            }
            setTotalFundAmountsRemains_ForMasterUI(getTotalFundAmountsRemains_ForMasters(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum)[0].toLocaleString("en-US") + " " + poolInfo.harvest_UI)
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
                setCountEUTxOs_With_UserDatumUI('0')
                setTotalStakedUI(Number(0).toLocaleString("en-US") + " " + poolInfo.staking_UI)
                setTotalRewardsPaidUI(getTotalCashedOut(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalRewardsToPayUI(Number(0).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalUsersMinAdaUI(Number(0).toLocaleString("en-US") + " " + ADA_UI)
                setUserRegisteredUI('TODO')
                setUserStakedDatas([])
            } else {
                //console.log("useStatePoolData - " + poolInfo_.name + " - getEUTxOs: UTxOs with UserDatum lenght: " + eUTxOs_With_UserDatum.length)
                setEUTxOs_With_UserDatum(eUTxOs_With_UserDatum)
                setCountEUTxOs_With_UserDatumUI(eUTxOs_With_UserDatum.length.toString())
                setTotalStakedUI(getTotalStakedAmount(eUTxOs_With_UserDatum).toLocaleString("en-US") + " " + poolInfo.staking_UI)
                setTotalRewardsPaidUI(getTotalCashedOut(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalRewardsToPayUI(getTotalRewardsToPay_In_EUTxOs_With_UserDatum(poolInfo, eUTxO_With_PoolDatum, eUTxOs_With_UserDatum).toLocaleString("en-US") + " " + poolInfo.harvest_UI)
                setTotalUsersMinAdaUI(getTotalUsersMinAda_In_EUTxOs_With_UserDatum(poolInfo, eUTxOs_With_UserDatum).toLocaleString("en-US") + " " + ADA_UI)
                setUserRegisteredUI('TODO')
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
    }

    const refreshPoolData = async () => {
        console.log("useStatePoolData - " + poolInfo.name + " - refreshPoolData - Init")
        //------------------
        setIsPoolDataLoading(true)
        setLoading(ui_loading)
        //------------------
        // const eUTxOs_With_Datum1 = await walletStore.lucid!.utxosAt(poolInfo.scriptAddress);
        // console.log("useStatePoolData - " + poolInfo.name + " - refreshPoolData - WAIT INIT - eUTxOs_With_Datum1.length: " + eUTxOs_With_Datum1.length)
        // await new Promise(r => setTimeout(r, 6000));
        // const eUTxOs_With_Datum2 = await walletStore.lucid!.utxosAt(poolInfo.scriptAddress);
        // console.log("useStatePoolData - " + poolInfo.name + " - refreshPoolData - WAIT END - eUTxOs_With_Datum2.length: " + eUTxOs_With_Datum2.length)
        const poolInfo_ = await apiGetStakingPoolDB(poolInfo.name)
        //------------------
        // setIsPoolInfoSet(false)
        setPoolInfo(poolInfo_)
        //await new Promise(r => setTimeout(r, 2000));
        // console.log("useStatePoolData - " + poolInfo.name + " - refreshPoolData - while (!isPoolInfoSet.current): " + isPoolInfoSet.current)
        // while (!isPoolInfoSet.current){
        //     console.log("useStatePoolData - " + poolInfo.name + " - refreshPoolData - while (!isPoolInfoSet.current)")
        //     await new Promise(r => setTimeout(r, 500));
        // }
        //------------------
        await getEUTxOs(poolInfo_)
        //await new Promise(r => setTimeout(r, 2000));
        //------------------
        setPoolData(poolInfo_);
        //await new Promise(r => setTimeout(r, 2000));    
        //------------------
        setIsPoolDataLoaded(true);
        setIsPoolDataLoading(false);
        //------------------
        return poolInfo_
    }

    const refreshEUTxOs = async () => {
        console.log("useStatePoolData - " + poolInfo.name + " - refreshEUTxOs - Init")
        //------------------
        setIsPoolDataLoading(true)
        setLoading(ui_loading)
        //------------------
        await getEUTxOs(poolInfo)
        await new Promise(r => setTimeout(r, 1000));
        //------------------
        setPoolData(poolInfo);    
        await new Promise(r => setTimeout(r, 1000));    
        //------------------
        setIsPoolDataLoaded(true)
        setIsPoolDataLoading(false)
        //------------------
    }

    function setPoolData(poolInfo: StakingPoolDBInterface) {
        setSwShowOnHomeUI(poolInfo.swShowOnHome ? "Yes" : "No");
        setSwPreparadoUI(poolInfo.swPreparado ? "Yes" : "No");
        setSwIniciadoUI(poolInfo.swIniciado ? "Yes" : "No");
        setSwFundedUI(poolInfo.swFunded ? "Yes" : "No");
        setSwClosedUI(poolInfo.swClosed ? "Yes" : "No");
        setSwTerminatedUI(poolInfo.swTerminated ? "Yes" : "No");
        setSwPoolReadyForGiveBackFundsUI(poolInfo.swZeroFunds && poolInfo.swTerminated ? "Yes" : "No");
        setSwPoolReadyForDeleteMainScriptsUI(poolInfo.swPoolReadyForDeleteMainScripts ? "Yes" : "No");
        setSwPoolReadyForDeletePoolInDBUI(poolInfo.swPoolReadyForDeletePoolInDB ? "Yes" : "No");
        //------------------
        if(poolInfo.pParams.ppGraceTime < 1000){
            setGraceTimeUI(poolInfo.pParams.ppGraceTime.toString() + " ms")
        }else if(poolInfo.pParams.ppGraceTime < 1000 * 60){
            setGraceTimeUI((Number(poolInfo.pParams.ppGraceTime) / 1000).toString() + " seconds")
        }else if(poolInfo.pParams.ppGraceTime < 1000 * 60 * 60){
            setGraceTimeUI((Number(poolInfo.pParams.ppGraceTime) / (1000 * 60)).toString() + " minutes")
        }else if(poolInfo.pParams.ppGraceTime < 1000 * 60 * 60 * 24){
            setGraceTimeUI((Number(poolInfo.pParams.ppGraceTime) / (1000 * 60 * 60)).toString() + " hours")
        }else{
            setGraceTimeUI((Number(poolInfo.pParams.ppGraceTime) / (1000 * 60 * 60 * 24)).toString() + " days")
        }
        //------------------
        if (poolInfo.closedAt !== undefined) {
            setClosedAtUI(poolInfo.closedAt.toString());
            setTerminatedAtUI(new Date(poolInfo.closedAt.getTime() + Number(poolInfo.graceTime)).toString());
        } else {
            setClosedAtUI(new Date(parseInt(poolInfo.pParams.ppDeadline.toString())).toString());
            setTerminatedAtUI(new Date(poolInfo.deadline.getTime() + Number(poolInfo.graceTime)).toString());
        }
        //------------------
        const swAnyScriptsMaster = (
            poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum !== undefined);
        const swAllScriptsMaster = (
            poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum !== undefined);
        const swAnyMainScripts = (
            poolInfo.eUTxO_With_ScriptDatum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum !== undefined)    
        //------------------
        const swAnyScriptsUser = (
            poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum !== undefined ||
            poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum !== undefined);
        const swAllScriptsUser = (
            poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum !== undefined);
        const swAllMainScripts = (
            poolInfo.eUTxO_With_ScriptDatum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum !== undefined &&
            poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum !== undefined)    
        //------------------
        setSwAnyScriptsMaster(swAnyScriptsMaster);
        setSwAnyScriptsUser(swAnyScriptsUser);
        setSwAnyMainScripts(swAnyMainScripts);
        //------------------
        setSwAllScriptsMaster(swAllScriptsMaster);
        setSwAllScriptsUser(swAllScriptsUser);
        setSwAllMainScripts(swAllMainScripts);
    }

    return {
        poolInfo,

        swShowOnHomeUI,
        swPreparadoUI, 
        swIniciadoUI, 
        swFundedUI,
        swClosedUI, 
        swTerminatedUI, 
        closedAtUI, 
        graceTimeUI,
        terminatedAtUI,
        swPoolReadyForGiveBackFundsUI,
        swPoolReadyForDeleteMainScriptsUI,
        swPoolReadyForDeletePoolInDBUI,

        eUTxOs_With_Datum,
        eUTxO_With_PoolDatum,
        eUTxOs_With_FundDatum, 
        eUTxOs_With_UserDatum, 

        countEUTxOs_With_DatumUI,
        countEUTxOs_With_FundDatumUI,
        countEUTxOs_With_UserDatumUI,

        masterFunders,
        userStakedDatas,

        totalFundsAvailableUI, 
        totalFundAmountUI, 
        totalFundAmountsRemains_ForMasterUI,
        totalStakedUI, 
        totalRewardsPaidUI, 
        totalRewardsToPayUI, 
        totalUsersMinAdaUI, 
        totalMastersMinAdaUI,

        swUserRegistered,
        swAnyScriptsMaster,
        swAnyScriptsUser,
        swAnyMainScripts,
        swAllScriptsMaster,
        swAllScriptsUser,
        swAllMainScripts,

        isPoolDataLoading,
        isPoolDataLoaded,

        refreshPoolData, 
        refreshEUTxOs
    }

    
}


