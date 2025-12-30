// A ColorStrip, created from a ColorStripConfig is a set of Quad-s ; each Quad
// consisting of two Side-s.

type RandomFunction = () => number

export interface PaletteConfig {
  // colorCount the number of colors in the palette
  colorCount: number
  // diversityRatio, between 0 and 1 --
  // this sets the amount of diversity of color --
  // 0.25 is usually good
  diversityRatio: number
  // theme -- background selection and luminosity/saturation adjustment
  // Note: a decent handling of theme would require taking saturation into
  // account when generating the color palette
  theme: "light" | "pastelle" | "twilight" | "dark"
  // random -- the source of randomness used for the palette generation,
  // a function which produces numbers between 0 included and 1 excluded
  random: RandomFunction
  // baseHue -- a number between 0 and 360 used as the center of the generated
  // palette
  baseHue?: number
}

export type Theme = PaletteConfig["theme"]

export let themeArray: Theme[] = ["light", "pastelle", "twilight", "dark"]

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

export let createPalette = (config: PaletteConfig) => {
  // To sample a set of harmonious colors, the diversityRatio can be
  // tweaked up (more diversity) or down (colors with more similar hues)
  //
  // To sample colors looking different from one another, the luminosity
  // is alternatively low and high
  let baseHue = Math.floor(360 * config.random())
  baseHue = config.baseHue ?? baseHue

  // A hueBoost value above one increases the amplitude of the variation
  // around the baseHue. This helps diversify the color when the hue
  // is over-represented in the chromatic circle.
  let hueBoost = 1
  let hueComment = "simple"
  if (80 <= baseHue && baseHue < 140) {
    // low green
    hueBoost = 2.4
    hueComment = "low green"
  } else if (140 <= baseHue && baseHue < 180) {
    // high green
    hueBoost = 2.2
    hueComment = "high green"
  } else if (180 <= baseHue && baseHue < 260) {
    // blue
    hueBoost = 2
    hueComment = "blue"
  } else if (300 <= baseHue) {
    // red
    hueBoost = 1.8
    hueComment = "red"
  }

  let baseLuminosity: number
  let lumSpacing: number
  let saturation: number
  let backgroundColor: string
  if (config.theme === "dark") {
    baseLuminosity = 0.1 + 0.2 * config.random()
    lumSpacing = 0.06
    saturation = 0.4
    backgroundColor = "#000"
  } else if (config.theme === "twilight") {
    baseLuminosity = 0.15 + 0.2 * config.random()
    lumSpacing = 0.06
    saturation = 1
    backgroundColor = "#111"
  } else if (config.theme === "light") {
    baseLuminosity = 0.45
    lumSpacing = 0.04
    saturation = 1
    backgroundColor = "#FFF"
  } else if (config.theme === "pastelle") {
    baseLuminosity = 0.6
    lumSpacing = 0.1
    saturation = 0.7
    backgroundColor = "#FFF"
  } else {
    throw new Error(`unknown theme ${config.theme}`)
  }

  let luminosityDuet = [baseLuminosity + lumSpacing, baseLuminosity - lumSpacing]
  let colorArray = Array.from({ length: config.colorCount }).map((_, k) => {
    let relativeK = k - Math.floor(config.colorCount / 2)
    let hue =
      (baseHue + (hueBoost * config.diversityRatio * 360 * relativeK) / config.colorCount) % 360
    let color = hslToHex(hue, saturation, luminosityDuet[k % 2])
    return color
  })

  return {
    backgroundColor,
    baseHue,
    hueComment,
    colorArray,
  }
}

export type Palette = ReturnType<typeof createPalette>
