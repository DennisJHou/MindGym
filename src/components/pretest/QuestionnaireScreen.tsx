import { useEffect, useRef, useState } from 'react'
import type { DimensionKey, NarrativeAnswers } from './types'
import { DIMENSION_CONFIGS, DIMENSION_ORDER } from './types'
import VoiceInput from './VoiceInput'
import { useLanguage } from '../../lib/i18n/context'
import { useKeyboardHeight } from '../../lib/keyboard'

interface Props {
  initialAnswers: NarrativeAnswers
  initialStep: number
  startAtLast: boolean
  apiError: string
  onSubmit: (answers: NarrativeAnswers) => void
  onDraftChange: (draft: { answers: NarrativeAnswers; step: number }) => void
  onExit: () => void
}

const MIN_CHARS = 30
// 輸入框最小高度：一般狀態維持原本的框高，鍵盤佔畫面時再怎麼擠也保留約四行。
const MIN_INPUT_HEIGHT = 148
const MIN_INPUT_HEIGHT_COMPACT = 118

const DOT_COLOR: Record<DimensionKey, string> = {
  P: '#E26D5C',
  E: '#5C95FF',
  R: '#D6FFB7',
  M: '#292F56',
  A: '#FFDDB9',
}

const DARK_GLYPH: Record<DimensionKey, boolean> = {
  P: false,
  E: false,
  R: true,
  M: false,
  A: true,
}

const ORDINAL = ['一', '二', '三', '四', '五']

// ── Top bar with progress dots ──────────────────────────────
function ProgressHeader({ step, onExit, compact }: { step: number; onExit: () => void; compact?: boolean }) {
  const { t } = useLanguage()
  const total = DIMENSION_ORDER.length
  const cfg = DIMENSION_CONFIGS[DIMENSION_ORDER[step]]
  return (
    <div
      style={{
        // 鍵盤佔著畫面時整條標頭縮扁，把高度讓給輸入框（小螢幕如 iPhone SE
        // 配上注音鍵盤，可用高度只剩 360 出頭，這幾十 px 是關鍵）。
        padding: compact ? '8px 24px 8px' : '14px 24px 16px',
        background: '#fff',
        flexShrink: 0,
        transition: 'padding .2s ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
        }}
      >
        <button
          onClick={onExit}
          aria-label={t('返回')}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: '1.5px solid #EAEAEA',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#151515" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <img
          src="/assets/psy-by-psy-logo.png"
          alt="PSY by PSY"
          style={{
            // 鍵盤彈出（compact）時縮起 logo，把下方的輸入框往上讓，避免被鍵盤遮住。
            height: compact ? 0 : 84,
            width: 'auto',
            objectFit: 'contain',
            opacity: compact ? 0 : 1,
            transition: 'height .2s ease, opacity .2s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            fontFamily: 'Inter',
            color: '#959595',
            fontWeight: 600,
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>

      {/* segmented progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {DIMENSION_ORDER.map((k, i) => (
          <div
            key={k}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 99,
              background: i <= step ? DOT_COLOR[k] : '#EAEAEA',
              transition: 'background .35s',
            }}
          />
        ))}
      </div>

      {/* PERMA dots：鍵盤佔著畫面時收起（進度條已經表達同一件事）。 */}
      <div
        style={{
          maxHeight: compact ? 0 : 90,
          opacity: compact ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height .2s ease, opacity .18s ease',
        }}
      >
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          {DIMENSION_ORDER.map((k, i) => {
            const isCurrent = i === step
            const isDone = i < step
            const color = DOT_COLOR[k]
            return (
              <div
                key={k}
                style={{
                  width: isCurrent ? 34 : 24,
                  height: isCurrent ? 34 : 24,
                  borderRadius: '50%',
                  background: isDone || isCurrent ? color : '#fff',
                  border: `1.5px solid ${isDone || isCurrent ? color : '#D8D8D8'}`,
                  color: isCurrent ? (DARK_GLYPH[k] || k === 'M' ? (k === 'M' ? '#fff' : '#151515') : '#151515') : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter',
                  fontWeight: 800,
                  fontSize: isCurrent ? 14 : 11,
                  transition: 'all .3s cubic-bezier(.2,.7,.2,1)',
                  boxShadow: isCurrent ? '0 2px 8px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path
                      d="M1 5 L4 8 L9 2"
                      stroke={DARK_GLYPH[k] ? '#151515' : '#fff'}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  k
                )}
              </div>
            )
          })}
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: 10,
            fontSize: 11,
            color: '#959595',
            fontFamily: 'Noto Sans TC',
            fontWeight: 500,
          }}
        >
          {t('第 {ordinal} 題「{label}」 · 共五題', { ordinal: ORDINAL[step], label: t(cfg.label) })}
        </div>
      </div>
    </div>
  )
}

