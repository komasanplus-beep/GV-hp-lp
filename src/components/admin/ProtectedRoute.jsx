import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        
        if (!authenticated) {
          // Redirect to login with return URL
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        // If error, redirect to login
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-slate-600">認証確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return children;
}