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


const Withdraw : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	//console.log("Withdraw")   
	
	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const [pkh, setPkh] = useState<string | undefined>("");

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = (pkh : string | undefined) => {

		console.log ("ROUTER WITHDRAW: pkh: "+ pkh + "walletStore.connected " + walletStore.connected + " router.asPath: " + router.asPath);

		router.replace(router.basePath + "?pkh=" + pkh);

		setPkh(pkh);

		setIsRefreshing(true);
	};


	useEffect(() => {
		setIsRefreshing(false);
	}, [stakingPools]);
	
	useEffect(() => {
		// console.log("Withdraw - useEffect - walletStore.connected: " + walletStore.connected)
		
		if (walletStore.connected && pkh != walletStore.pkh) {
			refreshData(walletStore.pkh)
		}
	}, [walletStore.connected])

	const StakingPool = dynamic(() => import('../components/StakingPool'), { ssr: false, loading: () => <p>Loading...</p> })

	return (
		<Layout>
			{ !walletStore.connected?
					<div>Connect you wallet to see your Deposits</div>
				:
					stakingPools.length > 0 ? 
						stakingPools.map(
							sp => <StakingPool key={sp.name} stakingPoolInfo={sp}  />
						)
					:
						<p>Can't find any Staking Pool that you have deposited into</p> 
			}
		</Layout>
	)
}

export async function getServerSideProps(query : any) { 
	try {
		
		console.log ("Withdraw getServerSideProps - init - query.query?.pkh:", query.query?.pkh);

		await connect();

		var rawDataStakingPools : StakingPoolDBInterface []
		if (query.query?.pkh != undefined) {
			// console.log ("Withdraw1 getServerSideProps - init - query.query?.pkh:", query.query?.pkh);
			if(query.query?.pkh != ""){
				// console.log ("Withdraw2 getServerSideProps - init - query.query?.pkh:", query.query?.pkh);
				rawDataStakingPools  = await getStakingPools(true, query.query?.pkh)
			}else{
				// console.log ("Withdraw3 getServerSideProps - init - query.query?.pkh:", query.query?.pkh);
				rawDataStakingPools = []
			}
	 	}else{
			// console.log ("Withdraw4 getServerSideProps - init - query.query?.pkh:", query.query?.pkh);
			rawDataStakingPools = []
		}

		console.log ("Withdraw getServerSideProps - stakingPool - length: " + rawDataStakingPools.length)
		const stringifiedDataStakingPools = toJson(rawDataStakingPools);
		const dataStakingPools : StakingPoolDBInterface [] = JSON.parse(stringifiedDataStakingPools);
		//console.log ("Withdraw getServerSideProps - stakingPool length: " + dataStakingPools.length)
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

export default Withdraw
