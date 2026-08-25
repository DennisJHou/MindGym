// 獨立的付費方案頁（從個人檔案 →「帳號設定」→「訂閱方案」進入）。
//
// 刻意做成頂層路由而非 /app/* 底下：付費牆是全屏版面，不需要底部導覽列。
// onboarding 走的是同一個 PaywallScreen 元件，只是 source 不同（見 onboarding.tsx）。
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { PaywallScreen } from '../components/paywall/PaywallScreen'

export const Route = createFileRoute('/paywall')({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: '/login' })
    }
  },
  component: PaywallPage,
})

function PaywallPage() {
  const navigate = useNavigate()
  // 關閉時回個人檔案（使用者是從那裡進來的）。
  return <PaywallScreen source="settings" onDismiss={() => navigate({ to: '/app/profile' })} />
}
