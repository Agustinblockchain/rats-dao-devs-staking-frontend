//--------------------------------------
import { Script } from 'lucid-cardano';
import path from 'path';
//---------------------------------------------------------------
const fs = require('fs/promises');
//---------------------------------------------------------------
export function createScriptFromHEXCBOR(hexCbor: string, type: string = "PlutusScriptV2") {
    const script: Script = {
        type: ((type == "PlutusScriptV1") ? "PlutusV1" : "PlutusV2"),
        script: "59084c" + hexCbor
    }
    return script
}

      
export async function getScriptFromFile(filename: string)  {
    try {
        const pathToFile = path.join(process.cwd(), 'public','scripts', filename);

        const data = await fs.readFile(pathToFile, { encoding: 'utf8' });
        //console.log(data);
        let jsonFile = JSON.parse(data);
        const script: Script = {
            type: ((jsonFile.type == "PlutusScriptV1") ? "PlutusV1" : "PlutusV2"),
            script: jsonFile.cborHex
        }
        return script
    } catch (error: any) {
        console.error("Error reading: " + filename + " " + error);
        throw "Error reading: " + filename + " " + error;
    }
}

export async function getSymbolFromFile(filename: string)  {
    try {
        const pathToFile = path.join(process.cwd(), 'public','scripts', filename);

        const data = await fs.readFile(pathToFile, { encoding: 'utf8' });
        //console.log(data);
        let jsonFile = JSON.parse(data);
        return jsonFile.bytes
    } catch (error: any) {
        console.error("Error reading: " + filename + " " + error);
        throw "Error reading: " + filename + " " + error;
    }
}

export async function getTextFromFile(filename: string)  { 
    try {

        const pathToFile = path.join(process.cwd(), 'public','scripts', filename);
        //console.log ("path3: " + path2) 

        const data = await fs.readFile(pathToFile, { encoding: 'utf8' });
        //console.log(data);
        return data
    } catch (error: any) {
        console.error("Error reading: " + filename + " " + error);
        throw "Error reading: " + filename + " " + error;
    }
}


//---------------------------------------------------------------

