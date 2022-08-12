import { globalContext } from '@pages/_app'
import { useContext, useEffect, useState } from 'react'
import { trpc } from '@utils/trpc'
import { useRouter } from 'next/router'
import { Button } from '@components/Button'
import { Spinner } from '@components/Spinner'

function App() {
    const store = useContext(globalContext)
    const router = useRouter()
    const [loggingOut, setLogginOut] = useState(false)
    const refreshUser = trpc.useQuery(['auth.refresh_token'])
    const logoutQuery = trpc.useQuery(['auth.logout'], { enabled: loggingOut })

    console.log({ logoutQuery })

    useEffect(() => {
        async function ae() {
            const data = refreshUser.data

            if ((!refreshUser.isLoading && !data) || (data && !data.token)) {
                router.push('/auth/login')
            }

            if (!refreshUser.isLoading && data) {
                store.setAuthToken(data.token)
            }
        }

        ae()
    }, [refreshUser.data])

    if (refreshUser.isLoading) {
        return (
            <div className='w-full h-full flex justify-center items-center flex-col'>
                <Spinner />
                <p className='mt-2'>Loading...</p>
            </div>
        )
    }

    return (
        <div>
            app
            <Button onClick={() => setLogginOut(true)}>logout</Button>
        </div>
    )
}

export default App
