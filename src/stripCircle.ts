// A StripCircle, created from a StripCircleConfig is a set of Quad-s ; each Quad
// consisting of two Side-s.

type RandomFunction = () => number

export interface StripCircleParam {
    random: RandomFunction
    stripCount: number
    speedFactor: number
}

// A side consist of two values with their first and second degree derivatives:
// - theta (tx, tv, ta)
// - sigma (sx, sv, sa)
//
// Both values are angles in radians
class Side {
    // speedFactor
    speedFactor: number

    // theta position, between 0 and 2pi
    tx: number
    // theta speed
    tv: number
    // theta acceleration
    ta: number
    // sigma position, between -pi/24 and pi/24 radians (15°)
    sx: number
    // sigma speed
    sv: number
    // sigma acceleration
    sa: number

    constructor(data: Partial<Side> = {}) {
        Object.assign(this, data)
    }

    randomUpdate(random: RandomFunction, timeIncrement: number) {
        this.ta += (random() - 0.5) * 0.001 * this.speedFactor
        this.ta *= 0.999
        this.tv += this.ta
        this.tv *= 0.2
        this.tx += this.tv * timeIncrement
        this.tx = (this.tx + 2 * Math.PI) % (2 * Math.PI)

        this.sa += (random() - 0.5) * 0.001 * this.speedFactor
        this.sa *= 0.999
        this.sv += this.sa
        this.sv *= 0.04
        this.sx += this.sv * timeIncrement
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

    constructor(data: Partial<Quad> = {}) {
        Object.assign(this, data)
    }

    trigonometry() {
        return [...this.a.trigonometry(), ...this.b.trigonometry()]
    }
}

let createRandomSide = (random: RandomFunction, speedFactor: number, other?: Side): Side => {
    let tx = random() * 2 * Math.PI // theta position
    if (other) {
        tx = (other.tx + (1 + 0.5 + random() / 2) * Math.PI) % Math.PI
    }

    return new Side({
        speedFactor,
        tx,
        tv: 0, // theta speed
        ta: 0, // theta acceleration
        sx: ((2 * random() - 1) * Math.PI) / 6, // sigma position
        sv: 0, // sigma speed
        sa: 0, // sigma acceleration
    })
}

export let createStripCircle = (param: StripCircleParam) => {
    let quadArray = Array.from({ length: param.stripCount }).map((_, k) => {
        let a = createRandomSide(param.random, param.speedFactor)

        return new Quad({ a, b: createRandomSide(param.random, param.speedFactor, a) })
    })

    let me = {
        update: (timeIncrement: number) => {
            quadArray.forEach((quad) => {
                quad.a.randomUpdate(param.random, timeIncrement)
                quad.b.randomUpdate(param.random, timeIncrement)
            })
        },
        getPathList: (center: [number, number], radius: number) => {
            let pathList = quadArray.map((quad) =>
                quad.trigonometry().map((point) => add(scale(point, radius), center)),
            )
            return pathList
        },
    }

    return me
}

export type ColorStrip = ReturnType<typeof createStripCircle>

let cossin = (theta: number): [number, number] => {
    return [Math.cos(theta), Math.sin(theta)]
}

let add = <T extends number[]>(u: T, v: T) => {
    return u.map((x, k) => x + v[k]) as T
}

let scale = <T extends number[]>(u: T, a: number): T => {
    return u.map((x) => a * x) as T
}

let clamp = (x: number, small: number, big: number) => {
    return Math.max(Math.min(x, big), small)
}
