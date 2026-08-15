/** Host loader entry: registers the durable settings section for the skin. */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { SKIN_SETTINGS_NAMESPACE } from './skin-settings.ts'
import { SkinSettingsSchema } from './skin-settings-schema.ts'

const NAMESPACE = settingsNamespace(SKIN_SETTINGS_NAMESPACE)

/**
 * Register the skin's settings namespace when a settings provider is composed.
 * The browser half reads/writes it through `ctx.settingsScope.bind(...)`, which
 * is what makes the wallpaper pick durable across origins and restarts.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(NAMESPACE, SkinSettingsSchema)
  })
}
