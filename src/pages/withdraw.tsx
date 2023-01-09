//--------------------------------------
import type { InferGetStaticPropsType, InferGetServerSidePropsType, NextPage } from 'next'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'
//--------------------------------------
// import safeJsonStringify from 'safe-json-stringify';
//--------------------------------------

import { toJson } from '../utils/utils'
import { connect } from '../utils/dbConnect'
import { useStoreState } from '../utils/walletProvider';
import { StakingPoolDBInterface, getStakingPools } from '../types/stakePoolDBModel'
import { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSession } from 'next-auth/react'
import { stakingPoolDBParser } from '../stakePool/helpersStakePool'
//--------------------------------------

const Withdraw : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({stakingPools, pkh} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)

	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);

	const refreshData = (pkh : string | undefined) => {
		console.log ("Withdraw - refreshData - router.replace - pkh: "+ pkh + " - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
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
		// console.log("Withdraw - useEffect - walletStore.connected: " + walletStore.connected)
		if (walletStore.connected ) {
			refreshData(walletStore.pkh)
		}else{
			refreshData(undefined)

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
						<p>Can't find any Staking Pool that you have deposited into.</p> 
			}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		
		console.log ("Withdraw getServerSideProps -------------------------------");
		console.log ("Withdraw getServerSideProps - init - context.query?.pkh:", context.query?.pkh);

		await connect();

		var rawDataStakingPools : StakingPoolDBInterface []
		if (context.query?.pkh != undefined) {
			// console.log ("Withdraw1 getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
			if(context.query?.pkh != ""){
				// console.log ("Withdraw2 getServerSideProps - init - context.query?.pkh:", context.query?.pkh);

				const session = await getSession(context)
				if (session) {
					console.log ("Withdraw getServerSideProps - init - session:", toJson (session));

					if (session.user.pkh === context.query?.pkh) {
						rawDataStakingPools  = await getStakingPools(true, context.query?.pkh)
					}else{
						rawDataStakingPools = []
					}

				}else{
					//console.log ("Withdraw getServerSideProps - init - session: undefined");
					rawDataStakingPools = []
				}
				
			}else{
				// console.log ("Withdraw3 getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
				rawDataStakingPools = []
			}
	 	}else{
			// console.log ("Withdraw4 getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
			rawDataStakingPools = []
		}

		console.log ("Withdraw getServerSideProps - stakingPool - length: " + rawDataStakingPools.length)
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

export default Withdraw
