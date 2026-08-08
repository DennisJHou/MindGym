// 一週回顧：健心日記底部入口框 ＋ 獨立回顧頁共用的資料查詢。
// 次數、留言、感恩全文、對象分佈、常見詞彙全部前端直查既有資料表（target_1..3／tag_1..3
// 是既有結構化欄位，寫日記當下就由 AI 標好了，這裡純統計不必再呼叫 AI）。
// 只有「常見情緒」需要讀原文判斷，交給後端 /api/reviews/weekly-digest（見 reviews.ts）。
import { supabase } from './supabase'
import { isoLocalDate } from './date'
import type { LifeThemeKey, WeeklyDigestContent } from './reviews'

/** 該日期所在週的週日（本地時區），與 reviews.ts 的 mondayOf 搭配使用。 */
export function sundayOf(monday: Date): Date {
  const d = new Date(monday)
  d.setDate(d.getDate() + 6)
  return d
}

export interface WeeklyCounts {
  gratitudeCount: number
  processCount: number
  selfCompassionCount: number
  woopCount: number
}

export interface WeeklyComment {
  id: string
  entryId: string
  content: string
  createdAt: string
  anonName: string | null
}

export interface WeeklyGratitudeEntry {
  id: string
  entryDate: string
  items: string[]
}

export interface WeeklyReviewData extends WeeklyCounts {
  periodStart: string
  periodEnd: string
  comments: WeeklyComment[]
  gratitudeEntries: WeeklyGratitudeEntry[]
  keywords: { label: string; count: number }[]
  fallbackThemes: NonNullable<WeeklyDigestContent['themes']>
  fallbackEmotionTrend: NonNullable<WeeklyDigestContent['emotion_trend']>
  fallbackEmotions: WeeklyDigestContent['emotions']
}

const EMOTION_LEXICON: { label: string; valence: 'positive' | 'negative' | 'neutral'; weight: number; words: string[] }[] = [
  // 「感謝」是感恩日記的必然用語，因此只給輕度正向權重，避免每篇都直接飽和到 +100。
  { label: '感恩', valence: 'positive', weight: 14, words: ['感謝', '感恩', 'thank', 'grateful'] },
  { label: '開心', valence: 'positive', weight: 24, words: ['開心', '快樂', '愉快', 'happy', 'joy'] },
  { label: '平靜', valence: 'positive', weight: 20, words: ['平靜', '安心', '踏實', 'calm', 'peaceful'] },
  { label: '感動', valence: 'positive', weight: 24, words: ['感動', '溫暖', '貼心', 'touched', 'moved'] },
  { label: '有成就感', valence: 'positive', weight: 22, words: ['成就', '進度', '完成', '進步', 'progress', 'accomplish'] },
  { label: '順利', valence: 'positive', weight: 20, words: ['順利', '順心', '有效率', '成功', 'efficient', 'smooth', 'successful'] },
  { label: '喜愛', valence: 'positive', weight: 20, words: ['喜歡', '好喝', '享受', 'love', 'enjoy'] },
  { label: '新鮮感', valence: 'positive', weight: 18, words: ['新鮮', '驚喜', '新奇', 'novel'] },
  { label: '放鬆', valence: 'positive', weight: 22, words: ['放鬆', '舒服', '舒適', 'relaxed', 'comfortable'] },
  { label: '期待', valence: 'positive', weight: 22, words: ['期待', '希望', '興奮', 'hopeful', 'excited'] },
  { label: '壓力', valence: 'negative', weight: -32, words: ['壓力', '緊繃', 'stress', 'stressed'] },
  { label: '焦慮', valence: 'negative', weight: -32, words: ['焦慮', '擔心', '不安', 'anxious', 'worry'] },
  { label: '疲憊', valence: 'negative', weight: -28, words: ['疲憊', '累', '沒力', 'tired', 'exhausted'] },
  { label: '難過', valence: 'negative', weight: -34, words: ['難過', '失落', '悲傷', 'sad', 'upset'] },
  { label: '生氣', valence: 'negative', weight: -36, words: ['生氣', '憤怒', '煩躁', 'angry', 'frustrated'] },
  { label: '害怕', valence: 'negative', weight: -36, words: ['害怕', '恐懼', 'afraid', 'fear'] },
  { label: '專注', valence: 'neutral', weight: 0, words: ['專注', '投入', 'focus', 'focused'] },
]

