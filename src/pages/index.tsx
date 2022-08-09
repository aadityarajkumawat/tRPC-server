import { trpc } from '@utils/trpc'
import type { NextPage } from 'next'
import Image from 'next/image'
import { CSSProperties, useState } from 'react'

const Home: NextPage = () => {
    const [form, setForm] = useState({ email: '', password: '' })
    const { mutate } = trpc.useMutation('auth.login')
    return (
        <div style={styles.container}>
            <div style={styles.baseContainer}>
                <Image
                    src='/meal.png'
                    width={imageSize}
                    height={imageSize}
                    style={{ borderRadius: 10 }}
                />
            </div>
            <h1
                style={{
                    textAlign: 'center',
                    marginBottom: 0,
                    color: 'rgb(86, 86, 86)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
            >
                Welcome to the MealDash API
            </h1>
            <p
                style={{
                    textAlign: 'center',
                    fontSize: 20,
                    color: 'rgba(86, 86, 86, 0.9)',
                }}
            >
                It is a tRPC API based on NextJS made in Typescript and NodeJS
            </p>

            {/* <form
                onSubmit={(e) => {
                    e.preventDefault()
                    mutate({ ...form })
                }}
            >
                <input
                    type='email'
                    value={form.email}
                    name='email'
                    onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                    }
                />
                <input
                    type='text'
                    value={form.password}
                    name='password'
                    onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                    }
                />
                <input type='submit' name='login' />
            </form> */}
        </div>
    )
}

const styles: Record<string, CSSProperties> = {
    container: {
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
    },
    baseContainer: {
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '50px',
        borderRadius: 10,
    },
}

const imageSize = '150px'

export default Home
