
import Footer from './Footer';
import Navbar from './Navbar';

//--------------------------------------

export default function Layout({
	children,
}: {
	children: React.ReactNode
	home?: boolean
}) {
	//const Navbar = dynamic(() => import('./Navbar'), { ssr: false })
	
	return (
		// <Html className="primary_content">
		<div className="primary_content"> 
			
			<div className="content">
				<Navbar/>

				<div className="section">
					
					{/* <div className="pool__header">

						<div className='text-left p-6'>

							<div>Wallet Connected: {walletStore.connected ? "yes" : "no"} </div>
							<div>Wallet Name: {walletStore.name} </div>
							<div>Wallet Pkh: {walletStore.pkh} </div>

							<div>Wallet UTxOs: {uTxOsAtWallet.length}</div>
							<div>Usando {walletStore.swEnviarPorBlockfrost ? "BlockFrost" : "Wallet"} para realizar las transacciones</div>

						</div>

					</div> */}


					{children}

				</div>
			</div>
			<Footer/>
		</div> 
		// </Html>
	)
}

