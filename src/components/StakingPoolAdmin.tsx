//--------------------------------------
import { Address, Assets, UTxO } from 'lucid-cardano';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { escape } from 'querystring';
import { useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { apiUpdateStakingPoolShowOnHomeDB, apiDeleteStakingPoolDB, apiDeleteEUTxOsDBByStakingPool } from '../stakePool/apis';
import { masterClosePool, masterDeleteFunds, masterFundAndMerge, masterGetBackFund, masterMergeFunds, masterNewFund, masterPreparePool, masterSendBackDeposit, masterSendBackFund, masterSplitFund, masterTerminatePool } from '../stakePool/endPoints - master';
import {
	masterAddScriptsMasterClosePool, masterAddScriptsMasterDeleteFund, masterAddScriptsMasterDeleteScripts, masterAddScriptsMasterFund, masterAddScriptsMasterFundAndMerge, masterAddScriptsMasterSendBackDeposit, masterAddScriptsMasterSendBackFund, masterAddScriptsMasterSplitFund, masterAddScriptsMasterTerminatePool, masterAddScriptsUserDeposit, masterAddScriptsUserHarvest, masterAddScriptsUserWithdraw, masterDeleteScripts,
} from "../stakePool/endPoints - master - scripts";
import { splitUTxOs } from "../stakePool/endPoints - splitUTxOs";
import { explainErrorTx } from "../stakePool/explainError";
import { getEUTxO_With_ScriptDatum_InEUxTOList } from '../stakePool/helpersEUTxOs';
import { stakingPoolDBParser } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO, Master } from '../types';
import { maxTokensWithDifferentNames, scriptID_Master_ClosePool_TN, scriptID_Master_DeleteFund_TN, scriptID_Master_FundAndMerge_TN, scriptID_Master_Fund_TN, scriptID_Master_SendBackDeposit_TN, scriptID_Master_SendBackFund_TN, scriptID_Master_SplitFund_TN, scriptID_Master_TerminatePool_TN, scriptID_User_Deposit_TN, scriptID_User_Harvest_TN, scriptID_User_Withdraw_TN, txID_Master_AddScripts_TN, txID_User_Deposit_For_User_TN } from '../types/constantes';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { formatHash } from '../utils/cardano-helpers';
import { newTransaction } from '../utils/cardano-helpersTx';
import { pushSucessNotification, pushWarningNotification } from "../utils/pushNotification";
import { copyToClipboard, formatAmount, htmlEscape, searchValueInArray, strToHex, toJson } from '../utils/utils';
import { useStoreActions, useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import ActionWithSelectInputModalBtn from './ActionWithSelectInputModalBtn';
import EUTxOsModalBtn from './EUTxOsModalBtn';
import FundsModalBtn from './FundsModalBtn';
import LoadingSpinner from './LoadingSpinner';
import MasterModalBtn from './MastersModalBtn';
import UsersModalBtn from './UsersModalBtn';
//--------------------------------------

export default function StakingPoolAdmin({ stakingPoolInfo }: { stakingPoolInfo: StakingPoolDBInterface }) {
	//console.log("StakingPoolAdmin - " + stakingPoolInfo.name + " - INIT")

	//string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
	const ui_loading = 0
	const ui_notConnected = '...'

	const router = useRouter();

	const walletStore = useStoreState(state => state.wallet)
	const { uTxOsAtWallet, isWalletDataLoaded, getTotalOfUnit } = useStoreState(state => {
		return { uTxOsAtWallet: state.uTxOsAtWallet, isWalletDataLoaded: state.isWalletDataLoaded, getTotalOfUnit: state.walletGetTotalOfUnit };
	});
	const { loadWalletData } = useStoreActions(actions => {
		return { loadWalletData: actions.loadWalletData };
	});

	const [isWorking, setIsWorking] = useState("")
	const isCancelling = useRef(false);
	const isWorkingInABuffer = useRef(false);
	const setIsWorkingInABuffer = (value: boolean) => {
		isWorkingInABuffer.current = value
	}
	const setIsCanceling = (value: boolean) => {
		isCancelling.current = value
	}

	const [actionMessage, setActionMessage] = useState("")
	const [actionHash, setActionHash] = useState("")

	const [walletStakingAmountUI, setWalletStakingAmountUI] = useState<string | 0>(ui_notConnected)
	const [walletHarvestAmountUI, setWalletHarvestAmountUI] = useState<string | 0>(ui_notConnected)
	const [maxStakingAmountUI, setMaxStakingAmountUI] = useState<string | 0>(ui_notConnected)
	const [maxHarvestAmountUI, setMaxHarvestAmountUI] = useState<string | 0>(ui_notConnected)

	const [isMasterUI, setIsMasterUI] = useState<string | 0>(ui_notConnected)

	const statePoolData = useStatePoolData(stakingPoolInfo)

	const {

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

		swAnyScriptsMaster,
		swAnyScriptsUser,
		swAnyMainScripts,
		swAllScriptsMaster,
		swAllScriptsUser,
		swAllMainScripts,

		eUTxO_With_PoolDatum,
		eUTxOs_With_FundDatum, 
		eUTxOs_With_UserDatum, 

		countEUTxOs_With_DatumUI,
		countEUTxOs_With_FundDatumUI,
		countEUTxOs_With_UserDatumUI,

		//staking_Decimals,
        //harvest_Decimals,

		interestUI,

		totalFundsAvailableUI,
		totalStakedUI, 
		totalRewardsPaidUI, 
		totalRewardsToPayUI,

		isPoolDataLoading, 
		isPoolDataLoaded,

		refreshPoolData

	} = statePoolData

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

	useEffect(() => {
		// console.log("StakingPoolAdmin - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)
		if (walletStore.connected && !isWalletDataLoaded) {
			setWalletStakingAmountUI(ui_loading)
			setWalletHarvestAmountUI(ui_loading)
			setMaxStakingAmountUI(ui_loading)
			setMaxHarvestAmountUI(ui_loading)
			setIsMasterUI(ui_loading)
		} else if (walletStore.connected && isWalletDataLoaded) {
			//------------------
			const walletStakingAmount = getTotalOfUnit(poolInfo.staking_Lucid)
			const walletHarvestAmount = getTotalOfUnit(poolInfo.harvest_Lucid)
			//------------------
			setWalletStakingAmountUI(walletStakingAmount.toString())
			setWalletHarvestAmountUI(walletHarvestAmount.toString())
			//------------------
			if (walletStakingAmount > maxTokensWithDifferentNames && staking_AC_isWithoutTokenName) {
				setMaxStakingAmountUI(maxTokensWithDifferentNames.toString())
			} else {
				setMaxStakingAmountUI(walletStakingAmount.toString())
			}
			//------------------
			if (walletHarvestAmount > maxTokensWithDifferentNames && harvest_AC_isWithoutTokenName) {
				setMaxHarvestAmountUI(maxTokensWithDifferentNames.toString())
			} else {
				setMaxHarvestAmountUI(walletHarvestAmount.toString())
			}
			//------------------
			setIsMasterUI(searchValueInArray(poolInfo.masters, walletStore.pkh) ? "Yes" : "No")
		} else {
			setWalletStakingAmountUI(ui_notConnected)
			setWalletHarvestAmountUI(ui_notConnected)
			setMaxStakingAmountUI(ui_notConnected)
			setMaxHarvestAmountUI(ui_notConnected)
			setIsMasterUI(ui_notConnected)
		}
	}, [walletStore, isWalletDataLoaded])

	//--------------------------------------

	const handleSetIsWorking = async (isWorking: string) => {
		console.log("StakingPoolAdmin - " + poolInfo.name + " - handleSetIsWorking isWorking: ", isWorking)
		setIsWorking(isWorking)
		return isWorking
	}

	const handleCancel = async () => {
		console.log("StakingPoolAdmin - " + poolInfo.name + " - handleCancel")
		if (!isCancelling.current && isWorkingInABuffer.current) {
			setActionMessage(actionMessage + " (Canceling when this Tx finishes)")
			setIsCanceling(true)
		}
	}

	const updateDetailsStakingPool = async () => {
		const poolInfo = await refreshPoolData()
		return poolInfo	
	}

	const updateDetailsStakingPoolAndWallet = async () => {
		const poolInfo = await updateDetailsStakingPool()
		if (walletStore.connected) await loadWalletData(walletStore)
		return poolInfo	
	}

	const updatePageInTimeOut = async () => {
		setTimeout(router.replace, 3000, router.asPath)
	}

	//--------------------------------------

	const masterPreparePoolAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Create Pool", walletStore, poolInfo, masterPreparePool, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	//--------------------------------------

	const mastertAddScriptsMasterFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Fund", walletStore, poolInfo, masterAddScriptsMasterFund, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsMasterFundAndMergeAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Fund And Merge", walletStore, poolInfo, masterAddScriptsMasterFundAndMerge, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsMasterSplitFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Split Fund", walletStore, poolInfo, masterAddScriptsMasterSplitFund, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsMasterCloseAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Close Pool", walletStore, poolInfo, masterAddScriptsMasterClosePool, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsMasterTerminateAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Terminate Pool", walletStore, poolInfo, masterAddScriptsMasterTerminatePool, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsMasterDeleteFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Delete Fund", walletStore, poolInfo, masterAddScriptsMasterDeleteFund, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsMasterDeleteScriptsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Delete Scripts", walletStore, poolInfo, masterAddScriptsMasterDeleteScripts, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsMasterSendBackFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Send Back Fund", walletStore, poolInfo, masterAddScriptsMasterSendBackFund, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsMasterSendBackDepositAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - Master Send Back Deposit", walletStore, poolInfo, masterAddScriptsMasterSendBackDeposit, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsUserDepositAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - User Deposit", walletStore, poolInfo, masterAddScriptsUserDeposit, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsUserHarvestAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - User Harvest", walletStore, poolInfo, masterAddScriptsUserHarvest, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterAddScriptsUserWithdrawAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Add Script - User Withdraw", walletStore, poolInfo, masterAddScriptsUserWithdraw, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const mastertDeleteScripts = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Delete Scripts", walletStore, poolInfo, masterDeleteScripts, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	//--------------------------------------

	const masterNewFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - New Fund", walletStore, poolInfo, masterNewFund, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterFundAndMergeAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Fund And Merge", walletStore, poolInfo, masterFundAndMerge, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterMergeFundsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Merge Funds", walletStore, poolInfo, masterMergeFunds, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterSplitFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Split Fund", walletStore, poolInfo, masterSplitFund, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterDeleteFundsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Delete Funds", walletStore, poolInfo, masterDeleteFunds, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterClosePoolAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Close Pool", walletStore, poolInfo, masterClosePool, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterTerminatePoolAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Terminate Pool", walletStore, poolInfo, masterTerminatePool, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterGetBackFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Get Back Funds", walletStore, poolInfo, masterGetBackFund, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	const masterSendBackFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined, master_Selected?: Master) => {
		return await newTransaction("StakingPoolAdmin - Send Back Funds", walletStore, poolInfo, masterSendBackFund, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets, master_Selected)
	}

	const masterSendBackDepositAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Send Back Invests", walletStore, poolInfo, masterSendBackDeposit, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	//--------------------------------------

	const masterAddScriptsMasterAllAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		console.log("StakingPoolAdmin - Add Scripts - Master All - " + toJson(poolInfo?.name))
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		setIsCanceling(false)
		try {
			if (swAllScriptsMaster) {
				throw "No Master Scripts to Add"
			}
			var poolInfo_updated = poolInfo!
			var swSeparate = false
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_Fund_Datum === undefined) {
				setActionMessage("Adding Script - Master Fund, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertAddScriptsMasterFundAction(poolInfo)
				pushSucessNotification("Add Script - Master Fund", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === undefined) {
				setActionMessage("Adding Script - Master Fund And Merge, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsMasterFundAndMergeAction(poolInfo_updated)
				pushSucessNotification("Add Script - Master Fund And Merge", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_SplitFund_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_SplitFund_Datum === undefined) {
				setActionMessage("Adding Script - Master Split Fund, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsMasterSplitFundAction(poolInfo_updated)
				pushSucessNotification("Add Script - Master Split Fund", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_ClosePool_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_ClosePool_Datum === undefined) {
				setActionMessage("Adding Script - Master Close Pool, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsMasterCloseAction(poolInfo_updated)
				pushSucessNotification("Add Script - Master Close Pool", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_TerminatePool_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_TerminatePool_Datum === undefined) {
				setActionMessage("Adding Script - Master Terminate Pool, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsMasterTerminateAction(poolInfo_updated)
				pushSucessNotification("Add Script - Master Terminate Pool", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteFund_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteFund_Datum === undefined) {
				setActionMessage("Adding Script - Master Delete Fund, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsMasterDeleteFundAction(poolInfo_updated)
				pushSucessNotification("Add Script - Master Delete Fund", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum === undefined) {
				setActionMessage("Adding Script - Master Delete Scripts, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsMasterDeleteScriptsAction(poolInfo_updated)
				pushSucessNotification("Add Script - Master Delete Scripts", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackFund_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackFund_Datum === undefined) {
				setActionMessage("Adding Script - Master Send Back Fund, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsMasterSendBackFundAction(poolInfo_updated)
				pushSucessNotification("Add Script - Master Send Back Fund", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === undefined) {
				setActionMessage("Adding Script - Master Send Back Deposit, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsMasterSendBackDepositAction(poolInfo_updated)
				pushSucessNotification("Add Script - Master Send Back Deposit", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			return "All Master Scripts have been added"
		} catch (error: any) {
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			throw error
		}

		
	}

	//--------------------------------------

	const masterDeleteScriptsMasterAllAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		//------------------
		console.log("StakingPoolAdmin - Delete Scripts - Master All - " + toJson(poolInfo?.name))
		//------------------
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		setIsCanceling(false)
		//------------------
		try {
			if (!poolInfo!.swPoolReadyForDeleteMasterAndUserScripts){
				throw "Pool is not ready to Delete Master Scripts"
			}
			if (!swAnyScriptsMaster) {
				throw "No Master Scripts to Delete"
			}
			//------------------
			var poolInfo_updated = poolInfo!
			var swSeparate = false
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_Fund_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Fund, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_Fund_Datum])
				pushSucessNotification("Delete Script - Master Fund", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Fund And Merge, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum])
				pushSucessNotification("Delete Script - Master Fund And Merge", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_SplitFund_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_SplitFund_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Split Fund, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_SplitFund_Datum])
				pushSucessNotification("Delete Script - Master Split Fund", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_ClosePool_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_ClosePool_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Close Pool, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_ClosePool_Datum])
				pushSucessNotification("Delete Script - Master Close Pool", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_TerminatePool_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_TerminatePool_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Terminate Pool, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_TerminatePool_Datum])
				pushSucessNotification("Delete Script - Master Terminate Pool", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteFund_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteFund_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Delete Fund, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteFund_Datum])
				pushSucessNotification("Delete Script - Master Delete Fund", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackFund_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackFund_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Send Back Fund, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackFund_Datum])
				pushSucessNotification("Delete Script - Master Send Back Fund", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Send Back Deposit, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum])
				pushSucessNotification("Delete Script - Master Send Back Deposit", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			return "All Master Scripts have been Deleted"
		} catch (error: any) {
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			throw error
		}
	}

	//--------------------------------------

	const masterDeleteMainScriptsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		//------------------
		console.log("StakingPoolAdmin - Delete Main Scripts - " + toJson(poolInfo?.name))
		//------------------
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		setIsCanceling(false)
		//------------------
		try {
			if (!poolInfo!.swPoolReadyForDeleteMainScripts){
				throw "Pool is not ready to Delete Main Scripts"
			}
			if (!swAnyMainScripts) {
				throw "No Main Scripts to Delete"
			}
			//------------------
			var poolInfo_updated = poolInfo!
			var swSeparate = false
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_AddScripts_Datum !== undefined) {
				setActionMessage("Deleting Script - Master Add Scripts, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_AddScripts_Datum])
				pushSucessNotification("Delete Script - Master Add Scripts", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum !== undefined) {
				setActionMessage("Deleting Script - Mater Delete Scripts, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum])
				pushSucessNotification("Delete Scripts - Master Delelte Scripts", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_ScriptDatum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_ScriptDatum !== undefined) {
				setActionMessage("Deleting Script - Main Validator, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_ScriptDatum])
				pushSucessNotification("Delete Script - Main Validator", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			return "All Main Scripts have been Deleted"
		} catch (error: any) {
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			throw error
		}
	}
	

	//--------------------------------------

	const masterAddScriptsUserAllAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		console.log("StakingPoolAdmin - Add Scripts - User All - " + toJson(poolInfo?.name))
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		setIsCanceling(false)
		try {
			if (swAllScriptsUser) {
				throw "No User Scripts to Add"
			}
			var poolInfo_updated = poolInfo!
			var swSeparate = false
			if (poolInfo_updated.eUTxO_With_Script_TxID_User_Deposit_Datum === undefined) {
				setActionMessage("Adding Script - User Deposit, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsUserDepositAction(poolInfo_updated)
				pushSucessNotification("Add Script - User Deposit", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_User_Harvest_Datum === undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_User_Harvest_Datum === undefined) {
				setActionMessage("Adding Script - User Harvest, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsUserHarvestAction(poolInfo_updated)
				pushSucessNotification("Add Script - User Harvest", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_User_Withdraw_Datum === undefined){
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_User_Withdraw_Datum === undefined) {
				setActionMessage("Adding Script - User Withdraw, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterAddScriptsUserWithdrawAction(poolInfo_updated)
				pushSucessNotification("Add Script - User Withdraw", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			return "All User Scripts have been added"
		} catch (error: any) {
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			throw error
		}
	}

	//--------------------------------------

	const masterDeleteScriptsUserAllAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		//------------------
		console.log("StakingPoolAdmin - Delete Scripts - User All - " + toJson(poolInfo?.name))
		//------------------
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		setIsCanceling(false)
		//------------------
		try {
			if (!poolInfo!.swPoolReadyForDeleteMasterAndUserScripts){
				throw "Pool is not ready to Delete User Scripts"
			}
			if (!swAnyScriptsUser) {
				throw "No User Scripts to Delete"
			}
			//------------------
			var poolInfo_updated = poolInfo!
			var swSeparate = false
			if (poolInfo_updated.eUTxO_With_Script_TxID_User_Deposit_Datum !== undefined) {
				setActionMessage("Deleting Script - User Deposit, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_User_Deposit_Datum])
				pushSucessNotification("Delete Script - User Deposit", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_User_Harvest_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_User_Harvest_Datum !== undefined) {
				setActionMessage("Deleting Script - User Harvest, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_User_Harvest_Datum])
				pushSucessNotification("Delete Script - User Harvest", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			if (swSeparate && poolInfo_updated.eUTxO_With_Script_TxID_User_Withdraw_Datum !== undefined) {
				poolInfo_updated = await updateDetailsStakingPoolAndWallet()
				swSeparate = false
			}
			if (poolInfo_updated.eUTxO_With_Script_TxID_User_Withdraw_Datum !== undefined) {
				setActionMessage("Deleting Script - User Withdraw, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await mastertDeleteScripts(poolInfo_updated, [poolInfo_updated.eUTxO_With_Script_TxID_User_Withdraw_Datum])
				pushSucessNotification("Delete Script - User Withdraw", txHash, true);
				setActionHash("")
				swSeparate = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			return "All User Scripts have been Deleted"
		} catch (error: any) {
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			throw error
		}
		
	}

	//--------------------------------------

	const masterNewFundsBatchAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		console.log("StakingPoolAdmin - New Funds Batch - " + toJson(poolInfo?.name))
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		setIsCanceling(false)
		try {
			var poolInfo_updated = poolInfo!
			var swSeparateTx = false
			for (let i = 1; i <= 50 && !isCancelling.current; i++) {
				if (swSeparateTx) {
					poolInfo_updated = await updateDetailsStakingPoolAndWallet()
					swSeparateTx = false
				}
				setActionMessage("Fund " + i + " of " + 50 + ", please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterNewFundAction(poolInfo_updated, eUTxOs_Selected, assets);
				pushSucessNotification("Fund " + i + " of " + 50, txHash, true);
				setActionHash("")
				swSeparateTx = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			return "New Funds Batch executed"
		} catch (error: any) {
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			throw error
		}
	}

	const masterDeleteFundsBatchAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		console.log("StakingPoolAdmin - Delete Funds Batch - " + toJson(poolInfo?.name))
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		setIsCanceling(false)
		try {
			if (eUTxOs_With_FundDatum!.length === 0) {
				throw "No Funds to Delete"
			}
			var poolInfo_updated = poolInfo!
			var swSeparateTx = false
			for (var i = 0; i < eUTxOs_With_FundDatum!.length && !isCancelling.current; i++) {
				if (swSeparateTx) {
					poolInfo_updated = await updateDetailsStakingPoolAndWallet()
					swSeparateTx = false
				}
				setActionMessage("Delete " + (i + 1) + " of " + eUTxOs_With_FundDatum!.length + ", please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterDeleteFundsAction(poolInfo_updated, [eUTxOs_With_FundDatum[i]]);
				pushSucessNotification("Delete " + (i + 1) + " of " + eUTxOs_With_FundDatum!.length, txHash, true);
				setActionHash("")
				swSeparateTx = true
			}
			if (isCancelling.current) {
				setIsWorkingInABuffer(false)
				setIsCanceling(false)
				setIsWorking("")
				throw "You have cancel the operation"
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			return "Delete Funds Batch executed"
		} catch (error: any) {
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			throw error
		}
	}

	//--------------------------------------

	const masterShowPoolAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - Show Pool - " + toJson(poolInfo?.name))

		setActionMessage("Cambiando estado de la Pool, please wait...")

		try {

			const swShowOnHome = !poolInfo!.swShowOnHome

			await apiUpdateStakingPoolShowOnHomeDB(poolInfo!.name, swShowOnHome)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return "Updated Staking Pool";

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			throw error
		}

	}

	const masterDeletePoolAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - Delete Pool - " + toJson(poolInfo?.name))

		setActionMessage("Deleting Staking Pool, please wait...")

		try {

			await apiDeleteStakingPoolDB(poolInfo!.name)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return "Deleted Staking Pool, refreshing Admin Page...";

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			throw error
		}
	}

	const masterUpdateEUTxODBAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - Update EUTxOs in DB - " + toJson(poolInfo?.name))

		setActionMessage("Updating EUTxOs in DB, please wait...")

		try {

			await apiDeleteEUTxOsDBByStakingPool(poolInfo!.name)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return "Updated EUTxOs in DB";

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			throw error
		}

	}

	//--------------------------------------

	const splitUTxOsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction("StakingPoolAdmin - Split Wallet UTxOs", walletStore, poolInfo, splitUTxOs, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets)
	}

	//--------------------------------------

	return (

		<div className="section__text pool">
			<a id={poolInfo.name}></a>
			<div className="pool__data">
				<div className="pool__image ">
					<Image width={126} height={126} src={poolInfo.imageSrc} />
				</div>

				<div className="pool__data_item">
					<h4 className="pool_title">{poolInfo.name}&nbsp;
						{isPoolDataLoading?
							<Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />
						:
							<>
								<button onClick={() => { if (true) { updateDetailsStakingPoolAndWallet() } }} className='btn__ghost icon' style={true ? { cursor: 'pointer' } : { cursor: 'default' }} >
									<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
										<path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
										<path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
									</svg>
								</button>
								<br></br>
							</>
						}
					</h4>
					<br></br>

					{process.env.NODE_ENV==="development"?
						<>
						<div>Are you Master: {isMasterUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
						<br></br>
						</>
						:
						<></>
					}
					
					{process.env.NODE_ENV==="development"?
						<>
							<div>Pool Prepared:  {swPreparadoUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<div>Pool Started:  {swIniciadoUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<div>Pool has Funds:  {swFundedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<div>Pool Closed:  {swClosedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<div>Pool Terminated: {swTerminatedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							
							<div>Pool is Ready For Give Back Fund: {swPoolReadyForGiveBackFundsUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<div>Pool is Ready For Deleted Master And User Scripts: {swPoolReadyForDeleteMasterAndUserScriptsUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<div>Pool is Ready For Deleted Main Scripts: {swPoolReadyForDeleteMainScriptsUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<div>Pool is Ready For Deleted In DB: {swPoolReadyForDeletePoolInDBUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<br></br>
						</>
						:
						<>
						</>
					}

					<div>Status <b>{statusUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></div>
					<br></br>

					<p><>Earn <b>{interestUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b> a year for every <b>{poolInfo.staking_UI}</b>!</></p>
					<br></br>

					<div>
						Staking Unit In Wallet <b>{(walletStakingAmountUI === ui_loading || walletStakingAmountUI === ui_notConnected ? walletStakingAmountUI : formatAmount(Number(walletStakingAmountUI), poolInfo.staking_Decimals, poolInfo.staking_UI)) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b>
					</div>
					<div>
						Harvest Unit In Wallet <b>{(walletHarvestAmountUI === ui_loading || walletHarvestAmountUI === ui_notConnected ? walletHarvestAmountUI : formatAmount(Number(walletHarvestAmountUI), poolInfo.harvest_Decimals, poolInfo.harvest_UI)) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b>
					</div>
					<br></br>


					{process.env.NODE_ENV==="development"?
						<>
							<div style={{fontSize:8}}>

							{/* <div>UTxO required: <br></br>{poolInfo.poolID_TxOutRef.txHash + "#" + poolInfo.poolID_TxOutRef.outputIndex}</div>
							<br></br> */}

							<div>UTxO At Script With Pool Datum: {eUTxO_With_PoolDatum ? formatHash(eUTxO_With_PoolDatum.uTxO.txHash) + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex : ""} </div>
							<br></br>

							<div>EUTxO At Script With Script Datum: { poolInfo.eUTxO_With_ScriptDatum ? formatHash(poolInfo.eUTxO_With_ScriptDatum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_ScriptDatum.uTxO.outputIndex : ""} </div>
							<br></br>

							<div>EUTxO At Script With Script TxID_Master_Fund_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_FundAndMerge_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_SplitFund_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_ClosePool_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_TerminatePool_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_DeleteFund_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_SendBackFund_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_SendBackDeposit_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_AddScripts_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_Master_DeleteScripts_Datum: { poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_User_Deposit_Datum: { poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_User_Harvest_Datum: { poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							<div>EUTxO At Script With Script TxID_User_Withdraw_Datum: { poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum ? formatHash(poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.txHash) + "#" + poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.outputIndex : ""} </div>
							<br></br>
							</div>
						</>
						:
						<>
						</>
					}
					
					<div>
					User Token
						(<b>{txID_User_Deposit_For_User_TN}</b>) &nbsp;
						{/* (<b>{txID_User_Deposit_For_User_TN}</b>) + " (" + poolInfo.txID_User_Deposit_CS.slice(0,4)+"..."+poolInfo.txID_User_Deposit_CS.slice(52)+")" */}
						<button onClick={() => copyToClipboard(poolInfo.txID_User_Deposit_CS)} className='btn__ghost icon' style={{ cursor: 'pointer' }}>
							<svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
						</button>
						<a target={'_blank'} href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL}policy/${poolInfo.txID_User_Deposit_CS}`} className='btn__ghost icon' style={{ cursor: 'pointer' }}>
							<svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						</a>
					</div>
					
					<div className='pool__contract_address'>
						Contract Address&nbsp;
						<button onClick={() => copyToClipboard(poolInfo.scriptAddress)} className='btn__ghost icon' style={{ cursor: 'pointer' }}>
							<svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
						</button>
						<a target={'_blank'} href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL}address/${poolInfo.scriptAddress}`} className='btn__ghost icon' style={{ cursor: 'pointer' }}>
							<svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						</a>
					</div>

				</div>
				<div className="pool__action_cards ">

				<div className="pool__action_smallcard"  >
						<div className="pool__stat">
							<div style={{textAlign: 'left', width:"100%"}}>
								<p><><b>From</b> {beginAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
								{poolInfo.closedAt?
									<p><><b>To</b> {closedAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
									:
									<>
										<p><><b>To</b> {closedAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
									</>
								}
							</div>
						</div>
						<div className="pool__stat">
							<div style={{textAlign: 'left', width:"100%"}}>
								<p><><b>Grace time</b> {graceTimeUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
								{(poolInfo.swTerminated) ?
									<p><><b>Claims until</b> It's already Terminated</></p>
									:
									<p><><b>Claims until</b> {terminatedAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
								}
							</div>
						</div>
					</div>

					<div className="pool__flex_break" ><br></br></div>
					
					<div className="pool__action_card ">
						<div className="pool__stat">
							<div className="pool__column">
								<ActionWithInputModalBtn
									action={masterPreparePoolAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking} 
									actionName="Prepare Pool" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									description={'<li className="info">Prepare the Pool to make it ready.</li>\
									<li className="info">Avoid making other transactions as the contract is dependent on a specific UTxO to mint the PoolID NFT that should not be consumed before.</li>'}
									poolInfo={poolInfo}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
									swShow={!poolInfo.swPreparado}
									swHash={true}
									swPaddintTop={false}
								/>

								<ActionWithInputModalBtn
									action={masterAddScriptsMasterAllAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking}
									cancel={handleCancel}
									actionName="Add Scripts Master" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking}
									description={'<li className="info">Add All the Master Scripts to the Blockchain.</li>\
									<li className="info">Please note that a small amount of ADA will be required to add the Scripts to the UTxO.</li>\
									<li className="info">Don\'t worry, you will get your ADA back once the scripts are deleted.</li>'}
									poolInfo={poolInfo}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado && !swAllScriptsMaster}
									swHash={false}
									swPaddintTop={false}
								/>

								<ActionWithInputModalBtn
									action={masterDeleteScriptsMasterAllAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking}
									cancel={handleCancel}
									actionName="Delete Scripts Master" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking}
									description={'<li className="info">Delete All the Master Scripts from the Blockchain.</li>\
									<li className="info">The Master who added them will also receive a refund of the ADA used to hold the Script in the UTxO.</li>\
									<li className="info">In order to Delete Scripts, you must first Terminate the Pool.</li>\
									<li className="info">Please, do not Delete Master Scripts if you need to continue using the Staking Pool and the Master Actions.</li>\
									<li className="info">You can Delete Master Scripts if there are no registered Users. Use Send Back Deposits to unregister Users.</li>\
									<li className="info">You can Delete Master Scripts if there are no remaining funds. Use Send Back Funds to use all remaining funds.</li>'}
									poolInfo={poolInfo}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swPoolReadyForDeleteMasterAndUserScripts}
									swShow={poolInfo.swPreparado && poolInfo.swTerminated && swAnyScriptsMaster}
									swHash={false}
									swPaddintTop={poolInfo.swPreparado && !swAllScriptsMaster}
								/>

								<ActionWithInputModalBtn
									action={masterAddScriptsUserAllAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking}
									cancel={handleCancel}
									actionName="Add Scripts User" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking}
									description={'<li className="info">Add All the User Scripts to the Blockchain.</li>\
									<li className="info">Please note that a small amount of ADA will be required to add the Scripts to the UTxO.</li>\
									<li className="info">Don\'t worry, you will get your ADA back once the scripts are deleted.</li>'}
									poolInfo={poolInfo}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado && !swAllScriptsUser}
									swHash={false}
									swPaddintTop={poolInfo.swPreparado && ((!swAllScriptsMaster) || (poolInfo.swTerminated && swAnyScriptsMaster))}
								/>

								<ActionWithInputModalBtn
									action={masterDeleteScriptsUserAllAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking}
									cancel={handleCancel}
									actionName="Delete Scripts User" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking}
									description={'<li className="info">Delete All the User Scripts from the Blockchain.</li>\
									<li className="info">The Master who added them will also receive a refund of the ADA used to hold the Script in the UTxO.</li>\
									<li className="info">In order to Delete Scripts, you must first Terminate the Pool.</li>\
									<li className="info">Please, do not Delete User Scripts if you need to continue using the Staking Pool and the User Actions.</li>\
									<li className="info">You can Delete User Scripts if there are no registered Users. Use Send Back Deposits to unregister Users.</li>\
									<li className="info">You can Delete User Scripts if there are no remaining funds. Use Send Back Funds to use all remaining funds.</li>'}
									poolInfo={poolInfo}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swPoolReadyForDeleteMasterAndUserScripts}
									swShow={poolInfo.swPreparado && poolInfo.swTerminated && swAnyScriptsUser}
									swHash={false}
									swPaddintTop={poolInfo.swPreparado && ((!swAllScriptsMaster) || (poolInfo.swTerminated && swAnyScriptsMaster) || (!swAllScriptsUser))}
								/>

								<EUTxOsModalBtn
									masterUpdateEUTxODBAction={masterUpdateEUTxODBAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorkingParent={handleSetIsWorking} 
									actionName="View EUTxOs in DB" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorkingFromParent={isWorking} 
									poolInfo_={poolInfo}
									statePoolData={statePoolData}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado}
									swPaddintTop={poolInfo.swPreparado && ((!swAllScriptsMaster) || (poolInfo.swTerminated && swAnyScriptsMaster) || (!swAllScriptsUser) || (poolInfo.swTerminated && swAnyScriptsUser))}
								/>

								<ActionWithInputModalBtn
									action={splitUTxOsAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking} 
									actionName="Split Wallet UTxOs" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									description={'<p className="info" style="text-align: center;">It is recommended to Split your Wallet\'s UTxOs (Unspent Transaction Outputs) into smaller amounts. This will make it easier to use them as Collateral for Smart Contracts and will provide more flexibility in managing your funds.</p>'}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado}
									swHash={true}
								/>

							</div>
						</div>
						<div className="pool__stat">
							<div className="pool__column">

								<FundsModalBtn
									masterNewFundAction={masterNewFundAction}
									masterNewFundsBatchAction={masterNewFundsBatchAction}
									masterFundAndMergeAction={masterFundAndMergeAction}
									masterMergeFundsAction={masterMergeFundsAction}
									masterSplitFundAction={masterSplitFundAction}
									masterDeleteFundsAction={masterDeleteFundsAction}
									masterDeleteFundsBatchAction={masterDeleteFundsBatchAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorkingParent={handleSetIsWorking}
									cancel={handleCancel}
									actionName="View Funds" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorkingFromParent={isWorking}
									poolInfo_={poolInfo}
									statePoolData={statePoolData}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado}
									swPaddintTop={false}
								/>

								<UsersModalBtn
									masterSendBackDepositAction={masterSendBackDepositAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorkingParent={handleSetIsWorking}
									actionName="View Deposits" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorkingFromParent={isWorking} 
									poolInfo_={poolInfo}
									statePoolData={statePoolData}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado}
								/>

								<MasterModalBtn
									masterGetBackFundAction={masterGetBackFundAction}
									masterSendBackFundAction={masterSendBackFundAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorkingParent={handleSetIsWorking} 
									actionName="View Masters" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorkingFromParent={isWorking} 
									poolInfo_={poolInfo}
									statePoolData={statePoolData}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado}
								/>

								

							</div>
						</div>
						<div className="pool__stat">
							<div className="pool__column">
								<ActionWithInputModalBtn
									action={masterShowPoolAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking} 
									actionName={poolInfo.swShowOnHome?"Hide":"Show"} actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									description={'<p className="info" style="text-align: center;">Show or hide the Staking Pool in the Home Page</p>'}
									poolInfo={poolInfo}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded} 
									swShow={true}
									swHash={false}
									swPaddintTop={false}
								/>

								<ActionWithInputModalBtn
									action={masterClosePoolAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking} 
									actionName="Close Pool" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									description={'<li className="info">Close the Pool at this time, instead of waiting for the Deadline.</li> \
									<li className="info">Users will only be able to collect Rewards accumulated so far.</li> \
									<li className="info">Masters can keep adding Funds so there are funds to pay Rewards.</li> \
									<li className="info">After Grace Time the Pool will be Terminated.</li>'}
									poolInfo={poolInfo}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado && !poolInfo.swClosed}
									swHash={true}
								/>

								<ActionWithInputModalBtn
									action={masterTerminatePoolAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking} 
									poolInfo={poolInfo}
									actionName="Terminate Pool" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									description={'<li className="info">Finish the Pool now, instead of waiting for Deadline and Grace Time.</li> \
									<li className="info">Users will not be able to collect any more Rewards.</li> \
									<li className="info">After Deleteing all Funds, Masters can recover any funds left over, proportionally to what each one has put in.</li>'}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado && !poolInfo.swTerminated}
									swHash={true}
								/>

								<ActionWithInputModalBtn
									action={masterDeleteMainScriptsAction}
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking} 
									poolInfo={poolInfo}
									actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									actionName="Delete Main Scrips"
									description={'<li className="info">This actions is irreversible.</li>\
									<li className="info">It will Delete the Main Scripts and send back the locked ADA in that UTxOs to the respective Masters.</li>\
									<li className="info">Please, do not Delete Main Scripts if you need to continue using the Staking Pool.</li>\
									<li className="info">After deleting Main Scripts you will no be able to interact with the Script anymore.</li>\
									<li className="info">You can Delete Main Scripts if there are no registered Users. Use Send Back Deposits to unregister Users.</li>\
									<li className="info">You can Delete Main Scripts if there are no remaining funds. Use Send Back Funds to use all remaining funds.</li>\
									<li className="info">You can Delete Main Scripts if there are no other Scripts at the contract address. Use Delete Master and User Scripts before.</li>\
									<li className="info">In order to Delete Scripts, you must first Terminate the Pool.</li>'}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swPoolReadyForDeleteMainScripts} 
									swShow={poolInfo.swPreparado && poolInfo.swTerminated && swAnyMainScripts}
									swHash={false}
								/>

								<ActionWithInputModalBtn
									action={masterDeletePoolAction}
									postActionSuccess={updatePageInTimeOut}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking} 
									poolInfo={poolInfo}
									actionName="Delete Pool" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									description={'<li className="info">This actions is irreversible.</li>\
									<li className="info">It will Delete the Pool and it will not be show in the site anymore.</li>\
									<li className="info">You can Delete the Pool if there are no registered Users. Use Send Back Deposits to unregister Users.</li>\
									<li className="info">You can Delete the Pool if there are no remaining funds. Use Send Back Funds to use all remaining funds.</li>\
									<li className="info">You can Delete the Pool if there are no scripts at the contract address. Use Delete Main, Master and User Scripts.</li>\
									<li className="info">In order to Delete Scripts, you must first Terminate the Pool.</li>'}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swPoolReadyForDeletePoolInDB } 
									swShow={true}
									swHash={false}
								/>

							</div>
						</div>
					</div>

					<div className="pool__flex_break" ><br></br></div>

					<div className="pool__action_smallcard"  >
						<div className="pool__stat">
							<div style={{textAlign: 'left', width:"100%"}}>
								<h4 >Info</h4>
								<br></br> 
								<p>EUTxOs At Contract <b>{countEUTxOs_With_DatumUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
								<p>EUTxOs with Users <b>{countEUTxOs_With_UserDatumUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
								<p>EUTxOs with Funds <b>{countEUTxOs_With_FundDatumUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
								<p>Tx Count <b>{tx_countUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
							</div>
						</div>
						<div className="pool__stat">
							<div style={{textAlign: 'left', width:"100%"}}>
								<h4 >Totals</h4>
								<br></br> 
								{/* <p>Registered Users: {countEUTxOs_With_UserDatum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p> */}
								<p>Total Staked <b>{totalStakedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
								<p>Total Claimed <b>{totalRewardsPaidUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
								<p>Rewards to Pay <b>{totalRewardsToPayUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
								<p>Availaible Funds <b>{totalFundsAvailableUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

	)
}


