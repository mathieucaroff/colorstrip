import { createColorStrip } from "./colorstrip"
import { themeArray } from "./lib/palette"
import { default as seedrandom } from "seedrandom"

function main() {
    console.log(
        "theme",
        themeArray.map((t) => "#" + t),
    )

    const config = { seed: "" }

    let random = seedrandom(config.seed)

    let canvas = document.querySelector("canvas")!
    let resizeCanvas = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }
    resizeCanvas()

    let theme
    let setupTheme = () => {
        theme = location.hash.slice(1) || "pastelle"
        document.title = "Colorstrip"
        if (theme.length > 0) {
            document.title += " " + theme
        }
    }
    setupTheme()

    let strip
    let setupColorStrip = () => {
        strip = createColorStrip(canvas, {
            stripCount: 10,
            diversityRatio: 3 / 12,
            theme,
            random,
        })
    }
    setupColorStrip()

    window.addEventListener("resize", () => {
        resizeCanvas()
    })

    window.addEventListener("hashchange", () => {
        setupTheme()
        setupColorStrip()
    })

    let lastTime = performance.now()
    let animate = () => {
        let time = performance.now()
        strip.update((time - lastTime) * 0.02)
        lastTime = time
        let radius = ((canvas.width ** 2 + canvas.height ** 2) ** 0.5 * 1.1) / 2
        strip.draw(radius)
    }

    let render = () => {
        requestAnimationFrame(render)
        animate()
    }

    render()
}

main()
