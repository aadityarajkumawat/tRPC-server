import { ReactNode } from 'react'

export function RenderIf(props: { if: boolean; children: ReactNode }) {
    return props.if ? <>{props.children}</> : null
}
