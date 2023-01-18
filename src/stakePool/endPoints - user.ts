import { Address, Assets, UTxO } from 'lucid-cardano';
import {
    AssetClass, EUTxO, FundDatum, Maybe, PoolDatum, POSIXTime,
    Redeemer_Burn_TxID, Redeemer_Mint_TxID, Redeemer_User_Deposit, Redeemer_User_Harvest, Redeemer_User_Withdraw, UserDatum
} from '../types';
import {
    ADA_Decimals,
    ADA_UI,
    fundID_TN, maxDiffTokensForUserDatum, maxTxFundDatumInputs, poolID_TN, tokenNameLenght, txID_User_Deposit_For_User_TN, txID_User_Harvest_TN, txID_User_Withdraw_TN, userID_TN
} from "../types/constantes";
import { StakingPoolDBInterface } from '../types/stakePoolDBModel';
import { addAssets, addAssetsList, calculateMinAda, calculateMinAdaOfAssets, createValue_Adding_Tokens_Of_AC_Lucid, subsAssets } from '../utils/cardano-helpers';
import { makeTx_And_UpdateEUTxOsIsPreparing } from '../utils/cardano-helpersTx';
import { pubKeyHashToAddress } from "../utils/cardano-utils";
import { formatAmount, strToHex, toJson } from '../utils/utils';
import { Wallet } from '../utils/walletProvider';
import { apiGetEUTxOsDBByStakingPool } from './apis';
import { userDepositTx, userHarvestPoolTx, userWithdrawTx } from "./endPointsTx - user";
import { mkUpdated_FundDatum_With_NewClaimRewards } from './helpersDatumsAndRedeemers';
import {
    getEUTxOs_With_FundDatum_InEUxTOList, getEUTxO_With_PoolDatum_InEUxTOList
} from './helpersEUTxOs';
import {
    getAvailaibleFunds_In_EUTxO_With_FundDatum, getRewardsPerInvest, getTotalAvailaibleFunds,
    selectFundDatum_WithEnoughValueToClaim, sortFundDatum
} from "./helpersStakePool";

//--------------------------------------

