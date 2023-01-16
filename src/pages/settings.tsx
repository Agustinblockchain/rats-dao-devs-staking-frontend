import type { InferGetServerSidePropsType, NextPage } from 'next';
import { getSession, useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SettingsForm from '../components/SettingsForm';
import { toJson } from '../utils/utils';
import { useStoreState } from '../utils/walletProvider';

const Settings : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {

	const { data: session, status } = useSession()
	
	// const router = useRouter();
	// const [isRefreshing, setIsRefreshing] = useState(true);
	// const walletStore = useStoreState(state => state.wallet)
	// const refreshData = () => {
	// 	console.log ("Settings - refreshData - router.replace - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
	// 	router.replace(router.basePath)
	// 	setIsRefreshing(true);
	// };
	// useEffect(() => {
	// 	setIsRefreshing(false);
	// }, []);
	// useEffect(() => {
	// 	console.log ("Settings - refreshData - router.replace - walletStore.connected " + walletStore.connected);
	// 	// if (walletStore.connected && pkh != walletStore.pkh) {
	// 	// 	refreshData()
	// 	// }else if (!walletStore.connected) {
	// 	// 	refreshData()
	// 	// }
	// }, [walletStore.connected])

	return (
		<Layout swCreate={session?.user.swCreate}>
		{
			(status == "loading")? 
				<p>Loading Session...</p>
			:
				(status === "unauthenticated")? 
						<p>Connect you wallet to enter in Settings Page</p>
					:
						session?.user.swCreate? 
							(typeof window !== 'undefined' && <SettingsForm/>)
						:
							<p>Settings Page is restricted</p>
		}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	// try {
	// 	console.log ("Settings getServerSideProps -------------------------------");
	// 	//console.log ("Settings getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
	// 	const session = await getSession(context)
	// 	if (session) {
	// 		console.log ("Settings getServerSideProps - init - session:", toJson (session));
	// 	}else{
	// 		//console.log ("Settings getServerSideProps - init - session: undefined");
	// 	}
	// 	return {
	// 		props: {
	// 			pkh: session?.user.pkh !== undefined ? session?.user.pkh : "",
	// 			swCreate: session && session.user ? session.user.swCreate : false 
	// 		}
	// 	};
	// } catch (error) {
	// 	console.error (error)
	// 	return {
	// 		props: { 
	// 			pkh: "",
	// 			swCreate: false,
	// 		 }
	// 	};
	// }

	return {
		props: { }
	};
}

export default Settings


