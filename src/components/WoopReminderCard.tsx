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
//   • 按鈕是滿版寬度，整條都是點擊範圍，不用另外標示「點這裡打勾」。
//   • 打勾後「這一次」造訪仍留著看打勾回饋，但下一次重新進首頁（重新 fetch）
//     就整張消失——用「這次進來時、後端原本就是 done」跟「這次進來後才點的」
//     兩種狀態區分，只有前者才會被濾掉。
//   • 同一天可能寫了不只一個 WOOP：用左右滑動的小卡片（scroll-snap，原生手勢，
//     不用額外的手勢函式庫）切換，不佔用額外的版面高度；只有一則時完全不顯示
//     滑動相關的 UI，跟過去單張卡片的樣子一致。
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../lib/i18n/context'
import { fetchTodayWoopReminders, markWoopDone, type WoopReminder } from '../lib/woop'

function assembleIfThen(t: (s: string, v?: Record<string, string | number>) => string, obstacle: string, plan: string): string {
  const o = obstacle.trim() || '＿＿＿＿＿'
  const p = plan.trim() || '＿＿＿＿＿'
  return t('如果{o}，那麼我就{p}。', { o, p })
}

export function WoopReminderCard({ userId }: { userId: string | null }) {
  const [reminders, setReminders] = useState<WoopReminder[]>([])
  // 這次進首頁「一開始」就已經是 done 的那些 id——這些要整張濾掉不顯示。
  // 這次造訪期間才從 false 點成 true 的，不在這個集合裡，會繼續顯示打勾態。
  const [initiallyDoneIds, setInitiallyDoneIds] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoaded(true)
      return
    }
    let cancelled = false
    fetchTodayWoopReminders(userId).then((list) => {
      if (!cancelled) {
        setReminders(list)
        setInitiallyDoneIds(new Set(list.filter((r) => r.done).map((r) => r.id)))
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const updateReminder = (id: string, patch: Partial<WoopReminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  if (!loaded || !userId) return null

  const visible = reminders.filter((r) => !initiallyDoneIds.has(r.id))
  if (visible.length === 0) return null

  if (visible.length === 1) {
    return (
      <div className="animate-fade-up mt-4">
        <WoopReminderPage
          reminder={visible[0]}
          userId={userId}
          onChange={(patch) => updateReminder(visible[0].id, patch)}
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-up mt-4">
      <WoopReminderCarousel reminders={visible} userId={userId} onChange={updateReminder} />
    </div>
  )
}

// 多則時的滑動輪播：原生 scroll-snap，不佔用額外版面高度（跟單張卡片同高，
// 高度由最高的那一頁決定，flex 預設 stretch 讓每一頁都撐滿）。
function WoopReminderCarousel({
  reminders,
  userId,
  onChange,
}: {
  reminders: WoopReminder[]
  userId: string
  onChange: (id: string, patch: Partial<WoopReminder>) => void
}) {
  const { t } = useLanguage()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActiveIdx(Math.max(0, Math.min(reminders.length - 1, idx)))
  }

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scroll flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
      >
        {reminders.map((reminder) => (
          <div key={reminder.id} className="w-full shrink-0 snap-center">
            <WoopReminderPage
              reminder={reminder}
              userId={userId}
              onChange={(patch) => onChange(reminder.id, patch)}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="sr-only">{t('今天有 {n} 則 WOOP，左右滑動查看', { n: reminders.length })}</span>
        {reminders.map((reminder, i) => (
          <span
            key={reminder.id}
            aria-hidden
            className={`h-2 rounded-full transition-all ${
              i === activeIdx ? 'w-6 bg-primary' : 'w-2 bg-[#542916]/25'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// 卡片本體（單則的樣子），輪播與單則共用同一份版型。
function WoopReminderPage({
  reminder,
  userId,
  onChange,
}: {
  reminder: WoopReminder
  userId: string
  onChange: (patch: Partial<WoopReminder>) => void
}) {
  const { t } = useLanguage()
  const [marking, setMarking] = useState(false)

  const handleDone = async () => {
    if (marking || reminder.done) return
    setMarking(true)
    // 樂觀更新：先讓打勾的回饋立即發生，失敗再靜默復原，不讓使用者等網路。
    onChange({ done: true })
    const ok = await markWoopDone(userId, reminder.id)
    if (!ok) onChange({ done: false })
    setMarking(false)
  }

  return (
    <div className="rounded-3xl bg-gradient-soft p-5 shadow-soft">
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
