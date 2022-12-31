// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { strToHex, toJson } from '../../utils/utils';

import { getStakingPoolDBModel, getStakingPoolFromDBByName, StakingPoolDBInterface } from  '../../types/stakePoolDBModel'
import { getSession } from 'next-auth/react';


type Data = {
	msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    const session = await getSession({ req })
	if (!session) {
		console.error("/api/updateStakingPool - Must Connect to your Wallet"); 
        res.status(400).json({ msg: "Must Connect to your Wallet" })
    }
    const sesionPkh = session?.user.pkh
    //--------------------------------
    
	const nombrePool = req.body.nombrePool

	const swShowOnSite = req.body.swShowOnSite

	const swShowOnHome = req.body.swShowOnHome

	const swPreparado = req.body.swPreparado

	const swIniciado = req.body.swIniciado
	const swFunded = req.body.swFunded

	const swClosed = req.body.swClosed

	const closedAt = req.body.closedAt

	const swTerminated = req.body.swTerminated

	const swZeroFunds = req.body.swZeroFunds
    const swPoolReadyForDelete = req.body.swPoolReadyForDelete

	const eUTxO_With_ScriptDatum = req.body.eUTxO_With_ScriptDatum

	const eUTxO_With_Script_TxID_Master_Fund_Datum = req.body.eUTxO_With_Script_TxID_Master_Fund_Datum
	const eUTxO_With_Script_TxID_Master_FundAndMerge_Datum = req.body.eUTxO_With_Script_TxID_Master_FundAndMerge_Datum
	const eUTxO_With_Script_TxID_Master_SplitFund_Datum = req.body.eUTxO_With_Script_TxID_Master_SplitFund_Datum
	const eUTxO_With_Script_TxID_Master_ClosePool_Datum = req.body.eUTxO_With_Script_TxID_Master_ClosePool_Datum
	const eUTxO_With_Script_TxID_Master_TerminatePool_Datum = req.body.eUTxO_With_Script_TxID_Master_TerminatePool_Datum
	const eUTxO_With_Script_TxID_Master_DeleteFund_Datum = req.body.eUTxO_With_Script_TxID_Master_DeleteFund_Datum
	const eUTxO_With_Script_TxID_Master_SendBackFund_Datum = req.body.eUTxO_With_Script_TxID_Master_SendBackFund_Datum
	const eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum = req.body.eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum
	const eUTxO_With_Script_TxID_Master_AddScripts_Datum = req.body.eUTxO_With_Script_TxID_Master_AddScripts_Datum
	const eUTxO_With_Script_TxID_Master_DeleteScripts_Datum = req.body.eUTxO_With_Script_TxID_Master_DeleteScripts_Datum

	const eUTxO_With_Script_TxID_User_Deposit_Datum = req.body.eUTxO_With_Script_TxID_User_Deposit_Datum
	const eUTxO_With_Script_TxID_User_Harvest_Datum = req.body.eUTxO_With_Script_TxID_User_Harvest_Datum
	const eUTxO_With_Script_TxID_User_Withdraw_Datum = req.body.eUTxO_With_Script_TxID_User_Withdraw_Datum

	await connect();

	console.log("/api/updateStakingPool - Request: " + toJson(req.body.nombrePool));
	console.log("/api/updateStakingPool - swShowOnHome: " + swShowOnHome);

    try {
        const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)
        
        if (stakingPoolWithSameName.length === 0 ){
            console.error("/api/updateStakingPool - Can't update StakingPool in Database - Error: StakingPool not Exist: " + nombrePool); 
            res.status(400).json({ msg: "Can't update StakingPool in Database - Error: StakingPool not Exist: " + nombrePool})
            return 
        } else if (stakingPoolWithSameName.length > 1 ){
            console.error("/api/updateStakingPool - Can't update StakingPool in Database - Error: StakingPool twice: " + nombrePool); 
            res.status(400).json({ msg: "Can't update StakingPool in Database - Error: StakingPool twice " + nombrePool})
            return 
        } else {
            const stakingPool = stakingPoolWithSameName[0]
            if (!stakingPool.masters.includes(sesionPkh!)){
                console.error("/api/updateStakingPool - You aren't master of this Staking Pool"); 
                res.status(400).json({ msg: "You aren't master of this Staking Pool"})
                return 
            }

            // console.log("/api/updateStakingPool - staking pool found");
        
            var StakingPoolDBModel = getStakingPoolDBModel()

            const filter = {name : nombrePool};
            const update = { 

                swShowOnSite: swShowOnSite, 

                swShowOnHome: swShowOnHome, 

                swPreparado: swPreparado, 

                swIniciado: swIniciado, 
                swFunded: swFunded,

                swClosed: swClosed,
                
                closedAt: closedAt != undefined? new Date(closedAt) : undefined,

                swTerminated: swTerminated,

                swZeroFunds: swZeroFunds,
                swPoolReadyForDelete: swPoolReadyForDelete,

                eUTxO_With_ScriptDatum: eUTxO_With_ScriptDatum,

                eUTxO_With_Script_TxID_Master_Fund_Datum: eUTxO_With_Script_TxID_Master_Fund_Datum,
                eUTxO_With_Script_TxID_Master_FundAndMerge_Datum: eUTxO_With_Script_TxID_Master_FundAndMerge_Datum,
                eUTxO_With_Script_TxID_Master_SplitFund_Datum: eUTxO_With_Script_TxID_Master_SplitFund_Datum,
                eUTxO_With_Script_TxID_Master_ClosePool_Datum: eUTxO_With_Script_TxID_Master_ClosePool_Datum,
                eUTxO_With_Script_TxID_Master_TerminatePool_Datum: eUTxO_With_Script_TxID_Master_TerminatePool_Datum,
                eUTxO_With_Script_TxID_Master_DeleteFund_Datum: eUTxO_With_Script_TxID_Master_DeleteFund_Datum,
                eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum: eUTxO_With_Script_TxID_Master_SendBackDeposit_Datum,
                eUTxO_With_Script_TxID_Master_SendBackFund_Datum: eUTxO_With_Script_TxID_Master_SendBackFund_Datum,
                eUTxO_With_Script_TxID_Master_AddScripts_Datum: eUTxO_With_Script_TxID_Master_AddScripts_Datum,
                eUTxO_With_Script_TxID_Master_DeleteScripts_Datum: eUTxO_With_Script_TxID_Master_DeleteScripts_Datum,

                eUTxO_With_Script_TxID_User_Deposit_Datum: eUTxO_With_Script_TxID_User_Deposit_Datum,
                eUTxO_With_Script_TxID_User_Harvest_Datum: eUTxO_With_Script_TxID_User_Harvest_Datum,
                eUTxO_With_Script_TxID_User_Withdraw_Datum: eUTxO_With_Script_TxID_User_Withdraw_Datum,

            };

            await StakingPoolDBModel.findOneAndUpdate(filter, update)
            // , undefined, (function(error: any){
            //     if(error) {
            //         console.error("/api/updateStakingPool - Can't update StakingPool in Database - Error: " + error);
            //         res.status(400).json({ msg: "Can't update StakingPool in Database - Error: " + error})
            //         return
            //     }else{
            console.log("/api/updateStakingPool - StakingPool updated in Database!"); 
            res.status(200).json({ msg: "StakingPool Updated in Database!"})
            return
            //     }
            // }));

        }

    } catch (error) {
        console.error("/api/updateStakingPool - Can't update StakingPool in Database - Error: " + error);
        res.status(400).json({ msg: "Can't update StakingPool in Database - Error: " + error})
        return
    }
	
}
