export type RegressionResult = 'PASS' | 'FAIL' | 'SKIP' | 'PENDING'
export type TerminalType = 'TERMINAL-A' | 'TERMINAL-B'
export type RegressionEnvironment = 'STAGE' | 'TEST'

export interface RegressionTestCase {
  id: string
  description: string
  notes?: string
  category: string
  subcategory: string
}

export interface RegressionData {
  terminal: TerminalType
  categories: {
    name: string
    subcategories: {
      name: string
      tests: RegressionTestCase[]
    }[]
  }[]
}

export interface RegressionSession {
  terminal: TerminalType
  appVersion: string
  environment: RegressionEnvironment
  results: Record<string, RegressionResult>
  defects: Record<string, string>
}
