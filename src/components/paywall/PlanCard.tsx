// 付費牆的方案卡（規格 §5.1.4）。
//
// 版面規則：
//   - 年繳卡在上、預設選中，用品牌主色粗邊框 + 淺色填充做高亮
//   - 年繳主字級是「每月只要 NT$66」，年費放在下方較小字級
//   - 月繳卡中性描邊、無填色
//   - 兩個價格必須同時可見（規格明令不可用切換開關或滑桿藏起其中一個）
//
// 無障礙：整組卡片是一個 radiogroup，每張卡是 radio；aria-label 一次唸出
// 「方案名稱＋實際金額＋計費週期」，讓螢幕閱讀器不會只唸到「每月只要」這種殘句。
import { useLanguage } from '../../lib/i18n/context'
import {
  type PricingPlan,
  effectiveAmountCents,
  formatAmount,
  monthlyEquivalent,
  savingsPercent,
} from '../../lib/pricing'

interface PlanCardProps {
  plan: PricingPlan
  selected: boolean
  onSelect: () => void
  /** 創始價是否生效（名額還有、後台開關開著） */
  useFounding: boolean
  /** 年繳卡用來算「省 n%」的月繳方案 */
  comparisonPlan?: PricingPlan
  /** 創始名額剩餘數；null 代表查不到，此時不顯示徽章 */
  foundingSeatsRemaining: number | null
  /** 創始名額總數，用於「前 n 名創始會員永久鎖價」副標 */
  foundingQuotaTotal: number
}

export function PlanCard({
  plan,
  selected,
  onSelect,
  useFounding,
  comparisonPlan,
  foundingSeatsRemaining,
  foundingQuotaTotal,
}: PlanCardProps) {
  const { t } = useLanguage()
  const isYearly = plan.period === 'year'
  const amountCents = effectiveAmountCents(plan, useFounding)
  const fullPrice = formatAmount(amountCents, plan.currency)

  // 年繳以「每月等價」為主要呈現；月繳直接呈現月費。
  const headline = isYearly
    ? t('每月只要 {price}', { price: monthlyEquivalent(plan, useFounding) })
    : t('{price}／月', { price: fullPrice })

  // 年繳副標：創始價生效時用規格 §7 的鎖價說法，否則呈現省下的比例。
  let subline: string | null = null
  if (isYearly) {
    if (useFounding) {
      subline = t('{price}／年・前 {n} 名創始會員永久鎖價', { price: fullPrice, n: foundingQuotaTotal })
    } else {
      const saved = savingsPercent(plan, comparisonPlan, useFounding)
      subline = saved != null && saved > 0
        ? t('{price}／年・省 {n}%', { price: fullPrice, n: saved })
        : t('{price}／年', { price: fullPrice })
    }
  }

  const showBadge = isYearly && useFounding && foundingSeatsRemaining != null

  // 螢幕閱讀器唸的是實際金額與週期，不是視覺上的縮寫。
  const periodLabel = isYearly ? t('每年') : t('每月')
  const ariaLabel = `${fullPrice} ${periodLabel}`

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      className={`relative w-full rounded-3xl px-5 py-4 text-left transition active:scale-[0.99] ${
        selected
          ? 'border-2 border-primary bg-primary-soft shadow-soft'
          : 'border border-border bg-card'
      }`}
    >
      {showBadge && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-gold px-3 py-1 text-[11px] font-extrabold text-ink-deep shadow-soft">
          {t('創始會員・剩 {n} 位', { n: foundingSeatsRemaining })}
        </span>
      )}

      <div className="flex items-center gap-3">
        {/* 選取指示圓點 */}
        <span
          aria-hidden="true"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-primary' : 'border-border-strong'
          }`}
        >
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xl font-black leading-tight text-foreground">{headline}</span>
          {subline && (
            <span className="mt-1 block text-xs font-semibold leading-snug text-muted-foreground">
              {subline}
            </span>
          )}
        </span>
      </div>
    </button>
  )
}
