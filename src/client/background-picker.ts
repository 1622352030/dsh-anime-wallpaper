/**
 * Floating background picker (native DOM, no React): a fixed toggle button
 * that opens a dropdown listing the built-in wallpapers plus any
 * user-imported images, with an "import from file" entry. Picks persist to
 * localStorage; the host's `onPick` re-paints the backdrop. Imported images
 * are downscaled to 1920px wide webp before storage so several fit the
 * localStorage budget.
 */

interface StoredCustom {
  [id: string]: { name: string; uri: string }
}

export interface BackgroundPickerHost {
  /** Built-in wallpaper key → data URI. */
  builtin: Record<string, string>
  /** Built-in wallpaper key → display name. */
  names: Record<string, string>
  /** Fallback key when nothing is stored. */
  defaultKey: string
  /** localStorage key holding the current pick. */
  storageKey: string
  /** localStorage key holding the user-imported images. */
  customKey: string
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

export function mountBackgroundPicker(host: BackgroundPickerHost): () => void {
  const body = document.body

  const readCustom = (): StoredCustom => {
    try {
      const parsed = JSON.parse(localStorage.getItem(host.customKey) ?? '{}') as unknown
      return typeof parsed === 'object' && parsed !== null ? parsed as StoredCustom : {}
    } catch {
      return {}
    }
  }

  const writeCustom = (custom: StoredCustom): void => {
    try {
      localStorage.setItem(host.customKey, JSON.stringify(custom))
    } catch (error) {
      console.error('[maid-atelier-ex] storing imported image failed:', error)
    }
  }

  const currentPick = (): string => {
    try {
      return localStorage.getItem(host.storageKey) ?? host.defaultKey
    } catch {
      return host.defaultKey
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

  // ---- rendering ----
  const renderList = (): void => {
    list.textContent = ''
    const current = currentPick()

    const renderItem = (pick: string, label: string, uri: string): void => {
      const item = document.createElement('button')
      item.type = 'button'
      item.setAttribute('data-skin-bg-item', '')
      item.setAttribute('data-pick', pick)
      if (pick === current) item.setAttribute('data-active', '')

      const thumb = document.createElement('img')
      thumb.src = uri
      thumb.alt = ''
      thumb.setAttribute('data-skin-bg-thumb', '')

      const name = document.createElement('span')
      name.textContent = label

      const check = document.createElement('span')
      check.setAttribute('data-skin-bg-check', '')
      check.textContent = '✓'

      item.append(thumb, name, check)
      item.addEventListener('click', () => {
        try {
          localStorage.setItem(host.storageKey, pick)
        } catch (error) {
          console.error('[maid-atelier-ex] persisting pick failed:', error)
        }
        host.onPick(uri)
        renderList()
      })
      list.append(item)
    }

    for (const [key, uri] of Object.entries(host.builtin)) {
      renderItem(key, host.names[key] ?? key, uri)
    }

    const custom = readCustom()
    for (const [id, entry] of Object.entries(custom)) {
      renderItem(`custom:${id}`, entry.name, entry.uri)
    }
  }

  const importImage = async (file: File): Promise<void> => {
    try {
      const uri = await compressImage(file)
      const id = `c${Date.now().toString(36)}`
      const custom = readCustom()
      custom[id] = { name: file.name, uri }
      writeCustom(custom)
      try {
        localStorage.setItem(host.storageKey, `custom:${id}`)
      } catch (error) {
        console.error('[maid-atelier-ex] persisting pick failed:', error)
      }
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
