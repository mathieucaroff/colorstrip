import { createColorStrip, themeArray } from "./colorstrip"

function main() {
    console.log(
        "theme",
        themeArray.map((t) => "#" + t),
    )

    let canvasElement = document.querySelector("canvas")
    let resizeCanvas = () => {
        canvasElement.width = window.innerWidth
        canvasElement.height = window.innerHeight
    }
    resizeCanvas()

    let radius = () => ((window.innerWidth ** 2 + window.innerHeight ** 2) ** 0.5 * 1.1) / 2

    let theme
    let setupTheme = () => {
        theme = location.hash.slice(1)
        document.title = "Colorstrip"
        if (theme.length > 0) {
            document.title += " " + theme
        }
    }
    setupTheme()

    let strip
    let setupColorStrip = () => {
        strip = createColorStrip(canvasElement, radius(), {
            stripCount: 10,
            diversityRatio: 3 / 12,
            theme,
        })
    }
    setupColorStrip()

    window.addEventListener("resize", () => {
        resizeCanvas()
        strip.setRadius(radius())
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
        strip.draw()
    }

    let render = () => {
        requestAnimationFrame(render)
        animate()
    }

    render()
}

main()
