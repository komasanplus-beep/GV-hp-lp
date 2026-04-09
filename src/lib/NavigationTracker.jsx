import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';
import { pagesConfig } from '@/pages.config';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];
    const prevPageRef = useRef(null);

    // [FIXED] Public routes をスキップ
    const isPublicRoute = [
        '/SiteView', '/site/', '/lp/', '/login', '/register'
    ].some(p => location.pathname.startsWith(p));

    // Post navigation changes to parent window
    useEffect(() => {
        window.parent?.postMessage({
            type: "app_changed_url",
            url: window.location.href
        }, '*');
    }, [location]);

    // [FIXED] Log user activity - public routes を除外し、重複ログを防止
    useEffect(() => {
        // Public routes ではログ送信しない
        if (isPublicRoute) {
            prevPageRef.current = null;
            return;
        }

        // Extract page name from pathname
        const pathname = location.pathname;
        let pageName;
        
        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            // Remove leading slash and get the first segment
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            
            // Try case-insensitive lookup in Pages config
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );
            
            pageName = matchedKey || null;
        }

        // 同じページへの重複ログを防止
        if (isAuthenticated && pageName && prevPageRef.current !== pageName) {
            prevPageRef.current = pageName;
            base44.appLogs.logUserInApp(pageName).catch(() => {
                // Silently fail - logging shouldn't break the app
            });
        }
    }, [location, isAuthenticated, Pages, mainPageKey, isPublicRoute]);

    return null;
}