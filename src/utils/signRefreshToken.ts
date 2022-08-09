import { RefreshTokenPayload } from '@server/middlewares/deserializeUser'
import { signJWT } from '@utils/jwt'

export function signRefreshToken(payload: RefreshTokenPayload) {
    return signJWT(payload, '1y')
}
