import { createColorStrip } from "./colorstrip"
import { Theme, themeArray } from "./lib/palette"
import { resolveSearchAndHash } from "./lib/urlParameter"

interface MainConfig {
    diversityRatio: number
    radiusFactor: number
    secondaryRadiusFactor: number
    seed: number
    paletteSeed: number
    stripCircleSeed: number
    speedFactor: number
    stripCount: number
    theme: Theme
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

    let strip
    let setupColorStrip = () => {
        strip = createColorStrip(canvas, {
            ...config,
            baseHue: config.hue,
        })
    }
    setupColorStrip()

    window.addEventListener("hashchange", () => {
        location.reload()
    })

    window.addEventListener("resize", () => {
        resizeCanvas()
    })

    let lastTime = performance.now()
    let animate = () => {
        let time = performance.now()
        strip.update((time - lastTime) * 0.02)
        lastTime = time

        let baseFactor = config.radiusFactor
        let secondaryFactor = config.secondaryRadiusFactor
        let factor =
            (Math.cos(time / 1000 / 2) + 1) * (secondaryFactor - baseFactor) + config.radiusFactor

        let radius = (canvas.width ** 2 + canvas.height ** 2) ** 0.5 * 0.55 * factor
        strip.draw(radius)
    }

    let render = () => {
        requestAnimationFrame(render)
        animate()
    }

    render()
}

main()
