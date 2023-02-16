import { indirectResolve, InfoObject } from "./indirectResolver"

export function ensureSpacelessURL(location: Location) {
    let spaceLessURL = location.href.replace(/ |%20/g, "")

    if (location.href !== spaceLessURL) {
        location.replace(spaceLessURL)
    }
}

function addHash<T>(location: Location, infoObject: InfoObject<T>) {
    // populate config with keys and key-value pairs from the URL
    location.hash
        .split("#")
        .slice(1)
        .forEach((piece) => {
            let key: string
            let valueList: string[]
            let value: any
            if (piece.includes("=")) {
                ;[key, ...valueList] = piece.split("=")
                value = valueList.join("=")
                if (!isNaN(value)) {
                    value = +value
                }
            } else {
                key = piece
                value = true
            }

            infoObject[key] = () => value
        })
}

export function resolveHash<T>(location: Location, defaultConfig: InfoObject<T>) {
    let infoObject = { ...defaultConfig }

    addHash(location, infoObject)

    return indirectResolve<T>(infoObject)
}

function addSearch<T>(location: Location, infoObject: InfoObject<T>) {
    let search = new URLSearchParams(location.search)

    ;[...search.entries()].forEach(([key, value]: [string, any]) => {
        if (value === "") {
            value = true
        } else if (!isNaN(value)) {
            value = +value
        }
        infoObject[key] = () => value
    })
}

export function resolveSearch<T>(location: Location, defaultConfig: InfoObject<T>) {
    let infoObject = { ...defaultConfig }

    addSearch(location, infoObject)

    return indirectResolve<T>(infoObject)
}

export function resolveSearchAndHash<T>(location: Location, defaultConfig: InfoObject<T>) {
    let infoObject = { ...defaultConfig }

    addSearch(location, infoObject)
    addHash(location, infoObject)

    return indirectResolve<T>(infoObject)
}
