import type { InferGetServerSidePropsType, NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import Message from '../components/Message';
import SettingsForm from '../components/SettingsForm';

const Settings : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	const { data: session, status } = useSession()
	return (
		<Layout swCreate={session?.user.swCreate}>
		{
			(status == "loading")? 
				<Message message={"Loading Page..."} />
			:
				(status === "unauthenticated")? 
						<Message message={"Connect you wallet to enter in Settings Page"} />
					:
						session?.user.swCreate? 
							(typeof window !== 'undefined' && <SettingsForm/>)
						:
							<Message message={"Settings Page is restricted to especific Wallets"} />
		}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	return {
		props: { }
	};
}

export default Settings


