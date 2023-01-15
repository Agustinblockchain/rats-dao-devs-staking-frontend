
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { getDatumDBModel, getDatumFromDBByDatumHash } from  '../../types/datumDBModel'
import { getSession } from 'next-auth/react';

type Data = {
	msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

	//--------------------------------
    // const session = await getSession({ req })
	// if (!session) {
	// 	console.error("/api/saveDatum - Must Connect to your Wallet"); 
    //     res.status(400).json({ msg: "Must Connect to your Wallet" })
	// 	return 
    // }
    // const sesionPkh = session?.user.pkh
    //--------------------------------
	
	const datumHash = req.body.datumHash
	const datum = req.body.datum

	await connect();

	//console.log("/api/saveDatum - Request: " + toJson(req));
	//console.log("/api/saveDatum - Request: " + toJson(req.body));

	try {
		const datumDB : any = await getDatumFromDBByDatumHash(datumHash);

        if (datumDB.length != 0 ){
            // console.log("/api/saveDatum - Datum already Exist");
            res.status(201).json({ msg: "Datum already Exist"})
            return
        }

		var datumDBModel = getDatumDBModel()

		const newDatumDB = new datumDBModel({
			datumHash: `${datumHash}`,
			datum: `${datum}`,
		});
		
		await newDatumDB.save()

		res.status(200).json({ msg: "Datum saved in Database!"})
		return
	} catch (error) {
		console.error("/api/saveDatum - Can't save datum in Database - Error: " + error);
		res.status(400).json({ msg: "Can't save datum in Database - Error: " + error})
		return 
	}
}
