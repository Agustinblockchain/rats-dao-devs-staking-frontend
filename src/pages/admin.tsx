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
import { getSession } from 'next-auth/react'


// import { getCsrfToken, signIn } from 'next-auth/react'
// import { apiSignIn } from '../utils/auth'

// import StakingPoolAdmin from '../components/StakingPoolAdmin';

//--------------------------------------


const Admin : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	//console.log("Admin")   

	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const [pkh, setPkh] = useState<string | undefined>("");

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = (pkh : string | undefined) => {

		console.log ("ROUTER ADMIN: pkh: "+ pkh + "walletStore.connected " + walletStore.connected + " router.asPath: " + router.asPath);

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
	
	
	const StakingPoolAdmin = dynamic(() => import('../components/StakingPoolAdmin'), { ssr: false, loading: () => <p>Loading...</p> })

	return (
		<Layout>
			{ !walletStore.connected?
					<div>Connect you wallet to see Staking Pools to Admin</div>
				:
					stakingPools.length > 0 ? 
						stakingPools.map(
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
					console.log ("Admin getServerSideProps - init - session: undefined");
					rawDataStakingPools = []
				}

				// console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);

				// const csrfToken = await getCsrfToken({ req: query.req })
				// await apiSignIn(context.query?.pkh, csrfToken!)

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
		//console.log ("Admin getServerSideProps - stakingPool length: " + dataStakingPools.length)
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


	// try {
		
	// 	console.log ("Admin getServerSideProps - init")

	// 	await connect();

	// 	const rawDataStakingPools : StakingPoolDBInterface [] = await getStakingPools(false)
	// 	console.log ("Admin getServerSideProps - stakingPool length: " + rawDataStakingPools.length)
	// 	const stringifiedDataStakingPools = toJson(rawDataStakingPools);
		
	// 	const dataStakingPools : StakingPoolDBInterface [] = JSON.parse(stringifiedDataStakingPools);
	// 	// console.log ("Admin getServerSideProps - stakingPool length: " + dataStakingPools.length)

	// 	return {
	// 		props: {
	// 			stakingPools: dataStakingPools
	// 	    }

	// 	};
	// } catch (e) {
    //     console.error (e)
    //     const dataStakingPools : StakingPoolDBInterface [] = [];
    //     return {
    //         props: { stakingPools: dataStakingPools }
    //     };
	// }
}

export default Admin
