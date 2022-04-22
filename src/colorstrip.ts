// A ColorStrip, created from a ColorStripConfig is a set of Quad-s ; each Quad
// consisting of two Side-s.

export interface ColorStripConfig {
    stripCount: number
    // between 0 and 1 -- set the amount of diversity of color -- 0.3 is a good start
    diversityRatio: number
    // theme -- background selection and luminosity/saturation adjustment
    // Note: a decent handling of theme would require taking saturation into
    // account whene generating the color palette
    theme: "light" | "pastelle" | "twilight" | "dark"
}

export let themeArray: ColorStripConfig["theme"][] = ["light", "pastelle", "twilight", "dark"]

// A side consist of two values with their first and second degree derivatives:
// - theta (tx, tv, ta)
// - sigma (sx, sv, sa)
//
// Both values are angles in radians
class Side {
    // theta position, between 0 and 2pi
    tx: number
    // theta speed
    tv: number
    // theta acceleration
    ta: number
    // sigma position, between -pi/12 and pi/12 radians (30°)
    sx: number
    // sigma speed
    sv: number
    // sigma acceleration
    sa: number

    constructor(data: Partial<Side> = {}) {
        Object.assign(this, data)
    }

    randomUpdate(speedFactor: number) {
        this.ta += (Math.random() - 0.5) * 0.001
        this.ta *= 0.999
        this.tv += this.ta
        this.tv *= 0.2
        this.tx += this.tv * speedFactor
        this.tx = (this.tx + 2 * Math.PI) % (2 * Math.PI)

        this.sa += (Math.random() - 0.5) * 0.001
        this.sa *= 0.999
        this.sv += this.sa
        this.sv *= 0.04
        this.sx += this.sv * speedFactor
        this.sx = clamp(this.sx, -Math.PI / 24, Math.PI / 24)
    }

    trigonometry() {
        let thetax = this.tx + this.sx
        let thetay = this.tx - this.sx
        return [cossin(thetax), cossin(thetay)]
    }
}

// A Quad is a quadrilateral. A four-sided polygon.
// Quads consist of two Side-s and one color. In turn, each side only consist of
// angles.
class Quad {
    a: Side
    b: Side
    color: string

    constructor(data: Partial<Quad> = {}) {
        Object.assign(this, data)
    }

    trigonometry() {
        return [...this.a.trigonometry(), ...this.b.trigonometry()]
    }
}

/**
 * hslToHex
 * @param hue hue (0-360)
 * @param sat saturation (0-1)
 * @param lum luminosity (0-1)
 * @returns an hexadecimal CSS color
 */
let hslToHex = (hue, sat, lum) => {
    // https://stackoverflow.com/a/44134328/9878263
    let a = sat * Math.min(lum, 1 - lum)
    let f = (n) => {
        let k = (n + hue / 30) % 12
        let color = lum - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0") // convert to Hex and prefix "0" if needed
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

let createRandomSide = (other?: Side): Side => {
    let tx = Math.random() * 2 * Math.PI // theta position
    if (other) {
        tx = (other.tx + (1 + 0.5 + Math.random() / 2) * Math.PI) % Math.PI
    }

    return new Side({
        tx,
        tv: 0, // theta speed
        ta: 0, // theta acceleration
        sx: ((2 * Math.random() - 1) * Math.PI) / 6, // sigma position
        sv: 0, // sigma speed
        sa: 0, // sigma acceleration
    })
}

export let createColorStrip = (canvas: HTMLCanvasElement, radius: number, config: ColorStripConfig) => {
    let ctx = canvas.getContext("2d")

    // To sample a set of harmonious colors, the diversityRatio can be
    // tweaked up (more diversity) or down (colors with more similar hues)
    //
    // To sample colors looking different from one another, the luminosity
    // is alternatively low and high
    let baseHue = Math.floor(360 * Math.random())

    // A hueBoost value above one increases the amplitude of the variation
    // around the baseHue. This helps diversify the color when the hue
    // is over-represented in the chromatic circle.
    let hueBoost = 1
    console.log({ baseHue })
    if (80 <= baseHue && baseHue < 140) {
        // low green
        hueBoost = 2.4
        console.log("**low green**")
    } else if (140 <= baseHue && baseHue < 180) {
        // high green
        hueBoost = 2.2
        console.log("**high green**")
    } else if (180 <= baseHue && baseHue < 260) {
        // blue
        hueBoost = 2
        console.log("**blue**")
    } else if (300 <= baseHue) {
        // red
        hueBoost = 1.8
        console.log("**red**")
    }

    let baseLuminosity: number
    let lumSpacing: number
    let saturation: number
    let backgroundColor: string
    if (config.theme === "dark") {
        baseLuminosity = 0.1 + 0.2 * Math.random()
        lumSpacing = 0.06
        saturation = 0.4
        backgroundColor = "#000"
    } else if (config.theme === "twilight") {
        baseLuminosity = 0.15 + 0.2 * Math.random()
        lumSpacing = 0.06
        saturation = 1
        backgroundColor = "#111"
    } else if (config.theme === "light") {
        baseLuminosity = 0.45
        lumSpacing = 0.04
        saturation = 1
        backgroundColor = "#FFF"
    } else {
        // pastelle
        baseLuminosity = 0.6
        lumSpacing = 0.1
        saturation = 0.7
        backgroundColor = "#FFF"
    }

    let clear = () => {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    let center = () => [canvas.width / 2, canvas.height / 2]

    let fillPath = (pointArray: [number, number][]) => {
        let region = new Path2D()

        region.moveTo(...pointArray[0])
        pointArray.slice(1).forEach((point) => {
            region.lineTo(...point)
        })
        region.closePath()
        ctx.fill(region, "evenodd")
    }

    clear()

    let luminosityArray = [baseLuminosity + lumSpacing, baseLuminosity - lumSpacing]
    let quadArray = Array.from({ length: config.stripCount }).map((_, k) => {
        let relativeK = k - Math.floor(config.stripCount / 2)
        let hue = (baseHue + (hueBoost * config.diversityRatio * 360 * relativeK) / config.stripCount) % 360
        let color = hslToHex(hue, saturation, luminosityArray[k % 2])
        console.log("color", color, hue)

        let a = createRandomSide()

        return new Quad({
            a,
            b: createRandomSide(a),
            color,
        })
    })

    let me = {
        update: (speedFactor: number) => {
            quadArray.forEach((quad) => {
                quad.a.randomUpdate(speedFactor)
                quad.b.randomUpdate(speedFactor)
            })
        },
        draw: () => {
            clear()

            let c = center()
            quadArray.forEach((quad) => {
                ctx.fillStyle = quad.color
                fillPath(
                    quad.trigonometry().map((point) => {
                        return add(scale(point, radius), c) as [number, number]
                    }),
                )
            })
        },
        setRadius: (radiusValue: number) => {
            radius = radiusValue
        },
    }

    return me
}

export type ColorStrip = ReturnType<typeof createColorStrip>

let cossin = (theta: number): [number, number] => {
    return [Math.cos(theta), Math.sin(theta)]
}

let add = (u: number[], v: number[]) => {
    return u.map((x, k) => x + v[k])
}

let scale = (u: number[], a: number) => {
    return u.map((x) => a * x)
}

let clamp = (x, small, big) => {
    return Math.max(Math.min(x, big), small)
}
