import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PrimaryCta } from './PrimaryCta'

export interface DateSwipeOption {
  iso: string
  label: string
  sublabel: string
  date: Date
}

const CARD_HEIGHT_REM = 3.75 // 60px
const TRACK_HEIGHT_REM = 13.125 // 3.5 個卡片高，讓上下各露出鄰近選項

/**
 * 日期選擇的 bottom sheet：卡片直向排列，靠原生 scroll-snap 做真手勢滑動
 * （上下拖曳，像日期滾輪），置中的卡片即為預選日期，按「確定」才套用並關閉。
 */
export function DateSwipeSheet({
  title,
  hint,
  confirmLabel,
  options,
  selectedIso,
  onClose,
  onConfirm,
}: {
  title: string
  hint: string
  confirmLabel: string
  options: DateSwipeOption[]
  selectedIso: string
  onClose: () => void
  onConfirm: (date: Date) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([])
  const initialIndex = Math.max(0, options.findIndex((o) => o.iso === selectedIso))
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  // 開啟當下把預選卡片直接置中，不要有滑動動畫。
  useLayoutEffect(() => {
    const track = trackRef.current
    const card = cardRefs.current[initialIndex]
    if (!track || !card) return
    track.scrollTop = card.offsetTop - (track.clientHeight - card.offsetHeight) / 2
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // sheet 開啟期間鎖住背景頁面，避免滾輪滑到底時把捲動接力給後面的頁面。
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function scrollToIndex(i: number, behavior: ScrollBehavior = 'smooth') {
    const track = trackRef.current
    const card = cardRefs.current[i]
    if (!track || !card) return
    track.scrollTo({ top: card.offsetTop - (track.clientHeight - card.offsetHeight) / 2, behavior })
  }

  function handleScroll() {
    const track = trackRef.current
    if (!track) return
    const center = track.scrollTop + track.clientHeight / 2
    let nearest = 0
    let nearestDist = Infinity
    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const dist = Math.abs(card.offsetTop + card.offsetHeight / 2 - center)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    setActiveIndex(nearest)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center overscroll-none bg-black/40"
      style={{ touchAction: 'none' }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up w-full max-w-md rounded-t-3xl bg-card p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-extrabold text-foreground">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="relative">
          {/* 中央置中卡片的視覺提示框，卡片滑到裡面即為預選 */}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-2xl bg-primary/10 ring-1 ring-primary"
            style={{ height: `${CARD_HEIGHT_REM}rem` }}
          />
          <div
            ref={trackRef}
            onScroll={handleScroll}
            style={{ height: `${TRACK_HEIGHT_REM}rem`, touchAction: 'pan-y' }}
            className="no-scrollbar flex snap-y snap-mandatory flex-col gap-2 overflow-y-auto overscroll-contain scroll-smooth py-[calc((13.125rem-3.75rem)/2)]"
          >
            {options.map((opt, i) => {
              const active = i === activeIndex
              return (
                <button
                  key={opt.iso}
                  ref={(el) => { cardRefs.current[i] = el }}
                  type="button"
                  onClick={() => { setActiveIndex(i); scrollToIndex(i) }}
                  style={{ height: `${CARD_HEIGHT_REM}rem` }}
                  className={`flex shrink-0 snap-center flex-col items-center justify-center gap-0.5 rounded-2xl px-3 text-center transition ${
                    active ? 'text-foreground' : 'text-muted-foreground opacity-60'
                  }`}
                >
                  <span className="text-sm font-bold">{opt.label}</span>
                  <span className="text-[11px]">{opt.sublabel}</span>
                </button>
              )
            })}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/70">{hint}</p>

        <div className="mt-4">
          <PrimaryCta variant="done" onClick={() => onConfirm(options[activeIndex].date)}>
            {confirmLabel}
          </PrimaryCta>
        </div>
      </div>
    </div>
  )
}
