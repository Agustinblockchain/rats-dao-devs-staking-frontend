import { useStoreState } from '../utils/walletProvider';
import WalletModalBtn from './WalletModalBtn';
//--------------------------------------
export default function Navbar() {
	//const WalletModalBtn = dynamic(() => import('./WalletModalBtn'), { ssr: false })
	const walletStore = useStoreState(state => state.wallet)
	const uTxOsAtWallet = useStoreState(state => state.uTxOsAtWallet)
  
	return (
		<div className="header">
			<div className="navbar-section navbar-start">
				<ul>
					<li><a href="/">Home</a></li>
					<li><a href="/withdraw">My Deposits</a></li>
					<li><a href="/admin">Admin</a></li>
					<li><a href="/create">Create</a></li>
					<li><a href="/faq">FAQ</a></li>
				</ul>
			</div>
			<div className="navbar-section navbar-middle">
				<h1><a className="main" href="/">
					RatsDAO Staking
				</a></h1>
			</div>
			<div className="navbar-section navbar-end">
				<WalletModalBtn />
			</div>
		</div>
	)
}

