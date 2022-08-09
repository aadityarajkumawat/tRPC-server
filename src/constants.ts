export const __is_prod__ = process.env.NODE_ENV === 'production'

export const REFRESH_TOKEN = 'refreshToken'
export const ONE_YEAR = 1000 * 60 * 60 * 24 * 30 * 12

export class AuthError extends Error {
    code: number

    constructor(msg: string, code: number) {
        super(msg)
        this.message = msg
        this.code = code
    }
}

// error codes
export const ERROR_CODES = {
    SESSION_NOT_FOUND: 100,
    INVALID_CREDENTIALS: 101,
    ACCESS_TOKEN_NOT_FOUND: 102,
    REFRESH_TOKEN_NOT_FOUND: 103,
    INTERNAL_SERVER_ERROR: 104,
} as const

// auth codes
export const AUTH_CODES = {} as const
