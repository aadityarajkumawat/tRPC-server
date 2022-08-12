import Input from '@components/Input'
import { Spinner } from '@components/Spinner'
import { globalContext } from '@pages/_app'
import { User } from '@prisma/client'
import { trpc } from '@utils/trpc'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, {
    HTMLAttributes,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react'
import { Button } from '../../components/Button'

type FormUser = Omit<User, 'userId'>

export interface ExtraButtonProps extends HTMLAttributes<HTMLButtonElement> {
    children?: ReactNode
}

type MutateAsyncFn = ReturnType<typeof trpc.useMutation>['mutateAsync']
// type MutateAsyncResult = ReturnType<MutateAsyncFn>
type MutateAsyncParams = Parameters<MutateAsyncFn>
type MutateAsyncData = MutateAsyncParams[0]

async function safeMutator(
    mutator: MutateAsyncFn,
    payload: MutateAsyncData,
    setError: (e: string) => void,
) {
    try {
        const res = await mutator(payload)
        if (res.error) {
            throw new Error(res.error.type)
        }

        return res
    } catch (e: any) {
        console.log(e)
        setError(e.message)
    }
}

function Login() {
    const [user, setUser] = useState<FormUser>({ email: '', password: '' })
    const [error, setError] = useState<string>('')
    const store = useContext(globalContext)

    const router = useRouter()

    const loginMutation = trpc.useMutation(['auth.login'])
    const userQuery = trpc.useQuery(['auth.user'], { retry: false })

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        setUser((u) => ({ ...u, [name]: value }))
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const res = await safeMutator(loginMutation.mutateAsync, user, setError)
        if (!res) return

        store.setAuthToken(res?.token ?? '')
    }

    // console.log(loginMutation)

    useEffect(() => {
        const data = userQuery.data
        if (data && data.user) {
            console.log('cool')

            router.push('/app')
        }
    }, [userQuery.data, loginMutation.isSuccess])

    if (userQuery.isLoading) {
        return (
            <div className='w-full h-full flex justify-center items-center flex-col'>
                <Spinner />
                <p className='mt-2'>Loading...</p>
            </div>
        )
    }

    return (
        <div className='w-full h-full flex justify-center items-center flex-col'>
            <h1 className='text-2xl text-center mb-3'>login</h1>
            <form className='flex flex-col' onSubmit={onSubmit}>
                <Input
                    name='email'
                    type='email'
                    placeholder='email'
                    autoComplete='off'
                    value={user.email}
                    onChange={onChange}
                    error={error}
                    mb={3}
                />

                <Input
                    name='password'
                    type='password'
                    placeholder='password'
                    value={user.password}
                    onChange={onChange}
                    error={error}
                    mb={3}
                />

                <Button>login</Button>
            </form>

            <p className='mt-2'>
                new user?{' '}
                <Link href='/auth/register'>
                    <span className='text-blue-500 cursor-pointer'>
                        register
                    </span>
                </Link>
            </p>
        </div>
    )
}

export default Login
