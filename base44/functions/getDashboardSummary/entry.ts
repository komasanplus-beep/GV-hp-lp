import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 順次取得（レート制限対策）
    let sites = [];
    try {
      sites = await base44.entities.Site.list('-created_date', 50);
    } catch (e) {
      console.warn('Site list error:', e.message);
    }

    let lps = [];
    try {
      lps = await base44.entities.LandingPage.list('-created_date', 50);
    } catch (e) {
      console.warn('LP list error:', e.message);
    }

    // site_name
    const primarySite = (sites || []).find(s => s.status === 'published') || (sites || [])[0];
    const siteName = primarySite?.site_name || null;

    // site_summary
    const siteCount = (sites || []).length;
    const publishedSiteCount = (sites || []).filter(s => s.status === 'published').length;
    const lpCount = (lps || []).length;
    const publishedLPCount = (lps || []).filter(l => l.status === 'published').length;

    // 今月イベント集計（エラー時は空配列）
    let analyticsEvents = [];
    try {
      analyticsEvents = await base44.entities.SiteAnalyticsEvent.list('-created_date', 1000);
    } catch (e) {
      console.warn('Analytics events error:', e.message);
    }

    const events = analyticsEvents || [];
    const monthlyEvents = events.filter(e => new Date(e.created_date) >= monthStart);

    // monthly_access_summary
    const monthlyAccessCount = new Set(
      monthlyEvents.filter(e => e.event_type === 'page_view').map(e => e.visitor_id)
    ).size;
    const monthlyPVCount = monthlyEvents.filter(e => e.event_type === 'page_view').length;

    // monthly_result_summary
    const monthlyReservation = monthlyEvents.filter(e =>
      ['booking_submit', 'booking_click'].includes(e.event_type)
    ).length;

    // monthly_usage_summary
    let aiUsageLogs = [];
    try {
      aiUsageLogs = await base44.entities.AIUsageLog.list('-created_date', 100);
    } catch (e) {
      console.warn('AI usage logs error:', e.message);
    }

    const aiLimit = 50;
    const aiUsed = (aiUsageLogs || []).filter(a => new Date(a.created_date) >= monthStart).length;
    const aiRate = aiLimit > 0 ? Math.round((aiUsed / aiLimit) * 100) : 0;
    const storageUsed = 0;
    const storageLimit = 1000;
    const storageRate = storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0;

    // lp_kpi_summary
    let lpEventLogs = [];
    try {
      lpEventLogs = await base44.entities.LpEventLog.list('-created_date', 1000);
    } catch (e) {
      console.warn('LP event logs error:', e.message);
    }

    const monthlyLpLogs = (lpEventLogs || []).filter(e => new Date(e.created_date) >= monthStart);
    const finalLpPV = monthlyLpLogs.filter(e => e.event_type === 'view').length;
    const finalLpCTA = monthlyLpLogs.filter(e => e.event_type === 'click').length;
    const finalLpCV = monthlyLpLogs.filter(e => e.event_type === 'conversion').length;
    const finalLpCVRate = finalLpPV > 0 ? parseFloat((finalLpCV / finalLpPV).toFixed(4)) : 0;

    return Response.json({
      site_name: siteName,
      site_summary: {
        site_count: siteCount,
        published_site_count: publishedSiteCount,
        lp_count: lpCount,
        published_lp_count: publishedLPCount,
      },
      monthly_access_summary: {
        access_count: monthlyAccessCount,
        page_view_count: monthlyPVCount,
      },
      monthly_result_summary: {
        reservation_count: monthlyReservation,
        sales_amount: 0,
        customer_count: 0,
      },
      monthly_usage_summary: {
        ai_used: aiUsed,
        ai_limit: aiLimit,
        ai_usage_rate: aiRate,
        storage_used: storageUsed,
        storage_limit: storageLimit,
        storage_usage_rate: storageRate,
      },
      lp_kpi_summary: {
        page_view_count: finalLpPV,
        cta_click_count: finalLpCTA,
        conversion_count: finalLpCV,
        cv_rate: finalLpCVRate,
      },
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});