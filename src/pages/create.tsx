//--------------------------------------
import type { InferGetServerSidePropsType, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CreateStakingPool from '../components/CreateStakingPool';
import Layout from '../components/Layout';
import { toJson } from '../utils/utils';
import { useStoreState } from '../utils/walletProvider';

//--------------------------------------
const Create : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({pkh, swCreate} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = () => {
		console.log ("Create - refreshData - router.replace - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
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

	return (
		<Layout swCreate={swCreate}>
			
			{!walletStore.connected? 
					<p>Connect you wallet to create a Staking Pool</p>
				:
					swCreate? 
						(typeof window !== 'undefined' && <CreateStakingPool/>)
						
					:
						<p>Create Staking Pool is restricted</p>
		
			}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		console.log ("Create getServerSideProps -------------------------------");
		//console.log ("Create getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
		const session = await getSession(context)
		if (session) {
			console.log ("Create getServerSideProps - init - session:", toJson (session));
		}else{
			//console.log ("Create getServerSideProps - init - session: undefined");
		}

		return {
			props: {
				pkh: session?.user.pkh !== undefined ? session?.user.pkh : "",
				swCreate: session && session.user ? session.user.swCreate : false 
			}
		};
	} catch (error) {
		console.error (error)
		return {
			props: { 
				pkh: "",
				swCreate: false,
			 }
		};
	}
}

export default Create
