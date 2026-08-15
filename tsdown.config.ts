import { clientBundle } from './build/tsdown.client.ts'

export default clientBundle('@dsh-external/dsh-client-ui-skin-anime-wallpaper', ['src/index.ts'], {
  portableCssModuleIds: true,
  libExternal: ['@deepseek-ai/dsh-settings', '@deepseek-ai/schemastery'],
})
