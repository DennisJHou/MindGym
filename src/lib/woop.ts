// ─────────────────────────────────────────────────────────────────────────
// WOOP 首頁提醒卡的共用資料層。
//
// WOOP 貼文跟其他練習一樣寫在 gratitude_entries（practice_type='woop'），沒有
// 額外的表——「今天做到了」直接把 done/done_at 併進同一列的 payload jsonb 更新，
// 不需要新的 migration，使用者不用跑任何 SQL 就能用。
//
// 首頁只認「使用者自己的」WOOP（不管有沒有分享到社群）：這是他對自己的承諾，
// 跟社群分享是兩回事，所以查詢不篩 is_shared，全靠 RLS「本人可讀」擋別人的。
// ─────────────────────────────────────────────────────────────────────────
import { supabase } from './supabase'
import { isoLocalDate } from './date'

export type WoopReminder = {
  id: string
  wish: string
  outcome: string
  obstacle: string
  plan: string
  targetDate: string // YYYY-MM-DD
  done: boolean
}

/**
 * 抓「目標日期是今天」的所有 WOOP（可能不只一則——同一天寫了好幾個 if-then）。
 * 依建立時間新到舊排序。這個查詢本身就是提醒卡的生命週期：明天再查，昨天設定的
 * （target_date 已不是今天）自然就查不到、安靜消失——不需要額外的清除或標記過期
 * 邏輯。
 */
export async function fetchTodayWoopReminders(userId: string): Promise<WoopReminder[]> {
  const today = isoLocalDate(new Date())
  const { data, error } = await supabase
    .from('gratitude_entries')
    .select('id, payload')
    .eq('user_id', userId)
    .eq('practice_type', 'woop')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error || !data) {
    if (error) console.error('[woop reminder fetch]', error)
    return []
  }
  // target_date 存在 jsonb payload 裡，PostgREST 篩選 jsonb 欄位在 payload 尚未
  // 建立時會整個查詢失敗（欄位不存在），所以改為抓最近幾則後在前端篩，migration
  // 未跑時也不會整張卡壞掉、只是篩不出東西、卡片不顯示。
  type Row = { id: string; payload: Record<string, unknown> | null }
  const rows = data as unknown as Row[]
  return rows
    .filter((r) => r.payload?.v === 'woop' && r.payload?.target_date === today)
    .map((r) => {
      const p = r.payload as Record<string, unknown>
      return {
        id: r.id,
        wish: (p.wish as string) ?? '',
        outcome: (p.outcome as string) ?? '',
        obstacle: (p.obstacle as string) ?? '',
        plan: (p.plan as string) ?? '',
        targetDate: today,
        done: p.done === true,
      }
    })
}

// 完成當天的 WOOP：成就力 +5（跟完成頁的加分一致），不做連續天數、不記錄「沒做到」。
const DONE_ACCOMPLISHMENT_DELTA = 5

/**
 * 標記今天的 WOOP 已完成：更新該筆的 payload.done/done_at，並累加成就力經驗值。
 * 用 payload.done 本身當防重複領取的鎖——已經是 true 就不重複加分，
 * 就算按鈕沒被 disabled 擋住（例如兩個分頁同時按）也不會重複核發。
 */
export async function markWoopDone(userId: string, entryId: string): Promise<boolean> {
  try {
    const { data: row, error: fetchErr } = await supabase
      .from('gratitude_entries')
      .select('payload')
      .eq('id', entryId)
      .eq('user_id', userId)
      .maybeSingle()
    if (fetchErr || !row) {
      console.error('[woop markDone] fetch', fetchErr)
      return false
    }
    const payload = (row.payload as Record<string, unknown> | null) ?? {}
    if (payload.done === true) return true // 已經領過，視為成功但不重複加分

    const { error: updateErr } = await supabase
      .from('gratitude_entries')
      .update({ payload: { ...payload, done: true, done_at: new Date().toISOString() } })
      .eq('id', entryId)
      .eq('user_id', userId)
    if (updateErr) {
      console.error('[woop markDone] update', updateErr)
      return false
    }

    const { error: xpErr } = await supabase.rpc('increment_perma_xp', {
      p_user_id: userId,
      p_delta_a: DONE_ACCOMPLISHMENT_DELTA,
    })
    if (xpErr) console.warn('[woop markDone] increment_perma_xp 尚未建立，本次未累加經驗值', xpErr)
    return true
  } catch (e) {
    console.error('[woop markDone]', e)
    return false
  }
}
