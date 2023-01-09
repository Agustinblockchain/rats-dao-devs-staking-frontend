//--------------------------------------
import type { InferGetStaticPropsType, InferGetServerSidePropsType, NextPage } from 'next'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'
import { toJson } from '../utils/utils'
import { connect } from '../utils/dbConnect'
import { useStoreState } from '../utils/walletProvider';
import { StakingPoolDBInterface, getStakingPools } from '../types/stakePoolDBModel'
import { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { stakingPoolDBParser } from '../stakePool/helpersStakePool'
import { getSession, useSession } from 'next-auth/react'
//--------------------------------------
const Admin : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({stakingPools, pkh} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)

	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);

	const refreshData = (pkh : string | undefined) => {
		console.log ("Admin - refreshData - router.replace - pkh: "+ pkh + " - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
		router.replace(router.basePath + "?pkh=" + pkh);
		setIsRefreshing(true);
	};

	useEffect(() => {
		setIsRefreshing(false);
		if (stakingPools){
			for (let i = 0; i < stakingPools.length; i++) {
				stakingPools[i] = stakingPoolDBParser(stakingPools[i]);
			}
			setStakingPoolsParsed (stakingPools)
		}
	}, [stakingPools]);
	
	useEffect(() => {
		// console.log("Admin - useEffect - walletStore.connected: " + walletStore.connected + " - walletStore.pkh: " + walletStore.pkh + " - pkh: " + pkh)
		if (walletStore.connected && pkh != walletStore.pkh) {
			refreshData(walletStore.pkh)
		}
	}, [walletStore.connected])

	const StakingPoolAdmin = dynamic(() => import('../components/StakingPoolAdmin'), { ssr: false, loading: () => <p>Loading...</p> })

	return (
		<Layout>
			{ !walletStore.connected?
					<div>Connect you wallet to see Staking Pools to Admin</div>
				:
					stakingPoolsParsed.length > 0 ? 
						stakingPoolsParsed.map(
							sp => <StakingPoolAdmin key={sp.name} stakingPoolInfo={sp}  />
						)
					:
						<p>Can't find any Staking Pool to Admin</p> 
			}

		</Layout>
	)
}

export async function getServerSideProps(context : any) { 

	try {
		
		console.log ("Admin getServerSideProps -------------------------------");
		console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);

		await connect();

		var rawDataStakingPools : StakingPoolDBInterface []
		if (context.query?.pkh != undefined) {
			// console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
			if(context.query?.pkh != ""){

				const session = await getSession(context)
				if (session) {
					console.log ("Admin getServerSideProps - init - session:", toJson (session));

					if (session.user.pkh === context.query?.pkh) {
						rawDataStakingPools  = await getStakingPools(false, context.query?.pkh, session?.user.swAdmin)
					}else{
						rawDataStakingPools = []
					}

				}else{
					//console.log ("Admin getServerSideProps - init - session: undefined");
					rawDataStakingPools = []
				}

			}else{
				// console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
				rawDataStakingPools = []
			}
	 	}else{
			// console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
			rawDataStakingPools = []
		}

		console.log ("Admin getServerSideProps - stakingPool - length: " + rawDataStakingPools.length)
		const stringifiedDataStakingPools = toJson(rawDataStakingPools);
		const dataStakingPools : StakingPoolDBInterface [] = JSON.parse(stringifiedDataStakingPools);

		return {
			props: {
				stakingPools: dataStakingPools,
				pkh: context.query?.pkh !== undefined ? context.query?.pkh : ""
			}
		};

	} catch (error) {
		console.error (error)
		const dataStakingPools : StakingPoolDBInterface [] = [];
		return {
			props: { 
				stakingPools: dataStakingPools,
				pkh: context.query?.pkh !== undefined ? context.query?.pkh : ""
			}
		};
	}

}

export default Admin
