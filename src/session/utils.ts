import { v4 } from 'uuid'
import { PrismaClient } from '@prisma/client'

export interface SessionEntry {
    userId: string
    sessionId: string
    tokenVersion: number
}

export const sessionDB = (db: PrismaClient) => {
    async function sessionByUseryId(userId: string) {
        const session = await db.session.findFirst({ where: { userId } })
        return session
    }

    async function sessionBySessionId(sessionId: string) {
        const session = await db.session.findFirst({ where: { sessionId } })
        return session
    }

    async function createSession(userId: string, tokenVersion: number) {
        const sessionData: SessionEntry = {
            userId,
            sessionId: v4(),
            tokenVersion,
        }

        console.log({ sessionData })

        const session = await db.session.upsert({
            where: { userId },
            update: {
                sessionId: sessionData.sessionId,
                tokenVersion: sessionData.tokenVersion,
            },
            create: sessionData,
        })

        console.log('final', session)

        return session
    }

    async function destroySession(sessionId: string) {
        await db.session.delete({ where: { sessionId } })
    }

    return {
        sessionBySessionId,
        sessionByUseryId,
        createSession,
        destroySession,
    }
}
