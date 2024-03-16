// A ColorStrip, created from a ColorStripConfig is a set of Quad-s ; each Quad
// consisting of two Side-s.

import { createPalette, PaletteConfig, Theme } from "./lib/palette"
import { seedRandom } from "./lib/seedRandom"
import { createStripCircle } from "./stripCircle"

export interface ColorStripConfig {
    stripCount: number
    speedFactor: number
    // between 0 and 1 -- set the amount of diversity of color -- 0.3 is a good start
    diversityRatio: PaletteConfig["diversityRatio"]
    // theme -- background selection and luminosity/saturation adjustment
    // Note: a decent handling of theme would require taking saturation into
    // account whene generating the color palette
    theme: Theme
    // seeds -- the source of randomness used for the strip and palette generation,
    // a function which produces numbers between 0 included and 1 excluded
    stripCircleSeed: number
    paletteSeed: number
    // circle zoom factor
    radiusFactor: number
    secondaryRadiusFactor: number
    // baseHue -- between 0 and 360
    baseHue?: number
}

export let createColorStrip = (canvas: HTMLCanvasElement, config: ColorStripConfig) => {
    let ctx = canvas.getContext("2d")!

    let { backgroundColor, colorArray, baseHue, hueComment } = createPalette({
        colorCount: config.stripCount,
        diversityRatio: config.diversityRatio,
        theme: config.theme,
        random: seedRandom(config.paletteSeed),
        baseHue: config.baseHue,
    })

    console.log("hue", baseHue, `(${hueComment})`)
    console.log("colors", colorArray)

    let stripCircle = createStripCircle({ ...config, random: seedRandom(config.stripCircleSeed) })

    let clearCanvas = () => {
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

    clearCanvas()

    let playing = false
    let lastTime = performance.now()
    const animate = () => {
        if (playing) {
            let time = performance.now()
            me.update((time - lastTime) * 0.02)
            lastTime = time
            me.draw(time)
            requestAnimationFrame(animate)
        }
    }

    let me = {
        update: (timeIncrement: number) => {
            stripCircle.update(timeIncrement)
        },
        draw: (time: number, radius?: number) => {
            if (radius === undefined) {
                let factor = config.radiusFactor
                if (config.secondaryRadiusFactor !== config.radiusFactor){
                    let baseFactor = config.radiusFactor
                    let secondaryFactor = config.secondaryRadiusFactor
                    if (secondaryFactor < baseFactor) {
                        [baseFactor, secondaryFactor] = [secondaryFactor, baseFactor]
                    }
                    factor = (Math.cos(time / 1000 / 2) + 1) * (secondaryFactor - baseFactor) + baseFactor
                }
                radius = (canvas.width ** 2 + canvas.height ** 2) ** 0.5 * 0.55 * factor
            }

            clearCanvas()

            stripCircle
                .getPathList([canvas.width / 2, canvas.height / 2], radius)
                .forEach((path, index) => {
                    ctx.fillStyle = colorArray[index]
                    fillPath(path)
                })
        },
        play: () => {
            if (!playing) {
                playing = true
                animate()
            }
        },
        pause: () => {
            playing = false
        },
    }

    return me
}

export type ColorStrip = ReturnType<typeof createColorStrip>
