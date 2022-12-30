
import { MintingPolicy, SpendingValidator, UTxO } from 'lucid-cardano';
import { Schema, model, models } from 'mongoose';
import { apiGetEUTxOsDBByAddressAndPkh } from '../utils/cardano-helpers';
import { toJson } from '../utils/utils';
import { getEUTxOsFromDBByAddressAndPkh } from './eUTxODBModel';
import { BIGINT, CurrencySymbol, EUTxO, PoolParams, TxOutRef, UTxO_Simple } from './types';

// 1. Create an interface representing a document in MongoDB.
export interface StakingPoolDBInterface {

	name: string,
	imageSrc: string,

	swShowOnSite: boolean,
	swShowOnHome: boolean,
	swPreparado: boolean,
	swIniciado: boolean,
	swFunded: boolean,
	swClosed: boolean,
	closedAt: Date | undefined,
	swTerminated: boolean,
	swZeroFunds: boolean,

	beginAt: Date,
	deadline: Date,
	graceTime: BIGINT,
	
	masters: string [],

	uTxO_With_PoolDatum: UTxO_Simple | undefined,

	eUTxO_With_ScriptDatum: EUTxO | undefined,

	eUTxO_With_Script_TxID_Master_Fund_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_SplitFund_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_ClosePool_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_TerminatePool_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_DeleteFund_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_SendBackFund_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_AddScripts_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: EUTxO | undefined,

	eUTxO_With_Script_TxID_User_Deposit_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_User_Harvest_Datum: EUTxO | undefined,
	eUTxO_With_Script_TxID_User_Withdraw_Datum: EUTxO | undefined,

	scriptAddress: string,
	script: SpendingValidator,

	staking_UI: string,
	harvest_UI: string,

	staking_Lucid: string,
	harvest_Lucid: string,

	pParams : PoolParams,

	poolID_TxOutRef: TxOutRef,
	poolID_CS: CurrencySymbol,
	poolID_Script: MintingPolicy,

	txID_Master_Fund_CS: CurrencySymbol,
	txID_Master_Fund_Script: MintingPolicy,

	txID_Master_FundAndMerge_CS: CurrencySymbol,
	txID_Master_FundAndMerge_Script: MintingPolicy,

	txID_Master_SplitFund_CS: CurrencySymbol,
	txID_Master_SplitFund_Script: MintingPolicy,

	txID_Master_ClosePool_CS: CurrencySymbol,
	txID_Master_ClosePool_Script: MintingPolicy,

	txID_Master_TerminatePool_CS: CurrencySymbol,
	txID_Master_TerminatePool_Script: MintingPolicy,

	txID_Master_DeleteFund_CS: CurrencySymbol,
	txID_Master_DeleteFund_Script: MintingPolicy,

	txID_Master_SendBackFund_CS: CurrencySymbol,
	txID_Master_SendBackFund_Script: MintingPolicy,

	txID_Master_SendBackDeposit_CS: CurrencySymbol,
	txID_Master_SendBackDeposit_Script: MintingPolicy,

	txID_Master_AddScripts_CS: CurrencySymbol,
	txID_Master_AddScripts_Script: MintingPolicy,

	txID_Master_DeleteScripts_CS: CurrencySymbol,
	txID_Master_DeleteScripts_Script: MintingPolicy,

	txID_User_Deposit_CS: CurrencySymbol,
	txID_User_Deposit_Script: MintingPolicy,

	txID_User_Harvest_CS: CurrencySymbol,
	txID_User_Harvest_Script: MintingPolicy,

	txID_User_Withdraw_CS: CurrencySymbol,
	txID_User_Withdraw_Script: MintingPolicy,

}

