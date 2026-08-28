// 社群動態的「封頂區塊」——免費會員滑到預覽上限時看到的東西。
//
// 為什麼需要這個元件：
//   在此之前，免費會員滑到底看到的是「已經看完所有打卡紀錄囉！」——那是**假的**，
//   後面還有很多貼文，只是被 RLS 鎖住。使用者因此以為 App 壞掉、或紀錄不見了。
//   這個區塊把那句謊話換成事實：還有幾則、以及兩種看下去的方法。
//
// 兩條路都給，不是只給付費那條：
//   1. 本週分享 1 則自己的紀錄 → 免費解鎖當週（規格 §1.1 的「貢獻換觀看」）
//   2. 申請加入創始成員
//
// 視覺上用幾張模糊卡片暗示「下面還有東西」。這些卡片刻意**不放任何真實貼文內容**——
// 未解鎖者本來就讀不到那些資料，硬要顯示等於繞過 RLS；這裡只做形狀，不假裝是特定內容。
import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { track } from '../../lib/analytics'
import { useLanguage } from '../../lib/i18n/context'

interface CommunityLockedFooterProps {
  /** 還沒看到的則數；null 代表數字查不到（此時不顯示數字，只顯示解鎖引導） */
  remaining: number | null
}

export function CommunityLockedFooter({ remaining }: CommunityLockedFooterProps) {
  const { t } = useLanguage()

  useEffect(() => {
    track('community_lock_shown', { placement: 'feed_footer', remaining })
  }, [remaining])

  return (
    <div className="pt-4">
      {/* 模糊卡片區：固定高度 + overflow-hidden，讓卡片「被切斷」而不是整塊淡到看不見。
          用意是讓人一眼看出下面還有內容，所以卡片本身要清楚可見，只是讀不到字。 */}
      <div aria-hidden="true" className="relative h-[250px] select-none overflow-hidden">
        <div className="pointer-events-none flex flex-col gap-4 blur-[5px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-3 w-24 rounded-full bg-muted" />
                  <div className="mt-1.5 h-2.5 w-16 rounded-full bg-muted/70" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="h-3 w-full rounded-full bg-muted" />
                <div className="h-3 w-[85%] rounded-full bg-muted" />
                <div className="h-3 w-[60%] rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
        {/* 只在下半部淡出，上半部維持清楚，銜接到下方的解鎖引導 */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>

      {/* 解鎖引導：接在模糊卡片正下方，也就是使用者卡住的那個當下 */}
      <div className="text-center">
        {remaining != null && remaining > 0 && (
          <p className="text-lg font-black leading-snug text-foreground">
            {t('還有 {n} 則故事你還沒看到', { n: remaining.toLocaleString('zh-TW') })}
          </p>
        )}
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {t('這週分享 1 則你的紀錄，就能免費看完；或加入創始成員，隨時都能看。')}
        </p>

        <Link
          to="/paywall"
          className="mt-4 flex w-full items-center justify-center rounded-full bg-gradient-primary py-3.5 text-base font-extrabold text-primary-foreground shadow-soft transition active:scale-[0.98]"
        >
          {t('現在解鎖，馬上繼續看')}
        </Link>

        <Link
          to="/app/gratitude"
          className="mt-3 inline-block text-xs font-semibold text-muted-foreground underline"
        >
          {t('先去寫一則，免費解鎖這週')}
        </Link>
      </div>
    </div>
  )
}
