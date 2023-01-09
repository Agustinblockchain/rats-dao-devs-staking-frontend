
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../utils/dbConnect';
import { toJson } from '../../utils/utils';
import { getSession } from 'next-auth/react';
import { getStakingPoolDBModel, getStakingPoolFromDBByName, StakingPoolDBInterface } from '../../types/stakePoolDBModel';

type Data = {
	msg: string,
    stakingPool : StakingPoolDBInterface | undefined
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    const session = await getSession({ req })
	if (!session) {
		console.error("/api/updateStakingPoolShowOnHome - Must Connect to your Wallet"); 
        res.status(400).json({ msg: "Must Connect to your Wallet" , stakingPool: undefined})
        return 
    }
    const sesionPkh = session?.user.pkh
    //--------------------------------
    
	const nombrePool = req.body.nombrePool

	const swShowOnHome = req.body.swShowOnHome

    //--------------------------------

	await connect();

	console.log("/api/updateStakingPoolShowOnHome - Request: " + toJson(req.body.nombrePool));

    try {
        const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)
        
        if (stakingPoolWithSameName.length === 0 ){
            console.error("/api/updateStakingPoolShowOnHome - Can't update StakingPool in Database - Error: StakingPool not Exist: " + nombrePool); 
            res.status(400).json({ msg: "Can't update StakingPool in Database - Error: StakingPool not Exist: " + nombrePool, stakingPool: undefined})
            return 
        } else if (stakingPoolWithSameName.length > 1 ){
            console.error("/api/updateStakingPoolShowOnHome - Can't update StakingPool in Database - Error: StakingPool twice: " + nombrePool); 
            res.status(400).json({ msg: "Can't update StakingPool in Database - Error: StakingPool twice " + nombrePool, stakingPool: undefined})
            return 
        } else {
            const stakingPool = stakingPoolWithSameName[0]
            if (!stakingPool.masters.includes(sesionPkh!)){
                console.error("/api/updateStakingPoolShowOnHome - You aren't master of this Staking Pool"); 
                res.status(400).json({ msg: "You aren't master of this Staking Pool", stakingPool: undefined})
                return 
            }

            // console.log("/api/updateStakingPoolShowOnHome - staking pool found");
        
            var StakingPoolDBModel = getStakingPoolDBModel()

            stakingPool.swShowOnHome = swShowOnHome

            const filter = {name : nombrePool};
            const update = { 
                swShowOnHome: swShowOnHome, 
            };

            await StakingPoolDBModel.findOneAndUpdate(filter, update)

            console.log("/api/updateStakingPoolShowOnHome - StakingPool updated in Database!"); 
            res.status(200).json({ msg: "StakingPool Updated in Database!", stakingPool: stakingPool})
            return
        }

    } catch (error) {
        console.error("/api/updateStakingPoolShowOnHome - Can't update StakingPool in Database - Error: " + error);
        res.status(400).json({ msg: "Can't update StakingPool in Database - Error: " + error, stakingPool: undefined})
        return
    }
	
}
