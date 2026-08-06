// ─────────────────────────────────────────────────────────────────────────
// 「頁面捲動來源」的單一入口。
//
// 網頁版：整份文件在捲（捲動來源 = window）。
// App 版：改成由 .app-frame 這個內層容器在捲（見 index.css 的 native-app 區塊）。
//   原因：iOS WKWebView 的根捲動層是原生 UIScrollView，捲到頂／底時的橡皮筋
//   回彈會露出 WebView 自己的底色（capacitor.config.ts 的 #F0F6FF 淡藍），
//   CSS 的 overscroll-behavior 管不到那一層。把捲動搬進一般 DOM 容器後，
//   回彈就被關在容器內、露出的是容器自己的奶油底色，視覺上不再有空白。
//
// 任何需要讀捲動位置／監聽捲動的程式碼都應該走這裡，不要直接用 window.scrollY，
// 否則在 App 版會永遠讀到 0（document 已經不捲了）。
// ─────────────────────────────────────────────────────────────────────────
import { isNativeApp } from './nativeAuth'

// App 版的捲動容器；網頁版回傳 null 代表「捲動來源是 window」。
// .app-frame 由 __root.tsx 渲染，所以掛載後（effect 內）一定取得到。
export function getScrollElement(): HTMLElement | null {
  if (!isNativeApp()) return null
  return document.querySelector<HTMLElement>('.app-frame')
}

export function getScrollTop(): number {
  const el = getScrollElement()
  if (el) return el.scrollTop
  return window.scrollY || document.documentElement.scrollTop || 0
}

export function scrollToY(top: number, behavior: ScrollBehavior = 'auto'): void {
  const el = getScrollElement()
  if (el) el.scrollTo({ top, behavior })
  else window.scrollTo({ top, behavior })
}

// 監聽捲動，回傳解除監聽的函式（方便直接當 useEffect 的 cleanup）。
export function onScroll(handler: () => void): () => void {
  const target: HTMLElement | Window = getScrollElement() ?? window
  target.addEventListener('scroll', handler, { passive: true })
  return () => target.removeEventListener('scroll', handler)
}