// 2. Create a Schema corresponding to the document interface.
const stakingPoolDBSchema = new Schema<StakingPoolDBInterface>({

	name: { type: String, required: true },
	imageSrc: { type: String, required: true },

	swShowOnSite: { type: Boolean, required: true },
	swShowOnHome: { type: Boolean, required: true },
	swPreparado: { type: Boolean, required: true },
	swIniciado: { type: Boolean, required: true },
	swFunded: { type: Boolean, required: true },
	swClosed: { type: Boolean, required: true },
	closedAt: { type: Date, required: false },
	swTerminated: { type: Boolean, required: true },
	swZeroFunds: { type: Boolean, required: true },

	beginAt: { type: Date, required: true },
	deadline: { type: Date, required: true },
	graceTime: { type: Number, required: true },

	masters: { type: [String], required: true },

	uTxO_With_PoolDatum : { type: String },

	eUTxO_With_ScriptDatum: { type: String },

	eUTxO_With_Script_TxID_Master_Fund_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_SplitFund_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_ClosePool_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_TerminatePool_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_DeleteFund_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_SendBackFund_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_AddScripts_Datum: { type: String },
	eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: { type: String },

	eUTxO_With_Script_TxID_User_Deposit_Datum: { type: String },
	eUTxO_With_Script_TxID_User_Harvest_Datum: { type: String },
	eUTxO_With_Script_TxID_User_Withdraw_Datum: { type: String },

	scriptAddress: { type: String, required: true },
	script: { type: String, required: true },

	staking_UI: { type: String, required: true },
	harvest_UI: { type: String, required: true },
	staking_Lucid: { type: String, required: true },
	harvest_Lucid: { type: String, required: true },

	pParams : { type: String, required: true },

	poolID_TxOutRef: { type: String, required: true },
	poolID_CS: { type: String, required: true },
	poolID_Script: { type: String, required: true },

	txID_Master_Fund_CS: { type: String, required: true },
	txID_Master_Fund_Script: { type: String, required: true },

	txID_Master_FundAndMerge_CS: { type: String, required: true },
	txID_Master_FundAndMerge_Script: { type: String, required: true },

	txID_Master_SplitFund_CS: { type: String, required: true },
	txID_Master_SplitFund_Script: { type: String, required: true },

	txID_Master_ClosePool_CS: { type: String, required: true },
	txID_Master_ClosePool_Script: { type: String, required: true },

	txID_Master_TerminatePool_CS: { type: String, required: true },
	txID_Master_TerminatePool_Script: { type: String, required: true },

	txID_Master_DeleteFund_CS: { type: String, required: true },
	txID_Master_DeleteFund_Script: { type: String, required: true },

	txID_Master_SendBackFund_CS: { type: String, required: true },
	txID_Master_SendBackFund_Script: { type: String, required: true },

	txID_Master_SendBackDeposit_CS: { type: String, required: true },
	txID_Master_SendBackDeposit_Script: { type: String, required: true },

	txID_Master_AddScripts_CS: { type: String, required: true },
	txID_Master_AddScripts_Script: { type: String, required: true },

	txID_Master_DeleteScripts_CS: { type: String, required: true },
	txID_Master_DeleteScripts_Script: { type: String, required: true },

	txID_User_Deposit_CS: { type: String, required: true },
	txID_User_Deposit_Script: { type: String, required: true },

	txID_User_Harvest_CS: { type: String, required: true },
	txID_User_Harvest_Script: { type: String, required: true },

	txID_User_Withdraw_CS: { type: String, required: true },
	txID_User_Withdraw_Script: { type: String, required: true }

});

// 3. Create a Model.
export function getStakingPoolDBModel (){
	const StakingPoolDBModel = models['StakingPool'] || model<StakingPoolDBInterface>('StakingPool', stakingPoolDBSchema);
	return StakingPoolDBModel
}


export async function getAllStakingPoolsForAdminFromDB (pkh? : string | undefined) : Promise <StakingPoolDBInterface []> {

	// const stakingPoolsDB = await StakingPoolDBModel.find({swShowOnSite : true})
		
	// // 	, undefined, undefined, function(error: any){
	// // 	if(error) {
	// // 		console.log("Error in getAllStakingPoolsForAdminFromDB: ", error)
	// // 		throw error
	// // 	}
	// // });

	// //const stakingPoolsDB = [{name : "RATS"},{name : "RATS"}]

	// return stakingPoolsDB

	const StakingPoolDBModel = getStakingPoolDBModel()

	console.log ("getAllStakingPoolsForAdminFromDB - pkh: " + pkh )
	
	const stakingPoolsDB_ : StakingPoolDBInterface [] = await StakingPoolDBModel.find({
		swShowOnSite : true,
	})

	var stakingPoolsDB : StakingPoolDBInterface [] = []
	
	if(pkh){

		const pkhAdmins = process.env.pkhAdmins?.split (",") || [];

		for (let i = 0; i < stakingPoolsDB_.length; i++) {
			const stakingPoolDB = stakingPoolsDB_[i];
			// console.log("getAllStakingPoolsForAdminFromDB - stakingPoolDB: ", stakingPoolDB)

			if (stakingPoolDB.masters.includes(pkh) || pkhAdmins.includes(pkh)){
				stakingPoolsDB.push(stakingPoolDB)
			}
		}
	}else{
		return []
	}

	// , undefined, undefined, function(error: any){
	// 	if(error) {
	// 		throw error
	// 	}
	// });

	//const stakingPoolsDB = [{name : "RATS"},{name : "RATS"}]

	// console.log ("getAllStakingPoolsForHomeFromDB - stakingPoolsDB: " + stakingPoolsDB[0].beginAt.toISOString() )

	return stakingPoolsDB
	
}

