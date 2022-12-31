import { NextApiHandler } from 'next';
import httpProxyMiddleware from 'next-http-proxy-middleware';
import { toJson } from '../../../utils/utils';

const getTarget = (url?: string) => {
  return process.env.NEXT_PUBLIC_BLOCKFROST_URL
}

const getProjectId = (url?: string) => {
  return process.env.BLOCKFROST_KEY
}

const blockfrostProxy: NextApiHandler = async (req, res) => {
  const target = getTarget(req.url)
  const PROJECT_ID = getProjectId(req.url)

  try {
    if (!target || !PROJECT_ID) throw new Error("Invalid target or project id")
    //console.log("Blockfrost proxy: " + toJson(req))
    const response = await httpProxyMiddleware(req, res, {
      target,
      headers: {
        'project_id': PROJECT_ID,
      },
      pathRewrite: [
        {
          patternStr: "^/api/blockfrost",
          replaceStr: "",
        }
      ],
    })

    return response
  } catch (e) {
    console.error("Blockfrost proxy error", e)

    // NOTE(Alan): Not sure if this is compatible with Lucid / the Blockfrost provider
    return res.status(400).end()
  }
}

export default blockfrostProxy