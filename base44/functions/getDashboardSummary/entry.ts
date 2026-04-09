import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 並列取得
    const [sites, lps, analyticsEvents, aiUsageLogs] = await Promise.all([
      base44.entities.Site.list('-created_date', 200).catch(() => []),
      base44.entities.LandingPage.list('-created_date', 200).catch(() => []),
      base44.entities.SiteAnalyticsEvent.list('-created_date', 10000).catch(() => []),
      base44.entities.AIUsageLog.list('-created_date', 500).catch(() => []),
    ]);

    // site_name: 最初の公開済みサイトまたは最初のサイト名
    const primarySite = (sites || []).find(s => s.status === 'published') || (sites || [])[0];
    const siteName = primarySite?.site_name || null;

    // site_summary
    const siteCount = sites.length;
    const publishedSiteCount = sites.filter(s => s.status === 'published').length;
    const lpCount = lps.length;
    const publishedLPCount = lps.filter(l => l.status === 'published').length;

    // analytics (today)
    const events = analyticsEvents || [];
    const todayEvents = events.filter(e => new Date(e.created_date) >= todayStart);

    const todayAccess = new Set(
      todayEvents.filter(e => e.event_type === 'page_view').map(e => e.visitor_id)
    ).size;

    const todayPV = todayEvents.filter(e => e.event_type === 'page_view').length;

    const todayReservation = todayEvents.filter(e =>
      ['booking_submit', 'booking_click'].includes(e.event_type)
    ).length;

    // monthly for access secondary
    const monthlyAccess = new Set(
      events.filter(e => new Date(e.created_date) >= monthStart && e.event_type === 'page_view').map(e => e.visitor_id)
    ).size;

    const monthlyReservation = events.filter(e =>
      new Date(e.created_date) >= monthStart &&
      ['booking_submit', 'booking_click'].includes(e.event_type)
    ).length;

    // AI usage
    const aiLimit = 50;
    const aiUsed = (aiUsageLogs || []).filter(a => new Date(a.created_date) >= monthStart).length;
    const aiRate = aiLimit > 0 ? Math.round((aiUsed / aiLimit) * 100) : 0;

    // Storage
    const storageUsed = 0;
    const storageLimit = 1000;
    const storageRate = storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0;

    // LP analytics (CV = booking_submit from LP events)
    const lpEvents = events.filter(e => e.lp_id != null);
    const lpAccess = new Set(
      lpEvents.filter(e => e.event_type === 'page_view').map(e => e.visitor_id)
    ).size;
    const lpCV = lpEvents.filter(e => e.event_type === 'booking_submit').length;
    const lpCVRate = lpAccess > 0 ? lpCV / lpAccess : 0;

    // KPIs — secondary_label/value は値が0の時は省略して重複感を排除
    const kpis = [
      {
        key: 'access',
        label: 'アクセス',
        primary_value: todayAccess,
        secondary_label: monthlyAccess > todayAccess ? '今月' : null,
        secondary_value: monthlyAccess > todayAccess ? monthlyAccess : null,
      },
      {
        key: 'page_view',
        label: 'ページビュー',
        primary_value: todayPV,
        secondary_label: null,
        secondary_value: null,
      },
      {
        key: 'reservation',
        label: '予約送信',
        primary_value: todayReservation,
        secondary_label: monthlyReservation > todayReservation ? '今月' : null,
        secondary_value: monthlyReservation > todayReservation ? monthlyReservation : null,
      },
      {
        key: 'sales',
        label: '売上',
        primary_value: 0,
        primary_unit: '円',
        secondary_label: null,
        secondary_value: null,
      },
      {
        key: 'customers',
        label: '顧客',
        primary_value: 0,
        secondary_label: null,
        secondary_value: null,
      },
      {
        key: 'ai_usage',
        label: 'AI生成',
        primary_value: aiUsed,
        limit_value: aiLimit,
        usage_rate: aiRate,
      },
      {
        key: 'storage',
        label: 'ストレージ',
        primary_value: storageUsed,
        primary_unit: 'MB',
        limit_value: storageLimit,
        limit_unit: 'MB',
        usage_rate: storageRate,
      },
    ];

    return Response.json({
      site_name: siteName,
      site_summary: {
        site_count: siteCount,
        published_site_count: publishedSiteCount,
        lp_count: lpCount,
        published_lp_count: publishedLPCount,
      },
      analytics: {
        today_access: todayAccess,
        today_pv: todayPV,
        today_reservation: todayReservation,
      },
      kpis,
      lp_analytics: {
        cv_count: lpCV,
        cv_rate: parseFloat(lpCVRate.toFixed(4)),
        access: lpAccess,
      },
      // 後方互換
      welcome_summary: {
        site_count: siteCount,
        published_site_count: publishedSiteCount,
        lp_count: lpCount,
        published_lp_count: publishedLPCount,
        site_limit: null,
        lp_limit: null,
      },
      analytics_quick_link: {
        today_access: todayAccess,
        today_page_view: todayPV,
        today_reservation_actions: todayReservation,
        link_url: '/AdminSiteAnalytics',
      },
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});