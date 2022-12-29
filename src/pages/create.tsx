//--------------------------------------
import type { InferGetServerSidePropsType, InferGetStaticPropsType, NextPage } from 'next'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'
//--------------------------------------
import { useStoreState } from '../utils/walletProvider';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { pkhCreators } from '../types/constantes';
import { toJson } from '../utils/utils';
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
					<CreateStakingPool/> 
				:
					<p>Create Staking Pool is restricted</p>
			: 
				<p>Connect you wallet to create a Staking Pool</p>
			}
		</Layout>
	)
}

export async function getServerSideProps(query : any) { 
	try {
		console.log ("Create getServerSideProps - init - query.query?.pkh:", query.query?.pkh);

		const swCreate = pkhCreators.includes (query.query?.pkh)

		return {
			props: {
				swCreate: swCreate
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
