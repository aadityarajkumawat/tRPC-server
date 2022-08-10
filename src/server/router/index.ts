import { deserializeUser } from '@server/middlewares/deserializeUser'
import { createRouter } from '@server/tools/createRouter'
import { authRouter } from './auth'
import cors from 'cors'

export const appRouter = createRouter()
    .middleware(({ next, ctx }) => {
        cors({ origin: '*' })
        return next()
    })
    .middleware(({ next, ctx }) => {
        const { req, res } = ctx

        cors({ origin: '*' })
        deserializeUser(req, res)
        return next()
    })
    .merge('auth.', authRouter)

export type AppRouter = typeof appRouter
