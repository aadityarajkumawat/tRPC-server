import { NextApiRequest } from 'next'
import { verifyJWT } from './jwt'

interface ContextUser {
    iat: string
    exp: number
    sessionId: string
    tokenVersion: number
}

export function getUserFromRequest(req: NextApiRequest, sessionStore: any) {
    const token = req.cookies.refreshToken

    if (token) {
        try {
            const verified = verifyJWT<ContextUser>(token)
            if (!verified.payload)
                throw new Error('Session not found:Invalid token')
            ;(async function () {
                const session = await sessionStore.sessionBySessionId(
                    verified.payload.sessionId,
                )
                if (!session) throw new Error('Session not found')
                // console.log(verified, session)

                if (verified.payload.tokenVersion !== session.tokenVersion) {
                    throw new Error('Session Expired, login again')
                }
            })()

            return verified
        } catch (error) {
            return null
        }
    }
}
