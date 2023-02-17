import { Address, Assets, Lucid, PoolId, Redeemer } from 'lucid-cardano';
import { addAssets } from '../utils/cardano-helpers';
import { createTx, fixTx } from '../utils/cardano-helpersTx';
import { toJson } from '../utils/utils';

//--------------------------------------

export async function splitUTxOsTx(lucid: Lucid, protocolParameters: any, addressWallet: Address, value_For_SplitUTxO: Assets, value_User_Deposit?: Assets) {
    //------------------
    const functionName = "EndPoint Tx - Split Wallet UTxOs";
    //------------------
    console.log(functionName + " - value For SplitUTxO: " + toJson(value_For_SplitUTxO));
    //------------------
    // const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    // //------------------
    // const redeemer_Unit = new Array() 
    // const plutusData = objToPlutusData(redeemer_Unit);
    // const redeemer_Unit_Hex = showPtrInHex(plutusData)
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    tx_Building = await tx_Building
        .payToAddress(addressWallet, value_For_SplitUTxO)
        //.payToAddress(addressWallet, value_For_SplitUTxO)
    
    if (value_User_Deposit) {
        tx_Building = await tx_Building
            .payToAddress(addressWallet, value_User_Deposit)
    }

    tx_Building = await tx_Building   
        .addSigner(addressWallet)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}

//--------------------------------------

export async function delegateTx(lucid: Lucid, protocolParameters: any, addressWallet: Address, rewardAddress: string, poolId: PoolId, redeemer?: Redeemer) {
    //------------------
    const functionName = "EndPoint Tx - Delegate";
    //------------------
    // const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    // //------------------
    // const redeemer_Unit = new Array() 
    // const plutusData = objToPlutusData(redeemer_Unit);
    // const redeemer_Unit_Hex = showPtrInHex(plutusData)
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    console.log (functionName + ": " + poolId)
    console.log (functionName + ": " + rewardAddress)
    //------------------
    tx_Building = await tx_Building
        .registerStake(rewardAddress)
        .delegateTo(rewardAddress, poolId, redeemer)
        .addSigner(addressWallet)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
