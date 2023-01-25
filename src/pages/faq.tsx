import type { InferGetServerSidePropsType, NextPage } from 'next'
import { useSession } from 'next-auth/react'
import Layout from '../components/Layout'

const getFaqText = (n : number) => {
	switch(n) {
		case 1: return '<p>The Rats Staking Portal is a frontend interface that interacts with Cardano Smart Contract.</p>\
		<p>It allows you to stake Cardano Assets and earn rewards.</p>'
		case 2: return '<p>On the Homepage, you can see the Pool list and available staking rewards.</p>\
		<p>Simply deposit the assets via the “Deposit” buttom and periodically claim your rewards with “Harvest” buttom.</p>\
		<p>In order to make a deposit, you must have “Staking Unit” assets in your Wallet. Upon harvesting, you will receive “Harvest Unit” assets.</p>'
		case 3: return '<p>Proof of your deposit can be found in the blockchain, where a record is kept of the date and time of the deposit, as well as the Wallet address that owns the deposited Tokens.</p>\
		Additionally, you will receive User Tokens in your Wallet, which serves as further proof of your deposit.</p>\
		The Policy Id of the User Token can be found in the Staking Pool details.</p>\
		It is important to hold onto these User Tokens, as they will be required to make a withdrawal and retrieve your original Tokens.</p>\
		If your User Tokens are lost, you will need to wait until the Staking Pool is Closed in order to claim your deposit.</p>'
		case 4: return '<p>When a transaction is confirmed on the blockchain, it means that the transaction has been added to a block and is on its way to being permanently recorded on the blockchain. However, there is still a small chance that the impact of the transaction may not be immediately visible on the Portal. This can happen if there is a delay in the site updating its information to reflect the new transaction.</p>\
		<p>If you do not see your new deposit right away, do not despair. Give it a few minutes and then refresh the page to check again. If the deposit still does not appear, you can check the contract address on the blockchain to see if the transaction has been recorded there. This can give you peace of mind and confirm that the transaction has been completed successfully.</p>'
		case 5: return '<p>The Staking is trustless. When you stake your assets in a Pool, them are held in a Plutus on-chain smart-contract.</p>\
		<p>Them are owned by your private keys and withdrawable only by that same private key.</p>'
		case 6: return '<p>Each Staking Pool is created with unique settings and reward conditions.</p>\
		<p>The “Annual Pay” for each Staking Pool, which can be found alongside the Pool, represents the payment in “Havest Units” per every “Staking Unit” per year.</p>\
		<p>Rewards are then calculated based on the number of Tokens an individual has staked and the length of time since they made their deposit or last claim.</p>'
		case 7: return '<p>It is the responsibility of the administrator of the Staking Pool to fund it with "Harvest Unit" assets that will be held and available in the smart contract.</p>\
		<p>When you claim your rewards, a new transaction will be initiated to transfer a portion of those assets to your Wallet depending on your deposit.</p>'  
		case 8: return '<p>Yes! All the validation code/smart contracts are open source and them can be found in the RatsDAO GitHub (https://github.com/CardanoRatsDAO).</p>\
		<p>Always demand open source.</p>'
		case 9: return '<p>Although everything has been thoroughly tested, there is still a chance that errors or security holes may be present.</p>\
		<p>If a bug or vulnerability is found, or if our funds or Users\' funds are compromised, Pool masters can close or forcibly terminate the Pool and return the funds to Users before they are exploited further.</p>\
		<p>Once the contracts are online, they cannot be changed. If an error is found, the Pool must be closed and terminated, and new and improved contracts can be created again. Users\' funds can be reimbursed (or Users can make Withdrawals) and new deposits can be made again.</p>'
		default: return 'ooba booba'
	} 
}

const getFaqTitle = (n : number) => {
	switch(n) {
		case 1: return 'What is Rats DAO staking portal?'
		case 2: return 'How can I use the Rats DAO staking portal?'
		case 3: return 'Is there any proof of my deposit?'
		case 4: return 'I can\'t see my new deposit'
		case 5: return 'Where are my assets held?'
		case 6: return 'How are rewards calculated?'
		case 7: return 'Who is providing the rewards?'
		case 8: return 'Is it open source?'
		case 9: return 'What are the steps taken to ensure the security of User\'s funds and protect against potential errors or vulnerabilities in the RATS DAO platform?'
		default: return 'EXAMPLE Staking portal'
	}
}

const Faq : NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({} : InferGetServerSidePropsType<typeof getServerSideProps>) =>  {
	
	const { data: session, status } = useSession()
	
	return (
		<Layout swCreate={session?.user.swCreate}>
			<div className="section__text">
				<div className="faq">
					{
						[1,2,3,4,5,6,7,8,9].map((n) => <FaqItem
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

	return {
			props: {  }
		};
}

export default Faq


function FaqItem({heading, text} : {heading: string, text: string}) {
	return (
		<div tabIndex={0} className="faq__item">
			<h4 className="faq__header">
			{heading}
			</h4><br></br>
			<div className="faq__text">
				<div><div dangerouslySetInnerHTML={{ __html: text }} /></div>
			</div>
		</div>
	)
}