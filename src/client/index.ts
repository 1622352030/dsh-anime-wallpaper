/**
 * anime-wallpaper client entry: a wallpaper backdrop with a theme-aware
 * black/white overlay on the sidebar and conversation panes, plus a floating
 * background picker (built-in wallpapers + user-imported images).
 *
 * State (current wallpaper, imported images, renames, hidden list) is stored
 * in the dsh user-settings document via `ctx.settingsScope`, so it survives
 * restarts AND crosses origins (web browser vs desktop shell) — unlike
 * localStorage, which is origin-scoped and not shared across environments.
 *
 * - Backdrop: a `body` background-image chosen from the embedded wallpapers or
 *   a user-imported image.
 * - Overlay: the sidebar always carries a translucent white (light) / black
 *   (dark) veil; the conversation pane carries the same veil only while a
 *   conversation is active (`[data-phase='active']`), so the landing page
 *   (`[data-phase='hero']`) shows the wallpaper unobstructed.
 * - The Cordis effect disposer restores every write it made.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { BACKGROUNDS, DEFAULT_BACKGROUND } from './backgrounds.generated.ts'
import { mountBackgroundPicker } from './background-picker.ts'
import { EMPTY_SKIN_SETTINGS, SKIN_SETTINGS_NAMESPACE, type SkinSettings } from '../skin-settings.ts'
import './anime-wallpaper.module.css'

/** The client half needs the settings scope service to load/store state. */
export const inject = ['settingsScope']

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

export function apply(ctx: Context): void {
  const scope = ctx.settingsScope.bind<SkinSettings>({ namespace: SKIN_SETTINGS_NAMESPACE })
  const body = document.body
  body.dataset.dshAnimeWallpaper = ''

  const readState = (): SkinSettings => {
    return scope.getSnapshot().value ?? EMPTY_SKIN_SETTINGS
  }

  const writeState = (state: SkinSettings): void => {
    // Field-level writes; each queued write rides the latest revision and
    // recovery re-reads on failure.
    void scope.set('background', state.background)
    void scope.set('custom', state.custom)
    void scope.set('names', state.names)
    void scope.set('hidden', state.hidden)
  }

  const resolveBackground = (): string => {
    const state = readState()
    const pick = state.background !== '' ? state.background : DEFAULT_BACKGROUND
    if (pick.startsWith('custom:')) {
      return state.custom[pick.slice('custom:'.length)]?.uri ?? BACKGROUNDS[DEFAULT_BACKGROUND]!
    }
    return BACKGROUNDS[pick] ?? BACKGROUNDS[DEFAULT_BACKGROUND]!
  }

  const applyUri = (uri: string): void => {
    body.style.setProperty('background-image', `url(${uri})`)
  }

  const syncBackdrop = (): void => {
    applyUri(resolveBackground())
  }

  body.style.setProperty('background-position', 'center center')
  body.style.setProperty('background-size', 'cover')
  body.style.setProperty('background-attachment', 'fixed')
  body.style.setProperty('background-repeat', 'no-repeat')
  syncBackdrop()

  const picker = mountBackgroundPicker({
    builtin: BACKGROUNDS,
    names: BACKGROUND_NAMES,
    defaultKey: DEFAULT_BACKGROUND,
    readState,
    writeState,
    onPick: applyUri,
  })

  // Cross-window hot switch: a settings commit from another window (or the
  // desktop shell) fires this subscription, so the wallpaper follows live and
  // the dropdown re-syncs.
  const unsubscribe = scope.subscribe(() => {
    syncBackdrop()
    picker.refresh()
  })

  ctx.effect(() => () => {
    delete body.dataset.dshAnimeWallpaper
    for (const property of BACKDROP_PROPERTIES) {
      body.style.removeProperty(property)
    }
    unsubscribe()
    picker.unmount()
  })
}
