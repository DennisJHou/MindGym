import type { NarrativeAnswers } from '../components/pretest/types'

// InMind 測驗草稿：五題敘事作答很長（每題至少 30 字，實際常常好幾百字），
// 但過去只存在 React state 裡——AI 回報失敗後按返回、App 被系統回收、或
// WebView 重新載入，整份心血就沒了（TestFlight 回饋：「填了好久結果又要我
// 重新填」）。這裡把作答隨打隨存到 localStorage，回到測驗時自動接回原處。
//
// 只存在這台裝置上、按使用者 id 分開，成功送出報告後立刻清掉。

const PREFIX = 'inmind-draft:'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 七天沒回來就當作放棄，避免舊答案突然冒出來

export interface QuizDraft {
  answers: NarrativeAnswers
  step: number
}

interface StoredDraft extends QuizDraft {
  savedAt: number
}

export function quizDraftKey(userId: string | undefined): string {
  return `${PREFIX}${userId ?? 'anon'}`
}

function isAnswers(value: unknown): value is NarrativeAnswers {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (['P', 'E', 'R', 'M', 'A'] as const).every((k) => typeof v[k] === 'string')
}

export function loadQuizDraft(key: string): QuizDraft | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDraft
    if (!isAnswers(parsed?.answers)) return null
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    // 全空的草稿沒有意義（例如只是開了測驗又離開）
    if (!Object.values(parsed.answers).some((text) => text.trim() !== '')) return null
    const step = typeof parsed.step === 'number' ? Math.min(Math.max(parsed.step, 0), 4) : 0
    return { answers: parsed.answers, step }
  } catch {
    return null
  }
}

export function saveQuizDraft(key: string, draft: QuizDraft): void {
  try {
    const payload: StoredDraft = { ...draft, savedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // 無痕模式／配額滿：存不了就算了，不能影響作答
  }
}

export function clearQuizDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // 同上
  }
}
