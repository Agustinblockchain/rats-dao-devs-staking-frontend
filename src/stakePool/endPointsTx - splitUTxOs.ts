import { Address, Assets, Lucid } from 'lucid-cardano';
import { createTx, fixTx } from '../utils/cardano-helpersTx';
import { toJson } from '../utils/utils';

//--------------------------------------
export async function splitUTxOsTx(lucid: Lucid, protocolParameters: any, addressWallet: Address, value_For_SplitUTxO: Assets) {
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
        .payToAddress(addressWallet, value_For_SplitUTxO)
        .addSigner(addressWallet)
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
