export type ScheduleType = 'A' | 'B'

export interface ScheduleComponent {
  name: string
  durationMin: number
  notes: string
  steps?: string[] // Type A
  developer?: string // Type B
}

export interface SchedulePerson {
  name: string
  role: 'developer' | 'tester'
  components: ScheduleComponent[]
}

export interface ParsedSchedule {
  type: ScheduleType
  people: SchedulePerson[]
  components: ScheduleComponent[]
}