export async function userDeposit(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]>  {
    //------------------
    const functionName = "EndPoint User - Deposit";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const user = wallet.pkh!;
    //------------------
    const userAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    // const fundID_CS = poolInfo.txID_Master_Fund_CS
    // const fundID_TN_Hex = strToHex(fundID_TN)
    // const fundID_AC : AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    // const fundID_AC_Lucid = fundID_CS+fundID_TN_Hex;
    //------------------
    const userID_CS = poolInfo.txID_User_Deposit_CS;
    const userID_TN_Hex = strToHex(userID_TN);
    const userID_AC: AssetClass = { currencySymbol: userID_CS, tokenName: userID_TN_Hex };
    // const userID_AC_Lucid = userID_CS+userID_TN_Hex;
    //------------------
    const staking_CS = poolInfo.staking_Lucid.slice(0, 56);
    const staking_TN = poolInfo.staking_Lucid.slice(56);
    const staking_AC_isAda = (staking_CS === 'lovelace');
    const staking_AC_isWithoutTokenName = !staking_AC_isAda && staking_TN == "";
    //------------------
    const txID_User_Deposit_CS = poolInfo.txID_User_Deposit_CS;
    const txID_user_Deposit_For_User_TN_Hex = strToHex(txID_User_Deposit_For_User_TN);
    const txID_User_Deposit_AC: AssetClass = { currencySymbol: txID_User_Deposit_CS, tokenName: txID_user_Deposit_For_User_TN_Hex };
    console.log(functionName + " - txID_User_Deposit_AC: " + toJson(txID_User_Deposit_AC));
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!);
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum;
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_Script_TxID_User_Deposit_Datum = poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum;
    if (!eUTxO_With_Script_TxID_User_Deposit_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'User Deposit_Datum. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'User Deposit_Datum: " + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true);
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex);
    //------------------
    // const depositAmount = assets![poolInfo!.staking_Lucid];
    // const value_Deposit = createValue_Adding_Tokens_Of_AC_Lucid(uTxOsAtWallet, poolInfo!.staking_Lucid, depositAmount);
    const depositAmount = Object.entries(assets!).reduce ((acc, cur) => acc + BigInt(cur[1]), 0n)
    const value_Deposit = assets!
    console.log(functionName + " - Deposit Amount: " + depositAmount);
    console.log(functionName + " - Value Deposit: " + toJson(value_Deposit));
    //------------------
    const value_For_Mint_UserID: Assets = { [userID_AC.currencySymbol + userID_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint UserID: " + toJson(value_For_Mint_UserID));
    const value_For_Mint_TxID_User_Deposit: Assets = { [txID_User_Deposit_AC.currencySymbol + txID_User_Deposit_AC.tokenName]: depositAmount };
    console.log(functionName + " - Value For Mint TxID User Deposit: " + toJson(value_For_Mint_TxID_User_Deposit));
    //------------------
    var value_For_UserDatum: Assets = addAssets(value_Deposit, value_For_Mint_UserID);
    //------------------
    const minAda_For_UserDatum_Normal = calculateMinAdaOfAssets(value_For_UserDatum, true);
    const minAda_For_UserDatum_ExtraTokens = calculateMinAda(maxDiffTokensForUserDatum, (tokenNameLenght * maxDiffTokensForUserDatum), maxDiffTokensForUserDatum, false);
    var minAda_For_UserDatum_If_StakingIsNotAda = minAda_For_UserDatum_Normal + minAda_For_UserDatum_ExtraTokens;
    //------------------
    if (staking_AC_isAda) {
        if (minAda_For_UserDatum_If_StakingIsNotAda > depositAmount) {
            throw "The amount of the Deposit must be greater than the minimum ADA required for this Transaction: " + formatAmount(Number(minAda_For_UserDatum_If_StakingIsNotAda), ADA_Decimals, ADA_UI)
        } else {
            minAda_For_UserDatum_If_StakingIsNotAda = 0n;
        }
    } else {
        const value_MinAda_For_UserDatum: Assets = { lovelace: minAda_For_UserDatum_If_StakingIsNotAda };
        value_For_UserDatum = addAssets(value_For_UserDatum, value_MinAda_For_UserDatum);
    }
    console.log(functionName + " - Value For UserDatum: " + toJson(value_For_UserDatum));
    //------------------
    const value_For_User_Wallet: Assets = value_For_Mint_TxID_User_Deposit;
    console.log(functionName + " - Value For User Wallet: " + toJson(value_For_User_Wallet));
    //------------------
    const puiInvest = depositAmount;
    const createdAt = new Date().getTime();
    //------------------
    const userDatum_Out = new UserDatum(user, puiInvest, BigInt(createdAt), 0n, 0n, new Maybe<POSIXTime>(), minAda_For_UserDatum_If_StakingIsNotAda);
    console.log(functionName + " - userDatum_Out: " + toJson(userDatum_Out));
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_User_Deposit(user, puiInvest, BigInt(createdAt), minAda_For_UserDatum_If_StakingIsNotAda);
    const redeemer_For_Mint_TxID_User_Deposit = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum);
    //------------------
    var tx_Binded = userDepositTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, userAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_User_Deposit_Datum,
        eUTxO_With_PoolDatum.uTxO,
        userDatum_Out, value_For_UserDatum,
        value_For_User_Wallet,
        redeemer_For_Mint_TxID_User_Deposit, value_For_Mint_TxID_User_Deposit, value_For_Mint_UserID
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function userHarvest(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]>{
    //------------------
    const functionName = "EndPoint User - Harvest";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const user = wallet.pkh!;
    //------------------
    const userAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!);
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS;
    const fundID_TN_Hex = strToHex(fundID_TN);
    const fundID_AC: AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    const userID_CS = poolInfo.txID_User_Deposit_CS;
    const userID_TN_Hex = strToHex(userID_TN);
    const userID_AC: AssetClass = { currencySymbol: userID_CS, tokenName: userID_TN_Hex };
    // const userID_AC_Lucid = userID_CS+userID_TN_Hex;
    //------------------
    const harvest_CS = poolInfo.harvest_Lucid.slice(0, 56);
    const harvest_TN = poolInfo.harvest_Lucid.slice(56);
    const harvest_AC_isAda = (harvest_CS === 'lovelace');
    // const harvest_AC_isWithoutTokenName = !harvest_AC_isAda && harvest_TN == ""
    //------------------
    const txID_User_Harvest_CS = poolInfo.txID_User_Harvest_CS;
    const txID_User_Harvest_TN_Hex = strToHex(txID_User_Harvest_TN);
    const txID_User_Harvest_AC: AssetClass = { currencySymbol: txID_User_Harvest_CS, tokenName: txID_User_Harvest_TN_Hex };
    console.log(functionName + " - txID_User_Harvest_AC: " + toJson(txID_User_Harvest_AC));
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum;
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_Script_TxID_User_Harvest_Datum = poolInfo.eUTxO_With_Script_TxID_User_Harvest_Datum;
    if (!eUTxO_With_Script_TxID_User_Harvest_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'User Harvest_Datum. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'User Harvest_Datum: " + eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Harvest_Datum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true);
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex);
    //------------------
    const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true);
    if (!eUTxOs_With_FundDatum) {
        throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
    }
    console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length);
    //------------------
    if (!eUTxOs_Selected && eUTxOs_Selected!.length == 0) {
        throw "Must choose one UTxO with UserDatum";
    }
    //------------------
    const userEUTxO = eUTxOs_Selected![0]
    const eUTxO_With_UserDatum: EUTxO | undefined = userEUTxO;
    if (!eUTxO_With_UserDatum) {
        throw "Can't find any UTxO with UserDatum where the user is register";
    }
    console.log(functionName + " - UTxOs with UserDatum and register: " + eUTxO_With_UserDatum.uTxO.txHash + "#" + eUTxO_With_UserDatum.uTxO.outputIndex);
    //------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In));
    //------------------
    const userDatum_In: UserDatum = eUTxO_With_UserDatum.datum as UserDatum;
    console.log(functionName + " - UserDatum In: " + toJson(userDatum_In));
    //------------------
    const harvest_Amount = assets![poolInfo!.harvest_Lucid];
    const harvest_Value = createValue_Adding_Tokens_Of_AC_Lucid(uTxOsAtWallet, poolInfo!.harvest_Lucid, harvest_Amount);
    console.log(functionName + " - Harvest Value: " + toJson(harvest_Value));
    //------------------
    //calculo la cantidad de fondos maximas disponibles que se pueden pagar
    const maxValueToClaim = getTotalAvailaibleFunds(eUTxOs_With_FundDatum);
    if (harvest_Amount > maxValueToClaim)
        throw "There are not enough funds in the available UTxOs with FundDatums to cover the claim. Available now: " + formatAmount(Number(maxValueToClaim), poolInfo.harvest_Decimals, poolInfo.harvest_UI);
    //------------------
    const closedAt = poolDatum_In.pdClosedAt.val;
    //------------------
    const claimAt: POSIXTime = BigInt(new Date().getTime());
    const rewards = getRewardsPerInvest(poolInfo, closedAt, poolInfo.pParams.ppInterestRates, userDatum_In.udLastClaimAt, claimAt, userDatum_In.udCreatedAt, userDatum_In.udInvest, userDatum_In.udRewardsNotClaimed);
    const totalNewRewards = rewards + userDatum_In.udRewardsNotClaimed;
    const rewardsNotClaimed = totalNewRewards - harvest_Amount;
    const totalRewardsCashedOut = userDatum_In.udCashedOut + harvest_Amount;
    console.log(functionName + " - Claiming: " + harvest_Amount);
    console.log(functionName + " - New Rewards: " + rewards);
    console.log(functionName + " - RewardsNotClaimed: " + userDatum_In.udRewardsNotClaimed);
    console.log(functionName + " - TotalNewRewards: " + totalNewRewards);
    console.log(functionName + " - RewardsNotClaimed after claim: " + rewardsNotClaimed);
    console.log(functionName + " - TotalRewardsCashedOut: " + totalRewardsCashedOut);
    //------------------
    if (harvest_Amount > totalNewRewards) {
        throw "Trying to get too many Rewards... wait more time!";
    }
    //------------------
    const userDatum_Out: UserDatum = new UserDatum(userDatum_In.udUser, userDatum_In.udInvest, userDatum_In.udCreatedAt, totalRewardsCashedOut, rewardsNotClaimed, new Maybe(BigInt(claimAt)), userDatum_In.udMinAda);
    console.log(functionName + " - UserDatum Out: " + toJson(userDatum_Out));
    //------------------
    const value_For_Mint_TxID_User_Harvest: Assets = { [txID_User_Harvest_AC.currencySymbol + txID_User_Harvest_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID User Harvest: " + toJson(value_For_Mint_TxID_User_Harvest));
    //------------------
    const value_In_UserDatum = eUTxO_With_UserDatum.uTxO.assets;
    console.log(functionName + " - Value In UserDatum: " + toJson(value_In_UserDatum));
    //------------------
    const value_For_UserDatum = addAssets(value_In_UserDatum, value_For_Mint_TxID_User_Harvest);
    console.log(functionName + " - Value For UserDatum: " + toJson(value_For_UserDatum));
    //------------------ 
    const eUTxOs_With_FundDatum_And_Ordered = sortFundDatum(poolInfo, eUTxOs_With_FundDatum);
    const eUTxOs_With_FundDatum_WithEnoughValueToClaim: EUTxO[] = selectFundDatum_WithEnoughValueToClaim(eUTxOs_With_FundDatum_And_Ordered, harvest_Amount);
    console.log(functionName + " - EUTxOs With FundDatum With Enough Value To Claim - length: " + eUTxOs_With_FundDatum_WithEnoughValueToClaim.length);
    //------------------
    if (eUTxOs_With_FundDatum_WithEnoughValueToClaim.length > maxTxFundDatumInputs) {
        throw "Trying to use too many UTxOs with FundDatums to cover your Claim. Please try again later for other UTxOs being available, ask managers of the Pool to create new UTxOs with more funds or reduce the amount you are claiming";
    }
    //------------------
    let datum_and_values_for_FundDatum: { datum: FundDatum; value: Assets; }[] = [];
    var claimLeft = harvest_Amount;
    var uTxOsAtScript_With_FundDatum_WithEnoughValueToClaim: UTxO[] = [];
    //------------------
    eUTxOs_With_FundDatum_WithEnoughValueToClaim.forEach((u: EUTxO) => {
        let value_In_FundDatum = u.uTxO.assets;
        console.log(functionName + " - Value In FundDatum: " + toJson(value_In_FundDatum));

        var harvestUnitFromValueCanUse = getAvailaibleFunds_In_EUTxO_With_FundDatum(u);
        var usingValueAsset: Assets = {};

        if (claimLeft >= harvestUnitFromValueCanUse) {
            claimLeft = claimLeft - harvestUnitFromValueCanUse;
            usingValueAsset = createValue_Adding_Tokens_Of_AC_Lucid([u.uTxO], poolInfo!.harvest_Lucid, harvestUnitFromValueCanUse);
        } else {
            usingValueAsset = createValue_Adding_Tokens_Of_AC_Lucid([u.uTxO], poolInfo!.harvest_Lucid, claimLeft);
        }

        var value_For_FundDatum = subsAssets(value_In_FundDatum, usingValueAsset);
        console.log(functionName + " - Value For FundDatum: " + toJson(value_For_FundDatum));
        //------------------
        // Actualizando FundDatum con nuevo claim
        const fundDatum_In: FundDatum = u.datum as FundDatum;
        console.log(functionName + " - FundDatum In: " + toJson(fundDatum_In));
        const fundDatum_Out = mkUpdated_FundDatum_With_NewClaimRewards(fundDatum_In, usingValueAsset[poolInfo.harvest_Lucid]);
        console.log(functionName + " - FundDatum Out: " + toJson(fundDatum_Out));
        //------------------
        datum_and_values_for_FundDatum.push({ datum: fundDatum_Out, value: value_For_FundDatum });
        uTxOsAtScript_With_FundDatum_WithEnoughValueToClaim.push(u.uTxO);
    });
    //------------------
    var value_FundDatums_Ins: Assets = {};
    eUTxOs_With_FundDatum_WithEnoughValueToClaim.forEach((u: EUTxO) => {
        value_FundDatums_Ins = addAssets(value_FundDatums_Ins, u.uTxO.assets);
    });
    //------------------
    var value_FundDatums_Outs: Assets = {};
    datum_and_values_for_FundDatum.forEach((datumAndValue: any) => {
        const value = datumAndValue.value;
        value_FundDatums_Outs = addAssets(value_FundDatums_Outs, value);
    });
    //--------------------
    const value_ClaimAmount = subsAssets(value_FundDatums_Ins, value_FundDatums_Outs);
    const value_For_User = value_ClaimAmount;
    console.log(functionName + " - Value For User Wallet: " + toJson(value_For_User));
    //------------------
    const redeemerForConsuming_FundDatum = new Redeemer_User_Harvest(user, harvest_Amount, claimAt);
    const redeemer_For_Consuming_UserDatum = redeemerForConsuming_FundDatum;
    //-----------------
    const redeemer_For_Mint_TxID_User_Harvest = new Redeemer_Mint_TxID(redeemerForConsuming_FundDatum);
    //------------------
    var tx_Binded = userHarvestPoolTx.bind(functionName,
        lucid!, protocolParameters, poolInfo, userAddr,
        eUTxO_With_ScriptDatum,
        eUTxO_With_Script_TxID_User_Harvest_Datum,
        eUTxO_With_PoolDatum.uTxO,
        uTxOsAtScript_With_FundDatum_WithEnoughValueToClaim, redeemerForConsuming_FundDatum,
        datum_and_values_for_FundDatum,
        eUTxO_With_UserDatum.uTxO, redeemer_For_Consuming_UserDatum,
        userDatum_Out, value_For_UserDatum,
        value_For_User,
        redeemer_For_Mint_TxID_User_Harvest, value_For_Mint_TxID_User_Harvest
    );
    //------------------
    var eUTxOs_for_consuming: EUTxO[] = [];
    for (let i = 0; i < eUTxOs_With_FundDatum_WithEnoughValueToClaim.length; i++) {
        eUTxOs_for_consuming.push(eUTxOs_With_FundDatum_WithEnoughValueToClaim[i]);
    }
    eUTxOs_for_consuming.push(eUTxO_With_UserDatum);
    //------------------
    const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
    return [txHash, eUTxOs_for_consuming_];
}

//--------------------------------------

export async function userWithdraw(wallet: Wallet, poolInfo: StakingPoolDBInterface, eUTxOs_Selected?: EUTxO[] | undefined, assets?: Assets) : Promise <[string, EUTxO []]> {
    //------------------
    const functionName = "EndPoint User - Withdraw";
    //------------------
    const lucid = wallet.lucid;
    const protocolParameters = wallet.protocolParameters;
    //------------------
    if (wallet?.pkh === undefined) throw "Couldn't get your Public Key Hash. Try connecting your Wallet again";
    //------------------
    const user = wallet.pkh!;
    //------------------
    const userAddr = await lucid!.wallet.address();
    //------------------
    const scriptAddress: Address = poolInfo.scriptAddress;
    //------------------
    const poolID_AC_Lucid = poolInfo.pParams.ppPoolID_CS + strToHex(poolID_TN);
    //------------------
    const fundID_CS = poolInfo.txID_Master_Fund_CS;
    const fundID_TN_Hex = strToHex(fundID_TN);
    // const fundID_AC : AssetClass = { currencySymbol: fundID_CS, tokenName: fundID_TN_Hex };
    const fundID_AC_Lucid = fundID_CS + fundID_TN_Hex;
    //------------------
    const userID_CS = poolInfo.txID_User_Deposit_CS;
    const userID_TN_Hex = strToHex(userID_TN);
    const userID_AC: AssetClass = { currencySymbol: userID_CS, tokenName: userID_TN_Hex };
    const userID_AC_Lucid = userID_CS + userID_TN_Hex;
    //------------------
    const staking_CS = poolInfo.staking_Lucid.slice(0, 56);
    const staking_TN = poolInfo.staking_Lucid.slice(56);
    const staking_AC_isAda = (staking_CS === 'lovelace');
    // const staking_AC_isWithoutTokenName = !staking_AC_isAda && staking_TN == ""
    //------------------
    const txID_User_Withdraw_CS = poolInfo.txID_User_Withdraw_CS;
    const txID_User_Withdraw_TN_Hex = strToHex(txID_User_Withdraw_TN);
    const txID_User_Withdraw_AC: AssetClass = { currencySymbol: txID_User_Withdraw_CS, tokenName: txID_User_Withdraw_TN_Hex };
    console.log(functionName + " - txID_User_Withdraw_AC: " + toJson(txID_User_Withdraw_AC));
    //------------------ User Deposit, para hacer el Burning
    const txID_User_Deposit_CS = poolInfo.txID_User_Deposit_CS;
    const txID_user_Deposit_For_User_TN_Hex = strToHex(txID_User_Deposit_For_User_TN);
    const txID_User_Deposit_AC: AssetClass = { currencySymbol: txID_User_Deposit_CS, tokenName: txID_user_Deposit_For_User_TN_Hex };
    console.log(functionName + " - txID_User_Deposit_AC: " + toJson(txID_User_Deposit_AC));
    //------------------ User Harvest, para hacer el Burning
    const txID_User_Harvest_CS = poolInfo.txID_User_Harvest_CS;
    const txID_User_Harvest_TN_Hex = strToHex(txID_User_Harvest_TN);
    const txID_User_Harvest_AC: AssetClass = { currencySymbol: txID_User_Harvest_CS, tokenName: txID_User_Harvest_TN_Hex };
    console.log(functionName + " - txID_User_Harvest_AC: " + toJson(txID_User_Harvest_AC));
    //------------------
    const uTxOsAtWallet = await lucid!.wallet.getUtxos();
    if (uTxOsAtWallet.length == 0) {
        throw "There are no UTxOs available in your Wallet";
    }
    //------------------
    const eUTxOs_With_Datum = await apiGetEUTxOsDBByStakingPool(poolInfo.name!);
    //------------------
    const eUTxO_With_ScriptDatum = poolInfo.eUTxO_With_ScriptDatum;
    if (!eUTxO_With_ScriptDatum) {
        console.log(functionName + " - Can't find any UTxO with 'Main Validator Script'. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with 'Main Validator Script': " + eUTxO_With_ScriptDatum.uTxO.txHash + "#" + eUTxO_With_ScriptDatum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_Script_TxID_User_Withdraw_Datum = poolInfo.eUTxO_With_Script_TxID_User_Withdraw_Datum;
    if (!eUTxO_With_Script_TxID_User_Withdraw_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'User Withdraw_Datum. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'User Withdraw_Datum: " + eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Withdraw_Datum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_Script_TxID_User_Deposit_Datum = poolInfo.eUTxO_With_Script_TxID_User_Deposit_Datum;
    if (!eUTxO_With_Script_TxID_User_Deposit_Datum) {
        console.log(functionName + " - Can't find any UTxO with Script 'User Deposit_Datum. It will be attached it in the tx");
    } else {
        console.log(functionName + " - UTxO with Script 'User Deposit_Datum: " + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.txHash + "#" + eUTxO_With_Script_TxID_User_Deposit_Datum.uTxO.outputIndex);
    }
    //------------------
    const eUTxO_With_PoolDatum = await getEUTxO_With_PoolDatum_InEUxTOList(poolInfo, poolID_AC_Lucid, eUTxOs_With_Datum, true);
    if (!eUTxO_With_PoolDatum) {
        throw "Can't find any UTxO with PoolDatum";
    }
    console.log(functionName + " - UTxO with PoolDatum: " + eUTxO_With_PoolDatum.uTxO.txHash + "#" + eUTxO_With_PoolDatum.uTxO.outputIndex);
    //------------------
    if (!eUTxOs_Selected && eUTxOs_Selected!.length == 0) {
        throw "Must choose one UTxO with UserDatum";
    }
    //------------------
    const userEUTxO = eUTxOs_Selected![0]
    const eUTxO_With_UserDatum: EUTxO | undefined = userEUTxO;
    if (!eUTxO_With_UserDatum) {
        throw "Can't find any UTxO with UserDatum where the user is register";
    }
    console.log(functionName + " - UTxOs with UserDatum and register: " + eUTxO_With_UserDatum.uTxO.txHash + "#" + eUTxO_With_UserDatum.uTxO.outputIndex);
    //------------------
    const userDatum_In: UserDatum = eUTxO_With_UserDatum.datum as UserDatum;
    //------------------
    console.log(functionName + " - User to send Back Deposit: " + toJson(userDatum_In.udUser));
    const user_To_SendBack = userDatum_In.udUser;
    const user_To_SendBackAddr = pubKeyHashToAddress(userDatum_In.udUser, process.env.NEXT_PUBLIC_USE_MAINNET === 'true' ? 1 : 0);
    console.log(functionName + " - User to send Back Deposit Addr: " + toJson(user_To_SendBackAddr));
    //------------------
    const value_In_UserDatum = eUTxO_With_UserDatum.uTxO.assets;
    console.log(functionName + " - Value In UserDatum: " + toJson(value_In_UserDatum));
    //------------------
    const value_For_Mint_TxID_User_Withdraw: Assets = { [txID_User_Withdraw_AC.currencySymbol + txID_User_Withdraw_AC.tokenName]: 1n };
    console.log(functionName + " - Value For Mint TxID User Withdraw: " + toJson(value_For_Mint_TxID_User_Withdraw));
    //------------------
    const investAmount_In_UserDatum = userDatum_In.udInvest;
    const minAda_In_UserDatum = userDatum_In.udMinAda;
    const value_InvestAmount = createValue_Adding_Tokens_Of_AC_Lucid([eUTxO_With_UserDatum.uTxO], poolInfo!.staking_Lucid, investAmount_In_UserDatum);
    const value_MinAda_In_UserDatum: Assets = { lovelace: minAda_In_UserDatum };
    //------------------
    const value_InvestAmountPlusAda = addAssets(value_InvestAmount, value_MinAda_In_UserDatum);
    //------------------
    const value_For_SendBackDeposit_To_User = value_InvestAmountPlusAda;
    console.log(functionName + " - Value For Send Back Deposit To User: " + toJson(value_For_SendBackDeposit_To_User));
    //------------------
    const value_For_Burn_UserID: Assets = { [userID_AC.currencySymbol + userID_AC.tokenName]: -1n };
    console.log(functionName + " - Value For Burn UserID: " + toJson(value_For_Burn_UserID));
    const value_For_Burn_TxID_User_Deposit: Assets = { [txID_User_Deposit_AC.currencySymbol + txID_User_Deposit_AC.tokenName]: -(investAmount_In_UserDatum) };
    console.log(functionName + " - Value For Burn_TxID_User_Deposit: " + toJson(value_For_Burn_TxID_User_Deposit));
    //------------------
    const poolDatum_In: PoolDatum = eUTxO_With_PoolDatum.datum as PoolDatum;
    console.log(functionName + " - PoolDatum In: " + toJson(poolDatum_In));
    //------------------
    const redeemer_For_Consuming_Validator_Datum = new Redeemer_User_Withdraw(user_To_SendBack);
    //-----------------
    const redeemer_For_Mint_TxID_User_Withdraw = new Redeemer_Mint_TxID(redeemer_For_Consuming_Validator_Datum);
    const redeemer_Burn_UserID = new Redeemer_Burn_TxID();
    //------------------
    if (poolDatum_In.pdFundCount == 0) {
        const poolDatum_Out = poolDatum_In;
        console.log(functionName + " - PoolDatum Out: " + toJson(poolDatum_Out));
        //------------------
        const value_In_PoolDatum = eUTxO_With_PoolDatum.uTxO.assets;
        console.log(functionName + " - value In PoolDatum: " + toJson(value_In_PoolDatum));
        var value_For_PoolDatum = addAssetsList([value_In_PoolDatum, value_For_Mint_TxID_User_Withdraw, value_In_UserDatum, value_For_Burn_UserID]);
        value_For_PoolDatum = subsAssets(value_For_PoolDatum, value_For_SendBackDeposit_To_User);
        console.log(functionName + " - value For PoolDatum: " + toJson(value_For_PoolDatum));
        //------------------
        var tx_Binded = userWithdrawTx.bind(functionName,
            lucid!, protocolParameters, poolInfo, userAddr,
            eUTxO_With_ScriptDatum,
            eUTxO_With_Script_TxID_User_Withdraw_Datum,
            eUTxO_With_Script_TxID_User_Deposit_Datum,
            eUTxO_With_PoolDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
            undefined, undefined,
            eUTxO_With_UserDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
            poolDatum_Out, value_For_PoolDatum,
            undefined, undefined,
            user_To_SendBackAddr, value_For_SendBackDeposit_To_User,
            redeemer_For_Mint_TxID_User_Withdraw, value_For_Mint_TxID_User_Withdraw,
            redeemer_Burn_UserID, value_For_Burn_UserID, value_For_Burn_TxID_User_Deposit
        );
        //------------------
        var eUTxOs_for_consuming: EUTxO[] = [];
        eUTxOs_for_consuming.push(eUTxO_With_PoolDatum)   
        eUTxOs_for_consuming.push(eUTxO_With_UserDatum);
        //------------------
        const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
        return [txHash, eUTxOs_for_consuming_];
        //------------------
    } else {
        //------------------
        // busco el utxo que tengan FundDatum validos
        const eUTxOs_With_FundDatum = getEUTxOs_With_FundDatum_InEUxTOList(fundID_AC_Lucid, eUTxOs_With_Datum, true);
        if (!eUTxOs_With_FundDatum) {
            throw "Can't find any available UTxO with FundDatum, please wait for the next block and try again";
        }
        console.log(functionName + " - UTxOs with FundDatum that are not being consumed - length: " + eUTxOs_With_FundDatum.length);
        //------------------
        const eUTxO_With_FundDatum = eUTxOs_With_FundDatum[0];
        //------------------
        const fundDatum_In: FundDatum = eUTxO_With_FundDatum.datum as FundDatum;
        console.log(functionName + " - FundDatum In: " + toJson(fundDatum_In));
        const fundDatum_Out = fundDatum_In;
        console.log(functionName + " - FundDatum Out: " + toJson(fundDatum_Out));
        //------------------
        const value_In_FundDatum = eUTxO_With_FundDatum.uTxO.assets;
        console.log(functionName + " - value In FundDatum: " + toJson(value_In_FundDatum));
        var value_For_FundDatum = addAssetsList([value_In_FundDatum, value_For_Mint_TxID_User_Withdraw, value_In_UserDatum, value_For_Burn_UserID]);
        value_For_FundDatum = subsAssets(value_For_FundDatum, value_For_SendBackDeposit_To_User);
        console.log(functionName + " - value For FundDatum: " + toJson(value_For_FundDatum));
        //------------------
        var tx_Binded = userWithdrawTx.bind(functionName,
            lucid!, protocolParameters, poolInfo, userAddr,
            eUTxO_With_ScriptDatum,
            eUTxO_With_Script_TxID_User_Withdraw_Datum,
            eUTxO_With_Script_TxID_User_Deposit_Datum,
            eUTxO_With_PoolDatum.uTxO, undefined,
            eUTxO_With_FundDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
            eUTxO_With_UserDatum.uTxO, redeemer_For_Consuming_Validator_Datum,
            undefined, undefined,
            fundDatum_Out, value_For_FundDatum,
            user_To_SendBackAddr, value_For_SendBackDeposit_To_User,
            redeemer_For_Mint_TxID_User_Withdraw, value_For_Mint_TxID_User_Withdraw,
            redeemer_Burn_UserID, value_For_Burn_UserID, value_For_Burn_TxID_User_Deposit
        );
        //------------------
        var eUTxOs_for_consuming: EUTxO[] = [];
        eUTxOs_for_consuming.push(eUTxO_With_FundDatum);
        eUTxOs_for_consuming.push(eUTxO_With_UserDatum);
        //------------------
        const [txHash, eUTxOs_for_consuming_] = await makeTx_And_UpdateEUTxOsIsPreparing (functionName, wallet, protocolParameters, tx_Binded, eUTxOs_for_consuming);
        return [txHash, eUTxOs_for_consuming_];
        //------------------
    }
}
