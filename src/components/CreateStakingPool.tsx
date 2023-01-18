//--------------------------------------
import Image from 'next/image';
import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { Assets, UTxO } from 'lucid-cardano';
import 'react-loading-skeleton/dist/skeleton.css';
import { splitUTxOs } from "../stakePool/endPoints - splitUTxOs";
import { apiCreateStakingPoolDB, apiGetTokenMetadata, getEstadoDeployAPI } from "../stakePool/apis";
import { ADA_Decimals, ADA_UI, maxMasters } from '../types/constantes';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { pushSucessNotification } from "../utils/pushNotification";
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import LoadingSpinner from "./LoadingSpinner";
import { AssetClass, EUTxO } from '../types';
import { newTransaction } from '../utils/cardano-helpersTx';
import { toJson } from '../utils/utils';
import { getDecimalsInMetadata } from '../utils/cardano-helpers';

//--------------------------------------

export default function CreateStakingPool( ) {

	const walletStore = useStoreState(state => state.wallet)

	const [stakingPoolCreated_, setStakingPoolCreated_] = useState<StakingPoolDBInterface | undefined>(undefined)
	const [stakingPoolCreated, setStakingPoolCreated] = useState<StakingPoolDBInterface | undefined>(undefined)

	const [swDummyStakingPool, setSwDummyStakingPool] = useState(false)

	const handleChangeSwDummyStakingPoolt = () => {
		setSwDummyStakingPool(!swDummyStakingPool);
	};

	const [nombrePool, setNombrePool] = useState("RATS")
	const [image, setImage] = useState("https://ratsdao.io/img/ratsdao.png")
	
	const [masters, setMasters] = useState(walletStore.pkh)
	const [poolID_TxOutRef, setPoolID_TxOutRef] = useState("")
	const [beginAt, setBeginAt] = useState(Date.now().toString())
	const [deadline, setppDeadline] = useState((parseInt(Date.now().toString()) + 1000000000).toString())

	const [graceTime, setppGraceTime] = useState((1000 * 60 * 60 * 24 * 15).toString()) // 15 dias

	const [staking_CS, setppStakingCS] = useState("")
	const [harvest_CS, setppHarvestCS] = useState("")

	const [staking_TN, setppStakingTN] = useState("")
	const [harvest_TN, setppHarvestTN] = useState("")

	const [staking_UI, setStakingUnitForShowing] = useState(ADA_UI)
	const [harvest_UI, setHarvestUnitForShowing] = useState(ADA_UI)

	const [staking_Decimals, setppStakingDecimals] = useState("0")
	const [harvest_Decimals, setppHarvestDecimals] = useState("0")

	const [interest, setppInterest] = useState((365 * 24 * 60).toString()) //uno por minuto

	const [dateInputValueppBeginAt, setDateInputValueppBeginAt] = useState(new Date(parseInt(beginAt)))
	const [dateInputValueppDeadline, setDateInputValueppDeadline] = useState(new Date(parseInt(deadline)))

	const [uTxOsAtWalllet, setUTxOsAtWalllet] = useState<UTxO[]>([])
	const [isUTxOsFromWalletLoading, setIsUTxOsFromWalletLoading] = useState(false)
	const [isDecimalsInMetadataLoading, setIsDecimalsInMetadataLoading] = useState(false)
	
	const [isWorking, setIsWorking] = useState("")
	const [actionMessage, setActionMessage] = useState("")
	const [actionHash, setActionHash] = useState("")

	const getUTxOsFromWallet = async () => {
		console.log("CreateStakingPool - getUTxOsFromWallet")
		if (walletStore.connected) {
			const lucid = walletStore.lucid
			const uTxOs = await lucid!.wallet?.getUtxos();
			setUTxOsAtWalllet(uTxOs)
			console.log("CreateStakingPool - uTxOs.length: " + uTxOs.length)
			return uTxOs
		}
		return []
	}

	const getPoolID_TxOutRef = async () => {
		console.log("CreateStakingPool - getPoolID_TxOutRef")
		if (walletStore.connected) {
			const lucid = walletStore.lucid
			setIsUTxOsFromWalletLoading(true)
			const uTxOs = await getUTxOsFromWallet()
			setIsUTxOsFromWalletLoading(false)
			console.log("CreateStakingPool - uTxOsAtWalllet.length: " + uTxOs.length)
			if (uTxOs.length > 0){
				setPoolID_TxOutRef(uTxOs[0].txHash + "#" + uTxOs[0].outputIndex)
			}
		}
	}

	const getDataFromWallet = async () => {
		console.log("CreateStakingPool - getDataFromWallet")
		if (walletStore.connected) {
			if (masters === ""){
				setMasters(walletStore.pkh)
			}
			if (poolID_TxOutRef === "") {
				await getPoolID_TxOutRef()
			} else {
				await getUTxOsFromWallet()
			}
		}
	}

	useEffect(() => {
		// console.log("CreateStakingPool - useEffect - walletStore.connected: " + walletStore.connected)
		if (walletStore.connected){
			getDataFromWallet()
		}
	}, [walletStore])

	const handleSetIsWorking = async (isWorking: string) => {
		console.log("CreateStakingPool - handleCallback isWorking: ", isWorking)
		setIsWorking(isWorking)
		return isWorking
	}
	
	//--------------------------------------

	const IniciarPoolAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("CreateStakingPool - Iniciar Pool Action")

		window.location.href = "/admin#" + poolInfo!.name;
	}

	const createNewPoolAction = async () => {

		console.log("CreateStakingPool - Create New StakingPool Files")

		setStakingPoolCreated(undefined)
	}

	const createPoolFilesAction = async () => {

		console.log("CreateStakingPool - Create StakingPool Files")

		setActionMessage("Creating Smart Contracts, please wait...")

		const timeoutGetEstadoDeploy = setInterval(async function () {
			const message = await getEstadoDeployAPI(nombrePool)
			setActionMessage("Creating Smart Contracts: " + message)

			if (message.includes("Done!")) {
				clearInterval(timeoutGetEstadoDeploy)
				setActionMessage("Smart Contracts created!")
			}
		}, 4000);

		try {

			let data = {
				nombrePool: nombrePool,
				image: image,

				swDummyStakingPool: swDummyStakingPool,

				pkh: walletStore.pkh,

				masters: masters,
				poolID_TxOutRef: poolID_TxOutRef,
				beginAt: beginAt,
				deadline: deadline,
				graceTime: graceTime,
				staking_UI: staking_UI,
				staking_CS: staking_CS,
				staking_TN: staking_TN,
				harvest_UI: harvest_UI,
				harvest_CS: harvest_CS,
				harvest_TN: harvest_TN,

				staking_Decimals: staking_Decimals,
				harvest_Decimals: harvest_Decimals,
				
				interest: interest
			}

			const stakingPool = await apiCreateStakingPoolDB(data)
			setActionMessage("Smart Contracts created!")
            clearInterval(timeoutGetEstadoDeploy)
            setTimeout(setStakingPoolCreated, 3000, stakingPool);
            setIsWorking("")
			return "Smart Contracts created, redirecting page...";
		} catch (error) {
			clearInterval(timeoutGetEstadoDeploy)
			setIsWorking("")
			throw error
		}
	}

	//--------------------------------------

	const splitUTxOsAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {
		return await newTransaction ("CreateStakingPool - Split Wallet UTxOs", walletStore, poolInfo, splitUTxOs, false, setActionMessage, setActionHash, setIsWorking, eUTxOs_Selected, assets) 
	}

	//--------------------------------------
	
	return (
		<>

			{stakingPoolCreated ?
				<div >
					
					<br></br>
					<button className="btn btnStakingPool"
						onClick={(e) => {
								e.preventDefault()
								IniciarPoolAction(stakingPoolCreated)
							}
						}
					>Prepare Pool
					</button>
					<br></br>
					<div>

					<li className="info">Prepare your newly created Pool immediately.</li>
					<li className="info">Avoid making other Transactions as the Contract is dependent on a specific UTxO to mint the PoolID NFT that should not be consumed before.</li>
					</div>
					<br></br>

					<button className="btn btnStakingPool"
						onClick={(e) => {
							e.preventDefault()
							createNewPoolAction()
						}
						}
					>New Staking Pool
					</button>

				</div>
				:
				<>
					<div className="section__text pool">

						<div className="pool__data">
							<div className="pool__image pool__data_item">
								<Image width={126} height={126} src="https://ratsdao.io/img/ratsdao.png" />
							</div>

							<div className="pool__action_card pool__data_item">

								<div className="pool__flex_gap"></div>
								<div className="pool__stat">



									<div className="pool__stat-actions">

										<form>
											<h3 className="pool__stat-title">Staking Pool</h3>
											<br></br>

											<h4 className="pool__stat-title">Name</h4>
											<input name='nombrePool' value={nombrePool} style={{ width: 400, fontSize: 12 }} onChange={(event) => setNombrePool(event.target.value)}  ></input>
											<br></br><br></br>

											<h4 className="pool__stat-title">Image</h4>
											<input name='image' value={image} style={{ width: 400, fontSize: 12 }} onChange={(event) => setImage(event.target.value)}  ></input>
											<br></br><br></br>

											<h4 className="pool__stat-title">Masters</h4>
											<input name='ppMasters' value={masters} style={{ width: 400, fontSize: 12 }} onChange={(event) => setMasters(event.target.value)}  ></input>
											<li className="info">Separate by comma the different <b>PaymentPubKeyHashes</b>, must by a Hexadecimal string of 56 characteres lenght each</li>
											<li className="info">Up to a maximum of {maxMasters}</li>
											<br></br>

											<h4 className="pool__stat-title">UTxO for minting NFT PoolID</h4><p>txHash#OutputIndex</p>
											<input name='ppPoolID_TxOutRef' value={poolID_TxOutRef} onChange={(event) => setPoolID_TxOutRef(event.target.value)} style={{ width: 335, fontSize: 12 }}></input>
											<button style={{ width: 65}} onClick={async (event) => {
												setPoolID_TxOutRef(""); 
												event.preventDefault(); 
												await getPoolID_TxOutRef()

											}}>Refresh</button>
											{isUTxOsFromWalletLoading  ? 
												<div style={{ position: 'relative', top: -20, left: 3 }}><LoadingSpinner size={15} border={3} align="left" /></div> 
												: 
												<></>
											}

											{uTxOsAtWalllet?.length > 1 ?
												<div>
													<li className="info">You have {uTxOsAtWalllet.length} UTxOs available.</li>
												</div>
												:
												<div>

													<li className="info">You have {uTxOsAtWalllet.length} UTxOs available.</li>
													<li className="info">Use the Split Wallet UTxOs button to generate more UTxo available in your Wallet.</li>
												</div>
											}
											<br></br>

											<h3 className="pool__stat-title">Dates</h3>
											<br></br>

											<h4 className="pool__stat-title">Begin At</h4>
											<input name='beginAt' value={beginAt} style={{ width: 400, fontSize: 12 }} onChange={(event) => { setBeginAt(event.target.value); setDateInputValueppBeginAt(new Date(parseInt(event.target.value))) }} ></input>
											<LocalizationProvider dateAdapter={AdapterDateFns}>
												<DateTimePicker
													renderInput={(props) => <TextField {...props} />}
													value={dateInputValueppBeginAt}
													onChange={(newValue) => {
														setBeginAt(format(newValue!, 'T'));
														setDateInputValueppBeginAt(newValue!)
													}}
												/>
											</LocalizationProvider>
											<br></br><br></br>

											<h4 className="pool__stat-title">Deadline</h4>
											<input name='deadline' value={deadline} style={{ width: 400, fontSize: 12 }} onChange={(event) => { setppDeadline(event.target.value); setDateInputValueppDeadline(new Date(parseInt(event.target.value))) }} ></input>
											<LocalizationProvider dateAdapter={AdapterDateFns}>
												<DateTimePicker
													renderInput={(props) => <TextField {...props} />}
													value={dateInputValueppDeadline}
													onChange={(newValue) => {
														setppDeadline(format(newValue!, 'T'));
														setDateInputValueppDeadline(newValue!)
													}}
												/>
											</LocalizationProvider>
											<li className="info">After the Deadline, users will not accumulate new rewards.</li>
											<li className="info">Users will have a Grace Time to collect their accumulated rewards until Deadline.</li>
											<br></br>

											<h4 className="pool__stat-title">Grace Time</h4>
											<input name='ppGraceTieme' value={graceTime} style={{ width: 400, fontSize: 12 }} onChange={(event) => setppGraceTime(event.target.value)}  ></input>
											<li className="info">Period for users to collect their rewards after the Deadline or forced close, in milliseconds.</li>
											<li className="info">(To use 15 days, enter: 1000*60*60*24*15 = 1296000000)</li>
											<li className="info">(To use 1 day, enter: 1000*60*60*24 = 86400000)</li>
											<li className="info">(To use 1 hour, enter: 1000*60*60 = 3600000)</li>
											<li className="info">(To use 15 minutes, enter: 1000*60*15 = 900000)</li>
											
											<br></br>
											
											<h3 className="pool__stat-title">Staking Unit</h3>
											<br></br>

											<h4 className="pool__stat-title">Name to Show in User Interface </h4>
											<input name='staking_UI' value={staking_UI} style={{ width: 400, fontSize: 12 }} onChange={(event) => setStakingUnitForShowing(event.target.value)}  ></input>
											<li className="info">Will be used to display a friendly name of the chosen unit.</li>
											<br></br>

											<h4 className="pool__stat-title">Currency Symbol</h4>
											<input name='staking_CS' value={staking_CS} style={{ width: 400, fontSize: 12 }} onChange={(event) => setppStakingCS(event.target.value)}  ></input>
											<li className="info">Leave empty to use { ADA_UI }</li>
											<li className="info">If you want to use another token you must enter its <b>Policy Id</b>, must by a Hexadecimal string of 56 characteres lenght</li>
											<br></br>
											
											<h4 className="pool__stat-title">Token Name</h4>
											<input name='staking_TN' value={staking_TN} style={{ width: 400, fontSize: 12 }} onChange={(event) => setppStakingTN(event.target.value)}  ></input>
											<li className="info">Must leave empty if you choose to use { ADA_UI } as Currency Symbol</li>
											<li className="info">Leave empty to use any Token Name within the chossen Currency Symbol</li>
											<li className="info">If you want to an specific Token Name you must enter its <b>Token Name</b> in Hexadecimal</li>
											<br></br>

											<h4 className="pool__stat-title">Decimals</h4>
											<input name='staking_Decimals' value={staking_Decimals} style={{ width: 315, fontSize: 12 }} onChange={(event) => setppStakingDecimals(event.target.value)}  ></input>
											<button style={{ width: 85}} onClick={async (event) => {
												
												setIsDecimalsInMetadataLoading(true)
												event.preventDefault(); 
												setppStakingDecimals(""); 
												setppStakingDecimals((await getDecimalsInMetadata(staking_CS, staking_TN)).toString())
												setIsDecimalsInMetadataLoading(false)

											}}>Metadata</button>
											{isDecimalsInMetadataLoading  ? <div style={{ position: 'relative', top: -20, left: 3 }}><LoadingSpinner size={15} border={3} align="left" /></div> : <></>}
											<li className="info">Decimals are only used for displaying in the user interface</li>	
											<li className="info">Inside the system and calculations, all numbers are rounded and integers</li>	
											<li className="info">If you already filled the currency symbol and token name you can try to get the decimals of this token from the metadata online</li>	


											<br></br>

											<h3 className="pool__stat-title">Harvest Unit</h3>
											<br></br>
											
											<h4 className="pool__stat-title">Name to Show in User Interface </h4>
											<input name='harvest_UI' value={harvest_UI} style={{ width: 400, fontSize: 12 }} onChange={(event) => setHarvestUnitForShowing(event.target.value)}  ></input>
											<li className="info">Will be used to display a friendly name of the chosen unit.</li>
											<br></br>

											<h4 className="pool__stat-title">Currency Symbol</h4>
											<input name='harvest_CS' value={harvest_CS} style={{ width: 400, fontSize: 12 }} onChange={(event) => setppHarvestCS(event.target.value)}  ></input>
											<li className="info">Leave empty to use { ADA_UI }</li>
											<li className="info">If you want to use another token you must enter its <b>Policy Id</b>, must by a Hexadecimal string of 56 characteres lenght</li>
											<br></br>

											<h4 className="pool__stat-title">Token Name</h4>
											<input name='harvest_TN' value={harvest_TN} style={{ width: 400, fontSize: 12 }} onChange={(event) => setppHarvestTN(event.target.value)}  ></input>
											<li className="info">Must leave empty if you choose to use { ADA_UI } as Currency Symbol</li>
											<li className="info">Can't be empty if you choose to use another Currency Symbol</li>
											<li className="info">Enter the <b>Token Name</b> in Hexadecimal</li>
											<br></br>

											<h4 className="pool__stat-title">Decimals</h4>
											<input name='harvest_Decimals' value={harvest_Decimals} style={{ width: 315, fontSize: 12 }} onChange={(event) => setppHarvestDecimals(event.target.value)}  ></input>
											<button style={{ width: 85}} onClick={async (event) => {
												
												setIsDecimalsInMetadataLoading(true)
												event.preventDefault(); 
												setppHarvestDecimals("")
												setppHarvestDecimals((await getDecimalsInMetadata(harvest_CS,harvest_TN)).toString())
												setIsDecimalsInMetadataLoading(false)


											}}>Metadata</button>
											{isDecimalsInMetadataLoading  ? <div style={{ position: 'relative', top: -20, left: 3 }}><LoadingSpinner size={15} border={3} align="left" /></div> : <></>}
											<li className="info">Decimals are only used for displaying in the user interface</li>	
											<li className="info">Inside the system and calculations, all numbers are rounded and integers</li>	
											<li className="info">If you already filled the currency symbol and token name you can try to get the decimals of this token from the metadata online</li>	

											<br></br>

											<h3 className="pool__stat-title">Rewards</h3>
											<br></br>

											<h4 className="pool__stat-title">Anual pay of Havest Unit per each Staking Unit</h4>

											<input name='interest' value={interest} style={{ width: 400, fontSize: 12 }} onChange={(event) => setppInterest(event.target.value)}  ></input>
											<li className="info">(To have 1 per year, enter: 1)</li>
											<li className="info">(To have 1 per month, enter: 1*12 = 12)</li>
											<li className="info">(To have 1 per day, enter: 1*365 = 365)</li>
											<li className="info">(To have 1 per hour, enter: 1*365*24 = 8760)</li>
											<li className="info">(To have 1 per minute, enter: 1*365*24*60 = 525600)</li>
											<li className="info">(To have 1 per second, enter: 1*365*24*60*60 = 31536000)</li>
											<li className="info">The Unit of the Asset refers to the smallest division of the token when using decimals</li>
											<li className="info">For example, if you are using 6 decimals like in ADA and you enter 1, you are referring to 0.000001 ADA or just 1 lovelace</li>
											<br></br>

											<label>
												<input
													type="checkbox"
													checked={swDummyStakingPool}
													onChange={handleChangeSwDummyStakingPoolt}
												/>
												Dummy Staking Pool
											</label>

										</form>

										<ActionWithInputModalBtn 
											action={createPoolFilesAction} 
											postActionSuccess={undefined}
											postActionError={undefined}
											setIsWorking={handleSetIsWorking} 
											actionName="Create Staking Pool" actionIdx="1" messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
											description={'<li className="info">Prepare your newly created Pool immediately.</li>\
											<li className="info">Avoid making other Transactions as the Contract is dependent on a specific UTxO to mint the PoolID NFT that should not be consumed before.</li>'}
											swEnabledBtnOpenModal={walletStore.connected && uTxOsAtWalllet.length > 0} 
											swEnabledBtnAction={walletStore.connected && uTxOsAtWalllet.length > 0} 
											swShow={true}
											swHash={false} 
											/>

										<ActionWithInputModalBtn 
											action={splitUTxOsAction} 
											postActionSuccess={getDataFromWallet}
											postActionError={getDataFromWallet}
											setIsWorking={handleSetIsWorking}
											actionName="Split Wallet UTxOs" actionIdx="1" messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
											description={'<p className="info" style="text-align: center;">It is recommended to Split your Wallet\'s UTxOs (Unspent Transaction Outputs) into smaller amounts. This will make it easier to use them as collateral for Smart Contracts and will provide more flexibility in managing your funds.</p>'}
											swEnabledBtnOpenModal={walletStore.connected}
											swEnabledBtnAction={walletStore.connected}
											swShow={true}
											swHash={true}
											/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</>

			}
		</>
	)
}


