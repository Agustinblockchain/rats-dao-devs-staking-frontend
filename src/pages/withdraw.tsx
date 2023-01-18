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
import Message from '../components/Message'
//--------------------------------------

const Withdraw : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({pkh, stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const { data: session, status } = useSession()
	const [isRefreshing, setIsRefreshing] = useState(true);
	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);
	const walletStore = useStoreState(state => state.wallet)
	const router = useRouter();
	const refreshData = () => {
		console.log ("Withdraw - refreshData");
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
				<Message message={"Loading Page..."} />
			:
				(isRefreshing) ?
					<Message message={"Loading Page..."} />
				:
					(status === "unauthenticated")? 
						<Message message={"Connect you wallet to see your Deposits"} />
					:
						stakingPoolsParsed.length > 0 ? 
							stakingPoolsParsed.map(
								sp => 
								(typeof window !== 'undefined' && <StakingPool key={sp.name} stakingPoolInfo={sp}  />)
							)
						:
							<Message message={"Can't find any Staking Pool that you have deposited into"} />
		}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		console.log ("Withdraw getServerSideProps -------------------------------");
		//console.log ("Withdraw getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
		await connect();
		const session = await getSession(context)
		var rawDataStakingPools : StakingPoolDBInterface []
		if (session) {
			console.log ("Withdraw getServerSideProps - init - session:", toJson (session));
			if (session.user.pkh !== undefined) {
				rawDataStakingPools  = await getStakingPools(true, session.user.pkh)
			}else{
				rawDataStakingPools = []
			}
		}else{
			rawDataStakingPools = []
		}

		console.log ("Withdraw getServerSideProps - stakingPool - length: " + rawDataStakingPools.length)
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
				stakingPools: dataStakingPools, 
			}
		};
	}
}

export default Withdraw
