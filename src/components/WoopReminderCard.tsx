// ─────────────────────────────────────────────────────────────────────────
// 首頁「你今天的 If-Then」提醒卡。
//
// 這是使用者自己對自己寫下的承諾，放在首頁標題正下方、跑馬燈之前——比任何
// 系統推薦都優先。設計原則（跟使用者一起定案）：
//   • 只認「目標日期是今天」的 WOOP，查不到就整張卡不渲染，安靜收起來。
//   • 只記錄「做到了」，不記錄「沒做到」——沒打勾就是沒打勾，不變灰、不打叉、
//     不算失敗率，呼應 WOOP 進入頁的心態提醒「不是用來放大自己不足的工具」。
//   • 打勾當下立即樂觀更新＋成就力 +5（markWoopDone 內用 payload.done 當鎖，
//     不會重複核發），失敗就靜默重試下次再打，不擋住使用者。
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useLanguage } from '../lib/i18n/context'
import { fetchTodayWoopReminder, markWoopDone, type WoopReminder } from '../lib/woop'

function assembleIfThen(t: (s: string, v?: Record<string, string | number>) => string, obstacle: string, plan: string): string {
  const o = obstacle.trim() || '＿＿＿＿＿'
  const p = plan.trim() || '＿＿＿＿＿'
  return t('如果{o}，那麼我就{p}。', { o, p })
}

export function WoopReminderCard({ userId }: { userId: string | null }) {
  const { t } = useLanguage()
  const [reminder, setReminder] = useState<WoopReminder | null>(null)
  const [marking, setMarking] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoaded(true)
      return
    }
    let cancelled = false
    fetchTodayWoopReminder(userId).then((r) => {
      if (!cancelled) {
        setReminder(r)
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!loaded || !reminder || !userId) return null

  const handleDone = async () => {
    if (marking || reminder.done) return
    setMarking(true)
    // 樂觀更新：先讓打勾的回饋立即發生，失敗再靜默復原，不讓使用者等網路。
    setReminder({ ...reminder, done: true })
    const ok = await markWoopDone(userId, reminder.id)
    if (!ok) setReminder((cur) => (cur ? { ...cur, done: false } : cur))
    setMarking(false)
  }

  return (
    <div className="animate-fade-up mt-4 rounded-3xl bg-gradient-soft p-5 shadow-soft">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">{t('你今天的 If-Then')}</p>
      <p className="mt-2 whitespace-pre-wrap text-lg font-extrabold leading-relaxed text-foreground">
        {assembleIfThen(t, reminder.obstacle, reminder.plan)}
      </p>
      <p className="mt-1.5 truncate text-xs text-foreground/60">{reminder.wish}</p>

      <button
        type="button"
        onClick={handleDone}
        disabled={marking || reminder.done}
        aria-pressed={reminder.done}
        className={`mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-extrabold tracking-[0.1em] transition active:scale-[0.98] ${
          reminder.done
            ? 'bg-primary/15 text-primary'
            : 'bg-gradient-primary text-primary-foreground shadow-soft disabled:opacity-60'
        }`}
      >
        {reminder.done ? (
          <>
            <CheckIcon />
            {t('今天做到了！')}
          </>
        ) : (
          t('今天做到了')
        )}
      </button>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
