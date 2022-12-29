// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { strToHex, toJson } from '../../utils/utils';

import { getStakingPoolDBModel, getStakingPoolFromDBByName, StakingPoolDBInterface } from  '../../types/stakePoolDBModel'

type Data = {
	msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

	const nombrePool = req.body.nombrePool

	await connect();

	console.log("/api/deleteStakingPool - Request: " + toJson(req.body.nombrePool));
	
    try{
        const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)
        
        if (stakingPoolWithSameName.length === 0 ){
            console.error("/api/deleteStakingPool - Can't delete StakingPool in Database - Error: Can't find StakingPool: " + nombrePool); 
            res.status(400).json({ msg: "Can't delete StakingPool in Database - Error: Can't find StakingPool: " + nombrePool})
            return 
        // } else {
        // 	console.log("/api/deleteStakingPool - staking pool found");
        }
        
        var StakingPoolDBModel = getStakingPoolDBModel()

        const filter = {name : nombrePool};
        
        await StakingPoolDBModel.deleteOne(filter)
        // , undefined, function(error: any){
        //     if (error) {
        //         console.error("/api/deleteStakingPool - Can't delete StakingPool in Database - Error: " + error);
        //         res.status(400).json({ msg: "Can't delete StakingPool in Database - Error: " + error });
        //         return;
        //     }else{
        console.log("/api/deleteStakingPool - StakingPool deleted in Database!");
        res.status(200).json({ msg: "StakingPool Deleted!"})
        return
        //     }
        // });
    } catch (error) {
        console.error("/api/deleteStakingPool - Can't delete StakingPool in Database - Error: " + error);
        res.status(400).json({ msg: "Can't delete StakingPool in Database - Error: " + error });
        return;
    }
}
