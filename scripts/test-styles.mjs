import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { transform } from 'lightningcss'

const root = new URL('../', import.meta.url)
const source = await readFile(new URL('src/client/anime-wallpaper.module.css', root), 'utf8')
const { code } = transform({
  filename: 'src/client/anime-wallpaper.module.css',
  code: Buffer.from(source),
  cssModules: { pattern: '[hash]_[local]' },
  minify: true,
})
const compiled = code.toString()
const styles = []
const bundle = await readFile(new URL('lib/client.js', root), 'utf8')
runInNewContext(bundle, {
  window: { __ModuleLoader__: { load: ({ factory }) => factory(() => { throw new Error('Unexpected runtime dependency') }) } },
  document: {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, textContent: '' }),
    head: { appendChild: element => styles.push(element.textContent) },
  },
}, { timeout: 5000 })
assert.equal(styles.length, 1, 'Expected exactly one skin stylesheet in the client bundle')
assert.equal(styles[0], compiled, 'Client CSS is stale; run pnpm build before test:styles')
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
const skin = JSON.parse(await readFile(new URL('skin.json', root), 'utf8'))
assert.equal(pkg.version, skin.version, 'Package and skin versions must agree')
assert.equal(pkg.engines.dsh, skin.compatibility.dsh, 'Package and skin compatibility must agree')
const template = await readFile(new URL('tests/styles.browser.html', root), 'utf8')
const json = JSON.stringify({ source, compiled }).replaceAll('<', '\\u003c')
assert.equal(template.split('/*__SKIN_STYLES__*/').length, 2)
const output = new URL('preview/style-regression.html', root)
await mkdir(new URL('preview/', root), { recursive: true })
await writeFile(output, template.replace('/*__SKIN_STYLES__*/', json))
console.log('PASS: bundled CSS matches source; version and compatibility metadata agree.')
console.log('Open the generated browser checks (no server required):')
console.log(fileURLToPath(output))
console.log('Read document.documentElement.dataset.testStatus for the browser result.')
