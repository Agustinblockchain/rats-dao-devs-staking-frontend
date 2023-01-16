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
import { copyToClipboard, formatAmount, toJson } from '../utils/utils';
import { useStoreActions, useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
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

	const [walletStakingAmountUI, setWalletStakingAmountUI] = useState<string | 0>(ui_notConnected)
	const [walletHarvestAmountUI, setWalletHarvestAmountUI] = useState<string | 0>(ui_notConnected)
	const [maxStakingAmountUI, setMaxStakingAmountUI] = useState<string | 0>(ui_notConnected)
	const [maxHarvestAmountUI, setMaxHarvestAmountUI] = useState<string | 0>(ui_notConnected)

	const [walletStakingAssets, setWalletStakingAssets] = useState<Assets>({})
	
	const statePoolData = useStatePoolData(stakingPoolInfo)
	const { 
		poolInfo,

		swClosedUI,

		beginAtUI,
		closedAtUI, 
		graceTimeUI,
		swTerminatedUI, 
		terminatedAtUI,

		countEUTxOs_With_DatumUI,
		countEUTxOs_With_UserDatumUI,

		staking_Decimals,
        harvest_Decimals,
		interestUI,

		totalFundsAvailableUI,

		totalStakedUI, 
		totalRewardsPaidUI, 
		totalRewardsToPayUI,

		isPoolDataLoading, 
		isPoolDataLoaded,

		userStakedDatas, 
		swUserRegistered,
		
		refreshPoolData,
		refreshEUTxOs
	
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
			setWalletStakingAmountUI(ui_loading)
			setWalletHarvestAmountUI(ui_loading)
			setMaxStakingAmountUI(ui_loading)
			setMaxHarvestAmountUI(ui_loading)
			setWalletStakingAssets({})
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
			setWalletStakingAmountUI(ui_notConnected)
			setWalletHarvestAmountUI(ui_notConnected)
			setMaxStakingAmountUI(ui_notConnected)
			setMaxHarvestAmountUI(ui_notConnected)
			setWalletStakingAssets({})
		}
	}, [walletStore, isWalletDataLoaded])

	//--------------------------------------

	const handleSetIsWorking = async (isWorking: string) => {
		console.log("StakingPool - " + poolInfo.name + " - handleSetIsWorking isWorking: ", isWorking)
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
		const poolInfo = await refreshPoolData()
		return poolInfo	
	}

	const updateDetailsStakingPoolAndWallet = async () => {
		const poolInfo = await updateDetailsStakingPool()
		if (walletStore.connected) await loadWalletData(walletStore)
		return poolInfo	
	}

	//--------------------------------------

	const userDepositAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction ("StakingPool - Deposit Pool", walletStore, poolInfo, userDeposit, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets) 
	}

	const userHarvestAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => {
		return await newTransaction ("StakingPool - Harvest Pool", walletStore, poolInfo, userHarvest, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets) 
	}

	const userWithdrawAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => {
		return await newTransaction ("StakingPool - Withdraw Pool", walletStore, poolInfo, userWithdraw, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets) 
	}

	//--------------------------------------

	const userDepositBatchAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		console.log("StakingPool - Deposit Batch - " + toJson(poolInfo?.name))
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
				setActionMessage("Deposit " + i + " of "+ 50 + ", please wait..."+ (isCancelling.current ? " (Canceling when this Tx finishes)" : ""))
				const txHash = await userDepositAction(poolInfo_updated, eUTxOs_Selected, assets);
				pushSucessNotification("Deposit " + i + " of "+ 50, txHash, true);
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
			return "Deposit Batch executed"
		} catch (error: any) {
			setIsWorkingInABuffer(false)
			setIsWorking("")
			setIsCanceling(false)
			throw error
		}
	}

	//--------------------------------------
	
	const splitUTxOsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction ("StakingPool - Split Wallet UTxOs", walletStore, poolInfo, splitUTxOs, isWorkingInABuffer.current, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets) 
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
								<button onClick={() => { if (true) { updateDetailsStakingPoolAndWallet() } }} className='btn__ghost icon' style={true ? { cursor: 'pointer' } : { cursor: 'default' }} >
									
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

					{process.env.NODE_ENV==="development"?
						<>
							<div>Pool Closed:  {swClosedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<div>Pool Terminated: {swTerminatedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
							<br></br>
							
							<div>EUTxOs At Contract: {countEUTxOs_With_DatumUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
							<br></br>
									
						</>
						:
						<></>
				}
					
					<p><>Open: {beginAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} {((!poolInfo.swIniciado) ? <>(It hasn't started yet)</>:<></>)}</></p>
					
					{poolInfo.closedAt?
						<p><>Forzed Deadline: {closedAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} {((poolInfo.swClosed) ? <>(It's already Closed)</>:<></>)}</></p>
						:
						<>
							<p><>Deadline: {closedAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} {((poolInfo.swClosed) ? <>(It's already Closed)</>:<></>)}</></p>
						</>
					}

					<p><>Grace Time: {graceTimeUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
					
					{(poolInfo.swTerminated) ?
						<p><>Claim Rewards until: It's already Terminated</></p>
						:
						<p><>Claim Rewards until: {terminatedAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
					}

					<p><>Anual Rewards per each {poolInfo.staking_UI}: {interestUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</></p>
					<br></br>

					<div>
						Staking Unit In Wallet: {(walletStakingAmountUI === ui_loading || walletStakingAmountUI === ui_notConnected ? walletStakingAmountUI : formatAmount(Number(walletStakingAmountUI), staking_Decimals, poolInfo.staking_UI)) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}
					</div>
					<div>
						Harvest Unit In Wallet: {(walletHarvestAmountUI === ui_loading || walletHarvestAmountUI === ui_notConnected ? walletHarvestAmountUI : formatAmount(Number(walletHarvestAmountUI), harvest_Decimals, poolInfo.harvest_UI)) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}
					</div>
					<br></br>

					<p>Active Users: {countEUTxOs_With_UserDatumUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
					<p>Total Staked: {totalStakedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
					<p>Rewards Harvested: {totalRewardsPaidUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
					<p>Rewards to Pay: {totalRewardsToPayUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
					<p>Availaible Funds: {totalFundsAvailableUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</p>
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
													<div style={{textAlign: 'left', width:"100%"}}>Rewards Harvested: {(userStakedData.userRewardsPaid === 0 ? userStakedData.userRewardsPaid : formatAmount(Number(userStakedData.userRewardsPaid), harvest_Decimals, poolInfo.harvest_UI)) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">
													Rewards
													</h4>
													<h3 className="pool__stat-value">{(userStakedData.userRewardsToPay === 0 ? userStakedData.userRewardsToPay : formatAmount(Number(userStakedData.userRewardsToPay), harvest_Decimals, poolInfo.harvest_UI)) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions" style={{width: 200}}>
													</div>
													
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">Staked</h4>
													<h3 className="pool__stat-value">{(userStakedData.userStaked === 0 ? userStakedData.userStaked : formatAmount(Number(userStakedData.userStaked), staking_Decimals, poolInfo.staking_UI)) || <Skeleton baseColor='#e2a7a7' />}</h3>
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
													<div style={{textAlign: 'left', width:"100%"}}>Rewards Harvested: {(userStakedData.userRewardsPaid === 0 ? userStakedData.userRewardsPaid : formatAmount(Number(userStakedData.userRewardsPaid), harvest_Decimals, poolInfo.harvest_UI)) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
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
													<h3 className="pool__stat-value">{(userStakedData.userRewardsToPay === 0 ? userStakedData.userRewardsToPay : formatAmount(Number(userStakedData.userRewardsToPay), harvest_Decimals, poolInfo.harvest_UI)) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions">
														<ActionWithInputModalBtn 
															action={userHarvestAction} 
															postActionSuccess={updateDetailsStakingPoolAndWallet}
															postActionError={updateDetailsStakingPoolAndWallet}
															setIsWorking={handleSetIsWorking} 
															actionName="Harvest" actionIdx={poolInfo.name + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.txHash + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
															description={poolInfo.swTerminated ? '<p className="info">This Pool in already terminated. You can\'t Harvest anymore.</p>' : undefined}
															poolInfo={poolInfo} 
															swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && swUserRegistered} 
															swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && swUserRegistered && !poolInfo.swTerminated} 
															swShow={true} 
															swShowInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={userStakedData.userRewardsToPay} inputDecimals={harvest_Decimals} 
															swHash={true} 
															eUTxOs_Selected={[userStakedData.eUTxO_With_UserDatum!]} 
														/>
													</div>
												</div>
												<div className="pool__flex_gap"></div>
												<div className="pool__stat">
													<h4 className="pool__stat-title">Staked</h4>
													<h3 className="pool__stat-value">{(userStakedData.userStaked === 0 ? userStakedData.userStaked : formatAmount(Number(userStakedData.userStaked), staking_Decimals, poolInfo.staking_UI)) || <Skeleton baseColor='#e2a7a7' />}</h3>
													<div className="pool__stat-actions">
														<ActionWithInputModalBtn 
															action={userWithdrawAction} 
															postActionSuccess={updateDetailsStakingPoolAndWallet}
															postActionError={updateDetailsStakingPoolAndWallet}
															setIsWorking={handleSetIsWorking} 
															actionName="Withdraw" actionIdx={poolInfo.name + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.txHash + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex} 
															messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
															description={'<li className="info">Do you want to withdraw your Deposit?</li> \
															<li className="info">Please, make sure you have taken care of any outstanding Rewards before withdrawing your Deposit.</li>\
															<li className="info">You can\'t claim them after withdrawing.</li>'}
															swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && swUserRegistered} 
															swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && swUserRegistered} 
															swShow={true} 
															swHash={true} 
															eUTxOs_Selected={[userStakedData.eUTxO_With_UserDatum!]} poolInfo={poolInfo} 

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
											action={userDepositAction} 
											postActionSuccess={updateDetailsStakingPoolAndWallet}
											postActionError={updateDetailsStakingPoolAndWallet}
											setIsWorking={handleSetIsWorking} 
											actionName="Deposit" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
											description={poolInfo.swClosed ? '<p className="info">This Pool in already closed. You can\'t Deposit anymore.</p>' : undefined}
											poolInfo={poolInfo} 
											swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded } 
											swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded && !poolInfo.swClosed} 
											swShow={poolInfo.swFunded} 
											swHash={true} 
											inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmountUI} inputDecimals={staking_Decimals} 
											walletAssets={walletStakingAssets}
											swPaddintTop={false} 
										/>
									</>
								:
									<>	
										<ActionWithInputModalBtn 
											action={userDepositAction} 
											postActionSuccess={updateDetailsStakingPoolAndWallet}
											postActionError={updateDetailsStakingPoolAndWallet}
											setIsWorking={handleSetIsWorking} 
											actionName="Deposit" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
											description={poolInfo.swClosed ? '<p className="info">This Pool in already closed. You can\'t Deposit anymore.</p>' : undefined}
											poolInfo={poolInfo} 
											swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded } 
											swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded && !poolInfo.swClosed} 
											swShow={poolInfo.swFunded} 
											swShowInput={true} inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmountUI} inputDecimals={staking_Decimals}  
											swHash={true} 
											swPaddintTop={false} 
										/>
									</>
							}
							
							{process.env.NODE_ENV==="development"?
								<ActionWithInputModalBtn 
									action={userDepositBatchAction} 
									postActionSuccess={updateDetailsStakingPoolAndWallet}
									postActionError={updateDetailsStakingPoolAndWallet}
									setIsWorking={handleSetIsWorking} 
									cancel={handleCancel}
									actionName="Deposit Batch" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									description={poolInfo.swClosed ? '<p className="info">This Pool in already closed. You can\'t Deposit anymore.</p>' : '<p className="info">Create multiple Transactions for new Deposits in one go, rather than manually entering each Transaction individually. However, you will still need to individually sign each Transaction.</p>'}
									poolInfo={poolInfo} 
									swShowInput={true} inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmountUI} inputDecimals={staking_Decimals} 
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded } 
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded && !poolInfo.swClosed} 
									swShow={poolInfo.swFunded} 
									swHash={false} 
								/>
							:
								<></>
							}
						</div>
						<div className="pool__stat">
						
							<ActionWithInputModalBtn 
								action={splitUTxOsAction} 
								postActionSuccess={updateDetailsStakingPoolAndWallet}
								postActionError={updateDetailsStakingPoolAndWallet}
								setIsWorking={handleSetIsWorking} 
								actionName="Split Wallet UTxOs" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<p className="info">It is recommended to Split your Wallet\'s UTxOs (Unspent Transaction Outputs) into smaller amounts. This will make it easier to use them as collateral for Smart Contracts and will provide more flexibility in managing your funds.</p>'}
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
								swShow={true }
								swHash={true}
								swPaddintTop={false}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}



