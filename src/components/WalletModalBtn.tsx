//--------------------------------------
import { signIn, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import Skeleton from "react-loading-skeleton"
import { initializeLucid, initializeLucidWithWalletFromSeed } from "../utils/initializeLucid"
import { useLocalStorage } from "../utils/useLocalStorage"
import { searchValueInArray } from "../utils/utils"
import { useStoreActions, useStoreState } from '../utils/walletProvider'
//--------------------------------------

export default function WalletModalBtn() {

	// var _isMounted = false;

	// const [_isMounted, set_isMounted] = useState(false)

	// const [isWorking, setIsWorking] = useState(false)

	// const walletMasterSeed1 = "dad cupboard hotel cause mansion feature oppose prevent install venue finish galaxy tone green volcano neglect coil toast future exchange prize social next tape"
	// const walletMasterSeed2 = "laptop brief dune view concert rule raise roast vessel harbor discover own urge mail aisle patrol budget awesome mimic throw loop access transfer cousin"
	// const walletMasterPrivateKey1 = "ed25519_sk1tqszz34acpy9d757ae6qplh9lnrdk3dzf06z7cx8w730jfjxfrh05gsdntczq"

	const walletMasterSeed1 = ""
	const walletMasterSeed2 = ""

	const [walletMessage, setWalletMessage] = useState("")

	const [swSavedWalletConnected, setSavedWalletConnected] = useLocalStorage("swWalletConnected", false)
	const [savedWalletName, setSavedWalletName] = useLocalStorage("walletName", "")
	const [savedSwEnviarPorBlockfrost, setSavedSwEnviarPorBlockfrost] = useLocalStorage("SwEnviarPorBlockfrost", false)
	const [savedIsWalletFromSeed, setSavedIsWalletFromSeed] = useLocalStorage("IsWalletFromSeed", false)

	// const [swSavedWalletConnected, setSavedWalletConnected] = useState(false)
	// const [savedWalletName, setSavedWalletName] = useState("")
	// const [savedSwEnviarPorBlockfrost, setSavedSwEnviarPorBlockfrost] = useState(false)

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

	const handleChangeSavedSwEnviarPorBlockfrost = () => {
		setSavedSwEnviarPorBlockfrost(!savedSwEnviarPorBlockfrost);
	};

	//--------------------------------------
	//Wallet Store

	const walletStore = useStoreState(state => state.wallet)
	const uTxOsAtWallet = useStoreState(state => state.uTxOsAtWallet)
	const isWalletDataLoaded = useStoreState(state => state.isWalletDataLoaded)

	const { setWalletStore, loadWalletData } = useStoreActions(actions => {
		return { setWalletStore: actions.setWallet, loadWalletData: actions.loadWalletData };
	});
	//--------------------------------------

	const walletConnect = async (walletName: string, closeModal = true) => {

		console.log("WalletModalBtn - walletConnect: " + walletName)

		// setIsWorking(true)

		setWalletMessage("Connecting with " + walletName + "...")

		try {

			const walletApi = await window.cardano[walletName].enable()

			//console.log("WalletModalBtn - walletConnected1" )

			const lucid = await initializeLucid(walletApi)

			//console.log("WalletModalBtn - walletConnected2" )

			const adddressWallet = await lucid!.wallet.address()

			//const pkh = C.Address.from_bech32(adddressWallet).as_base()?.payment_cred().to_keyhash()?.to_hex();
			const pkh = lucid!.utils.getAddressDetails(adddressWallet)?.paymentCredential?.hash;

			console.log("WalletModalBtn - walletConnect: addr: " + adddressWallet)
			console.log("WalletModalBtn - walletConnect: pkh: " + pkh)
			// console.log("WalletModalBtn - walletConnect: swEnviarPorBlockfrost: " + savedSwEnviarPorBlockfrost)

			const protocolParameters = await lucid!.provider.getProtocolParameters();

			const walletStore = { connected: true, name: walletName, walletApi: walletApi, pkh: pkh, lucid: lucid, swEnviarPorBlockfrost: savedSwEnviarPorBlockfrost, protocolParameters: protocolParameters }

			//console.log("WalletModalBtn - setWalletStore")

			setWalletStore(walletStore)

			setSavedWalletConnected(true)
			setSavedWalletName(walletName)
			setSavedIsWalletFromSeed(false)

			await signIn('credentials', { pkh: pkh , redirect: false })

			//console.log("WalletModalBtn - setSavedWalletName")

			// console.log("WalletModalBtn : " + document.querySelector("#wallet-modal-toggle"))
			// console.log("WalletModalBtn : " + document.querySelector("wallet-modal-toggle"))

			// if (_isMounted) {
			// 	if (closeModal) {
			// 		(document.querySelector("#wallet-modal-toggle") as any).checked = false
			// 	}
			// }
			//if (_isMounted) 

			setWalletMessage("Loading Wallet info...")

			await loadWalletData(walletStore)

			setWalletMessage("Connected with " + walletName + "!")

			//console.log("WalletModalBtn - setWalletMessage")

		} catch (error) {

			console.error("WalletModalBtn - walletConnect Error2: " + error)

			setWalletMessage("Error connecting with " + walletName + ": " + error)

		}

		// setIsWorking(false)
	}

	const walletFromSeedConnect = async (walletName: string, closeModal = true) => {

		console.log("WalletModalBtn - walletMasterConnect")

		// setIsWorking(true)

		setWalletMessage("Connecting with " + walletName + "...")

		try {

			var walletSeed: string = ""

			if (walletName === "Master1") {
				walletSeed = walletMasterSeed1
			} else if (walletName === "Master2") {
				walletSeed = walletMasterSeed2
			}
			//const newBech32PrivateKey = C.PrivateKey.generate_ed25519().to_bech32()
			//const walletPrivateKey ="ed25519_sk10lc2huyqqx53qkcj8u9x794cesmtrpn95330aurcvkex8wmysljsz062s8" // walletMasterPrivateKey1
			//alert ("walletPrivateKey: " + walletPrivateKey)
			// const lucid = await initializeLucidWithWalletFromPrivateKey(walletPrivateKey)

			const lucid = await initializeLucidWithWalletFromSeed(walletSeed)

			//console.log("WalletModalBtn - walletConnected2" )

			const adddressWallet = await lucid!.wallet.address()

			//const pkh = C.Address.from_bech32(adddressWallet).as_base()?.payment_cred().to_keyhash()?.to_hex();
			const pkh = lucid!.utils.getAddressDetails(adddressWallet)?.paymentCredential?.hash;

			console.log("WalletModalBtn - walletConnect: addr: " + adddressWallet)
			console.log("WalletModalBtn - walletConnect: pkh: " + pkh)
			// console.log("WalletModalBtn - walletConnect: swEnviarPorBlockfrost: " + savedSwEnviarPorBlockfrost)

			// const pkh2 = addrToPubKeyHash (adddressWallet)
			// console.log("WalletModalBtn - walletConnect: pkh2: " + pkh2)

			// const add = pubKeyHashToAddress (pkh2!, 0)
			// console.log("WalletModalBtn - walletConnect: add: " + add)


			const protocolParameters = await lucid!.provider.getProtocolParameters();

			const walletStore = { connected: true, name: walletName, walletApi: undefined, pkh: pkh, lucid: lucid, swEnviarPorBlockfrost: savedSwEnviarPorBlockfrost, protocolParameters: protocolParameters }

			//console.log("WalletModalBtn - setWalletStore")

			setWalletStore(walletStore)

			setSavedWalletConnected(true)
			setSavedWalletName(walletName)
			setSavedIsWalletFromSeed(true)

			await signIn('credentials', { pkh: pkh , redirect: false })

			//console.log("WalletModalBtn - setSavedWalletName")

			// console.log("WalletModalBtn : " + document.querySelector("#wallet-modal-toggle"))
			// console.log("WalletModalBtn : " + document.querySelector("wallet-modal-toggle"))

			// if (_isMounted) {
			// 	if (closeModal) {
			// 		(document.querySelector("#wallet-modal-toggle") as any).checked = false
			// 	}
			// }
			//if (_isMounted) 

			setWalletMessage("Loading Wallet info...")

			await loadWalletData(walletStore)

			setWalletMessage("Connected with " + walletName + "!")

			//console.log("WalletModalBtn - setWalletMessage")

		} catch (error) {

			console.error("WalletModalBtn - walletConnect Error2: " + error)

			setWalletMessage("Error Connecting with " + walletName + ": " + error)

		}

		// setIsWorking(false)
	}


	const walletDisconnect = async (closeModal = true) => {

		console.log("WalletModalBtn - walletDisconnect")

		// setIsWorking(true)

		setWalletMessage("Disconnecting Wallet ...")

		try {

			const walletStore = { connected: false, name: '', walletApi: undefined, pkh: "", lucid: undefined, swEnviarPorBlockfrost: false, protocolParameters: undefined }

			setWalletStore(walletStore)

			setSavedWalletConnected(false)
			setSavedWalletName("")
			setSavedSwEnviarPorBlockfrost(false)
			setSavedIsWalletFromSeed(false)

			await signOut({ redirect: false })

			setWalletMessage("Wallet Disconnected!")

			//console.log("WalletModalBtn - setWalletMessage")


		} catch (error) {

			console.error("WalletModalBtn - walletDisconnect Error2: " + error)

			setWalletMessage("Error Disconnecting Wallet: " + error)

		}

		// setIsWorking(false)

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
			console.log("WalletModalBtn - POLLWALLETS Try again - Count: " + pollWalletsCount)

			setTimeout(async () => {
				console.log("WalletModalBtn - POLLWALLETS timeout call - Count:  " + pollWalletsCount)
				setPollWalletsCount(pollWalletsCount + 1)
				wallets = await pollWallets();
			}, 1000);
			return wallets;
		}

		console.log("WalletModalBtn - POLLWALLETS wallets: " + wallets)

		return wallets
	}

	const poolWalletsAndConnect = async () => {

		const availableWallets = await pollWallets();
		//iterate wallets
		for (const walletName of availableWallets) {
			setAvailableWallets((availableWallets: any) => ({ ...availableWallets, [walletName]: true }))
		}

		if (!walletStore.connected) {

			if (swSavedWalletConnected && savedWalletName != "") {
				if (savedIsWalletFromSeed) {
					try {
						await walletFromSeedConnect(savedWalletName)
					} catch (error) {
						console.error("WalletModalBtn - poolWalletsAndConnect - Error: " + error)
					}
				} else {
					if (window.cardano && searchValueInArray(availableWallets, savedWalletName)) {
						//si la wallet estaba conectada en la session anterior, tengo que reconectarla
						//fuerzo a que la wallet no este enabled ni conectada
						try {
							await walletConnect(savedWalletName, false)
						} catch (error) {
							console.error("WalletModalBtn - poolWalletsAndConnect - Error: " + error)
						}
					} else {

						console.log("WalletModalBtn - poolWalletsAndConnect: Not connecting to any wallet. Wallet of previus session not found: " + savedWalletName)

					}

				}

			} else {

				console.log("WalletModalBtn - poolWalletsAndConnect: Not connecting to any wallet, there were not previus session")

			}

		}
	}

	useEffect(() => {
		// console.log ("WalletModalBtn - useEffect1 - savedSwEnviarPorBlockfrost: " + savedSwEnviarPorBlockfrost )

		if (walletStore.connected && savedSwEnviarPorBlockfrost != walletStore.swEnviarPorBlockfrost) {
			if (savedIsWalletFromSeed) {
				try {
					walletFromSeedConnect(savedWalletName)
				} catch (error) {
					console.error("WalletModalBtn - useEffect1 - Error: " + error)
				}
			} else {
				try {
					walletConnect(walletStore.name, false)
				} catch (error) {
					console.error("WalletModalBtn - useEffect2 - Error: " + error)
				}
			}
		}
	}, [savedSwEnviarPorBlockfrost])

	useEffect(() => {

		//set_isMounted( true);
		//- IsWorking: "+ isWorking +" 
		// console.log ("WalletModalBtn - useEffect2 - savedSwEnviarPorBlockfrost: " + savedSwEnviarPorBlockfrost + " - swSavedWalletConnected: " + swSavedWalletConnected + " - savedWalletName: " + savedWalletName + " - walletStore.connected: " + walletStore.connected)

		poolWalletsAndConnect()

		//return () => { set_isMounted (false) };

	}, [])

	return (
		<div>


			<label htmlFor="wallet-modal-toggle" className="wallet__modal_button btn">

				<svg width="25" viewBox="0 0 23 18" fill="none" className={walletStore.connected ? "wallet__indicator" : ""} xmlns="http://www.w3.org/2000/svg">
					<path d="M1.98305 0.0142294L3.66212 0L2.82418 0.837942H1.66037C1.50204 0.986955 1.48968 1.16381 1.48968 1.30347C1.48968 1.45864 1.55047 1.62094 1.66037 1.67588L19.6918 1.66192C20.797 1.66106 21.6934 2.55674 21.6934 3.66192V7.61907H17.2372C16.1931 7.61907 15.3468 8.46543 15.3468 9.50947C15.3468 10.5908 16.2233 11.4674 17.3047 11.4674H21.6934V15.4106C21.6934 16.5151 20.798 17.4106 19.6934 17.4106H2C0.89543 17.4106 0 16.5151 0 15.4106V2.01416C0 0.916201 0.885136 0.0235337 1.98305 0.0142294Z" fill="currentColor" />
					<path d="M20.9873 11.1415H17.3562C16.4692 11.1415 15.7501 10.4224 15.7501 9.53541C15.7501 8.64841 16.4692 7.92935 17.3562 7.92935H20.9873C21.8743 7.92935 22.5933 8.64841 22.5933 9.53541C22.5933 10.4224 21.8743 11.1415 20.9873 11.1415Z" fill="currentColor" />
					<circle cx="17.2398" cy="9.52771" r="0.682768" />
				</svg>
			</label>

			<input type="checkbox" id="wallet-modal-toggle" className="modal__toggle" />

			<div id="wallet-modal" className="modal">
				<label htmlFor="wallet-modal-toggle" className="modal__shade"></label>

				<div className="modal__content">

					<div className="wallet__content">
						<h3>Wallet ({process.env.NEXT_PUBLIC_USE_MAINNET === "true"?"Mainnet":"Preview"})</h3>
						<br></br>
						{walletMessage ? <div>{walletMessage}<br></br><br></br></div> : <></>}

						{walletStore.connected ?
							<>
								<div>Pkh: {isWalletDataLoaded ? walletStore.pkh : <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />} </div>
								<div>UTxOs: {isWalletDataLoaded ? uTxOsAtWallet.length : <Skeleton width={'50%'} baseColor='#e2a7a7' highlightColor='#e9d0d0' />}</div>
								<br></br>
							</>
							:
							<></>
						}
						<label>
							<input
								type="checkbox"
								checked={savedSwEnviarPorBlockfrost}
								onChange={handleChangeSavedSwEnviarPorBlockfrost}
							/>
							Usar BlockFrost API en lugar de la Wallet para realizar las transacciones
						</label>
						<br></br>

						<div className="wallet__buttons vr">
							{walletStore.connected ?
								<button
									key={walletStore.pkh}
									className="btn wallet__button"
									onClick={async (e) => {
										try {
											e.preventDefault()
											walletDisconnect(false)
										} catch (error) {
											console.error("WalletModalBtn - Error disconnecting wallet: " + error)
										}
									}}
								>
									<span>
										Disconnect Wallet
									</span>
								</button>
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
																walletConnect(wallet)
															} catch (error) {
																console.error("WalletModalBtn - Error connecting with wallet: " + error)
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
																console.error("WalletModalBtn - Error installing with wallet: " + error)
															}
														}}
													>
														<span >
															{wallet} - Install
														</span>
													</button>
												)		
											}
											
										})
									}
									{/* <button
										key={"Wallet Master 1"}
										className="btn wallet__button"
										onClick={async (e) => {
											try {
												e.preventDefault()
												walletFromSeedConnect("Master1", false)
											} catch (error) {
												console.error("WalletModalBtn - Error connecting with wallet from seed" + error)
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
												console.error("WalletModalBtn - Error connecting with wallet from seed" + error)
											}
										}}
									>
										<span>
											Wallet Master 2
										</span>
									</button> */}
								</>
							}
						</div>
					</div>
				</div>
			</div>
		</div>
	)

}


