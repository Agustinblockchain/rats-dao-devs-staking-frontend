
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

    // const session = await getSession({ req })
	// if (!session) {
	// 	console.error("/api/getEUTxOsByStakingPool - Must Connect to your Wallet"); 
    //     res.status(400).json({ msg: "Must Connect to your Wallet" , eUTxOs: []})
    //     return 
    // }
    // const sesionPkh = session?.user.pkh
    //--------------------------------
    //console.log("/api/getEUTxOsByStakingPool - Request: " + toJson(req.body));
    const nombrePool = req.body.nombrePool
    await connect();
    try {
        const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)
        if (stakingPoolWithSameName.length === 0 ){
            console.error("/api/getEUTxOsByStakingPool - "+nombrePool+" - Can't get EUTxOs - Error: Can't find StakingPool"); 
            res.status(400).json({ msg: "Can't get EUTxOs - "+nombrePool+" - Error: Can't find StakingPool", eUTxOs : []})
            return 
        } else if (stakingPoolWithSameName.length > 1 ){
            console.error("/api/getEUTxOsByStakingPool - "+nombrePool+" - Can't get EUTxOs - Error: StakingPool twice"); 
            res.status(400).json({ msg: "Can't get EUTxOs - Error: StakingPool twice", eUTxOs : []})
            return 
        } else {
            const stakingPool = stakingPoolWithSameName[0]
            const address = stakingPool.scriptAddress
            const eUTxOs : EUTxO [] = await getEUTxOsFromDBByAddress(address);
            // console.log("/api/getEUTxOsByStakingPool - "+nombrePool+" - eUTxOs: " + eUTxODB.length);
            if (eUTxOs.length === 0){
                console.log("/api/getEUTxOsByStakingPool - "+nombrePool+" - EUTxOs: " + eUTxOs.length + ""); 
                res.status(201).json({ msg: "EUTxOs: " + eUTxOs.length + "", eUTxOs : []})
                return 
            } else {
                console.log("/api/getEUTxOsByStakingPool - "+nombrePool+" - EUTxOs: " + eUTxOs.length + "");
                res.status(200).json({ msg: "EUTxOs: " + eUTxOs.length + "", eUTxOs : eUTxOs})
                return
            }
        }
    } catch (error) {
        console.error("/api/getEUTxOsByStakingPool - "+nombrePool+" - Can't get EUTxOs - Error: " + error);
        res.status(400).json({ msg: "Can't get EUTxOs - Error: " + error, eUTxOs : []})
        return 
    }
}
