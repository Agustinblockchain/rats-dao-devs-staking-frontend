
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { getSession } from 'next-auth/react';
import { deleteAllDatumsFromDB } from '../../types/datumDBModel';

type Data = {
    msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    const session = await getSession({ req })
    if (!session) {
        console.error("/api/deleteAllDatums - Must Connect to your Wallet"); 
        res.status(400).json({ msg: "Must Connect to your Wallet" })
        return 
    }
    const sesionPkh = session?.user.pkh
    //--------------------------------
	if (!(session?.user.swCreate)){
		console.error("/api/deleteAllDatums - You Can't Delete Datums"); 
		res.status(400).json({ msg: "You Can't Delete Datums"})
		return 
	}
    //--------------------------------
    
    await connect();

    console.log("/api/deleteAllDatums - Request: " + toJson(req.body));

    try{
        const count = await deleteAllDatumsFromDB() 
        console.log ("/api/deleteAllDatums - Deleted "+count+" Datums in Database")
        res.status(200).json({ msg: "Deleted "+count+" Datums in Database"})
        return
    
    } catch (error) {
        console.error("/api/deleteAllDatums - Can't delete Datums in Database - Error: " + error); 
        res.status(400).json({ msg: "Can't delete Datums in Database - Error: " + error})
        return
    }

}
