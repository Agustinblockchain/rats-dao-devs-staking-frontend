
import type { NextApiRequest, NextApiResponse } from 'next';

import { connect } from '../../utils/dbConnect';
import { getSession } from 'next-auth/react';
import { EUTxO, Maybe, POSIXTime } from '../../types';
import { getEUTxODBModel, getEUTxOFromDBByTxHashAndIndex } from '../../types/eUTxODBModel';
import { toJson } from '../../utils/utils';

type Data = {
	msg: string,
    eUTxO : EUTxO | undefined
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

	//--------------------------------
    const session = await getSession({ req })
	if (!session) {
		console.error("/api/updateEUTxOIsPreparing - Must Connect to your Wallet"); 
        res.status(400).json({ msg: "Must Connect to your Wallet", eUTxO: undefined })
        return 
    }
    const sesionPkh = session?.user.pkh
    //--------------------------------
    
    const txHash = req.body.txHash
    const outputIndex = req.body.outputIndex
    const isPreparing = req.body.isPreparing

	await connect();

    var setIsPreparing : any
    if (isPreparing){
        const now = new Date();
        setIsPreparing = new Maybe<POSIXTime>(BigInt(now.getTime()))
    }else{
        setIsPreparing = new Maybe<POSIXTime>()
    }

	console.log("/api/updateEUTxOIsPreparing - " + isPreparing + " - Request: " + txHash + " - " + outputIndex);

	try {
        const eUTxOs_ = await getEUTxOFromDBByTxHashAndIndex (txHash, outputIndex)

        if (eUTxOs_.length == 0 ){
            console.error("/api/updateEUTxOIsPreparing - Can't update EUTxO in Database - Error: EUTxO not Exist: " + txHash + " - " + outputIndex);
            res.status(201).json({ msg: "Can't update EUTxO in Database - Error: EUTxO not Exist: " + txHash + " - " + outputIndex, eUTxO: undefined})
            return
        }else if (eUTxOs_.length > 1 ){
            console.error("/api/updateEUTxOIsPreparing - Can't update EUTxO in Database - Error: EUTxO twice: " + txHash + " - " + outputIndex);
            res.status(201).json({ msg: "Can't update EUTxO in Database - Error: EUTxO twice: " + txHash + " - " + outputIndex, eUTxO: undefined})
            return
        }else{

            var eUTxO_ = eUTxOs_[0]
            eUTxO_.isPreparing = setIsPreparing
            eUTxO_ = JSON.parse(toJson(eUTxO_))

            var EUTxODBModel = getEUTxODBModel()

            const filter = { "eUTxO.uTxO.txHash": txHash, "eUTxO.uTxO.outputIndex": outputIndex};
            const update = { 
                eUTxO: eUTxO_
            }

            await EUTxODBModel.findOneAndUpdate(filter, update)

            // console.log("/api/updateEUTxOIsPreparing - EUTxO updated in Database!"); 
            res.status(200).json({ msg: "EUTxO Updated in Database!", eUTxO: eUTxO_})
            return
            
        }
    } catch (error) {
        console.error("/api/updateEUTxOIsPreparing - Can't update EUTxO in Database - Error: " + error);
        res.status(400).json({ msg: "Can't update EUTxO in Database - Error: " + error, eUTxO: undefined})
        return
    }

}
