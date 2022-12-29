// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { getEUTxOsFromDBByAddress, getEUTxOsFromDBByAddressAndPkh } from  '../../types/eUTxODBModel'
import { EUTxO } from '../../types';

type Data = {
  msg: string
  eUTxOs : EUTxO []
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    const address = req.body.address
    const pkh = req.body.pkh

    await connect();
    
    console.log("/api/getEUTxOsByAddressAndPkh - Request: " + toJson(req.body));

    try {
        const eUTxOs : EUTxO [] = await getEUTxOsFromDBByAddressAndPkh(address, pkh);

        // console.log("/api/getEUTxOsByAddressAndPkh - eUTxODB - length: " + eUTxODB.length);

        if (eUTxOs.length === 0){
            console.log("/api/getEUTxOsByAddressAndPkh - Can't find EUTxOs at Address and Pkh"); 
            res.status(201).json({ msg: "Can't find EUTxOs at Address and Pkh", eUTxOs : []})
            return 
        } else {
            console.log("/api/getEUTxOsByAddressAndPkh - EUTxOs found - lenght: " + eUTxOs.length);
            res.status(200).json({ msg: "EUTxOs found", eUTxOs : eUTxOs})
            return
        }
    } catch (error) {
        console.error("/api/getEUTxOsByAddressAndPkh - Can't find EUTxOs - Error: " + error);
        res.status(400).json({ msg: "Can't find EUTxOs - Error: " + error, eUTxOs : []})
        return 
    }
  
}
