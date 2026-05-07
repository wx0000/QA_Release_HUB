import { FileText, Calendar, ListChecks, Sparkles, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TabId = 1 | 2 | 3 | 4 | 5

interface Tab {
  id: TabId
  label: string
  icon: LucideIcon
  badge?: string
}

const TABS: Tab[] = [
  { id: 1, label: 'Report Generator', icon: FileText },
  { id: 2, label: 'Deploy Schedule', icon: Calendar },
  { id: 3, label: 'Terminal Regression', icon: ListChecks },
  { id: 4, label: 'AIO TC-GEN', icon: Sparkles, badge: 'v0.8' },
  { id: 5, label: 'Update Monitor', icon: Activity }
]

interface TabBarProps {
  activeTab: TabId
  onTabChange: (id: TabId) => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <aside className="w-[200px] shrink-0 flex flex-col bg-bg-tertiary border-r border-border h-full">
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left
                transition-all duration-150 group relative
                ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
              )}
              <Icon size={16} className="shrink-0" />
              <span className="text-sm truncate">{tab.label}</span>
              {tab.badge && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted border border-border-light">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-[10px] text-text-muted">QA Release HUB</p>
        <p className="text-[10px] text-text-muted opacity-60">v0.1.0 — Foundation</p>
      </div>
    </aside>
  )
}
