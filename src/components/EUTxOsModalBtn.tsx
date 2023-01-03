//--------------------------------------
import { Assets } from "lucid-cardano";
import { useEffect, useState } from "react";
import { getRewardsToPay_In_EUTxO_With_UserDatum } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO } from "../types";
import { maxTokensWithDifferentNames, txConsumingTime, txPreparingTime } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { apiGetEUTxOsDBByAddress } from "../utils/cardano-helpers";
import { useStoreState } from '../utils/walletProvider';
import ActionModalBtn from "./ActionModalBtn";
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function UsersModalBtn(

	{ actionName, enabled, show, actionIdx, poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, callback }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			poolInfo: StakingPoolDBInterface, 
			statePoolData: ReturnType<typeof useStatePoolData>,
			messageFromParent?: string | "", hashFromParent?: string | "", isWorkingFromParent?: string | "", callback?: (isWorking: string) => Promise<any>
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

	const [eUTxOs_With_Datum_DB, setEUTxOs_With_Datum_DB] = useState<EUTxO[]>([])

	const now = new Date().getTime()

	const [walletDepositAmount, setWalletDepositAmount] = useState<string | 0>(ui_notConnected)

	const [walletHarvestAmount, setWalletHarvestAmount] = useState<string | 0>(ui_notConnected)
	const [maxHarvestAmount, setMaxHarvestAmount] = useState<string | 0>(ui_notConnected)

	const { isPoolDataLoaded, 
		swPreparado, swIniciado, swFunded,
		swClosed, closedAt, swTerminated, terminatedAt,
		eUTxOs_With_Datum, countEUTxOs_With_Datum,
		eUTxO_With_PoolDatum,
		eUTxOs_With_FundDatum, countEUTxOs_With_FundDatum,
		eUTxOs_With_UserDatum, countEUTxOs_With_UserDatum,
		eUTxO_With_ScriptDatum,
		eUTxO_With_Script_TxID_Master_Fund_Datum,
		eUTxO_With_Script_TxID_Master_FundAndMerge_Datum,
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
		totalFundsAvailable,
		totalStaked, totalRewardsPaid, totalRewardsToPay, totalUsersMinAda,
		loadPoolData } = statePoolData

	async function loadEUTxOs (){

		const scriptAddress = poolInfo.scriptAddress
		const eUTxOs_With_Datum = await apiGetEUTxOsDBByAddress(scriptAddress);

		setEUTxOs_With_Datum_DB(eUTxOs_With_Datum.sort((a : EUTxO, b : EUTxO) => {
			if (a.datum.plutusDataIndex < b.datum.plutusDataIndex) return -1
			if (a.datum.plutusDataIndex > b.datum.plutusDataIndex) return 1
			return 0
		}))

	}

	useEffect(() => {
		// console.log("EUTxOsModalBtn - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)
		if (isPoolDataLoaded === true) {
			loadEUTxOs ()
		}
	}, [isPoolDataLoaded])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("FundModalBtn - useEffect1 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - messageFromParent: " + messageFromParent + " - message: " + message)
		// }
		if (messageFromParent && messageFromParent !== "" && isWorkingFromParent === actionNameWithIdx) {
			setActionMessage(messageFromParent)
		} else {
			setActionMessage("")
		}
	}, [messageFromParent])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("FundModalBtn - useEffect2 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - hashFromParent: " + hashFromParent + " - hash: " + hash)
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
		console.log("EUTxOsModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		// alert ("EUTxOsModalBtn - callbak in:" + isWorking)

		setIsWorking(isWorking)

		callback ? await callback(actionNameWithIdx) : null

		return isWorking
		// setActionHash("")
		// setIsWorkingStakingPool(isWorking)
	}

	return (
		<div className="modal__action_separator">
			<br></br>
			{show?
				<>
					{enabled && (isWorkingFromParent === actionNameWithIdx || isWorkingFromParent === "") ?
						<label htmlFor={`${actionNameWithIdx}-modal-toggle`} className="btn">
							{actionName}
							<>
								{
									(isWorkingFromParent === actionNameWithIdx) ?
										<>
											{/* <UseAnimations
											strokeColor="currentColor"   //"currentColor"
											size={50}
											animation={ loadingAnimation } //status === "error" ? alertTriangleAnimation : (status === "loading" ? loadingAnimation : checkmarkAnimation)
										/> */}
											<LoadingSpinner size={25} border={5} />
										</>
										:
										<></>
								}
							</>
						</label>
						:
						<button disabled className="btn"><span className="wallet__button_disabled">{actionName}</span></button>
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
				</>
				:
				<></>
			}
			<div id={`${actionNameWithIdx}-modal`} className="modal">
				<label htmlFor={`${actionNameWithIdx}-modal-toggle`} className="modal__shade"></label>
				<div className="modal__content">
					<div className="modal__content_item" >
						<h3>List of UTxOs in DB</h3>
						{
							// (!isPoolDataLoaded) ?
							// 	<>
							// 		<LoadingSpinner size={25} border={5} />
							// 	</>
							// 	:
								<div className="tableContainerFunds" style={{ maxHeight: 300 }}>
									{/* {"Time: " + now.toLocaleString()}
									{" - isPreparing: " + (now - txPreparingTime).toLocaleString()}
									{" - isConsuming: " + (now - txConsumingTime).toLocaleString()} */}
									<table>
										<thead>
											<tr>
												<th></th>
												<th>Tx Hash # Index</th>
												<th>Datum Type</th>
												<th>IsPreparing</th>
												<th>Passed?</th>
												<th>IsConsuming</th>
												<th>Passed?</th>
											</tr>
										</thead>
										<tbody>
											{eUTxOs_With_Datum_DB.map(
												eUTxO =>
													<tr key={eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}>
														<td>
															<input type="checkbox" key={eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}
																onChange={(e) => {
																	
																}}
															/>
														</td>
														<td>{eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}</td>
														<td>{eUTxO.datum.plutusDataIndex.toString()}</td>
														<td>{eUTxO.isPreparing.val?.toLocaleString()}</td>
														<td>{eUTxO.isPreparing.val !== undefined && eUTxO.isPreparing.val < (now - txPreparingTime)? "yes" : "no"}</td>
														<td>{eUTxO.isConsuming.val?.toLocaleString()}</td>
														<td>{eUTxO.isConsuming.val !== undefined && eUTxO.isConsuming.val < (now - txConsumingTime)? "yes" : "no"}</td>
													</tr>
											)}
											<tr >
												<td>{eUTxOs_With_Datum_DB.length}</td>
												<td></td>
												<td></td>
												<td></td>
												<td></td>
												<td></td>
												<td></td>
											</tr>
										</tbody>
									</table>
								</div>
						}
						{/* {toJson(eUTxOs_With_UserDatum)} */}
						<div className="modal__content_btns">
							<div className="modal__action_separator">
								<br></br>
								<button className="btn"
									onClick={(e) => {
										e.preventDefault()
										loadEUTxOs()
										
									}
									}
								>
									Refresh
								</button>
								
							</div>

							<div className="modal__action_separator">
								<br></br>
								<button className="btn"
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





