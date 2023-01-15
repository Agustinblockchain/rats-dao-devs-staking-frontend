import type { InferGetStaticPropsType, InferGetServerSidePropsType, NextPage } from 'next'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'
import { toJson } from '../utils/utils'
import { connect } from '../utils/dbConnect'
import { useStoreState } from '../utils/walletProvider';
import { StakingPoolDBInterface, getStakingPools } from '../types/stakePoolDBModel'
import { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getSession } from 'next-auth/react'

const getFaqText = (n : number) => {
	switch(n) {
		case 1: return 'The Rats Staking Portal is a frontend interface that interacts with Cardano Smart Contract. \
		It allows you to stake Cardano Assets and earn rewards.'
		case 2: return 'On the Homepage, you can see the pool list and available staking rewards. \
		Simply deposit the assets via the “Deposit” buttom and periodically claim your rewards with “Harvest” buttom. \
		In order to make a deposit, you must have “Staking Unit” assets in your wallet. Upon harvesting, you will receive “Harvest Unit” assets.'
		case 3: return 'The Staking is trustless. When you stake your assets in a pool, them are held in a Plutus on-chain smart-contract. \
		Them are owned by your private keys and withdrawable only by that same private key.'
		case 4: return 'Yes! All the validation code/smart contracts are open source and them can be found in the RatsDAO GitHub (https://github.com/CardanoRatsDAO). \
		Always demand open source.'
		case 5: return 'Each Staking Pool is created with unique settings and reward conditions. \
		The "Estimated Annual Pay" for each Staking Pool, which can be found alongside the pool, represents the payment in “Havest Units” per “Staking Unit” per year. \
		Rewards are then calculated based on the number of tokens an individual has staked and the length of time since they made their deposit or last claim.'
		case 6: return 'It is the responsibility of the administrator of the Staking Pool to fund it with "Harvest Unit" assets that will be held and available in the smart contract. \
		When you claim your rewards, a new transaction will be initiated to transfer a portion of those assets to your wallet depending on your deposit.'  
	
		default: return 'ooba booba'
	}  
}

const getFaqTitle = (n : number) => {
	switch(n) {
		case 1: return 'What is Rats DAO staking portal?'
		case 2: return 'How can I use the Rats DAO staking portal?'
		case 3: return 'Where are my assets held?'
		case 4: return 'Is it open source?'
		case 5: return 'How are rewards calculated?'
		case 6: return 'Who is providing the rewards?'
			
		default: return 'EXAMPLE Staking portal'
	}
}

const Faq : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({pkh, swCreate} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	const router = useRouter();

	const [isRefreshing, setIsRefreshing] = useState(true);

	const walletStore = useStoreState(state => state.wallet)

	const refreshData = () => {
		console.log ("FAQ - refreshData - router.replace - walletStore.connected " + walletStore.connected + " - router.asPath: " + router.asPath);
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

			<div className="section__text">
				<div className="faq">
					{
						[1,2,3,4,5,6].map((n) => <FaqItem
								key={n}
								heading= {getFaqTitle(n)}
								text= {getFaqText(n)}
							/>
						)
					}
				</div>
			</div>

		</Layout>
	)
}

export async function getServerSideProps(context : any) { 
	try {
		console.log ("FAQ getServerSideProps -------------------------------");
		//console.log ("FAQ getServerSideProps - init - context.query?.pkh:", context.query?.pkh);
		const session = await getSession(context)
		if (session) {
			console.log ("FAQ getServerSideProps - init - session:", toJson (session));
		}else{
			//console.log ("FAQ getServerSideProps - init - session: undefined");
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

export default Faq


function FaqItem({heading, text} : {heading: string, text: string}) {
	return (
		<div tabIndex={0} className="faq__item">
			<h4 className="faq__header">
			{heading}
			</h4>
			<div className="faq__text">
				<p>{text}</p>
			</div>
		</div>
	)
}