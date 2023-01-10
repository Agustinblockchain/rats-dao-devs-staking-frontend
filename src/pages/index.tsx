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
import { getSession } from 'next-auth/react'

//--------------------------------------

const Home : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({stakingPools, swCreate} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	//console.log("Home")   

	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)
	
	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);

	const refreshData = (pkh : string | undefined) => {
		console.log ("Home - refreshData - router.replace - pkh: "+ pkh + " - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
		router.replace(router.basePath + "?pkh=" + pkh);
		setIsRefreshing(true);
	};

	useEffect(() => {
		setIsRefreshing(false);
	}, []);
	
	useEffect(() => {
		// console.log("Home - useEffect - walletStore.connected: " + walletStore.connected)
		if (walletStore.connected ) {
			refreshData(walletStore.pkh)
		}else{
			refreshData(undefined)

		}
	}, [walletStore.connected])

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
		<Layout swCreate={swCreate}>

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

export async function getServerSideProps(context : any) { 
	try {
		
		console.log ("Home getServerSideProps - init");

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
				swCreate: session && session.user ? session.user.swCreate : false ,
				stakingPools: dataStakingPools
			}
		};

	} catch (error) {
		console.error (error)
		const dataStakingPools : StakingPoolDBInterface [] = [];
		return {
			props: { 
				swCreate: false,
				stakingPools: dataStakingPools 
			}
		};
	}
}

export default Home
