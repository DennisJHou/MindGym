import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'
import { track } from '../lib/analytics'
import {
  detectInAppBrowser,
  openInExternalBrowser,
  getShareableUrl,
  type InAppBrowser,
} from '../lib/inAppBrowser'
import { isNativeApp, signInWithGoogleNative } from '../lib/nativeAuth'
import { signInWithAppleNative } from '../lib/appleAuth'
import coachWelcome from '../assets/ui/gratitude-mascot.png'
import { useLanguage } from '../lib/i18n/context'
import { LanguageSwitcherCompact } from '../components/LanguageSwitcher'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/app/home' })
    }
  },
  component: LoginPage,
})

// 'login' = 帳號密碼登入，'signup' = 註冊新帳號
type EmailMode = 'login' | 'signup'

function LoginPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<EmailMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 註冊後若專案開啟「Confirm email」，signUp() 不會馬上給 session，
  // 要提示使用者去信箱點驗證信連結，而不是讓畫面看起來卡住。
  const [pendingConfirmation, setPendingConfirmation] = useState(false)
  // 從 LINE / FB / IG… App 內建瀏覽器打開時，Google 會擋下登入，
  // 這裡記錄是哪一種 App，好顯示對應的引導畫面（null = 不顯示）。
  const [inAppNotice, setInAppNotice] = useState<InAppBrowser>(null)
  const [copied, setCopied] = useState(false)

  const handleGoogleLogin = async () => {
    // 原生 App（iOS）：Google 會擋嵌入式 WebView，改用系統瀏覽器 + deep link。
    // 詳見 src/lib/nativeAuth.ts。網頁版不走這條路（isNativeApp() 為 false）。
    if (isNativeApp()) {
      try {
        track('login_started', { method: 'google', platform: 'native' })
        await signInWithGoogleNative()
      } catch (err) {
        track('login_error', { method: 'google', platform: 'native' })
        console.error('[login] native google login failed', err)
        setInAppNotice(null)
      }
      return
    }

    // 在 App 內建瀏覽器（LINE/FB/IG…）裡，Google 會直接擋下 OAuth，
    // 跳出「disallowed_useragent」錯誤。先攔截下來引導使用者改用外部瀏覽器。
    const browser = detectInAppBrowser()
    if (browser) {
      track('login_blocked_in_app_browser', { browser })
      setInAppNotice(browser)
      // LINE 支援一鍵跳出到外部瀏覽器
      if (browser === 'line') {
        openInExternalBrowser()
      }
      return
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app/home`,
      },
    })
  }

  // Sign in with Apple 只在原生 iOS App 裡顯示（見 src/lib/appleAuth.ts），
  // 網頁版沒有這顆按鈕，故這裡不用像 handleGoogleLogin 一樣處理網頁版分支。
  const handleAppleLogin = async () => {
    try {
      track('login_started', { method: 'apple', platform: 'native' })
      await signInWithAppleNative()
      track('login_completed', { method: 'apple' })
    } catch (err) {
      track('login_error', { method: 'apple', platform: 'native' })
      console.error('[login] native apple login failed', err)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(getShareableUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleSubmitPassword = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) return
    setLoading(true)
    setError(null)
    track('login_started', { method: 'password', mode })

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
      setLoading(false)
      if (error) {
        track('login_error', { method: 'password', mode })
        setError(t('Email 或密碼錯誤，請再試一次。'))
        return
      }
      track('login_completed', { method: 'password' })
      // 成功後 onAuthStateChange 會更新 session，beforeLoad 自動導向 /app/home
      return
    }

    // mode === 'signup'
    const { data, error } = await supabase.auth.signUp({ email: trimmedEmail, password })
    setLoading(false)
    if (error) {
      track('login_error', { method: 'password', mode })
      setError(t('註冊失敗，請確認 email 格式或稍後再試。'))
      return
    }
    if (data.session) {
      // 專案未開啟「Confirm email」：註冊即登入，session 已建立。
      track('login_completed', { method: 'password' })
      return
    }
    // 開啟了「Confirm email」：還沒有 session，要先去信箱點驗證信。
    setPendingConfirmation(true)
  }

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError(t('請先輸入 email，才能寄送重設密碼信。'))
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail)
    setLoading(false)
    if (error) {
      setError(t('寄送失敗，請確認 email 後再試一次。'))
      return
    }
    setError(t('已寄出重設密碼信，請至信箱查收。'))
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-end overflow-x-hidden px-6 pt-12">
      {/* 外層 frame-width：把語言鈕收進手機外框的欄位（詳見 index.css 的
          .frame-width 說明）。App 版這層就是整個螢幕寬，位置沒有變。 */}
      <div className="frame-width pointer-events-none fixed inset-x-0 top-0 z-20">
        <LanguageSwitcherCompact className="pointer-events-auto absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)]" />
      </div>
      {inAppNotice && (
        <InAppBrowserNotice
          browser={inAppNotice}
          copied={copied}
          onCopy={handleCopyUrl}
          onOpenExternal={openInExternalBrowser}
          onClose={() => setInAppNotice(null)}
        />
      )}
      {/* 教練手寫招呼 */}
      <div className="animate-fade-up mb-3 w-full max-w-sm">
        <div className="relative rounded-3xl bg-card px-6 py-5 shadow-soft">
          <p className="font-handwriting text-2xl leading-snug text-foreground">
            {t('嗨，很高興認識你！歡迎來到 PSY by PSY 心理健身房。')}
          </p>
          <SpeechTail />
        </div>
      </div>
      <p className="animate-fade-up mb-8 max-w-xs text-center font-handwriting text-xl leading-snug text-muted-foreground">
        {t('照顧心理，就像照顧身體一樣自然，先從登入開始吧。')}
      </p>

      {/* 教練插畫 + 背後色塊 */}
      <div className="relative animate-float">
        <div className="absolute inset-0 -z-10 translate-x-5 translate-y-7 rounded-[45%] bg-primary-soft" />
        <div className="absolute inset-0 -z-10 -translate-x-4 translate-y-3 rounded-[45%] bg-primary-glow opacity-50" />
        <img src={coachWelcome} alt={t('PSY by PSY 教練')} className="relative h-52 w-auto drop-shadow-sm" />
      </div>

      {/* 底部 CTA：走正常排版流，不用 fixed —— 否則面板高度一變（例如加回帳密欄位、
          多一顆 Apple 按鈕）就得同步改上面的預留 padding，改漏就會蓋住插圖與文案。 */}
      <div className="w-full pb-10 pt-8">
        <div className="mx-auto w-full max-w-sm space-y-3">
          {pendingConfirmation ? (
            <div className="rounded-3xl bg-card px-6 py-5 text-center shadow-soft">
              <p className="text-sm font-semibold text-foreground">
                {t('請至信箱查收驗證信，完成後即可登入。')}
              </p>
              <button
                onClick={() => {
                  setPendingConfirmation(false)
                  setMode('login')
                }}
                className="mt-3 text-xs font-semibold text-muted-foreground underline"
              >
                {t('已有帳號？前往登入')}
              </button>
            </div>
          ) : (
            <>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t('輸入 email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 w-full rounded-full bg-card px-6 text-center text-base font-semibold text-foreground shadow-soft outline-none placeholder:text-muted-foreground/60"
              />
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={t('輸入密碼')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 w-full rounded-full bg-card px-6 text-center text-base font-semibold text-foreground shadow-soft outline-none placeholder:text-muted-foreground/60"
              />

              {error && (
                <p className="text-center text-xs font-semibold text-red-500">{error}</p>
              )}

              <button
                onClick={handleSubmitPassword}
                disabled={loading || !email.trim() || !password}
                className="flex h-16 w-full items-center justify-center rounded-full bg-primary text-base font-extrabold tracking-wide text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading
                  ? mode === 'login' ? t('登入中…') : t('建立帳號中…')
                  : mode === 'login' ? t('登入') : t('註冊')}
              </button>

              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login')
                    setError(null)
                  }}
                  className="text-xs font-semibold text-muted-foreground underline"
                >
                  {mode === 'login' ? t('還沒有帳號？註冊新帳號') : t('已有帳號？前往登入')}
                </button>
                {mode === 'login' && (
                  <button
                    onClick={handleForgotPassword}
                    className="text-xs font-semibold text-muted-foreground underline"
                  >
                    {t('忘記密碼？')}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-muted-foreground/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('或')}</span>
                <span className="h-px flex-1 bg-muted-foreground/20" />
              </div>
            </>
          )}

          {isNativeApp() && (
            <button
              onClick={handleAppleLogin}
              className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-black text-base font-extrabold tracking-wide text-white shadow-soft transition active:scale-[0.98]"
            >
              <AppleIcon />
              {t('用 Apple 登入')}
            </button>
          )}

          <button
            onClick={handleGoogleLogin}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-card text-base font-extrabold tracking-wide text-foreground shadow-soft transition active:scale-[0.98]"
          >
            <GoogleIcon />
            {t('用 Google 登入')}
          </button>

          <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
            PSY by PSY · Train your mind
          </p>
        </div>
      </div>
    </div>
  )
}

function InAppBrowserNotice({
  browser,
  copied,
  onCopy,
  onOpenExternal,
  onClose,
}: {
  browser: InAppBrowser
  copied: boolean
  onCopy: () => void
  onOpenExternal: () => void
  onClose: () => void
}) {
  const { t } = useLanguage()
  const isLine = browser === 'line'

  // 各 App「在外部瀏覽器開啟」的位置提示
  const manualHint =
    browser === 'facebook' || browser === 'messenger'
      ? t('請點右下角／右上角的「⋯」選單，選擇「用外部瀏覽器開啟」。')
      : browser === 'instagram'
        ? t('請點右上角的「⋯」選單，選擇「在瀏覽器中開啟」。')
        : t('請點畫面上的選單按鈕（通常是「⋯」），選擇「在瀏覽器開啟」。')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-6 shadow-soft">
        <h2 className="text-lg font-extrabold text-foreground">
          {t('請用外部瀏覽器開啟')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('為讓使用者有更佳心理健身體驗，完整保存您的心理健身紀錄，本App僅限使用外部瀏覽器開啟。')}
          {isLine
            ? t('請按下方按鈕，用手機的瀏覽器重新開啟。')
            : manualHint}
        </p>

        {isLine && (
          <button
            onClick={onOpenExternal}
            className="flex h-14 w-full items-center justify-center rounded-full bg-primary text-base font-extrabold tracking-wide text-primary-foreground shadow-soft transition active:scale-[0.98]"
          >
            {t('用外部瀏覽器開啟')}
          </button>
        )}

        <button
          onClick={onCopy}
          className="flex h-12 w-full items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground transition active:scale-[0.98]"
        >
          {copied ? t('已複製網址 ✓') : t('複製網址，自行貼到瀏覽器')}
        </button>

        <button
          onClick={onClose}
          className="w-full text-center text-xs font-semibold text-muted-foreground underline"
        >
          {t('關閉')}
        </button>
      </div>
    </div>
  )
}

function SpeechTail() {
  return (
    <svg
      className="absolute -bottom-3 left-10 h-4 w-8 text-card"
      viewBox="0 0 32 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M0 0c6 0 10 4 14 9 3 4 6 7 12 7H0z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// Apple 官方標誌，依 Human Interface Guidelines 要求 Sign in with Apple 按鈕須用此圖示。
function AppleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.462 2.11-1.212 2.86-.82.82-2.06 1.45-3.09 1.36-.14-1.1.44-2.24 1.19-2.96.83-.82 2.24-1.4 3.11-1.26zM20.35 17.4c-.55 1.25-.81 1.81-1.51 2.91-.98 1.53-2.36 3.44-4.07 3.46-1.51.02-1.9-.98-3.94-.97-2.04.01-2.47.99-3.98.97-1.71-.02-3.02-1.74-4-3.27-2.74-4.22-3.03-9.17-1.34-11.81 1.2-1.87 3.09-2.96 4.87-2.96 1.81 0 2.95 1 4.45 1 1.45 0 2.34-1 4.44-1 1.58 0 3.26.86 4.45 2.35-3.91 2.14-3.28 7.73.63 9.32z" />
    </svg>
  )
}
