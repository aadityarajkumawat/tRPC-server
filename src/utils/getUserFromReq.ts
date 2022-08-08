import { NextApiRequest } from 'next'
import { verifyJWT } from './jwt'

interface ContextUser {
    userId: string
    email: string
    name: string
    iat: string
    exp: number
}

export function getUserFromRequest(req: NextApiRequest) {
    const token = req.cookies.token

    if (token) {
        try {
            const verified = verifyJWT<ContextUser>(token)
            return verified
        } catch (error) {
            return null
        }
    }
}
