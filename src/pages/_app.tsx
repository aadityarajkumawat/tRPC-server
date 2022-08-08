import '../../styles/globals.css'
import type { AppProps } from 'next/app'
import { withTRPC } from '@trpc/next'
import { AppRouter } from '@server/router'

function MyApp({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />
}

export default withTRPC<AppRouter>({
    config({ ctx }) {
        const url = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}/api/trpc`
            : 'http://localhost:3000/api/trpc'

        return {
            url,
            headers() {
                return { cookie: ctx?.req?.headers.cookie }
            },
        }
    },
    ssr: true,
})(MyApp)
