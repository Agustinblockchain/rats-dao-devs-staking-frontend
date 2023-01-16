//--------------------------------------
import type { InferGetStaticPropsType, InferGetServerSidePropsType, NextPage } from 'next'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'
import { toJson } from '../utils/utils'
import { connect } from '../utils/dbConnect'
import { useStoreActions, useStoreState } from '../utils/walletProvider';
import { StakingPoolDBInterface, getStakingPools } from '../types/stakePoolDBModel'
import { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { stakingPoolDBParser } from '../stakePool/helpersStakePool'
import { getSession, useSession } from 'next-auth/react'
import StakingPoolAdmin from '../components/StakingPoolAdmin'
//--------------------------------------
const Admin : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({pkh, stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const { data: session, status } = useSession()

	const [isRefreshing, setIsRefreshing] = useState(true);
	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);

	const router = useRouter();
	const refreshData = () => {
		console.log ("Admin - refreshData");
		router.replace(router.basePath)
		setIsRefreshing(true);
	};

	useEffect(() => {
		if (status == "authenticated" && session?.user.pkh != pkh) {
			refreshData()
		} else if (status == "unauthenticated" && pkh != "") {
			refreshData()
		}
	}, [status])

	useEffect(() => {
		if (stakingPools){
			for (let i = 0; i < stakingPools.length; i++) {
				stakingPools[i] = stakingPoolDBParser(stakingPools[i]);
			}
			setStakingPoolsParsed (stakingPools)
		}
		setIsRefreshing(false);
	}, [stakingPools]);

	return (
		<Layout swCreate={session?.user.swCreate}>
		{
			(status == "loading")? 
				<p>Loading Session...</p>
			:
				(isRefreshing) ?
					<div>Loading Staking Pools...</div>
				:
					(status === "unauthenticated")? 
						<p>Connect you wallet to see Staking Pools to Admin</p>
					:
						stakingPoolsParsed.length > 0 ? 
							stakingPoolsParsed.map(
								sp => 
								(typeof window !== 'undefined' && <StakingPoolAdmin key={sp.name} stakingPoolInfo={sp}  />)
							)
						:
							<p>Can't find any Staking Pool to Admin.</p> 
		}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		console.log ("Admin getServerSideProps -------------------------------");
		//console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
		await connect();
		const session = await getSession(context)
		var rawDataStakingPools : StakingPoolDBInterface []
		if (session) {
			console.log ("Admin getServerSideProps - init - session:", toJson (session));
			if (session.user.pkh !== undefined) {
				rawDataStakingPools  = await getStakingPools(false, session.user.pkh, session.user.swAdmin)
			}else{
				rawDataStakingPools = []
			}
		}else{
			rawDataStakingPools = []
		}

		console.log ("Admin getServerSideProps - stakingPool - length: " + rawDataStakingPools.length)
		const stringifiedDataStakingPools = toJson(rawDataStakingPools);
		const dataStakingPools : StakingPoolDBInterface [] = JSON.parse(stringifiedDataStakingPools);
		return {
			props: {
				pkh: session?.user.pkh !== undefined ? session?.user.pkh : "",
				stakingPools: dataStakingPools
			}
		};

	} catch (error) {
		console.error (error)
		const dataStakingPools : StakingPoolDBInterface [] = [];
		return {
			props: { 
				pkh: "",
				stakingPools: dataStakingPools
			}
		};
	}

}

export default Admin
