//--------------------------------------
import { useContext, useEffect, useState } from "react";


//--------------------------------------
import { copyToClipboard, toJson } from '../utils/utils';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel'
import { Assets } from "lucid-cardano";
import Skeleton from "react-loading-skeleton";

import { NumericFormat } from 'react-number-format';
// import UseAnimations from 'react-useanimations';

// import loadingAnimation from 'react-useanimations/lib/loading'
// import checkmarkAnimation  from 'react-useanimations/lib/checkmark'
// import alertTriangleAnimation from 'react-useanimations/lib/alertTriangle'

import LoadingSpinner from "./LoadingSpinner";
import { EUTxO, Master } from "../types";
import { pushSucessNotification, pushWarningNotification } from "../utils/pushNotification";
import { maxTokensWithDifferentNames } from "../types/constantes";
import { explainError } from "../stakePool/explainError";
//--------------------------------------


type ActionStatus = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function ActionModalBtn(


	{ actionName, enabled, show, actionIdx, action, poolInfo, eUTxOs_Selected, master_Selected, showInput, inputUnitForLucid, inputUnitForShowing, inputMax, swHash, messageFromParent, hashFromParent, isWorking, callback, cancel }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			action: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined, master_Selected?: Master | undefined) => Promise<any>,
			poolInfo?: StakingPoolDBInterface | undefined,
			eUTxOs_Selected?: EUTxO[] | undefined,
			master_Selected?: Master | undefined,
			showInput?: boolean | false,
			inputUnitForLucid?: string | "lovelace",
			inputUnitForShowing?: string | "ADA (lovelace)",
			inputMax?: 0 | string,
			swHash?: Boolean,
			messageFromParent?: string | "",
			hashFromParent?: string | "",
			isWorking?: string | "",
			callback?: (isWorking: string) => Promise<any>,
			cancel?: () => Promise<any>
		}
) {


	const actionNameWithIdx = actionName + "-" + actionIdx


	// const { isWorking, setIsWorking} = useContext(IsWorkingContext);	

	const [status, setStatus] = useState<ActionStatus>('idle')

	const [title, setTitle] = useState(actionName)
	const [message, setMessage] = useState("")
	// messageFromParent && messageFromParent !== "" && isWorking === actionNameWithIdx
	const [hash, setHash] = useState("")
	// hashFromParent && hashFromParent !== "" && isWorking === actionNameWithIdx

	// if (isWorking === actionNameWithIdx){
	// 	console.log ("ActionModalBtn - init - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - messageFromParent: " + messageFromParent + " - message: " + message)
	// 	console.log ("ActionModalBtn - init - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - hashFromParent: " + hashFromParent + " - hash: " + hash)
	// } 

	const [tokenAmount, setTokenAmount] = useState<string>("0");
	const [tokenAmountFormatedValue, setTokenAmountFormatedValue] = useState<string>("0");
	const [userMaxTokens, setUserMaxTokens] = useState<string>("0");

	useEffect(() => {
		if (showInput && inputMax) {
			setUserMaxTokens(inputMax!.toString())
		}
	}, [inputMax])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("ActionModalBtn - useEffect1 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - messageFromParent: " + messageFromParent + " - message: " + message)
		// }
		if (messageFromParent && messageFromParent !== "" && isWorking === actionNameWithIdx) {
			setMessage(messageFromParent)
		} else {
			setMessage("")
		}
	}, [messageFromParent])

	useEffect(() => {
		// if (isWorking === actionNameWithIdx){
		// 	console.log ("ActionModalBtn - useEffect2 - " +(isWorking === actionNameWithIdx ? "YO":"OTRO")+ " - hashFromParent: " + hashFromParent + " - hash: " + hash)
		// }
		if (hashFromParent && hashFromParent !== "" && hashFromParent !== undefined && isWorking === actionNameWithIdx) {
			setHash(hashFromParent)
		} else {
			setHash("")
		}

	}, [hashFromParent])

	const doAction = async (
				action: (
					poolInfo?: StakingPoolDBInterface | undefined, 
					eUTxOs_Selected?: EUTxO[] | undefined, 
					assets?: Assets | undefined, 
					master_Selected?: Master | undefined
				) => Promise<any>, 
				poolInfo?: StakingPoolDBInterface | undefined, 
				eUTxOs_Selected?: EUTxO[] | undefined, 
				assets?: Assets | undefined,
				master_Selected?: Master | undefined
			) => {
		try {
			console.log("ActionModalBtn - doAction: " + actionNameWithIdx + " - message: " + message + " - messageFromParent: " + messageFromParent)

			//alert ("callback:" + isWorking)
			callback ? await callback(actionNameWithIdx) : null
			// setIsWorking(actionNameWithIdx)

			setStatus("loading")

			setTitle(actionName)
			// setTitle("Procesando "+ actionName + " ...")
			setMessage(messageFromParent !== undefined ? messageFromParent : "")
			setHash("")

			var res

			//alert ("action:" + isWorking)
			res = await action(poolInfo, eUTxOs_Selected, assets, master_Selected)

			//alert ("post action:" + isWorking)

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

			setTokenAmount("1")
			setTokenAmountFormatedValue("1")

		} catch (error: any) {
			const error_explained = explainError(error)
			console.error("ActionModalBtn - doAction - " + actionName + " - Error: " + error_explained)

			pushWarningNotification(actionName, error_explained);
			setStatus('error')
			setTitle(`${actionName} Error`)
			setMessage(error_explained)
			setHash("")

			// no inicio los valores si hay error
			// setTokenAmount("1")
			// setTokenAmountFormatedValue("1")
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
			</> */}


			<>{showInput ?
				""// <>{(userMaxTokens ===0? userMaxTokens : "Max " + inputUnit + " to use in Wallet: " + userMaxTokens ) || <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</>
				: null}</>

			
			{show?
				<>
					<br></br>
					{enabled && (isWorking === actionNameWithIdx || isWorking === "") ?
						<label htmlFor={`${actionNameWithIdx}-modal-toggle`} className="btn">
							{actionName}
							<>
								{
									(status === 'loading') ?
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
						<button disabled className="btn">
							<span className="wallet__button_disabled">
								{actionName}
								{(status === 'loading') ?
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
							</span>
						</button>
					}
					<input
						className="modal__toggle"
						type="checkbox"
						id={`${actionNameWithIdx}-modal-toggle`}

						onChange={(e) => {

							//console.log ("modal change: " + e.target.checked)

							if (e.target.checked) {
								//si es checked es porque esta abierto el modal


								if (showInput) {
									//el modal se abre y muestra inputs

									//no quiero cambiar el status a menos que este en success o error, que ya paso el proceso anterior.
									//en ese caso lo pongo en idle de nuevo
									//si estaba loading, no hago nada, porque el proceso sigue corriendo

									if (status === 'success' || status === 'error') {
										setStatus('idle')

										setTitle(actionName)
										setMessage("")
										setHash("")
									}

								} else {
									//el modal se abre y ejecuta la accion directamente solo si esta en idle, success, o error, o sea, que no este en loading

									if (status === "idle" || status === "success" || status === "error") {
										if (poolInfo) {
											// if (eUTxOs_Selected !== undefined) {
											doAction(action, poolInfo, eUTxOs_Selected, undefined, master_Selected)
											// } else {
											// 	doAction(action, poolInfo)
											// }
										} else {
											doAction(action)
										}
									}
								}
							} else {
								//si no es checked es porque esta cerrado el modal

								//setTitle("cuando ?")
								//setStatus("idle")
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


								{message !== "" ? <div style={{ marginTop: 10 }}>{message}</div> : <></>}

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
										// <UseAnimations
										// 	strokeColor="currentColor"   //"currentColor"
										// 	size={100}
										// 	animation={ loadingAnimation } //status === "error" ? alertTriangleAnimation : (status === "loading" ? loadingAnimation : checkmarkAnimation)
										// /> 
										<>
											<br></br>
											<LoadingSpinner size={25} border={5} />

										</>
										:
										<></>
									}

									{/* <UseAnimations
									strokeColor={status === "error" ? "red" : (status === "loading" ? "black" : "green")}   //"currentColor"
									size={status === "error" ? 100 : (status === "loading" ? 100 : 100)}
									animation={ statusAnimation  } //status === "error" ? alertTriangleAnimation : (status === "loading" ? loadingAnimation : checkmarkAnimation)
								/>  */}

								</div>

								<br></br>
								<div>
									{cancel && status === "loading"?
										<button className="btn"
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
									
							</>
							:
							//esta idle, no esta procesando nada
							<>
								{showInput ?

									//el modal muestra input
									<>
										<h3>{title}</h3>

										<h4 style={{ paddingTop: 10 }}>How many {inputUnitForShowing}?</h4>

										{message !== "" ? <div style={{ marginTop: 10 }}>{message}</div> : <></>}
										<br></br>
										<NumericFormat style={{ width: 300, fontSize: 12 }} type="text" value={tokenAmountFormatedValue}

											// onChange={e => setTokenAmount(Number(e.target.value).toString()) } 

											// isAllowed={(values) => {
											// 	const {floatValue} = values;
											// 	return floatValue! >= 1 &&  floatValue! <= Number(userMaxTokens);
											//   }}

											onValueChange={(values) => {
												const { formattedValue, value } = values;
												// formattedValue = $2,223
												// floatValue = 2223
												setTokenAmount(value)
											}
											}

											thousandsGroupStyle="thousand" thousandSeparator="," decimalSeparator="." decimalScale={0}
										/>

										{/* <input  style={{ width: 300, fontSize: 12 }}
										type="number"
										placeholder="Amount"
										max={userMaxTokens?.toString()}
										value={tokenAmount}
										onChange={e => setTokenAmount(Number(e.target.value).toString())}
									/> */}
										<br></br>
										<input style={{ width: 300, fontSize: 12 }} type="range" min={1} max={userMaxTokens?.toString()} value={tokenAmount}

											onChange={e => {
												setTokenAmount(Number(e.target.value).toString())
												setTokenAmountFormatedValue(Number(e.target.value).toString())

											}}


										/>
										<br></br>

										<div>
											<button
												className="btn"
												disabled={!enabled}
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
															setMessage("You have exceeded the maximum amount per transaction for this token which is: " + maxTokensWithDifferentNames )
														}else{
															setMessage("You do not have enough tokens to perform this action. Try reconnecting your wallet." )
														}
													} else {


														setMessage("")

														let assets: Assets = { [inputUnitForLucid!]: BigInt(tokenAmount) }

														if (eUTxOs_Selected !== undefined) {
															doAction(action, poolInfo, eUTxOs_Selected, assets)
														} else {
															doAction(action, poolInfo, undefined, assets)
														}
													}
												}
												}
											>
												{actionName}
											</button>
												
											<button className="btn"
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
									//Si esta en idle pero no hay input... cosa que no deberia pasar, si no hay input es por que esta procesando de una y debeeria estar en waiting
									//por las dudas pongo el close button
									<>
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

