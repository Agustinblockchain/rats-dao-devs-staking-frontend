//--------------------------------------
import { useEffect, useState } from "react";
import { Assets, UTxO } from "lucid-cardano";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { copyToClipboard, hexToStr, toJson } from '../utils/utils';
import { NumericFormat } from 'react-number-format';
import { explainError } from "../stakePool/explainError";
import { EUTxO, Master } from "../types";
import { maxTokensWithDifferentNames } from "../types/constantes";
import { pushSucessNotification, pushWarningNotification } from "../utils/pushNotification";
import LoadingSpinner from "./LoadingSpinner";
import { addAssets } from "../utils/cardano-helpers";
//--------------------------------------

type ActionStatus = "loading" | "success" | "error" | "idle"

//--------------------------------------

export default function ActionWithSelectInputModalBtn(

	{ actionName, enabled, show, actionIdx, action, poolInfo, eUTxOs_Selected, master_Selected, 
		walletAssets,
		inputUnitForLucid, inputUnitForShowing, inputMax, swHash, messageFromParent, hashFromParent, isWorking, callback, cancel, swPaddintTop }:
		{
			actionName: string, enabled: boolean, show: boolean, actionIdx: string,
			action: (poolInfo?: StakingPoolDBInterface | undefined, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets | undefined, master_Selected?: Master | undefined) => Promise<any>,
			poolInfo?: StakingPoolDBInterface | undefined,
			eUTxOs_Selected?: EUTxO[] | undefined,
			master_Selected?: Master | undefined,
			walletAssets : Assets ,
			inputUnitForLucid: string | "lovelace",
			inputUnitForShowing: string | "ADA (lovelace)",
			inputMax: 0 | string,
			swHash?: Boolean,
			messageFromParent?: string | "",
			hashFromParent?: string | "",
			isWorking?: string | "",
			callback?: (isWorking: string) => Promise<any>,
			cancel?: () => Promise<any>,
			swPaddintTop?: Boolean 
		} 
) {

	const actionNameWithIdx = actionName + "-" + actionIdx

	const [status, setStatus] = useState<ActionStatus>('idle')

	const [title, setTitle] = useState(actionName)
	const [message, setMessage] = useState("")
	const [hash, setHash] = useState("")

	const [tokenAmount, setTokenAmount] = useState(0);
	const [userMaxTokens, setUserMaxTokens] = useState<string>("0");

	const input_CS = inputUnitForLucid!.slice(0, 56)
	const input_TN = inputUnitForLucid!.slice(56)
	const input_AC_isAda = (input_CS === 'lovelace')
	const input_AC_isWithoutTokenName = !input_AC_isAda && input_TN == ""	

	const [walletAssetsList, setWalletAssetsList] = useState<{tokenNameHEX: string, tokenName: string, value: Number }[]>([]);
	const [walletAssetsSelect, setWalletAssetsSelect] = useState<{tokenNameHEX: string, amount: string, amountFormatedValue: string, max: string }[]>([]);

	useEffect(() => {
		if (inputMax) {
			setUserMaxTokens(inputMax!.toString())
		}
	}, [inputMax])

	useEffect(() => {
		if (walletAssets) {
			const walletAssetsList_ = []
			const walletAssetsSelect_ = []
			for (const [key, value] of Object.entries(walletAssets)) {
				const CS_ = key.slice(0, 56)
				const TN_ = key.slice(56)
				walletAssetsList_.push({tokenNameHEX: TN_, tokenName: hexToStr (TN_), value: Number (value)})
				walletAssetsSelect_.push({tokenNameHEX: TN_, amount: "0", amountFormatedValue: "0", max: value.toString()})
			}
			setWalletAssetsList(walletAssetsList_)
			setWalletAssetsSelect(walletAssetsSelect_)
			//console.log ("ActionModalBtn - useEffect1 - " + walletAssetsList_.length + " - " + walletAssetsSelect_.length)
		}
	}, [walletAssets])

	useEffect(() => {
		if (walletAssetsSelect) {
			setTokenAmount (walletAssetsSelect.reduce((acc, cur) => acc + Number(cur.amount), 0))
			//{walletAssetsList.reduce((total, asset) => total + Number(walletAssetsSelect.find((assetSelect) => assetSelect.tokenNameHEX === asset.tokenNameHEX)?.amount), 0).toLocaleString()}
		}
	}, [walletAssetsSelect])

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

			const walletAssetsSelect_ = []
			for (const [key, value] of Object.entries(walletAssets)) {
				const CS_ = key.slice(0, 56)
				const TN_ = key.slice(56)
				walletAssetsSelect_.push({tokenNameHEX: TN_, amount: "0", amountFormatedValue: "0", max: value.toString()})
			}
			setWalletAssetsSelect(walletAssetsSelect_)
			setTokenAmount(0)

		} catch (error: any) {
			const error_explained = explainError(error)
			console.error("ActionModalBtn - doAction - " + actionName + " - Error: " + error_explained)

			pushWarningNotification(actionName, error_explained);
			setStatus('error')
			setTitle(`${actionName} Error`)
			setMessage(error_explained)
			setHash("")

			// no inicio los valores si hay error
			const walletAssetsSelect_ = []
			for (const [key, value] of Object.entries(walletAssets)) {
				const CS_ = key.slice(0, 56)
				const TN_ = key.slice(56)
				walletAssetsSelect_.push({tokenNameHEX: TN_, amount: "0", amountFormatedValue: "0", max: value.toString()})
			}
			setWalletAssetsSelect(walletAssetsSelect_)
			setTokenAmount(0)
		}
	}

	function handleChangeValue (tokenNameHEX: string, v: string) {
		const walletAssetsSelect_ = walletAssetsSelect.map((a, i) => {
			if (tokenNameHEX === a.tokenNameHEX) {
			  a.amount = v
			  return a
			} else {
			  return a;
			}
		  });
		  setWalletAssetsSelect(walletAssetsSelect_);
	}
	function handleChangeFormatedValue (tokenNameHEX: string, v: string, f: string) {
		const walletAssetsSelect_ = walletAssetsSelect.map((a, i) => {
			if (tokenNameHEX === a.tokenNameHEX) {
			  a.amount = v
			  a.amountFormatedValue = f
			  return a
			} else {
			  return a;
			}
		  });
		  setWalletAssetsSelect(walletAssetsSelect_);
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
						//si es checked es porque esta abierto el modal

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

								<h4 style={{ paddingTop: 10 }}>How many {inputUnitForShowing}?</h4>		

								{message !== "" ? <div style={{ marginTop: 10 }}>{message}</div> : <></>}
								<br></br>

								{
									walletAssetsList.map((asset, idx) => 
										
										<div key={idx} >
											<b>{asset.tokenName}</b> (There are {asset.value.toLocaleString()} in your wallet)
											<br></br>

											<NumericFormat key={"NumericFormat" + idx} style={{ width: 300, fontSize: 12 }} type="text" value={ walletAssetsSelect.find((assetSelect) => assetSelect.tokenNameHEX === asset.tokenNameHEX)?.amountFormatedValue}
												onValueChange={(values) => {
														const { formattedValue, value } = values;
														handleChangeValue (asset.tokenNameHEX, value)
													}
												}

												thousandsGroupStyle="thousand" thousandSeparator="," decimalSeparator="." decimalScale={0}
											/>
											<br></br>
											<input key={"input" + idx} style={{ width: 300, fontSize: 12 }} type="range" min={0} max={walletAssetsSelect.find((assetSelect) => assetSelect.tokenNameHEX === asset.tokenNameHEX)?.max} value={walletAssetsSelect.find((assetSelect) => assetSelect.tokenNameHEX === asset.tokenNameHEX)?.amount}
												onChange={e => {
													handleChangeFormatedValue (asset.tokenNameHEX, Number(e.target.value).toString(), Number(e.target.value).toString())
												}}
											/>
											<br></br>
											
										</div>
										
									)

								}

								<div style={{textAlign: "left", width: "100%"}}>
									<b>Total: {tokenAmount.toLocaleString()} {inputUnitForShowing} (Max: {userMaxTokens.toLocaleString()})</b>
								</div>
								
								<br></br>
								<div>
									<button
										className="btn btnStakingPool"
										disabled={!enabled}
										onClick={(e) => {
											e.preventDefault()

											if (BigInt(tokenAmount) <= 0n) {

												setMessage("Please enter a valid amount greater than zero")

											} else if (BigInt(tokenAmount) > BigInt(userMaxTokens)) {
												
												if (input_AC_isWithoutTokenName && BigInt(userMaxTokens) == BigInt(maxTokensWithDifferentNames)){
													setMessage("You have exceeded the maximum amount per transaction for this token which is: " + maxTokensWithDifferentNames + "." )
												}else{
													setMessage("You have exceeded the maximum avalaible tokens which is: " + userMaxTokens )
												}
											} else {

												setMessage("")

												let assets: Assets = {}

												walletAssetsSelect.forEach((asset) => {
													assets[input_CS + asset.tokenNameHEX] = BigInt (asset.amount)
												})
												
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
						}
					</div>
				</div>
			</div>
		</div>
	)
}

