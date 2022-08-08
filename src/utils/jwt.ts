import jwt from 'jsonwebtoken'

const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgH+1sS2TagodiyL6HXExbeXvvknOz2V91IKLldtZgNPpUMLoPnyu
AZmL8eCDZzw8rgbk5XLapZlfp4Dn+LwzZ5idmeQg+y3grE70OMC1qqY2xp4pMOL7
SqcVHL6yJlGjOUBmyB7A+Sh44YykpKFAZcfRVNNefImUI0ZZb8PFBUnDAgMBAAEC
gYBjsxl15h6jdPr5PF+dzaPpHSfmAQEiT4CGxaghDReo1/2Hm72kokd3cqxKxOrk
OM73bNy/tHgRa36eAPrLGipl79fhpDB+yIhWTeq3/tko2+rf/DKsMtM6l0W1kGqp
2Ba8wY9q5NVb4txmRgG3f1Lapnpz0fGTgsnupbNTCd7weQJBAPYRJapxRVUMBWvW
tPhGmkOc2O9fWUqhx5GTnQUKCcSgzpsrRYIqXFFwUaSwx5m0gBcCz7dTDYpFlUdT
p4XqMK0CQQCE3XFaGjuZrPjjYO40pCZDc9gslzVug8TqxhYfSraGlX+HX1ymJ/5L
URoBAiNURWwgoPhHHFPnF/i7/2p42QIvAkEAj2lm/nON6QdckYFNb/YWKpnbhYeY
zvqDCcFynmE/WC4wvBb4J+jwbTZ9HvM5Icglb0PgNARfu9raKfwDgvT+8QJBAIFk
6+yVGbA7LZS7pKDtsDoGyuP6StYbTB5c1dSZvZLqa22aKK/EyTnufQW4YFHE3l4U
hlcytl+cD+h/AeE5bo8CQBzSicn+26DFcM/mQI4PQcs3NfvSNwQeay0DP0uPp3Jy
B9RH1KP/EIap+Uq78Cn8FLXnA6Fcm3t2AZg5UrWrrVo=
-----END RSA PRIVATE KEY-----`

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgH+1sS2TagodiyL6HXExbeXvvknO
z2V91IKLldtZgNPpUMLoPnyuAZmL8eCDZzw8rgbk5XLapZlfp4Dn+LwzZ5idmeQg
+y3grE70OMC1qqY2xp4pMOL7SqcVHL6yJlGjOUBmyB7A+Sh44YykpKFAZcfRVNNe
fImUI0ZZb8PFBUnDAgMBAAE=
-----END PUBLIC KEY-----`

export function signJWT(data: object, expiresIn: number | string) {
    return jwt.sign(data, PRIVATE_KEY, { expiresIn, algorithm: 'RS256' })
}

export function verifyJWT<T>(token: string) {
    try {
        const decoded = jwt.verify(token, PUBLIC_KEY) as T
        return { payload: decoded, expired: false }
    } catch (error: any) {
        return { payload: null, expired: error.message.includes('jwt expired') }
    }
}
