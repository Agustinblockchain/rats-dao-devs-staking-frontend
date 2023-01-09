
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { deleteEUTxOsFromDBByTxHashAndIndex, getEUTxOFromDBByTxHashAndIndex } from  '../../types/eUTxODBModel'
import { EUTxO } from '../../types';
import { getSession } from 'next-auth/react';

type Data = {
    msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    // const session = await getSession({ req })
    // if (!session) {
    //     console.error("/api/deleteEUTxO - Must Connect to your Wallet"); 
    //     res.status(400).json({ msg: "Must Connect to your Wallet" })
    //     return 
    // }
    // const sesionPkh = session?.user.pkh
    //--------------------------------

    const eUTxO = req.body.eUTxO

    await connect();

	console.log("/api/deleteEUTxO - Request: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);

	try {
        const eUTxO_ = await getEUTxOFromDBByTxHashAndIndex (eUTxO.uTxO.txHash, eUTxO.uTxO.outputIndex)

        if (eUTxO_.length == 0 ){
            console.error("/api/deleteEUTxO - Can't delete EUTxO in Database - Error: EUTxO not Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);
            res.status(400).json({ msg: "Can't delete EUTxO in Database - Error: EUTxO not Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex})
            return
        // } else {
            // console.log("/api/deleteEUTxO - EUTxO Exist: " + eUTxO.uTxO.txHash + " - " + eUTxO.uTxO.outputIndex);
        }

        try{
            const count = await deleteEUTxOsFromDBByTxHashAndIndex(eUTxO.uTxO.txHash, eUTxO.uTxO.outputIndex) 
            console.log ("/api/deleteEUTxO - Deleted "+count+" EUTxO in Database" )
            res.status(200).json({ msg: "Deleted "+count+" EUTxO in Database"})
            return
        } catch (error) {
            console.error("/api/deleteEUTxO - Can't delete EUTxO in Database - Error: " + error); 
            res.status(400).json({ msg: "Can't delete EUTxO in Database - Error: " + error})
            return
        }
    } catch (error) {
        console.error("/api/deleteEUTxO - Can't delete EUTxO in Database - Error: " + error);
        res.status(400).json({ msg: "Can't delete EUTxO in Database - Error: " + error})
        return
    }





    

}
