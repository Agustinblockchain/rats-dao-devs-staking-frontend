
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../utils/dbConnect';
import { toJson } from '../../utils/utils';
import { getAllDatumsFromDB, getDatumFromDBByDatumHash } from '../../types/datumDBModel';
import { getSession } from 'next-auth/react';

type Data = {
    msg: string
    count : string | undefined
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

     //--------------------------------
     const session = await getSession({ req })
     if (!session) {
         console.error("/api/getAllDatumsCount - Must Connect to your Wallet"); 
         res.status(400).json({ msg: "Must Connect to your Wallet" , count : undefined})
         return 
     }
     const sesionPkh = session?.user.pkh
     //--------------------------------
     if (!(session?.user.swCreate)){
         console.error("/api/getAllDatumsCount - You Can't Access"); 
         res.status(400).json({ msg: "You Can't Access" , count : undefined})
         return 
     }
     //--------------------------------
    
    await connect();

    console.log("/api/getAllDatumsCount - Request: " + toJson(req.body));

    try {

        const datumsDB : any = await getAllDatumsFromDB();

        console.log("/api/getAllDatumsCount - Count: " + datumsDB.length);
        res.status(200).json({ msg: "Ok", count : datumsDB.length})
        return
        
    } catch (error) {
        console.error("/api/getAllDatumsCount - Error: " + error);
        res.status(400).json({ msg: "Error: " + error, count : undefined})
        return 
    }
  
}
