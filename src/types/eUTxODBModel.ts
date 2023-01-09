
import { Schema, model, models } from 'mongoose';
import { toJson } from '../utils/utils';
import { txConsumingTime, txPreparingTime } from './constantes';
import { EUTxO, UserDatum } from './types';

// 1. Create an interface representing a document in MongoDB.
export interface EUTxODBInterface {
	eUTxO: EUTxO;
}

// 2. Create a Schema corresponding to the document interface.
const eUTxODBSchema = new Schema<EUTxODBInterface>({
	eUTxO: { type: Object, required: true }
});

// 3. Create a Model.
export function getEUTxODBModel (){
	const EUTxODBModel = models['eutxo'] || model<EUTxODBInterface>('eutxo', eUTxODBSchema);
	return EUTxODBModel
}

export async function getAllEUTxOsFromDB () : Promise<EUTxO[]> {

	const EUTxODBModel = getEUTxODBModel()

	const eUTxOsDB = await EUTxODBModel.find({})

	return eUTxOsDB
	
}

export async function getEUTxOsFromDBByAddress (address : string) : Promise<EUTxO[]> {

	const EUTxODBModel = getEUTxODBModel()

	const eUTxODB : EUTxODBInterface []  = await EUTxODBModel.find({"eUTxO.uTxO.address": address})
	
	return eUTxODB.map((eUTxODB) => eUTxODB.eUTxO)
	
}

export async function getEUTxOsFromDBByAddressAndPkh (address : string, pkh : string) : Promise<EUTxO[]> {

	const EUTxODBModel = getEUTxODBModel()

	const eUTxODB : EUTxODBInterface []  = await EUTxODBModel.find({"eUTxO.uTxO.address": address,  "eUTxO.datum.udUser": pkh})
	
	return eUTxODB.map((eUTxODB) => eUTxODB.eUTxO)
}

export async function getEUTxOFromDBByTxHashAndIndex (txHash : string, outputIndex: number): Promise<EUTxO []>  {

	const EUTxODBModel = getEUTxODBModel()

	// console.log("getEUTxOFromDBByTxHashAndIndex: " + txHash + " - " + outputIndex)

	const eUTxODB = await EUTxODBModel.find({ "eUTxO.uTxO.txHash": txHash, "eUTxO.uTxO.outputIndex": outputIndex})
	
	return eUTxODB.map((eUTxODB) => eUTxODB.eUTxO)
}


export async function deleteEUTxOsFromDBByAddress (address : string) : Promise<number> {

	const EUTxODBModel = getEUTxODBModel()
	
	const del = await EUTxODBModel.deleteMany(
		{"eUTxO.uTxO.address": address}
	);

	return del.deletedCount
}


export async function deleteEUTxOsFromDBPreparingOrConsumingByAddress (address : string) : Promise<number> {

	const now = new Date()
	const nowMinusTxPreparinTime = now.getTime() - txPreparingTime
	const nowMinusTxConsumingTime = now.getTime() - txConsumingTime
	//------------------

	const EUTxODBModel = getEUTxODBModel()
	
	const del = await EUTxODBModel.deleteMany(
		{
			"eUTxO.uTxO.address": address, 
			"$or": [
				{"eUTxO.isPreparing.plutusDataIndex":0, "eUTxO.isPreparing.val": {"$lte":nowMinusTxPreparinTime}},
				{"eUTxO.isConsuming.plutusDataIndex":0, "eUTxO.isConsuming.val":  {"$lte":nowMinusTxConsumingTime}}
			] 
		}
	);
	// console.log ("deleteEUTxOsFromDBPreparingOrConsumingByAddress - del: " + del.deletedCount)
	return del.deletedCount
}

export async function deleteEUTxOsFromDBByTxHashAndIndex (txHash : string, outputIndex: number) : Promise<number> {

	const EUTxODBModel = getEUTxODBModel()
	
	const del = await EUTxODBModel.deleteOne({ "eUTxO.uTxO.txHash": txHash, "eUTxO.uTxO.outputIndex": outputIndex});
	
	return del.deletedCount

}




