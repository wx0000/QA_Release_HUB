import { create } from 'zustand'
import type {
  RegressionSession,
  RegressionResult,
  TerminalType,
  RegressionEnvironment
} from '../types/regression.types'

interface RegressionStore {
  session: RegressionSession | null
  isRunning: boolean

  startSession: (terminal: TerminalType, appVersion: string, env: RegressionEnvironment) => void
  setResult: (testId: string, result: RegressionResult) => void
  setDefect: (testId: string, defect: string) => void
  resetSession: () => void
}

export const useRegressionStore = create<RegressionStore>((set) => ({
  session: null,
  isRunning: false,

  startSession: (terminal, appVersion, environment) =>
    set({
      isRunning: true,
      session: {
        terminal,
        appVersion,
        environment,
        results: {},
        defects: {}
      }
    }),

  setResult: (testId, result) =>
    set((s) =>
      s.session
        ? { session: { ...s.session, results: { ...s.session.results, [testId]: result } } }
        : {}
    ),

  setDefect: (testId, defect) =>
    set((s) =>
      s.session
        ? { session: { ...s.session, defects: { ...s.session.defects, [testId]: defect } } }
        : {}
    ),

  resetSession: () => set({ session: null, isRunning: false })
}))
