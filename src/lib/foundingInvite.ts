// ─────────────────────────────────────────────────────────────────────────
// 「完成任一健心模組後邀請加入創始成員」——一個使用者一輩子只跳一次。
//
// 用 profiles.founding_invite_shown_at 的 update-if-null 當搶占鎖：
// 同時間兩個分頁各自完成一個模組時，只有先送到的那個 update 會真的改到列
//（WHERE founding_invite_shown_at IS NULL），後到的那個 update 會 0 rows，
// 藉此保證同一使用者最多只會被判定「該顯示」一次，不必額外查一次再寫一次。
// ─────────────────────────────────────────────────────────────────────────
import { supabase } from './supabase'
import { FREE_FALLBACK, fetchEntitlements } from './entitlements'

/** 已經是創始成員的人、或已經看過邀請的人，回傳 false；第一次符合資格的人回傳 true 並就地標記。 */
export async function claimFoundingInvite(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user.id
  if (!userId) return false

  const ent = await fetchEntitlements()
  if (ent !== FREE_FALLBACK && ent.is_founding_member) return false

  const { data, error } = await supabase
    .from('profiles')
    .update({ founding_invite_shown_at: new Date().toISOString() })
    .eq('id', userId)
    .is('founding_invite_shown_at', null)
    .select('id')
  if (error) {
    console.error('[founding invite] 標記失敗', error)
    return false
  }
  return (data?.length ?? 0) > 0
}
