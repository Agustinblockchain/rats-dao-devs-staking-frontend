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
import { stakingPoolDBParser } from '../stakePool/helpersStakePool'
// import StakingPoolAdmin from '../components/StakingPoolAdmin';

//--------------------------------------


const Home : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	//console.log("Home")   

	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)
	
	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);

	const refreshData = () => {
		console.log ("Admin - refreshData - router.replace - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
		router.replace(router.basePath );
		setIsRefreshing(true);
	};

	//------------------
	useEffect(() => {
		setIsRefreshing(false);
		if (stakingPools){
			for (let i = 0; i < stakingPools.length; i++) {
				stakingPools[i] = stakingPoolDBParser(stakingPools[i]);
			}
			setStakingPoolsParsed (stakingPools)
		}
	}, [stakingPools]);
	

	const StakingPool = dynamic(() => import('../components/StakingPool'), { ssr: false, loading: () => <p>Loading...</p> })

	return (
		<Layout>

			{stakingPoolsParsed.length > 0 ? 
				stakingPoolsParsed.map(
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
		return {
			props: {
				stakingPools: dataStakingPools
			}
		};

	} catch (error) {
		console.error (error)
		const dataStakingPools : StakingPoolDBInterface [] = [];
		return {
			props: { 
				stakingPools: dataStakingPools 
			}
		};
	}
}

export default Home
