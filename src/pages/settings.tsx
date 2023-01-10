import type { InferGetServerSidePropsType, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SettingsForm from '../components/SettingsForm';
import { toJson } from '../utils/utils';
import { useStoreState } from '../utils/walletProvider';

const Settings : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({swCreate, pkh} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = (pkh : string | undefined) => {
		console.log ("Settings - refreshData - router.replace - pkh: "+ pkh + " - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
		router.replace(router.basePath + "?pkh=" + pkh);
		setIsRefreshing(true);
	};

	useEffect(() => {
		setIsRefreshing(false);
	}, []);
	
	useEffect(() => {
		// console.log("Settings - useEffect - walletStore.connected: " + walletStore.connected)
		if (walletStore.connected ) {
			refreshData(walletStore.pkh)
		}else{
			refreshData(undefined)

		}
	}, [walletStore.connected])
	
	return (
		<Layout swCreate={swCreate}>

			{ !swCreate?
					<div>You dont have access to this page</div>
				:
					<SettingsForm/>	
			}

		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		console.log ("Settings getServerSideProps -------------------------------");
		console.log ("Settings getServerSideProps - init - context.query?.pkh:", context.query?.pkh);

		const session = await getSession(context)
		if (session) {
			console.log ("Settings getServerSideProps - init - session:", toJson (session));
		}else{
			//console.log ("Settings getServerSideProps - init - session: undefined");
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

export default Settings


