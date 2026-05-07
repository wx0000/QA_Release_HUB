import { useState } from 'react'
import { TitleBar } from './components/layout/TitleBar'
import { TabBar, type TabId } from './components/layout/TabBar'
import { PageWrapper } from './components/layout/PageWrapper'

// Tab 1 — Report Generator
import { MetaForm } from './components/report/MetaForm'
import { ScopeInput } from './components/report/ScopeInput'
import { ChangesTable } from './components/report/ChangesTable'
import { TestCasesTable } from './components/report/TestCasesTable'

// Tab 2 — Deploy Schedule
import { ScheduleInput } from './components/schedule/ScheduleInput'

// Tab 3 — Terminal Regression
import { RegressionSetup } from './components/regression/RegressionSetup'

// Tab 5 — Update Monitor
import { MonitorAuth } from './components/terminalMonitor/MonitorAuth'

function ReportPage() {
  return (
    <PageWrapper title="Report Generator">
      <MetaForm />
      <ScopeInput />
      <ChangesTable />
      <TestCasesTable />
    </PageWrapper>
  )
}

function SchedulePage() {
  return (
    <PageWrapper title="Deployment Schedule">
      <ScheduleInput />
    </PageWrapper>
  )
}

function RegressionPage() {
  return (
    <PageWrapper title="Terminal Regression">
      <RegressionSetup />
    </PageWrapper>
  )
}

function AITCGenPage() {
  return (
    <PageWrapper title="AIO TC-GEN" badge="v0.8">
      <div className="rounded-xl border border-dashed border-border-light p-12 text-center">
        <p className="text-text-muted">AI test-case generation — v0.8.0</p>
        <p className="text-text-muted text-xs mt-1">Details to be defined in a separate session.</p>
      </div>
    </PageWrapper>
  )
}

function MonitorPage() {
  return (
    <PageWrapper title="Terminal Update Monitor">
      <MonitorAuth />
    </PageWrapper>
  )
}

const TAB_PAGES: Record<TabId, () => JSX.Element> = {
  1: ReportPage,
  2: SchedulePage,
  3: RegressionPage,
  4: AITCGenPage,
  5: MonitorPage
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(1)
  const Page = TAB_PAGES[activeTab]

  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-hidden bg-bg-primary">
          <Page />
        </div>
      </div>
    </div>
  )
}
