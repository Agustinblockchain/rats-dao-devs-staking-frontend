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

export default function FundsModalBtn(

	{ actionName, enabled, show, actionIdx,
		masterNewFundAction, masterNewFundsBatchAction, masterFundAndMergeAction, masterMergeFundsAction, masterSplitFundAction, masterDeleteFundsAction, masterDeleteFundsBatchAction,
		poolInfo, statePoolData, messageFromParent, hashFromParent, isWorkingFromParent, callback , cancel}:
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
			cancel?: () => Promise<any>
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

		totalFundsAvailable, totalFundAmount,

		totalStaked, totalRewardsPaid, totalRewardsToPay,

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
		setEUTxOs_FundDatum_Selected([])

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
	const handleCancel = async () => {
		console.log("FundsModalBtn - " + poolInfo.name + " - handleCancel")
		cancel ? await cancel() : null
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
						<h3>List of UTxOs With Funds</h3>
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
															<input type="checkbox" key={eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}
																onChange={(e) => {
																	//console.log(e.target.checked)
																	if (e.target.checked) {
																		setEUTxOs_FundDatum_Selected(eUTxOs_FundDatum_Selected.concat(eUTxO))
																	} else {
																		setEUTxOs_FundDatum_Selected(eUTxOs_FundDatum_Selected.filter(eUTxO_FundDatum => eUTxO_FundDatum.uTxO.txHash !== eUTxO.uTxO.txHash || eUTxO_FundDatum.uTxO.outputIndex !== eUTxO.uTxO.outputIndex))
																	}
																}}
															/>
														</td>
														<td>{eUTxO.uTxO.txHash + "#" + eUTxO.uTxO.outputIndex}</td>
														<td>{Number(getFundAmount_In_EUTxO_With_FundDatum(eUTxO)).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
														<td>{Number(eUTxO.datum.fdCashedOut).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
														<td>{Number(getAvailaibleFunds_In_EUTxO_With_FundDatum(eUTxO)).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
													</tr>
											)}
											<tr >
												<td>{eUTxOs_With_FundDatum.length}</td>
												<td>Total</td>
												<td>{Number(totalFundAmount).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
												<td>{Number(totalRewardsPaid).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
												<td>{Number(totalFundsAvailable).toLocaleString("en-US") + " " + poolInfo.harvest_UI}</td>
											</tr>
										</tbody>
									</table>
								</div>
						}

						{/* {toJson(eUTxOs_FundDatum_Selected)} */}

						<div className="modal__content_btns">
							<ActionModalBtn action={masterNewFundAction} swHash={true} poolInfo={poolInfo} 
								showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
								enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true} 
								show={swPreparado === true}
								actionName="New Fund" actionIdx={poolInfo.name + "-FundModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							<ActionModalBtn 
									action={masterNewFundsBatchAction} swHash={false} poolInfo={poolInfo} 
									showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
									enabled={walletStore.connected && isPoolDataLoaded && swPreparado === true} 
									show={swPreparado === true}
									actionName="New Funds Batch" actionIdx={poolInfo.name + "-FundModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
									callback={handleCallback} 
									cancel={handleCancel}
									/>
							<ActionModalBtn action={masterFundAndMergeAction} swHash={true} eUTxOs_Selected={eUTxOs_FundDatum_Selected} poolInfo={poolInfo} 
								showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && eUTxOs_FundDatum_Selected.length > 0} 
								show={swPreparado === true}
								actionName="Fund And Merge" actionIdx={poolInfo.name + "-FundModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							<ActionModalBtn action={masterMergeFundsAction} swHash={true} eUTxOs_Selected={eUTxOs_FundDatum_Selected} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && eUTxOs_FundDatum_Selected.length > 0} 
								show={swPreparado === true}
								actionName="Merge Funds" actionIdx={poolInfo.name + "-FundModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							<ActionModalBtn action={masterSplitFundAction} swHash={true} eUTxOs_Selected={eUTxOs_FundDatum_Selected} poolInfo={poolInfo} 
								showInput={true} inputUnitForLucid={poolInfo.harvest_Lucid} inputUnitForShowing={poolInfo.harvest_UI} inputMax={maxHarvestAmount} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && eUTxOs_FundDatum_Selected.length == 1} 
								show={swPreparado === true}
								actionName="Split Fund" actionIdx={poolInfo.name + "-FundModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							<ActionModalBtn action={masterDeleteFundsAction} swHash={true} eUTxOs_Selected={eUTxOs_FundDatum_Selected} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true && eUTxOs_FundDatum_Selected.length > 0} 
								show={swPreparado === true}
								actionName="Delete Funds" actionIdx={poolInfo.name + "-FundModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} callback={handleCallback} />
							<ActionModalBtn 
								action={masterDeleteFundsBatchAction} swHash={false} poolInfo={poolInfo} 
								enabled={walletStore.connected && isPoolDataLoaded && swFunded === true} actionName="Delete Funds Batch" actionIdx={poolInfo.name + "-FundModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								show={swPreparado === true}
								callback={handleCallback} 
								cancel={handleCancel}
								/>
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




