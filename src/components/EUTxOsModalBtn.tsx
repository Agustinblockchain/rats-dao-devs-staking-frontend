//--------------------------------------
import { Assets } from "lucid-cardano";
import { useEffect, useState } from "react";
import { apiGetEUTxOsDBByStakingPool } from "../stakePool/apis";
import { getDatumType } from "../stakePool/helpersDatumsAndRedeemers";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO } from "../types";
import { txConsumingTime, txPreparingTime } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { formatHash } from "../utils/cardano-helpers";
import { copyToClipboard } from "../utils/utils";
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from "./ActionWithInputModalBtn";
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function EUTxOsModalBtn(

	{ 	actionName, 
		actionIdx, 
		masterUpdateEUTxODBAction,
		postActionSuccess,
		postActionError,
		setIsWorkingParent, 
		poolInfo_, 
		statePoolData, 
		swEnabledBtnOpenModal, 
		swShow, 
		messageFromParent, 
		hashFromParent, 
		isWorkingFromParent, 
		swPaddintTop }:
		{
			actionName: string, 
			actionIdx: string,
			masterUpdateEUTxODBAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			postActionSuccess?: () => Promise<any>,
			postActionError?: () => Promise<any>,
			setIsWorkingParent?: (isWorking: string) => Promise<any>,
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

	const [isWorking, setIsWorking] = useState("")
	const [actionMessage, setActionMessage] = useState("")
	const [actionHash, setActionHash] = useState("")

	const now = new Date().getTime()

	const { poolInfo, isPoolDataLoaded, isPoolDataLoading, refreshEUTxOs, eUTxOs_With_Datum } = statePoolData

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

	const handleSetIsWorking = async (isWorking: string) => {
		console.log("EUTxOsModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		setIsWorking(isWorking)
		setIsWorkingParent ? await setIsWorkingParent(actionNameWithIdx) : null
		return isWorking
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

							<ActionWithInputModalBtn
									action={masterUpdateEUTxODBAction}
									postActionSuccess={postActionSuccess}
									postActionError={postActionError}
									setIsWorking={handleSetIsWorking}
									actionName="Update EUTxOs in DB" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									description={'<p className="info" style="text-align: center;">Update EUTxOs list in Database</p>'}
									poolInfo={poolInfo}
									swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded}
									swEnabledBtnAction={walletStore.connected && isPoolDataLoaded}
									swShow={poolInfo.swPreparado}
									swHash={false}
								/>
						
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





