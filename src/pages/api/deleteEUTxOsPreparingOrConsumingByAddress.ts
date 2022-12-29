// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { deleteEUTxOsFromDBByAddress, deleteEUTxOsFromDBPreparingOrConsumingByAddress } from  '../../types/eUTxODBModel'
import { EUTxO } from '../../types';

type Data = {
    msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    const address = req.body.address

    await connect();

    console.log("/api/deleteEUTxOsPreparingOrConsumingByAddress - Request: " + toJson(req.body));

    try{
        const count = await deleteEUTxOsFromDBPreparingOrConsumingByAddress(address) 
        console.log ("/api/deleteEUTxOsPreparingOrConsumingByAddress - Deleted "+count+" EUTxOs in Database")
        res.status(200).json({ msg: "Deleted "+count+" EUTxOs in Database"})
        return
    } catch (error) {
        console.error("/api/deleteEUTxOsPreparingOrConsumingByAddress - Can't delete EUTxOs in Database - Error: " + error); 
        res.status(400).json({ msg: "Can't delete EUTxOs in Database - Error: " + error})
        return
    }

}
