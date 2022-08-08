import { appRouter } from '@server/router'
import * as trpcNext from '@trpc/server/adapters/next'
import { createContext } from '@utils/createContext'

export default trpcNext.createNextApiHandler({
    router: appRouter,
    createContext,
})

export type Context = ReturnType<typeof createContext>
