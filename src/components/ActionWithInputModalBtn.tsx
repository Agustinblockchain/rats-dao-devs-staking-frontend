//--------------------------------------
import { useEffect, useState } from "react";
import { Assets } from "lucid-cardano";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { copyToClipboard, formatAmount } from '../utils/utils';
import { NumericFormat } from 'react-number-format';
import { explainErrorTx } from "../stakePool/explainError";
import { EUTxO, Master } from "../types";
import { maxTokensWithDifferentNames } from "../types/constantes";
import { pushSucessNotification, pushWarningNotification } from "../utils/pushNotification";
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionStatus = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function ActionWithInputModalBtn(

	{ 
		actionName, 
		actionIdx, 
		description,
		action, 
		postActionSuccess,
		postActionError,
		setIsWorking, 
		cancel,
		poolInfo, 
		swEnabledBtnOpenModal, 
		swEnabledBtnAction, 
		swShow, 
		eUTxOs_Selected, 
		master_Selected, 
		swShowInput, 
		inputUnitForLucid, 
		inputUnitForShowing, 
		inputDecimals,
		inputMax, 
		swHash, 
		messageFromParent, 
		hashFromParent, 
		isWorking, 
		swPaddintTop }:
		{
			actionName: string, 
			actionIdx: string,
			description?: string,
			action: (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[], assets?: Assets, master_Selected?: Master) => Promise<any>,
			postActionSuccess?: () => Promise<any>,
			postActionError?: () => Promise<any>,
			setIsWorking?: (isWorking: string) => Promise<any>,
			cancel?: () => Promise<any>,
			poolInfo?: StakingPoolDBInterface | undefined,
			swEnabledBtnOpenModal: boolean, 
			swEnabledBtnAction: boolean, 
			swShow: boolean, 
			eUTxOs_Selected?: EUTxO[],
			master_Selected?: Master,
			swShowInput?: boolean,
			inputUnitForLucid?: string,
			inputUnitForShowing?: string,
			inputDecimals?: number,
			inputMax?: string | 0,
			swHash?: Boolean,
			messageFromParent?: string,
			hashFromParent?: string,
			isWorking?: string,
			swPaddintTop?: Boolean 
		} 
) {

	//string '0' shows 0 in UI, Number 0 shows loading skeleton for dynamic values
	const ui_loading = 0
	const ui_notConnected = '...'

	const actionNameWithIdx = actionName + "-" + actionIdx

	const [status, setStatus] = useState<ActionStatus>('idle')

	const [title, setTitle] = useState(actionName)
	const [message, setMessage] = useState("")
	const [hash, setHash] = useState("")

	const [tokenAmount, setTokenAmount] = useState<string>("0");
	const [tokenAmountFormatedValue, setTokenAmountFormatedValue] = useState<string>("0");
	const [userMaxTokens, setUserMaxTokens] = useState<string>("0");

	useEffect(() => {
		if (swShowInput && inputMax && inputMax != ui_notConnected) {
			setUserMaxTokens(inputMax!.toString())
		}
	}, [inputMax])

	useEffect(() => {
		if (messageFromParent && messageFromParent !== "" && isWorking === actionNameWithIdx) {
			setMessage(messageFromParent)
		} else {
			setMessage("")
		}
	}, [messageFromParent])

	useEffect(() => {
		if (hashFromParent && hashFromParent !== "" && hashFromParent !== undefined && isWorking === actionNameWithIdx) {
			setHash(hashFromParent)
		} else {
			setHash("")
		}

	}, [hashFromParent])

	const doAction = async (
				action: (
					poolInfo?: StakingPoolDBInterface, 
					eUTxOs_Selected?: EUTxO[], 
					assets?: Assets, 
					master_Selected?: Master
				) => Promise<any>, 
				poolInfo?: StakingPoolDBInterface, 
				eUTxOs_Selected?: EUTxO[], 
				assets?: Assets,
				master_Selected?: Master
			) => {
		try {
			console.log("ActionModalBtn - doAction: " + actionNameWithIdx + " - message: " + message + " - messageFromParent: " + messageFromParent)
			setIsWorking ? await setIsWorking(actionNameWithIdx) : null
			setStatus("loading")
			setTitle(actionName)
			setMessage(messageFromParent !== undefined ? messageFromParent : "")
			setHash("")
			var res
			res = await action(poolInfo, eUTxOs_Selected, assets, master_Selected)
			pushSucessNotification(actionName, res, swHash);
			setStatus('success')
			if (swHash) {
				setTitle(`${actionName} Ok!`)
				setMessage("")
				setHash(`${res}`)
			} else {
				setTitle(`${actionName} Ok!`)
				setMessage(res)
				setHash("")
			}
			setTokenAmount("0")
			setTokenAmountFormatedValue("0")
			if (postActionSuccess)	{
				await postActionSuccess()
			}
		} catch (error: any) {
			const error_explained = explainErrorTx(error)
			console.error("ActionModalBtn - doAction - " + actionName + " - Error: " + error_explained)
			pushWarningNotification(actionName, error_explained);
			setStatus('error')
			setTitle(`${actionName} Error`)
			setMessage(error_explained)
			setHash("")
			setTokenAmount("0")
			setTokenAmountFormatedValue("0")
			if (postActionError)	{
				await postActionError()
			}
		}
	}

	return (
		<div className="modal__action_separator">

			{/* <>
			Title: {title}
			Parent msg: {messageFromParent}
			msg: {message}
			Parent hash: {hashFromParent}
			hash: {hash}
			isWorking: {isWorking}
			</>  */}

			{swShow ?
				<>
					{swPaddintTop === true || swPaddintTop === undefined? <div><br></br></div> : null}
					{(swEnabledBtnOpenModal && isWorking === "") || (isWorking === actionNameWithIdx) ?
						<label htmlFor={`${actionNameWithIdx}-modal-toggle`} className="btn btnStakingPool">
							{actionName}
							<>
								{
									(status === 'loading') ?
										<>
											<LoadingSpinner size={25} border={5} />
										</>
										:
										<></>
								}
							</>
						</label>
						:
						<button disabled className="btn btnStakingPool">
							<span className="wallet__button_disabled">
								{actionName}
								{(status === 'loading') ?
									<>
										<LoadingSpinner size={25} border={5} />
									</>
									:
									<></>
								}
							</span>
						</button>
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
						if (status === 'success' || status === 'error') {
							setStatus('idle')
							setTitle(actionName)
							setMessage("")
							setHash("")
						}
						if (swShowInput) {
							//el modal se abre y muestra inputs
							//no quiero cambiar el status a menos que este en success o error, que ya paso el proceso anterior.
							//en ese caso lo pongo en idle de nuevo
							//si estaba loading, no hago nada, porque el proceso sigue corriendo
						} else {
							//el modal se abre y ejecuta la accion directamente solo si esta en idle, success, o error, o sea, que no este en loading
							if (status === "idle" || status === "success" || status === "error") {
								// if (poolInfo) {
								// 	// if (eUTxOs_Selected !== undefined) {
								// 	doAction(action, poolInfo, eUTxOs_Selected, undefined, master_Selected)
								// 	// } else {
								// 	// 	doAction(action, poolInfo)
								// 	// }
								// } else {
								// 	doAction(action)
								// }
							}
						}
					}
				}}
			/>
			<div id={`${actionNameWithIdx}-modal`} className="modal">
				<label htmlFor={`${actionNameWithIdx}-modal-toggle`} className="modal__shade"></label>
				<div className="modal__content">
					<div className="modal__content_item">

						{/* <>
						Title: {title} <br></br>
						status: {status} <br></br>
						Parent msg: {messageFromParent} <br></br>
						msg: {message} <br></br>
						Parent hash: {hashFromParent} <br></br>
						hash: {hash} <br></br>
						isWorking: {isWorking} <br></br>
						swHash: {swHash? "1" : "0"} <br></br>
						</> */}

						{status !== "idle" ?
							//no esta idle, esta procesando o termino de procesar ok o con error
							<>
								<h3>{title}</h3>
								{message !== "" ? <div style={{ textAlign:"center", width: "100%", paddingTop: 10 }}>{message}</div> : <></>}
								{(swHash && hash !== "" && hash !== undefined) ?
									<>
										<div>
											TxHash: {hash}
											<br></br>
											<button onClick={() => copyToClipboard(hash!)} className='btn__ghost icon' style={{ cursor: 'pointer' }}>
												<svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
													<path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
											</button>
											<a target={'_blank'} href={`${process.env.NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL}tx/${hash}`} className='btn__ghost icon' style={{ cursor: 'pointer' }}>
												<svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
													<path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
											</a>
										</div>
									</>
									:
									<></>
								}
								<div>
									{status === "loading" ?
										<>
											<br></br>
											<LoadingSpinner size={25} border={5} />
										</>
										:
										<></>
									}
								</div>
							

								<div style={{textAlign:"center", minWidth:320, paddingTop: 25}}>
									{cancel && status === "loading"?
										<button className="btn btnStakingPool"
												onClick={(e) => {
													e.preventDefault()
													cancel()
												}
											}
										>
											Cancel
										</button>
									:
										<></>
									}	

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
							</>
							:
							//esta idle, no esta procesando nada
							<>
								{swShowInput ?
									//el modal muestra input
									<>
										<h3>{title}</h3>
										{description !== "" ?<div style={{ textAlign:"left", width: "100%", paddingTop: 10 }}><div dangerouslySetInnerHTML={{ __html: description! }} /></div> : <></>}
										
										{swEnabledBtnAction && BigInt(userMaxTokens) > 0 ?
											<>
												<h4 style={{ paddingTop: 10 }}>How many {inputUnitForShowing}?</h4>
												<br></br>
												<div>
													<NumericFormat style={{ width: 255, fontSize: 12 }} type="text" value={tokenAmountFormatedValue} 
														onValueChange={(values) => {
																const { formattedValue, value } = values;
																// formattedValue = $2,223
																// floatValue = 2223
																// console.log("onChange NumericFormat f:" +  formattedValue + " - v: " + value)
																if(inputDecimals){
																	const pot = Math.pow(10, inputDecimals)
																	// console.log("onChange NumericFormat - setTokenAmount " + (Number(value) * pot).toString())
																	setTokenAmount((Number(value) * pot).toString())
																}else{
																	// console.log("onChange NumericFormat - setTokenAmount " + (value).toString())
																	setTokenAmount(value)
																}
															}
														}
														thousandsGroupStyle="thousand" thousandSeparator="," decimalSeparator="." decimalScale={inputDecimals}
													/>

													<button style={{ width: 45}} onClick={e => {
																// console.log("max - setTokenAmount " +  userMaxTokens?.toString())
																if(inputDecimals){
																	const pot = Math.pow(10, inputDecimals)
																	// console.log("max - setTokenAmountFormatedValue " + (Number(userMaxTokens?.toString())/pot).toString())
																	setTokenAmountFormatedValue((Number(userMaxTokens?.toString())/pot).toString())
																}else{
																	// console.log("max - setTokenAmountFormatedValue " + Number(userMaxTokens?.toString()).toString())
																	setTokenAmountFormatedValue(Number(userMaxTokens?.toString()).toString())
																}
																setTokenAmount(userMaxTokens?.toString())
															}
														}>MAX</button>
												</div>
														
												{/* 
												//antigua barra:
												<input  style={{ width: 300, fontSize: 12 }}
												type="number"
												placeholder="Amount"
												max={userMaxTokens?.toString()}
												value={tokenAmount}
												onChange={e => setTokenAmount(Number(e.target.value).toString())}
												/> */}

												<input style={{ width: 300, fontSize: 12 }} type="range" min={0} max={userMaxTokens?.toString()} value={tokenAmount}
													onChange={e => {
														if(inputDecimals){
															const pot = Math.pow(10, inputDecimals)
															// console.log("onChange slide setTokenAmountFormatedValue: " +  (Number(e.target.value)/pot).toString())
															setTokenAmountFormatedValue((Number(e.target.value)/pot).toString())
														}else{
															// console.log("onChange slide setTokenAmountFormatedValue: " +  Number(e.target.value).toString())
															setTokenAmountFormatedValue(Number(e.target.value).toString())
														}
														// console.log("onChange slide setTokenAmount: " +  Number(e.target.value).toString())
														setTokenAmount(Number(e.target.value).toString())
													}}
												/>
												

											</>
										:
											<>
												{BigInt(userMaxTokens) == 0n ?<div style={{textAlign:"center", width: "100%", paddingTop: 10 }}>You don't have <b>{inputUnitForShowing}</b> to <b>{actionName}</b></div> : <></>}
											</>
										}

										{message !== "" ?<div style={{ textAlign:"center", width: "100%", paddingTop: 10 }}>{message}</div> : <></>}

										<div style={{textAlign:"center", minWidth:320, paddingTop: 25}}>
											<button
												className="btn btnStakingPool"
												disabled={!swEnabledBtnAction || BigInt(userMaxTokens) == 0n}
												onClick={(e) => {
														e.preventDefault()
														if (tokenAmount === "" || BigInt(tokenAmount) <= 0n) {
															setMessage("Please enter a valid amount greater than zero")
														} else if (BigInt(tokenAmount) > BigInt(userMaxTokens)) {
															const input_CS = inputUnitForLucid!.slice(0, 56)
															const input_TN = inputUnitForLucid!.slice(56)
															const input_AC_isAda = (input_CS === 'lovelace')
															const input_AC_isWithoutTokenName = !input_AC_isAda && input_TN == ""	
															if (input_AC_isWithoutTokenName && BigInt(userMaxTokens) == BigInt(maxTokensWithDifferentNames)){
																setMessage("You have exceeded the maximum amount per transaction for this token which is: " + formatAmount(maxTokensWithDifferentNames, inputDecimals, inputUnitForShowing) )
															}else{
																setMessage("You have exceeded the maximum avalaible tokens which is: " + formatAmount(Number(userMaxTokens), inputDecimals, inputUnitForShowing) )
															}
														} else {
															setMessage("")
															let assets: Assets = { [inputUnitForLucid!]: BigInt(tokenAmount) }
															doAction(action, poolInfo, eUTxOs_Selected, assets, master_Selected)
														}
													}
												}
											>
												{!swEnabledBtnAction || BigInt(userMaxTokens) == 0n?
													<>
														<span className="wallet__button_disabled">
														Accept
														</span>
													</>
													:
													<>
														Accept
													</>
												}
											</button>
											<button className="btn btnStakingPool"
													onClick={(e) => {
														e.preventDefault()
														setMessage("")
														const checkbox: any = document.getElementById(`${actionNameWithIdx}-modal-toggle`)
														checkbox!.checked = false
													}
												}
											>
												Close
											</button>
										</div>
									</>
									:
									//Si esta en idle pero no hay input... 
									<>
										<h3>{title}</h3>
										{description !== "" ?<div style={{ textAlign:"left", width: "100%", paddingTop: 10 }}><div dangerouslySetInnerHTML={{ __html: description! }} /></div> : <></>}
										
										{message !== "" ?<div style={{ textAlign:"center", width: "100%", paddingTop: 10 }}>{message}</div> : <></>}
										
										<div style={{textAlign:"center", minWidth:320, paddingTop: 25}}>
											<button
												className="btn btnStakingPool"
												disabled={!swEnabledBtnAction}
												onClick={(e) => {
														e.preventDefault()
														setMessage("")
														let assets: Assets = { [inputUnitForLucid!]: BigInt(tokenAmount) }
														doAction(action, poolInfo, eUTxOs_Selected, assets, master_Selected)
													}
												}
											>
												{!swEnabledBtnAction?
													<>
														<span className="wallet__button_disabled">
														Accept
														</span>
													</>
													:
													<>
														Accept
													</>
												}
											</button>
												
											<button className="btn btnStakingPool"
												onClick={(e) => {
														e.preventDefault()
														setMessage("")
														const checkbox: any = document.getElementById(`${actionNameWithIdx}-modal-toggle`)
														checkbox!.checked = false
													}
												}
											>
												Cancel
											</button>
										</div>
									</>

								}
							</>
						}
					</div>
				</div>
			</div>
		</div>
	)
}

