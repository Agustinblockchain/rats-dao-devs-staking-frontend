//--------------------------------------
import { Assets } from "lucid-cardano";
import { useEffect, useState } from "react";
import { getAvailaibleFunds_In_EUTxO_With_FundDatum, getFundAmount_In_EUTxO_With_FundDatum } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO } from "../types";
import { maxTokensWithDifferentNames } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { toJson } from "../utils/utils";
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import ActionWithMessageModalBtn from './ActionWithMessageModalBtn';
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function FundsModalBtn(

	{ actionName, enabled, show, actionIdx,
		masterNewFundAction, masterNewFundsBatchAction, masterFundAndMergeAction, masterMergeFundsAction, masterSplitFundAction, masterDeleteFundsAction, masterDeleteFundsBatchAction,
		poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, callback , cancel, swPaddintTop}:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			masterNewFundAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			masterNewFundsBatchAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			masterFundAndMergeAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			masterMergeFundsAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			masterSplitFundAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			masterDeleteFundsAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			masterDeleteFundsBatchAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			poolInfo: StakingPoolDBInterface, 
			statePoolData: ReturnType<typeof useStatePoolData>,
			messageFromParent?: string | "", hashFromParent?: string | "", isWorkingFromParent?: string | "", 
			callback?: (isWorking: string) => Promise<any>
			cancel?: () => Promise<any>,
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
		isPoolDataLoaded, 
		swPreparado, swIniciado, swFunded,
		swClosed, closedAt, swTerminated, terminatedAt,
		eUTxOs_With_FundDatum, 
		totalFundsAvailable, totalFundAmount,
		totalStaked, totalRewardsPaid, totalRewardsToPay,
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
		setEUTxOs_FundDatum_Selected([])

	}, [walletStore, isWalletDataLoaded])

	useEffect(() => {
		setEUTxOs_FundDatum_Selected([])
	}, [isPoolDataLoaded])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("FundsModalBtn - useEffect1 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - messageFromParent: " + messageFromParent + " - message: " + message)
		// }
		if (messageFromParent && messageFromParent !== "" && isWorkingFromParent === actionNameWithIdx) {
			setActionMessage(messageFromParent)
		} else {
			setActionMessage("")
		}
	}, [messageFromParent])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("FundsModalBtn - useEffect2 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - hashFromParent: " + hashFromParent + " - hash: " + hash)
		// }
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

	const handleCallback = async (isWorking: string) => {
		console.log("FundsModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		// alert ("FundsModalBtn - callbak in:" + isWorking)
		setIsWorking(isWorking)
		callback ? await callback(actionNameWithIdx) : null
		return isWorking
		// setActionHash("")
		// setIsWorkingStakingPool(isWorking)
	}
	const handleCancel = async () => {
		console.log("FundsModalBtn - " + poolInfo.name + " - handleCancel")
		cancel ? await cancel() : null
	}

	return (
		<div className="modal__action_separator">
			
			{show?
				<>
					
					{swPaddintTop === true || swPaddintTop === undefined? <div><br></br></div> : null}
					{enabled && (isWorkingFromParent === actionNameWithIdx || isWorkingFromParent === "") ?
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
												<td style={{fontSize:8}}>{eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}</td>
												<td>{eUTxO.isPreparing.val !== undefined || eUTxO.isConsuming.val !== undefined? "No":"Yes"}</td>
												<td>{Number(getFundAmount_In_EUTxO_With_FundDatum(eUTxO)).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
												<td>{Number(eUTxO.datum.fdCashedOut).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
												<td>{Number(getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxO)).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
											</tr>
									)}
									<tr >
										<td>{eUTxOs_With_FundDatum.length}</td>
										<td></td>
										<td>Total</td>
										<td>{Number(totalFundAmount).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
										<td>{Number(totalRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
										<td>{Number(totalFundsAvailable).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
									</tr>
								</tbody>
							</table>
						</div>
							
						<div className="modal__content_btns">
							<ActionWithInputModalBtn action={masterNewFundAction} swHash={true} poolInfo={poolInfo} 
								showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
								enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true} 
								show={isPoolDataLoaded === true && swPreparado === true && swTerminated === false}
								actionName="New Fund" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							
							<ActionWithInputModalBtn 
									action={masterNewFundsBatchAction} swHash={false} poolInfo={poolInfo} 
									showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true} 
									show={isPoolDataLoaded === true && swPreparado === true && swTerminated === false}
									actionName="New Funds Batch" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									callback={handleCallback} 
									cancel={handleCancel}
									/>
							
							<ActionWithInputModalBtn action={masterFundAndMergeAction} swHash={true} eUTxOs_Selected={eUTxOs_FundDatum_Selected} poolInfo={poolInfo} 
								showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && swTerminated === false && eUTxOs_FundDatum_Selected.length > 0} 
								show={isPoolDataLoaded === true && swPreparado === true && swFunded === true && swTerminated === false}
								actionName="Fund And Merge" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							
							<ActionWithInputModalBtn action={masterMergeFundsAction} swHash={true} eUTxOs_Selected={eUTxOs_FundDatum_Selected} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && eUTxOs_FundDatum_Selected.length > 1} 
								show={isPoolDataLoaded === true && swPreparado === true && swFunded === true}
								actionName="Merge Funds" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							
							<ActionWithInputModalBtn action={masterSplitFundAction} swHash={true} eUTxOs_Selected={eUTxOs_FundDatum_Selected} poolInfo={poolInfo} 
								showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && eUTxOs_FundDatum_Selected.length == 1} 
								show={isPoolDataLoaded === true && swPreparado === true && swFunded === true && swTerminated === false}
								actionName="Split Fund" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
						
							<ActionWithInputModalBtn action={masterDeleteFundsAction} swHash={true} eUTxOs_Selected={eUTxOs_FundDatum_Selected} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && eUTxOs_FundDatum_Selected.length > 0 && swTerminated === true} 
								show={isPoolDataLoaded === true && swPreparado === true && swFunded === true && swTerminated === true}
								actionName="Delete Funds" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							
							<ActionWithInputModalBtn 
								action={masterDeleteFundsBatchAction} swHash={false} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && swTerminated === true} actionName="Delete Funds Batch" actionIdx={poolInfo.name + "-FundsModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								show={isPoolDataLoaded === true && swPreparado === true && swFunded === true && swTerminated === true}
								callback={handleCallback} 
								cancel={handleCancel}
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





