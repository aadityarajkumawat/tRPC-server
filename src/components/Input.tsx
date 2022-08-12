import { InputHTMLAttributes } from 'react'
import { getMargins } from '../helpers/getMargins'
import { RenderIf } from './RenderIf'

interface ExtraInputProps extends InputHTMLAttributes<HTMLInputElement> {
    mt?: number
    ml?: number
    mb?: number
    mr?: number
    my?: number
    mx?: number

    error?: string
}

function Input(props: ExtraInputProps) {
    const margins = getMargins(props)
    const { error, mt, ml, mr, mb, my, mx, ...inputProps } = props
    return (
        <>
            <RenderIf if={!!error}>
                <p className='text-red-500'>* {error}</p>
            </RenderIf>
            <input
                className={`w-72 border-zinc-400 border-2 rounded-md py-1 px-4 outline-none ${margins}`}
                {...inputProps}
            />
        </>
    )
}

export default Input
