// ════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: delete-account
//
// 使用者在「我的健心檔案」頁面點「刪除帳號」確認後，由前端直接呼叫
// （supabase.functions.invoke('delete-account')）。
//
// 立即刪除，沒有緩衝期：呼叫 supabase.auth.admin.deleteUser() 刪掉
// auth.users 那一列後，會 cascade 刪光 profiles 及所有依賴表（見
// supabase/schema.sql 的 ON DELETE CASCADE 設定），不需要在這裡手動清各張表。
//
// 要刪除的 user id 只能來自呼叫者自己的 JWT（用 anon key + 呼叫者的
// Authorization header 建一個 client 呼叫 auth.getUser() 換出來），前端不能
// 傳 id 進來，避免任何刪除到別人帳號的可能。
//
// 部署：supabase functions deploy delete-account
//   （標準 JWT 驗證，不加 --no-verify-jwt——這支是登入使用者直接呼叫，
//   不是像 push-notify 那樣給資料庫 webhook 呼叫。）
// ════════════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'missing auth' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { error: delErr } = await adminClient.auth.admin.deleteUser(user.id)
    if (delErr) {
      console.error('[delete-account]', delErr)
      return new Response(JSON.stringify({ error: 'delete failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[delete-account]', error)
    return new Response(JSON.stringify({ error: 'internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
