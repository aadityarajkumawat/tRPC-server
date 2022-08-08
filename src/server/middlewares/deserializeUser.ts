import { Context } from '@pages/api/trpc/[trpc]'
import { sessionBySessionId } from '@session/utils'
import { verifyJWT } from '@utils/jwt'
import { NextApiResponse } from 'next'

export function deserializeUser(req: Context['req'], _: NextApiResponse) {
    const authTokenName = 'Authorization'
    const tokenIdx = req.rawHeaders.findIndex((h) => h === authTokenName)

    const accessToken = req.rawHeaders[tokenIdx + 1]
    const { refreshToken } = req.cookies

    if (!accessToken) {
        return
    }

    const { payload, expired } = verifyJWT(accessToken)

    if (payload) {
        req.user = payload
        return
    }

    const { payload: refresh } =
        expired && refreshToken ? verifyJWT(refreshToken) : { payload: null }

    if (!refresh) {
        return
    }

    // @ts-ignore
    const session = sessionBySessionId(refresh.sessionId)

    if (!session) {
        return
    }
}
