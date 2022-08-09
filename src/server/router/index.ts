import { deserializeUser } from '@server/middlewares/deserializeUser'
import { createRouter } from '@server/tools/createRouter'
import { authRouter } from './auth'

export const appRouter = createRouter()
    .middleware(({ next, ctx }) => {
        return next()
    })
    .middleware(({ next, ctx }) => {
        const { req, res } = ctx
        deserializeUser(req, res)
        return next()
    })
    .merge('auth.', authRouter)

export type AppRouter = typeof appRouter
