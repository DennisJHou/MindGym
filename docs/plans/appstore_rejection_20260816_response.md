# App Store 退件處理與重送審清單（2026-08-16）

> **Submission ID**：`11511676-6a30-4bde-838a-729c92552ae1`
> **審核日期**：2026 年 8 月 16 日
> **審核裝置**：iPad Air 11-inch (M3)
> **被退版本**：1.0.1 (6)
> **本文件更新**：2026-08-29

---

## 總覽

| # | 退件項目 | 需要改程式？ | 狀態 |
|---|---|---|---|
| 1 | Guideline 1.2 — 使用者產生內容（UGC）安全機制 | ✅ 需要 | ✅ **已完成**（PR #79 已合併）|
| 2 | Guideline 2.1 — 補充 AI 使用資訊 | ❌ 不需要 | 📝 待你在 App Store Connect 回覆 |
| 3 | Guideline 2.3.3 — 截圖不符規定 | ❌ 不需要 | 📸 待你重拍上傳 |

---

## 1️⃣ Guideline 1.2 — UGC 安全機制 ✅ 已完成

### Apple 的要求

App 含使用者產生內容，必須具備三項防護：

1. 使用者在**註冊或登入前**同意條款（EULA），條款需明確載明**對冒犯內容與濫用行為零容忍**
2. 提供**檢舉**冒犯內容的機制
3. 提供**封鎖**騷擾使用者的機制

並需以**實體裝置螢幕錄影**展示上述三項。

### 盤點結果：只缺一項

| 要求 | 原本狀況 |
|---|---|
| 檢舉機制 | ✅ 早已實作（`src/lib/communityModeration.ts` 的 `reportEntry`）|
| 封鎖機制 | ✅ 早已實作（`blockUser`，側邊欄另有解除封鎖管理）|
| 登入前同意條款 | ❌ **完全沒有** ← 這是被退的真正原因 |

### 已完成的修改（PR #79）

**新增 `/terms` 使用者條款頁**
- 公開免登入，網址：`https://mind-gym-kappa.vercel.app/terms`
- **第四節「社群守則：對冒犯內容與濫用行為零容忍」**明確載明零容忍政策，並列出八類禁止內容
- 第五節寫出檢舉／封鎖／解除封鎖的實際操作位置

**登入頁加入同意勾選**
- 未勾選時**所有登入方式**（帳號密碼／Sign in with Apple／Google）一律擋下
- 勾選項含 `/terms` 與 `/privacy` 連結，並直接寫出零容忍字樣
- 未勾選就按登入 → 顯示紅字提示，不會靜默失敗

**已驗證**：未勾選時帳密登入與 Google 登入皆被擋下並顯示提示；`/terms` 正常載入。

---

### 📹 你要錄的影片（實體 iPhone，一鏡到底即可）

Apple 指定要看三件事，照以下順序錄一次：

#### 第一段：條款同意
1. 開啟 App，停在登入頁
2. 鏡頭停留在底部的**同意勾選項**（讓審查看清楚文字）
3. 點「**使用者條款**」連結進入條款頁
4. 往下滑到**第四節「零容忍」**，停留 2-3 秒
5. 返回登入頁
6. **勾選**同意
7. 完成登入

> 💡 建議加拍：先**不勾選**直接按登入，展示被擋下的紅字提示。這能強力證明同意是強制的。

#### 第二段：檢舉機制
1. 進入「社群」分頁
2. 任一則貼文右上角的「**⋯**」選單
3. 選擇「**檢舉**」
4. 展示檢舉原因選單（騷擾或霸凌／垃圾訊息／不當內容／自我傷害疑慮／其他）
5. 送出，展示確認畫面

#### 第三段：封鎖機制
1. 同一個「**⋯**」選單
2. 選擇「**封鎖**」
3. 展示該使用者的貼文從動態牆消失

> 💡 加分：再展示側邊欄「已封鎖的使用者」清單可以解除封鎖。

#### 影片上傳位置
App Store Connect → **App 審核資訊（App Review Information）** → **備註（Notes）** 欄位，貼上影片連結（YouTube 未列出、Google Drive 開放連結、Dropbox 皆可）。

---

## 2️⃣ Guideline 2.1 — AI 使用資訊 📝 待回覆

### Apple 的三個問題

1. 你的 App 是否使用第三方 AI？
2. 若有，供應商名稱為何？
3. 蒐集並傳送了哪些資料？傳到哪裡？

### 程式碼稽核結果（實際查證，非推測）

| 供應商 | 模型 | 用途 | 呼叫位置 |
|---|---|---|---|
| **Anthropic** | `claude-haiku-4-5-20251001` | 練習回饋、週分析、關鍵字標記、翻譯 | `backend/app.py`、`supabase/functions/{extract-keywords,gratitude-summary,translate-post}` |
| **OpenAI** | `whisper-1` | 語音轉文字（選用功能） | `backend/app.py` |

