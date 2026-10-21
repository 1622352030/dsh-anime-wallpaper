/**
 * Optional 自动配色 (auto tint).
 *
 * The skin's default look is a fixed white veil (light theme) / black veil
 * (dark theme), which reads well on every wallpaper but is neutral. This
 * module adds an opt-in alternative: sample the wallpaper that is actually
 * showing and derive a veil colour from *its* hue, so the translucent
 * surfaces feel related to the picture instead of sitting on top of it.
 *
 * Design constraints (deliberate):
 * - The result is still a translucent veil at the same alpha stops, so layout
 *   and readability behave exactly like the default mode. Only the hue moves.
 * - Bright wallpaper -> dark veil, dark wallpaper -> light veil. The veil is
 *   always pushed far from the wallpaper's own luminance, so text contrast
 *   never depends on the picture.
 * - Everything is reversible: turning it off removes the inline custom
 *   property, and the stylesheet's own `--aw-veil-rgb` takes over again.
 */

const TINT_KEY = 'dsh-skin-anime-wallpaper.autoTint'

export interface WallpaperSample {
  r: number
  g: number
  b: number
  /** sRGB relative luminance, 0 (black) .. 1 (white). */
  luminance: number
}

/** sRGB relative luminance (WCAG definition), 0..1. */
export function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number): number => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * Downscale the wallpaper to 32x32 and average it, yielding its mean colour
 * and luminance. Resolves null when the image cannot be decoded or the canvas
 * is tainted (a cross-origin wallpaper), in which case the caller simply keeps
 * the default veil.
 */
export function sampleWallpaper(uri: string): Promise<WallpaperSample | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const context = canvas.getContext('2d')
        if (context === null) {
          resolve(null)
          return
        }
        context.drawImage(img, 0, 0, 32, 32)
        const data = context.getImageData(0, 0, 32, 32).data
        let r = 0
        let g = 0
        let b = 0
        let n = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i] as number
          g += data[i + 1] as number
          b += data[i + 2] as number
          n += 1
        }
        if (n === 0) {
          resolve(null)
          return
        }
        r /= n
        g /= n
        b /= n
        resolve({ r, g, b, luminance: relativeLuminance(r, g, b) })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = uri
  })
}

/**
 * Derive the veil colour from a wallpaper sample.
 *
 * **Contrast is decided by the text colour, not by the wallpaper.** The theme
 * picks the text: dark theme renders near-white labels, light theme near-black
 * ones. So the veil has to sit on the opposite side of that text:
 *
 *   dark theme  -> dark veil   (target 0)
 *   light theme -> light veil  (target 255)
 *
 * An earlier version keyed this on the wallpaper's own luminance instead, which
 * looks right in the light theme (dark text on a light veil) but collapses in
 * the dark theme: a bright wallpaper produced a light veil *and* white text
 * sat on it, so the conversation became unreadable.
 *
 * 12% of the wallpaper's own hue survives, which keeps the veil recognisably
 * related to the picture without ever drifting toward the text colour.
 */
export function veilFromSample(sample: WallpaperSample, darkTheme: boolean): string {
  const target = darkTheme ? 0 : 255
  const mix = 0.88
  const blend = (c: number): number => Math.round(c * (1 - mix) + target * mix)
  return `${blend(sample.r)} ${blend(sample.g)} ${blend(sample.b)}`
}

export function readAutoTint(): boolean {
  try {
    return localStorage.getItem(TINT_KEY) === '1'
  } catch {
    return false
  }
}

export function writeAutoTint(on: boolean): void {
  try {
    localStorage.setItem(TINT_KEY, on ? '1' : '0')
  } catch {
    // Persisting the flag is best-effort; the toggle still works for this page.
  }
}

/**
 * Apply (or clear) the auto tint on <body>.
 *
 * @param on - whether 自动配色 is enabled.
 * @param sample - the wallpaper sample, or null when it could not be read.
 * @param darkTheme - the current theme, which decide which way the veil has to
 *   lean for the labels to stay readable.
 * @returns the applied triple, or null when the tint is off/unavailable.
 */
export function applyAutoTint(on: boolean, sample: WallpaperSample | null, darkTheme: boolean): string | null {
  if (!on || sample === null) {
    document.body.style.removeProperty('--aw-veil-rgb')
    return null
  }
  const triple = veilFromSample(sample, darkTheme)
  document.body.style.setProperty('--aw-veil-rgb', triple)
  return triple
}
