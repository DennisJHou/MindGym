import type { Translation } from '../dictionary'

// 付費牆、軟性付費牆、社群解鎖、訂閱管理的文案。
//
// ⚠️ 價格一律用 {price} / {n} 佔位，實際數字來自 pricing_config（見 src/lib/pricing.ts）。
//    規格 §7 的範例寫成「每月只要 NT$66」，§8 又禁止在 client 寫死價格字串——
//    這裡用參數化模板同時滿足兩者：渲染出來的字與 §7 一字不差，但改價不必動程式碼。
//
// ⚠️ 規格 §5.3：本頁禁止倒數計時、閃爍、紅色警示、恐懼訴求、療效承諾與 before/after 對比，
//    文案措辭請維持中性、口語、對使用者說「你」。
export const paywall: Record<string, Translation> = {
  // ── 付費牆主體（規格 §7 指定文案）──────────────────────────────────────
  '成為心理健身房會員，解鎖下週的你': {
    'zh-CN': '成为心理健身房会员，解锁下周的你',
    en: 'Become a member, unlock next week’s you',
  },
  '你的{high}最亮，{low}正在長': {
    'zh-CN': '你的{high}最亮，{low}正在长',
    en: 'Your {high} shines brightest; your {low} is still growing',
  },
  '每月只要 {price}': { 'zh-CN': '每月只要 {price}', en: 'Just {price} a month' },
  '{price}／年・前 {n} 名創始會員永久鎖價': {
    'zh-CN': '{price}／年・前 {n} 名创始会员永久锁价',
    en: '{price}/year · price locked forever for the first {n} founding members',
  },
  '{price}／月': { 'zh-CN': '{price}／月', en: '{price}/month' },
  '{price}／年・省 {n}%': { 'zh-CN': '{price}／年・省 {n}%', en: '{price}/year · save {n}%' },
  '{price}／年': { 'zh-CN': '{price}／年', en: '{price}/year' },
  '每年': { 'zh-CN': '每年', en: 'per year' },
  '每月': { 'zh-CN': '每月', en: 'per month' },
  '／年': { 'zh-CN': '／年', en: '/year' },
  '／月': { 'zh-CN': '／月', en: '/month' },
  '創始會員・剩 {n} 位': { 'zh-CN': '创始会员・剩 {n} 位', en: 'Founding member · {n} left' },
  '申請加入創始成員': { 'zh-CN': '申请加入创始成员', en: 'Apply to be a founding member' },
  '開放訂閱後為 {price}，屆時會先通知你，不會自動扣款。': {
    'zh-CN': '开放订阅后为 {price}，届时会先通知你，不会自动扣款。',
    en: 'It will be {price} once subscriptions open. We’ll let you know first — nothing is charged automatically.',
  },

  // 社群封頂區塊（免費會員滑到預覽上限）
  '還有 {n} 則故事你還沒看到': {
    'zh-CN': '还有 {n} 则故事你还没看到',
    en: '{n} more stories you haven’t seen',
  },
  '這週分享 1 則你的紀錄，就能免費看完；或加入創始成員，隨時都能看。': {
    'zh-CN': '这周分享 1 则你的记录，就能免费看完；或加入创始成员，随时都能看。',
    en: 'Share one entry this week to see them all for free — or join as a founding member for unlimited access.',
  },
  '現在解鎖，馬上繼續看': { 'zh-CN': '现在解锁，马上继续看', en: 'Unlock now and keep reading' },
  '先去寫一則，免費解鎖這週': {
    'zh-CN': '先去写一则，免费解锁这周',
    en: 'Write one entry to unlock this week for free',
  },

  // 創始成員徽章（後台核准後顯示在貼文上）
  '創始成員': { 'zh-CN': '创始成员', en: 'Founding member' },

  // /admin 創始成員申請
  '創始成員申請': { 'zh-CN': '创始成员申请', en: 'Founding member applications' },
  '待處理 {n} 筆': { 'zh-CN': '待处理 {n} 笔', en: '{n} pending' },
  '目前沒有新的申請': { 'zh-CN': '目前没有新的申请', en: 'No new applications' },
  '已核准': { 'zh-CN': '已核准', en: 'Approved' },
  '待核准': { 'zh-CN': '待核准', en: 'Pending' },
  '核准為創始成員': { 'zh-CN': '批准为创始成员', en: 'Approve as founding member' },
  '年繳': { 'zh-CN': '年缴', en: 'Yearly' },
  '月繳': { 'zh-CN': '月缴', en: 'Monthly' },
  '先自己逛逛': { 'zh-CN': '先自己逛逛', en: 'Just look around first' },
  '恢復購買': { 'zh-CN': '恢复购买', en: 'Restore purchase' },
  '14 天免費體驗，到期後 {price}，隨時可取消。': {
    'zh-CN': '14 天免费体验，到期后 {price}，随时可取消。',
    en: '14-day free trial, then {price}. Cancel anytime.',
  },

  // ── 利益點（規格 §5.1：最多 3 條、每條 ≤14 字）────────────────────────
  // 只列目前真的做得到的權益，不寫尚未實作的功能。
  '每週一份 AI 週分析': { 'zh-CN': '每周一份 AI 周分析', en: 'A weekly AI analysis' },
  '社群無限瀏覽': { 'zh-CN': '社区无限浏览', en: 'Unlimited community browsing' },
  '基線檢測無限重測': { 'zh-CN': '基线检测无限重测', en: 'Retake your baseline anytime' },

  // ── CTA 點擊後的說明（這階段不接金流）─────────────────────────────────
  '創始會員目前僅開放給社群成員': {
    'zh-CN': '创始会员目前仅开放给社区成员',
    en: 'Founding membership is currently open to community members only',
  },
  '我們記下你的興趣了。開放訂閱時會再通知你。': {
    'zh-CN': '我们记下你的兴趣了。开放订阅时会再通知你。',
    en: "We've noted your interest. We'll let you know when subscriptions open.",
  },
  '知道了': { 'zh-CN': '知道了', en: 'Got it' },
  '訂閱功能尚未開放，敬請期待。': {
    'zh-CN': '订阅功能尚未开放，敬请期待。',
    en: 'Subscriptions are not open yet — stay tuned.',
  },

  // ── 軟性付費牆（規格 §7）──────────────────────────────────────────────
  '這份報告已經生成好了。升級後即可看完整內容。': {
    'zh-CN': '这份报告已经生成好了。升级后即可看完整内容。',
    en: 'This report is ready. Upgrade to read all of it.',
  },
  '查看方案': { 'zh-CN': '查看方案', en: 'See plans' },

  // ── 社群貢獻換觀看（規格 §7）──────────────────────────────────────────
  '這週分享 1 則你的紀錄，就能無限瀏覽大家的故事。': {
    'zh-CN': '这周分享 1 则你的记录，就能无限浏览大家的故事。',
    en: 'Share one of your own entries this week to browse everyone’s stories without limit.',
  },
  '本週已解鎖，可以無限瀏覽': {
    'zh-CN': '本周已解锁，可以无限浏览',
    en: 'Unlocked this week — browse without limit',
  },

  // ── 降級通知（規格 §7，待接金流後才會用到）──────────────────────────
  '體驗結束了，你的紀錄都還在。免費會員每月仍可生成 1 份週分析。': {
    'zh-CN': '体验结束了，你的记录都还在。免费会员每月仍可生成 1 份周分析。',
    en: 'Your trial has ended — everything you wrote is still here. Free members can still generate one weekly analysis each month.',
  },

  // ── 訂閱方案頁 / 個人檔案入口 ─────────────────────────────────────────
  '訂閱方案': { 'zh-CN': '订阅方案', en: 'Subscription' },
  '目前方案': { 'zh-CN': '当前方案', en: 'Current plan' },
  '免費會員': { 'zh-CN': '免费会员', en: 'Free' },
  'Pro 練心會員': { 'zh-CN': 'Pro 练心会员', en: 'Pro' },
  '練心通行證': { 'zh-CN': '练心通行证', en: 'Pass' },
  '創始會員': { 'zh-CN': '创始会员', en: 'Founding member' },

  // ── /admin 訂閱管理分頁 ───────────────────────────────────────────────
  '訂閱管理': { 'zh-CN': '订阅管理', en: 'Subscriptions' },
  '搜尋姓名或 email': { 'zh-CN': '搜索姓名或 email', en: 'Search name or email' },
  '搜尋': { 'zh-CN': '搜索', en: 'Search' },
  '方案層級': { 'zh-CN': '方案层级', en: 'Tier' },
  '狀態': { 'zh-CN': '状态', en: 'Status' },
  '設為創始會員': { 'zh-CN': '设为创始会员', en: 'Mark as founding member' },
  '備註': { 'zh-CN': '备注', en: 'Note' },
  '儲存訂閱設定': { 'zh-CN': '保存订阅设置', en: 'Save subscription' },
  '已更新': { 'zh-CN': '已更新', en: 'Updated' },
  '更新失敗': { 'zh-CN': '更新失败', en: 'Update failed' },
  '創始名額：{used} / {total}': { 'zh-CN': '创始名额：{used} / {total}', en: 'Founding seats: {used} / {total}' },
  '找不到符合的使用者': { 'zh-CN': '找不到符合的用户', en: 'No matching users' },
}
