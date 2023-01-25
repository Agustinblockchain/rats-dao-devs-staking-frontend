//--------------------------------------
import { Assets } from 'lucid-cardano';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { splitUTxOs } from "../stakePool/endPoints - splitUTxOs";
import { userDeposit, userHarvest, userWithdraw } from '../stakePool/endPoints - user';
import { explainErrorTx } from "../stakePool/explainError";
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

		statusUI, 
		tx_countUI,
		swClosedUI,
		beginAtUI,
		closedAtUI, 
		graceTimeUI,
		swTerminatedUI, 
		terminatedAtUI,

		countEUTxOs_With_DatumUI,
		countEUTxOs_With_UserDatumUI,

		// staking_Decimals,
        // harvest_Decimals,
		interestUI,

		totalFundsAvailableUI,

		totalStakedUI, 
		totalRewardsPaidUI, 
		totalRewardsToPayUI,

		userStaked,
		userStakedUI, 
		userRewardsPaidUI, 
		userRewardsToPayUI,

		isPoolDataLoading, 
		isPoolDataLoaded,

		userStakedDatas, 
		swUserRegistered,
		
		refreshPoolData,
		refreshEUTxOs,
		
		refreshUserStakedData
	
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

					<div>Status <b>{statusUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></div>
					<br></br>

					<p><>Earn <b>{interestUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b> a year for every <b>{poolInfo.staking_UI}</b>!</></p>
					<br></br>
					
					<div>
						User Token
						(<b>{txID_User_Deposit_For_User_TN}</b>) &nbsp;
						{/* {" (" + poolInfo.txID_User_Deposit_CS.slice(0,4)+"..."+poolInfo.txID_User_Deposit_CS.slice(52)+")"} */}
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
								
								<p><><b>From</b> {beginAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} 
								{/* {((!poolInfo.swIniciado) ? <>(It hasn't started yet)</>:<></>)} */}
								</></p>

								{poolInfo.closedAt?
									<p><><b>To</b> {closedAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} 
									{/* {((poolInfo.swClosed) ? <>(It's already Closed)</>:<></>)} */}
									</></p>
									:
									<>
										<p><><b>To</b> {closedAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} 
										{/* {((poolInfo.swClosed) ? <>(It's already Closed)</>:<></>)} */}
										</></p>
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
					
					<div className="pool__action_smallcard"  >
						<div className="pool__stat">
							<div style={{textAlign: 'left', width:"100%"}}>
								
								<div>
									You can Stake {(walletStakingAmountUI === ui_loading || walletStakingAmountUI === ui_notConnected) ? 
										walletStakingAmountUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' /> 
									: 
										<b>
											{formatAmount(Number(walletStakingAmountUI), poolInfo.staking_Decimals, poolInfo.staking_UI)}
										</b> 
									}
								</div>
								
								
								{userStaked > 0n?
									<>
										<br></br>
										<p>Already staked <b>{userStakedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
										<p>Already harvested <b>{userRewardsPaidUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
										<p>Rewards to Claim <b>{userRewardsToPayUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
									</>
								:
								<>
									{ isPoolDataLoading ?
										<>
											<br></br>
											<Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />
										</>
									:
										<></>
									}
								</>
								}
							</div>
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
											description={poolInfo.swClosed ? 
												'<p className="info">This Pool in already closed. You can\'t Deposit anymore.</p>' 
												: 

												

												staking_AC_isAda? 
													'<li className="info">You are about to Deposit <b>' + poolInfo.staking_UI + '</b> to this Pool.</li>\
													<li className="info">In return, you will receive User Token (<b>' + txID_User_Deposit_For_User_TN + '</b>).</li>\
													<li className="info">You can withdraw your <b>' + poolInfo.staking_UI + '</b> at any time in exchange for the User Token (<b>' + txID_User_Deposit_For_User_TN + '</b>).</li>' 
												: 
													'<li className="info">You are about to deposit <b>' + poolInfo.staking_UI + '</b> to this Pool.</li>\
													<li className="info">In return, you will receive User Token (<b>' + txID_User_Deposit_For_User_TN + '</b>).</li>\
													<li className="info">You can withdraw your <b>' + poolInfo.staking_UI + '</b> at any time in exchange for the User Token (<b>' + txID_User_Deposit_For_User_TN + '</b>).</li>\
													<li className="info">Please note that, in addition to the Transactions Fees, a minimum of ADA is required to be sent along with your <b>' + poolInfo.staking_UI + '</b>.</li>\
													<li className="info">You will receive the ADA back when you withdraw your deposit.</li>'
												}
											poolInfo={poolInfo} 
											swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded} 
											swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded && !poolInfo.swClosed} 
											swShow={poolInfo.swFunded} 
											swHash={true} 
											inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmountUI} inputDecimals={poolInfo.staking_Decimals} 
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
											description={poolInfo.swClosed ? 
												'<p className="info">This Pool in already closed. You can\'t Deposit anymore.</p>' 
												: 
													staking_AC_isAda? 
														'<li className="info">You are about to Deposit <b>' + poolInfo.staking_UI + '</b> to this Pool.</li>\
														<li className="info">In return, you will receive User Token (<b>' + txID_User_Deposit_For_User_TN + '</b>).</li>\
														<li className="info">You can withdraw your <b>' + poolInfo.staking_UI + '</b> at any time in exchange for the User Token (<b>' + txID_User_Deposit_For_User_TN + '</b>).</li>' 
													: 
														'<li className="info">You are about to deposit <b>' + poolInfo.staking_UI + '</b> to this Pool.</li>\
														<li className="info">In return, you will receive User Token (<b>' + txID_User_Deposit_For_User_TN + '</b>).</li>\
														<li className="info">You can withdraw your <b>' + poolInfo.staking_UI + '</b> at any time in exchange for the User Token (<b>' + txID_User_Deposit_For_User_TN + '</b>).</li>\
														<li className="info">Please note that, in addition to the Transactions Fees, a minimum of ADA is required to be sent along with your <b>' + poolInfo.staking_UI + '</b>.</li>\
														<li className="info">You will receive the ADA back when you withdraw your deposit.</li>'
												}
											poolInfo={poolInfo} 
											swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded} 
											swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded && !poolInfo.swClosed} 
											swShow={poolInfo.swFunded} 
											swShowInput={true} inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmountUI} inputDecimals={poolInfo.staking_Decimals}  
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
									swShowInput={true} inputUnitForLucid={poolInfo.staking_Lucid} inputUnitForShowing={poolInfo.staking_UI} inputMax={maxStakingAmountUI} inputDecimals={poolInfo.staking_Decimals} 
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
								description={'<p className="info" style="text-align: center;">It is recommended to Split your Wallet\'s UTxOs (Unspent Transaction Outputs) into smaller amounts. This will make it easier to use them as collateral for Smart Contracts and will provide more flexibility in managing your funds.</p>'}
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
								swShow={true }
								swHash={true}
								swPaddintTop={false}
							/>
						</div>
					</div>

					<div className="pool__flex_break" ><br></br></div>
					
					{userStakedDatas.map(
						userStakedData =>
							<div key={`${userStakedData.eUTxO_With_UserDatum!.uTxO.txHash}-${userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex}`} >
								
								<div className="pool__action_card "  >
								
									<div className="pool__stat">
										<br></br>
										<div style={{textAlign: 'left', width:"100%"}}><b>Date</b> {userStakedData.createdAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
										{userStakedData.lastClaimAtUI !== "..." ?
											<>
												<div style={{textAlign: 'left', width:"100%"}}><b>Last Claim</b> {userStakedData.lastClaimAtUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
												
											</>
											:
											<></>
										}
										<br></br>
										{userStakedData.minADA > 0n? 
											<>
												<div style={{textAlign: 'left', width:"100%"}}>ADA locked <b>{userStakedData.minADAUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></div>
											</>
											:
											<></>
										}
										
										<div style={{textAlign: 'left', width:"100%"}}>Harvested <b>{userStakedData.rewardsPaidUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></div>
									</div>
									<div className="pool__flex_gap"></div>
									<div className="pool__stat">
										<div>
											<h4 className="pool__stat-title">
												Rewards&nbsp;
												<button onClick={() => { if (walletStore.connected) { refreshUserStakedData (userStakedData) } }} className='btn__ghost icon' style={walletStore.connected ? { cursor: 'pointer' } : { cursor: 'default' }} >
													<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
														<path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
														<path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z" />
													</svg>
												</button>
											</h4>
											<h3 className="pool__stat-value">{userStakedData.rewardsToPayUI || <Skeleton baseColor='#e2a7a7' />}</h3>
											<div className="pool__stat-actions">
												<ActionWithInputModalBtn 
													action={userHarvestAction} 
													postActionSuccess={updateDetailsStakingPoolAndWallet}
													postActionError={updateDetailsStakingPoolAndWallet}
													setIsWorking={handleSetIsWorking} 
													actionName="Harvest" actionIdx={poolInfo.name + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.txHash + "-" + userStakedData.eUTxO_With_UserDatum!.uTxO.outputIndex} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
													description={poolInfo.swTerminated ? '<p className="info">This Pool in already terminated. You can\'t Harvest anymore.</p>' : undefined}
													poolInfo={poolInfo} 
													swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && swUserRegistered && !userStakedData.isLoading} 
													swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && swUserRegistered && !userStakedData.isLoading && !poolInfo.swTerminated} 
													swShow={true} 
													swShowInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={userStakedData.rewardsToPay.toString()} inputDecimals={poolInfo.harvest_Decimals} 
													swHash={true} 
													eUTxOs_Selected={[userStakedData.eUTxO_With_UserDatum!]} 
												/>
											</div>
										</div>
									</div>
									<div className="pool__flex_gap"></div>
									<div className="pool__stat">
										<div>
											<h4 className="pool__stat-title">Staked</h4>
											<h3 className="pool__stat-value">{userStakedData.stakedAmountUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</h3>
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
													<li className="info">You can\'t claim them after withdrawing.</li>\
													<li className="info">You will recover all the ADA used to Deposit your Tokens.</li>'}
													swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && swUserRegistered && !userStakedData.isLoading} 
													swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && swUserRegistered && !userStakedData.isLoading} 
													swShow={true} 
													swHash={true} 
													eUTxOs_Selected={[userStakedData.eUTxO_With_UserDatum!]} poolInfo={poolInfo} 

												/>
											</div>
										</div>
									</div>
									
								</div>

								<div className="pool__flex_break" ><br></br></div>
								
							</div>
					)}

					<div className="pool__action_smallcard"  >
						<div className="pool__stat">
							<div style={{textAlign: 'left', width:"100%"}}>
								<h4 >Totals</h4>
								<br></br> 
								<p>Total Staked <b>{totalStakedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
								<p>Total Claimed <b>{totalRewardsPaidUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</b></p>
							</div>
						</div>
						<div className="pool__stat">
							<div style={{textAlign: 'left', width:"100%"}}>
								<h4 ></h4>
								<br></br> <br></br> 
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



