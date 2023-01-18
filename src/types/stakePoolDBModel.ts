
import { MintingPolicy, SpendingValidator } from 'lucid-cardano';
import { model, models, Schema } from 'mongoose';
import { serverSide_updateStakingPool } from '../stakePool/helpersServerSide';
import { stakingPoolDBParser } from '../stakePool/helpersStakePool';
import { getEUTxOsFromDBByAddressAndPkh } from './eUTxODBModel';
import { BIGINT, CurrencySymbol, EUTxO, PoolParams, TxOutRef, UTxO_Simple } from './types';

// 1. Create an interface representing a document in MongoDB.
export interface StakingPoolDBInterface {

	name: string,
	imageSrc: string,

	swDeleted: boolean,
	swShowOnSite: boolean,
	swShowOnHome: boolean,
	swPreparado: boolean,
	swIniciado: boolean,
	swFunded: boolean,
	swClosed: boolean,
	closedAt: Date | undefined,
	swTerminated: boolean,
	swZeroFunds: boolean,

	swPoolReadyForDeleteMasterAndUserScripts: boolean,
	swPoolReadyForDeleteMainScripts: boolean,
	swPoolReadyForDeletePoolInDB: boolean,

	beginAt: Date,
	deadline: Date,
	graceTime: BIGINT,
	
	masters: string [],

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
	tx_count: number,

	staking_UI: string,
	harvest_UI: string,

	staking_Lucid: string,
	harvest_Lucid: string,

	staking_Decimals: number,
	harvest_Decimals: number,

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

	swDeleted: { type: Boolean, required: true },
	
	swShowOnSite: { type: Boolean, required: true },
	swShowOnHome: { type: Boolean, required: true },
	swPreparado: { type: Boolean, required: true },
	swIniciado: { type: Boolean, required: true },
	swFunded: { type: Boolean, required: true },
	swClosed: { type: Boolean, required: true },
	closedAt: { type: Date, required: false },
	swTerminated: { type: Boolean, required: true },
	swZeroFunds: { type: Boolean, required: true },

	swPoolReadyForDeleteMasterAndUserScripts: { type: Boolean, required: true },
	swPoolReadyForDeleteMainScripts : { type: Boolean, required: true },
	swPoolReadyForDeletePoolInDB : { type: Boolean, required: true },

	beginAt: { type: Date, required: true },
	deadline: { type: Date, required: true },
	graceTime: { type: Number, required: true },

	masters: { type: [String], required: true },

	eUTxO_With_ScriptDatum: { type: Object },
	
	eUTxO_With_Script_TxID_Master_Fund_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_SplitFund_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_ClosePool_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_TerminatePool_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_DeleteFund_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_SendBackFund_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_AddScripts_Datum: { type: Object },
	eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: { type: Object },

	eUTxO_With_Script_TxID_User_Deposit_Datum: { type: Object },
	eUTxO_With_Script_TxID_User_Harvest_Datum: { type: Object },
	eUTxO_With_Script_TxID_User_Withdraw_Datum: { type: Object },

	scriptAddress: { type: String, required: true },
	script: { type: Object, required: true },
	tx_count: { type: Number, required: true },

	staking_UI: { type: String, required: true },
	harvest_UI: { type: String, required: true },
	staking_Lucid: { type: String, required: true },
	harvest_Lucid: { type: String, required: true },

	staking_Decimals: { type: Number, required: true },
	harvest_Decimals: { type: Number, required: true },

	pParams : { type: Object, required: true },

	poolID_TxOutRef: { type: Object, required: true },
	poolID_CS: { type: String, required: true },
	poolID_Script: { type: Object, required: true },

	txID_Master_Fund_CS: { type: String, required: true },
	txID_Master_Fund_Script: { type: Object, required: true },

	txID_Master_FundAndMerge_CS: { type: String, required: true },
	txID_Master_FundAndMerge_Script: { type: Object, required: true },

	txID_Master_SplitFund_CS: { type: String, required: true },
	txID_Master_SplitFund_Script: { type: Object, required: true },

	txID_Master_ClosePool_CS: { type: String, required: true },
	txID_Master_ClosePool_Script: { type: Object, required: true },

	txID_Master_TerminatePool_CS: { type: String, required: true },
	txID_Master_TerminatePool_Script: { type: Object, required: true },

	txID_Master_DeleteFund_CS: { type: String, required: true },
	txID_Master_DeleteFund_Script: { type: Object, required: true },

	txID_Master_SendBackFund_CS: { type: String, required: true },
	txID_Master_SendBackFund_Script: { type: Object, required: true },

	txID_Master_SendBackDeposit_CS: { type: String, required: true },
	txID_Master_SendBackDeposit_Script: { type: Object, required: true },

