// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { getEUTxOsFromDBByAddress } from  '../../types/eUTxODBModel'
import { EUTxO } from '../../types';

type Data = {
  msg: string
  eUTxOs : EUTxO []
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    const address = req.body.address

    await connect();
    
    console.log("/api/getEUTxOsByAddress - Request: " + toJson(req.body));

    try {
        const eUTxOs : EUTxO [] = await getEUTxOsFromDBByAddress(address);

        // console.log("/api/getEUTxOsByAddress - eUTxODB - length: " + eUTxODB.length);

        if (eUTxOs.length === 0){
            console.log("/api/getEUTxOsByAddress - Can't find EUTxOs at Address"); 
            res.status(201).json({ msg: "Can't find EUTxOs at Address", eUTxOs : []})
            return 
        } else {
            console.log("/api/getEUTxOsByAddress - EUTxOs found - lenght: " + eUTxOs.length);
            res.status(200).json({ msg: "EUTxOs found", eUTxOs : eUTxOs})
            return
        }
    } catch (error) {
        console.error("/api/getEUTxOsByAddress - Can't find EUTxOs - Error: " + error);
        res.status(400).json({ msg: "Can't find EUTxOs - Error: " + error, eUTxOs : []})
        return 
    }
  
}
