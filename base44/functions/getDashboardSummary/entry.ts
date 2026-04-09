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

    // ----- welcome_summary -----
    const siteCount = sites.length;
    const publishedSiteCount = sites.filter(s => s.status === 'published').length;
    const lpCount = lps.length;
    const publishedLPCount = lps.filter(l => l.status === 'published').length;

    const welcomeSummary = {
      site_count: siteCount,
      published_site_count: publishedSiteCount,
      lp_count: lpCount,
      published_lp_count: publishedLPCount,
      site_limit: null, // プラン制限なし
      lp_limit: null,
    };

    // ----- analytics集計 -----
    const events = analyticsEvents || [];

    const accessToday = new Set(
      events
        .filter(e => new Date(e.created_date) >= todayStart && e.event_type === 'page_view')
        .map(e => e.visitor_id)
    ).size;

    const accessMonthly = new Set(
      events
        .filter(e => new Date(e.created_date) >= monthStart && e.event_type === 'page_view')
        .map(e => e.visitor_id)
    ).size;

    const pageViewToday = events.filter(e =>
      new Date(e.created_date) >= todayStart && e.event_type === 'page_view'
    ).length;

    const bookingActionToday = events.filter(e =>
      new Date(e.created_date) >= todayStart &&
      ['booking_submit', 'booking_click'].includes(e.event_type)
    ).length;

    const bookingActionMonthly = events.filter(e =>
      new Date(e.created_date) >= monthStart &&
      ['booking_submit', 'booking_click'].includes(e.event_type)
    ).length;

    const analyticsQuickLink = {
      today_access: accessToday,
      today_page_view: pageViewToday,
      today_reservation_actions: bookingActionToday,
      link_url: '/AdminSiteAnalytics',
    };

    // ----- AI使用量 -----
    const aiLimit = 50;
    const aiUsed = (aiUsageLogs || []).filter(a =>
      new Date(a.created_date) >= monthStart
    ).length;
    const aiRate = aiLimit > 0 ? Math.round((aiUsed / aiLimit) * 100) : 0;

    // ----- ストレージ(仮) -----
    const storageUsed = 0;
    const storageLimit = 1000;
    const storageRate = storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0;

    // ----- KPIs配列 -----
    const kpis = [
      {
        key: 'access',
        label: 'アクセス',
        primary_value: accessToday,
        primary_unit: null,
        secondary_label: accessMonthly > 0 ? '今月' : null,
        secondary_value: accessMonthly > 0 ? accessMonthly : null,
      },
      {
        key: 'page_view',
        label: 'ページビュー',
        primary_value: pageViewToday,
        primary_unit: null,
        secondary_label: null,
        secondary_value: null,
      },
      {
        key: 'reservation',
        label: '予約送信',
        primary_value: bookingActionToday,
        primary_unit: null,
        secondary_label: bookingActionMonthly > 0 ? '今月' : null,
        secondary_value: bookingActionMonthly > 0 ? bookingActionMonthly : null,
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
        primary_unit: null,
        secondary_label: null,
        secondary_value: null,
      },
      {
        key: 'ai_usage',
        label: 'AI生成',
        primary_value: aiUsed,
        primary_unit: null,
        limit_value: aiLimit,
        limit_unit: null,
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

    // 後方互換: 旧形式レスポンスも保持
    const legacySummary = {
      analytics: {
        access_today: accessToday,
        access_monthly: accessMonthly,
        page_view_today: pageViewToday,
        page_view_monthly: 0,
        booking_action_today: bookingActionToday,
        booking_action_monthly: bookingActionMonthly,
      },
      sales: { today: 0, monthly: 0 },
      guests: { total: 0, monthly_new: 0 },
      ai_usage: { used: aiUsed, limit: aiLimit },
      storage: { used: storageUsed, limit: storageLimit },
      site_usage: {
        site_used: siteCount,
        site_limit: 999,
        lp_used: lpCount,
        lp_limit: 999,
        published_site: publishedSiteCount,
        published_lp: publishedLPCount,
      },
    };

    return Response.json({
      welcome_summary: welcomeSummary,
      analytics_quick_link: analyticsQuickLink,
      kpis,
      ...legacySummary,
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});