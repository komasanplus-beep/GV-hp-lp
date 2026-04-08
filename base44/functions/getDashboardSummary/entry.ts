import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // 並列取得（存在するエンティティのみ）
    const [
      sites,
      lps,
    ] = await Promise.all([
      base44.entities.Site.list('-created_date', 100).catch(() => []),
      base44.entities.LandingPage.list('-created_date', 100).catch(() => []),
    ]);

    // 簡易版：実際のデータは以下参照
    const bookings = [];
    const aiUsage = [];
    const subscription = [];

    // 予約集計
    const bookingToday = (bookings || []).filter(b => {
      const bd = new Date(b.created_date);
      return bd >= today;
    }).length;
    const bookingMonthly = (bookings || []).filter(b => {
      const bd = new Date(b.created_date);
      return bd >= monthStart && bd <= monthEnd;
    }).length;

    // 売上集計（簡易版：予約から仮計算）
    const salesToday = bookingToday * 10000; // 仮：1件1万円
    const salesMonthly = bookingMonthly * 10000;

    // 顧客集計
    const guests = [];
    const totalGuests = 0;
    const monthlyNewGuests = 0;

    // AI使用量（AIUsageLogがあれば、なければ0）
    const aiUsed = (aiUsage || []).filter(a => {
      const ad = new Date(a.created_date);
      return ad >= monthStart && ad <= monthEnd;
    }).length;

    // サブスク情報から上限取得（デフォルト値）
    const aiLimit = 50; // デフォルト上限
    const storageLimit = 1000; // MB
    const storageUsed = 0;

    // サイト・LP利用状況
    const siteUsed = (sites || []).length;
    const siteLimit = 999; // 上限なし
    const lpUsed = (lps || []).length;
    const lpLimit = 999; // 上限なし
    const publishedSite = (sites || []).filter(s => s.status === 'published').length;
    const publishedLP = (lps || []).filter(l => l.status === 'published').length;

    const summary = {
      booking: {
        today: bookingToday,
        monthly: bookingMonthly,
      },
      sales: {
        today: salesToday,
        monthly: salesMonthly,
      },
      guests: {
        total: totalGuests,
        monthly_new: monthlyNewGuests,
      },
      ai_usage: {
        used: aiUsed,
        limit: aiLimit,
      },
      storage: {
        used: storageUsed,
        limit: storageLimit,
      },
      site_usage: {
        site_used: siteUsed,
        site_limit: siteLimit,
        lp_used: lpUsed,
        lp_limit: lpLimit,
        published_site: publishedSite,
        published_lp: publishedLP,
      },
    };

    return Response.json(summary);
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});