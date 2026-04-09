import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event_name, page_name, request_key } = body;

    if (!event_name || !page_name || !request_key) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 重複チェック: 同一 request_key の ログが1分以内にあるか
    try {
      const existingLogs = await base44.entities.UserTelemetryLog.filter({
        user_id: user.id,
        event_name,
        page_name,
        request_key,
      }, '-created_date', 1);

      if (existingLogs && existingLogs.length > 0) {
        // 既に記録されている → 重複として握りつぶして成功扱い
        console.log('[logUserEvent] Duplicate log ignored:', request_key);
        return Response.json({ success: true, duplicate: true });
      }
    } catch (e) {
      console.warn('[logUserEvent] Duplicate check failed:', e.message);
      // チェック失敗しても続行（ログ送信を阻害しない）
    }

    // 新規ログ記録
    try {
      await base44.entities.UserTelemetryLog.create({
        user_id: user.id,
        event_name,
        page_name,
        request_key,
      });
      console.log('[logUserEvent] Logged:', event_name, page_name);
    } catch (e) {
      console.warn('[logUserEvent] Create failed:', e.message);
      // ログ保存失敗しても 200 で返す（UI本体に影響なし）
    }

    return Response.json({ success: true, duplicate: false });
  } catch (error) {
    console.error('[logUserEvent] error:', error.message);
    // エラーでも 200 を返す（ログ送信は非クリティカル）
    return Response.json({ success: false, error: error.message }, { status: 200 });
  }
});