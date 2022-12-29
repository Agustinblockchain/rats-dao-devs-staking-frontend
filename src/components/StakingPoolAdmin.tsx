//--------------------------------------
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
//--------------------------------------
import { Address, Assets, Lucid, UTxO } from 'lucid-cardano';
//--------------------------------------
import ActionModalBtn from './ActionModalBtn';
import FundsModalBtn from './FundsModalBtn';
//--------------------------------------
import { useStoreActions, useStoreDispatch, useStoreState } from '../utils/walletProvider';
//--------------------------------------
import {
	masterPreparePool, masterFundAndMerge,
	masterNewFund, masterClosePool, masterGetBackFund, masterMergeFunds, masterSendBackFund,
	masterSendBackDeposit, masterTerminatePool, masterSplitFund, masterDeleteFunds} from '../stakePool/endPoints - master';
import { splitUTxOs } from "../stakePool/endPoints - splitUTxOs";
import {
    masterAddScriptsMasterClosePool, masterAddScriptsMasterTerminatePool, masterAddScriptsMasterFund, masterAddScriptsMasterFundAndMerge,
    masterAddScriptsUserWithdraw, masterAddScriptsUserHarvest, masterAddScriptsUserDeposit, masterDeleteScriptsMasterAll, masterDeleteScriptsUserAll, masterAddScriptsMasterSendBackFund, masterAddScriptsMasterSendBackDeposit, masterAddScriptsMasterDeleteFund, masterAddScriptsMasterSplitFund, masterAddScriptsMasterDeleteScripts
} from "../stakePool/endPoints - master - scripts";
import { EUTxO, InterestRate, Master, Maybe, POSIXTime, UTxO_Simple } from '../types';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel'
import useStatePoolData from '../stakePool/useStatePoolData';
import { useEffect, useState, useRef, createContext, useContext } from 'react';
import { copyToClipboard, searchValueInArray, strToHex, toJson } from '../utils/utils';
import { explainError } from "../stakePool/explainError";
import { stakingPoolDBParser } from "../stakePool/helpersStakePool";
import { isConsumingTime, maxTokensWithDifferentNames, scriptID_Master_AddScripts_TN, scriptID_Master_ClosePool_TN, scriptID_Master_DeleteFund_TN, scriptID_Master_DeleteScripts_TN, scriptID_Master_FundAndMerge_TN, scriptID_Master_Fund_TN, scriptID_Master_SendBackDeposit_TN, scriptID_Master_SendBackFund_TN, scriptID_Master_SplitFund_TN, scriptID_Master_TerminatePool_TN, scriptID_User_Deposit_TN, scriptID_User_Harvest_TN, scriptID_User_Withdraw_TN, scriptID_Validator_TN, txID_Master_AddScripts_TN, txID_User_Deposit_For_User_TN } from '../types/constantes';
import { getEUTxO_With_ScriptDatum_InEUxTOList, getExtendedUTxOsWith_Datum } from '../stakePool/helpersScripts';
import { pushSucessNotification, pushWarningNotification } from "../utils/pushNotification";
import UsersModalBtn from './UsersModalBtn';
import MasterModalBtn from './MastersModalBtn';
import { apiDeleteEUTxODB, apiDeleteEUTxOsDBByAddress, apiGetEUTxOsDBByAddress, apiUpdateEUTxODB } from '../utils/cardano-helpers';
import { useRouter } from 'next/router';
import LoadingSpinner from './LoadingSpinner';
//--------------------------------------

