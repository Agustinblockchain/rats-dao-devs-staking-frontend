//--------------------------------------
import { Assets } from "lucid-cardano";
import { useEffect, useState } from "react";
import { getFundAmountsRemains_ForMaster } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO, Master, Master_Funder } from "../types";
import { maxTokensWithDifferentNames, poolDatum_ClaimedFund } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import ActionWithMessageModalBtn from './ActionWithMessageModalBtn';
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function MasterModalBtn(

	{ actionName, enabled, show, actionIdx, masterSendBackFundAction, masterGetBackFundAction, poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, callback, swPaddintTop}:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			masterGetBackFundAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			masterSendBackFundAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined, master_Selected?: Master | undefined) => Promise<any>,
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

	const [masterFunders_Selected, setMasterFunders_Selected] = useState<Master_Funder[]>([])

	const { isPoolDataLoaded, 

        swPreparado, swIniciado, swFunded,
		swClosed, closedAt, swTerminated, terminatedAt, swZeroFunds, swPoolReadyForDelete,

		eUTxOs_With_Datum, countEUTxOs_With_Datum,
		eUTxO_With_PoolDatum,
		eUTxOs_With_FundDatum, 
        masterFunders,
		totalFundsAvailable, totalFundAmount, totalFundAmountsRemains_ForMaster,
		totalStaked, totalRewardsPaid, totalRewardsToPay, totalMastersMinAda,
		isPoolDataLoading, refreshPoolData } = statePoolData

	useEffect(() => {
		// console.log("MastersModalBtn - " + poolInfo.name + " - useEffect - walletStore.connected: " + walletStore.connected + " - isWalletDataLoaded: " + isWalletDataLoaded)
		setMasterFunders_Selected([])

	}, [walletStore, isWalletDataLoaded])

	useEffect(() => {
		setMasterFunders_Selected([])
	}, [isPoolDataLoaded])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("MastersModalBtn - useEffect1 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - messageFromParent: " + messageFromParent + " - message: " + message)
		// }
		if (messageFromParent && messageFromParent !== "" && isWorkingFromParent === actionNameWithIdx) {
			setActionMessage(messageFromParent)
		} else {
			setActionMessage("")
		}
	}, [messageFromParent])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("MastersModalBtn - useEffect2 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - hashFromParent: " + hashFromParent + " - hash: " + hash)
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
		console.log("MastersModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		// alert ("MastersModalBtn - callbak in:" + isWorking)
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
						<h3>List of Masters</h3>
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
												<th>Index</th>
												<th>Master Pkh</th>
												<th>Fund Amount</th>
												<th>Fund Amount To Get Back</th>
												<th>Claimed Funds</th>
												<th>Min ADA</th>
											</tr>
										</thead>
										<tbody>
											{masterFunders.map(
												(masterFunder, index) =>
													<tr key={index}>
														<td>
															<input type="checkbox" key={index} checked={masterFunders_Selected.includes(masterFunder)} 
																onChange={(e) => {
																	//console.log(e.target.checked)
																	if (e.target.checked) {
																		setMasterFunders_Selected(masterFunders_Selected.concat(masterFunder))
																	} else {
																		setMasterFunders_Selected(masterFunders_Selected.filter(mf => mf.mfMaster !== masterFunder.mfMaster ))
																	}
																}}
															/>
														</td>
														<td>{index + 1}</td>
														<td>{masterFunder.mfMaster}</td>
														<td>{Number(masterFunder.mfFundAmount).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
                                                        <td>{(typeof eUTxO_With_PoolDatum == "object" ? Number(getFundAmountsRemains_ForMaster(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum, masterFunder.mfMaster)[0]).toLocaleString("en-US"):0)+ " " + poolInfo.harvest_UI}</td>
														<td>{masterFunder.mfClaimedFund==poolDatum_ClaimedFund?"Claimed":"Not Claimed"}</td>
														<td>{Number(masterFunder.mfMinAda).toLocaleString("en-US") + " ADA (lovelace)" }</td>

													</tr>
											)}
											<tr >
												<td>{masterFunders.length}</td>
												<td>Total</td>
                                                <td></td>
                                                <td>{Number(totalFundAmount).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
                                                <td>{Number(totalFundAmountsRemains_ForMaster).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
                                                <td></td>
                                                <td>{Number(totalMastersMinAda).toLocaleString("en-US") + " ADA (lovelace)" }</td>

											</tr>
										</tbody>
									</table>
								</div>
						}

						{/* {toJson(masterFunders_Selected)} 
                        {masterFunders_Selected.length>0?masterFunders_Selected[0].mfMaster:undefined}
                        {swZeroFunds} */}

						<div className="modal__content_btns">
							
							<ActionWithInputModalBtn action={masterGetBackFundAction} 
								swHash={true} 
								poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true && swTerminated === true && swZeroFunds === true} 
								show={true }
								actionName="Get Back Fund" actionIdx={poolInfo.name + "-MasterModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							
							<ActionWithInputModalBtn action={masterSendBackFundAction} 
								swHash={true} master_Selected={masterFunders_Selected.length>0?masterFunders_Selected[0].mfMaster:undefined }  
								poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded &&  masterFunders_Selected.length == 1 && swPreparado === true && swTerminated === true && swZeroFunds === true} 
								show={true}
								actionName="Send Back Fund" actionIdx={poolInfo.name + "-MasterModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							
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





