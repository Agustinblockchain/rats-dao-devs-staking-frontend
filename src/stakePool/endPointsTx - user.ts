import { Address, Assets, Lucid, UTxO } from 'lucid-cardano';
import { EUTxO, FundDatum, PoolDatum, Redeemer_Burn_TxID, Redeemer_Mint_TxID, Redeemer_User_Harvest, Redeemer_User_Withdraw, UserDatum } from '../types';
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { createTx, fixTx } from '../utils/cardano-helpersTx';
import { getHexFrom_Redeemer_TxID, getHexFrom_Validator_Datum, getHexFrom_Validator_Redeemer } from "./helpersDatumsAndRedeemers";

//--------------------------------------

export async function userDepositTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined,
    eUTxO_With_Script_TxID_User_Deposit_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO,
    userDatum_Out: UserDatum, value_For_UserDatum: Assets,
    value_For_User_Wallet: Assets,
    redeemer_For_Mint_TxID_User_Deposit: Redeemer_Mint_TxID, value_For_Mint_TxID_User_Deposit: Assets, value_For_Mint_UserID: Assets
) {
    //------------------
    const functionName = "EndPoint Tx User - Deposit";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const userDatum_Out_Hex = await getHexFrom_Validator_Datum(userDatum_Out, true);
    //------------------
    const redeemer_For_Mint_TxID_User_Deposit_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_User_Deposit, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_Script_TxID_User_Deposit_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_User_Deposit_Script);
    }
    //------------------
    if (eUTxO_With_ScriptDatum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_ScriptDatum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_User_Deposit, redeemer_For_Mint_TxID_User_Deposit_Hex)
        .mintAssets(value_For_Mint_UserID, redeemer_For_Mint_TxID_User_Deposit_Hex)
        .readFrom([utxoAtScript_With_PoolDatum])
        .payToContract(scriptAddress, { inline: userDatum_Out_Hex }, value_For_UserDatum)
        .payToAddress(addressWallet, value_For_User_Wallet)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function userHarvestPoolTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined,
    eUTxO_With_Script_TxID_User_Harvest_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO,
    uTxOsAtScript_With_FundDatum: UTxO[], redeemer_For_Consuming_FundDatum: Redeemer_User_Harvest,
    datum_and_values_for_FundDatum: { datum: FundDatum; value: Assets; }[],
    utxoAtScript_With_UserDatum: UTxO, redeemer_For_Consuming_UserDatum: Redeemer_User_Harvest,
    userDatum_Out: UserDatum, value_For_UserDatum: Assets,
    value_For_User_Wallet: Assets,
    redeemer_For_Mint_TxID_User_Harvest: Redeemer_Mint_TxID, value_For_Mint_TxID_User_Harvest: Assets
) {
    //------------------
    const functionName = "EndPoint Tx User - Harvest";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const datum_hex_and_values_for_FundDatum: { datum_hex: string; value: Assets; }[] = [];
    datum_and_values_for_FundDatum.forEach(async (datum_and_value_for_FundDatum, index) => {
        const fundDatum_Out = datum_and_value_for_FundDatum.datum;
        const fundDatum_Out_Hex = await getHexFrom_Validator_Datum(fundDatum_Out, true);
        datum_hex_and_values_for_FundDatum.push({ datum_hex: fundDatum_Out_Hex, value: datum_and_value_for_FundDatum.value });
    });
    //------------------
    const userDatum_Out_Hex = await getHexFrom_Validator_Datum(userDatum_Out, true);
    //------------------
    const redeemer_For_Consuming_FundDatum_Hex = await getHexFrom_Validator_Redeemer(redeemer_For_Consuming_FundDatum, true);
    const redeemer_For_Consuming_UserDatum_Hex = await getHexFrom_Validator_Redeemer(redeemer_For_Consuming_UserDatum, true);
    const redeemer_For_Mint_TxID_User_Harvest_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_User_Harvest, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_ScriptDatum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_ScriptDatum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.script);
    }
    //------------------
    if (eUTxO_With_Script_TxID_User_Harvest_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_User_Harvest_Script);
    }
    //------------------
    tx_Building = await tx_Building
        .mintAssets(value_For_Mint_TxID_User_Harvest, redeemer_For_Mint_TxID_User_Harvest_Hex)
        .readFrom([utxoAtScript_With_PoolDatum])
        .collectFrom(uTxOsAtScript_With_FundDatum, redeemer_For_Consuming_FundDatum_Hex)
        .collectFrom([utxoAtScript_With_UserDatum], redeemer_For_Consuming_UserDatum_Hex);
    //------------------
    for (const datum_hex_and_value_for_FundDatum of datum_hex_and_values_for_FundDatum) {
        tx_Building = await tx_Building
            .payToContract(scriptAddress, { inline: datum_hex_and_value_for_FundDatum.datum_hex }, datum_hex_and_value_for_FundDatum.value);
    }
    //------------------
    tx_Building = await tx_Building
        .payToContract(scriptAddress, { inline: userDatum_Out_Hex }, value_For_UserDatum)
        .payToAddress(addressWallet, value_For_User_Wallet)
        .addSigner(addressWallet);
    // .validFrom(from)
    // .validTo(until) 
    //------------------
    const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
    return txComplete_FIXED;
}
//--------------------------------------

