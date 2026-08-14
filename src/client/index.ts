/**
 * maid-atelier-ex client entry: a wallpaper backdrop with a theme-aware
 * black/white overlay on the sidebar and conversation panes.
 *
 * - Backdrop: a `body` background-image chosen from the embedded wallpapers,
 *   overridable through `localStorage["dsh-skin-maid-atelier-ex.background"]`.
 * - Overlay: the sidebar always carries a translucent white (light) / black
 *   (dark) veil; the conversation pane carries the same veil only while a
 *   conversation is active (`[data-phase='active']`), so the landing page
 *   (`[data-phase='hero']`) shows the wallpaper unobstructed.
 * - The Cordis effect disposer restores every write it made.
 */
import type { Context } from '@deepseek-ai/cordis'
import { BACKGROUNDS, BACKGROUND_KEYS, DEFAULT_BACKGROUND } from './backgrounds.generated.ts'
import './maid-atelier-ex.module.css'

const SKIN_OWNER = 'maid-atelier-ex'
const STORAGE_KEY = 'dsh-skin-maid-atelier-ex.background'

const BACKDROP_PROPERTIES = [
  'background-image',
  'background-position',
  'background-size',
  'background-attachment',
  'background-repeat',
] as const

export function apply(ctx: Context): void {
  const body = document.body
  body.dataset.dshMaidAtelierEx = ''

  const resolveBackground = (): string => {
    try {
      const key = localStorage.getItem(STORAGE_KEY)
      if (key !== null) {
        const uri = BACKGROUNDS[key]
        if (typeof uri === 'string') return uri
      }
    } catch {
      // localStorage unavailable (e.g. private mode) — use the default.
    }
    return BACKGROUNDS[DEFAULT_BACKGROUND]!
  }

  const syncBackdrop = (): void => {
    body.style.setProperty('background-image', `url(${resolveBackground()})`)
  }

  body.style.setProperty('background-position', 'center center')
  body.style.setProperty('background-size', 'cover')
  body.style.setProperty('background-attachment', 'fixed')
  body.style.setProperty('background-repeat', 'no-repeat')
  syncBackdrop()

  // Cross-tab hot switch: another tab (or the console) that writes the same
  // localStorage key triggers `storage` here, so the wallpaper changes live.
  const onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY || event.key === null) syncBackdrop()
  }
  window.addEventListener('storage', onStorage)

  ctx.effect(() => () => {
    delete body.dataset.dshMaidAtelierEx
    for (const property of BACKDROP_PROPERTIES) {
      body.style.removeProperty(property)
    }
    window.removeEventListener('storage', onStorage)
  })
}
