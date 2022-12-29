//--------------------------------------
import { useEffect, useState } from "react";
// import UseAnimations from 'react-useanimations';
// import alertTriangle from 'react-useanimations/lib/alertTriangle'
// import loading from 'react-useanimations/lib/loading'
// import success from 'react-useanimations/lib/checkmark'
//--------------------------------------
import { toJson } from '../utils/utils';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel'
import { Assets } from "lucid-cardano";
import Skeleton from "react-loading-skeleton";
import useStatePoolData from '../stakePool/useStatePoolData';
import LoadingSpinner from "./LoadingSpinner";
import ActionModalBtn from "./ActionModalBtn";
import { useStoreActions, useStoreDispatch, useStoreState } from '../utils/walletProvider';
import { EUTxO } from "../types";
import { maxTokensWithDifferentNames } from "../types/constantes";
import {
    getFundAmount_In_EUTxO_With_FundDatum, getAvailaibleFunds_In_EUTxO_With_FundDatum, getRewardsToPay_In_EUTxO_With_UserDatum, getTotalCashedOut,
    getTotalFundAmount, getTotalAvailaibleFunds, getTotalRewardsToPay_In_EUTxOs_With_UserDatum, getTotalStakedAmount, getStakedAmount_In_EUTxO_With_UserDatum,
    getTotalUserActive, getTotalUserRegistered
} from "../stakePool/helpersStakePool";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function UsersModalBtn(

	{ actionName, enabled, show, actionIdx, masterSendBackDepositAction, poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, callback }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			masterSendBackDepositAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
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

	const [eUTxOs_UserDatum_Selected, setEUTxOs_UserDatum_Selected] = useState<EUTxO[]>([])

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
		setEUTxOs_UserDatum_Selected([])

	}, [walletStore, isWalletDataLoaded])

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
		console.log("FundsModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		// alert ("FundsModalBtn - callbak in:" + isWorking)

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
															<input type="checkbox" key={eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}
																onChange={(e) => {
																	//console.log(e.target.checked)
																	if (e.target.checked) {
																		setEUTxOs_UserDatum_Selected(eUTxOs_UserDatum_Selected.concat(eUTxO))
																	} else {
																		setEUTxOs_UserDatum_Selected(eUTxOs_UserDatum_Selected.filter(eUTxO_UserDatum => eUTxO_UserDatum.uTxO.txHash !== eUTxO.uTxO.txHash || eUTxO_UserDatum.uTxO.outputIndex !== eUTxO.uTxO.outputIndex))
																	}
																}}
															/>
														</td>
														<td>{eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}</td>
														<td>{eUTxO.datum.udCreatedAt.toString()}</td>
														<td>{eUTxO.datum.udUser.toString()}</td>
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
							<ActionModalBtn action={masterSendBackDepositAction} swHash={true} eUTxOs_Selected={eUTxOs_UserDatum_Selected} poolInfo={poolInfo} 
							enabled={walletStore.connected && isPoolDataLoaded && eUTxOs_UserDatum_Selected.length == 1} 
							show={swPreparado === true}
							actionName="Send Back Deposit" actionIdx={poolInfo.name + "-UserModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />

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





