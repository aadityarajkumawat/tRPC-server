import { AccessTokenPayload } from '@server/middlewares/deserializeUser'
import { signJWT } from '@utils/jwt'

export function signAccessToken(payload: AccessTokenPayload) {
    return signJWT(payload, '15m')
}
