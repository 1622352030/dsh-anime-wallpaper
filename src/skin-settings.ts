/**
 * Durable skin settings shared by the Host schema and the browser scope.
 * Stored in the dsh user-settings document (settings.yaml) under a dedicated
 * namespace, so the wallpaper pick survives restarts AND crosses origins
 * (web browser vs desktop shell), unlike localStorage which is origin-scoped.
 */

/** Settings namespace owned by this skin plugin. */
export const SKIN_SETTINGS_NAMESPACE = 'ui-anime-wallpaper'

/** One imported image: display name + downscaled webp data URI. */
export interface CustomImage {
  name: string
  uri: string
}

/** Durable skin state. */
export interface SkinSettings {
  /** Current pick: a built-in wallpaper key or `custom:<id>`. */
  background: string
  /** User-imported images keyed by id. */
  custom: Record<string, CustomImage>
  /** Built-in wallpaper name overrides. */
  names: Record<string, string>
  /** Hidden built-in wallpaper keys. */
  hidden: string[]
}

/** Empty state before the user has persisted anything. */
export const EMPTY_SKIN_SETTINGS: SkinSettings = {
  background: '',
  custom: {},
  names: {},
  hidden: [],
}
