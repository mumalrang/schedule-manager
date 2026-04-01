/**
 * storageService.js
 *
 * Abstraction layer for data persistence.
 * Currently uses localStorage for web.
 * To migrate to Electron: replace loadState/saveState with IPC calls
 * that read/write local JSON files via window.electron.
 *
 * Usage in Electron preload:
 *   window.electron = {
 *     loadState: () => ipcRenderer.invoke('load-state'),
 *     saveState: (data) => ipcRenderer.invoke('save-state', data),
 *   }
 */

const STORAGE_KEY = 'schedule-manager-state'

const isElectron = () =>
  typeof window !== 'undefined' && !!window.electron

export async function loadState() {
  if (isElectron()) {
    try {
      return await window.electron.loadState()
    } catch (e) {
      console.error('[storageService] Electron loadState failed:', e)
      return null
    }
  }

  // Web: localStorage
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) return null
    return JSON.parse(serialized)
  } catch (e) {
    console.error('[storageService] localStorage load failed:', e)
    return null
  }
}

export function saveState(state) {
  if (isElectron()) {
    window.electron.saveState(state).catch((e) =>
      console.error('[storageService] Electron saveState failed:', e)
    )
    return
  }

  // Web: localStorage
  try {
    // Only persist data, not UI state
    const { projects, tasks, fixedBlocks, selectedDate } = state
    const serialized = JSON.stringify({ projects, tasks, fixedBlocks, selectedDate })
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (e) {
    console.error('[storageService] localStorage save failed:', e)
  }
}

export function clearState() {
  if (isElectron()) {
    window.electron.saveState({}).catch(() => {})
    return
  }
  localStorage.removeItem(STORAGE_KEY)
}
