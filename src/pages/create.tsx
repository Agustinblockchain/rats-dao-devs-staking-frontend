//--------------------------------------
import type { InferGetServerSidePropsType, InferGetStaticPropsType, NextPage } from 'next'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'
//--------------------------------------
import { useStoreState } from '../utils/walletProvider';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { sha256HexStr, toJson } from '../utils/utils';

//--------------------------------------

import { getSession } from 'next-auth/react';
import { getToken } from 'next-auth/jwt';
//--------------------------------------
//import CreateStakingPool from '../components/CreateStakingPool';


const Create : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({swCreate} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	//console.log("Create")   

	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const [pkh, setPkh] = useState<string | undefined>("");

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = (pkh : string | undefined) => {

		console.log ("ROUTER CREATE: pkh: "+ pkh + "walletStore.connected " + walletStore.connected + " router.asPath: " + router.asPath);

		router.replace(router.basePath + "?pkh=" + pkh);

		setPkh(pkh);

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
			
			{pkh? 
				swCreate? 
					<CreateStakingPool /> 
				:
					<p>Create Staking Pool is restricted</p>
			: 
				<p>Connect you wallet to create a Staking Pool</p>
			}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		console.log ("Create getServerSideProps - init - context.query?.pkh:", context.query?.pkh);

		const session = await getSession(context)
		if (session) {
			console.log ("Create getServerSideProps - init - session:", toJson (session));
		}else{
			console.log ("Create getServerSideProps - init - session: undefined");
		}

		return {
			props: {
				swCreate: session && session.user ? session.user.swCreate : false 
			}
		};
	} catch (error) {
		console.error (error)
		return {
			props: { swCreate: false }
		};
	}
}

export default Create
