// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { strToHex, toJson } from '../../utils/utils';

import { getStakingPoolDBModel, getStakingPoolFromDBByName, StakingPoolDBInterface } from  '../../types/stakePoolDBModel'
import { getEUTxODBModel, getEUTxOFromDBByTxHashAndIndex } from '../../types/eUTxODBModel';

type Data = {
	msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

	const eUTxO = req.body.eUTxO

	await connect();

	console.log("/api/updateEUTxO - Request: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);

	try {
        const eUTxO_ = await getEUTxOFromDBByTxHashAndIndex (eUTxO.uTxO.txHash, eUTxO.uTxO.outputIndex)

        if (eUTxO_.length == 0 ){
            console.error("/api/updateEUTxO - Can't update EUTxO in Database - Error: EUTxO not Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);
            res.status(400).json({ msg: "Can't update EUTxO in Database - Error: EUTxO not Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex})
            return
        // } else {
            // console.log("/api/updateEUTxO - EUTxO Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);
        }

        var EUTxODBModel = getEUTxODBModel()

        const filter = { "eUTxO.uTxO.txHash": eUTxO.uTxO.txHash, "eUTxO.uTxO.outputIndex": eUTxO.uTxO.outputIndex};
        const update = { 
            eUTxO: eUTxO
        }

        await EUTxODBModel.findOneAndUpdate(filter, update)
            // , undefined, (function(error: any){
            // if(error) {
            //     console.error("/api/updateEUTxO - Can't update EUTxO in Database - Error: " + error);
            //     res.status(400).json({ msg: "Can't update EUTxO in Database - Error: " + error})
            //     return
            // }else{
        console.log("/api/updateEUTxO - EUTxO updated in Database!"); 
        res.status(200).json({ msg: "EUTxO Updated in Database!"})
        return
        //     }
        //  }));
    } catch (error) {
        console.error("/api/updateEUTxO - Can't update EUTxO in Database - Error: " + error);
        res.status(400).json({ msg: "Can't update EUTxO in Database - Error: " + error})
        return
    }

}
