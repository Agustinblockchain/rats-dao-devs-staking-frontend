import { Assets, PaymentKeyHash } from 'lucid-cardano';
import { BIGINT, EUTxO } from '../types';
import { Wallet } from '../utils/walletProvider';
import { splitUTxOsTx } from "./endPointsTx - splitUTxOsTx";
import { makeTx } from '../utils/cardano-helpersTx';

//--------------------------------------

export async function splitUTxOs(wallet: Wallet, pkh: PaymentKeyHash) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "Split UTxOs";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (!pkh)
        throw "I couldn't get your key hash. Try connecting your wallet again";
    //------------------
    // const master = pkh;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const splitAmount: BIGINT = 10000000n;
    const value_For_SplitUTxO: Assets = { ["lovelace"]: splitAmount };
    //------------------
    var tx = splitUTxOsTx(lucid!, protocolParameters, pkh, masterAddr, value_For_SplitUTxO);
    //------------------
    var eUTxO_for_consuming: EUTxO[] = [];
    //------------------
    var txHash = await makeTx(functionName, wallet, protocolParameters, tx);
    return [txHash, eUTxO_for_consuming];
}