export async function userWithdrawTx(
    lucid: Lucid, protocolParameters: any, poolInfo: StakingPoolDBInterface, addressWallet: Address,
    eUTxO_With_ScriptDatum: EUTxO | undefined,
    eUTxO_With_Script_TxID_User_Withdraw_Datum: EUTxO | undefined,
    eUTxO_With_Script_TxID_User_Deposit_Datum: EUTxO | undefined,
    utxoAtScript_With_PoolDatum: UTxO, redeemer_For_Consuming_PoolDatum: Redeemer_User_Withdraw | undefined,
    utxoAtScript_With_FundDatum: UTxO | undefined, redeemer_For_Consuming_FundDatum: Redeemer_User_Withdraw | undefined,
    utxoAtScript_With_UserDatum: UTxO, redeemer_For_Consuming_UserDatum: Redeemer_User_Withdraw,
    poolDatum_Out: PoolDatum | undefined, value_For_PoolDatum: Assets | undefined,
    fundDatum_Out: FundDatum | undefined, value_For_FundDatum: Assets | undefined,
    userToSendBackAddr: Address, value_For_User_Wallet: Assets,
    redeemer_For_Mint_TxID_User_Withdraw: Redeemer_Mint_TxID, value_For_Mint_TxID_User_Withdraw: Assets,
    redeemer_Burn_UserID: Redeemer_Burn_TxID, value_For_Burn_UserID: Assets, value_For_Burn_TxID_User_Deposit: Assets
) {
    //------------------
    const functionName = "EndPoint Tx User - Withdraw";
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const redeemer_For_Consuming_UserDatum_Hex = await getHexFrom_Validator_Redeemer(redeemer_For_Consuming_UserDatum, true);
    //------------------
    const redeemer_For_Mint_TxID_User_Withdraw_Hex = await getHexFrom_Redeemer_TxID(redeemer_For_Mint_TxID_User_Withdraw, true);
    const redeemer_Burn_UserID_Hex = await getHexFrom_Redeemer_TxID(redeemer_Burn_UserID, true);
    //------------------
    // const now = Math.floor(Date.now())
    // console.log(functionName + " - now: " + now)
    // const from = now - (5 * 60 * 1000)
    // const until = now + (validTimeRange) - (5 * 60 * 1000) 
    //------------------
    var tx = lucid.newTx();
    var tx_Building = createTx(lucid, protocolParameters, tx);
    //------------------
    if (eUTxO_With_ScriptDatum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_ScriptDatum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.script);
    }
    //------------------
    if (eUTxO_With_Script_TxID_User_Withdraw_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_User_Withdraw_Script);
    }
    //------------------
    if (eUTxO_With_Script_TxID_User_Deposit_Datum) {
        tx_Building = await tx_Building.readFrom([eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO]);
    } else {
        tx_Building = await tx_Building.attachMintingPolicy(poolInfo.txID_User_Deposit_Script);
    }
    //------------------
    if (poolDatum_Out !== undefined) {
        const poolDatum_Out_Hex = await getHexFrom_Validator_Datum(poolDatum_Out, true);
        const redeemer_For_Consuming_PoolDatum_Hex = await getHexFrom_Validator_Redeemer(redeemer_For_Consuming_PoolDatum!, true);
        //------------------
        tx_Building = await tx_Building
            .mintAssets(value_For_Mint_TxID_User_Withdraw, redeemer_For_Mint_TxID_User_Withdraw_Hex)
            .mintAssets(value_For_Burn_UserID, redeemer_Burn_UserID_Hex)
            .mintAssets(value_For_Burn_TxID_User_Deposit, redeemer_Burn_UserID_Hex)
            .collectFrom([utxoAtScript_With_PoolDatum], redeemer_For_Consuming_PoolDatum_Hex)
            .collectFrom([utxoAtScript_With_UserDatum], redeemer_For_Consuming_UserDatum_Hex)
            .payToContract(scriptAddress, { inline: poolDatum_Out_Hex }, value_For_PoolDatum)
            .payToAddress(userToSendBackAddr, value_For_User_Wallet)
            .addSigner(addressWallet);
        // .validFrom(from)
        // .validTo(until) 
        //------------------
        const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
        return txComplete_FIXED;
    } else {
        const fundDatum_Out_Hex = await getHexFrom_Validator_Datum(fundDatum_Out!, true);
        const redeemer_For_Consuming_FundDatum_Hex = await getHexFrom_Validator_Redeemer(redeemer_For_Consuming_FundDatum!, true);
        //------------------
        tx_Building = await tx_Building
            .mintAssets(value_For_Mint_TxID_User_Withdraw, redeemer_For_Mint_TxID_User_Withdraw_Hex)
            .mintAssets(value_For_Burn_UserID, redeemer_Burn_UserID_Hex)
            .mintAssets(value_For_Burn_TxID_User_Deposit, redeemer_Burn_UserID_Hex)
            .readFrom([utxoAtScript_With_PoolDatum])
            .collectFrom([utxoAtScript_With_FundDatum], redeemer_For_Consuming_FundDatum_Hex)
            .collectFrom([utxoAtScript_With_UserDatum], redeemer_For_Consuming_UserDatum_Hex)
            .payToContract(scriptAddress, { inline: fundDatum_Out_Hex }, value_For_FundDatum)
            .payToAddress(userToSendBackAddr, value_For_User_Wallet)
            .addSigner(addressWallet);
        // .validFrom(from)
        // .validTo(until) 
        //------------------
        const txComplete_FIXED = await fixTx(tx_Building, lucid, protocolParameters);
        return txComplete_FIXED;
    }
}
