
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../utils/dbConnect';
import { exec } from 'child_process';
import { toJson } from '../../utils/utils';
import { MintingPolicy, SpendingValidator } from 'lucid-cardano';
import { getSession } from 'next-auth/react';
import { getEstadoDeployFromFile, getPABPoolParamsFromFile } from "../../stakePool/helpersServerSide";
import { CurrencySymbol, PoolParams } from '../../types';
import { maxMasters } from '../../types/constantes';
import { getStakingPoolDBModel, getStakingPoolFromDBByName, StakingPoolDBInterface } from '../../types/stakePoolDBModel';
import { getScriptFromFile, getTextFromFile } from '../../utils/utilsServerSide';

const fs = require('fs/promises');

type Data = {
	msg: string
	stakingPool: StakingPoolDBInterface | undefined
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

	//--------------------------------
    const session = await getSession({ req })
	if (!session) {
		console.error("/api/createStakingPool - Must Connect to your Wallet"); 
        res.status(400).json({ msg: "Must Connect to your Wallet", stakingPool: undefined })
		return 
    }
    const sesionPkh = session?.user.pkh
    //--------------------------------
	if (!(session?.user.swAdmin || session?.user.swCreate)){
		console.error("/api/createStakingPool - You Can't Create Staking Pool"); 
		res.status(400).json({ msg: "You Can't Create Staking Pool", stakingPool: undefined})
		return 
	}
    //--------------------------------

	const nombrePool = req.body.nombrePool
	const image = req.body.image

	const swDummyStakingPool = req.body.swDummyStakingPool

	const masters = req.body.masters
	const poolID_TxOutRef = req.body.poolID_TxOutRef
	const beginAt = req.body.beginAt
	const deadline = req.body.deadline
	const graceTime = req.body.graceTime
	const staking_UI = req.body.staking_UI
	const staking_CS = req.body.staking_CS
	const staking_TN = req.body.staking_TN
	const harvest_UI = req.body.harvest_UI
	const harvest_CS = req.body.harvest_CS
	const harvest_TN = req.body.harvest_TN

	const staking_Decimals = req.body.staking_Decimals
	const harvest_Decimals = req.body.harvest_Decimals

	const interest = req.body.interest

	const ruta = process.env.REACT_SERVER_PATH_FOR_SCRIPTS

	await connect();

	console.log("/api/createStakingPool - Request: " + toJson(req.body));
	console.log("/api/createStakingPool - Ruta: " + ruta);
	
	const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)
	
	if (stakingPoolWithSameName.length> 0 ){
		console.error("/api/createStakingPool - Can't create Pool with existing name"); 
		res.status(400).json({ msg: "Can't create Pool with existing name", stakingPool: undefined})
		return 
	}

	const mastersSplited = masters.split(',');

	if (masters.length == 0 ){
		console.error("/api/createStakingPool - Can't create Pool with no masters"); 
		res.status(400).json({ msg: "Can't create Pool with no masters", stakingPool: undefined})
		return 
	}

	if (mastersSplited.length> maxMasters ){
		console.error("/api/createStakingPool - Can't create Pool with so many masters"); 
		res.status(400).json({ msg: "Can't create Pool with so many masters", stakingPool: undefined})
		return 
	}
	
	if (!swDummyStakingPool){
		const execDeploy = 'deploy \"' + nombrePool + '\" \"' + masters + '\" \"' + poolID_TxOutRef + '\" \"' + beginAt + '\" \"' + deadline + '\" \"' + graceTime + '\" \"' + staking_UI + '\" \"' + staking_CS + '\" \"' + staking_TN + '\" \"' + harvest_UI + '\" \"' + harvest_CS + '\" \"' + harvest_TN + '\" \"' + interest + '\" \"' +  ruta + '\"' 
		
		console.log("/api/createStakingPool - exec: " + execDeploy)
		
		exec(execDeploy, async (error, stdout, stderr) => {
				console.log("/api/createStakingPool - exec - stdout: " + stdout );
				if (error) {
					var errorStr = toJson(stderr)
					errorStr = errorStr.indexOf("CallStack") > -1 ? errorStr.slice(7,errorStr.indexOf("CallStack")-2) : errorStr  
					console.error("/api/createStakingPool - exec - Error: " + errorStr );
					res.status(400).json({ msg: "There were an error creating Smart Contracts: " + errorStr, stakingPool: undefined})
					return
				}else {
					const timeoutGetEstadoDeploy = setInterval(async function () { 
						const estadoJsonFileName = nombrePool + "/" + 'estado.json';
						const estado = await getEstadoDeployFromFile(estadoJsonFileName);
						if (estado.includes("Done!") ) {
							clearInterval(timeoutGetEstadoDeploy)
							return await crearStakingPool(nombrePool, image, staking_UI, harvest_UI, staking_Decimals, harvest_Decimals, res);
						}
					}, 4000); 
					
				}
			})

	}else{
		const timeoutGetEstadoDeploy = setInterval(async function () { 
			const estadoJsonFileName = nombrePool + "/" + 'estado.json';
			const estado = await getEstadoDeployFromFile(estadoJsonFileName);
			if (estado.includes("Done!") ) {
				clearInterval(timeoutGetEstadoDeploy)
				return await crearStakingPool(nombrePool, image, staking_UI, harvest_UI, staking_Decimals, harvest_Decimals, res);
			}
		}, 4000); 
	}
}

