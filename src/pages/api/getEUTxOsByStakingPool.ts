
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { getEUTxOsFromDBByAddress } from  '../../types/eUTxODBModel'
import { EUTxO } from '../../types';
import { getSession } from 'next-auth/react';
import { getStakingPoolFromDBByName } from '../../types/stakePoolDBModel';

type Data = {
  msg: string
  eUTxOs : EUTxO []
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    // const session = await getSession({ req })
	// if (!session) {
	// 	console.error("/api/getEUTxOsByStakingPool - Must Connect to your Wallet"); 
    //     res.status(400).json({ msg: "Must Connect to your Wallet" , eUTxOs: []})
    //     return 
    // }
    // const sesionPkh = session?.user.pkh
    //--------------------------------
    
    const nombrePool = req.body.nombrePool

    await connect();
    
    console.log("/api/getEUTxOsByStakingPool - Request: " + toJson(req.body));

    try {

        const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)
        
        if (stakingPoolWithSameName.length === 0 ){
            console.error("/api/getEUTxOsByStakingPool - Can't get EUTxOs By StakingPool in Database - Error: Can't find StakingPool: " + nombrePool); 
            res.status(400).json({ msg: "Can't get EUTxOs By StakingPool in Database - Error: Can't find StakingPool: " + nombrePool, eUTxOs : []})
            return 
        } else if (stakingPoolWithSameName.length > 1 ){
            console.error("/api/getEUTxOsByStakingPool - Can't get EUTxOs By StakingPool in Database - Error: StakingPool twice: " + nombrePool); 
            res.status(400).json({ msg: "Can't get EUTxOs By StakingPool in Database - Error: StakingPool twice " + nombrePool, eUTxOs : []})
            return 
        } else {
            const stakingPool = stakingPoolWithSameName[0]

            const address = stakingPool.scriptAddress

            const eUTxOs : EUTxO [] = await getEUTxOsFromDBByAddress(address);

            // console.log("/api/getEUTxOsByStakingPool - eUTxODB - length: " + eUTxODB.length);

            if (eUTxOs.length === 0){
                console.log("/api/getEUTxOsByStakingPool - Can't find EUTxOs at Address"); 
                res.status(201).json({ msg: "Can't find EUTxOs at Address", eUTxOs : []})
                return 
            } else {
                console.log("/api/getEUTxOsByStakingPool - EUTxOs found - lenght: " + eUTxOs.length);
                res.status(200).json({ msg: "EUTxOs found", eUTxOs : eUTxOs})
                return
            }
        }
    } catch (error) {
        console.error("/api/getEUTxOsByStakingPool - Can't find EUTxOs - Error: " + error);
        res.status(400).json({ msg: "Can't find EUTxOs - Error: " + error, eUTxOs : []})
        return 
    }
  
}