const THEME_LEXICON: Record<Exclude<LifeThemeKey, 'other'>, string[]> = {
  work: ['工作', '學業', '會議', '同事', '專案', '客戶', '學校', 'work', 'meeting', 'project', 'client', 'school'],
  relationships: ['關係', '家人', '朋友', '伴侶', '女朋友', '男朋友', '父母', '同事', '夥伴', 'friend', 'family', 'partner', 'girlfriend', 'boyfriend', 'team'],
  health: ['健康', '身體', '運動', '跑步', '飲食', '生病', 'health', 'exercise', 'running', 'body'],
  rest: ['休息', '恢復', '睡眠', '睡覺', '放鬆', '假期', 'rest', 'sleep', 'relax', 'holiday'],
  growth: ['成長', '學習', '進步', '練習', '目標', '挑戰', '反思', 'learn', 'practice', 'progress', 'goal', 'growth'],
}

function countMatches(text: string, words: string[]): number {
  const lower = text.toLocaleLowerCase()
  return words.reduce((sum, word) => sum + (lower.includes(word.toLocaleLowerCase()) ? 1 : 0), 0)
}

function fallbackAnalysis(rows: { entry_date: unknown; item_1: unknown; item_2: unknown; item_3: unknown }[]): {
  themes: NonNullable<WeeklyDigestContent['themes']>
  trend: NonNullable<WeeklyDigestContent['emotion_trend']>
  emotions: WeeklyDigestContent['emotions']
} {
  const emotionCounts = new Map<string, { label: string; count: number; valence: 'positive' | 'negative' | 'neutral' }>()
  const themeCounts = new Map<LifeThemeKey, number>()
  const daily = new Map<string, { weightedScore: number; itemCount: number; labels: Map<string, number> }>()

  for (const row of rows) {
    const date = String(row.entry_date).slice(0, 10)
    const items = [row.item_1, row.item_2, row.item_3].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    for (const item of items) {
      const themeScores = (Object.entries(THEME_LEXICON) as [Exclude<LifeThemeKey, 'other'>, string[]][])
        .map(([key, words]) => ({ key, score: countMatches(item, words) }))
        .sort((a, b) => b.score - a.score)
      const theme: LifeThemeKey = themeScores[0]?.score > 0 ? themeScores[0].key : 'other'
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1)

      const day = daily.get(date) ?? { weightedScore: 0, itemCount: 0, labels: new Map<string, number>() }
      day.itemCount += 1
      const intensity = /(?:非常|很|極度|really|very)/i.test(item) ? 1.2 : 1
      for (const emotion of EMOTION_LEXICON) {
        const matches = countMatches(item, emotion.words)
        if (matches === 0) continue
        const current = emotionCounts.get(emotion.label) ?? { label: emotion.label, count: 0, valence: emotion.valence }
        current.count += matches
        emotionCounts.set(emotion.label, current)
        day.labels.set(emotion.label, (day.labels.get(emotion.label) ?? 0) + matches)
        day.weightedScore += matches * emotion.weight * intensity
      }
      daily.set(date, day)
    }
  }

  const themeLabels: Record<LifeThemeKey, string> = {
    work: '工作／學業', relationships: '人際關係', health: '身心健康',
    rest: '休息與恢復', growth: '自我成長', other: '生活日常',
  }
  const themes = Array.from(themeCounts.entries())
    .map(([key, count]) => ({ key, label: themeLabels[key], count }))
    .sort((a, b) => b.count - a.count)
  const emotions = Array.from(emotionCounts.values()).sort((a, b) => b.count - a.count).slice(0, 8)
  const trend = Array.from(daily.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, day]) => {
    // 依每天文字項目數縮放，保留不同情緒線索的強弱；±100 不作為備援常態值。
    const scaled = day.weightedScore / Math.sqrt(Math.max(1, day.itemCount))
    const score = Math.round(Math.max(-90, Math.min(90, scaled)))
    const label = Array.from(day.labels.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '平穩'
    return { date, score, label }
  })
  return { themes, trend, emotions }
}

