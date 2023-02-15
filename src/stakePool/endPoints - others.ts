import { Assets, PoolId } from 'lucid-cardano';
import { BIGINT, EUTxO } from '../types';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { makeTx_And_UpdateEUTxOsIsPreparing } from '../utils/cardano-helpersTx';
import { Wallet } from '../utils/walletProvider';
import { delegateTx, splitUTxOsTx } from "./endPointsTx - others";

//--------------------------------------

export async function splitUTxOs(wallet: Wallet, poolInfo: StakingPoolDBInterface) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint - Split Wallet UTxOs";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    // const master = wallet.pkh!;
    const addr = await lucid!.wallet.address();
    //------------------
    const splitAmount: BIGINT = 10000000n;
    const value_For_SplitUTxO: Assets = { ["lovelace"]: splitAmount };
    //------------------
   var tx_Binded = splitUTxOsTx.bind(functionName, lucid!,protocolParameters, addr, value_For_SplitUTxO);
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function delegate(wallet: Wallet, poolInfo: StakingPoolDBInterface) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint - Delegate";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    // const master = wallet.pkh!;
    const addr = await lucid!.wallet.address();
    const rewardAddress = await lucid!.wallet.rewardAddress();
    //------------------
    const poolId = process.env.NEXT_PUBLIC_STAKEPOOLID
    //------------------
    var tx_Binded = delegateTx.bind(functionName, lucid!,protocolParameters, addr, rewardAddress, poolId!);
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------
