import { useEffect, useRef, useState } from 'react'
import { getScrollTop, onScroll } from './scrollContainer'

// 偵測視窗捲動方向：往下捲回傳 true（適合用來收起工具列），往上捲回傳 false（跳出）。
// 加上一段緩衝距離，避免頁面輕微彈跳或觸控回彈就誤判方向（比照 Facebook 的捲動體驗）。
// 捲動來源由 scrollContainer 決定（網頁版 = window，App 版 = .app-frame 容器）。
export function useScrollDirection(active: boolean, threshold = 8): boolean {
  const [scrolledDown, setScrolledDown] = useState(false)
  const lastYRef = useRef(0)

  useEffect(() => {
    if (!active) {
      setScrolledDown(false)
      return
    }
    lastYRef.current = getScrollTop()
    return onScroll(() => {
      const y = getScrollTop()
      const diff = y - lastYRef.current
      if (Math.abs(diff) < threshold) return
      // 頁面最上方一律視為「往上捲」，避免一進頁面就被誤判收起。
      setScrolledDown(diff > 0 && y > 40)
      lastYRef.current = y
    })
  }, [active, threshold])

  return scrolledDown
}
