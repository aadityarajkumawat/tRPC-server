import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'
import { getUserFromRequest } from './getUserFromReq'
import { db } from './prisma'

export function createContext({
    req,
    res,
}: {
    req: NextApiRequest
    res: NextApiResponse
}) {
    const user = getUserFromRequest(req)

    function setCookie(name: string, value: string, maxAge: number) {
        res.setHeader(
            'Set-Cookie',
            serialize(name, value, { maxAge, httpOnly: true }),
        )
    }

    const reqC = { ...req } as NextApiRequest & {
        user: any
        setCookie: typeof setCookie
    }

    reqC.user = null
    reqC.setCookie = setCookie

    return { req: reqC, res, db, user }
}
