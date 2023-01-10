
import { Schema, model, models } from 'mongoose';
import { toJson } from '../utils/utils';

// 1. Create an interface representing a document in MongoDB.
export interface DatumDBInterface {
	datumHash: string;
	datum: string;
}

// 2. Create a Schema corresponding to the document interface.
const datumDBSchema = new Schema<DatumDBInterface>({
	datumHash: { type: String, required: true },
	datum: { type: String, required: true }
});

// 3. Create a Model.
export function getDatumDBModel (){
	const DatumDBModel = models['datums'] || model<DatumDBInterface>('datums', datumDBSchema);
	return DatumDBModel
}

export async function getAllDatumsFromDB () : Promise <DatumDBInterface []> {

	const DatumDBModel = getDatumDBModel()

	const datumsDB = await DatumDBModel.find({})

	return datumsDB
	
}

export async function getDatumFromDBByDatumHash (datumHash_ : string) : Promise <DatumDBInterface []>  {

	const DatumDBModel = getDatumDBModel()

	const datumDB = await DatumDBModel.find({datumHash : datumHash_})
	// 	, undefined, undefined, function(error: any){
	// 	if(error) {
	// 		throw error
	// 	}
	// });

	return datumDB
	
}

export async function deleteAllDatumsFromDB () : Promise<number> {

	const DatumDBModel = getDatumDBModel()
	
	const del = await DatumDBModel.deleteMany(
		{}
	);

	return del.deletedCount
}