**關鍵發現**：`user_id` 只用於寫入你自己 Supabase 的 `ai_usage_log` 成本記錄表，**不會**包含在送往 Anthropic 或 OpenAI 的 API 請求中。送出的只有 `system` 提示與使用者輸入的文字內容。

### ✂️ 複製這段回覆到 App Store Connect

```
1. Does your app use any third-party AI?
Yes.

2. Name of the third-party AI provider(s):
- Anthropic (Claude, model: claude-haiku-4-5)
- OpenAI (Whisper, model: whisper-1) — speech-to-text only

3. What kind of data is collected and sent, and where?

To Anthropic (Claude):
Only the text the user voluntarily writes in the app — gratitude journal
entries, goal-setting reflections, self-compassion notes, and answers to the
onboarding well-being questionnaire. This text is sent to generate written
feedback, weekly summaries, keyword tagging, and translation.
No user identifiers are sent: no user ID, no email, no name, no device
identifier. Anthropic does not use API data to train their models.

To OpenAI (Whisper):
Only the audio recording, and only when the user explicitly taps the optional
"voice input" button to dictate a questionnaire answer instead of typing.
The audio is transcribed to text and the original recording is not retained.
No user identifiers are sent.

All AI requests are made server-side from our own backend; API keys are never
exposed to the client. Usage/cost logging is stored in our own database and is
not shared with any AI provider.

This is disclosed to users in our Privacy Policy and Terms of Use.
```

### ⚠️ 送出前請自行確認

上述回覆中「**Anthropic does not use API data to train their models**」這句，屬於引用第三方的條款。送出前建議到 Anthropic 與 OpenAI 官網核對**現行**的 API 資料使用條款，避免陳述過時。若不確定，可以刪掉這一句——它不是 Apple 要求回答的內容。

---

## 3️⃣ Guideline 2.3.3 — 截圖不符規定 📸 待重拍

### Apple 的認定

6.5 吋 iPhone 與 13 吋 iPad 的截圖，**大多數不是 App 實際使用畫面**。Apple 明確指出：

- 不反映 App UI 的行銷或宣傳素材，不適合作為截圖
- **大多數**截圖應呈現 App 的主要功能
- **啟動畫面與登入畫面一般不算「App 使用中」**

### 建議拍攝清單

| # | 畫面 | 為什麼合格 |
|---|---|---|
| 1 | 感恩日記填寫中（欄位已有輸入內容）| 核心功能實際使用 |
| 2 | AI 回饋結果頁 | 展示產品核心價值 |
| 3 | 社群動態牆（有實際貼文）| 核心功能 |
| 4 | 我的健心檔案（PERMA 雷達圖 + 打卡日曆）| 數據視覺化 |
| 5 | 一週回顧報告（情緒趨勢圖／人生主題）| 進階功能 |

### 規則提醒

- ❌ **不要放**：登入頁、啟動畫面、純文字行銷海報
- ✅ 至少 3 張以上必須是**真實 App 操作畫面**
- 需要 **6.5 吋 iPhone** 與 **13 吋 iPad** 兩種尺寸
- 上傳位置：App Store Connect → Previews and Screenshots → **View All Sizes in Media Manager**

---

## 🚀 重送審完整順序

- [x] **1. 合併 PR #79**（已完成，2026-08-28）
- [ ] **2. 確認 Vercel 已部署**——打開 `https://mind-gym-kappa.vercel.app/login`，確認底部有同意勾選項
- [ ] **3. 重拍截圖**（5 張，兩種尺寸）並上傳 App Store Connect
- [ ] **4. 實機錄影**（條款同意 → 檢舉 → 封鎖），上傳到可公開存取的位置
- [ ] **5. 在 App Store Connect 回覆審查團隊**
  - 貼上第 2 節的 AI 回覆
  - 附上影片連結
  - 說明截圖已更新
- [ ] **6. 將影片連結填入 App Review Information 的 Notes 欄位**（Apple 明講「for future submissions」，之後每次送審都留著）
- [ ] **7. 重新送審**

---

## 💡 給下次送審的提醒

Apple 在信中特別說：把錄影連結放進 **App Review Information 的 Notes 欄位**，供**未來的送審**使用。建議這個欄位長期保留：

- 條款同意 / 檢舉 / 封鎖 的操作路徑說明
- 錄影連結
- Demo 帳號的 email 與密碼
- AI 使用說明（第 2 節那段）

這樣之後每次送審都能減少來回問答的次數。

---

## 相關檔案

| 檔案 | 說明 |
|---|---|
| `src/routes/terms.tsx` | 使用者條款頁（第四節為零容忍條款）|
| `src/routes/login.tsx` | 登入頁同意勾選與 `requireAgreement()` 把關 |
| `src/lib/communityModeration.ts` | 檢舉與封鎖的資料流 |
| `supabase/community_safety.sql` | `reports` / `blocks` 資料表與 RLS |
| `docs/plans/payment_go_live_roadmap.md` | 訂閱金流上線路線圖（另一份文件）|
