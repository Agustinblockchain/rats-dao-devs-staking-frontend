//--------------------------------------
import type { InferGetServerSidePropsType, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { toJson } from '../utils/utils';
import { useStoreState } from '../utils/walletProvider';
//--------------------------------------
const Create : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({swCreate, pkh} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {

	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = (pkh : string | undefined) => {
		console.log ("Create - refreshData - router.replace - pkh: "+ pkh + " - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
		router.replace(router.basePath + "?pkh=" + pkh);
		setIsRefreshing(true);
	};

	useEffect(() => {
		setIsRefreshing(false);
	}, []);
	
	useEffect(() => {
		// console.log("Create - useEffect - walletStore.connected: " + walletStore.connected)
		if (pkh != walletStore.pkh) {
			refreshData(walletStore.pkh)
		}
	}, [walletStore.connected])


	const CreateStakingPool = dynamic(() => import('../components/CreateStakingPool'), { ssr: false , loading: () => <p>Loading...</p> })

	return (
		<Layout>
			
			{!walletStore.connected? 
					<p>Connect you wallet to create a Staking Pool</p>
				:
					swCreate? 
						<CreateStakingPool /> 
					:
						<p>Create Staking Pool is restricted</p>
		
			}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		console.log ("Create getServerSideProps -------------------------------");
		console.log ("Create getServerSideProps - init - context.query?.pkh:", context.query?.pkh);

		const session = await getSession(context)
		if (session) {
			console.log ("Create getServerSideProps - init - session:", toJson (session));
		}else{
			//console.log ("Create getServerSideProps - init - session: undefined");
		}

		return {
			props: {
				swCreate: session && session.user ? session.user.swCreate : false ,
				pkh: context.query?.pkh !== undefined ? context.query?.pkh : ""
			}
		};
	} catch (error) {
		console.error (error)
		return {
			props: { 
				swCreate: false,
				pkh: context.query?.pkh !== undefined ? context.query?.pkh : ""
			 }
		};
	}
}

export default Create
