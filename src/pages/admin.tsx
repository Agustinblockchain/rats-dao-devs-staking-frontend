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
const Admin : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({pkh, swCreate, stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const router = useRouter();

	// const { data: session } = useSession()

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)
	// const {  isWalletDataLoaded } = useStoreState(state => {
	// 	return { isWalletDataLoaded: state.isWalletDataLoaded };
	// });
	
	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);

	// const refreshData = (pkh : string | undefined) => {
	// 	console.log ("Admin - refreshData - router.replace - pkh: "+ pkh + " - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
	// 	if(pkh !== undefined){
	// 		router.replace(router.basePath + "?pkh=" + pkh);
	// 	}else{
	// 		router.replace(router.basePath)
	// 	}
	// 	setIsRefreshing(true);
	// };

	const refreshData = () => {
		console.log ("Admin - refreshData - router.replace - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
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

	return (
		<Layout swCreate={swCreate}>
			{ (!walletStore.connected) ?
					<div>Connect you wallet to see Staking Pools to Admin</div>
				:
					(isRefreshing) ?
						<div>Loading Staking Pools...</div>
					:
						stakingPoolsParsed.length > 0 ? 
							stakingPoolsParsed.map(
								sp => 
								(typeof window !== 'undefined' && <StakingPoolAdmin key={sp.name} stakingPoolInfo={sp}  />)
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

		// if (context.query?.pkh != undefined) {
		// 	// console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
		// 	if(context.query?.pkh != ""){
		// 		if (session) {
		// 			console.log ("Admin getServerSideProps - init - session:", toJson (session));
		// 			if (session.user.pkh === context.query?.pkh) {
		// 				rawDataStakingPools  = await getStakingPools(false, context.query?.pkh, session?.user.swAdmin)
		// 			}else{
		// 				rawDataStakingPools = []
		// 			}
		// 		}else{
		// 			//console.log ("Admin getServerSideProps - init - session: undefined");
		// 			rawDataStakingPools = []
		// 		}
		// 	}else{
		// 		// console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
		// 		rawDataStakingPools = []
		// 	}
	 	// }else{
		// 	// console.log ("Admin getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
		// 	rawDataStakingPools = []
		// }

		console.log ("Admin getServerSideProps - stakingPool - length: " + rawDataStakingPools.length)
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
				// pkh: context.query?.pkh !== undefined ? context.query?.pkh : ""
			}
		};
	}

}

export default Admin
