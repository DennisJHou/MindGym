// ─────────────────────────────────────────────────────────────────────────
// 權益（entitlements）—— client 端的唯一來源是伺服器
//
// ⚠️ 這個檔案回傳的東西「只能拿來決定畫面怎麼顯示」，不能當成安全邊界。
//    真正的把關在三個地方，全部在伺服器：
//      1. supabase/subscriptions.sql 的 RLS policy（社群貼文讀取權）
//      2. get_my_entitlements() SECURITY DEFINER RPC（對象固定 auth.uid()）
//      3. backend/app.py 的額度檢查（週分析、基線重測，超額回 402）
//    使用者在 devtools 改本機狀態頂多讓自己看到一個按鈕，按下去伺服器照樣擋。
// ─────────────────────────────────────────────────────────────────────────
import { supabase } from './supabase'

export type Tier = 'anonymous' | 'free' | 'pro' | 'pass'

export interface Entitlements {
  tier: Tier
  status: string
  is_pro: boolean
  is_founding_member: boolean
  expires_at: string | null
  weekly_analysis: {
    period: 'week' | 'month'
    period_start: string
    limit: number
    used: number
    remaining: number
  }
  community: {
    unlimited: boolean
    unlocked: boolean
    contributed_this_week: boolean
    free_view_limit: number
  }
  baseline_assessment: {
    used: number
    can_retake: boolean
  }
  can_view_trends: boolean
  can_view_growth_comparison: boolean
}

// 拿不到權益時的保守預設：一律當免費層，且額度視為已用完。
// 寧可多顯示一次付費牆，也不要因為查詢失敗就把付費功能送出去。
export const FREE_FALLBACK: Entitlements = {
  tier: 'free',
  status: 'active',
  is_pro: false,
  is_founding_member: false,
  expires_at: null,
  weekly_analysis: { period: 'month', period_start: '', limit: 1, used: 1, remaining: 0 },
  community: { unlimited: false, unlocked: false, contributed_this_week: false, free_view_limit: 15 },
  baseline_assessment: { used: 1, can_retake: true },
  can_view_trends: false,
  can_view_growth_comparison: false,
}

// 同一次頁面停留內重複問同一份權益很常見（多個元件各自要用），
// 這裡做極短命的快取：避免同一畫面連打好幾次 RPC，但也不會拿到過期太久的狀態。
let cache: { at: number; value: Entitlements } | null = null
const CACHE_MS = 30_000

/** 讀取目前使用者的權益。查詢失敗一律回 FREE_FALLBACK（不會 throw）。 */
export async function fetchEntitlements(force = false): Promise<Entitlements> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.value

  const { data, error } = await supabase.rpc('get_my_entitlements')
  if (error || !data) {
    console.error('[entitlements] 取得權益失敗，退回免費層', error)
    return FREE_FALLBACK
  }

  const value = data as Entitlements
  cache = { at: Date.now(), value }
  return value
}

/** 權益可能改變時（生成報告、發文、登出）呼叫，讓下次讀取重新問伺服器。 */
export function invalidateEntitlements(): void {
  cache = null
}
