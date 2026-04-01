import { create } from 'zustand'
import { loadState, saveState } from '../services/storageService'

// ── helpers ────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10)

const offsetDate = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = offsetDate(0)

// ── default seed data ──────────────────────────────────────
const DEFAULT_PROJECTS = [
  { id: 'p1', name: '개발 프로젝트', color: '#60a5fa', desc: '웹앱 개발 및 기능 구현' },
  { id: 'p2', name: '건강 관리',     color: '#34d399', desc: '운동, 식단, 수면 관리' },
  { id: 'p3', name: '공부',          color: '#fbbf24', desc: '독서, 강의, 자기계발' },
]

const DEFAULT_TASKS = [
  // 개발 프로젝트
  { id: uid(), text: 'Zustand 스토어 설계',         projId: 'p1', date: offsetDate(-1), startTime: '10:00', endTime: '11:30', done: true  },
  { id: uid(), text: '타임그리드 컴포넌트 구현',    projId: 'p1', date: today,           startTime: '09:00', endTime: '12:00', done: false },
  { id: uid(), text: 'API 연동 작업',                projId: 'p1', date: offsetDate(1),  startTime: '14:00', endTime: '16:00', done: false },
  { id: uid(), text: '배포 파이프라인 설정',         projId: 'p1', date: offsetDate(2),  startTime: null,    endTime: null,    done: false },
  // 건강 관리
  { id: uid(), text: '아침 러닝 5km',               projId: 'p2', date: offsetDate(-1), startTime: '07:00', endTime: '08:00', done: true  },
  { id: uid(), text: '헬스장 웨이트 트레이닝',      projId: 'p2', date: today,           startTime: '18:00', endTime: '19:30', done: false },
  { id: uid(), text: '식단 준비',                   projId: 'p2', date: today,           startTime: null,    endTime: null,    done: false },
  { id: uid(), text: '주간 체중 측정',              projId: 'p2', date: offsetDate(3),  startTime: '08:00', endTime: '08:15', done: false },
  // 공부
  { id: uid(), text: 'Clean Code 3장 읽기',         projId: 'p3', date: offsetDate(-2), startTime: '21:00', endTime: '22:00', done: true  },
  { id: uid(), text: 'TypeScript 강의 수강',        projId: 'p3', date: today,           startTime: '20:00', endTime: '21:30', done: false },
  { id: uid(), text: '알고리즘 문제 풀기',          projId: 'p3', date: offsetDate(1),  startTime: '22:00', endTime: '23:00', done: false },
  { id: uid(), text: '블로그 포스팅 작성',          projId: 'p3', date: offsetDate(2),  startTime: null,    endTime: null,    done: false },
]

const DEFAULT_FIXED_BLOCKS = [
  { id: 'fb1', name: '점심 시간', days: [0,1,2,3,4],     startTime: '12:00', endTime: '13:00', color: '#555' },
  { id: 'fb2', name: '저녁 식사', days: [0,1,2,3,4,5,6], startTime: '19:00', endTime: '20:00', color: '#444' },
]

// ── store factory ──────────────────────────────────────────
function buildInitialState(saved) {
  if (saved) {
    return {
      projects:    saved.projects    ?? DEFAULT_PROJECTS,
      tasks:       saved.tasks       ?? DEFAULT_TASKS,
      fixedBlocks: saved.fixedBlocks ?? DEFAULT_FIXED_BLOCKS,
      selectedDate: saved.selectedDate ?? today,
    }
  }
  return {
    projects:    DEFAULT_PROJECTS,
    tasks:       DEFAULT_TASKS,
    fixedBlocks: DEFAULT_FIXED_BLOCKS,
    selectedDate: today,
  }
}

// ── create store ───────────────────────────────────────────
// loadState is sync-friendly (localStorage), so we can call it inline.
// If migrating to Electron async IPC, initialize store with defaults then
// call loadState() and use store.setState(saved) after app mount.
let savedData = null
try {
  const raw = localStorage.getItem('schedule-manager-state')
  if (raw) savedData = JSON.parse(raw)
} catch (_) {}

const initial = buildInitialState(savedData)

const useStore = create((set, get) => {
  // Helper: save after every mutation
  const persist = (patch) => {
    const next = { ...get(), ...patch }
    saveState(next)
    return patch
  }

  return {
    // ── state ──────────────────────────────────────────────
    ...initial,
    // UI-only state (not persisted)
    currentPage: 'dashboard',
    selectedProjectId: null,

    // ── navigation ─────────────────────────────────────────
    setPage: (page, projectId = null) =>
      set({ currentPage: page, selectedProjectId: projectId }),

    // ── selected date (shared across dashboard ↔ project) ──
    setSelectedDate: (date) =>
      set(persist({ selectedDate: date })),

    // ── projects ───────────────────────────────────────────
    addProject: (project) =>
      set(s => persist({ projects: [...s.projects, { ...project, id: uid() }] })),

    updateProject: (id, updates) =>
      set(s => persist({ projects: s.projects.map(p => p.id === id ? { ...p, ...updates } : p) })),

    deleteProject: (id) =>
      set(s => persist({
        projects: s.projects.filter(p => p.id !== id),
        tasks:    s.tasks.filter(t => t.projId !== id),
      })),

    // ── tasks ──────────────────────────────────────────────
    addTask: (task) =>
      set(s => persist({ tasks: [...s.tasks, { ...task, id: uid(), done: false }] })),

    toggleTask: (id) =>
      set(s => persist({ tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })),

    updateTask: (id, updates) =>
      set(s => persist({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) })),

    deleteTask: (id) =>
      set(s => persist({ tasks: s.tasks.filter(t => t.id !== id) })),

    // ── fixed blocks ───────────────────────────────────────
    addFixedBlock: (block) =>
      set(s => persist({ fixedBlocks: [...s.fixedBlocks, { ...block, id: uid() }] })),

    deleteFixedBlock: (id) =>
      set(s => persist({ fixedBlocks: s.fixedBlocks.filter(b => b.id !== id) })),
  }
})

export default useStore
