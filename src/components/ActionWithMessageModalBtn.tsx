//--------------------------------------
import { useEffect, useState } from "react";
import { Assets } from "lucid-cardano";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { copyToClipboard } from '../utils/utils';
import { NumericFormat } from 'react-number-format';
import { explainError } from "../stakePool/explainError";
import { EUTxO, Master } from "../types";
import { maxTokensWithDifferentNames } from "../types/constantes";
import { pushSucessNotification, pushWarningNotification } from "../utils/pushNotification";
import LoadingSpinner from "./LoadingSpinner";
//--------------------------------------

type ActionStatus = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function ActionWithMessageModalBtn(

	{ actionName, enabled, show, actionIdx, description, action, poolInfo, eUTxOs_Selected, master_Selected, swHash, messageFromParent, hashFromParent, isWorking, callback, cancel, swPaddintTop }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			description?: string,
			action: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined, master_Selected?: Master | undefined) => Promise<any>,
			poolInfo?: StakingPoolDBInterface | undefined,
			eUTxOs_Selected?: EUTxO[] | undefined,
			master_Selected?: Master | undefined,
			swHash?: Boolean,
			messageFromParent?: string | "",
			hashFromParent?: string | "",
			isWorking?: string | "",
			callback?: (isWorking: string) => Promise<any>,
			cancel?: () => Promise<any>,
			swPaddintTop?: Boolean ,
		} 
) {

	const actionNameWithIdx = actionName + "-" + actionIdx

	const [status, setStatus] = useState<ActionStatus>('idle')

	const [title, setTitle] = useState(actionName)

	const [message, setMessage] = useState("")

	const [hash, setHash] = useState("")
	
	
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

		} catch (error: any) {
			const error_explained = explainError(error)
			console.error("ActionModalBtn - doAction - " + actionName + " - Error: " + error_explained)

			pushWarningNotification(actionName, error_explained);
			setStatus('error')
			setTitle(`${actionName} Error`)
			setMessage(error_explained)
			setHash("")

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

			
			{show ?
				<>
					{swPaddintTop === true || swPaddintTop === undefined? <div><br></br></div> : null}
					{enabled && (isWorking === actionNameWithIdx || isWorking === "") ?
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
					//console.log ("modal change: " + e.target.checked)
					if (e.target.checked) {
						
						if (status === 'success' || status === 'error') {
							setStatus('idle')

							setTitle(actionName)
							setMessage("")
							setHash("")
						}
						
					} else {
						//si no es checked es porque esta cerrado el modal
						//setTitle("cuando ?")
						//setStatus("idle")
					}
				}}
			/>
			<div id={`${actionNameWithIdx}-modal`} className="modal">
				<label htmlFor={`${actionNameWithIdx}-modal-toggle`} className="modal__shade"></label>
				<div className="modal__content">
					<div className="modal__content_item">
						{
							/* <>
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
										<>
											<br></br>
											<LoadingSpinner size={25} border={5} />

										</>
										:
										<></>
									}
								</div>

								<br></br>
								<div>
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
								<h3>{title}</h3>

								<div style={{ paddingTop: 10 }}><div dangerouslySetInnerHTML={{ __html: description! }} /></div>

								{message !== "" ? <div style={{ marginTop: 10 }}>{message}</div> : <></>}
								<br></br>

								<div>
									<button
										className="btn btnStakingPool"
										disabled={!enabled}
										onClick={(e) => {
												e.preventDefault()
												setMessage("")
												if (eUTxOs_Selected !== undefined) {
													doAction(action, poolInfo, eUTxOs_Selected)
												} else {
													doAction(action, poolInfo, undefined)
												}
											}
										}
									>
										Ok
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
					</div>
				</div>
			</div>
		</div>
	)
}

