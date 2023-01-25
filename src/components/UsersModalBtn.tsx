//--------------------------------------
import { Assets } from "lucid-cardano";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { getRewardsToPay_In_EUTxO_With_UserDatum } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO } from "../types";
import { ADA_Decimals, ADA_UI, maxTokensWithDifferentNames } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { formatHash } from "../utils/cardano-helpers";
import { copyToClipboard, formatAmount } from "../utils/utils";
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function UsersModalBtn(

	{ 	actionName, 
		actionIdx, 
		masterSendBackDepositAction, 
		postActionSuccess,
		postActionError,
		poolInfo_, 
		statePoolData, 
		swEnabledBtnOpenModal, 
		swShow, 
		messageFromParent, 
		hashFromParent, 
		isWorkingFromParent, 
		setIsWorkingParent, 
		swPaddintTop }:
		{
			actionName: string, 
			actionIdx: string,
			masterSendBackDepositAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
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

	const actionNameWithIdx = actionName + "-" + actionIdx

	const walletStore = useStoreState(state => state.wallet)

	const [isWorking, setIsWorking] = useState("")
	const [actionMessage, setActionMessage] = useState("")
	const [actionHash, setActionHash] = useState("")

	const [eUTxOs_UserDatum_Selected, setEUTxOs_UserDatum_Selected] = useState<EUTxO[]>([])

	const { 
		poolInfo,
		isPoolDataLoaded, 
		eUTxO_With_PoolDatum,
		eUTxOs_With_UserDatum, 
		// poolInfo.staking_Decimals,
        // poolInfo.harvest_Decimals,
		totalStakedUI,
		totalRewardsPaidUI,
		totalRewardsToPayUI,
		totalUsersMinAdaUI,
		isPoolDataLoading,
		refreshPoolData } = statePoolData

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

	async function downloadCVS(){
		let csvContent = "data:text/csv;charset=utf-8," + "Tx Hash,User Pkh,Invest Amount (" + poolInfo.staking_UI + "),Rewards Harvested (" + poolInfo.harvest_UI + "),Rewards Not Claimed (" + poolInfo.harvest_UI + "),ADA locked\n" +  eUTxOs_With_UserDatum.map(
			e => (
				e.uTxO.txHash + "," + 
				e.datum.udUser.toString() + "," + 
				Number(e.datum.udInvest).toString() + "," + 
				Number(e.datum.udCashedOut).toString() + "," + 
				Number((typeof eUTxO_With_PoolDatum == "object" ? Number(getRewardsToPay_In_EUTxO_With_UserDatum (poolInfo, eUTxO_With_PoolDatum, e)):0)).toString() + "," + 
				Number(e.datum.udMinAda).toString()  
			)
		).join("\n");

		var encodedUri = encodeURI(csvContent);
		window.open(encodedUri);
	}


	



	return (
		<div className="modal__action_separator">
			{swShow?
				<>
					{swPaddintTop === true || swPaddintTop === undefined? <div><br></br></div> : null}
					{(swEnabledBtnOpenModal && isWorkingFromParent === "") || (isWorkingFromParent === actionNameWithIdx) ?
					// {swEnabledBtnOpenModal && (isWorkingFromParent === actionNameWithIdx || isWorkingFromParent === "") ?
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
											<th>ADA locked</th>
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
													<td>{new Date(parseInt(eUTxO.datum.udCreatedAt.toString())).toLocaleString("en-US")}</td>
													<td>{formatHash(eUTxO.datum.udUser.toString())}</td>
													<td>{formatAmount(Number(eUTxO.datum.udInvest), poolInfo.staking_Decimals, poolInfo.staking_UI)}</td>
													<td>{formatAmount(Number(eUTxO.datum.udCashedOut), poolInfo.harvest_Decimals, poolInfo.harvest_UI)}</td>
													<td>{formatAmount((typeof eUTxO_With_PoolDatum == "object" ? Number(getRewardsToPay_In_EUTxO_With_UserDatum (poolInfo, eUTxO_With_PoolDatum, eUTxO)):0), poolInfo.harvest_Decimals, poolInfo.harvest_UI)}</td>
													<td>{eUTxO.datum.udLastClaimAt.val==undefined?"":new Date(parseInt(eUTxO.datum.udLastClaimAt.val.toString())).toLocaleString("en-US")}</td>
													<td>{formatAmount(Number(eUTxO.datum.udMinAda), ADA_Decimals, ADA_UI) }</td>
												</tr>
										)}
										<tr >
											<td>{eUTxOs_With_UserDatum.length}</td>
											<td>Total</td>
											<td></td>
											<td></td>
											<td>{totalStakedUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
											<td>{totalRewardsPaidUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
											<td>{totalRewardsToPayUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
											<td></td>
											<td>{totalUsersMinAdaUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
										</tr>
									</tbody>
								</table>
							</div>
						}

						<div className="modal__content_btns">

							<ActionWithInputModalBtn 
								action={masterSendBackDepositAction} 
								postActionSuccess={postActionSuccess}
								postActionError={postActionError}
								setIsWorking={handleSetIsWorking} 
								actionName="Send Back Deposit" actionIdx={poolInfo.name + "-UserModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<li className="info">Return the Deposit to the chosen User</li>\
								<li className="info">Please note, the Pool must be terminated before utilizing this feature</li>'}
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && eUTxOs_UserDatum_Selected.length == 1} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swTerminated && eUTxOs_UserDatum_Selected.length == 1 } 
								swShow={poolInfo.swPreparado}
								swHash={true} 
								eUTxOs_Selected={eUTxOs_UserDatum_Selected} 
							/>

							<div className="modal__action_separator">
								<br></br>
								<button className="btn btnStakingPool"
									 onClick={downloadCVS}
								>
									Donwload CVS
								</button>
							</div>

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





