/**
 * Floating background picker (native DOM, no React): a fixed toggle button
 * that opens a dropdown listing the built-in wallpapers plus any
 * user-imported images, with import / rename / remove actions. State is read
 * and written through the host's `readState`/`writeState` callbacks, which
 * back onto the durable dsh settings section (cross-origin + restart safe).
 * Imported images are downscaled to 1920px wide webp before storage.
 */

import type { CustomImage, SkinSettings } from '../skin-settings.ts'

export interface BackgroundPickerHost {
  /** Built-in wallpaper key → data URI. */
  builtin: Record<string, string>
  /** Built-in wallpaper key → default display name. */
  names: Record<string, string>
  /** Fallback key when nothing is stored. */
  defaultKey: string
  /** Read the current durable skin state. */
  readState: () => SkinSettings
  /** Persist the full skin state. */
  writeState: (state: SkinSettings) => void
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

  const readCustom = (): Record<string, CustomImage> => host.readState().custom
  const readNames = (): Record<string, string> => host.readState().names
  const readHidden = (): string[] => {
    const hidden = host.readState().hidden
    return Array.isArray(hidden) ? hidden : []
  }

  const currentPick = (): string => {
    const background = host.readState().background
    return background !== '' ? background : host.defaultKey
  }

  /** Merge a partial patch into the durable state and persist it. */
  const commit = (patch: Partial<SkinSettings>): void => {
    host.writeState({ ...host.readState(), ...patch })
  }

  const setPick = (pick: string): void => {
    commit({ background: pick })
  }

  const resolveUri = (pick: string): string => {
    if (pick.startsWith('custom:')) {
      return readCustom()[pick.slice('custom:'.length)]?.uri ?? host.builtin[host.defaultKey] ?? ''
    }
    return host.builtin[pick] ?? host.builtin[host.defaultKey] ?? ''
  }

  /** First built-in key that is not hidden (used when the current one is removed). */
  const firstAvailableBuiltin = (hidden: string[]): string => (
    Object.keys(host.builtin).find(key => !hidden.includes(key)) ?? host.defaultKey
  )

  // ---- DOM ----
  const root = document.createElement('div')
  root.setAttribute('data-skin-bg-picker', '')

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.setAttribute('data-skin-bg-toggle', '')
  toggle.setAttribute('aria-label', '切换背景')
  toggle.setAttribute('aria-expanded', 'false')
  toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>'

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
    const names = { ...readNames() }
    names[key] = next.trim()
    commit({ names })
    renderList()
  }

  const renameCustom = (id: string): void => {
    const custom = readCustom()
    const entry = custom[id]
    if (entry === undefined) return
    const next = window.prompt('重命名主题', entry.name)
    if (next === null || next.trim() === '') return
    commit({ custom: { ...custom, [id]: { ...entry, name: next.trim() } } })
    renderList()
  }

  const removeBuiltin = (key: string): void => {
    if (!window.confirm('从列表移除这个主题？')) return
    const hidden = readHidden().filter(item => item !== key)
    hidden.push(key)
    let background = host.readState().background
    if (currentPick() === key) {
      background = firstAvailableBuiltin(hidden)
      host.onPick(host.builtin[background] ?? '')
    }
    commit({ hidden, background })
    renderList()
  }

  const removeCustom = (id: string): void => {
    if (!window.confirm('删除这个自定义主题？')) return
    const custom = { ...readCustom() }
    delete custom[id]
    let background = host.readState().background
    if (currentPick() === `custom:${id}`) {
      background = host.defaultKey
      host.onPick(host.builtin[host.defaultKey] ?? '')
    }
    commit({ custom, background })
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
      const custom = { ...readCustom() }
      custom[id] = { name: file.name, uri }
      commit({ custom, background: `custom:${id}` })
      host.onPick(uri)
      renderList()
    } catch (error) {
      console.error('[anime-wallpaper] importing image failed:', error)
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
