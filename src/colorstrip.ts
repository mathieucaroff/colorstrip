// A ColorStrip, created from a ColorStripConfig is a set of Quad-s ; each Quad
// consisting of two Side-s.

import { createPalette, PaletteConfig } from "./lib/palette"
import { createStripCircle } from "./stripCircle"

type RandomFunction = () => number

export interface ColorStripConfig {
    stripCount: number
    // between 0 and 1 -- set the amount of diversity of color -- 0.3 is a good start
    diversityRatio: PaletteConfig["diversityRatio"]
    // theme -- background selection and luminosity/saturation adjustment
    // Note: a decent handling of theme would require taking saturation into
    // account whene generating the color palette
    theme: PaletteConfig["theme"]
    // random -- the source of randomness used for the strip and palette generation,
    // a function which produces numbers between 0 included and 1 excluded
    random: RandomFunction
}

export let createColorStrip = (canvas: HTMLCanvasElement, config: ColorStripConfig) => {
    let ctx = canvas.getContext("2d")!

    let { backgroundColor, colorArray, baseHue, hueComment } = createPalette({
        colorCount: config.stripCount,
        diversityRatio: config.diversityRatio,
        theme: config.theme,
        random: config.random,
    })

    console.log("hue", baseHue, `(${hueComment})`)
    console.log("colors", colorArray)

    let stripCircle = createStripCircle(config)

    let clear = () => {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    let fillPath = (pointArray: [number, number][]) => {
        let region = new Path2D()

        region.moveTo(...pointArray[0])
        pointArray.slice(1).forEach((point) => {
            region.lineTo(...point)
        })
        region.closePath()
        ctx.fill(region)
    }

    clear()

    let me = {
        update: (speedFactor: number) => {
            stripCircle.update(speedFactor)
        },
        draw: (radius: number) => {
            clear()

            stripCircle
                .getPathList([canvas.width / 2, canvas.height / 2], radius)
                .forEach((path, index) => {
                    ctx.fillStyle = colorArray[index]
                    fillPath(path)
                })
        },
    }

    return me
}

export type ColorStrip = ReturnType<typeof createColorStrip>
