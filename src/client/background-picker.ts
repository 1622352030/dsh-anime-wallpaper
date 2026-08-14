/**
 * Floating background picker (native DOM, no React): a fixed toggle button
 * that opens a dropdown listing the built-in wallpapers plus any
 * user-imported images, with import / rename / remove actions. Picks persist
 * to localStorage; the host's `onPick` re-paints the backdrop. Imported
 * images are downscaled to 1920px wide webp before storage.
 *
 * localStorage layout (keys supplied by the host):
 *   - storageKey   current pick: built-in key or `custom:<id>`
 *   - customKey    imported images: `{ id: { name, uri } }`
 *   - namesKey     built-in name overrides: `{ key: name }`
 *   - hiddenKey    hidden built-in keys: `[key, ...]`
 */

interface StoredCustom {
  [id: string]: { name: string; uri: string }
}

export interface BackgroundPickerHost {
  /** Built-in wallpaper key → data URI. */
  builtin: Record<string, string>
  /** Built-in wallpaper key → default display name. */
  names: Record<string, string>
  /** Fallback key when nothing is stored. */
  defaultKey: string
  /** localStorage key holding the current pick. */
  storageKey: string
  /** localStorage key holding the user-imported images. */
  customKey: string
  /** localStorage key holding built-in name overrides. */
  namesKey: string
  /** localStorage key holding hidden built-in keys. */
  hiddenKey: string
  /** Called with the resolved data URI after a pick. */
  onPick: (uri: string) => void
}

