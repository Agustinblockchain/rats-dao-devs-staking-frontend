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
import StakingPool from '../components/StakingPool'

//--------------------------------------

const Home : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({pkh, swCreate, stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)
	
	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);

	const refreshData = () => {
		console.log ("Home - refreshData - router.replace - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
		router.replace(router.basePath)
		setIsRefreshing(true);
	};

	useEffect(() => {
		setIsRefreshing(false);
	}, []);

	useEffect(() => {
		if (walletStore.connected && pkh != walletStore.pkh) {
			refreshData()
		}else if (!walletStore.connected) {
			refreshData()
		}
	}, [walletStore.connected])

	useEffect(() => {
		if (stakingPools){
			for (let i = 0; i < stakingPools.length; i++) {
				stakingPools[i] = stakingPoolDBParser(stakingPools[i]);
			}
			setStakingPoolsParsed (stakingPools)
		}
		setIsRefreshing(false);
	}, [stakingPools]);

	// const StakingPool = dynamic(() => import('../components/StakingPool'), { ssr: false, loading: () => <p>Loading...</p> })

	return (
		<Layout swCreate={swCreate}>
			{
				(isRefreshing) ?
					<div>Loading Staking Pools...</div>
				:
					stakingPoolsParsed.length > 0 ? 
						stakingPoolsParsed.map(
							sp => 
								(typeof window !== 'undefined' && <StakingPool key={sp.name} stakingPoolInfo={sp}  />)
								
						)
					:
						<p>Can't find any Staking Pool available</p> 
			}	
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		console.log ("Home getServerSideProps -------------------------------");
		await connect();
		const session = await getSession(context)
		if (session) {
			console.log ("Home getServerSideProps - init - session:", toJson (session));
		}else{
			//console.log ("Create getServerSideProps - init - session: undefined");
		}
		var rawDataStakingPools : StakingPoolDBInterface []
		rawDataStakingPools = await getStakingPools(true)
		
		console.log ("Home getServerSideProps - stakingPool - length: " + rawDataStakingPools.length)
		const stringifiedDataStakingPools = toJson(rawDataStakingPools);
		const dataStakingPools : StakingPoolDBInterface [] = JSON.parse(stringifiedDataStakingPools);
		return {
			props: {
				pkh: session?.user.pkh !== undefined ? session?.user.pkh : "",
				swCreate: session && session.user ? session.user.swCreate : false ,
				stakingPools: dataStakingPools
			}
		};

	} catch (error) {
		console.error (error)
		const dataStakingPools : StakingPoolDBInterface [] = [];
		return {
			props: { 
				pkh: "",
				swCreate: false,
				stakingPools: dataStakingPools 
			}
		};
	}
}

export default Home
