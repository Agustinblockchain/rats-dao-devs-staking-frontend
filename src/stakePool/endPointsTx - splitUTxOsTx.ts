import { Address, Assets, Lucid, PaymentKeyHash } from 'lucid-cardano';
import { showPtrInHex, toJson } from '../utils/utils';
import { createTx, fixTx } from '../utils/cardano-helpersTx';
import { objToPlutusData } from '../utils/cardano-utils';

//--------------------------------------
export async function splitUTxOsTx(lucid: Lucid, protocolParameters: any, pkh: PaymentKeyHash, addressWallet: Address, value_For_SplitUTxO: Assets) {
    //------------------
    const functionName = "Split Wallet UTxOs Tx";
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
    var txComplete = createTx(lucid, protocolParameters, tx);
    //------------------
    txComplete = await txComplete
        .payToAddress(addressWallet, value_For_SplitUTxO)
        .payToAddress(addressWallet, value_For_SplitUTxO)
        .addSigner(addressWallet)
    //------------------
    const txComplete_FIXED = await fixTx(txComplete, lucid, protocolParameters);
    return txComplete_FIXED;
}
