//--------------------------------------
import { Blockfrost, Lucid, WalletApi } from 'lucid-cardano'
import { NEXT_PUBLIC_BLOCKFROST_URL, NEXT_PUBLIC_BLOCKFROST_KEY } from '../types/constantes';
//--------------------------------------
import { toJson } from './utils';
//--------------------------------------

export const initializeLucid = async (walletApi: WalletApi | undefined) => {
    // console.log ("initializeLucid - init")
    try {
        const lucid = await Lucid.new(
            new Blockfrost(NEXT_PUBLIC_BLOCKFROST_URL!, NEXT_PUBLIC_BLOCKFROST_KEY!),
            'Preview'
        )
        
        if(walletApi !== undefined) {
            await lucid.selectWallet(walletApi)
        }
    
        console.log ("initializeLucid - OK - walletApi: " + toJson(walletApi))
    
        return lucid
    }catch (error){
        console.error("initializeLucid - Error: " + error)
    }
}


export const initializeLucidWithWalletFromPrivateKey = async (walletPrivateKey: string) => {
    // console.log ("initializeLucidWithWalletFromPrivateKey - init")
    try {
        const lucid = await Lucid.new(
            new Blockfrost(NEXT_PUBLIC_BLOCKFROST_URL!, NEXT_PUBLIC_BLOCKFROST_KEY!),
            'Preview'
        )
        
        await lucid.selectWalletFromPrivateKey(walletPrivateKey)
    
        console.log ("initializeLucidWithWalletFromPrivateKey - OK")
    
        return lucid
    }catch (error){
        console.error("initializeLucidWithWalletFromPrivateKey - Error: " + error)
    }
}

export const initializeLucidWithWalletFromSeed = async (walletSeed: string) => {
    // console.log ("initializeLucidWithWalletFromSeed - init")
    try {
        const lucid = await Lucid.new(
            new Blockfrost(NEXT_PUBLIC_BLOCKFROST_URL!, NEXT_PUBLIC_BLOCKFROST_KEY!),
            'Preview'
        )
        
        await lucid.selectWalletFromSeed(walletSeed)
    
        console.log ("initializeLucidWithWalletFromSeed - OK")
    
        return lucid
    }catch (error){
        console.error("initializeLucidWithWalletFromSeed - Error: " + error)
    }
}




//--------------------------------------
