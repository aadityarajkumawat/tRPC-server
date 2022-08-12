import { ExtraButtonProps } from '../pages/auth/login'

export function Button(props: ExtraButtonProps) {
    return (
        <button className='bg-gray-900 w-72 rounded-md py-2 px-4 text-white'>
            {props.children}
        </button>
    )
}
