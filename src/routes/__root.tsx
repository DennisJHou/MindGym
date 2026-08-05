import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { RouterContext } from '../main'

// .app-frame：桌面網頁版的「手機外框」容器（詳見 index.css）。App 版完全
// 不受影響，寬度行為與新增前一致；只有網頁版會把整個 App 收窄到手機寬度
// 並置中，避免練習頁的滿版出血封面圖在寬螢幕上被撐到異常巨大。
export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div className="app-frame frame-width">
      <Outlet />
    </div>
  ),
})
