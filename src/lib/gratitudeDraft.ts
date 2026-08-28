import type { Privacy } from './privacy'
import type { Difficulty, GratitudeItems } from './gratitudeEntry'

// 感恩日記草稿：寫完三件事後常常會先按「分享圖片」，iOS 把使用者帶到 IG／LINE，
// 回來時 WKWebView 可能已經被系統回收重載——過去整份日記只活在 React state 裡，
// 一重載就全沒了，而且那時候還沒寫進資料庫（存檔發生在按「繼續」進入結束頁時）。
//
// 對策：邊寫邊把草稿存在這台裝置上。
//   • 兩小時內回來 → 直接回到原本那一頁繼續寫（RESUME_WINDOW_MS）。
//   • 超過兩小時 → 由 flushStaleGratitudeDraft 自動存檔成「僅限本人」，
//     讓內容至少留在「我的貼文」與「我的健心日記」，不會白寫（見 gratitudeEntry）。

const PREFIX = 'gratitude-draft:'
const NOTICE_PREFIX = 'gratitude-auto-saved:'

/** 兩小時內回到 App，就當作同一次書寫，直接接回原本的畫面。 */
export const RESUME_WINDOW_MS = 2 * 60 * 60 * 1000

export type DraftStage = 'WRITING' | 'SUMMARY'

export interface GratitudeDraft {
  stage: DraftStage
  difficulty: Difficulty
  items: GratitudeItems
  /** 使用者選的日記日期（YYYY-MM-DD，當地時區） */
  entryDate: string
  privacy: Privacy
}

interface StoredDraft extends GratitudeDraft {
  savedAt: number
}

export interface LoadedDraft {
  draft: GratitudeDraft
  savedAt: number
  /** true＝超過兩小時沒回來，該自動存檔而不是接回畫面 */
  isStale: boolean
}

export function gratitudeDraftKey(userId: string | undefined): string {
  return `${PREFIX}${userId ?? 'anon'}`
}

export function hasContent(items: GratitudeItems): boolean {
  return [items.item_1, items.item_2, items.item_3].some((s) => s.trim() !== '')
}

function isItems(value: unknown): value is GratitudeItems {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (['item_1', 'item_2', 'item_3'] as const).every((k) => typeof v[k] === 'string')
}

export function loadGratitudeDraft(key: string): LoadedDraft | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredDraft
    if (!isItems(parsed?.items) || typeof parsed.savedAt !== 'number') return null
    if (!hasContent(parsed.items)) return null
    return {
      draft: {
        stage: parsed.stage === 'SUMMARY' ? 'SUMMARY' : 'WRITING',
        difficulty: parsed.difficulty === 'advanced' ? 'advanced' : 'basic',
        items: parsed.items,
        entryDate: typeof parsed.entryDate === 'string' ? parsed.entryDate : '',
        privacy: parsed.privacy ?? 'community',
      },
      savedAt: parsed.savedAt,
      isStale: Date.now() - parsed.savedAt > RESUME_WINDOW_MS,
    }
  } catch {
    return null
  }
}

export function saveGratitudeDraft(key: string, draft: GratitudeDraft): void {
  try {
    if (!hasContent(draft.items)) {
      localStorage.removeItem(key)
      return
    }
    const payload: StoredDraft = { ...draft, savedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // 無痕模式／配額滿：存不了也不能影響書寫
  }
}

export function clearGratitudeDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // 同上
  }
}

// ── 自動存檔後的一次性告知 ────────────────────────────────────────────────
// 系統代替使用者寫入資料，一定要讓他知道；旗標讀過就清掉，只提示一次。

export function markAutoSaved(userId: string | undefined, entryDate: string): void {
  try {
    localStorage.setItem(`${NOTICE_PREFIX}${userId ?? 'anon'}`, entryDate)
  } catch {
    // 提示不到就算了，資料本身已經存起來了
  }
}

export function takeAutoSavedNotice(userId: string | undefined): string | null {
  try {
    const key = `${NOTICE_PREFIX}${userId ?? 'anon'}`
    const value = localStorage.getItem(key)
    if (value) localStorage.removeItem(key)
    return value
  } catch {
    return null
  }
}
