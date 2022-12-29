//--------------------------------------
import type { InferGetStaticPropsType, InferGetServerSidePropsType, NextPage } from 'next'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'
//--------------------------------------
// import safeJsonStringify from 'safe-json-stringify';
//--------------------------------------

import { toJson } from '../utils/utils'
import { connect } from '../utils/dbConnect'

import path from 'path'
import { useStoreState } from '../utils/walletProvider';

import { StakingPoolDBInterface, getStakingPools } from '../types/stakePoolDBModel'
import { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
// import StakingPoolAdmin from '../components/StakingPoolAdmin';

//--------------------------------------


const Home : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	//console.log("Home")   

	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = () => {

		console.log ("ROUTER HOME: walletStore.connected " + walletStore.connected + " router.asPath: " + router.asPath);

		router.replace(router.basePath );

		setIsRefreshing(true);
	};

	//------------------
	useEffect(() => {
		setIsRefreshing(false);
	}, [stakingPools]);
	

	const StakingPool = dynamic(() => import('../components/StakingPool'), { ssr: false, loading: () => <p>Loading...</p> })

	return (
		<Layout>

			{stakingPools.length > 0 ? 
				stakingPools.map(
					sp => <StakingPool key={sp.name} stakingPoolInfo={sp}  />
				)
			:
				<p>Can't find any Staking Pool available</p> 
			}	

		</Layout>
	)
}

export async function getServerSideProps() { 
	try {
		
		console.log ("Home getServerSideProps - init");

		await connect();

		var rawDataStakingPools : StakingPoolDBInterface []
		rawDataStakingPools = await getStakingPools(true)

		console.log ("Home getServerSideProps - stakingPool - length: " + rawDataStakingPools.length)
		const stringifiedDataStakingPools = toJson(rawDataStakingPools);
		const dataStakingPools : StakingPoolDBInterface [] = JSON.parse(stringifiedDataStakingPools);
		//console.log ("Home getServerSideProps - stakingPool length: " + dataStakingPools.length)
		return {
			props: {
				stakingPools: dataStakingPools
			}
		};

	} catch (error) {
		console.error (error)
		const dataStakingPools : StakingPoolDBInterface [] = [];
		return {
			props: { stakingPools: dataStakingPools }
		};
	}
}

export default Home
