//--------------------------------------
import { Assets } from 'lucid-cardano';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { splitUTxOs } from "../stakePool/endPoints - splitUTxOs";
import { userDeposit, userHarvest, userWithdraw } from '../stakePool/endPoints - user';
import { explainError } from "../stakePool/explainError";
import { stakingPoolDBParser } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO } from '../types';
import { maxTokensWithDifferentNames, txID_User_Deposit_For_User_TN } from '../types/constantes';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { addAssets } from '../utils/cardano-helpers';
import { newTransaction } from '../utils/cardano-helpersTx';
import { pushSucessNotification, pushWarningNotification } from "../utils/pushNotification";
import { copyToClipboard, toJson } from '../utils/utils';
import { useStoreActions, useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import ActionWithMessageModalBtn from './ActionWithMessageModalBtn';
import ActionWithSelectInputModalBtn from './ActionWithSelectInputModalBtn';
import LoadingSpinner from './LoadingSpinner';
//--------------------------------------

export default function StakingPool ({ stakingPoolInfo }: { stakingPoolInfo: StakingPoolDBInterface } ) {
    // console.log("StakingPool - " + stakingPoolInfo.name + " - INIT")

	//string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
	const ui_loading = 0
	const ui_notConnected = '...'

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

	const [walletStakingAmount, setWalletStakingAmount] = useState<string | 0>(ui_notConnected)
	const [walletHarvestAmount, setWalletHarvestAmount] = useState<string | 0>(ui_notConnected)

	const [maxStakingAmount, setMaxStakingAmount] = useState<string | 0>(ui_notConnected)
	const [maxHarvestAmount, setMaxHarvestAmount] = useState<string | 0>(ui_notConnected)

	const [walletStakingAssets, setWalletStakingAssets] = useState<Assets>({})

	
	const statePoolData = useStatePoolData(stakingPoolInfo)

	const { 
		poolInfo,

		swShowOnHome,
		swPreparado, swIniciado, swFunded,
		swClosed, closedAt, swTerminated, terminatedAt,
		swZeroFunds,
		swPoolReadyForDelete,

		eUTxOs_With_Datum, countEUTxOs_With_Datum,
		eUTxO_With_PoolDatum,
		eUTxOs_With_FundDatum, countEUTxOs_With_FundDatum,
		eUTxOs_With_UserDatum, countEUTxOs_With_UserDatum,

		totalFundsAvailable,

		totalStaked, totalRewardsPaid, totalRewardsToPay,

		isPoolDataLoading, isPoolDataLoaded,

		userStakedDatas, swUserRegistered,
		
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
		// console.log("StakingPool - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

		if (walletStore.connected && !isWalletDataLoaded) {
			setWalletStakingAmount(ui_loading)
			setWalletHarvestAmount(ui_loading)

			setMaxStakingAmount(ui_loading)
			setMaxHarvestAmount(ui_loading)

			setWalletStakingAssets({})

		} else if (walletStore.connected && isWalletDataLoaded) {
			//------------------
			const walletStakingAmount = getTotalOfUnit(poolInfo.staking_Lucid)
			const walletHarvestAmount = getTotalOfUnit(poolInfo.harvest_Lucid)
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
			const assets = uTxOsAtWallet.reduce((acc : Assets, utxo) => { return addAssets (acc, utxo.assets) }, {})
			const assetsOfAC : Assets = {}
			for (const [key, value] of Object.entries(assets)) {
				const CS_ = key.slice(0, 56)
				const TN_ = key.slice(56)
				if (CS_ === staking_CS && (staking_AC_isWithoutTokenName || TN_ === staking_TN)) {
					assetsOfAC[key] = value
				}
			}
			setWalletStakingAssets(assetsOfAC)

		} else {
			// console.log("StakingPool - " + poolInfo.name + " - useEffect3 - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

			setWalletStakingAmount(ui_notConnected)
			setWalletHarvestAmount(ui_notConnected)

			setMaxStakingAmount(ui_notConnected)
			setMaxHarvestAmount(ui_notConnected)

			setWalletStakingAssets({})

		}
	}, [walletStore, isWalletDataLoaded])

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

	const updateDetailsStakingPool = async () => {
		await refreshPoolData()
	}

	const updateDetailsStakingPoolAndWallet = async () => {
		await updateDetailsStakingPool()
		await loadWalletData(walletStore)
	}

	//--------------------------------------

	const userDepositAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction ("StakingPool - Deposit Pool", walletStore, poolInfo, userDeposit, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, updateDetailsStakingPoolAndWallet, eUTxOs_Selected, assets) 
	}

	const userHarvestAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => {
		return await newTransaction ("StakingPool - Harvest Pool", walletStore, poolInfo, userHarvest, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, updateDetailsStakingPoolAndWallet, eUTxOs_Selected, assets) 
	}

	const userWithdrawAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => {
		return await newTransaction ("StakingPool - Withdraw Pool", walletStore, poolInfo, userWithdraw, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, updateDetailsStakingPoolAndWallet, eUTxOs_Selected, assets) 
	}

	//--------------------------------------

	const userDepositBatchAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPool - Deposit Batch - " + toJson(poolInfo?.name))

		setActionMessage("Creating Transfer, please wait...")
		setIsWorkingInABuffer(true)
		var swErrors = false

		for (let i = 1; i <= 50 && !isCancelling.current; i++) {
			try {
				setActionMessage("Deposit " + i + " of "+ 50 + ", please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await userDepositAction(poolInfo, eUTxOs_Selected, assets);
				pushSucessNotification("Deposit " + i + " of "+ 50, txHash, true);
				setActionHash("")
			} catch (error: any) {
				const error_explained = explainError(error)
				pushWarningNotification("Deposit " + i + " of "+ 50, error_explained);
				swErrors = true
				await updateDetailsStakingPoolAndWallet()
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
	
	const splitUTxOsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction ("StakingPool - Split Wallet UTxOs", walletStore, poolInfo, splitUTxOs, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, updateDetailsStakingPoolAndWallet, eUTxOs_Selected, assets) 
	}
	
	//--------------------------------------

	return (

		<div className="section__text pool">

			<div className="pool__data">

				<div className="pool__image ">
					<Image width={126} height={126} src={poolInfo.imageSrc} />
				</div>

				<div className="pool__data_item">
					<h4 className="pool_title">{poolInfo.name}&nbsp;
						{isPoolDataLoading?
							<>
								<br></br>
								<br></br>
								<LoadingSpinner size={25} border={5} />
								<br></br>
							</>
						:
							<>
								<button onClick={() => { if (walletStore.connected) { updateDetailsStakingPoolAndWallet() } }} className='btn__ghost icon' style={walletStore.connected ? { cursor: 'pointer' } : { cursor: 'default' }} >
									
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

					{process.env.NODE_ENV==="development"?
							<>
								<div>EUTxOs At Contract: {countEUTxOs_With_Datum || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
								<br></br>
							</>
						:
							<></>
					}
					
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
													<div style={{textAlign: 'left', width:"100%"}}>Staked Date: {userStakedData.userCreatedAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
													<br></br>
													{userStakedData.userLastClaimAt !== "..." ?
														<>
															<div style={{textAlign: 'left', width:"100%"}}>Last Claim Date: {userStakedData.userLastClaimAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
															<br></br>
														</>
														:
														<></>
													}
													<div style={{textAlign: 'left', width:"100%"}}>Rewards Harvested: {(userStakedData.userRewardsPaid === 0 ? userStakedData.userRewardsPaid : Number(userStakedData.userRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
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
													<div style={{textAlign: 'left', width:"100%"}}>Staked Date: {userStakedData.userCreatedAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
													<br></br>
													{userStakedData.userLastClaimAt !== "..." ?
														<>
															<div style={{textAlign: 'left', width:"100%"}}>Last Claim Date: {userStakedData.userLastClaimAt || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
															<br></br>
														</>
														:
														<></>
													}
													<div style={{textAlign: 'left', width:"100%"}}>Rewards Harvested: {(userStakedData.userRewardsPaid === 0 ? userStakedData.userRewardsPaid : Number(userStakedData.userRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">
														Rewards
														{/* <button onClick={() => { if (walletStore.connected) { } }} className='btn__ghost icon' style={walletStore.connected ? { cursor: 'pointer' } : { cursor: 'default' }} >
															<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
																<path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
																<path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
															</svg>
														</button> */}
													</h4>
													<h3 className="pool__stat-value">{(userStakedData.userRewardsToPay === 0 ? userStakedData.userRewardsToPay : Number(userStakedData.userRewardsToPay).toLocaleString("en-US") + " " + poolInfo.harvest_UI) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions">
														<ActionWithInputModalBtn action={userHarvestAction} 
															swHash={true} 
															eUTxOs_Selected={[userStakedData.eUTxO_With_UserDatum!]} 
															poolInfo={poolInfo} 
															showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={userStakedData.userRewardsToPay} 
															enabled={walletStore.connected && isPoolDataLoaded && swUserRegistered && swTerminated === false} 
															show={true} 
															actionName="Harvest" actionIdx={poolInfo.name + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.txHash + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
													</div>
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">Staked</h4>
													<h3 className="pool__stat-value">{(userStakedData.userStaked === 0 ? userStakedData.userStaked : Number(userStakedData.userStaked).toLocaleString("en-US") + " " + poolInfo.staking_UI) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions">
														<ActionWithMessageModalBtn action={userWithdrawAction} swHash={true} 
															description={'<li className="info">Do you want to get back your deposit?</li> \
															<li className="info">Please, make sure you have taken care of any outstanding rewards before withdrawing your deposit.</li>\
															<li className="info">You can\'t claim them after withdrawing.</li>'}
															eUTxOs_Selected={[userStakedData.eUTxO_With_UserDatum!]} poolInfo={poolInfo} 
															enabled={walletStore.connected && isPoolDataLoaded && swUserRegistered} 
															show={true} 
															actionName="Withdraw" 
															actionIdx={poolInfo.name + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.txHash + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex} 
															messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} 
														/>
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
							<div style={{textAlign: 'left', width:"100%"}}><h4 >Actions for you</h4></div>
						</div>
						<div className="pool__stat">
							{
								staking_AC_isWithoutTokenName?
									<>
										<ActionWithSelectInputModalBtn 
											action={userDepositAction} swHash={true} 
											poolInfo={poolInfo} 
											walletAssets={walletStakingAssets}
											inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmount} 
											enabled={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded && swFunded === true && swClosed === false} 
											show={poolInfo.swFunded === true && poolInfo.swClosed === false} 
											actionName="Deposit" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} swPaddintTop={false} />
									</>
								:
									<>	
										<ActionWithInputModalBtn 
											action={userDepositAction} swHash={true} 
											poolInfo={poolInfo} 
											showInput={true} inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmount} 
											enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && swClosed === false} 
											show={poolInfo.swFunded === true && poolInfo.swClosed === false} 
											actionName="Deposit" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} swPaddintTop={false} />
									</>
							}
							
							{process.env.NODE_ENV==="development"?
								<ActionWithInputModalBtn action={userDepositBatchAction} swHash={false} 
									poolInfo={poolInfo} showInput={true} inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmount} 
									enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && swClosed === false} 
									show={poolInfo.swFunded === true && poolInfo.swClosed === false} 
									actionName="Deposit Batch" 
									actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									callback={handleCallback} 
									cancel={handleCancel}
									/>
							:
								<></>
							}
						</div>
						<div className="pool__stat">
						
							<ActionWithMessageModalBtn action={splitUTxOsAction} 
									description={'<li className="info">It is generally a good practice to split your wallet\'s UTXOs (unspent transaction outputs) into smaller amounts.</li> \
									<li className="info">Having smaller UTXOs with only ADA amounts can make it easier to use them as collateral for smart contracts.</li>'}
									swHash={true}
									enabled={walletStore.connected && isPoolDataLoaded}
									show={true }
									actionName="Split Wallet UTxOs" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} 
									swPaddintTop={false}
									/>
						
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}



