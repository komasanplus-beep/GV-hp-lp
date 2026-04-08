import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req, { allowAnonymous: true });

    if (req.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405 });
    }

    const {
      site_id,
      page_id,
      page_path,
      event_type,
      session_id,
      visitor_id,
      referrer,
      device_type,
    } = await req.json();

    if (!site_id || !event_type || !session_id || !visitor_id) {
      return Response.json(
        { error: 'Missing required fields: site_id, event_type, session_id, visitor_id' },
        { status: 400 }
      );
    }

    // Validate event_type
    const validEventTypes = [
      'page_view',
      'site_visit',
      'booking_submit',
      'booking_click',
      'external_booking_click',
    ];
    if (!validEventTypes.includes(event_type)) {
      return Response.json({ error: `Invalid event_type: ${event_type}` }, { status: 400 });
    }

    // Store event
    await base44.asServiceRole.entities.SiteAnalyticsEvent.create({
      site_id,
      page_id: page_id || null,
      page_path: page_path || null,
      event_type,
      session_id,
      visitor_id,
      referrer: referrer || null,
      device_type: device_type || 'unknown',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('recordSiteAnalyticsEvent error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});