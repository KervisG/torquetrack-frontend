import { useState } from 'react'

const STORAGE_KEY = 'torquetrack:sidebar-collapsed'

// El storage puede lanzar en modo privado o con cookies bloqueadas; sin él la
// barra arranca expandida y el cambio dura solo esta visita.
function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // Sin storage no hay nada que recordar.
  }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    writeCollapsed(next)
  }

  return { collapsed, toggle }
}