/** Downscale an image file to 1920px-wide webp and return its data URI. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, 1920 / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        const ctx = canvas.getContext('2d')
        if (ctx === null) throw new Error('no 2d context')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/webp', 0.8))
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image decode failed'))
    }
    img.src = url
  })
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '') as unknown
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`[maid-atelier-ex] storing ${key} failed:`, error)
  }
}

export function mountBackgroundPicker(host: BackgroundPickerHost): () => void {
  const body = document.body

  const readCustom = (): StoredCustom => readJson<StoredCustom>(host.customKey, {})
  const writeCustom = (value: StoredCustom): void => writeJson(host.customKey, value)

  const readNames = (): Record<string, string> => readJson<Record<string, string>>(host.namesKey, {})
  const writeNames = (value: Record<string, string>): void => writeJson(host.namesKey, value)

  const readHidden = (): string[] => {
    const parsed = readJson<unknown>(host.hiddenKey, [])
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  }
  const writeHidden = (value: string[]): void => writeJson(host.hiddenKey, value)

  const currentPick = (): string => {
    try {
      return localStorage.getItem(host.storageKey) ?? host.defaultKey
    } catch {
      return host.defaultKey
    }
  }

  const setPick = (pick: string): void => {
    try {
      localStorage.setItem(host.storageKey, pick)
    } catch (error) {
      console.error('[maid-atelier-ex] persisting pick failed:', error)
    }
  }

  const resolveUri = (pick: string): string => {
    if (pick.startsWith('custom:')) {
      return readCustom()[pick.slice('custom:'.length)]?.uri ?? host.builtin[host.defaultKey] ?? ''
    }
    return host.builtin[pick] ?? host.builtin[host.defaultKey] ?? ''
  }

  // ---- DOM ----
  const root = document.createElement('div')
  root.setAttribute('data-skin-bg-picker', '')

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.setAttribute('data-skin-bg-toggle', '')
  toggle.setAttribute('aria-label', '切换背景')
  toggle.setAttribute('aria-expanded', 'false')
  toggle.textContent = '🖼'

  const menu = document.createElement('div')
  menu.setAttribute('data-skin-bg-menu', '')
  menu.hidden = true

  const title = document.createElement('div')
  title.setAttribute('data-skin-bg-title', '')
  title.textContent = '切换背景'

  const list = document.createElement('div')
  list.setAttribute('data-skin-bg-list', '')

  const importBtn = document.createElement('button')
  importBtn.type = 'button'
  importBtn.setAttribute('data-skin-bg-import', '')
  importBtn.textContent = '从文件导入图片…'

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.hidden = true

  menu.append(title, list, importBtn)
  root.append(toggle, menu, fileInput)
  body.append(root)

  // ---- actions ----
  const selectBuiltin = (key: string, uri: string): void => {
    setPick(key)
    host.onPick(uri)
    renderList()
  }

  const selectCustom = (id: string, uri: string): void => {
    setPick(`custom:${id}`)
    host.onPick(uri)
    renderList()
  }

  const renameBuiltin = (key: string): void => {
    const current = readNames()[key] ?? host.names[key] ?? key
    const next = window.prompt('重命名主题', current)
    if (next === null || next.trim() === '') return
    const names = readNames()
    names[key] = next.trim()
    writeNames(names)
    renderList()
  }

  const renameCustom = (id: string): void => {
    const custom = readCustom()
    const entry = custom[id]
    if (entry === undefined) return
    const next = window.prompt('重命名主题', entry.name)
    if (next === null || next.trim() === '') return
    custom[id] = { ...entry, name: next.trim() }
    writeCustom(custom)
    renderList()
  }

  const removeBuiltin = (key: string): void => {
    if (!window.confirm('从列表移除这个主题？')) return
    const hidden = readHidden()
    if (!hidden.includes(key)) hidden.push(key)
    writeHidden(hidden)
    if (currentPick() === key) {
      setPick(host.defaultKey)
      host.onPick(host.builtin[host.defaultKey] ?? '')
    }
    renderList()
  }

  const removeCustom = (id: string): void => {
    if (!window.confirm('删除这个自定义主题？')) return
    const custom = readCustom()
    delete custom[id]
    writeCustom(custom)
    if (currentPick() === `custom:${id}`) {
      setPick(host.defaultKey)
      host.onPick(host.builtin[host.defaultKey] ?? '')
    }
    renderList()
  }

  // ---- rendering ----
  const renderList = (): void => {
    list.textContent = ''
    const current = currentPick()
    const hidden = readHidden()
    const names = readNames()

    const renderItem = (
      pick: string,
      label: string,
      uri: string,
      onSelect: () => void,
      onRename: () => void,
      onRemove: () => void,
    ): void => {
      const row = document.createElement('div')
      row.setAttribute('data-skin-bg-item', '')
      if (pick === current) row.setAttribute('data-active', '')

      const pickBtn = document.createElement('button')
      pickBtn.type = 'button'
      pickBtn.setAttribute('data-skin-bg-pick', '')

      const thumb = document.createElement('img')
      thumb.src = uri
      thumb.alt = ''
      thumb.setAttribute('data-skin-bg-thumb', '')

      const name = document.createElement('span')
      name.setAttribute('data-skin-bg-name', '')
      name.textContent = label

      const check = document.createElement('span')
      check.setAttribute('data-skin-bg-check', '')
      check.textContent = '✓'

      pickBtn.append(thumb, name, check)
      pickBtn.addEventListener('click', onSelect)

      const renameBtn = document.createElement('button')
      renameBtn.type = 'button'
      renameBtn.setAttribute('data-skin-bg-action', '')
      renameBtn.setAttribute('aria-label', '重命名')
      renameBtn.title = '重命名'
      renameBtn.textContent = '✎'
      renameBtn.addEventListener('click', onRename)

      const removeBtn = document.createElement('button')
      removeBtn.type = 'button'
      removeBtn.setAttribute('data-skin-bg-action', '')
      removeBtn.setAttribute('aria-label', '删除')
      removeBtn.title = '删除'
      removeBtn.textContent = '✕'
      removeBtn.addEventListener('click', onRemove)

      row.append(pickBtn, renameBtn, removeBtn)
      list.append(row)
    }

    for (const [key, uri] of Object.entries(host.builtin)) {
      if (hidden.includes(key)) continue
      const label = names[key] ?? host.names[key] ?? key
      renderItem(
        key, label, uri,
        () => { selectBuiltin(key, uri) },
        () => { renameBuiltin(key) },
        () => { removeBuiltin(key) },
      )
    }

    for (const [id, entry] of Object.entries(readCustom())) {
      renderItem(
        `custom:${id}`, entry.name, entry.uri,
        () => { selectCustom(id, entry.uri) },
        () => { renameCustom(id) },
        () => { removeCustom(id) },
      )
    }
  }

  const importImage = async (file: File): Promise<void> => {
    try {
      const uri = await compressImage(file)
      const id = `c${Date.now().toString(36)}`
      const custom = readCustom()
      custom[id] = { name: file.name, uri }
      writeCustom(custom)
      setPick(`custom:${id}`)
      host.onPick(uri)
      renderList()
    } catch (error) {
      console.error('[maid-atelier-ex] importing image failed:', error)
    }
  }

  importBtn.addEventListener('click', () => { fileInput.click() })
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0]
    if (file !== undefined) void importImage(file)
    fileInput.value = ''
  })

  toggle.addEventListener('click', () => {
    const open = menu.hidden
    menu.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
    if (open) renderList()
  })

  const onDocClick = (event: MouseEvent): void => {
    if (root.contains(event.target as Node)) return
    menu.hidden = true
    toggle.setAttribute('aria-expanded', 'false')
  }
  document.addEventListener('click', onDocClick)

  renderList()

  return () => {
    document.removeEventListener('click', onDocClick)
    root.remove()
  }
}
