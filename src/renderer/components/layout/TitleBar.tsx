import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const isMac = window.electronAPI?.platform === 'darwin'

  useEffect(() => {
    window.electronAPI?.isMaximized().then(setIsMaximized).catch(() => {})
  }, [])

  const handleMinimize = () => window.electronAPI?.minimize()
  const handleMaximize = () => {
    window.electronAPI?.maximize()
    setIsMaximized((v) => !v)
  }
  const handleClose = () => window.electronAPI?.close()

  return (
    <div
      className="flex items-center h-10 bg-bg-tertiary border-b border-border select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* macOS traffic lights zone — leave space on left */}
      {isMac && <div className="w-20 shrink-0" />}

      {/* App name */}
      <div className="flex-1 flex items-center gap-2 px-4">
        <span className="text-accent font-bold text-sm tracking-wide">QA</span>
        <span className="text-text-primary font-semibold text-sm">Release HUB</span>
        <span className="text-text-muted text-xs ml-1">v0.1.0</span>
      </div>

      {/* Windows-style controls */}
      {!isMac && (
        <div
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <TitleBarBtn onClick={handleMinimize} title="Minimize">
            <Minus size={14} />
          </TitleBarBtn>
          <TitleBarBtn onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
            <Square size={12} />
          </TitleBarBtn>
          <TitleBarBtn onClick={handleClose} title="Close" danger>
            <X size={14} />
          </TitleBarBtn>
        </div>
      )}
    </div>
  )
}

function TitleBarBtn({
  onClick,
  title,
  danger = false,
  children
}: {
  onClick: () => void
  title: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-12 h-10 flex items-center justify-center transition-colors
        text-text-muted hover:text-text-primary
        ${danger ? 'hover:bg-status-danger hover:text-white' : 'hover:bg-bg-secondary'}
      `}
    >
      {children}
    </button>
  )
}
