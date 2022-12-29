// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { deleteEUTxOsFromDBByAddress } from  '../../types/eUTxODBModel'
import { EUTxO } from '../../types';

type Data = {
    msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    const address = req.body.address

    await connect();

    console.log("/api/deleteEUTxOsByAddress - Request: " + toJson(req.body));

    try{
        const count = await deleteEUTxOsFromDBByAddress(address) 
        console.log ("/api/deleteEUTxOsByAddress - Deleted "+count+" EUTxOs in Database")
        res.status(200).json({ msg: "Updated "+count+" EUTxOs in Database"})
        return
    } catch (error) {
        console.error("/api/deleteEUTxOsByAddress - Can't delete EUTxOs in Database - Error: " + error); 
        res.status(400).json({ msg: "Can't delete EUTxOs in Database - Error: " + error})
        return
    }

}
