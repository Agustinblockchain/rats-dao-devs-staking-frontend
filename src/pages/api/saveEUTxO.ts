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

	// const nombrePool = req.body.nombrePool

	const eUTxO = req.body.eUTxO

	await connect();

	// console.log("/api/saveEUTxO - Request: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);

    try {
        const eUTxO_ = await getEUTxOFromDBByTxHashAndIndex (eUTxO.uTxO.txHash, eUTxO.uTxO.outputIndex)

        if (eUTxO_.length != 0 ){
            // console.log("/api/saveEUTxO - EUTxO already Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);
            res.status(201).json({ msg: "EUTxO already Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex})
            return
        // } else {
        //     console.log("/api/saveEUTxO - EUTxO not Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);
        }

        var EUTxODBModel = getEUTxODBModel()

        const newEUTxODB = new EUTxODBModel({
            eUTxO: eUTxO
        });

        await newEUTxODB.save()
        //     function(error: any){
        //     if(error) {
        //         console.error("/api/saveEUTxO - Can't save EUTxO in Database - Error: " + error);
        //         res.status(400).json({ msg: "Can't save EUTxO in Database - Error: " + error})
        //         return
        //     }
        // // });
        console.log ("/api/saveEUTxO - EUTxO saved in Database: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex )
        res.status(200).json({ msg: "EUTxO saved in Database: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex})
        return
    } catch (error) {
        console.error("/api/saveEUTxO - Can't save EUTxO in Database - Error: " + error);
        res.status(400).json({ msg: "Can't save EUTxO in Database - Error: " + error})
        return
    }

}
