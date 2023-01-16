
import type { NextApiRequest, NextApiResponse } from 'next';
import { connect } from '../../utils/dbConnect';
import { toJson } from '../../utils/utils';
import { getSession } from 'next-auth/react';
import { getStakingPoolDBModel, getStakingPoolFromDBByName } from '../../types/stakePoolDBModel';

type Data = {
	msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

    //--------------------------------
    const session = await getSession({ req })
    if (!session) {
        console.error("/api/deleteStakingPool - Must Connect to your Wallet"); 
        res.status(400).json({ msg: "Must Connect to your Wallet" })
        return 
    }
    const sesionPkh = session?.user.pkh
    //--------------------------------

	const nombrePool = req.body.nombrePool

	await connect();

	console.log("/api/deleteStakingPool - Request: " + toJson(req.body.nombrePool));
	
    try{
        const stakingPoolWithSameName = await getStakingPoolFromDBByName (nombrePool)
        
        if (stakingPoolWithSameName.length === 0 ){
            console.error("/api/deleteStakingPool - Can't delete StakingPool in Database - Error: Can't find StakingPool: " + nombrePool); 
            res.status(400).json({ msg: "Can't delete StakingPool in Database - Error: Can't find StakingPool: " + nombrePool})
            return 
        } else if (stakingPoolWithSameName.length > 1 ){
            console.error("/api/deleteStakingPool - Can't delete StakingPool in Database - Error: StakingPool twice: " + nombrePool); 
            res.status(400).json({ msg: "Can't delete StakingPool in Database - Error: StakingPool twice " + nombrePool})
            return 
        } else {
            const stakingPool = stakingPoolWithSameName[0]

            if (!stakingPool.masters.includes(sesionPkh!)){
                console.error("/api/deleteStakingPool - You aren't master of this Staking Pool"); 
                res.status(400).json({ msg: "You aren't master of this Staking Pool"})
                return 
            }

            if (!stakingPool.swPoolReadyForDeletePoolInDB ){
                console.error("/api/deleteStakingPool - Staking Pool is not ready for delete");
                res.status(400).json({ msg: "Staking Pool is not ready for delete"})
                return 
            }

            var StakingPoolDBModel = getStakingPoolDBModel()
            // const filter = {name : nombrePool};
            // await StakingPoolDBModel.deleteOne(filter)

            const filter = {name : nombrePool};
            const update = { 
                name: nombrePool + "_DELETED_" + Date.now(),
                swDeleted: true
            };

            await StakingPoolDBModel.findOneAndUpdate(filter, update)

            console.log("/api/deleteStakingPool - StakingPool deleted in Database!");
            res.status(200).json({ msg: "StakingPool Deleted!"})
            return

        }
    } catch (error) {
        console.error("/api/deleteStakingPool - Can't delete StakingPool in Database - Error: " + error);
        res.status(400).json({ msg: "Can't delete StakingPool in Database - Error: " + error });
        return;
    }
}
