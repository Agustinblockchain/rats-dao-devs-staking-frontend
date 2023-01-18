//--------------------------------------
import type { InferGetServerSidePropsType, NextPage } from 'next';
import { useSession } from 'next-auth/react';
import CreateStakingPool from '../components/CreateStakingPool';
import Layout from '../components/Layout';
import Message from '../components/Message';
//--------------------------------------
const Create : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const { data: session, status } = useSession()
	return (
		<Layout swCreate={session?.user.swCreate}>
		{
			(status == "loading")? 
				<Message message={"Loading Page..."} />
			:
				(status === "unauthenticated")? 
						<Message message={"Connect you wallet to Create a Staking Pool"} />
					:
						session?.user.swCreate? 
							(typeof window !== 'undefined' && <CreateStakingPool/>)
						:
							<Message message={"Create Staking Pool is restricted to especific Wallets"} />
		}
		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	// try {
	// 	console.log ("Create getServerSideProps -------------------------------");
	// 	//console.log ("Create getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
	// 	const session = await getSession(context)
	// 	if (session) {
	// 		console.log ("Create getServerSideProps - init - session:", toJson (session));
	// 	}else{
	// 		//console.log ("Create getServerSideProps - init - session: undefined");
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

export default Create
