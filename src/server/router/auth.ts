import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { Session } from '@server/middlewares/deserializeUser'
import { createRouter } from '@server/tools/createRouter'
import {
    createSession,
    destroySession,
    sessionBySessionId,
} from '@session/utils'
import { TRPCError } from '@trpc/server'
import { signJWT, verifyJWT } from '@utils/jwt'
import { v4 } from 'uuid'
import { z } from 'zod'

const router = createRouter()

const loginValidator = z.object({
    email: z.string().email(),
    password: z.string().min(5).max(20),
})

const registerValidator = loginValidator

type RegisterUser = z.infer<typeof registerValidator>

const authOutput = z.object({
    token: z.string(),
})

export const authRouter = router
    .mutation('login', {
        input: loginValidator,
        output: authOutput,
        async resolve({ input, ctx: { req, db } }) {
            try {
                const { email, password } = input

                const user = await db.user.findFirst({ where: { email } })
                if (!user) throw new Error('Email or Password is invalid')

                const passwordIsValid = password === user.password

                if (!passwordIsValid)
                    throw new Error('Email or Password is invalid')

                const session = createSession(user.userId)

                const accessToken = signJWT(
                    {
                        userId: user.userId,
                        sessionId: session.sessionId,
                    },
                    '1h',
                )

                const refreshToken = signJWT(
                    { sessionId: session.sessionId },
                    '1y',
                )

                req.setCookie('refreshToken', refreshToken, 1000 * 40)

                return { token: accessToken }
            } catch (error: any) {
                return { token: '' }
            }
        },
    })
    .mutation('register', {
        input: registerValidator,
        output: authOutput,
        async resolve({ input, ctx }) {
            try {
                const { req, user, db } = ctx

                if (user) throw new Error('Please logout first')

                const { email, password } = input

                const userId = v4()

                const registeredUser = await db.user.create({
                    data: { email, password, userId },
                })

                const session = createSession(registeredUser.userId)

                const accessToken = signJWT(
                    {
                        userId: registeredUser.userId,
                        sessionId: session.sessionId,
                    },
                    '1h',
                )

                const refreshToken = signJWT(
                    { sessionId: session.sessionId },
                    '1y',
                )

                req.setCookie('refreshToken', refreshToken, 1000 * 40)

                return { token: accessToken }
            } catch (error) {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        throw new TRPCError({
                            code: 'CONFLICT',
                            message: 'User already exists',
                        })
                    }
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Something went wrong',
                })
            }
        },
    })
    .query('user', {
        async resolve({ ctx }) {
            const user = ctx.req.user
            if (!user) return { user, error: 'session is invalid' }
            const userId = user.userId
            const userDetails = await ctx.db.user.findFirst({
                where: { userId },
            })
            return { user: userDetails, error: null }
        },
    })
    .query('logout', {
        resolve({ ctx: { req, user } }) {
            if (!user || !user.payload) return { success: true }
            const sessionId = user.payload.sessionId

            destroySession(sessionId)

            req.setCookie('refreshToken', '', 0)
            return { success: true }
        },
    })
    .query('refresh_token', {
        resolve({ ctx: { req } }) {
            const refreshToken = req.cookies.refreshToken
            if (!refreshToken)
                return { token: '', error: 'refresh token not found' }
            const { payload } = verifyJWT<Omit<Session, 'userId'>>(refreshToken)

            if (!payload)
                return {
                    token: '',
                    error: 'refresh token expired, please login again',
                }

            const sessionId = payload.sessionId

            const session = sessionBySessionId(sessionId)

            if (!session) return { token: '', error: 'session not found' }

            const accessToken = signJWT(session, '1h')

            return { token: accessToken, error: '' }
        },
    })
