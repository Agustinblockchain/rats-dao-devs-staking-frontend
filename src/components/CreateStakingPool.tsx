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
import { apiCreateStakingPoolDB, getEstadoDeployAPI } from "../stakePool/apis";
import { maxMasters } from '../types/constantes';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { pushSucessNotification } from "../utils/pushNotification";
import { useStoreState } from '../utils/walletProvider';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
import ActionWithMessageModalBtn from './ActionWithMessageModalBtn';
import LoadingSpinner from "./LoadingSpinner";
import { EUTxO } from '../types';
import { newTransaction } from '../utils/cardano-helpersTx';

//--------------------------------------

export default function CreateStakingPool( ) {

	const walletStore = useStoreState(state => state.wallet)

	const [stakingPoolCreated, setStakingPoolCreated] = useState<StakingPoolDBInterface | undefined>(undefined)

	const [swDummyStakingPool, setSwDummyStakingPool] = useState(false)

	const handleChangeSwDummyStakingPoolt = () => {
		setSwDummyStakingPool(!swDummyStakingPool);
	};

	const [nombrePool, setNombrePool] = useState("RATS")
	const [masters, setMasters] = useState(walletStore.pkh)
	const [poolID_TxOutRef, setPoolID_TxOutRef] = useState("")
	const [beginAt, setBeginAt] = useState(Date.now().toString())
	const [deadline, setppDeadline] = useState((parseInt(Date.now().toString()) + 1000000000).toString())

	const [graceTime, setppGraceTime] = useState((1000 * 60 * 60 * 24 * 15).toString()) // 15 dias

	const [staking_CS, setppStakingCS] = useState("")
	const [harvest_CS, setppHarvestCS] = useState("")

	const [staking_TN, setppStakingTN] = useState("")
	const [harvest_TN, setppHarvestTN] = useState("")

	const [staking_UI, setStakingUnitForShowing] = useState("ADA (lovelace)")
	const [harvest_UI, setHarvestUnitForShowing] = useState("ADA (lovelace)")

	const [interest, setppInterest] = useState((365 * 24 * 60).toString()) //uno por minuto

	const [dateInputValueppBeginAt, setDateInputValueppBeginAt] = useState(new Date(parseInt(beginAt)))
	const [dateInputValueppDeadline, setDateInputValueppDeadline] = useState(new Date(parseInt(deadline)))

	const [uTxOsAtWalllet, setUTxOsAtWalllet] = useState<UTxO[]>([])
	const [isUTxOsFromWalletLoading, setIsUTxOsFromWalletLoading] = useState(false)

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
				interest: interest
			}

			const stakingPool = await apiCreateStakingPoolDB(data)

			setActionMessage("Smart Contracts created!")

            pushSucessNotification("Creating Smart Contracts ", "Smart Contracts created!", false);

            setTimeout(setStakingPoolCreated, 3000, stakingPool);

            clearInterval(timeoutGetEstadoDeploy)
            setIsWorking("")

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

						<li className="info">You must prepare the Pool immediately.</li>
						<li className="info">You should not do any other txs now, because you risk consuming the uTxO you chose to mint the NFT PoolID.</li>

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
											<h4 className="pool__stat-title">Staking Pool Name</h4>
											<input name='nombrePool' value={nombrePool} style={{ width: 600, fontSize: 12 }} onChange={(event) => setNombrePool(event.target.value)}  ></input>
											<br></br><br></br>

											<h4 className="pool__stat-title">Masters</h4><input name='ppMasters' value={masters} style={{ width: 600, fontSize: 12 }} onChange={(event) => setMasters(event.target.value)}  ></input>
											<li className="info">Separate by comma the different <b>PaymentPubKeyHashes</b>, must by a Hexadecimal string of 56 characteres lenght each</li>
											<li className="info">Up to a maximum of {maxMasters}</li>
											<br></br>

											<h4 className="pool__stat-title">UTxO for minting NFT PoolID</h4><p>txHash#OutputIndex</p>
											<input name='ppPoolID_TxOutRef' value={poolID_TxOutRef} onChange={(event) => setPoolID_TxOutRef(event.target.value)} style={{ width: 600, fontSize: 12 }}></input>
											{isUTxOsFromWalletLoading ? <div style={{ position: 'relative', top: -20, left: 10 }}><LoadingSpinner size={15} border={3} /></div> : <></>}

											<button onClick={async (event) => {
												setPoolID_TxOutRef(""); event.preventDefault(); await getPoolID_TxOutRef()

											}}>Refresh</button>



											{uTxOsAtWalllet?.length > 1 ?
												<div>
													<li className="info">You have {uTxOsAtWalllet.length} UTxOs available.</li>
												</div>
												:
												<div>

													<li className="info">You have {uTxOsAtWalllet.length} UTxOs available.</li>
													<li className="info">Use the Split Wallet UTxOs button to generate more UTxo available in your wallet.</li>
												</div>
											}
											<br></br>

											<h4 className="pool__stat-title">Begin At</h4>
											<input name='beginAt' value={beginAt} style={{ width: 600, fontSize: 12 }} onChange={(event) => { setBeginAt(event.target.value); setDateInputValueppBeginAt(new Date(parseInt(event.target.value))) }} ></input>
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
											<br></br>

											<h4 className="pool__stat-title">Deadline</h4>
											<input name='deadline' value={deadline} style={{ width: 600, fontSize: 12 }} onChange={(event) => { setppDeadline(event.target.value); setDateInputValueppDeadline(new Date(parseInt(event.target.value))) }} ></input>
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
											<input name='ppGraceTieme' value={graceTime} style={{ width: 600, fontSize: 12 }} onChange={(event) => setppGraceTime(event.target.value)}  ></input>
											<li className="info">Period for users to collect their rewards after the Deadline or forced close, in milliseconds. For example: 1000*60*60*24*15 = 1296000000 = 15 days</li>
											<br></br>

											<h4 className="pool__stat-title">Staking Unit: Name to Show in User Interface </h4><input name='staking_UI' value={staking_UI} style={{ width: 600, fontSize: 12 }} onChange={(event) => setStakingUnitForShowing(event.target.value)}  ></input>
											<li className="info">Will be used to display a friendly name of the chosen unit.</li>

											<h4 className="pool__stat-title">Staking Unit: Currency Symbol</h4>
											<input name='staking_CS' value={staking_CS} style={{ width: 600, fontSize: 12 }} onChange={(event) => setppStakingCS(event.target.value)}  ></input>
											<li className="info">Leave empty to use ADA (lovelace)</li>
											<li className="info">If you want to use another token you must enter its <b>Policy Id</b>, must by a Hexadecimal string of 56 characteres lenght</li>

											<h4 className="pool__stat-title">Staking Unit: Token Name</h4><input name='staking_TN' value={staking_TN} style={{ width: 600, fontSize: 12 }} onChange={(event) => setppStakingTN(event.target.value)}  ></input>
											<li className="info">Must leave empty if you choose to use ADA (lovelace) as Currency Symbol</li>
											<li className="info">Leave empty to use any Token Name within the chossen Currency Symbol</li>
											<li className="info">If you want to an specific Token Name you must enter its <b>Token Name</b> in Hexadecimal</li>

											<br></br>

											<h4 className="pool__stat-title">Harvest Unit: Name to Show in User Interface </h4><input name='harvest_UI' value={harvest_UI} style={{ width: 600, fontSize: 12 }} onChange={(event) => setHarvestUnitForShowing(event.target.value)}  ></input>
											<li className="info">Will be used to display a friendly name of the chosen unit.</li>

											<h4 className="pool__stat-title">Harvest Unit: Currency Symbol</h4><input name='harvest_CS' value={harvest_CS} style={{ width: 600, fontSize: 12 }} onChange={(event) => setppHarvestCS(event.target.value)}  ></input>
											<li className="info">Leave empty to use ADA (lovelace)</li>
											<li className="info">If you want to use another token you must enter its <b>Policy Id</b>, must by a Hexadecimal string of 56 characteres lenght</li>

											<h4 className="pool__stat-title">Harvest Unit: Token Name</h4><input name='harvest_TN' value={harvest_TN} style={{ width: 600, fontSize: 12 }} onChange={(event) => setppHarvestTN(event.target.value)}  ></input>
											<li className="info">Must leave empty if you choose to use ADA (lovelace) as Currency Symbol</li>
											<li className="info">Can't be empty if you choose to use another Currency Symbol</li>
											<li className="info">Enter the <b>Token Name</b> in Hexadecimal</li>

											<br></br>

											<h4 className="pool__stat-title">Anual pay of Havest Unit per each Staking Unit</h4>

											<input name='interest' value={interest} style={{ width: 600, fontSize: 12 }} onChange={(event) => setppInterest(event.target.value)}  ></input>
											<li className="info">(To have 1 per year, enter: 1)</li>
											<li className="info">(To have 1 per month, enter: 1*12 = 12)</li>
											<li className="info">(To have 1 per day, enter: 1*365 = 365)</li>
											<li className="info">(To have 1 per hour, enter: 1*365*24 = 8760)</li>
											<li className="info">(To have 1 per minute, enter: 1*365*24*60 = 525600)</li>
											<li className="info">(To have 1 per second, enter: 1*365*24*60*60 = 31536000)</li>

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

										<ActionWithMessageModalBtn 
											action={createPoolFilesAction} 
											postAction={undefined}
											description={'<li className="info">After creating the Pool you should prepare it immediately.</li>\
											<li className="info">You should not make other transactions because the contract was created depending on a specific UTxO that should not be consumed before (UTxO to mint the PoolID NFT)</li>\
											<li className="info">After finishing creating the Pool you will be redirected <a href="/admin" style={{ textDecoration: \'underline\' }}>here</a> to prepare it and have the first Funds added.</li>'}
											swHash={false} 
											enabled={walletStore.connected && uTxOsAtWalllet.length > 0} 
											show={true}
											actionIdx="1" actionName="Create Staking Pool" messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
											setIsWorking={handleSetIsWorking} />
										
										<ActionWithMessageModalBtn 
											action={splitUTxOsAction} 
											postAction={getDataFromWallet}
											description={'<li className="info">It is generally a good practice to split your wallet\'s UTXOs (unspent transaction outputs) into smaller amounts.</li> \
											<li className="info">Having smaller UTXOs with only ADA amounts can make it easier to use them as collateral for smart contracts.</li>'}
											swHash={true}
											enabled={walletStore.connected}
											show={true}
											actionName="Split Wallet UTxOs" actionIdx="1" messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
											setIsWorking={handleSetIsWorking} />
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


