import { C, Constr, Data, fromHex, PaymentKeyHash } from "lucid-cardano";
import { Address, BaseAddress, Bip32PrivateKey, Bip32PublicKey, Ed25519KeyHash, EnterpriseAddress, StakeCredential } from "@dcspark/cardano-multiplatform-lib-browser";
import { InterestRate, Maybe, TxOutRef } from "../types";
import { bytesUint8ArraToHex } from "./utils";

//---------------------------------------------------------------
//USING CARDANO MULTIPLATAFORM, NO LUCID:

export const addrToPubKeyHash = (bech32Addr: string) => {
    const baseAddress = BaseAddress.from_address(
        Address.from_bech32(bech32Addr)
    );

    if (baseAddress) {
        const pkh = baseAddress.payment_cred().to_keyhash();
        const res = bytesUint8ArraToHex(pkh!.to_bytes());
        return res;
    } else {
        return undefined;
    }

};

//----------------------------------------------------------------------

// network: mainnet = 1    Tesnet = 0

export function Ed25519KeyHashToAddress(keyHash: Ed25519KeyHash, network: number) {

    // generate the address
    const enterpriseAddr = EnterpriseAddress.new(
        network,
        StakeCredential.from_keyhash(keyHash)
    );

    //    const address = options.addressType === "Base"
    //                 ? C.BaseAddress.new(networkId, C.StakeCredential.from_keyhash(paymentKeyHash), C.StakeCredential.from_keyhash(stakeKeyHash)).to_address().to_bech32(undefined)
    //                 : C.EnterpriseAddress.new(networkId, C.StakeCredential.from_keyhash(paymentKeyHash)).to_address().to_bech32(undefined);
    // get bech32 for address
    const bech32 = enterpriseAddr.to_address().to_bech32(undefined);

    return bech32;

}

//----------------------------------------------------------------------

// network: mainnet = 1    Tesnet = 0

export function Bip32PublicKeyToAddress(bip32: Bip32PublicKey, network: number) {

    var rootPk: Bip32PublicKey = bip32;

    // generate an address pk
    const addressPk = rootPk!
        .derive(1852 + 0x80000000) // Cardano uses 1852 for Shelley purpose paths
        .derive(1815 + 0x80000000) // Cardano coin type
        .derive(0 + 0x80000000) // account #0
        .derive(0) // external chain (see bip44)
        .derive(0); // 0th account


    // get the address public key hash
    const keyHash = addressPk
        .to_raw_key() // strips the chain code
        .hash();

    // get bech32 for address
    const bech32 = Ed25519KeyHashToAddress(keyHash, network);

    return bech32;

}

//----------------------------------------------------------------------

// network: mainnet = 1    Tesnet = 0

export function Bip32PrivateKeyToAddress(bip32: Bip32PrivateKey, network: number) {

    var rootPk: Bip32PrivateKey = bip32;

    // generate an address pk
    const addressPk = rootPk!
        .derive(1852 + 0x80000000) // Cardano uses 1852 for Shelley purpose paths
        .derive(1815 + 0x80000000) // Cardano coin type
        .derive(0 + 0x80000000) // account #0
        .derive(0) // external chain (see bip44)
        .derive(0); // 0th account


    // get the address public key hash
    const keyHash = addressPk
        .to_raw_key() // strips the chain code
        .to_public()
        .hash();

    // get bech32 for address
    const bech32 = Ed25519KeyHashToAddress(keyHash, network);

    return bech32;

}

//----------------------------------------------------------------------

// network: mainnet = 1    Tesnet = 0

export function pubKeyHashToAddress(pkh: PaymentKeyHash, network: number) {

    const keyHash = Ed25519KeyHash.from_bytes(fromHex(pkh));

    const bech32 = Ed25519KeyHashToAddress(keyHash, network);

    // const pkh2 = addrToPubKeyHash (bech32)
    // console.log("pkh2: " + pkh2)
    return bech32;

}

//----------------------------------------------------------------------

function itemToData(item: any) {

    if (typeof item === 'bigint' || typeof item === 'number' || typeof item === 'string' && !isNaN(parseInt(item)) && item.slice(-1) === 'n') {
        return (item);
    } else if (item instanceof TxOutRef) {

        var list2: any[] = [];
        list2.push(new Constr(0, [item.txHash]));
        list2.push(item.outputIndex);
        const res2 = new Constr(0, list2);
        return (res2);

    } else if (item instanceof InterestRate) {

        var list2: any[] = [];
        list2.push(new Constr(item.iMinDays.val !== undefined ? 0 : 1, item.iMinDays.val !== undefined ? [item.iMinDays.val] : []));
        list2.push(item.iPercentage);
        const res2 = new Constr(0, list2);
        return (res2);

    } else if (item instanceof Maybe) {

        const res2 = new Constr(item.plutusDataIndex, item.val !== undefined ? [item.val] : []);
        return (res2);

    } else if (typeof item === 'string') {
        // var item_ = Uint8Array.from(Buffer.from(item))
        return (item);
    } else if (item instanceof Constr) {
        return (item);
    } else if (item instanceof Array) {

        var list2: any[] = [];
        item.forEach((subItem: any) => {
            list2.push(itemToData(subItem));
        });
        return (list2);

    } else if (item instanceof Map) {
        // TODO: falta convertir map, pero no uso map, asi que por ahora no lo hago
        return (item);
    } else {
        return (subObjToData(item));
    }
}

//----------------------------------------------------------------------

//for creating a PlutusData structure from any Object
function subObjToData(data: any) {

    const keys = Object.keys(data);
    var list: any[] = [];
    keys.forEach(key => {
        const item = data[key];
        if (key == "plutusDataIndex" || key == "subtypo")
            return; //no quiero user esa info en el construct
        const itemData: any = itemToData(item);
        list.push(itemData);
    });

    var plutusDataIndex = 0;
    if ("plutusDataIndex" in data) {
        //si existe ese campo en la clase o el tipo lo uso para crear el construct superior
        plutusDataIndex = data.plutusDataIndex;
    }
    // if (searchKeyInObject(data,"plutusDataIndex")){
    //     //si existe ese campo en la clase o el tipo lo uso para crear el construct superior
    //     plutusDataIndex = data.plutusDataIndex
    // }
    if ("subtypo" in data && data["subtypo"]) {

        const constrSubtypo = new Constr(0, list);

        const constrTypo = new Constr(plutusDataIndex, [constrSubtypo]);

        return constrTypo;

    } else {

        const constrTypo = new Constr(plutusDataIndex, list);

        return constrTypo;
    }

}

//----------------------------------------------------------------------

//for creating a PlutusData structure from any Object
//it used firts the lucidData format, and then Data.to, for serialize and then PlutusData.from_bytes(fromHex()) to get the final PlutusData

export function objToPlutusData(data: any) {

    const lucidData = subObjToData(data); //new Constr (plutusDataIndex, [constrObject])



    //console.log("LucidData: " + toJson(lucidData))
    const dataHex = Data.to(lucidData);
    const plutusData = C.PlutusData.from_bytes(fromHex(dataHex));

    return plutusData;

}

//----------------------------------------------------------------------
