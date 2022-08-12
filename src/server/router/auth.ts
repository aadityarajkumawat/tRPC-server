import { AuthError, ERROR_CODES, ONE_YEAR, REFRESH_TOKEN } from '@constants'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import {
    AccessTokenPayload,
    RefreshTokenPayload,
} from '@server/middlewares/deserializeUser'
import { createRouter } from '@server/tools/createRouter'
import { TRPCError } from '@trpc/server'
import { signJWT, verifyJWT } from '@utils/jwt'
import { signAccessToken } from '@utils/signAccessToken'
import { signRefreshToken } from '@utils/signRefreshToken'
import { v4 } from 'uuid'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import cors from 'cors'

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
            cors({ origin: '*' })
            try {
                const { db, req, user: userSession, sessionStore } = ctx
                const { email, password } = input

                const { createSession, sessionBySessionId, destroySession } =
                    sessionStore

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

                    const session = await sessionBySessionId(sessionId)
                    if (!session) {
                        throw new AuthError(
                            'Session not found',
                            ERROR_CODES.SESSION_NOT_FOUND,
                        )
                    }

                    await destroySession(sessionId)
                    req.setCookie(REFRESH_TOKEN, '', 0)

                    // this is where we invalidate the refresh token
                    // by incrementing the tokenVersion
                    await db.authToken.update({
                        where: { userId: session.userId },
                        data: { tokenVersion: { increment: 1 } },
                    })
                }

                const user = await db.user.findFirst({ where: { email } })
                if (!user) {
                    throw new AuthError(
                        'Email or Password is invalid',
                        ERROR_CODES.INVALID_CREDENTIALS,
                    )
                }

                // if the user has a token version, then, we update it,
                // else we create a new one and user that version to encode
                // refresh token
                const authToken = await db.authToken.update({
                    where: { userId: user.userId },
                    data: { tokenVersion: { increment: 1 } },
                })

                const passwordIsValid = password === user.password

                if (!passwordIsValid) {
                    throw new AuthError(
                        'Email or Password is invalid',
                        ERROR_CODES.INVALID_CREDENTIALS,
                    )
                }

                // create a new session for the user
                const session = await createSession(
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
            } catch (e: any) {
                if (e instanceof AuthError) {
                    let code = 'INTERNAL_SERVER_ERROR' as TRPCError['code']

                    if (e.code === ERROR_CODES.INVALID_CREDENTIALS) {
                        code = 'UNAUTHORIZED'
                    } else if (e.code === ERROR_CODES.SESSION_NOT_FOUND) {
                        code = 'UNAUTHORIZED'
                    }

                    throw new TRPCError({
                        code: code,
                        message: e.message,
                    })
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Something went wrong',
                })
            }
        },
    })
    .mutation('register', {
        input: registerValidator,
        output: authOutput,
        async resolve({ input, ctx }) {
            try {
                const { req, user: userSession, db, sessionStore } = ctx

                const { sessionBySessionId, destroySession, createSession } =
                    sessionStore

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

                    const session = await sessionBySessionId(sessionId)
                    if (!session) throw new Error('Session not found, HERE')

                    await destroySession(sessionId)
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

                const session = await createSession(
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

            if (!user) {
                throw new AuthError(
                    'Session not found',
                    ERROR_CODES.SESSION_NOT_FOUND,
                )
            }

            try {
                const userId = user.userId
                const userDetails = await ctx.db.user.findFirst({
                    where: { userId },
                })

                return { user: userDetails, error: null }
            } catch (e) {
                if (e instanceof AuthError) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: e.message,
                    })
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Something went wrong',
                })
            }
        },
    })
    .mutation('logout', {
        output: z.object({
            success: z.boolean(),
            error: z.string().nullable(),
        }),
        async resolve({ ctx: { req, user, sessionStore } }) {
            if (!user || !user.payload) return { success: true, error: null }
            const sessionId = user.payload.sessionId

            try {
                await sessionStore.destroySession(sessionId)

                req.setCookie(REFRESH_TOKEN, '', 0)
                return { success: true, error: null }
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: '',
                })
            }
        },
    })
    .query('refresh_token', {
        async resolve({ ctx: { req, sessionStore } }) {
            const refreshToken = req.cookies.refreshToken

            console.log('/refresh_token route', req.cookies, req.headers)

            try {
                if (!refreshToken) throw new Error('refresh token not found')

                const { payload } = verifyJWT<RefreshTokenPayload>(refreshToken)

                if (!payload)
                    throw new Error('refresh token expired, please login again')

                const sessionId = payload.sessionId

                const session = await sessionStore.sessionBySessionId(sessionId)

                if (!session) throw new Error('session not found')

                const accessToken = signJWT(session, '15m')

                return { token: accessToken, error: '' }
            } catch (error: any) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error.message,
                })
            }
        },
    })
