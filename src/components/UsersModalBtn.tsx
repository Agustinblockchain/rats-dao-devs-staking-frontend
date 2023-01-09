//--------------------------------------
import { Assets } from "lucid-cardano";
import { useEffect, useState } from "react";
import { getRewardsToPay_In_EUTxO_With_UserDatum } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO } from "../types";
import { maxTokensWithDifferentNames } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import ActionWithMessageModalBtn from './ActionWithMessageModalBtn';
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function UsersModalBtn(

	{ actionName, enabled, show, actionIdx, masterSendBackDepositAction, poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, callback, swPaddintTop }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			masterSendBackDepositAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			poolInfo: StakingPoolDBInterface, 
			statePoolData: ReturnType<typeof useStatePoolData>,
			messageFromParent?: string | "", hashFromParent?: string | "", isWorkingFromParent?: string | "", callback?: (isWorking: string) => Promise<any>,
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

	const [eUTxOs_UserDatum_Selected, setEUTxOs_UserDatum_Selected] = useState<EUTxO[]>([])

	const { isPoolDataLoaded, 
		swPreparado, swIniciado, swFunded,
		swClosed, closedAt, swTerminated, terminatedAt,
		eUTxO_With_PoolDatum,
		eUTxOs_With_UserDatum, 
		totalStaked, totalRewardsPaid, totalRewardsToPay, totalUsersMinAda,
		isPoolDataLoading, refreshPoolData } = statePoolData

	useEffect(() => {
		// console.log("UsersModalBtn - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)

		setEUTxOs_UserDatum_Selected([])

	}, [walletStore, isWalletDataLoaded])

	useEffect(() => {
		setEUTxOs_UserDatum_Selected([])
	}, [isPoolDataLoaded])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("UsersModalBtn - useEffect1 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - messageFromParent: " + messageFromParent + " - message: " + message)
		// }
		if (messageFromParent && messageFromParent !== "" && isWorkingFromParent === actionNameWithIdx) {
			setActionMessage(messageFromParent)
		} else {
			setActionMessage("")
		}
	}, [messageFromParent])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("UsersModalBtn - useEffect2 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - hashFromParent: " + hashFromParent + " - hash: " + hash)
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
		console.log("UsersModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		// alert ("UsersModalBtn - callbak in:" + isWorking)

		setIsWorking(isWorking)

		callback ? await callback(actionNameWithIdx) : null

		return isWorking
		// setActionHash("")
		// setIsWorkingStakingPool(isWorking)
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
						<h3>List of UTxOs With Deposits</h3>
						{
							// (!isPoolDataLoaded) ?
							// 	<>
							// 		<LoadingSpinner size={25} border={5} />
							// 	</>
							// 	:
								<div className="tableContainerFunds" style={{ maxHeight: 300 }}>
									<table>
										<thead>
											<tr>
												<th></th>
												<th>Tx Hash # Index</th>
												<th>Created At</th>
												<th>User Pkh</th>
												<th>Invest Amount</th>
												<th>Rewards Harvested</th>
												<th>Rewards Not Claimed</th>
												<th>Last Claim At</th>
												<th>Min ADA</th>
											</tr>
										</thead>
										<tbody>
											{eUTxOs_With_UserDatum.map(
												eUTxO =>
													<tr key={eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}>
														<td>
															<input type="checkbox" key={eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex} checked={eUTxOs_UserDatum_Selected.some(eUTxO_UserDatum => eUTxO_UserDatum.uTxO.txHash === eUTxO.uTxO.txHash && eUTxO_UserDatum.uTxO.outputIndex === eUTxO.uTxO.outputIndex)}
																onChange={(e) => {
																	if (e.target.checked) {
																		setEUTxOs_UserDatum_Selected(eUTxOs_UserDatum_Selected.concat(eUTxO))
																	} else {
																		setEUTxOs_UserDatum_Selected(eUTxOs_UserDatum_Selected.filter(eUTxO_UserDatum => ! ( eUTxO_UserDatum.uTxO.txHash == eUTxO.uTxO.txHash && eUTxO_UserDatum.uTxO.outputIndex == eUTxO.uTxO.outputIndex)))
																	}
																}}
															/>
														</td>
														<td style={{fontSize:8}}>{eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}</td>
														<td>{eUTxO.datum.udCreatedAt.toString()}</td>
														<td style={{fontSize:8}}>{eUTxO.datum.udUser.toString()}</td>
														<td>{Number(eUTxO.datum.udInvest).toLocaleString("en-US") + " " + poolInfo.staking_UI}</td>
														<td>{Number(eUTxO.datum.udCashedOut).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
														<td>{(typeof eUTxO_With_PoolDatum == "object" ? Number(getRewardsToPay_In_EUTxO_With_UserDatum (poolInfo, eUTxO_With_PoolDatum, eUTxO)).toLocaleString("en-US"):0)+ " " + poolInfo.harvest_UI}</td>
														<td>{eUTxO.datum.udLastClaimAt.val==undefined?"":eUTxO.datum.udLastClaimAt.val.toString()}</td>
														<td>{Number(eUTxO.datum.udMinAda).toLocaleString("en-US") + " ADA (lovelace)" }</td>
													</tr>
											)}
											<tr >
												<td>{eUTxOs_With_UserDatum.length}</td>
												<td>Total</td>
												<td></td>
												<td></td>
												<td>{Number(totalStaked).toLocaleString("en-US") + " " + poolInfo.staking_UI}</td>
												<td>{Number(totalRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
												<td>{Number(totalRewardsToPay).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
												<td></td>
												<td>{Number(totalUsersMinAda).toLocaleString("en-US") + " ADA (lovelace)" }</td>
											</tr>
										</tbody>
									</table>
								</div>
						}

						{/* {toJson(eUTxOs_With_UserDatum)} */}
						<div className="modal__content_btns">
							<ActionWithInputModalBtn action={masterSendBackDepositAction} swHash={true} eUTxOs_Selected={eUTxOs_UserDatum_Selected} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true && swTerminated === true && eUTxOs_UserDatum_Selected.length == 1 } 
								show={true}
								actionName="Send Back Deposit" actionIdx={poolInfo.name + "-UserModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
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