	txID_Master_AddScripts_CS: { type: String, required: true },
	txID_Master_AddScripts_Script: { type: Object, required: true },

	txID_Master_DeleteScripts_CS: { type: String, required: true },
	txID_Master_DeleteScripts_Script: { type: Object, required: true },

	txID_User_Deposit_CS: { type: String, required: true },
	txID_User_Deposit_Script: { type: Object, required: true },

	txID_User_Harvest_CS: { type: String, required: true },
	txID_User_Harvest_Script: { type: Object, required: true },

	txID_User_Withdraw_CS: { type: String, required: true },
	txID_User_Withdraw_Script: { type: Object, required: true }

});

// 3. Create a Model.
export function getStakingPoolDBModel (){
	const StakingPoolDBModel = models['StakingPool'] || model<StakingPoolDBInterface>('StakingPool', stakingPoolDBSchema);
	return StakingPoolDBModel
}


export async function getAllStakingPoolsForAdminFromDB (pkh? : string | undefined, swAdmin? : boolean | undefined) : Promise <StakingPoolDBInterface []> {

	const StakingPoolDBModel = getStakingPoolDBModel()

	console.log ("getAllStakingPoolsForAdminFromDB - pkh: " + pkh )
	
	const stakingPoolsDB_ : StakingPoolDBInterface [] = await StakingPoolDBModel.find({
		swShowOnSite : true,
		swDeleted : false
	})

	var stakingPoolsDB : StakingPoolDBInterface [] = []
	
	if(pkh){
		for (let i = 0; i < stakingPoolsDB_.length; i++) {
			const stakingPoolDB_Parsed = stakingPoolDBParser(stakingPoolsDB_[i]);
			const stakingPoolDB_Updated = await serverSide_updateStakingPool (stakingPoolDB_Parsed)
			if (stakingPoolDB_Updated.masters.includes(pkh) || swAdmin === true){
				stakingPoolsDB.push(stakingPoolDB_Updated)
			}
		}
	}
	
	return stakingPoolsDB
}

export async function getAllStakingPoolsForHomeFromDB (pkh? : string | undefined) : Promise <StakingPoolDBInterface []> {

	const StakingPoolDBModel = getStakingPoolDBModel()

	console.log ("getAllStakingPoolsForHomeFromDB - pkh: " + pkh )
	
	const stakingPoolsDB_ : StakingPoolDBInterface [] = await StakingPoolDBModel.find({
		swShowOnSite : true,
		swDeleted : false
	})

	var stakingPoolsDB : StakingPoolDBInterface [] = []
	
	for (let i = 0; i < stakingPoolsDB_.length; i++) {
		const stakingPoolDB = stakingPoolsDB_[i];
		// console.log("getAllStakingPoolsForHomeFromDB - stakingPoolDB: ", stakingPoolDB)

		if(stakingPoolDB.swShowOnHome){

			const stakingPoolDB_Parsed = stakingPoolDBParser(stakingPoolsDB_[i]);
			const stakingPoolDB_Updated = await serverSide_updateStakingPool (stakingPoolDB_Parsed)

			if(pkh){
				const address = stakingPoolDB_Updated.scriptAddress
				const eUTxOByPkh : EUTxO [] = await getEUTxOsFromDBByAddressAndPkh(address, pkh);
				if (eUTxOByPkh.length > 0 ) {
					stakingPoolsDB.push(stakingPoolDB_Updated)
				}
			}else{
				if (stakingPoolDB_Updated.swPreparado && stakingPoolDB_Updated.swIniciado && stakingPoolDB_Updated.swFunded && !stakingPoolDB_Updated.swClosed && !stakingPoolDB_Updated.swTerminated) {
					stakingPoolsDB.push(stakingPoolDB_Updated)
				}
			}
		}
	}

	return stakingPoolsDB
	
}

export async function getStakingPoolFromDBByName (name_ : string) : Promise <StakingPoolDBInterface []> {

	//console.log ("getStakingPoolFromDBByName - name: " + name_ )

	const StakingPoolDBModel = getStakingPoolDBModel()

	const stakingPoolsDB = await StakingPoolDBModel.find({name : name_})

	return stakingPoolsDB
	
}

export async function getStakingPools(forHome: boolean = true, pkh? : string | undefined, swAdmin? : boolean | undefined) : Promise <StakingPoolDBInterface []> {

	console.log("getStakingPools - Init - forHome: " + forHome + " - pkh: " + pkh);

	var stakingPoolsDB : StakingPoolDBInterface [] = []

	if (forHome) {
		stakingPoolsDB = await getAllStakingPoolsForHomeFromDB(pkh);
	} else {
		stakingPoolsDB = await getAllStakingPoolsForAdminFromDB(pkh, swAdmin);
	}

	return stakingPoolsDB;

}

