import { createFileRoute, Link } from '@tanstack/react-router'
import { useLanguage } from '../lib/i18n/context'
import { LanguageSwitcherCompact } from '../components/LanguageSwitcher'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

// 使用者條款 / EULA（公開、免登入）。
//
// 為什麼需要這一頁：App Store 審查指南 1.2（使用者產生內容）要求
// 「使用者必須在註冊或登入前同意條款，且條款需明確載明對冒犯內容與濫用行為零容忍」。
// 2026-08-16 的退件即是因為缺少這一頁與登入頁的同意流程。
//
// 送審時 Apple 會要求錄影展示三件事，這一頁對應第一件：
//   1. 註冊／登入前呈現的條款同意（本頁 + login.tsx 的同意勾選）
//   2. 檢舉冒犯內容的機制（社群貼文選單 → 檢舉，見 lib/communityModeration.ts）
//   3. 封鎖騷擾使用者的機制（社群貼文選單 → 封鎖；側邊欄可解除封鎖）
//
// ⚠️ 第 4 節「零容忍」的措辭是審查要求的重點，修改前請確認仍明確表達
//    「不容忍冒犯內容與濫用使用者，且違規者將被移除」。
const LAST_UPDATED = '2026 年 8 月 29 日'
const CONTACT_EMAIL = 'psybypsy01@gmail.com'
const REMOVAL_WINDOW_HOURS = 24

function TermsPage() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+3rem)]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground transition hover:text-foreground"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t('返回')}
          </Link>
          <LanguageSwitcherCompact />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground">{t('使用者條款')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('PSY by PSY 心理健身房')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('最後更新：{date}', { date: t(LAST_UPDATED) })}
        </p>

        <div className="mt-8 flex flex-col gap-7">
          <Section title={t('一、關於本條款')}>
            <P>{t('本條款是你與 PSY by PSY（以下稱「我們」）之間的協議。註冊帳號或使用本服務，即表示你已閱讀、瞭解並同意本條款的全部內容。若你不同意，請勿註冊或使用本服務。')}</P>
          </Section>

          <Section title={t('二、本服務是什麼')}>
            <P>{t('PSY by PSY 是一款以正向心理學為基礎的自我照顧練習工具，提供感恩日記、過程目標覺察、自我慈悲、WOOP 目標實踐等練習，並可選擇將練習內容分享至社群。')}</P>
            <P>{t('本服務不是醫療行為，也不能取代專業的心理諮商、精神醫療或危機處理。若你正處於危急狀況，請立即撥打 1925（安心專線）或 119，或前往就近醫療院所。')}</P>
          </Section>

          <Section title={t('三、你的帳號')}>
            <Bullets
              items={[
                t('你必須年滿 13 歲才能使用本服務。'),
                t('你需要對自己帳號下的所有活動負責，並妥善保管登入憑證。'),
                t('你可以隨時在「我的健心檔案 → 帳號設定」中刪除帳號，刪除後你的紀錄將永久移除且無法復原。'),
              ]}
            />
          </Section>

          {/* ⚠️ 這一節是 App Store 審查指南 1.2 的核心要求，措辭需明確表達零容忍。 */}
          <Section title={t('四、社群守則：對冒犯內容與濫用行為零容忍')}>
            <P>
              {t('本服務包含使用者產生的內容（社群貼文與留言）。我們對冒犯性內容與濫用行為採取零容忍政策：任何違反本節規定的內容一經查證即會被移除，帳號並可能被永久停用，且不另行通知。')}
            </P>
            <P>{t('你同意不會張貼、上傳或散布下列內容：')}</P>
            <Bullets
              items={[
                t('騷擾、霸凌、威脅、跟蹤或針對特定個人的攻擊'),
                t('仇恨言論，或基於種族、族裔、國籍、宗教、性別、性傾向、身心障礙等特徵的歧視內容'),
                t('色情、露骨性內容，或任何涉及未成年人的不當內容'),
                t('鼓勵自我傷害、自殺、飲食失調或其他危險行為的內容'),
                t('暴力、血腥或令人不安的內容'),
                t('垃圾訊息、詐騙、廣告或未經同意的商業推銷'),
                t('侵害他人智慧財產權、隱私或個人資料的內容'),
                t('違反中華民國法令或其他適用法律的內容'),
              ]}
            />
          </Section>

          <Section title={t('五、檢舉與封鎖')}>
            <P>{t('我們在 App 內提供下列工具，讓你能主動保護自己的使用體驗：')}</P>
            <Bullets
              items={[
                t('檢舉：在任何社群貼文右上角的選單中選擇「檢舉」，並選擇檢舉原因。'),
                t('封鎖：在同一個選單中選擇「封鎖」，被封鎖者的貼文與留言將不再顯示給你。'),
                t('解除封鎖：在側邊欄的「已封鎖的使用者」中可隨時解除。'),
              ]}
            />
            <P>
              {t('我們會在收到檢舉後的 {hours} 小時內完成審查，移除違規內容並停用違規者的帳號。', {
                hours: REMOVAL_WINDOW_HOURS,
              })}
            </P>
          </Section>

          <Section title={t('六、你的內容')}>
            <Bullets
              items={[
                t('你所建立的練習內容與貼文，著作權仍屬於你。'),
                t('當你選擇分享至社群時，你授權我們在本服務中顯示該內容，供其他使用者瀏覽。'),
                t('你可以隨時刪除自己的貼文，或將分享設定改為「僅自己可見」。'),
              ]}
            />
          </Section>

          <Section title={t('七、AI 功能說明')}>
            <P>{t('本服務使用第三方 AI 服務（Anthropic Claude 與 OpenAI Whisper）來生成練習回饋、週分析報告與語音轉文字。相關資料處理方式詳見隱私政策。')}</P>
            <P>{t('AI 生成的內容僅供自我覺察參考，不構成醫療、心理或法律建議，也可能不準確，請斟酌後再採用。')}</P>
          </Section>

          <Section title={t('八、服務變更與終止')}>
            <Bullets
              items={[
                t('我們可能會新增、修改或停止部分功能，重大變更會於 App 內或本頁公告。'),
                t('若你違反本條款，我們可以在不事先通知的情況下暫停或終止你的帳號。'),
              ]}
            />
          </Section>

          <Section title={t('九、免責聲明')}>
            <P>{t('本服務以「現狀」提供。在法律允許的最大範圍內，我們不對服務的中斷、資料遺失或因使用本服務所生的間接損害負責。')}</P>
          </Section>

          <Section title={t('十、條款更新')}>
            <P>{t('我們可能會不時更新本條款。重大變更時會於本頁公告並更新上方的「最後更新」日期。變更後繼續使用本服務，即視為你同意更新後的條款。')}</P>
          </Section>

          <Section title={t('十一、聯絡我們')}>
            <P>{t('對本條款有任何疑問，或需要檢舉緊急狀況，歡迎透過以下方式聯絡我們：')}</P>
            <p className="text-[15px] leading-relaxed text-foreground/85">
              {t('Email：')}
              <a className="font-bold underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>

          <div className="border-t border-border pt-6">
            <Link to="/privacy" className="text-sm font-bold text-primary underline">
              {t('隱私政策')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-extrabold text-foreground">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-foreground/85">{children}</p>
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[15px] leading-relaxed text-foreground/85">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
