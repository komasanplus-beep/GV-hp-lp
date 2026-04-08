import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const params = new URLSearchParams(new URL(req.url).search);
    const siteId = params.get('site_id');
    const period = params.get('period') || '7d';
    const fromParam = params.get('from');
    const toParam = params.get('to');

    if (!siteId) {
      return Response.json({ error: 'site_id required' }, { status: 400 });
    }

    // Calculate date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let fromDate, toDate;

    if (period === 'custom' && fromParam && toParam) {
      fromDate = new Date(fromParam);
      toDate = new Date(toParam);
    } else if (period === '1d') {
      fromDate = startOfDay;
      toDate = new Date(startOfDay.getTime() + 86400000);
    } else if (period === '7d') {
      fromDate = new Date(startOfDay.getTime() - 7 * 86400000);
      toDate = new Date(startOfDay.getTime() + 86400000);
    } else if (period === '30d') {
      fromDate = new Date(startOfDay.getTime() - 30 * 86400000);
      toDate = new Date(startOfDay.getTime() + 86400000);
    } else if (period === 'month') {
      const year = today.getFullYear();
      const month = today.getMonth();
      fromDate = new Date(year, month, 1);
      toDate = new Date(year, month + 1, 1);
    }

    // Get all events in range
    const events = await base44.asServiceRole.entities.SiteAnalyticsEvent.filter({
      site_id: siteId,
    });

    // Get site pages
    const pages = await base44.asServiceRole.entities.SitePage.filter({
      site_id: siteId,
    });

    const pageMap = {};
    pages.forEach(p => {
      pageMap[p.id] = p;
    });

    // Filter by date range
    const inRange = events.filter(e => {
      const eventDate = new Date(e.created_date);
      return eventDate >= fromDate && eventDate <= toDate;
    });

    // Calculate previous period for comparison
    const periodMs = toDate.getTime() - fromDate.getTime();
    const prevFromDate = new Date(fromDate.getTime() - periodMs);
    const prevToDate = fromDate;

    const prevEvents = events.filter(e => {
      const eventDate = new Date(e.created_date);
      return eventDate >= prevFromDate && eventDate <= prevToDate;
    });

    // Aggregate summary
    const summary = {
      access_count: new Set(inRange.map(e => e.visitor_id)).size,
      page_view_count: inRange.filter(e => e.event_type === 'page_view').length,
      booking_submit_count: inRange.filter(e =>
        e.event_type === 'booking_submit' ||
        e.event_type === 'booking_click' ||
        e.event_type === 'external_booking_click'
      ).length,
      previous_access_count: new Set(prevEvents.map(e => e.visitor_id)).size,
      previous_page_view_count: prevEvents.filter(e => e.event_type === 'page_view').length,
      previous_booking_submit_count: prevEvents.filter(e =>
        e.event_type === 'booking_submit' ||
        e.event_type === 'booking_click' ||
        e.event_type === 'external_booking_click'
      ).length,
    };

    // Aggregate by page
    const pageAggregates = {};
    inRange.forEach(e => {
      if (!pageAggregates[e.page_id]) {
        pageAggregates[e.page_id] = {
          page_id: e.page_id,
          page_path: e.page_path,
          page_title: e.page_id ? pageMap[e.page_id]?.title : null,
          visitors: new Set(),
          page_views: 0,
          booking_submits: 0,
        };
      }
      pageAggregates[e.page_id].visitors.add(e.visitor_id);
      if (e.event_type === 'page_view') {
        pageAggregates[e.page_id].page_views++;
      }
      if (
        e.event_type === 'booking_submit' ||
        e.event_type === 'booking_click' ||
        e.event_type === 'external_booking_click'
      ) {
        pageAggregates[e.page_id].booking_submits++;
      }
    });

    const pagesList = Object.values(pageAggregates).map(p => ({
      page_id: p.page_id,
      page_title: p.page_title,
      page_path: p.page_path,
      access_count: p.visitors.size,
      page_view_count: p.page_views,
      booking_submit_count: p.booking_submits,
    })).sort((a, b) => b.access_count - a.access_count);

    // Aggregate by day
    const dailyAggregates = {};
    inRange.forEach(e => {
      const date = new Date(e.created_date).toISOString().split('T')[0];
      if (!dailyAggregates[date]) {
        dailyAggregates[date] = {
          date,
          visitors: new Set(),
          page_views: 0,
          booking_submits: 0,
        };
      }
      dailyAggregates[date].visitors.add(e.visitor_id);
      if (e.event_type === 'page_view') {
        dailyAggregates[date].page_views++;
      }
      if (
        e.event_type === 'booking_submit' ||
        e.event_type === 'booking_click' ||
        e.event_type === 'external_booking_click'
      ) {
        dailyAggregates[date].booking_submits++;
      }
    });

    const dailyData = Object.values(dailyAggregates)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        date: d.date,
        access_count: d.visitors.size,
        page_view_count: d.page_views,
        booking_submit_count: d.booking_submits,
      }));

    return Response.json({
      summary,
      pages: pagesList,
      daily: dailyData,
    });
  } catch (error) {
    console.error('getSiteAnalytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});