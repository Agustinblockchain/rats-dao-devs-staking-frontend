//--------------------------------------
import { Assets } from 'lucid-cardano';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import 'react-loading-skeleton/dist/skeleton.css';
import { apiDeleteAllDatumDB, apiGetDatumsCountDB } from '../stakePool/apis';
import { EUTxO } from '../types';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { toJson } from '../utils/utils';
import ActionWithInputModalBtn from './ActionWithInputModalBtn';
//--------------------------------------

export default function SettingsForm() {

	const router = useRouter();

	const [isWorking, setIsWorking] = useState("")
	const isCancelling = useRef(false);
	const isWorkingInABuffer = useRef(false);
	const setIsWorkingInABuffer = (value: boolean) => {
		isWorkingInABuffer.current = value
	}
	const setIsCanceling = (value: boolean) => {
		isCancelling.current = value
	}

	const [actionMessage, setActionMessage] = useState("")
	const [actionHash, setActionHash] = useState("")

	const [datumsCount, setDatumsCount] = useState("0")

	useEffect(() => {
		geDatumsCount()
	}, [])

	const geDatumsCount = async () => {
		console.log("SettingsForm - geDatumsCount - INIT" )
		try {
			const datumsCount = await apiGetDatumsCountDB()
			setDatumsCount(datumsCount)
		} catch (error: any) {
			console.log("SettingsForm - geDatumsCount - error: " + error)
		}
	}

	//--------------------------------------

	const handleSetIsWorking = async (isWorking: string) => {
		setIsWorking(isWorking)
		return isWorking
	}

	const handleCancel = async () => {
		if (!isCancelling.current && isWorkingInABuffer.current) {
			setActionMessage(actionMessage + " (Canceling when this Tx finishes)")
			setIsCanceling(true)
		}
	}


	//--------------------------------------

	const masterShowPoolAction = async (poolInfo?: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) => {

		console.log("StakingPoolAdmin - Show Pool - " + toJson(poolInfo?.name))

		setActionMessage("Cambiando estado de la Pool, please wait...")

		try {
			await apiDeleteAllDatumDB()

			if (!isWorkingInABuffer.current) setIsWorking("")

			await geDatumsCount()

			return "Deleted All Datums in Database";

		} catch (error: any) {
			if (!isWorkingInABuffer.current) setIsWorking("")
			throw error
		}

	}

	//--------------------------------------

	return (
		<div className="section__text pool">
			<div className="pool__data">
				<div className="pool__data_item">
						<h4 className="pool_title">Settings</h4>
						
						<div className="pool__data_item">
							<br></br>
							There are: {datumsCount} datums in Database
						</div>

						<ActionWithInputModalBtn 
							action={masterShowPoolAction} 
							postActionSuccess={undefined}
							postActionError={undefined}
							setIsWorking={handleSetIsWorking} 
							actionName="Delete Datums" actionIdx="1" messageFromParent={actionMessage} hashFromParent={actionHash} isWorking={isWorking} 
							description={'<p className="info" style="text-align: center;">Delete All Datums in Database</p>'}
							swEnabledBtnOpenModal={true} 
							swEnabledBtnAction={true} 
							swShow={true}
							swHash={false} 
						/>
				</div>
			</div>
		</div>
	)
}