/** 感恩次數 + 過程目標次數（本週範圍，date 型別以字串比較）。 */
export async function fetchWeeklyCounts(userId: string, monday: Date): Promise<WeeklyCounts> {
  const start = isoLocalDate(monday)
  const end = isoLocalDate(sundayOf(monday))

  const [gratitudeRes, focusRes, morningRes, selfCompassionRes, woopRes] = await Promise.all([
    supabase
      .from('gratitude_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('practice_type', 'gratitude')
      .gte('entry_date', start)
      .lte('entry_date', end),
    supabase
      .from('focus_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('log_date', start)
      .lte('log_date', end),
    supabase
      .from('morning_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('log_date', start)
      .lte('log_date', end),
    supabase
      .from('gratitude_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('practice_type', 'self_compassion')
      .gte('entry_date', start)
      .lte('entry_date', end),
    supabase
      .from('gratitude_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('practice_type', 'woop')
      .gte('entry_date', start)
      .lte('entry_date', end),
  ])

  return {
    gratitudeCount: gratitudeRes.count ?? 0,
    processCount: (focusRes.count ?? 0) + (morningRes.count ?? 0),
    selfCompassionCount: selfCompassionRes.count ?? 0,
    woopCount: woopRes.count ?? 0,
  }
}

/** 本週感恩日記的常提到詞彙：彙整 tag_1..3（寫日記當下已由 AI 標好的 2-4 字關鍵詞），依出現次數排序。 */
function keywordFrequency(tagRows: (string | null)[][]): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const tags of tagRows) {
    for (const tag of tags) {
      const label = tag?.trim()
      if (!label) continue
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

/** 完整週回顧頁資料：次數、感恩全文、對象分佈、常見詞彙、這週收到的留言。 */
export async function fetchWeeklyReviewData(userId: string, monday: Date): Promise<WeeklyReviewData> {
  const sunday = sundayOf(monday)
  const start = isoLocalDate(monday)
  const end = isoLocalDate(sunday)

  const weekStart = new Date(monday)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(sunday)
  weekEnd.setHours(23, 59, 59, 999)

  const [focusRes, morningRes, gratitudeWeekRes, allDiaryRes, myEntriesRes, selfCompassionRes, woopRes] = await Promise.all([
    supabase
      .from('focus_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('log_date', start)
      .lte('log_date', end),
    supabase
      .from('morning_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('log_date', start)
      .lte('log_date', end),
    supabase
      .from('gratitude_entries')
      .select('id, entry_date, item_1, item_2, item_3, tag_1, tag_2, tag_3')
      .eq('user_id', userId)
      .eq('practice_type', 'gratitude')
      .gte('entry_date', start)
      .lte('entry_date', end)
      .order('entry_date', { ascending: true }),
    supabase
      .from('gratitude_entries')
      .select('entry_date, item_1, item_2, item_3')
      .eq('user_id', userId)
      .gte('entry_date', start)
      .lte('entry_date', end)
      .order('entry_date', { ascending: true }),
    supabase.from('gratitude_entries').select('id').eq('user_id', userId),
    supabase
      .from('gratitude_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('practice_type', 'self_compassion')
      .gte('entry_date', start)
      .lte('entry_date', end),
    supabase
      .from('gratitude_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('practice_type', 'woop')
      .gte('entry_date', start)
      .lte('entry_date', end),
  ])

  const gratitudeRows = gratitudeWeekRes.data ?? []
  const gratitudeEntries: WeeklyGratitudeEntry[] = gratitudeRows.map((r) => ({
    id: r.id as string,
    entryDate: String(r.entry_date).slice(0, 10),
    items: [r.item_1, r.item_2, r.item_3].filter((v): v is string => !!v && v.trim().length > 0),
  }))

  const keywords = keywordFrequency(gratitudeRows.map((r) => [r.tag_1, r.tag_2, r.tag_3] as (string | null)[]))
  const fallback = fallbackAnalysis(allDiaryRes.data ?? [])

  const entryIds = (myEntriesRes.data ?? []).map((e) => e.id as string)

  let comments: WeeklyComment[] = []
  if (entryIds.length > 0) {
    const { data } = await supabase
      .from('comments')
      .select('id, entry_id, content, created_at, anon_name')
      .in('entry_id', entryIds)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())
      .order('created_at', { ascending: false })

    comments = (data ?? []).map((c) => ({
      id: c.id as string,
      entryId: c.entry_id as string,
      content: c.content as string,
      createdAt: c.created_at as string,
      anonName: (c.anon_name as string | null) ?? null,
    }))
  }

  return {
    gratitudeCount: gratitudeRows.length,
    processCount: (focusRes.count ?? 0) + (morningRes.count ?? 0),
    selfCompassionCount: selfCompassionRes.count ?? 0,
    woopCount: woopRes.count ?? 0,
    periodStart: start,
    periodEnd: end,
    comments,
    gratitudeEntries,
    keywords,
    fallbackThemes: fallback.themes,
    fallbackEmotionTrend: fallback.trend,
    fallbackEmotions: fallback.emotions,
  }
}
