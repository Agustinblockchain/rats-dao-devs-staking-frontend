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

	{ actionName, enabled, show, actionIdx, 
		masterSendBackDepositAction, 
		postAction,
		poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, setIsWorkingParent, swPaddintTop }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			masterSendBackDepositAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			postAction?: () => Promise<any>,
			setIsWorkingParent?: (isWorking: string) => Promise<any>,
			poolInfo: StakingPoolDBInterface, 
			statePoolData: ReturnType<typeof useStatePoolData>,
			messageFromParent?: string | "", hashFromParent?: string | "", isWorkingFromParent?: string | "", 
			swPaddintTop?: Boolean 
		}) {

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
		if (isPoolDataLoaded){
			var eUTxOs_UserDatum_Selected_ : EUTxO [] = [] 
			eUTxOs_UserDatum_Selected.forEach(eUTxO => {
				if (eUTxOs_With_UserDatum.some(eUTxO_UserDatum => eUTxO_UserDatum.uTxO.txHash === eUTxO.uTxO.txHash && eUTxO_UserDatum.uTxO.outputIndex === eUTxO.uTxO.outputIndex)){
					eUTxOs_UserDatum_Selected_.push(eUTxO)
				}
			})
			setEUTxOs_UserDatum_Selected(eUTxOs_UserDatum_Selected_)
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
		console.log("UsersModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		setIsWorking(isWorking)
		setIsWorkingParent ? await setIsWorkingParent(actionNameWithIdx) : null
		return isWorking
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

						<div className="modal__content_btns">
							<ActionWithInputModalBtn 
								action={masterSendBackDepositAction} 
								postAction={postAction}
								swHash={true} eUTxOs_Selected={eUTxOs_UserDatum_Selected} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true && swTerminated === true && eUTxOs_UserDatum_Selected.length == 1 } 
								show={true}
								actionName="Send Back Deposit" actionIdx={poolInfo.name + "-UserModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								setIsWorking={handleSetIsWorking} 
							/>
							
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





