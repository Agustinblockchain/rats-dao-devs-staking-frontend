import '../../public/styles/style.scss'
import type { AppProps } from 'next/app'
import { StoreProvider, useStoreRehydrated, persist } from 'easy-peasy'
import { storeWallet } from '../utils/walletProvider'

//--------------------------------------
import { ReactNotifications } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import React from 'react'
//--------------------------------------
const StoreProviderOverride = StoreProvider as any;

// const strictMode = process.env.NODE_ENV === 'production';
//const strictMode = false;

function MyApp({ Component, pageProps }: AppProps) {

	// if (strictMode) {
		return(
			// <React.StrictMode>
				<StoreProviderOverride store={storeWallet} >
					<ReactNotifications />
					<Component {...pageProps} />
				</StoreProviderOverride>
			// </React.StrictMode>
		)
	// }else{
	//   return(
	//     <StoreProviderOverride store={storeWallet} >
	//       <ReactNotifications />
	//       <Component {...pageProps} />
	//     </StoreProviderOverride>
	//   )
	// }
	
}

export default MyApp



