import { v4 } from 'uuid'
import { db } from '@utils/prisma'

export interface SessionEntry {
    userId: string
    sessionId: string
    tokenVersion: number
}

export async function sessionByUseryId(userId: string) {
    const session = await db.session.findFirst({ where: { userId } })
    return session
}

export async function sessionBySessionId(sessionId: string) {
    const session = await db.session.findFirst({ where: { sessionId } })
    return session
}

export async function createSession(userId: string, tokenVersion: number) {
    const sessionData: SessionEntry = { userId, sessionId: v4(), tokenVersion }
    const session = await db.session.upsert({
        where: { userId },
        update: {},
        create: sessionData,
    })

    return session
}

export async function destroySession(sessionId: string) {
    await db.session.delete({ where: { sessionId } })
}
