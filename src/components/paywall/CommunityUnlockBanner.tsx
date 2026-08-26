// 社群「貢獻換觀看」狀態列（規格 §4.6）。
//
// 免費會員當週發過 1 則自己的紀錄就解鎖當週無限瀏覽；沒發過只能看 3 則。
// 這個元件純粹顯示狀態——真正的把關在 supabase/subscriptions.sql 的
// RLS policy 與 get_community_preview()，不是這裡。
//
// ⚠️ 規格 §5.3：不製造急迫感，所以這裡只陳述「怎麼解鎖」，不倒數、不警示。
import { track } from '../../lib/analytics'
import { useEffect } from 'react'
import { useLanguage } from '../../lib/i18n/context'
import type { Entitlements } from '../../lib/entitlements'

interface CommunityUnlockBannerProps {
  entitlements: Entitlements | null
}

export function CommunityUnlockBanner({ entitlements }: CommunityUnlockBannerProps) {
  const { t } = useLanguage()
  const unlocked = entitlements?.community.unlocked ?? false
  const isPro = entitlements?.is_pro ?? false

  useEffect(() => {
    if (entitlements && !unlocked) track('community_lock_shown')
  }, [entitlements, unlocked])

  // 付費會員本來就無限瀏覽，不需要看到任何解鎖說明。
  if (!entitlements || isPro) return null

  if (unlocked) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-tile-mint px-4 py-2.5">
        <CheckIcon />
        <p className="text-xs font-bold text-foreground">{t('本週已解鎖，可以無限瀏覽')}</p>
      </div>
    )
  }

  return (
    <div className="mb-3 rounded-2xl bg-cream px-4 py-3 shadow-soft">
      <p className="text-sm font-bold leading-relaxed text-foreground">
        {t('這週分享 1 則你的紀錄，就能無限瀏覽大家的故事。')}
      </p>
    </div>
  )
}

function CheckIcon() {
  return (
    <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card">
      <svg className="h-3 w-3 text-[#71744F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  )
}
