
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getEstadoDeployFromFile } from "../../stakePool/helpersServerSide";
import { toJson } from '../../utils/utils';

type Data = {
    msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

	//--------------------------------
	// const session = await getSession({ req })
	// if (!session) {
	// 	console.error("/api/getEstadoDeploy - Must Connect to your Wallet"); 
	// 	res.status(400).json({ msg: "Must Connect to your Wallet" })
	// 	return 
    // }
	// const sesionPkh = session?.user.pkh
	//--------------------------------
	 
	const nombrePool = req.body.nombrePool

	console.log("/api/getEstadoDeploy - Request: " + toJson(req.body.nombrePool));

	const estadoJsonFileName = nombrePool + "/" + 'estado.json';

	const estado = await getEstadoDeployFromFile(estadoJsonFileName);

	res.status(200).json({ msg: estado})

	return
	
}
