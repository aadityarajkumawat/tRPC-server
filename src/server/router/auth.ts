import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { createRouter } from '@server/tools/createRouter'
import { TRPCError } from '@trpc/server'
import { signJWT } from '@utils/jwt'
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
    user: registerValidator.nullish(),
    error: z.string().nullish(),
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

                const accessToken = signJWT(
                    { email, userId: user.userId },
                    '20s',
                )

                req.setCookie('accessToken', accessToken, 1000 * 20)

                return { user, error: null }
            } catch (error: any) {
                return { user: null, error: error.message }
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

                const accessToken = signJWT({ email, userId }, '20s')

                req.setCookie('accessToken', accessToken, 1000 * 20)

                return { user: registeredUser, error: null }
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
        resolve({ ctx }) {
            return ctx.req.user
        },
    })
    .query('logout', {
        resolve({ ctx: { req } }) {
            req.setCookie('accessToken', '', 0)
            return { success: true }
        },
    })
