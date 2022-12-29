// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { connect } from '../../utils/dbConnect'

import { strToHex, toJson } from '../../utils/utils';
import { getEstadoDeployFromFile } from "../../stakePool/utilsServerSide";

type Data = {
    msg: string
}

export default async function handler( req: NextApiRequest, res: NextApiResponse<Data | string>) {

	const nombrePool = req.body.nombrePool

	console.log("/api/getEstadoDeploy - Request: " + toJson(req.body.nombrePool));

	const estadoJsonFileName = nombrePool + "/" + 'estado.json';

	const estado = await getEstadoDeployFromFile(estadoJsonFileName);

	res.status(200).json({ msg: estado})

	return
	
}
