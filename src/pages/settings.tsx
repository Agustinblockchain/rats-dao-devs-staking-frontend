import type { InferGetServerSidePropsType, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SettingsForm from '../components/SettingsForm';
import { toJson } from '../utils/utils';
import { useStoreState } from '../utils/walletProvider';

const Settings : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({pkh, swCreate} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = () => {
		console.log ("Settings - refreshData - router.replace - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
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
		//console.log ("Settings getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
		const session = await getSession(context)
		if (session) {
			console.log ("Settings getServerSideProps - init - session:", toJson (session));
		}else{
			//console.log ("Settings getServerSideProps - init - session: undefined");
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

export default Settings