// ── Main quiz component ─────────────────────────────────────
export default function NarrativeQuiz({
  initialAnswers,
  initialStep,
  startAtLast,
  apiError,
  onSubmit,
  onDraftChange,
  onExit,
}: Props) {
  const { t } = useLanguage()
  const [step, setStep] = useState(startAtLast ? DIMENSION_ORDER.length - 1 : initialStep)
  const [answers, setAnswers] = useState<NarrativeAnswers>(initialAnswers)
  const [showHint, setShowHint] = useState(false)
  // 輸入框聚焦時收起頂部大圖與 logo，把空間讓給輸入框。
  const [focused, setFocused] = useState(false)
  // 但不能只看 focus：iOS 上「鍵盤還開著、輸入框卻已經失焦」的狀態確實會出現
  // （TestFlight 回饋的截圖就是這一種），這時若照沒打字的版面排，下方按鈕會被
  // 裁掉。所以只要鍵盤佔著畫面，就一律用收起後的緊湊版面。
  const keyboardHeight = useKeyboardHeight()
  const compact = focused || keyboardHeight > 0

  const key = DIMENSION_ORDER[step]
  const cfg = DIMENSION_CONFIGS[key]
  const color = DOT_COLOR[key]
  const darkGlyph = DARK_GLYPH[key]
  const currentText = answers[key]
  const charCount = currentText.length
  const isLast = step === DIMENSION_ORDER.length - 1
  const textOk = charCount >= MIN_CHARS
  const isEnough = textOk
  const remaining = Math.max(0, MIN_CHARS - charCount)

  useEffect(() => {
    setShowHint(false)
    setFocused(false)
  }, [step])

  // 隨打隨存草稿：AI 回報失敗、App 被回收或返回上一頁時，作答都還在（見 lib/quizDraft）。
  // 每個字都寫一次 localStorage 太吃，停下來 400ms 再存；離開畫面時補存最後一次。
  const draftRef = useRef(onDraftChange)
  draftRef.current = onDraftChange
  const latestDraftRef = useRef({ answers, step })
  latestDraftRef.current = { answers, step }
  useEffect(() => {
    const timer = setTimeout(() => draftRef.current(latestDraftRef.current), 400)
    return () => clearTimeout(timer)
  }, [answers, step])
  useEffect(() => () => draftRef.current(latestDraftRef.current), [])

  function appendTranscript(text: string) {
    setAnswers((prev) => {
      const cur = prev[key]
      const sep = cur && !/\s$/.test(cur) ? ' ' : ''
      return { ...prev, [key]: cur + sep + text }
    })
  }

  function goNext() {
    if (isLast) onSubmit(answers)
    else setStep((s) => s + 1)
  }

  function goPrev() {
    if (step > 0) setStep((s) => s - 1)
  }

  return (
    // 鍵盤佔著畫面時（.is-keyboard）高度 = 可視區減掉鍵盤，整個測驗縮進鍵盤
    // 上方，內部由上到下分成三塊：標頭、可壓縮可捲動的（插圖／題目／提示）、
    // 吃掉剩餘高度的輸入框，最後是固定在底的語音與上下題按鈕。所以不論鍵盤
    // 多高、答案多長，正在打的字和「下一題」都在畫面上，不用事後捲動補救。
    <div key={step} className={`screen-enter quiz-screen${compact ? ' is-keyboard' : ''}`}>
      <ProgressHeader step={step} onExit={onExit} compact={compact} />

      {/* 插圖、題目、引導提示：空間不夠時這一塊先被壓縮，內容自己捲。 */}
      <div style={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto' }}>
        {/* Prompt block */}
        <div style={{ padding: '8px 24px 14px', textAlign: 'center' }}>
          <div
            style={{
              position: 'relative',
              // 鍵盤佔著畫面時把頂部大圖整塊收起（高度→0），空間全留給輸入框。
              height: compact ? 0 : 200,
              opacity: compact ? 0 : 1,
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'height .22s ease, opacity .18s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: `radial-gradient(circle,${color}44 0%, ${color}00 70%)`,
              }}
            />
            <img
              src="/assets/bagel.png"
              alt=""
              style={{
                width: 200,
                height: 200,
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 10px 20px rgba(201,148,99,.28))',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: '50%',
                transform: 'translateX(112px)',
                padding: '6px 12px',
                background: color,
                borderRadius: 99,
                color: darkGlyph ? '#151515' : '#fff',
                fontSize: 12,
                fontWeight: 800,
                fontFamily: 'Inter',
                letterSpacing: 0.4,
                boxShadow: '0 4px 12px rgba(0,0,0,.08)',
                whiteSpace: 'nowrap',
              }}
            >
              {key} · {t(cfg.label)}
            </div>
          </div>

          {/* 鍵盤佔著畫面時題目縮小成小標：打字時題目還看得見，
              又不會把輸入框往下擠——空間全留給「正在寫的內容」。 */}
          <h2
            style={{
              margin: compact ? '2px 0 0' : '14px 0 0',
              fontSize: compact ? 17 : 28,
              fontWeight: 800,
              letterSpacing: -0.4,
              lineHeight: 1.4,
              color: '#151515',
              transition: 'font-size .2s ease, margin .2s ease',
            }}
          >
            {t(cfg.question)}
          </h2>
        </div>

        {/* hint toggle */}
        <div style={{ padding: '0 24px 8px', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => setShowHint((s) => !s)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: showHint ? '#151515' : '#fff',
              color: showHint ? '#fff' : '#151515',
              border: '1.5px solid #151515',
              borderRadius: 99,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M5.5 3 V6 M5.5 7.5 V8.2"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            {t('引導提示')}
          </button>
        </div>
        {showHint && (
          <div
            className="pop"
            style={{
              margin: '0 24px 10px',
              padding: '10px 14px',
              background: '#FFF8EA',
              border: '1px dashed #E8D8A8',
              borderRadius: 12,
              fontSize: 12,
              lineHeight: 1.6,
              color: '#6A4A0F',
            }}
          >
            {cfg.hints.map((hint, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <span>
                  {i + 1}. {t(hint)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 輸入框：吃掉剩下的所有高度（至少 MIN_INPUT_HEIGHT），內容再多也是框內
          自己捲——這樣不論鍵盤多高、答案多長，輸入框與下面的按鈕都在畫面上。 */}
      <div
        style={{
          flex: '1 1 auto',
          // 鍵盤收起時維持原本的框高；鍵盤佔著畫面、空間吃緊時容許再矮一點，
          // 好把題目與按鈕都留在畫面上。
          minHeight: compact ? MIN_INPUT_HEIGHT_COMPACT : MIN_INPUT_HEIGHT,
          padding: '4px 18px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            border: `1.5px solid ${textOk ? color : '#D8D8D8'}`,
            borderRadius: 14,
            padding: '10px 12px 28px',
            background: '#fff',
            transition: 'border-color .3s',
          }}
        >
          <textarea
            value={currentText}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('在這裡輸入你的故事或感受，越具體越好～')}
            style={{
              width: '100%',
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
              fontSize: 12.5,
              lineHeight: 1.55,
              color: '#151515',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: 10.5, color: textOk ? color : '#959595', fontWeight: 600 }}>
              {textOk
                ? t('✓ 字數已達標')
                : t('至少需要 {min} 個字（還差 {remaining} 個字）', { min: MIN_CHARS, remaining })}
            </span>
            <span
              className="num"
              style={{ fontSize: 10.5, color: textOk ? color : '#959595', fontWeight: 600 }}
            >
              {charCount}/{MIN_CHARS}
            </span>
          </div>
        </div>
      </div>

      {/* 語音輸入、錯誤訊息與上下題按鈕：永遠釘在最底（鍵盤上方）。 */}
      <div
        style={{
          flexShrink: 0,
          // 鍵盤收起時才補 home indicator 的安全區；鍵盤佔著畫面時那塊被鍵盤蓋著，
          // 再留白只是白白吃掉本來就很吃緊的高度。
          paddingBottom: compact ? 0 : 'env(safe-area-inset-bottom)',
          transition: 'padding-bottom .2s ease',
        }}
      >
        {/* Voice input */}
        <div style={{ padding: '10px 18px 0' }}>
          <VoiceInput accent={color} onTranscript={appendTranscript} />
        </div>

        {/* API Error */}
        {apiError && isLast && (
          <div
            style={{
              margin: '12px 18px 0',
              borderRadius: 12,
              background: '#FDECEA',
              border: '1px solid #F5C6BD',
              padding: '10px 14px',
              color: '#C0392B',
              fontSize: 12.5,
            }}
          >
            {apiError}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ padding: '14px 18px 24px', display: 'flex', gap: 10 }}>
          <button
            onClick={goPrev}
            disabled={step === 0}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 99,
              background: '#fff',
              color: step === 0 ? '#BFBFBF' : '#151515',
              border: `1.5px solid ${step === 0 ? '#EAEAEA' : '#959595'}`,
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: step === 0 ? 'default' : 'pointer',
            }}
          >
            {t('上一題')}
          </button>
          <button
            onClick={goNext}
            disabled={!isEnough}
            style={{
              flex: 1.4,
              height: 50,
              borderRadius: 99,
              background: isEnough ? '#292F56' : '#EAEAEA',
              color: isEnough ? '#fff' : '#959595',
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: isEnough ? 'pointer' : 'default',
              transition: 'background .25s',
              boxShadow: isEnough ? '0 8px 18px -8px rgba(41,47,86,.5)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {isLast ? t('看結果') : t('下一題')}
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path
                d="M2 7 H12 M8 3 L12 7 L8 11"
                stroke={isEnough ? '#fff' : '#959595'}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
