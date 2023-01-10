//--------------------------------------
import { useEffect, useState } from "react";
import { apiGetEUTxOsDBByStakingPool } from "../stakePool/apis";
import { getDatumType } from "../stakePool/helpersDatumsAndRedeemers";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO } from "../types";
import { txConsumingTime, txPreparingTime } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { useStoreState } from '../utils/walletProvider';
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function EUTxOsModalBtn(

	{ actionName, enabled, show, actionIdx, poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, setIsWorkingParent, swPaddintTop }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			poolInfo: StakingPoolDBInterface, 
			statePoolData: ReturnType<typeof useStatePoolData>,
			messageFromParent?: string | "", hashFromParent?: string | "", isWorkingFromParent?: string | "", 
			setIsWorkingParent?: (isWorking: string) => Promise<any>,
			swPaddintTop?: Boolean 
		}) {

	//string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
	const ui_loading = 0
	const ui_notConnected = '...'

	const actionNameWithIdx = actionName + "-" + actionIdx

	const [isWorking, setIsWorking] = useState("")
	const [actionMessage, setActionMessage] = useState("")
	const [actionHash, setActionHash] = useState("")

	const now = new Date().getTime()

	const { isPoolDataLoaded, isPoolDataLoading, refreshEUTxOs, eUTxOs_With_Datum } = statePoolData

	const [eUTxOs_With_Datum_DB, setEUTxOs_With_Datum_DB] = useState<EUTxO[]>([])

    const [isLoading, setIsLoading] = useState(false)

	async function loadEUTxOs (){

		setIsLoading (true)

		const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!);

		setEUTxOs_With_Datum_DB(eUTxOs_With_Datum.sort((a : EUTxO, b : EUTxO) => {
			if (a.datum.plutusDataIndex < b.datum.plutusDataIndex) return -1
			if (a.datum.plutusDataIndex > b.datum.plutusDataIndex) return 1
			return 0
		}))

		setIsLoading (false)

	}

	useEffect(() => {
		// console.log("EUTxOsModalBtn - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)
		if (isPoolDataLoaded) {
			setEUTxOs_With_Datum_DB(eUTxOs_With_Datum)
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
						<h3>List of UTxOs in DB</h3>
						{
							<div className="tableContainerFunds" style={{ maxHeight: 300 }}>
								<table>
									<thead>
										<tr>
											<th></th>
											<th>Tx Hash # Index</th>
											<th>Datum</th>
											<th>IsPreparing</th>
											<th>Deleting?</th>
											<th>IsConsuming</th>
											<th>Deleting?</th>
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
													<td>{getDatumType(eUTxO.datum)}</td>
													<td>{eUTxO.isPreparing.val !== undefined? "yes" : "no"}</td>
													<td>{eUTxO.isPreparing.val !== undefined && eUTxO.isPreparing.val < (now - txPreparingTime)? "yes" : "no"}</td>
													<td>{eUTxO.isConsuming.val !== undefined? "yes" : "no"}</td>
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

						<div className="modal__content_btns">
							<div className="modal__action_separator">
								<br></br>
								<button className="btn btnStakingPool"
									onClick={(e) => {
											e.preventDefault()
											loadEUTxOs()
										}
									}
									disabled={isPoolDataLoading || isLoading}
								>
									Refresh
									{isPoolDataLoading || isLoading ?
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





