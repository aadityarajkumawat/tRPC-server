import type { NextPage } from 'next'
import Image from 'next/image'
import { CSSProperties } from 'react'

const Home: NextPage = () => {
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
