import type { Goal } from './types.ts'

const STORAGE_KEY = 'goalchain-goals'

export function loadGoals(): Goal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveGoals(goals: Goal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}
