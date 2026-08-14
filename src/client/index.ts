/**
 * maid-atelier-ex client entry: a wallpaper backdrop with a theme-aware
 * black/white overlay on the sidebar and conversation panes, plus a floating
 * background picker (built-in wallpapers + user-imported images).
 *
 * - Backdrop: a `body` background-image chosen from the embedded wallpapers or
 *   a user-imported image, overridable through
 *   `localStorage["dsh-skin-maid-atelier-ex.background"]` (built-in key or
 *   `custom:<id>`).
 * - Overlay: the sidebar always carries a translucent white (light) / black
 *   (dark) veil; the conversation pane carries the same veil only while a
 *   conversation is active (`[data-phase='active']`), so the landing page
 *   (`[data-phase='hero']`) shows the wallpaper unobstructed.
 * - The Cordis effect disposer restores every write it made.
 */
import type { Context } from '@deepseek-ai/cordis'
import { BACKGROUNDS, DEFAULT_BACKGROUND } from './backgrounds.generated.ts'
import { mountBackgroundPicker } from './background-picker.ts'
import './maid-atelier-ex.module.css'

const STORAGE_KEY = 'dsh-skin-maid-atelier-ex.background'
const CUSTOM_KEY = 'dsh-skin-maid-atelier-ex.custom'

const BACKGROUND_NAMES: Record<string, string> = {
  'rabbit-umbrella': '兔子打伞',
  'sakuya-snow': '咲夜看雪',
  'sanae-fishing': '早苗摸鱼',
  'orange-isle': '橘子洲头',
  'reimu-flower': '灵梦吃花·无水印',
  'reimu-flower-wm': '灵梦吃花',
  'reimu-water': '灵梦泡水',
  'nahida': '纳西达',
  'rem': '蕾姆流星锤',
}

const BACKDROP_PROPERTIES = [
  'background-image',
  'background-position',
  'background-size',
  'background-attachment',
  'background-repeat',
] as const

type StoredCustom = Record<string, { name: string; uri: string }>

export function apply(ctx: Context): void {
  const body = document.body
  body.dataset.dshMaidAtelierEx = ''

  const readCustom = (): StoredCustom => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? '{}') as unknown
      return typeof parsed === 'object' && parsed !== null ? parsed as StoredCustom : {}
    } catch {
      return {}
    }
  }

  const resolveBackground = (): string => {
    try {
      const pick = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_BACKGROUND
      if (pick.startsWith('custom:')) {
        return readCustom()[pick.slice('custom:'.length)]?.uri ?? BACKGROUNDS[DEFAULT_BACKGROUND]!
      }
      return BACKGROUNDS[pick] ?? BACKGROUNDS[DEFAULT_BACKGROUND]!
    } catch {
      return BACKGROUNDS[DEFAULT_BACKGROUND]!
    }
  }

  const syncBackdrop = (): void => {
    body.style.setProperty('background-image', `url(${resolveBackground()})`)
  }

  body.style.setProperty('background-position', 'center center')
  body.style.setProperty('background-size', 'cover')
  body.style.setProperty('background-attachment', 'fixed')
  body.style.setProperty('background-repeat', 'no-repeat')
  syncBackdrop()

  const unmountPicker = mountBackgroundPicker({
    builtin: BACKGROUNDS,
    names: BACKGROUND_NAMES,
    defaultKey: DEFAULT_BACKGROUND,
    storageKey: STORAGE_KEY,
    customKey: CUSTOM_KEY,
    onPick: syncBackdrop,
  })

  // Cross-tab hot switch: another tab (or the console) that writes the same
  // localStorage key triggers `storage` here, so the wallpaper changes live.
  const onStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY || event.key === CUSTOM_KEY || event.key === null) syncBackdrop()
  }
  window.addEventListener('storage', onStorage)

  ctx.effect(() => () => {
    delete body.dataset.dshMaidAtelierEx
    for (const property of BACKDROP_PROPERTIES) {
      body.style.removeProperty(property)
    }
    window.removeEventListener('storage', onStorage)
    unmountPicker()
  })
}