export default function StakingPoolAdmin({ stakingPoolInfo }: { stakingPoolInfo: StakingPoolDBInterface } ) {
    // console.log("StakingPoolAdmin - " + stakingPoolInfo.name + " - INIT")

	//string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
	const ui_loading = 0
	const ui_notConnected = '...'

	const router = useRouter();

	//var poolInfo = stakingPoolDBParser(stakingPoolInfo)
	const [poolInfo, setPoolInfo] = useState(stakingPoolDBParser(stakingPoolInfo))

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

	// var isCancelling = false
	// var isWorkingInABuffer = false

	const setIsWorkingInABuffer = (value: boolean) => {
		isWorkingInABuffer.current = value
	}

	const setIsCanceling = (value: boolean) => {
		isCancelling.current = value
	}

	// const { isWorking, setIsWorking} = useContext(IsWorkingContext);	

	const [actionMessage, setActionMessage] = useState("")
	const [actionHash, setActionHash] = useState("")

	const [walletStakingAmount, setWalletStakingAmount] = useState<string | 0>(ui_notConnected)
	const [walletHarvestAmount, setWalletHarvestAmount] = useState<string | 0>(ui_notConnected)

	const [maxStakingAmount, setMaxStakingAmount] = useState<string | 0>(ui_notConnected)
	const [maxHarvestAmount, setMaxHarvestAmount] = useState<string | 0>(ui_notConnected)

	const [isMaster, setIsMaster] = useState<string | 0>(ui_notConnected)

	const statePoolData = useStatePoolData(poolInfo)

	const { 
		swFromDB,
		swShowOnHome,
		swPreparado, swIniciado, swFunded,
		swClosed, closedAt, swTerminated, terminatedAt,
		swZeroFunds,

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

		totalFundsAvailable,

		totalStaked, totalRewardsPaid, totalRewardsToPay,

		isPoolDataLoading, isPoolDataLoaded,
		setLoading,
		loadPoolData 
	
		} = statePoolData

	useEffect(() => {
		// console.log("StakingPoolAdmin - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

		if (walletStore.connected && !isWalletDataLoaded) {
			setWalletStakingAmount(ui_loading)
			setWalletHarvestAmount(ui_loading)

			setMaxStakingAmount(ui_loading)
			setMaxHarvestAmount(ui_loading)

			setIsMaster(ui_loading)

		} else if (walletStore.connected && isWalletDataLoaded) {
			//------------------
			const walletStakingAmount = getTotalOfUnit(poolInfo.staking_Lucid)
			const walletHarvestAmount = getTotalOfUnit(poolInfo.harvest_Lucid)
			//------------------
			const staking_CS = poolInfo.staking_Lucid.slice(0, 56)
			const staking_TN = poolInfo.staking_Lucid.slice(56)
			const staking_AC_isAda = (staking_CS === 'lovelace')
			const staking_AC_isWithoutTokenName = !staking_AC_isAda && staking_TN == ""
			//------------------
			const harvest_CS = poolInfo.harvest_Lucid.slice(0, 56)
			const harvest_TN = poolInfo.harvest_Lucid.slice(56)
			const harvest_AC_isAda = (harvest_CS === 'lovelace')
			const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
			//------------------
			setWalletStakingAmount(walletStakingAmount.toString())
			setWalletHarvestAmount(walletHarvestAmount.toString())
			//------------------
			if (walletStakingAmount > maxTokensWithDifferentNames && staking_AC_isWithoutTokenName) {
				setMaxStakingAmount(maxTokensWithDifferentNames.toString())
			} else {
				setMaxStakingAmount(walletStakingAmount.toString())
			}
			//------------------
			if (walletHarvestAmount > maxTokensWithDifferentNames && harvest_AC_isWithoutTokenName) {
				setMaxHarvestAmount(maxTokensWithDifferentNames.toString())
			} else {
				setMaxHarvestAmount(walletHarvestAmount.toString())
			}
			//------------------

			setIsMaster(searchValueInArray(poolInfo.masters, walletStore.pkh) ? "Yes" : "No")

		} else {

			setWalletStakingAmount(ui_notConnected)
			setWalletHarvestAmount(ui_notConnected)

			setMaxStakingAmount(ui_notConnected)
			setMaxHarvestAmount(ui_notConnected)

			setIsMaster(ui_notConnected)

		}
	}, [walletStore, isWalletDataLoaded])

	useEffect(() => {
		// console.log("StakingPoolAdmin - " + poolInfo.name + " - useEffect2 - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

		if (walletStore.connected) {
			loadPoolData(true)
		} 

	}, [walletStore.connected])

	//--------------------------------------

	const handleCallback = async (isWorking: string) => {
		console.log("StakingPoolAdmin - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		// alert ("StakingPoolAdmin - callbak in:" + isWorking)
		setIsWorking(isWorking)
		return isWorking
	}

	const handleCancel = async () => {
		console.log("StakingPoolAdmin - " + poolInfo.name + " - handleCancel")
		if (!isCancelling.current && isWorkingInABuffer.current ){
			setActionMessage(actionMessage + " (Canceling when this Tx finishes)")
			setIsCanceling(true)
		}
	}

	//--------------------------------------

	const masterPreparePoolAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Create Pool - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterPreparePool(walletStore!, poolInfo!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")
			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			//await updateUTxO_With_PoolDatum(poolInfo!, txHash);

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterAllAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master All - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		var swErrors = false

		try {
			setActionMessage("Adding Script Master Fund, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await mastertAddScriptsMasterFundAction(poolInfo)
			pushSucessNotification("Add Scripts Master Fund", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Fund", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script Master Fund And Merge, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsMasterFundAndMergeAction(poolInfo)
			pushSucessNotification("Add Scripts Master Fund And Merge", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Fund And Merge", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script Master Split Fund, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsMasterSplitFundAction(poolInfo)
			pushSucessNotification("Add Scripts Master Split Fund", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Split Fund", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script Master Close Pool, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsMasterCloseAction(poolInfo)
			pushSucessNotification("Add Scripts Master Close Pool", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Close Pool", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script Master Terminate Pool, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsMasterTerminateAction(poolInfo)
			pushSucessNotification("Add Scripts Master Terminate Pool", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Terminate Pool", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script Master Delete Fund, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsMasterDeleteFundAction(poolInfo)
			pushSucessNotification("Add Scripts Master Delete Fund", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Delete Fund", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script Master Delete Scripts, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsMasterDeleteScriptsAction(poolInfo)
			pushSucessNotification("Add Scripts Master Delete Scripts", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Delete Scripts", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script Master Send Back Fund, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsMasterSendBackFundAction(poolInfo)
			pushSucessNotification("Add Scripts Master Send Back Fund", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Send Back Fund", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script Master Send Back Deposit, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsMasterSendBackDepositAction(poolInfo)
			pushSucessNotification("Add Scripts Master Send Back Deposit", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts Master Send Back Deposit", error_explained);
			swErrors = true
			await updatePage()
		}

		setIsWorkingInABuffer(false)
		setIsWorking("")
		setIsCanceling(false)
		if (swErrors) {
			throw "Error executing some of the transactions"
		} else {
			return "All Master Scripts have been added";
		}

	}

	//--------------------------------------

	const masterDeleteScriptsMasterAllAction = async (poolInfo?: StakingPoolDBInterface) => {
		//------------------
		console.log("StakingPoolAdmin - Delete Scripts Master All - " + toJson(poolInfo?.name))
		//------------------
		const scriptAddress: Address = poolInfo!.scriptAddress
		//------------------
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		try {
			// const uTxOsAtScript = await walletStore.lucid!.utxosAt(scriptAddress)
			// //------------------
			// //try to search for the datum and save in the list of EUTxOs
			// var eUTxOs_With_Datum = await getExtendedUTxOsWith_Datum(walletStore.lucid!, uTxOsAtScript)
			const eUTxOs_With_Datum = await apiGetEUTxOsDBByAddress(scriptAddress)
			console.log("StakingPoolAdmin - Delete Scripts Master All - uTxOs At Script - length: " + eUTxOs_With_Datum.length)
			//------------------
			const lucid = walletStore.lucid
			//------------------
			const txID_Master_AddScripts_CS = poolInfo!.txID_Master_AddScripts_CS
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
			var uTxOsWithScripts: UTxO[] = []
			//------------------
			var eUTxO_With_Script_TxID_Master_Fund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_Fund_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_Master_Fund_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_Fund_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_FundAndMerge_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_Master_SplitFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SplitFund_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_Master_SplitFund_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_SplitFund_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_Master_ClosePool_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_ClosePool_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_Master_ClosePool_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_ClosePool_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_Master_TerminatePool_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_TerminatePool_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_Master_TerminatePool_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_TerminatePool_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_Master_DeleteFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_DeleteFund_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_Master_DeleteFund_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_DeleteFund_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_Master_SendBackFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SendBackFund_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_Master_SendBackFund_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_SendBackFund_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SendBackDeposit_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum!.uTxO)
			}
			//------------------
			if (uTxOsWithScripts.length == 0) {
				setIsWorking("")
				return "No scripts found to remove"
			}
			//------------------
			// setIsCanceling(false)
			var swErrors = false
			while (uTxOsWithScripts.length > 0 && !isCancelling.current) {
				setActionMessage("Creating Transfer, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				setActionHash("")
				try {
					const [txHash, eUTxO_for_consuming] =  await masterDeleteScriptsMasterAll(walletStore!, poolInfo!, walletStore.pkh!);

					setActionMessage("Waiting for confirmation, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
					setActionHash(txHash)

					await awaitTx(lucid!, txHash, eUTxO_for_consuming)

					pushSucessNotification("Delete Scripts Master", txHash, true);
					setActionHash("")

				} catch (error: any) {
					const error_explained = explainError(error)
					pushWarningNotification("Delete Scripts Master", error_explained);
					swErrors = true
					await updatePage()
				}
				//------------------
				// const uTxOsAtScript = await walletStore.lucid!.utxosAt(scriptAddress)
				// console.log("StakingPoolAdmin - Delete Scripts Master All - uTxOs At Script - length: " + uTxOsAtScript.length)
				// //------------------
				// //try to search for the datum and save in the list of EUTxOs
				// eUTxOs_With_Datum = await getExtendedUTxOsWith_Datum(walletStore.lucid!, uTxOsAtScript)
				const eUTxOs_With_Datum = await apiGetEUTxOsDBByAddress(scriptAddress)
				console.log("StakingPoolAdmin - Delete Scripts Master All - uTxOs At Script - length: " + eUTxOs_With_Datum.length)
				//------------------
				uTxOsWithScripts = []
				//------------------
				var eUTxO_With_Script_TxID_Master_Fund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_Fund_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_Master_Fund_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_Fund_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_FundAndMerge_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_Master_SplitFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SplitFund_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_Master_SplitFund_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_SplitFund_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_Master_ClosePool_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_ClosePool_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_Master_ClosePool_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_ClosePool_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_Master_TerminatePool_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_TerminatePool_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_Master_TerminatePool_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_TerminatePool_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_Master_DeleteFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_DeleteFund_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_Master_DeleteFund_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_DeleteFund_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_Master_SendBackFund_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SendBackFund_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_Master_SendBackFund_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_SendBackFund_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_Master_SendBackDeposit_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum!.uTxO)
				}
				//------------------	
				let data = {
					nombrePool: poolInfo!.name,

					swShowOnSite: poolInfo!.swShowOnSite,

					swShowOnHome: poolInfo!.swShowOnHome,

					swPreparado: (swPreparado === true) ? true : false,

					swIniciado: (swIniciado === true) ? true : false,
					swFunded: (swFunded === true) ? true : false,

					swClosed: (swClosed === true) ? true : false,

					closedAt: (typeof closedAt === "object") ? closedAt.getTime() : undefined,

					swTerminated: (swTerminated === true) ? true : false,

					//eUTxO_With_PoolDatum: poolInfo!.eUTxO_With_PoolDatum? toJson(poolInfo!.eUTxO_With_PoolDatum) : "",
					eUTxO_With_ScriptDatum: poolInfo!.eUTxO_With_ScriptDatum ? toJson(poolInfo!.eUTxO_With_ScriptDatum) : "",

					eUTxO_With_Script_TxID_Master_Fund_Datum: eUTxO_With_Script_TxID_Master_Fund_Datum ? toJson(eUTxO_With_Script_TxID_Master_Fund_Datum) : "",
					eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: eUTxO_With_Script_TxID_Master_FundAndMerge_Datum ? toJson(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) : "",
					eUTxO_With_Script_TxID_Master_SplitFund_Datum: eUTxO_With_Script_TxID_Master_SplitFund_Datum ? toJson(eUTxO_With_Script_TxID_Master_SplitFund_Datum) : "",
					eUTxO_With_Script_TxID_Master_ClosePool_Datum: eUTxO_With_Script_TxID_Master_ClosePool_Datum ? toJson(eUTxO_With_Script_TxID_Master_ClosePool_Datum) : "",
					eUTxO_With_Script_TxID_Master_TerminatePool_Datum: eUTxO_With_Script_TxID_Master_TerminatePool_Datum ? toJson(eUTxO_With_Script_TxID_Master_TerminatePool_Datum) : "",
					eUTxO_With_Script_TxID_Master_DeleteFund_Datum: eUTxO_With_Script_TxID_Master_DeleteFund_Datum ? toJson(eUTxO_With_Script_TxID_Master_DeleteFund_Datum) : "",
					eUTxO_With_Script_TxID_Master_SendBackFund_Datum: eUTxO_With_Script_TxID_Master_SendBackFund_Datum ? toJson(eUTxO_With_Script_TxID_Master_SendBackFund_Datum) : "",
					eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum ? toJson(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum) : "",
					
					eUTxO_With_Script_TxID_Master_AddScripts_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_AddScripts_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_AddScripts_Datum) : "",
					eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum) : "",

					eUTxO_With_Script_TxID_User_Deposit_Datum: poolInfo!.eUTxO_With_Script_TxID_User_Deposit_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_User_Deposit_Datum) : "",
					eUTxO_With_Script_TxID_User_Harvest_Datum: poolInfo!.eUTxO_With_Script_TxID_User_Harvest_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_User_Harvest_Datum) : "",
					eUTxO_With_Script_TxID_User_Withdraw_Datum: poolInfo!.eUTxO_With_Script_TxID_User_Withdraw_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_User_Withdraw_Datum) : "",

				}

				const urlApi = "/api/updateStakingPool" 

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
						console.error("StakingPoolAdmin - Delete Scripts Master All - /api/updateStakingPool - Error 500")
						throw "Error 500";
					case 400:
						console.error("StakingPoolAdmin - Delete Scripts Master All - /api/updateStakingPool - Error: " + message)
						throw message;
					case 200:
						console.log("StakingPoolAdmin - Delete Scripts Master All - /api/updateStakingPool: " + message)
						break;
					default:
				}
				//------------------	
				poolInfo!.eUTxO_With_Script_TxID_Master_Fund_Datum = eUTxO_With_Script_TxID_Master_Fund_Datum
				poolInfo!.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = eUTxO_With_Script_TxID_Master_FundAndMerge_Datum
				poolInfo!.eUTxO_With_Script_TxID_Master_SplitFund_Datum = eUTxO_With_Script_TxID_Master_SplitFund_Datum
				poolInfo!.eUTxO_With_Script_TxID_Master_ClosePool_Datum = eUTxO_With_Script_TxID_Master_ClosePool_Datum
				poolInfo!.eUTxO_With_Script_TxID_Master_TerminatePool_Datum = eUTxO_With_Script_TxID_Master_TerminatePool_Datum
				poolInfo!.eUTxO_With_Script_TxID_Master_DeleteFund_Datum = eUTxO_With_Script_TxID_Master_DeleteFund_Datum
				poolInfo!.eUTxO_With_Script_TxID_Master_SendBackFund_Datum = eUTxO_With_Script_TxID_Master_SendBackFund_Datum
				poolInfo!.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum
				setEUTxO_With_Script_TxID_Master_Fund_Datum(eUTxO_With_Script_TxID_Master_Fund_Datum)
				setEUTxO_With_Script_TxID_Master_FundAndMerge_Datum(eUTxO_With_Script_TxID_Master_FundAndMerge_Datum)
				setEUTxO_With_Script_TxID_Master_SplitFund_Datum(eUTxO_With_Script_TxID_Master_SplitFund_Datum)
				setEUTxO_With_Script_TxID_Master_ClosePool_Datum(eUTxO_With_Script_TxID_Master_ClosePool_Datum)
				setEUTxO_With_Script_TxID_Master_TerminatePool_Datum(eUTxO_With_Script_TxID_Master_TerminatePool_Datum)
				setEUTxO_With_Script_TxID_Master_DeleteFund_Datum(eUTxO_With_Script_TxID_Master_DeleteFund_Datum)
				setEUTxO_With_Script_TxID_Master_SendBackFund_Datum(eUTxO_With_Script_TxID_Master_SendBackFund_Datum)
				setEUTxO_With_Script_TxID_Master_SendBackDeposit_Datum(eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum)
				//------------------	
				setPoolInfo(poolInfo!)
				//------------------	
				if (uTxOsWithScripts.length == 0) {
					setIsWorkingInABuffer(false)
					setIsWorking("")
					setIsCanceling(false)
					if (swErrors) {
						throw "Error executing some of the transactions"
					} else {
						return "No more scripts found to remove"
					}
				}
				await new Promise(r => setTimeout(r, 2000));
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operation"
		} catch (error) {
			setIsCanceling(false)
			setIsWorkingInABuffer(false)
			setIsWorking("")
			console.error("StakingPoolAdmin - Delete Scripts Master All - Error: " + error)
			await updatePage()
			throw error
		}
	}

	//--------------------------------------

	const masterAddScriptsUserAllAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts User All - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		setIsWorkingInABuffer(true)
		var swErrors = false

		try {
			setActionMessage("Adding Script User Deposit, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsUserDepositAction(poolInfo)
			pushSucessNotification("Add Scripts User Deposit", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts User Deposit", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script User Harvest, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsUserHarvestAction(poolInfo)
			pushSucessNotification("Add Scripts User Harvest", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts User Harvest", error_explained);
			swErrors = true
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}
		await new Promise(r => setTimeout(r, 2000));
		try {
			setActionMessage("Adding Script User Withdraw, please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
			const txHash =  await masterAddScriptsUserWithdrawAction(poolInfo)
			pushSucessNotification("Add Scripts User Withdraw", txHash, true);
			setActionHash("")
		} catch (error: any) {
			const error_explained = explainError(error)
			pushWarningNotification("Add Scripts User Withdraw", error_explained);
			swErrors = true
			// setIsWorkingInABuffer(false)
			// setIsWorking ("")
			//throw error
			await updatePage()
		}
		if(isCancelling.current) { 
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operations"
		}

		setIsWorkingInABuffer(false)
		setIsWorking("")
		setIsCanceling(false)
		if (swErrors) {
			throw "Error executing some of the transactions"
		} else {
			return "All User Scripts have been added";
		}
	}

	//--------------------------------------

	const masterDeleteScriptsUserAllAction = async (poolInfo?: StakingPoolDBInterface) => {
		//------------------
		console.log("StakingPoolAdmin - Delete Scripts User All - " + toJson(poolInfo?.name))
		//------------------
		const scriptAddress: Address = poolInfo!.scriptAddress
		//------------------
		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		//------------------
		try{
			//const uTxOsAtScript = await walletStore.lucid!.utxosAt(scriptAddress)
			//try to search for the datum and save in the list of EUTxOs
			// var eUTxOs_With_Datum = await getExtendedUTxOsWith_Datum(walletStore.lucid!, uTxOsAtScript)
			//------------------
			const eUTxOs_With_Datum = await apiGetEUTxOsDBByAddress(scriptAddress)
			console.log("StakingPoolAdmin - Delete Scripts Master All - uTxOs At Script - length: " + eUTxOs_With_Datum.length)
			//------------------
			const lucid = walletStore.lucid
			//------------------
			const txID_Master_AddScripts_CS = poolInfo!.txID_Master_AddScripts_CS
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
			var uTxOsWithScripts: UTxO[] = []
			//------------------
			var eUTxO_With_Script_TxID_User_Deposit_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Deposit_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_User_Deposit_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_User_Deposit_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_User_Harvest_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Harvest_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_User_Harvest_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_User_Harvest_Datum!.uTxO)
			}
			var eUTxO_With_Script_TxID_User_Withdraw_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Withdraw_AC_Lucid, eUTxOs_With_Datum, true)
			if (eUTxO_With_Script_TxID_User_Withdraw_Datum) {
				uTxOsWithScripts.push(eUTxO_With_Script_TxID_User_Withdraw_Datum!.uTxO)
			}
			//------------------
			if (uTxOsWithScripts.length == 0) {
				setIsWorking("")
				return "No scripts found to remove"
			}
			//------------------
			// setIsCanceling(false)
			var swErrors = false
			while (uTxOsWithScripts.length > 0 && !isCancelling.current) {
				setActionMessage("Creating Transfer, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				try {

					const [txHash, eUTxO_for_consuming] =  await masterDeleteScriptsUserAll(walletStore!, poolInfo!, walletStore.pkh!);

					setActionMessage("Waiting for confirmation, please wait..." + (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
					setActionHash(txHash)

					await awaitTx(lucid!, txHash, eUTxO_for_consuming)

					pushSucessNotification("Delete Scripts User", txHash, true);
					// setActionHash("")

				} catch (error: any) {
					const error_explained = explainError(error)
					pushWarningNotification("Delete Scripts User", error_explained);
					await updatePage()
					swErrors = true
				}
				//------------------
				// const uTxOsAtScript = await walletStore.lucid!.utxosAt(scriptAddress)
				// console.log("StakingPoolAdmin - Delete Scripts Master All - uTxOs At Script - length: " + uTxOsAtScript.length)
				// //------------------
				// //try to search for the datum and save in the list of EUTxOs
				// eUTxOs_With_Datum = await getExtendedUTxOsWith_Datum(walletStore.lucid!, uTxOsAtScript)
				const eUTxOs_With_Datum = await apiGetEUTxOsDBByAddress(scriptAddress)
				console.log("StakingPoolAdmin - Delete Scripts User All - uTxOs At Script - length: " + eUTxOs_With_Datum.length)
				//------------------
				uTxOsWithScripts = []
				//------------------
				var eUTxO_With_Script_TxID_User_Deposit_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Deposit_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_User_Deposit_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_User_Deposit_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_User_Harvest_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Harvest_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_User_Harvest_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_User_Harvest_Datum!.uTxO)
				}
				var eUTxO_With_Script_TxID_User_Withdraw_Datum = getEUTxO_With_ScriptDatum_InEUxTOList(txID_Master_AddScripts_AC_Lucid, scriptID_User_Withdraw_AC_Lucid, eUTxOs_With_Datum)
				if (eUTxO_With_Script_TxID_User_Withdraw_Datum) {
					uTxOsWithScripts.push(eUTxO_With_Script_TxID_User_Withdraw_Datum!.uTxO)
				}
				//------------------	
				let data = {
					nombrePool: poolInfo!.name,

					swShowOnSite: poolInfo!.swShowOnSite,

					swShowOnHome: poolInfo!.swShowOnHome,

					swPreparado: (swPreparado === true) ? true : false,

					swIniciado: (swIniciado === true) ? true : false,
					swFunded: (swFunded === true) ? true : false,

					swClosed: (swClosed === true) ? true : false,

					closedAt: (typeof closedAt === "object") ? closedAt.getTime() : undefined,

					swTerminated: (swTerminated === true) ? true : false,

					//eUTxO_With_PoolDatum: poolInfo!.eUTxO_With_PoolDatum? toJson(poolInfo!.eUTxO_With_PoolDatum) : "",
					eUTxO_With_ScriptDatum: poolInfo!.eUTxO_With_ScriptDatum ? toJson(poolInfo!.eUTxO_With_ScriptDatum) : "",

					eUTxO_With_Script_TxID_Master_Fund_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_Fund_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_Fund_Datum) : "",
					eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum) : "",
					eUTxO_With_Script_TxID_Master_SplitFund_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_SplitFund_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_SplitFund_Datum) : "",
					eUTxO_With_Script_TxID_Master_ClosePool_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_ClosePool_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_ClosePool_Datum) : "",
					eUTxO_With_Script_TxID_Master_TerminatePool_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_TerminatePool_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_TerminatePool_Datum) : "",
					eUTxO_With_Script_TxID_Master_DeleteFund_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_DeleteFund_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_DeleteFund_Datum) : "",
					eUTxO_With_Script_TxID_Master_SendBackFund_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_SendBackFund_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_SendBackFund_Datum) : "",
					eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum) : "",
					
					eUTxO_With_Script_TxID_Master_AddScripts_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_AddScripts_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_AddScripts_Datum) : "",
					eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: poolInfo!.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum ? toJson(poolInfo!.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum) : "",

					eUTxO_With_Script_TxID_User_Deposit_Datum: eUTxO_With_Script_TxID_User_Deposit_Datum? toJson(eUTxO_With_Script_TxID_User_Deposit_Datum) : "",
					eUTxO_With_Script_TxID_User_Harvest_Datum: eUTxO_With_Script_TxID_User_Harvest_Datum? toJson(eUTxO_With_Script_TxID_User_Harvest_Datum) : "",
					eUTxO_With_Script_TxID_User_Withdraw_Datum: eUTxO_With_Script_TxID_User_Withdraw_Datum? toJson(eUTxO_With_Script_TxID_User_Withdraw_Datum) : ""

				}
				
				const urlApi = "/api/updateStakingPool" 

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
						console.error("StakingPoolAdmin - Delete Scripts User All - /api/updateStakingPool - Error 500")
						throw "Error 500";
					case 400:
						console.error("StakingPoolAdmin - Delete Scripts User All - /api/updateStakingPool - Error: " + message)
						throw message;
					case 200:
						console.log("StakingPoolAdmin - Delete Scripts User All - /api/updateStakingPool: " + message)
						break;
					default:
				}
				//------------------	
				poolInfo!.eUTxO_With_Script_TxID_User_Deposit_Datum = eUTxO_With_Script_TxID_User_Deposit_Datum
				poolInfo!.eUTxO_With_Script_TxID_User_Harvest_Datum = eUTxO_With_Script_TxID_User_Harvest_Datum
				poolInfo!.eUTxO_With_Script_TxID_User_Withdraw_Datum = eUTxO_With_Script_TxID_User_Withdraw_Datum
				setEUTxO_With_Script_TxID_User_Deposit_Datum (eUTxO_With_Script_TxID_User_Deposit_Datum)
        		setEUTxO_With_Script_TxID_User_Harvest_Datum (eUTxO_With_Script_TxID_User_Harvest_Datum)
        		setEUTxO_With_Script_TxID_User_Withdraw_Datum (eUTxO_With_Script_TxID_User_Withdraw_Datum)
				//------------------	
				setPoolInfo(poolInfo!)
				//------------------	
				if (uTxOsWithScripts.length == 0) {
					setIsWorkingInABuffer(false)
					setIsWorking("")
					setIsCanceling(false)
					if (swErrors) {
						throw "Error executing some of the transactions"
					} else {
						return "No more scripts found to remove"
					}
				}
				await new Promise(r => setTimeout(r, 2000));
			}
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			return "You have cancel the operation"
		} catch (error) {
			setIsCanceling(false)
			setIsWorkingInABuffer(false)
			setIsWorking("")
			console.error("StakingPoolAdmin - Delete Scripts User All - Error: " + error)
			await updatePage()
			throw error
		}
	}

	//--------------------------------------

	const mastertAddScriptsMasterFundAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Fund - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterFund(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterFundAndMergeAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Fund And Merge - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterFundAndMerge(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterSplitFundAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Split Fund - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterSplitFund(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterCloseAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Close Pool - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterClosePool(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterTerminateAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Terminate Pool - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterTerminatePool(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterDeleteFundAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Delete Fund - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterDeleteFund(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterDeleteScriptsAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Delete Scripts - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterDeleteScripts(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterSendBackFundAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Send Back Fund - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterSendBackFund(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsMasterSendBackDepositAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts Master Send Back Deposit - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsMasterSendBackDeposit(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsUserDepositAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts User Deposit - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		//alert ("StakingPoolAdmin - Add Scripts User Deposit: " + isWorkingInABuffer)

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsUserDeposit(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsUserHarvestAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts User Harvest - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsUserHarvest(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterAddScriptsUserWithdrawAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Add Scripts User Withdraw - " + toJson(poolInfo?.name))

		if (!isWorkingInABuffer.current) {
			setActionMessage("Creating Transfer, please wait...")
		}

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterAddScriptsUserWithdraw(walletStore!, poolInfo!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) {
				setActionMessage("Waiting for confirmation, please wait...")
				setActionHash(txHash)
			}

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterNewFundsBatchAction = async (poolInfo?: StakingPoolDBInterface, _?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - New Funds Batch - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		var swErrors = false

		for (let i = 1; i <= 50 && !isCancelling.current; i++) {
			try {
				setActionMessage("Fund " + i + " of "+ 50 +", please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash =  await masterNewFundAction(poolInfo, _, assets);
				pushSucessNotification("Fund " + i + " of "+ 50, txHash, true);
				setActionHash("")
			} catch (error: any) {
				const error_explained = explainError(error)
				pushWarningNotification("Fund " + i + " of "+ 50, error_explained);
				swErrors = true
				// await new Promise(r => setTimeout(r, 2000));
				await updatePage()
			}
		}
		setIsWorkingInABuffer(false)
		setIsWorking("")
		if(isCancelling.current){
			setIsCanceling(false)
			return "You have cancel the operation"
		}else{
			if (swErrors) {
				throw "Error executing some of the transactions"
			} else {
				return "New Funds Batch executed"
			}
		}
	}

	//--------------------------------------

	const masterNewFundAction = async (poolInfo?: StakingPoolDBInterface, _?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - New Fund - " + toJson(poolInfo?.name) + " - Assets: " + toJson(assets))

		if (!isWorkingInABuffer.current) setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterNewFund(walletStore!, poolInfo!, assets!, walletStore.pkh!);

			if (!isWorkingInABuffer.current) setActionMessage("Waiting for confirmation, please wait...")
			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterFundAndMergeAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - Fund And Merge - " + toJson(poolInfo?.name) + " - Assets: " + toJson(assets))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterFundAndMerge(walletStore!, poolInfo!, eUTxOs_Selected!, assets!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterMergeFundsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined) => {

		console.log("StakingPoolAdmin - Merge Funds - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterMergeFunds(walletStore!, poolInfo!, eUTxOs_Selected!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterSplitFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - Split Fund - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterSplitFund(walletStore!, poolInfo!, eUTxOs_Selected!, assets!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterDeleteFundsBatchAction = async (poolInfo?: StakingPoolDBInterface, _?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - Delete Funds Batch - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		var swErrors = false
		for (var i = 0; i < eUTxOs_With_FundDatum!.length && !isCancelling.current; i++) {
			try {
				setActionMessage("Delete " + (i+1) + " of " + eUTxOs_With_FundDatum!.length + ", please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await masterDeleteFundsAction(poolInfo, [eUTxOs_With_FundDatum[i]]);
				pushSucessNotification("Delete " + (i+1) + " of " + eUTxOs_With_FundDatum!.length, txHash, true);
				setActionHash("")
			} catch (error: any) {
				const error_explained = explainError(error)
				pushWarningNotification("Delete " + (i+1) + " of " + eUTxOs_With_FundDatum!.length, error_explained);
				swErrors = true
				// await new Promise(r => setTimeout(r, 2000));
				await updatePage()
			}
		}
		setIsWorkingInABuffer(false)
		setIsWorking("")
		if(isCancelling.current){
			setIsCanceling(false)
			return "You have cancel the operation"
		}else{
			if (swErrors) {
				throw "Error executing some of the transactions"
			} else {
				return "Delete Funds Batch executed"
			}
		}
	}

	//--------------------------------------

	const masterDeleteFundsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined) => {

		console.log("StakingPoolAdmin - Delete Funds - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterDeleteFunds(walletStore!, poolInfo!, eUTxOs_Selected!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterClosePoolAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Close Pool - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterClosePool(walletStore!, poolInfo!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterTerminatePoolAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Terminate Pool - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterTerminatePool(walletStore!, poolInfo!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterGetBackFundAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Get Back Funds - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterGetBackFund(walletStore!, poolInfo!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterSendBackFundAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined, master_Selected?: Master) => {

		console.log("StakingPoolAdmin - Send Back Funds - " + toJson(poolInfo?.name) + " - Master Selected: " + toJson(master_Selected))	

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterSendBackFund(walletStore!, poolInfo!, walletStore.pkh!, master_Selected!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterSendBackDepositAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[]) => {

		console.log("StakingPoolAdmin - Send Back Invests - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await masterSendBackDeposit(walletStore!, poolInfo!, eUTxOs_Selected!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")

			setActionHash(txHash)

			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")


			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterShowPoolAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Show Pool - " + toJson(poolInfo?.name))

		const swShowOnHome = !poolInfo!.swShowOnHome
		console.log("StakingPoolAdmin - Show Pool - swShowOnHome: " + swShowOnHome)
		console.log("StakingPoolAdmin - Show Pool - closedAt: " + toJson(closedAt))

		setActionMessage("Cambiando estado de la Pool, please wait...")

		try {

			let data = {
				nombrePool: poolInfo!.name,

				swShowOnSite: poolInfo!.swShowOnSite,

				swShowOnHome: swShowOnHome,

				swPreparado: (swPreparado === true) ? true : false,

				swIniciado: (swIniciado === true) ? true : false,
				swFunded: (swFunded === true) ? true : false,

				swClosed: (swClosed === true) ? true : false,

				closedAt: (typeof closedAt === "object") ? closedAt.getTime() : undefined,

				swTerminated: (swTerminated === true) ? true : false,

				//eUTxO_With_PoolDatum: eUTxO_With_PoolDatum? toJson(eUTxO_With_PoolDatum) : "",

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

			const urlApi = "/api/updateStakingPool" 

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
					console.error("StakingPoolAdmin - Show Pool - /api/updateStakingPool - Error 500")
					throw "Error 500";
				case 400:
					console.error("StakingPoolAdmin - Show Pool - /api/updateStakingPool - Error: " + message)
					throw message
				case 200:
					console.log("StakingPoolAdmin - Show Pool - /api/updateStakingPool: " + message)
					// updatePage()
					poolInfo!.swShowOnHome = swShowOnHome
					setPoolInfo(poolInfo!)
					if (!isWorkingInABuffer.current) setIsWorking("")
					return message;
				default:
			}
		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterDeletePoolAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Delete Pool - " + toJson(poolInfo?.name))

		setActionMessage("Deleting Staking Pool, please wait...")

		try {

			let data = {
				nombrePool: poolInfo!.name
			}

			const urlApi = "/api/deleteStakingPool" 

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
					console.error("StakingPoolAdmin - Delete Pool - /api/deleteStakingPool - Error 500")
					throw "Error 500";
				case 400:
					console.error("StakingPoolAdmin - Delete Pool - /api/deleteStakingPool - Error: " + message)
					throw message
				case 200:
					console.log("StakingPoolAdmin - Delete Pool - /api/deleteStakingPool: " + message)
					setActionMessage("Staking Pool deleted, refreshing page...")
					//if (!isWorkingInABuffer.current) setIsWorking("")
					// router.replace(router.asPath);
					setTimeout(router.replace, 3000, router.asPath);
					return message;
				default:
			}

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const masterUpdateEUTxODBAction = async (poolInfo?: StakingPoolDBInterface) => {

		console.log("StakingPoolAdmin - Update EUTxOs in DB - " + toJson(poolInfo?.name))

		setActionMessage("Updating EUTxOs in DB, please wait...")

		try {

			await apiDeleteEUTxOsDBByAddress(poolInfo!.scriptAddress)
			console.log("StakingPoolAdmin - Update EUTxOs in DB - /api/deleteEUTxOsByAddress: Updated EUTxOs in DB, refreshing page...")
			setActionMessage("Updated EUTxOs in DB, refreshing page...")
			if (!isWorkingInABuffer.current) setIsWorking("")
			// // router.replace(router.asPath);
			// setTimeout(router.replace, 5000, router.asPath);
			await updatePage()
			return "Updated EUTxOs in DB, refreshing page...";

			// let data = {
			// 	address: poolInfo!.scriptAddress
			// }

			// const urlApi = "/api/deleteEUTxOsByAddress" 

			// const requestOptions = {
			// 	method: 'POST',
			// 	headers: { 'Content-Type': 'application/json' },
			// 	body: toJson(data)
			// };

			// const response = await fetch(urlApi, requestOptions)
			// const json = await response.json()
			// const message = json.msg

			// switch (response.status) {
			// 	case 500:
			// 		console.error("StakingPoolAdmin - Update EUTxOs in DB - /api/deleteEUTxOsByAddress - Error 500")
			// 		throw "Error 500";
			// 	case 400:
			// 		console.error("StakingPoolAdmin - Update EUTxOs in DB - /api/deleteEUTxOsByAddress - Error: " + message)
			// 		throw message
			// 	case 200:
			// 		console.log("StakingPoolAdmin - Update EUTxOs in DB - /api/deleteEUTxOsByAddress: " + message)
			// 		setActionMessage("Updated EUTxOs in DB, refreshing page...")
			// 		if (!isWorkingInABuffer.current) setIsWorking("")
			// 		// // router.replace(router.asPath);
			// 		// setTimeout(router.replace, 5000, router.asPath);
			// 		await updatePage()
			// 		return message;
			// 	default:
			// }

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			updatePage()
			throw error
		}

	}
	
	//--------------------------------------

	const splitUTxOsAction = async () => {

		console.log("StakingPoolAdmin - Split UTxOs")

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await splitUTxOs(walletStore!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")
			setActionHash(txHash)

			// await new Promise(r => setTimeout(r, 5000));
			await awaitTx(lucid!, txHash, eUTxO_for_consuming)

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			throw error
		}
	}

	//--------------------------------------

	const updatePage = async () => {
		var poolInfo = await loadPoolData(false)
		setPoolInfo(poolInfo)
		await loadWalletData(walletStore)
	}

	//--------------------------------------

	const awaitTx = async (lucid: Lucid, txhash: string, eUTxO_for_consuming : EUTxO []) => {
		//------------------
		const now = new Date()
		//------------------
		for (let i = 0; i < eUTxO_for_consuming.length; i++) {
            eUTxO_for_consuming[i].isConsuming = new Maybe<POSIXTime>(BigInt(now.getTime()));
            await apiUpdateEUTxODB(eUTxO_for_consuming[i]);
        }
		async function clearIsConsuming (){
			console.log ("awaitTx - clearIsConsuming")
			for (let i = 0; i < eUTxO_for_consuming.length; i++) {
				// eUTxO_for_consuming[i].isConsuming = new Maybe<POSIXTime>();
				// apiUpdateEUTxODB(eUTxO_for_consuming[i]);
				await apiDeleteEUTxODB(eUTxO_for_consuming[i]);

			}
		}
		//------------------
        const timeOut = setTimeout(clearIsConsuming, isConsumingTime);
		//------------------
		if(await lucid.awaitTx(txhash)){
			console.log("awaitTx - Tx confirmed")
			//------------------
			for (let i = 0; i < eUTxO_for_consuming.length; i++) {
				await apiDeleteEUTxODB(eUTxO_for_consuming[i]);
			}
			//------------------
			if (!isWorkingInABuffer.current) 
				updatePage()
			else
				await updatePage()
			//------------------
		}else{
			console.log("awaitTx - Tx not confirmed")
		}
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
					<div className="pool__stat">
						<h4 className="pool_title">{poolInfo.name}
							{isPoolDataLoading?
								<>
									<br></br>
									<br></br>
									<LoadingSpinner size={25} border={5} />
									<br></br>
								</>
							:
								<>
									<button onClick={() => { if (walletStore.connected) { updatePage() } }} className='btn__ghost icon' style={walletStore.connected ? { cursor: 'pointer' } : { cursor: 'default' }} >
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
											<path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
											<path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
										</svg>
									</button>
									<br></br>
									<br></br>
								</>
							}
						</h4>


						{/* <button onClick={() => { 	setIsWorking("www") }} className='btn__ghost icon' style={ walletStore.connected?  { cursor: 'pointer' }  :  { cursor: 'default' }  } >
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
							<path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
							<path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
							</svg>
							</button>
							<button onClick={() => { 	setIsWorking("") }} className='btn__ghost icon' style={ walletStore.connected?  { cursor: 'pointer' }  :  { cursor: 'default' }  } >
							<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
							<path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
							<path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
							</svg>
							</button> */}


						{/* <div>Are you Master: {isMaster || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
						<br></br> */}
						{/* Canceling Bath: {isCancelling? "Yes" : "No"}
						<br></br> */}

						<div>Show in Home:  {(poolInfo.swShowOnHome) ? "Yes" : "No"} </div>
						<div>Pool Prepared:  {(swPreparado === false) ? "No" : (swPreparado === true) ? "Yes" : swPreparado || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
						<div>Pool Started:  {(swIniciado === false) ? "No" : (swIniciado === true) ? "Yes" : swIniciado || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
						<div>Pool has Funds:  {(swFunded === false) ? "No" : (swFunded === true) ? "Yes" : swFunded || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
						<div>Pool Closed:  {(swClosed === false) ? "No" : (swClosed === true) ? "Yes" : swClosed || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
						<div>Pool Terminated: {(swTerminated === false) ? "No" : (swTerminated === true) ? "Yes" : swTerminated || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
						<div>Pool is Ready For Get Back Fund: {(swZeroFunds === false || swTerminated === false) ? "No" : (swTerminated === true && swTerminated === true) ? "Yes" : swZeroFunds || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
						<br></br>

						
						<div>EUTxOs {swFromDB? "DB" : ""} At Contract : {countEUTxOs_With_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
						<br></br>

						{/* <p style={{color: 'black', fontSize: 12}}>
						<li>UTxO required: {poolInfo.poolID_TxOutRef.txHash + "#" + poolInfo.poolID_TxOutRef.outputIndex}</li>
						</p>
						<br></br> */}

						{/* <div>UTxO At Script With Pool Datum: <br></br>
						{eUTxO_With_PoolDatum === ui_loading || eUTxO_With_PoolDatum === ui_notConnected ? eUTxO_With_PoolDatum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_PoolDatum === undefined ? "No" : typeof eUTxO_With_PoolDatum !== 'string' ? eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex : ""} </div>
						<br></br>

						<div>UTxO At Script With Script Datum: {eUTxO_With_ScriptDatum === ui_loading || eUTxO_With_ScriptDatum === ui_notConnected ? eUTxO_With_ScriptDatum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_ScriptDatum === undefined ? "No" : typeof eUTxO_With_ScriptDatum !== 'string' ? eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex : ""} </div>
						<br></br>

						<div>UTxO At Script With Script TxID_Master_Fund_Datum: {eUTxO_With_Script_TxID_Master_Fund_Datum === ui_loading || eUTxO_With_Script_TxID_Master_Fund_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_Fund_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_Fund_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_Fund_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_Fund_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_FundAndMerge_Datum: {eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === ui_loading || eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_FundAndMerge_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_FundAndMerge_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_FundAndMerge_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_SplitFund_Datum: {eUTxO_With_Script_TxID_Master_SplitFund_Datum === ui_loading || eUTxO_With_Script_TxID_Master_SplitFund_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_SplitFund_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_SplitFund_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_SplitFund_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SplitFund_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_ClosePool_Datum: {eUTxO_With_Script_TxID_Master_ClosePool_Datum === ui_loading || eUTxO_With_Script_TxID_Master_ClosePool_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_ClosePool_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_ClosePool_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_ClosePool_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_ClosePool_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_TerminatePool_Datum: {eUTxO_With_Script_TxID_Master_TerminatePool_Datum === ui_loading || eUTxO_With_Script_TxID_Master_TerminatePool_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_TerminatePool_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_TerminatePool_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_TerminatePool_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_TerminatePool_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_DeleteFund_Datum: {eUTxO_With_Script_TxID_Master_DeleteFund_Datum === ui_loading || eUTxO_With_Script_TxID_Master_DeleteFund_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_DeleteFund_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_DeleteFund_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_DeleteFund_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_DeleteFund_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_SendBackFund_Datum: {eUTxO_With_Script_TxID_Master_SendBackFund_Datum === ui_loading || eUTxO_With_Script_TxID_Master_SendBackFund_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_SendBackFund_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_SendBackFund_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_SendBackFund_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackFund_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_SendBackDeposit_Datum: {eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === ui_loading || eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_AddScripts_Datum: {eUTxO_With_Script_TxID_Master_AddScripts_Datum === ui_loading || eUTxO_With_Script_TxID_Master_AddScripts_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_AddScripts_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_AddScripts_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_AddScripts_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_AddScripts_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_Master_DeleteScripts_Datum: {eUTxO_With_Script_TxID_Master_DeleteScripts_Datum === ui_loading || eUTxO_With_Script_TxID_Master_DeleteScripts_Datum === ui_notConnected ? eUTxO_With_Script_TxID_Master_DeleteScripts_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_Master_DeleteScripts_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_Master_DeleteScripts_Datum !== 'string' ? eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_Master_DeleteScripts_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_User_Deposit_Datum: {eUTxO_With_Script_TxID_User_Deposit_Datum === ui_loading || eUTxO_With_Script_TxID_User_Deposit_Datum === ui_notConnected ? eUTxO_With_Script_TxID_User_Deposit_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_User_Deposit_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_User_Deposit_Datum !== 'string' ? eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_User_Harvest_Datum: {eUTxO_With_Script_TxID_User_Harvest_Datum === ui_loading || eUTxO_With_Script_TxID_User_Harvest_Datum === ui_notConnected ? eUTxO_With_Script_TxID_User_Harvest_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_User_Harvest_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_User_Harvest_Datum !== 'string' ? eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.outputIndex : ""} </div>
						<br></br>
						<div>UTxO At Script With Script TxID_User_Withdraw_Datum: {eUTxO_With_Script_TxID_User_Withdraw_Datum === ui_loading || eUTxO_With_Script_TxID_User_Withdraw_Datum === ui_notConnected ? eUTxO_With_Script_TxID_User_Withdraw_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> : eUTxO_With_Script_TxID_User_Withdraw_Datum === undefined ? "No" : typeof eUTxO_With_Script_TxID_User_Withdraw_Datum !== 'string' ? eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.outputIndex : ""} </div>
						<br></br> */}

						<p><>Begin At: {new Date(parseInt(poolInfo.pParams.ppBegintAt.toString())).toString()}</></p>
						<br></br>

						{typeof closedAt === "object" ?
							<p><>Forzed Deadline: {(typeof closedAt === "object") ? closedAt.toString() : closedAt}</></p>
							:
							<>
								<p><>Deadline: {new Date(parseInt(poolInfo.pParams.ppDeadline.toString())).toString()}</></p>
							</>
						}
						<br></br>

						<p><>Grace Time: {Number(poolInfo.pParams.ppGraceTime) / (1000 * 3600 * 24)} days</></p>
						<br></br>

						{(swTerminated === true) ?
							<p><>Terminate Date: It's already Terminated</></p>
							:
							<p><>Terminate Date: {(typeof terminatedAt === "object") ? terminatedAt.toString() : terminatedAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
						}
						<br></br>

						{/* s */}

						<p><>Estimated Anual {poolInfo.harvest_UI} per each {poolInfo.staking_UI}:&nbsp;{Number(poolInfo.pParams.ppInterestRates[0].iPercentage).toLocaleString("en-US")}</></p>
						<br></br>

						<div>
							Staking Unit In Wallet: {(walletStakingAmount === ui_loading || walletStakingAmount === ui_notConnected ? walletStakingAmount : Number(walletStakingAmount).toLocaleString("en-US") + " " + poolInfo.staking_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}
						</div>
						<div>
							Harvest Unit In Wallet: {(walletHarvestAmount === ui_loading || walletHarvestAmount === ui_notConnected ? walletHarvestAmount :  Number(walletHarvestAmount).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}
						</div>
						<br></br>

						<p>Active Users: {countEUTxOs_With_UserDatum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
						{/* <p>Registered Users: {countEUTxOs_With_UserDatum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p> */}
						<br></br>
						<p>Total Staked: {(totalStaked === ui_loading || totalStaked === ui_notConnected ? totalStaked : Number(totalStaked).toLocaleString("en-US") + " " + poolInfo.staking_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
						<p>Rewards Harvested: {(totalRewardsPaid === ui_loading || totalRewardsPaid === ui_notConnected ? totalRewardsPaid : Number(totalRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
						<p>Rewards to Pay: {(totalRewardsToPay === ui_loading || totalRewardsToPay === ui_notConnected ? totalRewardsToPay : Number(totalRewardsToPay).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
						<br></br>
						<p>UTxOs with Funds: {countEUTxOs_With_FundDatum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
						<p>Availaible Funds: {(totalFundsAvailable === ui_loading || totalFundsAvailable === ui_notConnected ? totalFundsAvailable : Number(totalFundsAvailable).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
						<br></br>
						<div className='pool__contract_address'>
							User Deposit Policy ID
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
						<p>User Deposit TokenName: {txID_User_Deposit_For_User_TN}</p>
						<br></br>	
						<div className='pool__contract_address'>
							Contract Address
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
				</div>
				<div className="pool__action_cards ">
					<div className="pool__action_card ">
						<div className="pool__stat">
							<div className="pool__column">
								<ActionModalBtn action={masterPreparePoolAction} swHash={true} poolInfo={poolInfo}
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === false} 
									show={swPreparado !== true}
									actionName="Prepare Pool" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />

								<ActionModalBtn action={masterAddScriptsMasterAllAction} swHash={false} poolInfo={poolInfo}
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true &&
										(
											typeof eUTxO_With_Script_TxID_Master_Fund_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_Master_FundAndMerge_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_Master_SplitFund_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_Master_ClosePool_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_Master_TerminatePool_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_Master_DeleteFund_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_Master_SendBackFund_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum !== "object"
										)}
									show={swPreparado === true}
									actionName="Add Scripts Master" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									callback={handleCallback} 
									cancel={handleCancel}
									/>

								<ActionModalBtn action={masterDeleteScriptsMasterAllAction} swHash={false} poolInfo={poolInfo}
									enabled={walletStore.connected && isPoolDataLoaded &&
										(
											typeof eUTxO_With_Script_TxID_Master_Fund_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_Master_FundAndMerge_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_Master_SplitFund_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_Master_ClosePool_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_Master_TerminatePool_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_Master_DeleteFund_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_Master_SendBackFund_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum === "object"
										)} 
										show={swPreparado === true}
										actionName="Delete Scripts Master" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
										callback={handleCallback} 
										cancel={handleCancel}
										/>

								{/* 
								
								<ActionModalBtn action={addScriptsMasterFundAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && typeof eUTxO_With_Script_TxID_Master_Fund_Datum !== "object" } actionName="Add Scripts Master Fund" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/>
								
								<ActionModalBtn action={addScriptsMasterFundAndMergeAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded &&  typeof eUTxO_With_Script_TxID_Master_FundAndMerge_Datum !== "object" } actionName="Add Scripts Master Fund And Merge" actionIdx={poolInfo.name}  messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/>
								
								<ActionModalBtn action={addScriptsMasterMergeAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded &&  typeof eUTxO_With_Script_TxID_Master_SplitFund_Datum !== "object" } actionName="Add Scripts Master Merge" actionIdx={poolInfo.name}  messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/>
								
								<ActionModalBtn action={addScriptsMasterCloseAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded &&  typeof eUTxO_With_Script_TxID_Master_ClosePool_Datum !== "object" } actionName="Add Scripts Master Close Pool" actionIdx={poolInfo.name}  messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/>
								
								<ActionModalBtn action={addScriptsMasterTerminateAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded &&  typeof eUTxO_With_Script_TxID_Master_TerminatePool_Datum !== "object" } actionName="Add Scripts Master Delete" actionIdx={poolInfo.name}  messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/>
								
								<ActionModalBtn action={addScriptsMasterGetBackFundAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded &&  typeof eUTxO_With_Script_TxID_Master_DeleteFund_Datum !== "object" } actionName="Add Scripts Master GetBackFund" actionIdx={poolInfo.name}  messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/>
								
								*/}

								<ActionModalBtn action={masterAddScriptsUserAllAction} swHash={false} poolInfo={poolInfo}
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true &&
										(
											typeof eUTxO_With_Script_TxID_User_Deposit_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_User_Withdraw_Datum !== "object" ||
											typeof eUTxO_With_Script_TxID_User_Harvest_Datum !== "object"
										)} 
										show={swPreparado === true}
										actionName="Add Scripts User" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
										callback={handleCallback}
										cancel={handleCancel}
										/>

								<ActionModalBtn action={masterDeleteScriptsUserAllAction} swHash={false} poolInfo={poolInfo}
									enabled={walletStore.connected && isPoolDataLoaded &&
										(
											typeof eUTxO_With_Script_TxID_User_Deposit_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_User_Withdraw_Datum === "object" ||
											typeof eUTxO_With_Script_TxID_User_Harvest_Datum === "object"
										)} 
										show={swPreparado === true}
										actionName="Delete Scripts User" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
										callback={handleCallback} 
										cancel={handleCancel}
										/>

								{/* <ActionModalBtn action={addScriptsUserDepositAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && typeof eUTxO_With_Script_TxID_User_Deposit_Datum !== "object" } actionName="Add Scripts User Deposit" actionIdx={poolInfo.name}  messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/>
								<ActionModalBtn action={addScriptsUserWithdrawAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded &&  typeof eUTxO_With_Script_TxID_User_Withdraw_Datum !== "object" } actionName="Add Scripts User Withdraw" actionIdx={poolInfo.name}  messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/>
								<ActionModalBtn action={addScriptsUserHarvestAction} swHash={true} poolInfo={poolInfo}
								enabled={walletStore.connected && isPoolDataLoaded &&  typeof eUTxO_With_Script_TxID_User_Harvest_Datum !== "object" } actionName="Add Scripts User Harvest" actionIdx={poolInfo.name}  messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback}/> */}

								<ActionModalBtn action={masterUpdateEUTxODBAction} swHash={false} poolInfo={poolInfo}
									enabled={walletStore.connected && isPoolDataLoaded} 
									show={swPreparado === true}
									actionName="Update EUTxOs in DB" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
										
							</div>
						</div>
						<div className="pool__stat">
							<div className="pool__column">
								<ActionModalBtn action={masterNewFundAction} swHash={true} poolInfo={poolInfo} 
									showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true} 
									show={swPreparado === true}
									actionName="New Fund" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
								<ActionModalBtn 
									action={masterNewFundsBatchAction} swHash={false} poolInfo={poolInfo} 
									showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true} 
									show={swPreparado === true}
									actionName="New Funds Batch" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									callback={handleCallback} 
									cancel={handleCancel}
									/>
								<FundsModalBtn
									masterNewFundAction={masterNewFundAction}
									masterNewFundsBatchAction={masterNewFundsBatchAction}
									masterFundAndMergeAction={masterFundAndMergeAction}
									masterMergeFundsAction={masterMergeFundsAction}
									masterSplitFundAction={masterSplitFundAction}
									masterDeleteFundsAction={masterDeleteFundsAction}
									masterDeleteFundsBatchAction={masterDeleteFundsBatchAction}
									poolInfo={poolInfo} 
									statePoolData={statePoolData}											
									enabled={walletStore.connected && isPoolDataLoaded}
									show={swPreparado === true}
									actionName="View Funds" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorkingFromParent={isWorking} 
									callback={handleCallback}
									cancel={handleCancel} />
								<UsersModalBtn
									masterSendBackDepositAction={masterSendBackDepositAction}
									poolInfo={poolInfo} 
									statePoolData={statePoolData}											
									enabled={walletStore.connected && isPoolDataLoaded} 
									show={swPreparado === true}
									actionName="View Deposits" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorkingFromParent={isWorking} callback={handleCallback} />
								<MasterModalBtn
									masterGetBackFundAction={masterGetBackFundAction}
									masterSendBackFundAction={masterSendBackFundAction}
									poolInfo={poolInfo} 
									statePoolData={statePoolData}											
									enabled={walletStore.connected && isPoolDataLoaded} 
									show={swPreparado === true}
									actionName="View Masters" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorkingFromParent={isWorking} callback={handleCallback} />
								<ActionModalBtn action={splitUTxOsAction} swHash={true} 
									enabled={walletStore.connected && isPoolDataLoaded} 
									show={swPreparado === true}
									actionName="Split UTxOs" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							
							</div>
						</div>
						<div className="pool__stat">
							<div className="pool__column">
								<ActionModalBtn action={masterShowPoolAction} swHash={false} poolInfo={poolInfo} 
									enabled={true} actionName="Show / Hide" 
									show={true}
									actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
								<li className="info">Show or hide the Home Pool.</li>
								<ActionModalBtn action={masterClosePoolAction} swHash={true} poolInfo={poolInfo} 
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true} 
									show={swPreparado === true}
									actionName="Close Pool" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
								<li className="info">Close the Pool at this time, instead of waiting for the Deadline.</li>
								<li className="info">Users will only be able to collect rewards accumulated so far.</li>
								<li className="info">Masters can keep adding Funds so there are funds to pay rewards.</li>
								<li className="info">After Grace Time the Pool will be finished.</li>
								<ActionModalBtn action={masterTerminatePoolAction} swHash={true} poolInfo={poolInfo} 
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true} 
									show={swPreparado === true}
									actionName="Terminate Pool" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
								<li className="info">Finish the Pool now, instead of waiting for Deadline and Grace Time.</li>
								<li className="info">Users will not be able to collect any more rewards.</li>
								<li className="info">After Deleteing all Funds, Masters can recover any funds left over, proportionally to what each one has put in.</li>
								<ActionModalBtn action={masterDeletePoolAction} swHash={false} poolInfo={poolInfo} 
									enabled={walletStore.connected && isPoolDataLoaded} actionName="Delete Pool" 
									show={true}
									actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
								<li className="info">You can delete the Pool only if there are no Funds or registered users yet.</li>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

	)
}


