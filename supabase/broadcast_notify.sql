-- ════════════════════════════════════════════════════════════════════════
-- 公告推播（WOOP 上架通知）— 用 pg_cron 排定「今晚 22:00」對所有裝置發一則推播。
--
-- 沿用 push_notifications.sql 已經設定好的 APNs 基礎建設（device_tokens、
-- WEBHOOK_SECRET），不需要重新設定 Edge Function secrets，只需要：
--   1. 部署新的 Edge Function：supabase functions deploy broadcast-notify --no-verify-jwt
--   2. 把下面的 <FUNCTION_URL>／<WEBHOOK_SECRET> 換掉，整份貼到 Supabase SQL Editor 執行
--
-- 時間換算：22:00 台北時間（UTC+8）＝ 14:00 UTC。下面的 cron 表達式
-- '0 14 2 8 *' 是「8 月 2 日 14:00 UTC」——只會在今天觸發一次，
-- 明年 8/2 才會再度符合，送出後記得執行檔尾的 cron.unschedule() 清掉。
--
-- 若這台專案還沒啟用過 pg_cron：Supabase Dashboard > Database > Extensions
-- 先手動啟用（跟 bot_likes_cron.sql 用的是同一個擴充功能，多半已經開著）。
-- ════════════════════════════════════════════════════════════════════════

SELECT cron.schedule(
  'woop-launch-notify-20260802',
  '0 14 2 8 *',
  $$
  SELECT net.http_post(
    url     := '<FUNCTION_URL>',            -- https://<project-ref>.supabase.co/functions/v1/broadcast-notify
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-webhook-secret', '<WEBHOOK_SECRET>'  -- 跟 push-notify 同一組 WEBHOOK_SECRET
               ),
    body    := jsonb_build_object(
                 'title', 'PSY by PSY',
                 'body',  '新上架：WOOP 目標實踐地圖 🎯 點擊立刻開始，為自己訂一個今天的小目標！'
               )
  );
  $$
);

-- ────────────────────────────────────────────────────────────────────────
-- 送出後的清理（今晚 22:00 過後找時間執行一次即可，避免明年同一天又跳出來）：
--   SELECT cron.unschedule('woop-launch-notify-20260802');
--
-- 想在排程時間到之前，先確認會發生什麼事、或想改文案：
--   直接用 curl 手動打一次 Edge Function 測試（不會等到 22:00）：
--   curl -X POST '<FUNCTION_URL>' \
--     -H 'Content-Type: application/json' \
--     -H 'x-webhook-secret: <WEBHOOK_SECRET>' \
--     -d '{"title":"PSY by PSY","body":"測試推播"}'
--
-- 查排程有沒有排上：SELECT * FROM cron.job WHERE jobname = 'woop-launch-notify-20260802';
-- 查有沒有真的執行：SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
-- ────────────────────────────────────────────────────────────────────────
