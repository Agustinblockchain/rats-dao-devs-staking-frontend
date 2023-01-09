
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../utils/dbConnect';
import { EUTxO, Maybe, POSIXTime } from '../../types';
import { getEUTxODBModel, getEUTxOFromDBByTxHashAndIndex } from '../../types/eUTxODBModel';
import { getSession } from 'next-auth/react';
import { toJson } from '../../utils/utils';

type Data = {
	msg: string
    eUTxO : EUTxO | undefined
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    const session = await getSession({ req })
	if (!session) {
		console.error("/api/updateEUTxOIsConsuming - Must Connect to your Wallet"); 
        res.status(400).json({ msg: "Must Connect to your Wallet", eUTxO: undefined })
        return 
    }
    const sesionPkh = session?.user.pkh
    //--------------------------------
    
    const txHash = req.body.txHash
    const outputIndex = req.body.outputIndex
    const isConsuming = req.body.isConsuming

	await connect();

    var setIsConsuming : any
    if (isConsuming){
        const now = new Date();
        setIsConsuming = new Maybe<POSIXTime>(BigInt(now.getTime()))
    }else{
        setIsConsuming = new Maybe<POSIXTime>()
    }

	console.log("/api/updateEUTxOIsConsuming - " + isConsuming + " - Request: " + txHash + " - " + outputIndex);

	try {
        const eUTxOs_ = await getEUTxOFromDBByTxHashAndIndex (txHash, outputIndex)

        if (eUTxOs_.length == 0 ){
            console.error("/api/updateEUTxOIsConsuming - Can't update EUTxO in Database - Error: EUTxO not Exist: " + txHash + " - " + outputIndex);
            res.status(201).json({ msg: "Can't update EUTxO in Database - Error: EUTxO not Exist: " + txHash + " - " + outputIndex, eUTxO: undefined })
            return
        }else if (eUTxOs_.length > 1 ){
            console.error("/api/updateEUTxOIsConsuming - Can't update EUTxO in Database - Error: EUTxO twice: " + txHash + " - " + outputIndex);
            res.status(201).json({ msg: "Can't update EUTxO in Database - Error: EUTxO twice: " + txHash + " - " + outputIndex, eUTxO: undefined})
            return
        }else{

            var eUTxO_ = eUTxOs_[0]
            eUTxO_.isConsuming = setIsConsuming
            eUTxO_ = JSON.parse(toJson(eUTxO_))

            var EUTxODBModel = getEUTxODBModel()

            const filter = { "eUTxO.uTxO.txHash": txHash, "eUTxO.uTxO.outputIndex": outputIndex};
            const update = { 
                eUTxO: JSON.parse(toJson(eUTxO_))
            }

            await EUTxODBModel.findOneAndUpdate(filter, update)

            // console.log("/api/updateEUTxOIsConsuming - EUTxO updated in Database!"); 
            res.status(200).json({ msg: "EUTxO Updated in Database!", eUTxO: eUTxO_ })
            return
            
        }
    } catch (error) {
        console.error("/api/updateEUTxOIsConsuming - Can't update EUTxO in Database - Error: " + error);
        res.status(400).json({ msg: "Can't update EUTxO in Database - Error: " + error, eUTxO: undefined })
        return
    }

}
