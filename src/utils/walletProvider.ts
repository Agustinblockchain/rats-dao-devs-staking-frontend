import { Action, action, computed, Computed, createStore, createTypedHooks, Thunk, thunk } from 'easy-peasy';
import { Lucid, PaymentKeyHash, UTxO, WalletApi } from "lucid-cardano";
import { BIGINT } from "../types";

//------------------------------------

export interface Wallet {
	connected: boolean, 
	name: string, 
	walletApi: WalletApi | undefined,
	pkh: PaymentKeyHash | undefined,
	lucid: Lucid | undefined,
	swEnviarPorBlockfrost: boolean, 
	protocolParameters: any

}

interface AppStoreModel {
		wallet: Wallet,
		setWallet: Action<AppStoreModel, Wallet>,

		isWalletDataLoaded: boolean,
		setIsWalletDataLoaded: Action<AppStoreModel, boolean>,

		uTxOsAtWallet: UTxO [] ,
		setUTxOsAtWallet: Action<AppStoreModel, UTxO []>,

		loadWalletData: Thunk<AppStoreModel, Wallet>,

		walletGetTotalOfUnit: Computed<AppStoreModel, (unit: string) => BIGINT>

		// walletCreateValue_Adding_Tokens_Of_AC_Lucid: Computed<AppStoreModel, (unit: string, amount: BIGINT) => Assets>,
}

export const storeWallet = createStore<AppStoreModel> (({ 

	wallet : {connected: false, name: '', walletApi: undefined, pkh : "", lucid: undefined, swEnviarPorBlockfrost: false, protocolParameters: undefined},

	setWallet: action((state, newWallet) => {
		// console.log("storeWallet - setWallet: " + toJson(newWallet.name))

		state.wallet = newWallet 
		state.isWalletDataLoaded = false 
	}),

	isWalletDataLoaded: false,
	setIsWalletDataLoaded: action((state, isLoaded) => { 
		state.isWalletDataLoaded = isLoaded 
	}),

	uTxOsAtWallet: [],
	setUTxOsAtWallet: action((state, newUTxOs) => {
		state.uTxOsAtWallet = newUTxOs
	}),
	
	loadWalletData: thunk(async (actions, wallet) => {

		// console.log("storeWallet - loadWalletData - state.wallet.walletApi: " + toJson(wallet.walletApi))

		actions.setIsWalletDataLoaded(false)

		const lucid = wallet.lucid
		
		const utxosAtWallet = await lucid!.wallet?.getUtxos();
		actions.setUTxOsAtWallet(utxosAtWallet!) 
		//console.log("storeWallet - loadWalletData - state.uTxOsAtWallet length: " + utxosAtWallet.length)
		if (utxosAtWallet.length == 0) {
			console.log("storeWallet - loadWalletData: There are no UTxOs available in your Wallet");
		}
		actions.setIsWalletDataLoaded(true)

	}),

	walletGetTotalOfUnit: computed(state => (unit: string) => {
	
		// console.log("storeWallet - getTotalOfUnit - unit: " + unit)

		const CS = unit.slice(0,56)
		const TN = unit.slice(56)

		const isAda = (unit === 'lovelace')
		const isWithoutTokenName = !isAda && TN == ""

		// console.log("storeWallet - getTotalOfUnit - isAda: " + isAda + " - isWithoutTokenName: " + isWithoutTokenName)

		let total: BIGINT = 0n;

		state.uTxOsAtWallet.forEach(u => { 
			
			if (isWithoutTokenName){
				for (const [key, value] of Object.entries(u.assets)) {
					const CS_ = key.slice(0,56)
					
					if (CS == CS_) {
						// console.log("storeWallet - getTotalOfUnit - CS: " + CS + " - CS_: " + CS_ + " - value: " + value)
						total += value
					}
				}
			}else{
				if(u.assets[unit]) 
					total += (u.assets[unit] as BIGINT) 
			}
		})

		// console.log("storeWallet - getTotalOfUnit - total: " + total)

		return BigInt(total.toString()) as BIGINT
	}),
	
}))

const { useStoreActions, useStoreState, useStoreDispatch, useStore } = createTypedHooks<AppStoreModel>()

export {
	useStoreActions,
	useStoreState,
	useStoreDispatch,
	useStore
};

//------------------------------------

