//--------------------------------------
import { signIn, signOut, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Skeleton from "react-loading-skeleton"
import { explainError, explainErrorTx } from "../stakePool/explainError"
import { initializeLucid, initializeLucidWithWalletFromSeed } from "../utils/initializeLucid"
import { useLocalStorage } from "../utils/useLocalStorage"
import { searchKeyInObject, searchValueInArray } from "../utils/utils"
import { useStoreActions, useStoreState } from '../utils/walletProvider'
//--------------------------------------

export default function WalletModalBtn() {

	const { data: session, status } = useSession()

	const walletMasterSeed1 = process.env.NEXT_PUBLIC_walletMasterSeed1
	const walletMasterSeed2 = process.env.NEXT_PUBLIC_walletMasterSeed2
	const walletMasterPrivateKey1 = process.env.NEXT_PUBLIC_walletMasterPrivateKey1

	const [walletError, setWalletError] = useState("")
	const [walletMessage, setWalletMessage] = useState("")

	const [swEnviarPorBlockfrost, setSwEnviarPorBlockfrost] = useState(false)
	const [pollWalletsCount, setPollWalletsCount] = useState(0)
	const [availableWallets, setAvailableWallets] = useState<{ nami: boolean, yoroi: boolean, eternl: boolean, flint: boolean, typhon: boolean, nufi: boolean }>({ yoroi: false, nami: false, eternl: false, flint: false, typhon: false, nufi: false })
	
	const installWallet = { 
		"nami" : "https://chrome.google.com/webstore/detail/nami/lpfcbjknijpeeillifnkikgncikgfhdo", 
		"yoroi" : "https://chrome.google.com/webstore/detail/yoroi/ffnbelfdoeiohenkjibnmadjiehjhajb", 
		"eternl" : "https://chrome.google.com/webstore/detail/eternl/kmhcihpebfmpgmihbkipmjlmmioameka", 
		"flint" : "https://chrome.google.com/webstore/detail/flint-wallet/hnhobjmcibchnmglfbldbfabcgaknlkj", 
		"typhon" : "https://chrome.google.com/webstore/detail/typhon-wallet/kfdniefadaanbjodldohaedphafoffoh", 
		"nufi" : "https://chrome.google.com/webstore/detail/nufi/gpnihlnnodeiiaakbikldcihojploeca" 
	}

	//--------------------------------------

	const walletStore = useStoreState(state => state.wallet)
	const uTxOsAtWallet = useStoreState(state => state.uTxOsAtWallet)
	const isWalletDataLoaded = useStoreState(state => state.isWalletDataLoaded)

	const { setWalletStore, loadWalletData } = useStoreActions(actions => {
		return { setWalletStore: actions.setWallet, loadWalletData: actions.loadWalletData };
	});

	//--------------------------------------

	const walletConnect = async (walletName: string, closeModal = true, tryAgain = false) => {
		console.log("[Session] - walletConnect: " + walletName)
		setWalletMessage("Connecting with <b>" + walletName + "</b>...")
		try {

			var walletApi = undefined
			var countError = 0
			var errorStr = ""
			const maxError = tryAgain ? 2 : 1
			while (countError < maxError) {
				try {
					if (countError>0) await new Promise(r => setTimeout(r, 4000)); //espero 4 segundos para que se cargue la wallet
				 	walletApi = await window.cardano[walletName].enable()
					break
				} catch (error) {
					console.log("[Session] - try " + countError+" of "+maxError+" - walletConnect Error: " + error)
					errorStr = explainError(error) 
					countError++
				}
			}
			if (!walletApi) {
				throw errorStr
			}

			const lucid = await initializeLucid(walletApi)
			const adddressWallet = await lucid!.wallet.address()
			//const pkh = C.Address.from_bech32(adddressWallet).as_base()?.payment_cred().to_keyhash()?.to_hex();
			const pkh = lucid!.utils.getAddressDetails(adddressWallet)?.paymentCredential?.hash;
			//console.log("[Session] - walletConnect: addr: " + adddressWallet)
			console.log("[Session] - walletConnect: pkh: " + pkh)
			const protocolParameters = await lucid!.provider.getProtocolParameters();
			var swEnviarPorBlockfrost_ = swEnviarPorBlockfrost
			if(status === "authenticated"){
				if(session && session.user && session.user.swEnviarPorBlockfrost){
					swEnviarPorBlockfrost_ = (session.user.swEnviarPorBlockfrost)
				}
			}
			//seteo a la fuerza el no enviar por blockfrost, por las dudas de que alguien haya creado ya la session con este campo
			//y yo lo estoy sacando del formulario, no podria desacativarlo
			swEnviarPorBlockfrost_ = false
			const walletStore_ = { connected: true, name: walletName, walletApi: walletApi, pkh: pkh, lucid: lucid, swEnviarPorBlockfrost: swEnviarPorBlockfrost_, protocolParameters: protocolParameters }
			console.log("[Session] - walletConnect - status: " + status + " - session.user.pkh: " + session?.user?.pkh + " - pkh: " + pkh)
			if (status !== "authenticated" || (status === "authenticated" && session && session.user && session.user.pkh !== pkh)) {
				// console.log("LOGIN")
				await signOut({ redirect: false })
				await signIn('credentials', { pkh: pkh , walletName: walletName, swEnviarPorBlockfrost: swEnviarPorBlockfrost_?"true":"false", isWalletFromSeedletName: "false",redirect: false })
			}
			setWalletStore(walletStore_)
			//setWalletMessage("Loading Wallet info in parallel...")
			loadWalletData(walletStore_)
			setWalletMessage("Connected with <b>" + walletName + "</b>!")
		} catch (error) {
			console.error("[Session] - walletConnect Error2: " + error)
			const error_explained = explainError(error)
			setWalletError("Error connecting with <b>" + walletName + "</b><br></br> " + error_explained)
			setWalletMessage("")
			if (status === "authenticated") {
				await signOut({ redirect: false })
			}
		}

	}

	const walletFromSeedConnect = async (walletName: string, closeModal = true) => {
		console.log("[Session] - walletFromSeedConnect")
		// setWalletMessage("Connecting with " + walletName + "...")
		// try {
		// 	var walletSeed: string = ""
		// 	if (walletName === "Master1") {
		// 		walletSeed = walletMasterSeed1? walletMasterSeed1 : ""
		// 	} else if (walletName === "Master2") {
		// 		walletSeed = walletMasterSeed2? walletMasterSeed2 : ""
		// 	}
		// 	//const newBech32PrivateKey = C.PrivateKey.generate_ed25519().to_bech32()
		// 	//const walletPrivateKey ="ed25519_sk10lc2huyqqx53qkcj8u9x794cesmtrpn95330aurcvkex8wmysljsz062s8" // walletMasterPrivateKey1
		// 	//alert ("walletPrivateKey: " + walletPrivateKey)
		// 	// const lucid = await initializeLucidWithWalletFromPrivateKey(walletPrivateKey)
		// 	const lucid = await initializeLucidWithWalletFromSeed(walletSeed)
		// 	const adddressWallet = await lucid!.wallet.address()
		// 	//const pkh = C.Address.from_bech32(adddressWallet).as_base()?.payment_cred().to_keyhash()?.to_hex();
		// 	const pkh = lucid!.utils.getAddressDetails(adddressWallet)?.paymentCredential?.hash;
		// 	//console.log("[Session] - walletConnect: addr: " + adddressWallet)
		// 	console.log("[Session] - walletConnect: pkh: " + pkh)
		// 	const protocolParameters = await lucid!.provider.getProtocolParameters();
		// 	const walletStore = { connected: true, name: walletName, walletApi: undefined, pkh: pkh, lucid: lucid, swEnviarPorBlockfrost: savedSwEnviarPorBlockfrost, protocolParameters: protocolParameters }
		// 	await signIn('credentials', { pkh: pkh , redirect: false })
		// 	setWalletStore(walletStore)
		// 	setSavedWalletConnected(true)
		// 	setSavedWalletName(walletName)
		// 	setSavedIsWalletFromSeed(true)
		// 	setWalletMessage("Loading Wallet info...")
		// 	await loadWalletData(walletStore)
		// 	setWalletMessage("Connected with " + walletName + "!")
		// } catch (error) {
		// 	console.error("[Session] - walletConnect Error2: " + error)
		// 	setWalletMessage("Error Connecting with " + walletName + ": " + error)
		// }
	}

	const walletDisconnect = async (closeModal = true) => {
		console.log("[Session] - walletDisconnect")
		setWalletMessage("Disconnecting Wallet ...")
		try {
			const walletStore = { connected: false, name: '', walletApi: undefined, pkh: "", lucid: undefined, swEnviarPorBlockfrost: false, protocolParameters: undefined }
			if (status === "authenticated") {
				await signOut({ redirect: false })
			}
			setWalletStore(walletStore)
			// setSavedWalletConnected(false)
			// setSavedWalletName("")
			// setSavedSwEnviarPorBlockfrost(false)
			// setSavedIsWalletFromSeed(false)
			//setWalletMessage("Wallet Disconnected!")
			setWalletMessage("")
		} catch (error) {
			const error_explained = explainError(error)
			console.error("[Session] - walletDisconnect Error2: " + error_explained)
			setWalletError("Error Disconnecting Wallet: " + error_explained)
			setWalletMessage("")
			if (status === "authenticated") {
				await signOut({ redirect: false })
			}

		}
	}

	const sessionWalletConnect = async () => {
		try{
			if(session && session.user && session.user.walletName){
				//console.log("[Session] - walletConnect - session.walletName: " + session.user.walletName)
				if (window.cardano && searchKeyInObject(availableWallets, session.user.walletName)) {
					//si la wallet estaba conectada en la session anterior, tengo que reconectarla
					console.log("[Session] - sessionWalletConnect - session.walletName: " + session.user.walletName)
					setWalletMessage("Loading session...")
					await new Promise(r => setTimeout(r, 2000));
					await walletConnect(session.user.walletName, false, true)
				} else {
					console.log("[Session] - sessionWalletConnect: Not connecting to any wallet. Wallet of previus session not found: " + session.user.walletName)
					throw "Wallet of previus session not found"
				}
			}else{
				throw "No walletName in session"
			}
		} catch (error) {
			await signOut({ redirect: false })
		}
	}


	const pollWallets = async () => {
		var wallets = [];

		if (window.cardano) {
			for (const key in window.cardano) {
				if (window.cardano[key].enable! && wallets.indexOf(key) === -1) {
					wallets.push(key);
				}
			}
		}

		if (wallets.length === 0 && pollWalletsCount < 3) {
			console.log("[Session] - POLLWALLETS Try again - Count: " + pollWalletsCount)
			setTimeout(async () => {
				console.log("[Session] - POLLWALLETS timeout call - Count:  " + pollWalletsCount)
				setPollWalletsCount(pollWalletsCount + 1)
				wallets = await pollWallets();
			}, 1000);
			//iterate wallets
			for (const walletName of wallets) {
				setAvailableWallets((wallets: any) => ({ ...wallets, [walletName]: true }))
			}
			return wallets;
		}

		console.log("[Session] - POLLWALLETS wallets: " + wallets)
		//iterate wallets
		for (const walletName of wallets) {
			setAvailableWallets((wallets: any) => ({ ...wallets, [walletName]: true }))
		}

		return wallets
	}

	const handleChangeSavedSwEnviarPorBlockfrost = async () => {
		console.log ("[Session] - handleChangeSavedSwEnviarPorBlockfrost: " + !swEnviarPorBlockfrost)
		setSwEnviarPorBlockfrost(!swEnviarPorBlockfrost);
		if(status === "authenticated"){
			if(session && session.user ){
				console.log ("[Session] - refreshing session with new swEnviarPorBlockfrost: " + !swEnviarPorBlockfrost)
				await signIn('credentials', { pkh: session.user.pkh , walletName: session.user.walletName, swEnviarPorBlockfrost: !swEnviarPorBlockfrost?"true":"false", isWalletFromSeedletName: session.user.isWalletFromSeedletName?"true":"false",redirect: false, })
			}
		}
	};

	useEffect(() => {
		pollWallets();
	}, [])

	useEffect(() => {
		
		if(status === "authenticated"){
			console.log("[Session] - Session authenticated")
			if(session && session.user && session.user.swEnviarPorBlockfrost){
				setSwEnviarPorBlockfrost(session.user.swEnviarPorBlockfrost)
			}
			if (!walletStore.connected || (walletStore.connected && session && session.user && session.user.pkh !== walletStore.pkh)) {
				sessionWalletConnect()
			}
		} else if (status === "unauthenticated"){
			console.log("[Session] - Not connecting to any Wallet, there were not previus session")
		} else if (status === "loading"){
			console.log("[Session] - Loading Session")
		}
	}, [status])

	return (
		<div>
			<label htmlFor="wallet-modal-toggle" className="wallet__modal_button btn">

				<svg width="25" viewBox="0 0 23 18" fill="none" className={walletStore.connected ? "wallet__indicator" : ""} xmlns="http://www.w3.org/2000/svg">
					<path d="M1.98305 0.0142294L3.66212 0L2.82418 0.837942H1.66037C1.50204 0.986955 1.48968 1.16381 1.48968 1.30347C1.48968 1.45864 1.55047 1.62094 1.66037 1.67588L19.6918 1.66192C20.797 1.66106 21.6934 2.55674 21.6934 3.66192V7.61907H17.2372C16.1931 7.61907 15.3468 8.46543 15.3468 9.50947C15.3468 10.5908 16.2233 11.4674 17.3047 11.4674H21.6934V15.4106C21.6934 16.5151 20.798 17.4106 19.6934 17.4106H2C0.89543 17.4106 0 16.5151 0 15.4106V2.01416C0 0.916201 0.885136 0.0235337 1.98305 0.0142294Z" fill="currentColor" />
					<path d="M20.9873 11.1415H17.3562C16.4692 11.1415 15.7501 10.4224 15.7501 9.53541C15.7501 8.64841 16.4692 7.92935 17.3562 7.92935H20.9873C21.8743 7.92935 22.5933 8.64841 22.5933 9.53541C22.5933 10.4224 21.8743 11.1415 20.9873 11.1415Z" fill="currentColor" />
					<circle cx="17.2398" cy="9.52771" r="0.682768" />
				</svg>
			</label>

			<input
				type="checkbox" id="wallet-modal-toggle" className="modal__toggle"
				onChange={(e) => {
					if (!e.target.checked) {
						setWalletError("")
					}
				}}
			/>

			<div id="wallet-modal" className="modal">
				<label htmlFor="wallet-modal-toggle" className="modal__shade"></label>

				<div className="modal__content">
				
					<div className="wallet__content" style={{minWidth:350}}>
						<h3>
							{
							walletStore.connected ?
								<>
									Wallet ({process.env.NEXT_PUBLIC_USE_MAINNET === "true"?"Mainnet":"Preview"})
								</>
								:	
								<>
									Connect your Wallet ({process.env.NEXT_PUBLIC_USE_MAINNET === "true"?"Mainnet":"Preview"})
								</>
							}
						</h3>
						<br></br>

						{walletMessage ? 
							<div>
								<div dangerouslySetInnerHTML={{ __html: walletMessage! }} />
								<br></br>
							</div> : <></>}

						{walletError ? 
							<div>
								<div dangerouslySetInnerHTML={{ __html: walletError! }} />
								<br></br>
							</div> : <></>}

						{walletStore.connected ?
							<>
								<div><b>Pkh</b> {walletStore.connected ? walletStore.pkh : <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
								<div><b>UTxOs</b> {isWalletDataLoaded ? uTxOsAtWallet.length : <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
								<br></br>
								{process.env.NODE_ENV==="development" ?
									<>
										<label>
											<input
												type="checkbox"
												checked={swEnviarPorBlockfrost}
												onChange={handleChangeSavedSwEnviarPorBlockfrost}
											/>
											Use the BlockFrost API instead of the Wallet dApp to submit the Transactions
										</label>
										<br></br><br></br>
									</>
									:
									<>
									</>
								}
							</>
							:
							<>
							{/* <div>Select your Wallet. If you do not have a wallet, click the 'install' button to set one up.</div>
							<br></br> */}
							</>
						}

						<div className="wallet__buttons">
							{walletStore.connected ?
								<>
									<button
										key={walletStore.pkh}
										className="btn wallet__button"
										onClick={async (e) => {
											try {
												e.preventDefault()
												walletDisconnect(false)
											} catch (error) {
												const error_explained = explainError(error)
												console.error("[Session] - Error disconnecting wallet: " + error_explained)
											}
										}}
									>
										<span>
											Disconnect Wallet
										</span>
									</button>
								</>
							:
								<>

									{
										Object.keys(availableWallets).map(wallet => {
											const enabled = (availableWallets as { [key: string]: boolean })[wallet];

											if (enabled){
												return (
													<button
														key={wallet} disabled={!enabled}
														className="btn wallet__button"
														onClick={async (e) => {
															try {
																e.preventDefault()
																walletConnect(wallet, false, false)
															} catch (error) {
																const error_explained = explainError(error)
																console.error("[Session] - Error connecting with wallet: " + error_explained)
															}
														}}
													>
														<span className={!enabled ? "wallet__button_disabled" : ""}>
															{wallet}
														</span>
													</button>
											)		
											}else{
												return (
													<button
														key={wallet+"install"} 
														className="btn wallet__button"
														onClick={async (e) => {
															try {
																e.preventDefault()

																const url = installWallet[wallet as keyof typeof installWallet]
																window.open(url, '_blank');

																// const keys = Object.keys(installWallet)
																// for (let i = 0; i < keys.length; i++) {
																// 	if (keys[i].toLowerCase() === wallet.toLowerCase()){
																// 		const url = installWallet[keys[i] as keyof typeof installWallet]
																// 		window.open(url, '_blank');
																// 	}
																// }

															} catch (error) {
																const error_explained = explainError(error)
																console.error("[Session] - Error installing with wallet: " + error_explained)
															}
														}}
													>
														<span >
															{wallet} (Install)
														</span>
													</button>
												)		
											}
											
										})
									}

									{process.env.NODE_ENV==="development"?
										<>
											<button
												key={"Wallet Master 1"}
												className="btn wallet__button"
												onClick={async (e) => {
													try {
														e.preventDefault()
														walletFromSeedConnect("Master1", false)
													} catch (error) {
														const error_explained = explainError(error)
														console.error("[Session] - Error connecting with wallet from seed" + error_explained)
													}
												}}
											>
												<span>
													Wallet Master 1
												</span>
											</button>
											<button
												key={"Wallet Master 2"}
												className="btn wallet__button"
												onClick={async (e) => {
													try {
														e.preventDefault()
														walletFromSeedConnect("Master2", false)
													} catch (error) {
														const error_explained = explainError(error)
														console.error("[Session] - Error connecting with wallet from seed" + error_explained)
													}
												}}
											>
												<span>
													Wallet Master 2
												</span>
											</button>
										</>
										:
										<></>
									}
								</>
							}
						</div>
					</div>
				</div>
			</div>
		</div>
	)

}


