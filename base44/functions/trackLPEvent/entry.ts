import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { lp_id, event_type, session_id } = body;

    // バリデーション
    if (!lp_id || !event_type) {
      return Response.json({ error: 'lp_id and event_type are required' }, { status: 400 });
    }
    if (!['view', 'click', 'conversion'].includes(event_type)) {
      return Response.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    // viewの場合: 同一セッションの直近1分以内の重複を防止
    if (event_type === 'view' && session_id) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const recentLogs = await base44.asServiceRole.entities.LpEventLog.filter({
        lp_id,
        event_type: 'view',
        session_id,
      }, '-created_date', 1).catch(() => []);

      if (recentLogs.length > 0) {
        const lastLog = recentLogs[0];
        if (lastLog && new Date(lastLog.created_date) > new Date(oneMinuteAgo)) {
          return Response.json({ success: true, skipped: true });
        }
      }
    }

    const userAgent = req.headers.get('user-agent') || '';
    const referrer = body.referrer || '';

    await base44.asServiceRole.entities.LpEventLog.create({
      lp_id,
      event_type,
      session_id: session_id || null,
      user_agent: userAgent.slice(0, 300),
      referrer: referrer.slice(0, 500),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('trackLPEvent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});