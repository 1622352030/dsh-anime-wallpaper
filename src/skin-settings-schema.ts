/** Host-side schema for the durable skin settings section. */

import z from '@deepseek-ai/schemastery'
import type { SkinSettings } from './skin-settings.ts'

export const SkinSettingsSchema: z<SkinSettings> = z.object({
  background: z.string().default(''),
  custom: z.dict(z.object({ name: z.string(), uri: z.string() })).default({}),
  names: z.dict(z.string()).default({}),
  hidden: z.array(z.string()).default([]),
})
