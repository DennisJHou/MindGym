// 首頁的一次性告知：系統代替使用者存了一篇感恩日記。
//
// 感恩日記寫到一半、按了分享圖片就沒再回來（WebView 被系統回收）超過兩小時的
// 草稿，會由 flushStaleGratitudeDraft 自動存成「僅限本人」。系統擅自寫入資料一定
// 要讓本人知道，否則哪天他在「我的貼文」看到一篇沒印象送出的日記會嚇一跳。
// 旗標讀過就清掉，只出現一次。
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useLanguage } from '../lib/i18n/context'
import { takeAutoSavedNotice } from '../lib/gratitudeDraft'

export function AutoSavedNotice({ userId }: { userId: string | null }) {
  const { t } = useLanguage()
  const [entryDate, setEntryDate] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    const check = () => {
      const value = takeAutoSavedNotice(userId)
      if (value) setEntryDate(value)
    }
    check()
    // 自動存檔是在 /app 掛載時跑的非同步流程，可能比這張卡片晚完成。
    window.addEventListener('gratitude-auto-saved', check)
    return () => window.removeEventListener('gratitude-auto-saved', check)
  }, [userId])

  if (!entryDate) return null

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card-cream px-4 py-3.5 shadow-soft">
      <p className="text-[14px] font-bold leading-relaxed text-foreground">
        {t('{date} 那篇沒送出的感恩日記，已經幫你存起來了', { date: entryDate })}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        {t('預設「僅限本人」，只有你看得到。想分享到打卡牆的話可以再改。')}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <Link
          to="/app/community"
          className="rounded-full bg-primary px-4 py-2 text-[13px] font-extrabold text-primary-foreground transition active:scale-95"
        >
          {t('去看看')}
        </Link>
        <button
          onClick={() => setEntryDate(null)}
          className="px-2 py-2 text-[13px] font-bold text-muted-foreground transition active:scale-95"
        >
          {t('知道了')}
        </button>
      </div>
    </div>
  )
}
