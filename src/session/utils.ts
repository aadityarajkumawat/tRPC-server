import { readFileSync, writeFileSync } from 'fs'
import { v4 } from 'uuid'

const fileName = './src/session/session.json'

function getAllSessions() {
    const dataStr = readFileSync(fileName, { encoding: 'utf-8' })
    const data = JSON.parse(dataStr).sessions as Array<{
        userId: string
        sessionId: string
    }>
    return data
}

export function sessionByUseryId(userId: string) {
    const data = getAllSessions()
    return data.find((u) => u.userId === userId)
}

export function sessionBySessionId(sessionId: string) {
    const data = getAllSessions()
    return data.find((u) => u.sessionId === sessionId)
}

export function createSession(userId: string) {
    const data = getAllSessions()
    const sesh = sessionByUseryId(userId)

    if (sesh) return sesh

    const sessh = { userId, sessionId: v4() }
    data.push(sessh)

    const str = JSON.stringify({ sessions: data })
    writeFileSync(fileName, str, { encoding: 'utf-8' })
    return sessh
}

export function destroySession(sessionId: string) {
    const data = getAllSessions()

    const out = data.filter((d) => d.sessionId !== sessionId)

    const str = JSON.stringify({ sessions: out })
    writeFileSync(fileName, str, { encoding: 'utf-8' })
}