async function crearStakingPool(nombrePool: any, image: any, staking_UI: any, harvest_UI: any, staking_Decimals: any, harvest_Decimals: any, res: NextApiResponse<string | Data>) {
	
	console.log("/api/createStakingPool - StakingPool Files Created!");

	console.log("/api/createStakingPool - stakingPoolDB: " + toJson(nombrePool));

	const pabPoolParamsJsonFileName = nombrePool + "/" + 'PABPoolParams-HEX.json';

	const stakePlusV2AddrFileName = process.env.NEXT_PUBLIC_USE_MAINNET === 'true' ? nombrePool + "/" + 'Validator-Mainnet.addr' : nombrePool + "/" + 'Validator-Testnet.addr';

	const stakePlusV2Plutus_FileName = nombrePool + "/" + 'Validator.plutus';

	// const stakePlusV2_Mint_PoolID_Symbol_FileName = nombrePool + "/" + 'Mint_PoolID.symbol';
	const stakePlusV2_Mint_PoolID_Plutus_FileName = nombrePool + "/" + 'Mint_PoolID.plutus';

	// const stakePlusV2_Mint_TxID_Master_Fund_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_Fund.symbol';
	const stakePlusV2_Mint_TxID_Master_Fund_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_Fund.plutus';

	// const stakePlusV2_Mint_TxID_Master_FundAndMerge_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_FundAndMerge.symbol';
	const stakePlusV2_Mint_TxID_Master_FundAndMerge_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_FundAndMerge.plutus';

	// const stakePlusV2_Mint_TxID_Master_SplitFund_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_SplitFund.symbol';
	const stakePlusV2_Mint_TxID_Master_SplitFund_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_SplitFund.plutus';

	// const stakePlusV2_Mint_TxID_Master_ClosePool_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_ClosePool.symbol';
	const stakePlusV2_Mint_TxID_Master_ClosePool_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_ClosePool.plutus';

	// const stakePlusV2_Mint_TxID_Master_TerminatePool_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_TerminatePool.symbol';
	const stakePlusV2_Mint_TxID_Master_TerminatePool_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_TerminatePool.plutus';

	// const stakePlusV2_Mint_TxID_Master_DeleteFund_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_DeleteFund.symbol';
	const stakePlusV2_Mint_TxID_Master_DeleteFund_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_DeleteFund.plutus';

	// const stakePlusV2_Mint_TxID_Master_SendBackFund_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_SendBackFund.symbol';
	const stakePlusV2_Mint_TxID_Master_SendBackFund_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_SendBackFund.plutus';

	// const stakePlusV2_Mint_TxID_Master_SendBackDeposit_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_SendBackDeposit.symbol';
	const stakePlusV2_Mint_TxID_Master_SendBackDeposit_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_SendBackDeposit.plutus';

	// const stakePlusV2_Mint_TxID_Master_AddScripts_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_AddScripts.symbol';
	const stakePlusV2_Mint_TxID_Master_AddScripts_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_AddScripts.plutus';

	// const stakePlusV2_Mint_TxID_Master_DeleteScripts_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_Master_DeleteScripts.symbol';
	const stakePlusV2_Mint_TxID_Master_DeleteScripts_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_Master_DeleteScripts.plutus';

	// const stakePlusV2_Mint_TxID_User_Deposit_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_User_Deposit.symbol';
	const stakePlusV2_Mint_TxID_User_Deposit_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_User_Deposit.plutus';

	// const stakePlusV2_Mint_TxID_User_Harvest_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_User_Harvest.symbol';
	const stakePlusV2_Mint_TxID_User_Harvest_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_User_Harvest.plutus';

	// const stakePlusV2_Mint_TxID_User_Withdraw_Symbol_FileName = nombrePool + "/" + 'Mint_TxID_User_Withdraw.symbol';
	const stakePlusV2_Mint_TxID_User_Withdraw_Plutus_FileName = nombrePool + "/" + 'Mint_TxID_User_Withdraw.plutus';

	var pabPoolParams: any;

	var stakePlusV2Addr: string;
	var stakePlusV2Script: SpendingValidator;

	var poolID_CS: CurrencySymbol;
	var poolID_Script: MintingPolicy;

	var txID_Master_Fund_CS: CurrencySymbol;
	var txID_Master_Fund_Script: MintingPolicy;

	var txID_Master_FundAndMerge_CS: CurrencySymbol;
	var txID_Master_FundAndMerge_Script: MintingPolicy;

	var txID_Master_SplitFund_CS: CurrencySymbol;
	var txID_Master_SplitFund_Script: MintingPolicy;

	var txID_Master_ClosePool_CS: CurrencySymbol;
	var txID_Master_ClosePool_Script: MintingPolicy;

	var txID_Master_TerminatePool_CS: CurrencySymbol;
	var txID_Master_TerminatePool_Script: MintingPolicy;

	var txID_Master_DeleteFund_CS: CurrencySymbol;
	var txID_Master_DeleteFund_Script: MintingPolicy;

	var txID_Master_SendBackFund_CS: CurrencySymbol;
	var txID_Master_SendBackFund_Script: MintingPolicy;

	var txID_Master_SendBackDeposit_CS: CurrencySymbol;
	var txID_Master_SendBackDeposit_Script: MintingPolicy;

	var txID_Master_AddScripts_CS: CurrencySymbol;
	var txID_Master_AddScripts_Script: MintingPolicy;

	var txID_Master_DeleteScripts_CS: CurrencySymbol;
	var txID_Master_DeleteScripts_Script: MintingPolicy;

	var txID_User_Deposit_CS: CurrencySymbol;
	var txID_User_Deposit_Script: MintingPolicy;

	var txID_User_Harvest_CS: CurrencySymbol;
	var txID_User_Harvest_Script: MintingPolicy;

	var txID_User_Withdraw_CS: CurrencySymbol;
	var txID_User_Withdraw_Script: MintingPolicy;

	pabPoolParams = await getPABPoolParamsFromFile(pabPoolParamsJsonFileName);
	
	stakePlusV2Addr = await getTextFromFile(stakePlusV2AddrFileName);
	stakePlusV2Script = await getScriptFromFile(stakePlusV2Plutus_FileName);

	// poolID_CS = await getSymbolFromFile(stakePlusV2_Mint_PoolID_Symbol_FileName);
	poolID_Script = await getScriptFromFile(stakePlusV2_Mint_PoolID_Plutus_FileName);

	// txID_Master_Fund_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_Fund_Symbol_FileName);
	txID_Master_Fund_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_Fund_Plutus_FileName);

	// txID_Master_FundAndMerge_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_FundAndMerge_Symbol_FileName);
	txID_Master_FundAndMerge_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_FundAndMerge_Plutus_FileName);

	// txID_Master_SplitFund_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_SplitFund_Symbol_FileName);
	txID_Master_SplitFund_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_SplitFund_Plutus_FileName);

	// txID_Master_ClosePool_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_ClosePool_Symbol_FileName);
	txID_Master_ClosePool_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_ClosePool_Plutus_FileName);

	// txID_Master_TerminatePool_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_TerminatePool_Symbol_FileName);
	txID_Master_TerminatePool_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_TerminatePool_Plutus_FileName);

	// txID_Master_DeleteFund_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_DeleteFund_Symbol_FileName);
	txID_Master_DeleteFund_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_DeleteFund_Plutus_FileName);

	// txID_Master_SendBackFund_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_SendBackFund_Symbol_FileName);
	txID_Master_SendBackFund_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_SendBackFund_Plutus_FileName);

	// txID_Master_SendBackDeposit_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_SendBackDeposit_Symbol_FileName);
	txID_Master_SendBackDeposit_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_SendBackDeposit_Plutus_FileName);

	// txID_Master_AddScripts_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_AddScripts_Symbol_FileName);
	txID_Master_AddScripts_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_AddScripts_Plutus_FileName);

	// txID_Master_DeleteScripts_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_Master_DeleteScripts_Symbol_FileName);
	txID_Master_DeleteScripts_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_Master_DeleteScripts_Plutus_FileName);

	// txID_User_Deposit_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_User_Deposit_Symbol_FileName);
	txID_User_Deposit_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_User_Deposit_Plutus_FileName);

	// txID_User_Harvest_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_User_Harvest_Symbol_FileName);
	txID_User_Harvest_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_User_Harvest_Plutus_FileName);

	// txID_User_Withdraw_CS = await getSymbolFromFile(stakePlusV2_Mint_TxID_User_Withdraw_Symbol_FileName);
	txID_User_Withdraw_Script = await getScriptFromFile(stakePlusV2_Mint_TxID_User_Withdraw_Plutus_FileName);

	// poolID_Script = pabPoolParams.ppolicy_PoolID;
	// txID_Master_Fund_Script = pabPoolParams.ppolicy_TxID_Master_Fund;
	// txID_Master_FundAndMerge_Script = pabPoolParams.ppolicy_TxID_Master_FundAndMerge;
	// txID_Master_SplitFund_Script = pabPoolParams.ppolicy_TxID_Master_SplitFund;
	// txID_Master_ClosePool_Script = pabPoolParams.ppolicy_TxID_Master_ClosePool;
	// txID_Master_TerminatePool_Script = pabPoolParams.ppolicy_TxID_Master_TerminatePool;
	// txID_Master_DeleteFund_Script = pabPoolParams.ppolicy_TxID_Master_DeleteFund;
	// txID_Master_SendBackFund_Script = pabPoolParams.ppolicy_TxID_Master_SendBackFund;
	// txID_Master_SendBackDeposit_Script = pabPoolParams.ppolicy_TxID_Master_SendBackDeposit;
	// txID_Master_AddScripts_Script = pabPoolParams.ppolicy_TxID_Master_AddScripts;
	// txID_Master_DeleteScripts_Script = pabPoolParams.ppolicy_TxID_Master_DeleteScripts;
	// txID_User_Deposit_Script = pabPoolParams.ppolicy_TxID_User_Deposit;
	// txID_User_Harvest_Script = pabPoolParams.ppolicy_TxID_User_Withdraw;
	// txID_User_Withdraw_Script = pabPoolParams.ppolicy_TxID_User_Harvest;

	poolID_CS = pabPoolParams.poolID_CS;
	txID_Master_Fund_CS = pabPoolParams.txID_Master_Fund_CS;
	txID_Master_FundAndMerge_CS = pabPoolParams.txID_Master_FundAndMerge_CS;
	txID_Master_SplitFund_CS = pabPoolParams.txID_Master_SplitFund_CS;
	txID_Master_ClosePool_CS = pabPoolParams.txID_Master_ClosePool_CS;
	txID_Master_TerminatePool_CS = pabPoolParams.txID_Master_TerminatePool_CS;
	txID_Master_DeleteFund_CS = pabPoolParams.txID_Master_DeleteFund_CS;
	txID_Master_SendBackFund_CS = pabPoolParams.txID_Master_SendBackFund_CS;
	txID_Master_SendBackDeposit_CS = pabPoolParams.txID_Master_SendBackDeposit_CS;
	txID_Master_AddScripts_CS = pabPoolParams.txID_Master_AddScripts_CS;
	txID_Master_DeleteScripts_CS = pabPoolParams.txID_Master_DeleteScripts_CS;
	txID_User_Deposit_CS = pabPoolParams.txID_User_Deposit_CS;
	txID_User_Harvest_CS = pabPoolParams.txID_User_Harvest_CS;
	txID_User_Withdraw_CS = pabPoolParams.txID_User_Withdraw_CS;

	const poolParams: PoolParams = {
		ppPoolID_CS: pabPoolParams.poolID_CS,
		ppMasters: pabPoolParams.masters,
		ppBegintAt: pabPoolParams.beginAt,
		ppDeadline: pabPoolParams.deadline,
		ppGraceTime: pabPoolParams.graceTime,
		ppStaking_CS: pabPoolParams.ppStaking_CS,
		ppStaking_TN: pabPoolParams.ppStaking_TN,
		ppHarvest_CS: pabPoolParams.ppHarvest_CS,
		ppHarvest_TN: pabPoolParams.ppHarvest_TN,
		ppInterestRates: pabPoolParams.interestRates
	};

	console.log("/api/createStakingPool - params: " + toJson(poolParams));

	var StakingPoolDBModel = getStakingPoolDBModel();

	const newStakingPoolDB = new StakingPoolDBModel({
		name: nombrePool,

		imageSrc: image,

		swDeleted: false,

		swShowOnSite: true,

		swShowOnHome: true,

		swPreparado: false,

		swIniciado: false,
		swFunded: false,

		swClosed: false,

		closedAt: undefined,

		swTerminated: false,

		swZeroFunds: true,

		swPoolReadyForDeleteMasterAndUserScripts: true,
		swPoolReadyForDeleteMainScripts: true,
		swPoolReadyForDeletePoolInDB: true,

		beginAt: new Date(pabPoolParams.beginAt),
		deadline: new Date(pabPoolParams.deadline),
		graceTime: pabPoolParams.graceTime,

		masters: pabPoolParams.masters,

		eUTxO_With_ScriptDatum: undefined,

		eUTxO_With_Script_TxID_Master_Fund_Datum: undefined,
		eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: undefined,
		eUTxO_With_Script_TxID_Master_SplitFund_Datum: undefined,
		eUTxO_With_Script_TxID_Master_ClosePool_Datum: undefined,
		eUTxO_With_Script_TxID_Master_TerminatePool_Datum: undefined,
		eUTxO_With_Script_TxID_Master_DeleteFund_Datum: undefined,
		eUTxO_With_Script_TxID_Master_SendBackFund_Datum: undefined,
		eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: undefined,
		eUTxO_With_Script_TxID_Master_AddScripts_Datum: undefined,
		eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: undefined,

		eUTxO_With_Script_TxID_User_Deposit_Datum: undefined,
		eUTxO_With_Script_TxID_User_Harvest_Datum: undefined,
		eUTxO_With_Script_TxID_User_Withdraw_Datum: undefined,

		staking_Lucid: pabPoolParams.staking_Lucid,
		harvest_Lucid: pabPoolParams.harvest_Lucid,

		staking_UI: staking_UI,
		harvest_UI: harvest_UI,

		staking_Decimals: staking_Decimals,
		harvest_Decimals: harvest_Decimals,

		pParams: (poolParams),

		scriptAddress: stakePlusV2Addr,
		script: (stakePlusV2Script),
		tx_count: 0,

		poolID_TxOutRef: (pabPoolParams.poolID_TxOutRef),
		poolID_CS: poolID_CS,
		poolID_Script: (poolID_Script),

		txID_Master_Fund_CS: txID_Master_Fund_CS,
		txID_Master_Fund_Script: (txID_Master_Fund_Script),

		txID_Master_FundAndMerge_CS: txID_Master_FundAndMerge_CS,
		txID_Master_FundAndMerge_Script: (txID_Master_FundAndMerge_Script),

		txID_Master_SplitFund_CS: txID_Master_SplitFund_CS,
		txID_Master_SplitFund_Script: (txID_Master_SplitFund_Script),

		txID_Master_ClosePool_CS: txID_Master_ClosePool_CS,
		txID_Master_ClosePool_Script: (txID_Master_ClosePool_Script),

		txID_Master_TerminatePool_CS: txID_Master_TerminatePool_CS,
		txID_Master_TerminatePool_Script: (txID_Master_TerminatePool_Script),

		txID_Master_DeleteFund_CS: txID_Master_DeleteFund_CS,
		txID_Master_DeleteFund_Script: (txID_Master_DeleteFund_Script),

		txID_Master_SendBackFund_CS: txID_Master_SendBackFund_CS,
		txID_Master_SendBackFund_Script: (txID_Master_SendBackFund_Script),

		txID_Master_SendBackDeposit_CS: txID_Master_SendBackDeposit_CS,
		txID_Master_SendBackDeposit_Script: (txID_Master_SendBackDeposit_Script),

		txID_Master_AddScripts_CS: txID_Master_AddScripts_CS,
		txID_Master_AddScripts_Script: (txID_Master_AddScripts_Script),

		txID_Master_DeleteScripts_CS: txID_Master_DeleteScripts_CS,
		txID_Master_DeleteScripts_Script: (txID_Master_DeleteScripts_Script),

		txID_User_Deposit_CS: txID_User_Deposit_CS,
		txID_User_Deposit_Script: (txID_User_Deposit_Script),

		txID_User_Harvest_CS: txID_User_Harvest_CS,
		txID_User_Harvest_Script: (txID_User_Harvest_Script),

		txID_User_Withdraw_CS: txID_User_Withdraw_CS,
		txID_User_Withdraw_Script: (txID_User_Withdraw_Script),

	});

	try{
		await newStakingPoolDB.save()

		console.log("/api/createStakingPool - StakingPool saved in Database!");
		res.status(200).json({ msg: "Smart Contracts created!", stakingPool: newStakingPoolDB });
		return
	} catch (error) {
		console.error("/api/createStakingPool - Can't save StakingPool in Database - Error: " + error);
		res.status(400).json({ msg: "Can't save StakingPool in Database - Error: " + error, stakingPool: undefined });
		return;
	}
}

