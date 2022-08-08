import { Context } from '@pages/api/trpc/[trpc]'
import { router } from '@trpc/server'

export function createRouter() {
    return router<Context>()
}
