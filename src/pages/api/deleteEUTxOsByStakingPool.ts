
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { deleteEUTxOsFromDBByAddress } from  '../../types/eUTxODBModel'
import { EUTxO } from '../../types';
import { getSession } from 'next-auth/react';
import { getStakingPoolFromDBByName } from '../../types/stakePoolDBModel';

type Data = {
    msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    const session = await getSession({ req })
    if (!session) {
        console.error("/api/deleteEUTxOsByStakingPool - Must Connect to your Wallet"); 
        res.status(400).json({ msg: "Must Connect to your Wallet" })
        return 
    }
    const sesionPkh = session?.user.pkh
    //--------------------------------
    
    const nombrePool = req.body.nombrePool

    await connect();

    console.log("/api/deleteEUTxOsByStakingPool - Request: " + toJson(req.body));

    try{

        const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)
        
        if (stakingPoolWithSameName.length === 0 ){
            console.error("/api/deleteEUTxOsByStakingPool - Can't delete EUTxOs By StakingPool in Database - Error: Can't find StakingPool: " + nombrePool); 
            res.status(400).json({ msg: "Can't delete EUTxOs By StakingPool in Database - Error: Can't find StakingPool: " + nombrePool})
            return 
        } else if (stakingPoolWithSameName.length > 1 ){
            console.error("/api/deleteEUTxOsByStakingPool - Can't delete EUTxOs By StakingPool in Database - Error: StakingPool twice: " + nombrePool); 
            res.status(400).json({ msg: "Can't delete EUTxOs By StakingPool in Database - Error: StakingPool twice " + nombrePool})
            return 
        } else {
            const stakingPool = stakingPoolWithSameName[0]
            if (!stakingPool.masters.includes(sesionPkh!)){
                console.error("/api/deleteEUTxOsByStakingPool - You aren't master of this Staking Pool"); 
                res.status(400).json({ msg: "You aren't master of this Staking Pool"})
                return 
            }

            const address = stakingPool.scriptAddress

            const count = await deleteEUTxOsFromDBByAddress(address) 
            console.log ("/api/deleteEUTxOsByStakingPool - Deleted "+count+" EUTxOs in Database")
            res.status(200).json({ msg: "Updated "+count+" EUTxOs in Database"})
            return
        }

    } catch (error) {
        console.error("/api/deleteEUTxOsByStakingPool - Can't delete EUTxOs in Database - Error: " + error); 
        res.status(400).json({ msg: "Can't delete EUTxOs in Database - Error: " + error})
        return
    }

}
