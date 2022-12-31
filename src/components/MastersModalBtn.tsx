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
import { EUTxO, Master, Master_Funder } from "../types";
import { maxTokensWithDifferentNames, poolDatum_ClaimedFund } from "../types/constantes";
import {
    getFundAmount_In_EUTxO_With_FundDatum, getAvailaibleFunds_In_EUTxO_With_FundDatum, getRewardsToPay_In_EUTxO_With_UserDatum, getTotalCashedOut,
    getTotalFundAmount, getTotalAvailaibleFunds, getTotalRewardsToPay_In_EUTxOs_With_UserDatum, getTotalStakedAmount, getStakedAmount_In_EUTxO_With_UserDatum,
    getTotalUserActive, getTotalUserRegistered, getFundAmountsRemains_ForMaster
} from "../stakePool/helpersStakePool";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function MasterModalBtn(

	{ actionName, enabled, show, actionIdx, masterSendBackFundAction, masterGetBackFundAction, poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, callback }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			masterGetBackFundAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined) => Promise<any>,
			masterSendBackFundAction: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined, master_Selected?: Master | undefined) => Promise<any>,
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

	const [masterFunders_Selected, setMasterFunders_Selected] = useState<Master_Funder[]>([])

	const [walletHarvestAmount, setWalletHarvestAmount] = useState<string | 0>(ui_notConnected)
	const [maxHarvestAmount, setMaxHarvestAmount] = useState<string | 0>(ui_notConnected)

	const { isPoolDataLoaded, 

        swPreparado, swIniciado, swFunded,
		swClosed, closedAt, swTerminated, terminatedAt, swZeroFunds, swPoolReadyForDelete,

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
        masterFunders,
		totalFundsAvailable, totalFundAmount, totalFundAmountsRemains_ForMaster,
		totalStaked, totalRewardsPaid, totalRewardsToPay, totalMastersMinAda,
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
		setMasterFunders_Selected([])

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
															<input type="checkbox" key={index}
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
							<ActionModalBtn action={masterGetBackFundAction} swHash={true} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swTerminated === true && swZeroFunds === true} 
								show={swPreparado === true && swTerminated === true  }
								actionName="Get Back Fund" actionIdx={poolInfo.name} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							<ActionModalBtn action={masterSendBackFundAction} swHash={true} master_Selected={masterFunders_Selected.length>0?masterFunders_Selected[0].mfMaster:undefined }  poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded &&  masterFunders_Selected.length == 1 && swTerminated === true && swZeroFunds === true} 
								show={swPreparado === true && swTerminated === true }
								actionName="Send Back Fund" actionIdx={poolInfo.name + "-MasterModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
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





