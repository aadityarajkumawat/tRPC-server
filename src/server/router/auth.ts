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
            } catch (error: any) {
                if (error instanceof AuthError) {
                    return {
                        token: null,
                        error: { type: error.message, code: error.code },
                    }
                } else {
                    return {
                        token: null,
                        error: {
                            type: `INTERNAL_SERVER_ERROR: ${error.message}`,
                            code: ERROR_CODES.INTERNAL_SERVER_ERROR,
                        },
                    }
                }
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
            const req = ctx.req
            const authTokenName = 'Authorization'
            const tokenIdx = req.rawHeaders.findIndex(
                (h) => h === authTokenName,
            )

            const accessToken = req.rawHeaders[tokenIdx + 1]

            if (!accessToken) {
            }

            const { payload } = verifyJWT<AccessTokenPayload>(accessToken)

            console.log(
                `session is invalid:${JSON.stringify(payload)}:${JSON.stringify(
                    jwt.decode(accessToken),
                )}:${accessToken}`,
            )

            if (!user)
                return {
                    user,
                    error: `session is invalid:${JSON.stringify(
                        payload,
                    )}:${JSON.stringify(
                        jwt.decode(accessToken),
                    )}:${accessToken}`,
                }
            const userId = user.userId
            const userDetails = await ctx.db.user.findFirst({
                where: { userId },
            })
            return { user: userDetails, error: null }
        },
    })
    .query('logout', {
        async resolve({ ctx: { req, user, sessionStore } }) {
            if (!user || !user.payload) return { success: true }
            const sessionId = user.payload.sessionId

            await sessionStore.destroySession(sessionId)

            req.setCookie(REFRESH_TOKEN, '', 0)
            return { success: true }
        },
    })
    .query('refresh_token', {
        async resolve({ ctx: { req, sessionStore } }) {
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

            const session = await sessionStore.sessionBySessionId(sessionId)

            if (!session) return { token: '', error: 'session not found' }

            const accessToken = signJWT(session, '15m')

            return { token: accessToken, error: '' }
        },
    })
