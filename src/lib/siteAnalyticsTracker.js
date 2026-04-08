import { base44 } from '@/api/base44Client';

// Generate or retrieve session ID
function getSessionId() {
  const key = '__site_analytics_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

// Generate or retrieve visitor ID
function getVisitorId() {
  const key = '__site_analytics_visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = `vis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
}

// Detect device type
function getDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/ipad|android(?!.*mobi)/.test(userAgent)) {
    return 'tablet';
  } else if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

// Record event
export async function recordSiteEvent(eventType, { siteId, pageId, pagePath, ...rest }) {
  try {
    // Avoid double tracking in short time
    const key = `__site_analytics_last_${eventType}`;
    const now = Date.now();
    const lastTime = sessionStorage.getItem(key);
    if (lastTime && now - parseInt(lastTime) < 1000) {
      return;
    }
    sessionStorage.setItem(key, now.toString());

    await base44.functions.invoke('recordSiteAnalyticsEvent', {
      site_id: siteId,
      page_id: pageId,
      page_path: pagePath,
      event_type: eventType,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      referrer: document.referrer,
      device_type: getDeviceType(),
      ...rest,
    });
  } catch (error) {
    console.warn('Failed to record site event:', error);
    // Silently fail - don't break page functionality
  }
}

// Track page view
export function trackPageView(siteId, pageId, pagePath) {
  recordSiteEvent('page_view', { siteId, pageId, pagePath });
}

// Track booking form submission
export function trackBookingSubmit(siteId, pageId) {
  recordSiteEvent('booking_submit', { siteId, pageId });
}

// Track booking button click
export function trackBookingClick(siteId) {
  recordSiteEvent('booking_click', { siteId });
}

// Track external booking link click
export function trackExternalBookingClick(siteId) {
  recordSiteEvent('external_booking_click', { siteId });
}