export async function getAllStakingPoolsForHomeFromDB (pkh? : string | undefined) : Promise <StakingPoolDBInterface []> {

	const StakingPoolDBModel = getStakingPoolDBModel()

	// const now = new Date ()

	console.log ("getAllStakingPoolsForHomeFromDB - pkh: " + pkh )
	// console.log ("getAllStakingPoolsForHomeFromDB - now.toISOString(): " + now.toISOString() )
	
	const stakingPoolsDB_ : StakingPoolDBInterface [] = await StakingPoolDBModel.find({
		swShowOnSite : true,

		// swShowOnHome : true,

		// swPreparado : true, 

		// swIniciado : true, 

		// swFunded: true, 

		// swTerminated : false, 

		// begintAt: {
		//   $lte: now.toISOString() 
		// },

		// deadline: {
		//   $lte: 'ISODate('+ now.toString()+ ')'
		// }
	
	})

	var stakingPoolsDB : StakingPoolDBInterface [] = []
	
	for (let i = 0; i < stakingPoolsDB_.length; i++) {
		const stakingPoolDB = stakingPoolsDB_[i];
		// console.log("getAllStakingPoolsForHomeFromDB - stakingPoolDB: ", stakingPoolDB)
		
		if(pkh){

			const pkhAdmins = process.env.pkhAdmins?.split (",") || [];

			const address = stakingPoolDB.scriptAddress
			//const eUTxOByPkh = await apiGetEUTxOsDBByAddressAndPkh(address, pkh)
			const eUTxOByPkh : EUTxO [] = await getEUTxOsFromDBByAddressAndPkh(address, pkh);
			// if (eUTxOByPkh.length > 0 || (stakingPoolDB.swShowOnHome && stakingPoolDB.swPreparado && stakingPoolDB.swIniciado && stakingPoolDB.swFunded && !stakingPoolDB.swTerminated)) {
			if (eUTxOByPkh.length > 0 || pkhAdmins.includes(pkh)) {
				stakingPoolsDB.push(stakingPoolDB)
			}
		}else{
			if (stakingPoolDB.swShowOnHome && stakingPoolDB.swPreparado && stakingPoolDB.swIniciado && stakingPoolDB.swFunded && !stakingPoolDB.swClosed && !stakingPoolDB.swTerminated) {
				stakingPoolsDB.push(stakingPoolDB)
			}
		}
	}

	// , undefined, undefined, function(error: any){
	// 	if(error) {
	// 		throw error
	// 	}
	// });

	//const stakingPoolsDB = [{name : "RATS"},{name : "RATS"}]

	// console.log ("getAllStakingPoolsForHomeFromDB - stakingPoolsDB: " + stakingPoolsDB[0].beginAt.toISOString() )

	return stakingPoolsDB
	
}


export async function getStakingPoolFromDBByName (name_ : string) : Promise <StakingPoolDBInterface []> {

	const StakingPoolDBModel = getStakingPoolDBModel()

	const stakingPoolDB = await StakingPoolDBModel.find({name : name_})
	// 	, undefined, undefined, function(error: any){
	// 	if(error) {
	// 		throw error
	// 	}
	// });

	//const stakingPoolsDB = [{name : "RATS"},{name : "RATS"}]

	return stakingPoolDB
	
}

export async function getStakingPools(forHome: boolean = true, pkh? : string | undefined) : Promise <StakingPoolDBInterface []> {

	console.log("getStakingPools - Init - forHome: " + forHome + " - pkh: " + pkh);

	var stakingPoolsDB: any;

	if (forHome) {
		stakingPoolsDB = await getAllStakingPoolsForHomeFromDB(pkh);
	} else {
		stakingPoolsDB = await getAllStakingPoolsForAdminFromDB(pkh);
	}

	return stakingPoolsDB;

}

