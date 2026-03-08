import './style.css'
import type { Goal } from './types.ts'
import { loadGoals, saveGoals } from './store.ts'

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function renderGoal(goal: Goal): string {
  return `
    <li class="goal-item ${goal.completed ? 'completed' : ''}" data-id="${goal.id}">
      <label class="goal-label">
        <input type="checkbox" ${goal.completed ? 'checked' : ''} data-action="toggle" />
        <span class="goal-text">${escapeHtml(goal.text)}</span>
      </label>
      <button type="button" class="goal-delete" data-action="delete" title="삭제">×</button>
    </li>
  `
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function render(goals: Goal[], container: HTMLElement): void {
  container.innerHTML = goals.length
    ? goals.map((g) => renderGoal(g)).join('')
    : '<p class="empty-message">목표를 추가해 보세요</p>'
}

function init(): void {
  let goals = loadGoals()
  const form = document.querySelector<HTMLFormElement>('#goal-form')!
  const input = document.querySelector<HTMLInputElement>('#goal-input')!
  const list = document.querySelector<HTMLUListElement>('#goal-list')!

  const update = (): void => {
    saveGoals(goals)
    render(goals, list)
  }

  const add = (text: string): void => {
    const trimmed = text.trim()
    if (!trimmed) return
    goals = [...goals, { id: createId(), text: trimmed, completed: false, createdAt: Date.now() }]
    update()
    input.value = ''
    input.focus()
  }

  const toggle = (id: string): void => {
    goals = goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g))
    update()
  }

  const remove = (id: string): void => {
    goals = goals.filter((g) => g.id !== id)
    update()
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    add(input.value)
  })

  list.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const item = target.closest('.goal-item') as HTMLElement | null
    if (!item) return
    const id = item.dataset.id ?? ''
    if (target.closest('[data-action="toggle"]')) toggle(id)
    if (target.closest('[data-action="delete"]')) remove(id)
  })

  render(goals, list)
}

init()
