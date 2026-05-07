interface PageWrapperProps {
  title: string
  badge?: string
  children: React.ReactNode
}

export function PageWrapper({ title, badge, children }: PageWrapperProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-accent/10 text-accent border border-accent/20">
            {badge}
          </span>
        )}
      </header>

      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {children}
      </main>
    </div>
  )
}
