//--------------------------------------
import { Assets } from "lucid-cardano";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { getAvailaibleFunds_In_EUTxO_With_FundDatum, getFundAmount_In_EUTxO_With_FundDatum } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO, FundDatum } from "../types";
import { maxTokensWithDifferentNames } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { formatHash } from "../utils/cardano-helpers";
import { copyToClipboard, formatAmount, toJson } from "../utils/utils";
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function FundsModalBtn(

	{ 	actionName, 
		actionIdx,
		masterNewFundAction, 
		masterNewFundsBatchAction, 
		masterFundAndMergeAction, 
		masterMergeFundsAction, 
		masterSplitFundAction, 
		masterDeleteFundsAction, 
		masterDeleteFundsBatchAction,
		postActionSuccess,
		postActionError,
		setIsWorkingParent, 
		cancel, 
		poolInfo_, 
		statePoolData, 
		swEnabledBtnOpenModal, 
		swShow, 
		messageFromParent, 
		hashFromParent, 
		isWorkingFromParent, 
		swPaddintTop}:
		{
			actionName: string, 
			actionIdx: string,
			masterNewFundAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			masterNewFundsBatchAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			masterFundAndMergeAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			masterMergeFundsAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			masterSplitFundAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			masterDeleteFundsAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			masterDeleteFundsBatchAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			postActionSuccess?: () => Promise<any>,
			postActionError?: () => Promise<any>,
			setIsWorkingParent?: (isWorking: string) => Promise<any>
			cancel?: () => Promise<any>,
			poolInfo_: StakingPoolDBInterface, 
			statePoolData: ReturnType<typeof useStatePoolData>,
			swEnabledBtnOpenModal: boolean, 
			swShow: boolean, 
			messageFromParent?: string, 
			hashFromParent?: string, 
			isWorkingFromParent?: string, 
			swPaddintTop?: Boolean 
		}) {

	//string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
	const ui_loading = 0
	const ui_notConnected = '...'

	const actionNameWithIdx = actionName + "-" + actionIdx

	const walletStore = useStoreState(state => state.wallet)

	const { isWalletDataLoaded, getTotalOfUnit } = useStoreState(state => {
		return { isWalletDataLoaded: state.isWalletDataLoaded, getTotalOfUnit: state.walletGetTotalOfUnit };
	});

	const [isWorking, setIsWorking] = useState("")

	const [actionMessage, setActionMessage] = useState("")
	const [actionHash, setActionHash] = useState("")

	const [eUTxOs_FundDatum_Selected, setEUTxOs_FundDatum_Selected] = useState<EUTxO[]>([])

	const [walletHarvestAmount, setWalletHarvestAmount] = useState<string | 0>(ui_notConnected)
	const [maxHarvestAmount, setMaxHarvestAmount] = useState<string | 0>(ui_notConnected)

	const { 
		poolInfo,
		isPoolDataLoaded, 
		eUTxOs_With_FundDatum, 
		// poolInfo.staking_Decimals,
        // poolInfo.harvest_Decimals,
		totalFundsAvailableUI: totalFundsAvailableUI,
		totalFundAmountUI: totalFundAmountUI,
		totalRewardsPaidUI: totalRewardsPaidUI,
		isPoolDataLoading,
		refreshPoolData } = statePoolData

	useEffect(() => {
		// console.log("FundsModalBtn - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

		if (walletStore.connected && !isWalletDataLoaded) {
			setWalletHarvestAmount(ui_loading)
			setMaxHarvestAmount(ui_loading)
		} else if (walletStore.connected && isWalletDataLoaded) {
			//------------------
			const walletHarvestAmount = getTotalOfUnit(poolInfo.harvest_Lucid)
			//------------------
			const harvest_CS = poolInfo.harvest_Lucid.slice(0, 56)
			const harvest_TN = poolInfo.harvest_Lucid.slice(56)
			const harvest_AC_isAda = (harvest_CS === 'lovelace')
			const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
			//------------------
			setWalletHarvestAmount(walletHarvestAmount.toString())
			//------------------
			if (walletHarvestAmount > maxTokensWithDifferentNames && harvest_AC_isWithoutTokenName) {
				setMaxHarvestAmount(maxTokensWithDifferentNames.toString())
			} else {
				setMaxHarvestAmount(walletHarvestAmount.toString())
			}
		} else {
			setWalletHarvestAmount(ui_notConnected)
			setMaxHarvestAmount(ui_notConnected)
		}

	}, [walletStore, isWalletDataLoaded])

	useEffect(() => {
		if (isPoolDataLoaded){
			var eUTxOs_FundDatum_Selected_ : EUTxO [] = [] 
			eUTxOs_FundDatum_Selected.forEach(eUTxO => {
				if (eUTxOs_With_FundDatum.some(eUTxO_FundDatum => eUTxO_FundDatum.uTxO.txHash === eUTxO.uTxO.txHash && eUTxO_FundDatum.uTxO.outputIndex === eUTxO.uTxO.outputIndex)){
					eUTxOs_FundDatum_Selected_.push(eUTxO)
				}
			})
			setEUTxOs_FundDatum_Selected(eUTxOs_FundDatum_Selected_)
		}
	}, [isPoolDataLoaded])

	useEffect(() => {
		if (messageFromParent && messageFromParent !== "" && isWorkingFromParent === actionNameWithIdx) {
			setActionMessage(messageFromParent)
		} else {
			setActionMessage("")
		}
	}, [messageFromParent])

	useEffect(() => {
		if (hashFromParent && hashFromParent !== "" && isWorkingFromParent === actionNameWithIdx) {
			setActionHash(hashFromParent)
		} else {
			setActionHash("")
		}

	}, [hashFromParent])

	useEffect(() => {
		if (isWorkingFromParent === "") {
			setIsWorking("")
		}
	}, [isWorkingFromParent])

	const handleSetIsWorking = async (isWorking: string) => {
		console.log("FundsModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		setIsWorking(isWorking)
		setIsWorkingParent ? await setIsWorkingParent(actionNameWithIdx) : null
		return isWorking
	}

	const handleCancel = async () => {
		console.log("FundsModalBtn - " + poolInfo.name + " - handleCancel")
		cancel ? await cancel() : null
	}

	return (
		<div className="modal__action_separator">
			
			{swShow?
				<>
					{swPaddintTop === true || swPaddintTop === undefined? <div><br></br></div> : null}
					{/* {swEnabledBtnOpenModal && (isWorkingFromParent === actionNameWithIdx || isWorkingFromParent === "") ? */}
					{(swEnabledBtnOpenModal && isWorkingFromParent === "") || (isWorkingFromParent === actionNameWithIdx) ?
						<label htmlFor={`${actionNameWithIdx}-modal-toggle`} className="btn btnStakingPool">
							{actionName}
							<>
								{
									(isWorkingFromParent === actionNameWithIdx) ?
										<>
											<LoadingSpinner size={25} border={5} />
										</>
										:
										<></>
								}
							</>
						</label>
						:
						<button disabled className="btn btnStakingPool"><span className="wallet__button_disabled">{actionName}</span></button>
					}
				
					
				</>
				:
				<></>
			}
			<input
						className="modal__toggle"
						type="checkbox"
						id={`${actionNameWithIdx}-modal-toggle`}
						onChange={(e) => {
							if (e.target.checked) {
							}
						}}
					/>
			<div id={`${actionNameWithIdx}-modal`} className="modal">
				<label htmlFor={`${actionNameWithIdx}-modal-toggle`} className="modal__shade"></label>
				<div className="modal__content">
					<div className="modal__content_item" >
						<h3>List of UTxOs With Funds</h3>
						
							
						<div className="tableContainerFunds" style={{ maxHeight: 300 }}>
							<table>
								<thead>
									<tr>
										<th></th>
										<th>Tx Hash # Index</th>
										<th>Availaible EUTxO</th>
										<th>Starting Fund Amount</th>
										<th>Rewards Haversted</th>
										<th>Availaible Funds</th>
									</tr>
								</thead>
								<tbody>
									{eUTxOs_With_FundDatum.map(
										eUTxO =>
											<tr key={eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}>
												<td>
													<input type="checkbox" key={eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex} checked={eUTxOs_FundDatum_Selected.some(eUTxO_FundDatum => eUTxO_FundDatum.uTxO.txHash === eUTxO.uTxO.txHash && eUTxO_FundDatum.uTxO.outputIndex === eUTxO.uTxO.outputIndex)}
														onChange={(e) => {
															if (e.target.checked) {
																setEUTxOs_FundDatum_Selected(eUTxOs_FundDatum_Selected.concat(eUTxO))
															} else {
																setEUTxOs_FundDatum_Selected(eUTxOs_FundDatum_Selected.filter(eUTxO_FundDatum => ! (eUTxO_FundDatum.uTxO.txHash == eUTxO.uTxO.txHash && eUTxO_FundDatum.uTxO.outputIndex == eUTxO.uTxO.outputIndex)))
															}
														}}
													/>
												</td>
												<td>
													{formatHash(eUTxO.uTxO.txHash) + "#" + eUTxO.uTxO.outputIndex}		

													<button onClick={() => copyToClipboard(eUTxO.uTxO.txHash!)} className='btn__ghost icon' style={{ cursor: 'pointer' }}>
														<svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
															<path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
														</svg>
													</button>
													<a target={'_blank'} href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL}tx/${eUTxO.uTxO.txHash}`} className='btn__ghost icon' style={{ cursor: 'pointer' }}>
														<svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
															<path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
														</svg>
													</a>	
													
												</td>

												<td>{eUTxO.isPreparing.val !== undefined || eUTxO.isConsuming.val !== undefined? "No":"Yes"}</td>
												<td>{formatAmount(Number(getFundAmount_In_EUTxO_With_FundDatum(eUTxO)), poolInfo.harvest_Decimals, poolInfo.harvest_UI)}</td>
												<td>{formatAmount(Number(eUTxO.datum.fdCashedOut), poolInfo.harvest_Decimals, poolInfo.harvest_UI)}</td>
												<td>{formatAmount(Number(getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxO)), poolInfo.harvest_Decimals, poolInfo.harvest_UI)}</td>
											</tr>
									)}
									<tr >
										<td>{eUTxOs_With_FundDatum.length}</td>
										<td></td>
										<td>Total</td>
										<td>{totalFundAmountUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
										<td>{totalRewardsPaidUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
										<td>{totalFundsAvailableUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
									</tr>
								</tbody>
							</table>
						</div>
							
						<div className="modal__content_btns">
							<ActionWithInputModalBtn 
								action={masterNewFundAction} 
								postActionSuccess={postActionSuccess}
								postActionError={postActionError}  
								setIsWorking={handleSetIsWorking} 
								actionName="New Fund" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<li className="info">To ensure a smooth User experience, it\'s recommended to create multiple Funds instead of using just one. This helps to avoid potential collisions and allows more Users to interact with the contract simultaneously.</li>\
								<li className="info">It\'s recommended to have two Funds with less amount each one rather than one Fund with all the amount together.</li>\
								<li className="info">It\'s important to regularly check the availability of Funds and create additional ones as needed.</li>'}
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded} 
								swShow={poolInfo.swPreparado && !poolInfo.swTerminated}
								swShowInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} inputDecimals={poolInfo.harvest_Decimals}
								swHash={true} 
							/>

							<ActionWithInputModalBtn 
								action={masterNewFundsBatchAction}  
								postActionSuccess={postActionSuccess}
								postActionError={postActionError} 
								setIsWorking={handleSetIsWorking} 
								cancel={handleCancel}
								actionName="New Funds Batch" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<p className="info" style="text-align: center;">Create multiple Transactions for new Funds in one go, rather than manually entering each Transaction individually. However, you will still need to individually sign each Transaction.</p>'}
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded} 
								swShow={poolInfo.swPreparado && !poolInfo.swTerminated}
								swShowInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} inputDecimals={poolInfo.harvest_Decimals}
								swHash={false} 
								
							/>
							
							<ActionWithInputModalBtn 
								action={masterFundAndMergeAction}  
								postActionSuccess={postActionSuccess}
								postActionError={postActionError} 
								setIsWorking={handleSetIsWorking} 
								actionName="Fund And Merge" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<p className="info" style="text-align: center;">Increase the amount in a pre-existing Fund by adding more funds to it</p>'} 
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded && poolInfo.swFunded && eUTxOs_FundDatum_Selected.length > 0} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && isWalletDataLoaded && poolInfo.swFunded && eUTxOs_FundDatum_Selected.length > 0} 
								swShow={poolInfo.swPreparado && !poolInfo.swTerminated}
								swShowInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} inputDecimals={poolInfo.harvest_Decimals} 
								swHash={true} 
								eUTxOs_Selected={eUTxOs_FundDatum_Selected}
							/>
							
							<ActionWithInputModalBtn 
								action={masterMergeFundsAction}  
								postActionSuccess={postActionSuccess}
								postActionError={postActionError} 
								setIsWorking={handleSetIsWorking} 
								actionName="Merge Funds" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<p className="info" style="text-align: center;">Combine two separate Funds into a single and larger Fund</p>'} 
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && poolInfo.swFunded && eUTxOs_FundDatum_Selected.length > 1} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swFunded && eUTxOs_FundDatum_Selected.length > 1} 
								swShow={poolInfo.swPreparado}
								swHash={true} 
								eUTxOs_Selected={eUTxOs_FundDatum_Selected} 
							/>
							
							<ActionWithInputModalBtn 
								action={masterSplitFundAction}  
								postActionSuccess={postActionSuccess}
								postActionError={postActionError} 
								setIsWorking={handleSetIsWorking} 
								actionName="Split Fund" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<p className="info" style="text-align: center;">Divide a single Fund into two separate smalls Funds. Having more Funds with smaller amounts is more efficient than having fewer Funds with larger amounts because more Funds allows for greater User concurrency, making it easier for Users to harvest their Rewards</p>'} 
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && poolInfo.swFunded && eUTxOs_FundDatum_Selected.length == 1} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swFunded && eUTxOs_FundDatum_Selected.length == 1} 
								swShow={poolInfo.swPreparado && !poolInfo.swTerminated}
								swShowInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={eUTxOs_FundDatum_Selected.length == 1 ? getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxOs_FundDatum_Selected[0]).toString() : "0"} inputDecimals={poolInfo.harvest_Decimals}
								swHash={true} 
								eUTxOs_Selected={eUTxOs_FundDatum_Selected} 

							/>
						
							<ActionWithInputModalBtn 
								action={masterDeleteFundsAction} 
								postActionSuccess={postActionSuccess}
								postActionError={postActionError} 
								setIsWorking={handleSetIsWorking} 
								actionName="Delete Funds" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<li className="info">Delete the Fund selected. Any remaining funds in them will be consolidated into a single UTxO.</li>\
								<li className="info">Once all Funds have been deleted, the Masters will be able to claim the remaining funds.</li>'} 
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && poolInfo.swFunded && eUTxOs_FundDatum_Selected.length > 0} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swFunded && eUTxOs_FundDatum_Selected.length > 0 } 
								swShow={poolInfo.swPreparado && poolInfo.swTerminated}
								swHash={true} 
								eUTxOs_Selected={eUTxOs_FundDatum_Selected} 
							/>
							
							<ActionWithInputModalBtn 
								action={masterDeleteFundsBatchAction}  
								postActionSuccess={postActionSuccess}
								postActionError={postActionError} 
								setIsWorking={handleSetIsWorking} 
								cancel={handleCancel}
								actionName="Delete Funds Batch" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<li className="info">This process will generate multiple Transactions that you will need to sign in order to confirm the deletion of the Funds</li>\
								<li className="info">Once all of the Funds have been deleted, the Masters will be able to claim the remaining funds.</li>'} 
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && poolInfo.swFunded} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swFunded} 
								swShow={poolInfo.swPreparado && poolInfo.swTerminated}
								swHash={false} 
							/>							
						</div>

						<div className="modal__content_btns">
							
							<div className="modal__action_separator">
								<br></br>
								<button className="btn btnStakingPool"
									onClick={(e) => {
										e.preventDefault()
										refreshPoolData ()
									}
									}
								disabled={isPoolDataLoading}
								>
								Refresh
								{isPoolDataLoading ?
									<>
										<LoadingSpinner size={25} border={5} />
									</>
								:
									<>
									</>
								}
							</button>
							</div>
							<div className="modal__action_separator">
								<br></br>
								<button className="btn btnStakingPool"
									onClick={(e) => {
										e.preventDefault()
										const checkbox: any = document.getElementById(`${actionNameWithIdx}-modal-toggle`)
										checkbox!.checked = false
									}
									}
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}





