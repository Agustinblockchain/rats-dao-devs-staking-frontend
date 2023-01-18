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
import Message from '../components/Message'

//--------------------------------------

const Home : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> =  ({pkh, stakingPools} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const { data: session, status } = useSession()
	const [stakingPoolsParsed, setStakingPoolsParsed] = useState<StakingPoolDBInterface [] > ([]);
	const [isRefreshing, setIsRefreshing] = useState(true);
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
		<Layout swCreate={session?.user.swCreate}>
		{
			(status == "loading")? 
				<Message message={"Loading Page..."} />
			:
				(isRefreshing) ?
					<Message message={"Loading Page..."} />
				:
					stakingPoolsParsed.length > 0 ? 
						stakingPoolsParsed.map(
							sp => 
								(typeof window !== 'undefined' && <StakingPool key={sp.name} stakingPoolInfo={sp}  />)
						)
					:
						<Message message={"Can't find any Staking Pool available"} />
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
				stakingPools: dataStakingPools
			}
		};

	} catch (error) {
		console.error (error)
		const dataStakingPools : StakingPoolDBInterface [] = [];
		return {
			props: { 
				pkh: "",
				stakingPools: dataStakingPools 
			}
		};
	}
}

export default Home
