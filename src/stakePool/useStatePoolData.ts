//--------------------------------------
import { useEffect, useRef, useState } from "react";
import { AssetClass, BIGINT, EUTxO, Master_Funder, PoolDatum, UserDatum } from "../types";
import { ADA_Decimals, ADA_UI, fundID_TN, poolDatum_ClaimedFund, poolID_TN, scriptID_Master_AddScripts_TN, scriptID_Master_ClosePool_TN, scriptID_Master_DeleteFund_TN, scriptID_Master_DeleteScripts_TN, scriptID_Master_FundAndMerge_TN, scriptID_Master_Fund_TN, scriptID_Master_SendBackDeposit_TN, scriptID_Master_SendBackFund_TN, scriptID_Master_SplitFund_TN, scriptID_Master_TerminatePool_TN, scriptID_User_Deposit_TN, scriptID_User_Harvest_TN, scriptID_User_Withdraw_TN, scriptID_Validator_TN, txID_Master_AddScripts_TN, userID_TN } from "../types/constantes";
import { StakingPoolDBInterface } from "../types/stakePoolDBModel";
import { apiSaveEUTxODB, apiGetEUTxOsDBByStakingPool,
    apiGetStakingPoolDB, 
    apiGetTokenMetadata} from "./apis";
import { formatAmount, strToHex, toJson } from "../utils/utils";
import { useStoreState } from "../utils/walletProvider";
import {
    getEUTxOs_With_FundDatum_InEUxTOList, getEUTxOs_With_UserDatum_InEUxTOList,
    getEUTxOs_With_UserDatum_InEUxTOList_OfUser, getEUTxO_With_PoolDatum_InEUxTOList, getEUTxO_With_ScriptDatum_InEUxTOList, getMissingEUTxOsInDB
} from "./helpersEUTxOs";
import {
    getIfUserRegistered, getTotalAvailaibleFunds, getTotalCashedOut, getTotalFundAmount, getTotalFundAmountsRemains_ForMasters, getTotalMastersMinAda_In_EUTxOs_With_UserDatum, getTotalRewardsToPay_In_EUTxOs_With_UserDatum, getTotalStakedAmount, getTotalUsersMinAda_In_EUTxOs_With_UserDatum, getUserRewardsPaid,
    getUserRewardsToPay, getUserStaked, sortFundDatum
} from "./helpersStakePool";
import { useSession } from "next-auth/react";
//--------------------------------------
type UserStakedData = {
    eUTxO_With_UserDatum: EUTxO | undefined,
    stakedAmountUI: string | 0;
    minADA: BIGINT;
    minADAUI: string | 0;
    createdAtUI: string | 0;
    lastClaimAtUI: string | 0;
    rewardsPaidUI: string | 0;
    rewardsToPay: BIGINT;
    rewardsToPayUI: string | 0;
    isLoading: boolean;
}
//--------------------------------------
export default function useStatePoolData(stakingPoolInfo: StakingPoolDBInterface) {

    //string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
    const ui_loading = 0
    const ui_notConnected = '...'

    const { data: session, status } = useSession()
    
    //console.log("useStatePoolData - " + stakingPoolInfo.name + " - INIT")
    
    const [poolInfo, setPoolInfo] = useState(stakingPoolInfo)

    const [isPoolDataLoaded, setIsPoolDataLoaded] = useState(false)
    const [isPoolDataLoading, setIsPoolDataLoading] = useState(false)
    
    const [statusUI, setStatusUI] = useState<string | 0> (ui_loading)
    const [tx_countUI, setTx_countUI] = useState<string | 0> (ui_loading)

    const [swShowOnHomeUI, setSwShowOnHomeUI] = useState<string | 0 > (ui_loading)
    const [swPreparadoUI, setSwPreparadoUI] = useState<string | 0 > (ui_loading)
    const [swIniciadoUI, setSwIniciadoUI] = useState<string | 0 > (ui_loading)
    const [swFundedUI, setSwFundedUI] = useState<string | 0 > (ui_loading)
    const [swClosedUI, setSwClosedUI] = useState<string | 0 > (ui_loading)
    const [swTerminatedUI, setSwTerminatedUI] = useState<string | 0 > (ui_loading)
    const [swPoolReadyForGiveBackFundsUI, setSwPoolReadyForGiveBackFundsUI] = useState<string | 0 > (ui_loading)
    const [swPoolReadyForDeleteMasterAndUserScriptsUI, setSwPoolReadyForDeleteMasterAndUserScriptsUI] = useState<string | 0 > (ui_loading)
    const [swPoolReadyForDeleteMainScriptsUI, setSwPoolReadyForDeleteMainScriptsUI] = useState<string | 0 > (ui_loading)
    const [swPoolReadyForDeletePoolInDBUI, setSwPoolReadyForDeletePoolInDBUI] = useState<string | 0 > (ui_loading)
    const [beginAtUI, setBeginAtUI] = useState<string | 0 > (ui_loading)
    const [closedAtUI, setClosedAtUI] = useState<string | 0 > (ui_loading)
    const [graceTimeUI, setGraceTimeUI] = useState<string | 0 > (ui_loading)
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

    // const [staking_Decimals, setStaking_Decimals] = useState<number>(0)
    // const [harvest_Decimals, setHarvest_Decimals] = useState<number>(0)

    const [interestUI, setInterestUI] = useState<string | 0> (ui_loading)
    
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

    const [userStaked,         setUserStaked] = useState<BIGINT>(0n)
    const [userStakedUI,       setUserStakedUI] = useState<string | 0>(ui_loading)
    const [userRewardsPaidUI,  setUserRewardsPaidUI] = useState<string | 0>(ui_loading)
    const [userRewardsToPayUI, setUserRewardsToPayUI] = useState<string | 0>(ui_loading)

    const [userRegisteredUI, setUserRegisteredUI] = useState<string | 0>(ui_loading)

    // const walletStore = useStoreState(state => state.wallet)
    // const { isWalletDataLoaded } = useStoreState(state => {
    //     return { isWalletDataLoaded: state.isWalletDataLoaded };
    // });

    useEffect(() => {
        if (status !== "loading"){
            // console.log("useStatePoolData - " + poolInfo.name + " - useEffect - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
            console.log("useStatePoolData - " + poolInfo.name + " - useEffect - status: " + status )
            refreshEUTxOs()
        }
        // console.log("useStatePoolData - " + poolInfo.name + " - useEffect - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
        // if (!walletStore.connected) {
        //     setLoading(ui_notConnected)
        // } else {
        //     // console.log("useStatePoolData - " + poolInfo.name + " - useEffectB - isPoolDataLoading: " + isPoolDataLoading + " - isPoolDataLoaded: " + isPoolDataLoaded + " - isWalletDataLoaded: " + isWalletDataLoaded)
        //     refreshEUTxOs()
        // }
    }, [status])

    const setLoading = (ui: string | 0) => {
        // console.log("useStatePoolData - " + poolInfo.name + " - setLoading: " + ui)

        setIsPoolDataLoaded(false)

        setStatusUI(ui)
        setTx_countUI(ui)

        setSwShowOnHomeUI(ui)
        setSwPreparadoUI(ui)
        setSwIniciadoUI(ui)
        setSwFundedUI(ui)
        setSwClosedUI(ui)
        setSwTerminatedUI(ui)
        setSwPoolReadyForGiveBackFundsUI(ui)
        setSwPoolReadyForDeleteMainScriptsUI(ui)
        setSwPoolReadyForDeletePoolInDBUI(ui)
        
        setBeginAtUI(ui)
        setClosedAtUI(ui)
        setGraceTimeUI(ui)
        setTerminatedAtUI(ui)

        setInterestUI(ui)

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

        setUserStaked(0n)
        setUserStakedUI(ui)
        setUserRewardsPaidUI(ui)
        setUserRewardsToPayUI(ui)

        var userStakedDatas_: UserStakedData[] = []
        for (var i = 0; i < userStakedDatas.length; i += 1) {
            const u = userStakedDatas[i];

            const userStakedData: UserStakedData = {
                eUTxO_With_UserDatum: u.eUTxO_With_UserDatum,
                stakedAmountUI: ui,
                minADA: u.minADA,
                minADAUI: ui,
                createdAtUI: ui,
                lastClaimAtUI: ui,
                rewardsPaidUI: ui,
                rewardsToPay: 0n,
                rewardsToPayUI: ui,
                isLoading: true
            }
            userStakedDatas_.push(userStakedData)
        }
        setUserStakedDatas(userStakedDatas_)

    }

    const refreshPoolData = async () => {
        console.log("useStatePoolData - " + poolInfo.name + " - refreshPoolData - Init")
        //------------------
        setIsPoolDataLoading(true)
        setLoading(ui_loading)
        //------------------
        const poolInfo_ = await apiGetStakingPoolDB(poolInfo.name)
        //------------------
        setPoolInfo(poolInfo_)
        //------------------
        await setPoolData(poolInfo_);
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
        await setPoolData(poolInfo);    
        // await new Promise(r => setTimeout(r, 1000));    
        //------------------
        setIsPoolDataLoaded(true)
        setIsPoolDataLoading(false)
        //------------------
    }

    const refreshUserStakedData = async ( userStakedData: UserStakedData) => {
        console.log("useStatePoolData - " + poolInfo.name + " - refreshUserStakedData - Init")
        //------------------
        var userStakedDatas_: UserStakedData[] = []
        for (var i = 0; i < userStakedDatas.length; i += 1) {
            const u = userStakedDatas[i];

            if (eUTxO_With_PoolDatum && u.eUTxO_With_UserDatum && userStakedData.eUTxO_With_UserDatum && u.eUTxO_With_UserDatum.uTxO.txHash === userStakedData.eUTxO_With_UserDatum.uTxO.txHash && u.eUTxO_With_UserDatum.uTxO.outputIndex === userStakedData.eUTxO_With_UserDatum.uTxO.outputIndex) {

                const userDatum: UserDatum = u.eUTxO_With_UserDatum.datum as UserDatum;
                const pkh = userDatum.udUser

                const createdAtUI = new Date(parseInt(userDatum.udCreatedAt.toString())).toLocaleString("en-US")
                const lastClaimAtUI = ((userDatum.udLastClaimAt.val !== undefined) ?
                    new Date(parseInt(userDatum.udLastClaimAt.val.toString())).toLocaleString("en-US")
                    :
                    ui_notConnected
                )
                const stakedAmountUI = formatAmount(Number(getUserStaked(pkh, [u.eUTxO_With_UserDatum])), poolInfo.staking_Decimals, poolInfo.staking_UI)
                const minADA = getTotalUsersMinAda_In_EUTxOs_With_UserDatum(poolInfo, [u.eUTxO_With_UserDatum])
                const minADAUI = formatAmount(Number(minADA), ADA_Decimals, ADA_UI)
                const rewardsPaidUI = formatAmount(Number(getUserRewardsPaid(pkh, [u.eUTxO_With_UserDatum])), poolInfo.harvest_Decimals, poolInfo.harvest_UI)
                
                const rewardsToPay = getUserRewardsToPay(poolInfo, pkh, eUTxO_With_PoolDatum, [u.eUTxO_With_UserDatum])
                const rewardsToPayUI = formatAmount(Number(rewardsToPay), poolInfo.harvest_Decimals, poolInfo.harvest_UI)

                const userStakedData: UserStakedData = {
                    eUTxO_With_UserDatum: u.eUTxO_With_UserDatum,
                    stakedAmountUI: stakedAmountUI,
                    minADA: minADA,
                    minADAUI: minADAUI,
                    createdAtUI: createdAtUI,
                    lastClaimAtUI: lastClaimAtUI,
                    rewardsPaidUI: rewardsPaidUI,
                    rewardsToPay: rewardsToPay,
                    rewardsToPayUI: rewardsToPayUI,
                    isLoading: false
                }

                userStakedDatas_.push(userStakedData)
            } else {
                userStakedDatas_.push(u)
            }
        }
        setUserStakedDatas(userStakedDatas_)
        //------------------
    }
    

    async function setPoolData(poolInfo: StakingPoolDBInterface) {
        console.log("useStatePoolData - " + poolInfo.name + " - setPoolData - Init")
        //------------------
        const staking_CS = stakingPoolInfo.staking_Lucid.slice(0, 56)
        const staking_TN = stakingPoolInfo.staking_Lucid.slice(56)
        const staking_AC_isAda = (staking_CS === 'lovelace')
        const staking_AC_isWithoutTokenName = !staking_AC_isAda && staking_TN == ""
        //------------------
        const harvest_CS = stakingPoolInfo.harvest_Lucid.slice(0, 56)
        const harvest_TN = stakingPoolInfo.harvest_Lucid.slice(56)
        const harvest_AC_isAda = (harvest_CS === 'lovelace')
        const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
        //------------------
        setInterestUI(formatAmount(Number(poolInfo.pParams.ppInterestRates[0].iPercentage), poolInfo.harvest_Decimals - poolInfo.staking_Decimals, poolInfo.harvest_UI))
        //------------------
        const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
        //------------------
        const fundID_CS = poolInfo.txID_Master_Fund_CS
        const fundID_AC_Lucid = fundID_CS + strToHex(fundID_TN);
        //------------------
        // const userID_CS = poolInfo.txID_User_Deposit_CS
        // const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
        //------------------
        // const txID_Master_AddScripts_CS = poolInfo.txID_Master_AddScripts_CS
        // const txID_Master_AddScripts_TN_Hex = strToHex(txID_Master_AddScripts_TN)
        // const txID_Master_AddScripts_AC_Lucid = txID_Master_AddScripts_CS + txID_Master_AddScripts_TN_Hex;
        //------------------
        var eUTxOs_With_Datum : EUTxO [] = []
        eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name);
        console.log("useStatePoolData - setPoolData - DB - length: " + eUTxOs_With_Datum.length)
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
                // console.log("useStatePoolData - " + poolInfo.name + " - setPoolData: Can't find any UTxO with PoolDatum");
                setEUTxO_With_PoolDatum(undefined)
                setEUTxOs_With_FundDatum([])
                setEUTxOs_With_UserDatum([])
                setMasterFunders([])
                setUserStakedDatas([])
                setCountEUTxOs_With_FundDatumUI('0')
                setCountEUTxOs_With_UserDatumUI('0')
                setTotalFundAmountUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalAvailaibleFundsUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalStakedUI(formatAmount(0, poolInfo.staking_Decimals, poolInfo.staking_UI))
                setTotalRewardsPaidUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalRewardsToPayUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalFundAmountsRemains_ForMasterUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalMastersMinAdaUI(formatAmount(0, ADA_Decimals, ADA_UI))
                setTotalUsersMinAdaUI(formatAmount(0, ADA_Decimals, ADA_UI))
                setUserRegisteredUI('0')
                setUserStaked(0n)
                setUserStakedUI(formatAmount(0, poolInfo.staking_Decimals, poolInfo.staking_UI))
                setUserRewardsPaidUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setUserRewardsToPayUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
            } else {
                //console.log("useStatePoolData - " + poolInfo.name + " - setPoolData: UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex)
                setEUTxO_With_PoolDatum(eUTxO_With_PoolDatum)
                setMasterFunders(eUTxO_With_PoolDatum.datum.pdMasterFunders)
                setTotalFundAmountUI(formatAmount(Number(getTotalFundAmount(eUTxO_With_PoolDatum)), poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalMastersMinAdaUI(formatAmount(Number(getTotalMastersMinAda_In_EUTxOs_With_UserDatum(poolInfo, eUTxO_With_PoolDatum)), ADA_Decimals, ADA_UI))
            }
        }
        var eUTxOs_With_FundDatum: EUTxO[] = []
        if (eUTxO_With_PoolDatum) {
            eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum)
            //console.log("useStatePoolData - " + poolInfo.name + " - setPoolData: UTxOs with FundDatum lenght: " + eUTxOs_With_FundDatum.length)
            if (eUTxOs_With_FundDatum.length === 0) {
                // console.log("useStatePoolData - " + poolInfo.name + " - setPoolData: Can't find any UTxO with FundDatum. Did you funded already?");
                setEUTxOs_With_FundDatum([])
                setCountEUTxOs_With_FundDatumUI('0')
                setTotalAvailaibleFundsUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
            } else {
                //console.log("useStatePoolData - " + poolInfo.name + " - setPoolData: UTxOs with FundDatum lenght: " + eUTxOs_With_FundDatum.length)
                const sorted_EUTxOs_With_FundDatum = sortFundDatum(poolInfo, eUTxOs_With_FundDatum)
                setEUTxOs_With_FundDatum(sorted_EUTxOs_With_FundDatum)
                setCountEUTxOs_With_FundDatumUI(eUTxOs_With_FundDatum.length.toString())
                setTotalAvailaibleFundsUI(formatAmount(Number(getTotalAvailaibleFunds(eUTxOs_With_FundDatum)), poolInfo.harvest_Decimals, poolInfo.harvest_UI))
            }
            setTotalFundAmountsRemains_ForMasterUI(formatAmount(Number(getTotalFundAmountsRemains_ForMasters(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum)[0]), poolInfo.harvest_Decimals, poolInfo.harvest_UI))
        }
        if (eUTxO_With_PoolDatum) {
            //------------------
            // busco si hay UTxO con UserDatum válidos
            const userID_CS = poolInfo.txID_User_Deposit_CS
            const userID_AC_Lucid = userID_CS + strToHex(userID_TN);
            const eUTxOs_With_UserDatum: EUTxO[] = getEUTxOs_With_UserDatum_InEUxTOList(userID_AC_Lucid, eUTxOs_With_Datum)
            //console.log("useStatePoolData - " + poolInfo.name + " - setPoolData: UTxOs with UserDatum lenght: " + eUTxOs_With_UserDatum.length)
            if (eUTxOs_With_UserDatum.length === 0) {
                // console.log("useStatePoolData - " + poolInfo.name + " - setPoolData: Can't find any UTxO with UserDatum.");
                setEUTxOs_With_UserDatum([])
                setCountEUTxOs_With_UserDatumUI('0')
                setTotalStakedUI(formatAmount(0, poolInfo.staking_Decimals, poolInfo.staking_UI))
                setTotalRewardsPaidUI(formatAmount(Number(getTotalCashedOut(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum)), poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalRewardsToPayUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalUsersMinAdaUI(formatAmount(0, ADA_Decimals, ADA_UI))
                setUserRegisteredUI('TODO')
                setUserStaked(0n)
                setUserStakedUI(formatAmount(0, poolInfo.staking_Decimals, poolInfo.staking_UI))
                setUserRewardsPaidUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setUserRewardsToPayUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setUserStakedDatas([])
            } else {
                //console.log("useStatePoolData - " + poolInfo.name + " - setPoolData: UTxOs with UserDatum lenght: " + eUTxOs_With_UserDatum.length)
                setEUTxOs_With_UserDatum(eUTxOs_With_UserDatum)
                setCountEUTxOs_With_UserDatumUI(eUTxOs_With_UserDatum.length.toString())

                setTotalStakedUI(formatAmount(Number(getTotalStakedAmount(eUTxOs_With_UserDatum)), poolInfo.staking_Decimals, poolInfo.staking_UI))
                setTotalRewardsPaidUI(formatAmount(Number(getTotalCashedOut(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum)), poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalRewardsToPayUI(formatAmount(Number(getTotalRewardsToPay_In_EUTxOs_With_UserDatum(poolInfo, eUTxO_With_PoolDatum, eUTxOs_With_UserDatum)), poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                setTotalUsersMinAdaUI(formatAmount(Number(getTotalUsersMinAda_In_EUTxOs_With_UserDatum(poolInfo, eUTxOs_With_UserDatum)), ADA_Decimals, ADA_UI))
                setUserRegisteredUI('TODO')
                
                if (session && session.user && session.user.pkh && getIfUserRegistered( session.user.pkh, eUTxOs_With_UserDatum)) {
                    setSwUserRegistered(true)
                    const eUTxOs_With_UserDatumOfUser = getEUTxOs_With_UserDatum_InEUxTOList_OfUser(eUTxOs_With_UserDatum, session.user.pkh)

                    const stakedAmount = getUserStaked(session.user.pkh, eUTxOs_With_UserDatumOfUser)
                    const stakedAmountUI = formatAmount(Number(stakedAmount), poolInfo.staking_Decimals, poolInfo.staking_UI)
                    const rewardsPaidUI = formatAmount(Number(getUserRewardsPaid(session.user.pkh, eUTxOs_With_UserDatumOfUser)), poolInfo.harvest_Decimals, poolInfo.harvest_UI)
                    const rewardsToPayUI = formatAmount(Number(getUserRewardsToPay(poolInfo, session.user.pkh, eUTxO_With_PoolDatum, eUTxOs_With_UserDatumOfUser)), poolInfo.harvest_Decimals, poolInfo.harvest_UI)
                    setUserStaked(stakedAmount)
                    setUserStakedUI(stakedAmountUI)
                    setUserRewardsPaidUI(rewardsPaidUI)
                    setUserRewardsToPayUI(rewardsToPayUI)
                    
                    var userStakedDatas: UserStakedData[] = []
                    for (var i = 0; i < eUTxOs_With_UserDatumOfUser.length; i += 1) {
                        const userDatum: UserDatum = eUTxOs_With_UserDatumOfUser[i].datum as UserDatum;
                        const createdAtUI = new Date(parseInt(userDatum.udCreatedAt.toString())).toLocaleString("en-US")
                        const lastClaimAtUI = ((userDatum.udLastClaimAt.val !== undefined) ?
                            new Date(parseInt(userDatum.udLastClaimAt.val.toString())).toLocaleString("en-US")
                            :
                            ui_notConnected
                        )
                        const stakedAmountUI = formatAmount(Number(getUserStaked(session.user.pkh, [eUTxOs_With_UserDatumOfUser[i]])), poolInfo.staking_Decimals, poolInfo.staking_UI)
                        const minADA = getTotalUsersMinAda_In_EUTxOs_With_UserDatum(poolInfo, [eUTxOs_With_UserDatumOfUser[i]])
                        const minADAUI = formatAmount(Number(minADA), ADA_Decimals, ADA_UI)
                        const rewardsPaidUI = formatAmount(Number(getUserRewardsPaid(session.user.pkh, [eUTxOs_With_UserDatumOfUser[i]])), poolInfo.harvest_Decimals, poolInfo.harvest_UI)
                        
                        const rewardsToPay = getUserRewardsToPay(poolInfo, session.user.pkh, eUTxO_With_PoolDatum, [eUTxOs_With_UserDatumOfUser[i]])
                        const rewardsToPayUI = formatAmount(Number(rewardsToPay), poolInfo.harvest_Decimals, poolInfo.harvest_UI)

                        const userStakedData: UserStakedData = {
                            eUTxO_With_UserDatum: eUTxOs_With_UserDatumOfUser[i],
                            stakedAmountUI: stakedAmountUI,
                            minADA: minADA,
                            minADAUI: minADAUI,
                            createdAtUI: createdAtUI,
                            lastClaimAtUI: lastClaimAtUI,
                            rewardsPaidUI: rewardsPaidUI,
                            rewardsToPay: rewardsToPay,
                            rewardsToPayUI: rewardsToPayUI,
                            isLoading: false
                        }
                        userStakedDatas.push(userStakedData)
                    }
                    setUserStakedDatas(userStakedDatas)
                } else {
                    setUserStaked(0n)
                    setUserStakedUI(formatAmount(0, poolInfo.staking_Decimals, poolInfo.staking_UI))
                    setUserRewardsPaidUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                    setUserRewardsToPayUI(formatAmount(0, poolInfo.harvest_Decimals, poolInfo.harvest_UI))
                    setUserStakedDatas([])
                }
            }
        }
        //------------------
        if(poolInfo.swTerminated){
            setStatusUI("Terminated")
        }else if (poolInfo.swClosed){
            setStatusUI("Closed")
        }else if(poolInfo.swPreparado){
            if(poolInfo.swIniciado){
                if(poolInfo.swFunded){
                    setStatusUI("Active")
                }else{
                    setStatusUI("Waiting for Funding")
                }
            }else{
                setStatusUI("Not Started")
            }
        }else{
            setStatusUI("Not Ready")
        }
        //------------------
        setTx_countUI(formatAmount(Number(poolInfo.tx_count), 0, ""))
        //------------------
        setSwShowOnHomeUI(poolInfo.swShowOnHome ? "Yes" : "No");
        setSwPreparadoUI(poolInfo.swPreparado ? "Yes" : "No");
        setSwIniciadoUI(poolInfo.swIniciado ? "Yes" : "No");
        setSwFundedUI(poolInfo.swFunded ? "Yes" : "No");
        setSwClosedUI(poolInfo.swClosed ? "Yes" : "No");
        setSwTerminatedUI(poolInfo.swTerminated ? "Yes" : "No");
        setSwPoolReadyForGiveBackFundsUI(poolInfo.swZeroFunds && poolInfo.swTerminated ? "Yes" : "No");
        setSwPoolReadyForDeleteMasterAndUserScriptsUI(poolInfo.swPoolReadyForDeleteMasterAndUserScripts ? "Yes" : "No");
        setSwPoolReadyForDeleteMainScriptsUI(poolInfo.swPoolReadyForDeleteMainScripts ? "Yes" : "No");
        setSwPoolReadyForDeletePoolInDBUI(poolInfo.swPoolReadyForDeletePoolInDB ? "Yes" : "No");
        //------------------
        setBeginAtUI(new Date(parseInt(poolInfo.pParams.ppBegintAt.toString())).toLocaleString("en-US"));
        //------------------
        if (poolInfo.closedAt !== undefined) {
            setClosedAtUI(poolInfo.closedAt.toLocaleString("en-US"));
            setTerminatedAtUI(new Date(poolInfo.closedAt.getTime() + Number(poolInfo.graceTime)).toLocaleString("en-US"));
        } else {
            setClosedAtUI(new Date(parseInt(poolInfo.pParams.ppDeadline.toString())).toLocaleString("en-US"));
            setTerminatedAtUI(new Date(poolInfo.deadline.getTime() + Number(poolInfo.graceTime)).toLocaleString("en-US"));
        }
        //------------------
        if(poolInfo.pParams.ppGraceTime < 1000){
            setGraceTimeUI(poolInfo.pParams.ppGraceTime.toLocaleString("en-US", {maximumFractionDigits: 2}) + " ms")
        }else if(poolInfo.pParams.ppGraceTime < 1000 * 60){
            setGraceTimeUI((Number(poolInfo.pParams.ppGraceTime) / 1000).toLocaleString("en-US", {maximumFractionDigits: 2}) + " seconds")
        }else if(poolInfo.pParams.ppGraceTime < 1000 * 60 * 60){
            setGraceTimeUI((Number(poolInfo.pParams.ppGraceTime) / (1000 * 60)).toLocaleString("en-US", {maximumFractionDigits: 2}) + " minutes")
        }else if(poolInfo.pParams.ppGraceTime < 1000 * 60 * 60 * 24){
            setGraceTimeUI((Number(poolInfo.pParams.ppGraceTime) / (1000 * 60 * 60)).toLocaleString("en-US", {maximumFractionDigits: 2}) + " hours")
        }else{
            setGraceTimeUI((Number(poolInfo.pParams.ppGraceTime) / (1000 * 60 * 60 * 24)).toLocaleString("en-US", {maximumFractionDigits: 2}) + " days")
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

        statusUI,
        tx_countUI,
        swShowOnHomeUI,
        swPreparadoUI, 
        swIniciadoUI, 
        swFundedUI,
        swClosedUI, 
        swTerminatedUI, 
        beginAtUI,
        closedAtUI, 
        graceTimeUI,
        terminatedAtUI,
        swPoolReadyForGiveBackFundsUI,
        swPoolReadyForDeleteMasterAndUserScriptsUI,
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

        // staking_Decimals,
        // harvest_Decimals,
        interestUI,

        totalFundsAvailableUI, 
        totalFundAmountUI, 
        totalFundAmountsRemains_ForMasterUI,
        totalStakedUI, 
        totalRewardsPaidUI, 
        totalRewardsToPayUI, 
        totalUsersMinAdaUI, 
        totalMastersMinAdaUI,

        userStaked,
		userStakedUI, 
		userRewardsPaidUI, 
		userRewardsToPayUI,

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
        refreshEUTxOs,
        refreshUserStakedData
    }

    
}


