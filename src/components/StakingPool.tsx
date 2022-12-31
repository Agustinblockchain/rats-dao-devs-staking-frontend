//--------------------------------------
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
//--------------------------------------
import { Assets } from 'lucid-cardano';
//--------------------------------------
import ActionModalBtn from './ActionModalBtn';
//--------------------------------------
import { useStoreActions, useStoreState } from '../utils/walletProvider';
//--------------------------------------
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { splitUTxOs } from "../stakePool/endPoints - splitUTxOs";
import { userDeposit, userHarvest, userWithdraw } from '../stakePool/endPoints - user';
import { explainError } from "../stakePool/explainError";
import { stakingPoolDBParser } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO } from '../types';
import { maxTokensWithDifferentNames, txID_User_Deposit_For_User_TN } from '../types/constantes';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { apiDeleteEUTxODB } from '../utils/cardano-helpers';
import { awaitTx } from '../utils/cardano-helpersTx';
import { pushSucessNotification, pushWarningNotification } from "../utils/pushNotification";
import { copyToClipboard, toJson } from '../utils/utils';
import LoadingSpinner from './LoadingSpinner';
//--------------------------------------

export default function StakingPool({ stakingPoolInfo }: { stakingPoolInfo: StakingPoolDBInterface } ) {
    // console.log("StakingPool - " + stakingPoolInfo.name + " - INIT")

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

	const statePoolData = useStatePoolData(poolInfo)

	const { 
		swFromDB,
		swShowOnHome,
		swPreparado, swIniciado, swFunded,
		swClosed, closedAt, swTerminated, terminatedAt,
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

		totalFundsAvailable,

		totalStaked, totalRewardsPaid, totalRewardsToPay,

		isPoolDataLoading, isPoolDataLoaded,
		setLoading,
		loadPoolData ,

		userStakedDatas, swUserRegistered
	
		} = statePoolData

	useEffect(() => {
		// console.log("StakingPool - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

		if (walletStore.connected && !isWalletDataLoaded) {
			setWalletStakingAmount(ui_loading)
			setWalletHarvestAmount(ui_loading)

			setMaxStakingAmount(ui_loading)
			setMaxHarvestAmount(ui_loading)

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


		} else {
			// console.log("StakingPool - " + poolInfo.name + " - useEffect3 - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

			setWalletStakingAmount(ui_notConnected)
			setWalletHarvestAmount(ui_notConnected)

			setMaxStakingAmount(ui_notConnected)
			setMaxHarvestAmount(ui_notConnected)


		}
	}, [walletStore, isWalletDataLoaded])

	useEffect(() => {
		// console.log("StakingPool - " + poolInfo.name + " - useEffect2 - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

		if (walletStore.connected) {
			loadPoolData(true)
		} 

	}, [walletStore.connected])

	//--------------------------------------

	const handleCallback = async (isWorking: string) => {
		console.log("StakingPool - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		// alert ("StakingPool - callbak in:" + isWorking)
		setIsWorking(isWorking)
		return isWorking
	}

	const handleCancel = async () => {
		console.log("StakingPool - " + poolInfo.name + " - handleCancel")
		if (!isCancelling.current && isWorkingInABuffer.current ){
			setActionMessage(actionMessage + " (Canceling when this Tx finishes)")
			setIsCanceling(true)
		}
	}

	//--------------------------------------

	const userDepositBatchAction = async (poolInfo?: StakingPoolDBInterface, _?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPool - Deposit Batch - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		var swErrors = false

		for (let i = 1; i <= 50 && !isCancelling.current; i++) {
			try {
				setActionMessage("Deposit " + i + " of "+ 50 + ", please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await userDepositAction(poolInfo, _, assets);
				pushSucessNotification("Deposit " + i + " of "+ 50, txHash, true);
				setActionHash("")
			} catch (error: any) {
				const error_explained = explainError(error)
				pushWarningNotification("Deposit " + i + " of "+ 50, error_explained);
				swErrors = true
				await updatePage()
				// await new Promise(r => setTimeout(r, 2000));
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
				return "Deposit Batch executed"
			}
		}

	}

	//--------------------------------------

	const userDepositAction = async (poolInfo?: StakingPoolDBInterface, _?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPool - Deposit Pool - PoolInfo: " + toJson(poolInfo?.name) + " - Assets: " + toJson(assets))

		if (!isWorkingInABuffer.current) setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		var eUTxO_for_consuming_ : EUTxO [] = []

		try {

			const [txHash, eUTxO_for_consuming] = await userDeposit(walletStore!, poolInfo!, assets!, walletStore.pkh!);
			eUTxO_for_consuming_ = eUTxO_for_consuming

			if (!isWorkingInABuffer.current) setActionMessage("Waiting for confirmation, please wait...")
			setActionHash(txHash)

			await awaitTx (lucid!, txHash, eUTxO_for_consuming, updatePage, isWorkingInABuffer.current) 

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			for (let i = 0; i < eUTxO_for_consuming_.length; i++) {
				await apiDeleteEUTxODB(eUTxO_for_consuming_[i]);
			}
			updatePage()
			throw error
		}

	}

	//--------------------------------------

	const userHarvestAction = async (poolInfo?: StakingPoolDBInterface, userEUTxO?: EUTxO[], assets?: Assets) => {

		console.log("StakingPool - Harvest Pool - PoolInfo: " + toJson(poolInfo?.name) + " - Assets: " + toJson(assets))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid
		var eUTxO_for_consuming_ : EUTxO [] = []

		try {

			const [txHash, eUTxO_for_consuming] = await userHarvest(walletStore!, poolInfo!, assets!, walletStore.pkh!, userEUTxO![0]);
			eUTxO_for_consuming_ = eUTxO_for_consuming

			setActionMessage("Waiting for confirmation, please wait...")
			setActionHash(txHash)

			await awaitTx (lucid!, txHash, eUTxO_for_consuming, updatePage, isWorkingInABuffer.current) 

			setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			for (let i = 0; i < eUTxO_for_consuming_.length; i++) {
				await apiDeleteEUTxODB(eUTxO_for_consuming_[i]);
			}
			updatePage()
			throw error
		}

	}
	//--------------------------------------

	const userWithdrawAction = async (poolInfo?: StakingPoolDBInterface, userEUTxO?: EUTxO[]) => {

		console.log("StakingPool - Withdraw Pool - PoolInfo: " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid
		var eUTxO_for_consuming_ : EUTxO [] = []

		try {

			const [txHash, eUTxO_for_consuming] = await userWithdraw(walletStore!, poolInfo!, walletStore.pkh!, userEUTxO![0]);
			eUTxO_for_consuming_ = eUTxO_for_consuming

			setActionMessage("Waiting for confirmation, please wait...")
			setActionHash(txHash)

			await awaitTx (lucid!, txHash, eUTxO_for_consuming, updatePage, isWorkingInABuffer.current) 

			setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			for (let i = 0; i < eUTxO_for_consuming_.length; i++) {
				await apiDeleteEUTxODB(eUTxO_for_consuming_[i]);
			}
			updatePage()
			throw error
		}

	}

	//--------------------------------------
	
	const splitUTxOsAction = async () => {

		console.log("StakingPool - Split Wallet UTxOs")

		setActionMessage("Creating Transfer, please wait...")

		const lucid = walletStore.lucid

		try {

			const [txHash, eUTxO_for_consuming] =  await splitUTxOs(walletStore!, walletStore.pkh!);

			setActionMessage("Waiting for confirmation, please wait...")
			setActionHash(txHash)

			// await new Promise(r => setTimeout(r, 5000));
			await awaitTx (lucid!, txHash, eUTxO_for_consuming, updatePage, isWorkingInABuffer.current) 

			if (!isWorkingInABuffer.current) setIsWorking("")

			return txHash.toString();

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			throw error
		}
	}

	//--------------------------------------

	const updatePage = async () => {
		var poolInfo_ = await loadPoolData(false)
		setPoolInfo(poolInfo_)
		await loadWalletData(walletStore)
	}

	//--------------------------------------

	return (

		<div className="section__text pool">

			<div className="pool__data">

				<div className="pool__image ">
					<Image width={126} height={126} src={poolInfo.imageSrc} />
				</div>

				<div className="pool__data_item">
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

					<div>Pool Closed:  {(swClosed === false) ? "No" : (swClosed === true) ? "Yes" : swClosed || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
					<div>Pool Terminated: {(swTerminated === false) ? "No" : (swTerminated === true) ? "Yes" : swTerminated || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
					<br></br>
					<div>EUTxOs {swFromDB? "DB" : ""} At Contract : {countEUTxOs_With_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
					<br></br>

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

					<p><>Estimated Anual {poolInfo.harvest_UI} per each {poolInfo.staking_UI}:&nbsp;{Number(poolInfo.pParams.ppInterestRates[0].iPercentage).toLocaleString("en-US")}</></p>
					<br></br>

					<div>
						Staking Unit In Wallet: {(walletStakingAmount === ui_loading || walletStakingAmount === ui_notConnected ? walletStakingAmount : Number(walletStakingAmount).toLocaleString("en-US") + " " + poolInfo.staking_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}
					</div>
					<div>
						Harvest Unit In Wallet: {(walletHarvestAmount === ui_loading || walletHarvestAmount === ui_notConnected ? walletHarvestAmount : Number(walletHarvestAmount).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}
					</div>
					<br></br>

					<p>Active Users: {countEUTxOs_With_UserDatum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
					<br></br>
					<p>Total Staked: {(totalStaked === ui_loading || totalStaked === ui_notConnected ? totalStaked : Number(totalStaked).toLocaleString("en-US") + " " + poolInfo.staking_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
					<p>Rewards Harvested: {(totalRewardsPaid === ui_loading || totalRewardsPaid === ui_notConnected ? totalRewardsPaid : Number(totalRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
					<p>Rewards to Pay: {(totalRewardsToPay === ui_loading || totalRewardsToPay === ui_notConnected ? totalRewardsToPay : Number(totalRewardsToPay).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
					<br></br>
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

				<div className="pool__action_cards ">
					{userStakedDatas.map(
						userStakedData =>
							<div key={`${userStakedData.eUTxO_With_UserDatum!.uTxO.txHash}-${userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex}`} >

								<div className="pool__action_card "  >
									{userStakedData.isLoading? 
											<>
												<div className="pool__stat" style={{width: 220}}>
													<p>Staked Date: {userStakedData.userCreatedAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
													<br></br>
													{userStakedData.userLastClaimAt !== "..." ?
														<>
															<p>Last Claim Date: {userStakedData.userLastClaimAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
															<br></br>
														</>
														:
														<></>
													}
													<p>Rewards Harvested: {(userStakedData.userRewardsPaid === 0 ? userStakedData.userRewardsPaid : Number(userStakedData.userRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">
													Rewards
													</h4>
													<h3 className="pool__stat-value">{(userStakedData.userRewardsToPay === 0 ? userStakedData.userRewardsToPay : Number(userStakedData.userRewardsToPay).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions" style={{width: 200}}>
													</div>
													
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">Staked</h4>
													<h3 className="pool__stat-value">{(userStakedData.userStaked === 0 ? userStakedData.userStaked : Number(userStakedData.userStaked).toLocaleString("en-US") + " " + poolInfo.staking_UI) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions" style={{width: 200}}>
													</div>
												</div>
											</>
										:
											<>
												<div className="pool__stat">
													<p>Staked Date: {userStakedData.userCreatedAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
													<br></br>
													{userStakedData.userLastClaimAt !== "..." ?
														<>
															<p>Last Claim Date: {userStakedData.userLastClaimAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
															<br></br>
														</>
														:
														<></>
													}
													<p>Rewards Harvested: {(userStakedData.userRewardsPaid === 0 ? userStakedData.userRewardsPaid : Number(userStakedData.userRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">
														Rewards
														<button onClick={() => { if (walletStore.connected) { } }} className='btn__ghost icon' style={walletStore.connected ? { cursor: 'pointer' } : { cursor: 'default' }} >
															<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
																<path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
																<path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
															</svg>
														</button>
													</h4>
													<h3 className="pool__stat-value">{(userStakedData.userRewardsToPay === 0 ? userStakedData.userRewardsToPay : Number(userStakedData.userRewardsToPay).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions">
														<ActionModalBtn action={userHarvestAction} swHash={true} eUTxOs_Selected={[userStakedData.eUTxO_With_UserDatum!]} poolInfo={poolInfo} showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={userStakedData.userRewardsToPay} enabled={walletStore.connected && isPoolDataLoaded && swUserRegistered} show={true} actionName="Harvest" actionIdx={poolInfo.name + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.txHash + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
													</div>
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">Staked</h4>
													<h3 className="pool__stat-value">{(userStakedData.userStaked === 0 ? userStakedData.userStaked : Number(userStakedData.userStaked).toLocaleString("en-US") + " " + poolInfo.staking_UI) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions">
														<ActionModalBtn action={userWithdrawAction} swHash={true} eUTxOs_Selected={[userStakedData.eUTxO_With_UserDatum!]} poolInfo={poolInfo} showInput={false} enabled={walletStore.connected && isPoolDataLoaded && swUserRegistered} show={true} actionName="Withdraw" actionIdx={poolInfo.name + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.txHash + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
													</div>
												</div>
											</>
										}
								</div>
								<div className="pool__flex_break" ><br></br></div>
							</div>
					)}

					<div className="pool__action_smallcard"  >
						<div className="pool__stat">
							<h4 >Stake</h4>
						</div>
						<div className="pool__stat">
							<ActionModalBtn action={userDepositAction} swHash={true} poolInfo={poolInfo} showInput={true} inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmount} enabled={walletStore.connected && isPoolDataLoaded && swFunded === true} show={true} actionName="Deposit" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />

							<ActionModalBtn action={userDepositBatchAction} swHash={false} poolInfo={poolInfo} showInput={true} inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmount} enabled={walletStore.connected && isPoolDataLoaded && swFunded === true} show={true} actionName="Deposit Batch" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
							callback={handleCallback} 
							cancel={handleCancel}
							/>
						</div>
						<div className="pool__stat">
							<ActionModalBtn action={splitUTxOsAction} swHash={true} enabled={walletStore.connected && isPoolDataLoaded} show={true} actionName="Split Wallet UTxOs" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}



