import { NextApiRequest } from 'next'
import { verifyJWT } from './jwt'

interface ContextUser {
    iat: string
    exp: number
    sessionId: string
}

export function getUserFromRequest(req: NextApiRequest) {
    const token = req.cookies.refreshToken

    if (token) {
        try {
            const verified = verifyJWT<ContextUser>(token)
            return verified
        } catch (error) {
            return null
        }
    }
}
