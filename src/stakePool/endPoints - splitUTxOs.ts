import { Assets } from 'lucid-cardano';
import { BIGINT, EUTxO } from '../types';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { makeTx_And_UpdateEUTxOsIsPreparing } from '../utils/cardano-helpersTx';
import { Wallet } from '../utils/walletProvider';
import { splitUTxOsTx } from "./endPointsTx - splitUTxOsTx";

//--------------------------------------

export async function splitUTxOs(wallet: Wallet, poolInfo: StakingPoolDBInterface) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "Split Wallet UTxOs";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "I couldn't get your key hash. Try connecting your wallet again";
    //------------------
    // const master = wallet.pkh!;
    const masterAddr = await lucid!.wallet.address();
    //------------------
    const splitAmount: BIGINT = 10000000n;
    const value_For_SplitUTxO: Assets = { ["lovelace"]: splitAmount };
    //------------------
   var tx_Binded = splitUTxOsTx.bind(lucid!, protocolParameters, masterAddr, value_For_SplitUTxO);
    //------------------
    var eUTxO_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxO_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxO_for_consuming);
    return [txHash, eUTxO_for_consuming_];
}
