// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { getDatumDBModel, getDatumFromDBByDatumHash } from  '../../types/datumDBModel'

type Data = {
    msg: string
    datum : string | undefined
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    const datumHash = req.body.datumHash

    await connect();

    console.log("/api/getDatum - Request: " + toJson(req.body));

    try {

        const datumDB : any = await getDatumFromDBByDatumHash(datumHash);

        if (datumDB.length === 0){
            console.log("/api/getDatum - Can't find Datum Hash"); 
            res.status(201).json({ msg: "Can't find Datum Hash", datum : undefined})
            return 
        } else {
            console.log("/api/getDatum - Datum Hash found: " + datumDB[0].datum);
            res.status(200).json({ msg: "Datum Hash found", datum : datumDB[0].datum})
            return
        }
    } catch (error) {
        console.error("/api/getDatum - Can't find Datum Hash - Error: " + error);
        res.status(400).json({ msg: "Can't find Datum Hash - Error: " + error, datum : undefined})
        return 
    }
  
}
