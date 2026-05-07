import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

const userDataPath = app.getPath('userData')

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function readJson<T>(relativePath: string, fallback: T): T {
  const fullPath = join(userDataPath, relativePath)
  try {
    const raw = readFileSync(fullPath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(relativePath: string, data: unknown): void {
  const fullPath = join(userDataPath, relativePath)
  ensureDir(join(userDataPath, relativePath.split('/').slice(0, -1).join('/')))
  writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8')
}
