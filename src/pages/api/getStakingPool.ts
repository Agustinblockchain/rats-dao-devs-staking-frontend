
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { toJson } from '../../utils/utils';

import { getDatumDBModel, getDatumFromDBByDatumHash } from  '../../types/datumDBModel'
import { getStakingPoolFromDBByName, StakingPoolDBInterface } from '../../types/stakePoolDBModel';
import { PoolDatum } from '../../types';
import { serverSide_updateStakingPool } from '../../stakePool/helpersServerSide';
import { getSession } from 'next-auth/react';
import { stakingPoolDBParser } from '../../stakePool/helpersStakePool';

type Data = {
    msg: string
    stakingPool : StakingPoolDBInterface | undefined
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    // const session = await getSession({ req })
	// if (!session) {
	// 	console.error("/api/getStakingPool - Must Connect to your Wallet"); 
    //     res.status(400).json({ msg: "Must Connect to your Wallet" , stakingPool: undefined})
    //     return 
    // }
    // const sesionPkh = session?.user.pkh
    //--------------------------------
    
    const nombrePool = req.body.nombrePool

    await connect();

    console.log("/api/getStakingPool - Request: " + toJson(req.body));

    try {

        const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)

        if (stakingPoolWithSameName.length === 0 ){
            console.error("/api/getStakingPool - Can't get StakingPool in Database - Error: StakingPool not Exist: " + nombrePool); 
            res.status(400).json({ msg: "Can't get StakingPool in Database - Error: StakingPool not Exist: " + nombrePool, stakingPool: undefined})
            return 
        } else if (stakingPoolWithSameName.length > 1 ){
            console.error("/api/getStakingPool - Can't get StakingPool in Database - Error: StakingPool twice: " + nombrePool); 
            res.status(400).json({ msg: "Can't get StakingPool in Database - Error: StakingPool twice " + nombrePool, stakingPool: undefined})
            return 
        } else {
            const stakingPool = stakingPoolWithSameName[0]
            const stakingPool_Parsed = stakingPoolDBParser(stakingPool);
            const stakingPoolDB_Updated = await serverSide_updateStakingPool (stakingPool_Parsed)

            //console.log("/api/getStakingPool - StakingPool found: " + stakingPoolDB_Updated.name);
            res.status(200).json({ msg: "StakingPool found", stakingPool : stakingPoolDB_Updated})
            return
        }
    } catch (error) {
        console.error("/api/getStakingPool - Can't get StakingPool in Database - Error: " + error);
        res.status(400).json({ msg: "Can't get StakingPool in Database - Error:" + error, stakingPool : undefined})
        return 
    }
  
}
