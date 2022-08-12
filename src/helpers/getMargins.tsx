interface Margins {
    mt?: number
    ml?: number
    mb?: number
    mr?: number
    my?: number
    mx?: number
}

export const getMargins = (props: Margins) => {
    let classStyle = ''

    classStyle += `mt-${props?.mt ?? 0} `
    classStyle += `ml-${props?.ml ?? 0} `
    classStyle += `mb-${props?.mb ?? 0} `
    classStyle += `mr-${props?.mr ?? 0} `
    classStyle += `my-${props?.my ?? 0} `
    classStyle += `mx-${props?.mx ?? 0} `

    return classStyle
}
