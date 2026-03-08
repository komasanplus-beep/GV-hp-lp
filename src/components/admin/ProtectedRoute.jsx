import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute
 * requiredRole: 'master' | 'admin' | 'any' (default: 'any')
 * - 'master': masterロールのみアクセス可、それ以外は /dashboard へ
 * - 'admin': admin/editorロールのみ、masterは /master へ
 * - 'any': 認証のみチェック
 */
export default function ProtectedRoute({ children, requiredRole = 'any' }) {
  const [status, setStatus] = useState('checking'); // checking | ok | redirect

  useEffect(() => {
    const check = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      if (requiredRole === 'any') {
        setStatus('ok');
        return;
      }

      try {
        const user = await base44.auth.me();
        const role = user?.role || 'user';

        if (requiredRole === 'master') {
          if (role === 'master' || role === 'admin') {
            setStatus('ok');
          } else {
            window.location.href = createPageUrl('UserDashboard');
          }
        } else if (requiredRole === 'admin') {
          setStatus('ok');
        }
      } catch {
        base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    check();
  }, [requiredRole]);

  if (status === 'checking' || status === 'redirect') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-slate-600">認証確認中...</p>
        </div>
      </div>
    );
  }

  return children;
}