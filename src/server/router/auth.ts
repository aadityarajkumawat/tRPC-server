import { ONE_YEAR, REFRESH_TOKEN } from '@constants'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { RefreshTokenPayload } from '@server/middlewares/deserializeUser'
import { createRouter } from '@server/tools/createRouter'
import {
    createSession,
    destroySession,
    sessionBySessionId,
} from '@session/utils'
import { TRPCError } from '@trpc/server'
import { signJWT, verifyJWT } from '@utils/jwt'
import { signAccessToken } from '@utils/signAccessToken'
import { signRefreshToken } from '@utils/signRefreshToken'
import { v4 } from 'uuid'
import { z } from 'zod'

const router = createRouter()

const loginValidator = z.object({
    email: z.string().email(),
    password: z.string().min(5).max(20),
})

const registerValidator = loginValidator

const authOutput = z.object({
    token: z.string().nullish(),
    error: z.object({ type: z.string(), code: z.number() }).nullable(),
})

export const authRouter = router
    .mutation('login', {
        input: loginValidator,
        output: authOutput,
        async resolve({ input, ctx }) {
            try {
                const { db, req, user: userSession } = ctx
                const { email, password } = input

                if (req.user) {
                    // user loaded from access token
                    // Authorization header is not supposed
                    // to be found here.
                }

                if (userSession && userSession.payload) {
                    // user session is loaded from the refresh token
                    // not since the previous user is logging out
                    // we revoke all their previous refresh tokens by
                    // incrementing their token version
                    const sessionId = userSession.payload.sessionId

                    const session = sessionBySessionId(sessionId)
                    if (!session) throw new Error('Session not found')

                    destroySession(sessionId)
                    req.setCookie(REFRESH_TOKEN, '', 0)

                    // this is where we invalidate the refresh token
                    // by incrementing the tokenVersion
                    await db.authToken.update({
                        where: { userId: session.userId },
                        data: { tokenVersion: { increment: 1 } },
                    })
                }

                const user = await db.user.findFirst({ where: { email } })
                if (!user) throw new Error('Email or Password is invalid')

                // if the user has a token version, then, we update it,
                // else we create a new one and user that version to encode
                // refresh token
                const authToken = await db.authToken.update({
                    where: { userId: user.userId },
                    data: { tokenVersion: { increment: 1 } },
                })

                const passwordIsValid = password === user.password

                if (!passwordIsValid)
                    throw new Error('Email or Password is invalid')

                // create a new session for the user
                const session = createSession(
                    user.userId,
                    authToken.tokenVersion,
                )

                const accessToken = signAccessToken(session)

                const refreshToken = signRefreshToken({
                    sessionId: session.sessionId,
                    tokenVersion: authToken.tokenVersion,
                })

                req.setCookie(REFRESH_TOKEN, refreshToken, ONE_YEAR)

                return { token: accessToken, error: null }
            } catch (error: any) {
                return {
                    token: null,
                    error: { type: error.message, code: 100 },
                }
            }
        },
    })
    .mutation('register', {
        input: registerValidator,
        output: authOutput,
        async resolve({ input, ctx }) {
            try {
                const { req, user: userSession, db } = ctx

                if (req.user) {
                    // user loaded from access token
                    // Authorization header is not supposed
                    // to be found here.
                }

                if (userSession && userSession.payload) {
                    // user session is loaded from the refresh token
                    // not since the previous user is logging out
                    // we revoke all their previous refresh tokens by
                    // incrementing their token version
                    const sessionId = userSession.payload.sessionId

                    const session = sessionBySessionId(sessionId)
                    if (!session) throw new Error('Session not found')

                    destroySession(sessionId)
                    req.setCookie(REFRESH_TOKEN, '', 0)

                    // this is where we invalidate the refresh token
                    // by incrementing the tokenVersion
                    await db.authToken.update({
                        where: { userId: session.userId },
                        data: { tokenVersion: { increment: 1 } },
                    })
                }

                const { email, password } = input

                const userId = v4()

                const registeredUser = await db.user.create({
                    data: { email, password, userId },
                })

                // if the user if getting created for the first time
                // then we create a new authToken entry
                const authToken = await db.authToken.create({
                    data: {
                        authTokenId: v4(),
                        userId: registeredUser.userId,
                    },
                })

                const session = createSession(
                    registeredUser.userId,
                    authToken.tokenVersion,
                )

                const accessToken = signAccessToken({
                    userId: registeredUser.userId,
                    sessionId: session.sessionId,
                })

                const refreshToken = signRefreshToken({
                    sessionId: session.sessionId,
                    tokenVersion: authToken.tokenVersion,
                })

                req.setCookie(REFRESH_TOKEN, refreshToken, ONE_YEAR)

                return { token: accessToken, error: null }
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

            req.setCookie(REFRESH_TOKEN, '', 0)
            return { success: true }
        },
    })
    .query('refresh_token', {
        resolve({ ctx: { req } }) {
            const refreshToken = req.cookies.refreshToken
            if (!refreshToken)
                return { token: '', error: 'refresh token not found' }
            const { payload } = verifyJWT<RefreshTokenPayload>(refreshToken)

            if (!payload)
                return {
                    token: '',
                    error: 'refresh token expired, please login again',
                }

            const sessionId = payload.sessionId

            const session = sessionBySessionId(sessionId)

            if (!session) return { token: '', error: 'session not found' }

            const accessToken = signJWT(session, '15m')

            return { token: accessToken, error: '' }
        },
    })
