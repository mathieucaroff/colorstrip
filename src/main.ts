import { ColorStripConfig, createColorStrip } from "./colorstrip"
import { themeArray } from "./lib/palette"
import { resolveSearchAndHash } from "./lib/urlParameter"

interface MainConfig extends ColorStripConfig {
    seed: number
    hue: number | undefined
}

function randomSeed() {
    return Math.floor(Math.random() * 2 ** 32)
}

function getConfig() {
    return resolveSearchAndHash<MainConfig>(location, {
        diversityRatio: () => 0.25,
        radiusFactor: () => 1,
        secondaryRadiusFactor: ({ radiusFactor }) => radiusFactor(),
        speedFactor: () => 1,
        seed: () => randomSeed(),
        paletteSeed: ({ seed }) => seed(),
        stripCircleSeed: ({ seed }) => seed(),
        stripCount: () => 10,
        theme: () => "pastelle",
        hue: () => undefined,
    })
}

function main() {
    console.log(
        "theme",
        themeArray.map((t) => "#" + t),
    )

    const config = getConfig()

    console.log("seed", config.seed)

    console.log("config", config)

    let canvas = document.querySelector("canvas")!
    let resizeCanvas = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }
    resizeCanvas()

    let strip = createColorStrip(canvas, {
        ...config,
        baseHue: config.hue,
    })

    window.addEventListener("hashchange", () => {
        location.reload()
    })

    window.addEventListener("resize", () => {
        resizeCanvas()
    })

    strip.play()
}

main()
