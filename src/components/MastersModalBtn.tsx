//--------------------------------------
import { Assets } from "lucid-cardano";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { getFundAmountsRemains_ForMaster } from "../stakePool/helpersStakePool";
import useStatePoolData from '../stakePool/useStatePoolData';
import { EUTxO, Master, Master_Funder } from "../types";
import { ADA_Decimals, ADA_UI, maxTokensWithDifferentNames, poolDatum_ClaimedFund } from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { formatHash } from "../utils/cardano-helpers";
import { formatAmount, toJson } from "../utils/utils";
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionState = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function MasterModalBtn(

	{ 	actionName, 
		actionIdx, 
		masterSendBackFundAction, 
		masterGetBackFundAction, 
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
		swPaddintTop}:
		{
			actionName: string, 
			actionIdx: string,
			masterGetBackFundAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets) => Promise<any>,
			masterSendBackFundAction: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets, master_Selected?: Master) => Promise<any>,
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

	const [masterFunders_Selected, setMasterFunders_Selected] = useState<Master_Funder[]>([])

	const { 
		poolInfo,
		isPoolDataLoaded, 
		eUTxO_With_PoolDatum,
		eUTxOs_With_FundDatum, 
        masterFunders,
		// poolInfo.staking_Decimals,
        // poolInfo.harvest_Decimals,
		totalFundAmountUI,
		totalFundAmountsRemains_ForMasterUI,
		totalMastersMinAdaUI,
		isPoolDataLoading,
		refreshPoolData } = statePoolData

	useEffect(() => {
		if (isPoolDataLoaded){
			var masterFunders_Selected_ : Master_Funder [] = [] 
			masterFunders_Selected.forEach(mf => {
				if (masterFunders.includes(mf)){
					masterFunders_Selected_.push(mf)
				}
			})
			setMasterFunders_Selected(masterFunders_Selected_)
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
		console.log("MastersModalBtn - " + poolInfo.name + " - handleCallback isWorking: ", isWorking)
		setIsWorking(isWorking)
		setIsWorkingParent ? await setIsWorkingParent(actionNameWithIdx) : null
		return isWorking
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
						<h3>List of Masters</h3>
						{
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
											<th>ADA locked</th>
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
													<td>{formatHash(masterFunder.mfMaster)}</td>
													<td>{formatAmount(Number(masterFunder.mfFundAmount), poolInfo.harvest_Decimals, poolInfo.harvest_UI)}</td>
													<td>{formatAmount((typeof eUTxO_With_PoolDatum == "object" ? Number(getFundAmountsRemains_ForMaster(eUTxO_With_PoolDatum, eUTxOs_With_FundDatum, masterFunder.mfMaster)[0]):0), poolInfo.harvest_Decimals, poolInfo.harvest_UI)}</td>
													<td>{masterFunder.mfClaimedFund==poolDatum_ClaimedFund?"Claimed":"Not Claimed"}</td>
													<td>{formatAmount(Number(masterFunder.mfMinAda), ADA_Decimals, ADA_UI) }</td>

												</tr>
										)}
										<tr >
											<td>{masterFunders.length}</td>
											<td>Total</td>
											<td></td>
											<td>{totalFundAmountUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
											<td>{totalFundAmountsRemains_ForMasterUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>
											<td></td>
											<td>{totalMastersMinAdaUI || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</td>

										</tr>
									</tbody>
								</table>
							</div>
						}

						{/* {toJson(masterFunders_Selected)} 
						AAA <br></br>
                        {masterFunders_Selected.length>0?masterFunders_Selected[0].mfMaster:undefined} */}

						<div className="modal__content_btns">
							
							<ActionWithInputModalBtn 
								action={masterGetBackFundAction} 
								postActionSuccess={postActionSuccess}
								postActionError={postActionError}
								setIsWorking={handleSetIsWorking} 
								actionName="Get Back Fund" actionIdx={poolInfo.name + "-MasterModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<li className="info">Retrieve any leftover funds that are rightfully yours.</li>\
								<li className="info">Please note, the Pool must be Terminated and all Funds must be deleted before utilizing this feature.</li>'} 
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swTerminated && poolInfo.swZeroFunds} 
								swShow={poolInfo.swPreparado}
								swHash={true} 
							/>
							
							<ActionWithInputModalBtn 
								action={masterSendBackFundAction} 
								postActionSuccess={postActionSuccess}
								postActionError={postActionError}
								setIsWorking={handleSetIsWorking} 
								actionName="Send Back Fund" actionIdx={poolInfo.name + "-MasterModal"} messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
								description={'<li className="info">Send any leftover funds to the Master selected.</li>\
								<li className="info">Please note, the Pool must be Terminated and all Funds must be deleted before utilizing this feature.</li>'} 
								poolInfo={poolInfo} 
								swEnabledBtnOpenModal={walletStore.connected && isPoolDataLoaded && masterFunders_Selected.length == 1} 
								swEnabledBtnAction={walletStore.connected && isPoolDataLoaded && poolInfo.swTerminated && poolInfo.swZeroFunds && masterFunders_Selected.length == 1} 
								swShow={poolInfo.swPreparado}
								swHash={true} 
								master_Selected={masterFunders_Selected.length>0?masterFunders_Selected[0].mfMaster:undefined }  
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





