import { __is_prod__ } from '@constants'
import { PrismaClient } from '@prisma/client'

declare global {
    var db: PrismaClient | undefined
}

export const db = global.db || new PrismaClient()

if (!__is_prod__) {
    global.db = db
}
