import { base44 } from '@/api/base44Client';

// セッションIDを取得（なければ生成）
function getSessionId() {
  let sid = sessionStorage.getItem('lp_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('lp_session_id', sid);
  }
  return sid;
}

// LP イベントを非同期送信（UIをブロックしない）
export function trackLPEvent(lpId, eventType) {
  if (!lpId || !eventType) return;
  const session_id = getSessionId();
  const referrer = document.referrer || '';

  base44.functions.invoke('trackLPEvent', {
    lp_id: lpId,
    event_type: eventType,
    session_id,
    referrer,
  }).catch(() => {}); // エラーは無視
}