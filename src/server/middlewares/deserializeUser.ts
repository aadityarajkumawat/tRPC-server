import { Context } from '@pages/api/trpc/[trpc]'
import { verifyJWT } from '@utils/jwt'
import { NextApiResponse } from 'next'

export function deserializeUser(req: Context['req'], _: NextApiResponse) {
    const { accessToken } = req.cookies

    if (!accessToken) {
        return
    }

    const { payload } = verifyJWT(accessToken)

    if (payload) {
        // @ts-ignore
        req.user = payload
        return
    }
}
