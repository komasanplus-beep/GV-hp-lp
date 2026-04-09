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

    // 並列取得
    const [sites, lps, analyticsEvents, aiUsageLogs, lpAnalyticsList] = await Promise.all([
      base44.entities.Site.list('-created_date', 200).catch(() => []),
      base44.entities.LandingPage.list('-created_date', 200).catch(() => []),
      base44.entities.SiteAnalyticsEvent.list('-created_date', 10000).catch(() => []),
      base44.entities.AIUsageLog.list('-created_date', 500).catch(() => []),
      base44.entities.LPAnalytics.list('-created_date', 500).catch(() => []),
    ]);

    // site_name
    const primarySite = (sites || []).find(s => s.status === 'published') || (sites || [])[0];
    const siteName = primarySite?.site_name || null;

    // site_summary
    const siteCount = (sites || []).length;
    const publishedSiteCount = (sites || []).filter(s => s.status === 'published').length;
    const lpCount = (lps || []).length;
    const publishedLPCount = (lps || []).filter(l => l.status === 'published').length;

    // 今月イベント集計
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
    const aiLimit = 50;
    const aiUsed = (aiUsageLogs || []).filter(a => new Date(a.created_date) >= monthStart).length;
    const aiRate = aiLimit > 0 ? Math.round((aiUsed / aiLimit) * 100) : 0;
    const storageUsed = 0;
    const storageLimit = 1000;
    const storageRate = storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0;

    // lp_kpi_summary — LPAnalytics集計 (今月分)
    // LPAnalyticsは lp_id, page_views, cta_clicks, conversions フィールドを想定
    const lpAnalytics = lpAnalyticsList || [];
    const lpMonthly = lpAnalytics; // LPAnalyticsは累計値なので全件合算
    const lpPV = lpMonthly.reduce((s, a) => s + (a.page_views || 0), 0);
    const lpCTA = lpMonthly.reduce((s, a) => s + (a.cta_clicks || 0), 0);
    const lpCV = lpMonthly.reduce((s, a) => s + (a.conversions || 0), 0);
    const lpCVRate = lpPV > 0 ? parseFloat((lpCV / lpPV).toFixed(4)) : 0;

    // フォールバック: LPAnalyticsがなければSiteAnalyticsEventのlpイベントから集計
    let finalLpPV = lpPV;
    let finalLpCTA = lpCTA;
    let finalLpCV = lpCV;
    let finalLpCVRate = lpCVRate;
    if (lpMonthly.length === 0) {
      const lpEvents = monthlyEvents.filter(e => e.lp_id != null);
      finalLpPV = lpEvents.filter(e => e.event_type === 'page_view').length;
      finalLpCTA = lpEvents.filter(e => e.event_type === 'cta_click').length;
      finalLpCV = lpEvents.filter(e => e.event_type === 'booking_submit').length;
      finalLpCVRate = finalLpPV > 0 ? parseFloat((finalLpCV / finalLpPV).toFixed(4)) : 0;
    }

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