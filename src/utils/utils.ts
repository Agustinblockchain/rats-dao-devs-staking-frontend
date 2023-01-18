import { createHash } from 'crypto';
//----------------------------------------------------------------------

export function formatAmount(number: number, decimals: number | undefined, unit: string | undefined) {
    if (decimals === undefined) decimals = 0
    if (unit === undefined) {
        unit = ""
    }else{
        unit = " " + unit
    }
    const pot = Math.pow(10, decimals)
    var strConDecimals = (number / pot).toLocaleString("en-US", {minimumFractionDigits: decimals})
    var posDec = strConDecimals.indexOf(".")
    if(posDec !== -1 ){
        //delete trailing zeros
        strConDecimals = strConDecimals.replace(/0*$/,"")
        strConDecimals = strConDecimals.replace(/\.$/,"")
    }
    return strConDecimals + unit
}

//----------------------------------------------------------------------

// export function string2Bin (str: string) {
//         var result = [];
//         for (var i = 0; i < str.length; i++) {
//             result.push(str.charCodeAt(i).toString(2));
//         }
//         return result;
//     }

//----------------------------------------------------------------------

export const copyToClipboard = (str: string) => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText)
        return navigator.clipboard.writeText(str);
    return Promise.reject('The Clipboard API is not available.');
};

//----------------------------------------------------------------------

//for converting String into Hex representation. It is used for converting the TokenName into Hex
export function strToHex(str: string) {
    var result = '';
    for (var i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16);
    }
    return result;
}

//for converting Hex into String
export function hexToStr(hexStr: string) {
    const bytes = new Uint8Array(hexStr.length / 2);
    for (let i = 0; i !== bytes.length; i++) {
        bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
    }
    return new TextDecoder().decode(bytes);
}

//----------------------------------------------------------------------

//for converting Hex String to byte array. It is used in sha256 calculation.
export function hexToBytes(hexStr: string) {
    for (var bytes = [], c = 0; c < hexStr.length; c += 2)
        bytes.push(parseInt(hexStr.substr(c, 2), 16));
    return bytes;
}

// Convert a byte array to a hex string
export function bytesToHex(bytes: any[]) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
}

export const bytesUint8ArraToHex = (bytes: Uint8Array) => {
    const b = Buffer.from(bytes).toString("hex");
    return b;
}

//----------------------------------------------------------------------

//for showing content of pointers
export function showPtrInHex(ptr: any): string {
    return Buffer.from(ptr.to_bytes(), "utf8").toString("hex")
}

//----------------------------------------------------------------------

// 48 is ASCII code for '0'
export function intToBBS(number: number) {
    const rest = (number + 48).toString(16);
    return rest
}


//----------------------------------------------------------------------

//for calculating sha256S hash from hex string
export function sha256HexStr(hexStr: string) {
    //console.log ("sha256Str 1: " + hexStr)
    //const bytesStr = hexToBytes (hexStr)
    //console.log ("sha256Str 2: " + bytesStr)
    //const res = createHash('sha256').update(bytesStr).digest('hex');
    const res = createHash('sha256').update(hexStr, 'hex').digest('hex');

    //console.log ("sha256Str 3: " + res)
    return res
}

//----------------------------------------------------------------------

//for printing pretty any object
export function toJson(data: any) {
    if (data) {

        var json = JSON.stringify(data, getCircularReplacer())
        //console.log(json)

        if (json === "{}") {
            json = data.toString()
        }

        const jsonreplace = json.replace(/"(-?\d+)n"/g, (_, a) => a)

        return jsonreplace

    } else {
        return "{}"
    }
}

const getCircularReplacer = () => {
    const seen = new WeakSet()
    return (key: any, value: object | null) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return 'Object Circular Reference';
            }
            seen.add(value)
        }
        if (typeof value === 'bigint') {
            return `${value}n`
        } else {
            return value
        }
    }
}

//----------------------------------------------------------------------

export function searchValueInArray(array: string | any[], value: any) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
}

//remove value from array
export function removeValueFromArray(array: any[], value: any) {
    const res: any[] = []

    for (var i = 0; i < array.length; i++) {
        if (array[i] !== value) {
            res.push(array[i])
        }
    }

    return res
}

//search key in object
export function searchKeyInObject(obj: any, key: string) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        if (key == keys[i]) {
            return true;
        }
    }

    if (obj.hasOwnProperty(key)) {
        return true;
    } else {
        return false;
    }
}

//search and get key in object
export function searchAndGetKeyInObject(obj: any, key: string) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        if (key == keys[i]) {
            return obj[key];
        }
    }
    if (obj.hasOwnProperty(key)) {
        return obj[key];
    } else {
        return undefined;
    }
}

//----------------------------------------------------------------------

export function htmlEscape(str: string) {
    return str
        .replace(/&/g, '&amp')
        .replace(/'/g, '&apos')
        .replace(/"/g, '&quot')
        .replace(/>/g, '&gt')   
        .replace(/</g, '&lt');    
}

// The opposite function:
export function htmlUnescape(str: string) {
    return str
        .replace(/&amp/g, '&')
        .replace(/&apos/g, "'")
        .replace(/&quot/g, '"')
        .replace(/&gt/g, '>')   
        .replace(/&lt/g, '<');    
}

//----------------------------------------------------------------------

export function isEqual(obj1: any, obj2: any) {
    
    if (obj1 === undefined && obj2 === undefined) {
        return true;
    }else if (obj1 === null && obj2 === null) {
        return true;
    }else if (obj1 === undefined && obj2 !== undefined) {
        return false;
    }else if (obj1 !== undefined && obj2 === undefined) {
        return false;
    }else if (obj1 === null && obj2 !== null) {
        return false;
    }else if (obj1 !== null && obj2 === null) {
        return false;
    }
    var props1 = Object.getOwnPropertyNames(obj1);
    var props2 = Object.getOwnPropertyNames(obj2);
    if (props1.length != props2.length) {
        return false;
    }
    for (var i = 0; i < props1.length; i++) {
        let val1 = obj1[props1[i]];
        let val2 = obj2[props1[i]];
        let isObjects = isObject(val1) && isObject(val2);
        if (isObjects && !isEqual(val1, val2) || !isObjects && val1 !== val2) {
            return false;
        }
    }
    return true;
}

export function isObject(object: any) {
    return object != null && typeof object === 'object';
}

//----------------------------------------------------------------------
