import '../../styles/globals.css'
import type { AppProps } from 'next/app'
import { withTRPC } from '@trpc/next'
import { AppRouter } from '@server/router'

import { createContext, ReactNode, useReducer } from 'react'

type Maybe<T> = T | null

const globalState = {
    auth: {
        accessToken: null as Maybe<string>,
    },
    setAuthToken: (accessToken: string) => {},
    isAuth: () => {},
}

type GlobalState = typeof globalState
type Action = { type: 'set_auth_token'; payload: string }

export const globalContext = createContext(globalState)

function globalReducer(state: GlobalState, action: Action): GlobalState {
    switch (action.type) {
        case 'set_auth_token':
            state.auth.accessToken = action.payload
            return state
        default:
            return state
    }
}

function GlobalContext(props: { children: ReactNode }) {
    const initialState = globalState

    const [state, dispatch] = useReducer(globalReducer, initialState)

    function setAuthToken(accessToken: string) {
        dispatch({ type: 'set_auth_token', payload: accessToken })
    }

    function isAuth() {
        return !!state.auth.accessToken
    }

    return (
        <globalContext.Provider value={{ ...state, setAuthToken, isAuth }}>
            {props.children}
        </globalContext.Provider>
    )
}

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <GlobalContext>
            <Component {...pageProps} />
        </GlobalContext>
    )
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
    ssr: false,
})(MyApp)
