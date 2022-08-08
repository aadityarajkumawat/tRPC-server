import { Context } from '@pages/api/trpc/[trpc]'
import { verifyJWT } from '@utils/jwt'
import { NextApiResponse } from 'next'

export interface Session {
    userId: string
    sessionId: string
}

export function deserializeUser(req: Context['req'], _: NextApiResponse) {
    const authTokenName = 'Authorization'
    const tokenIdx = req.rawHeaders.findIndex((h) => h === authTokenName)

    const accessToken = req.rawHeaders[tokenIdx + 1]

    if (!accessToken) {
        return
    }

    const { payload } = verifyJWT<Session>(accessToken)

    if (payload) {
        req.user = payload
        return
    }
}
