/**
 * SiteView - サイト固有の公開ビュー
 * URL: /site/:siteId  または  /SiteView?site_id=xxx
 *
 * データ取得は getSiteViewData backend function に一元化。
 * 公開判定・権限チェックはすべて function 側で行う。
 */
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SiteBlockRenderer from '@/components/site/SiteBlockRenderer.jsx';
import { Loader2 } from 'lucide-react';
import { useSeoHead } from '@/hooks/useSeoHead';

function SiteViewInner({ siteId, isPreview }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['siteViewData', siteId, isPreview],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSiteViewData', { site_id: siteId, preview: isPreview });
      return res.data;
    },
    enabled: !!siteId,
    retry: false,
  });

  const site = data?.site || null;
  const homePage = data?.homePage || null;
  const blocks = data?.blocks || [];
  const seo = data?.seo || null;

  // enabled_features 互換処理（旧サイトは全機能有効を想定）
  if (site) {
    site.enabled_features = site.enabled_features ?? {
      booking: true,
      blog: true,
      customer: true,
      inquiry: true,
    };
  }

  // section パラメータで booking/contact にスクロール遷移（Hook の呼び出しルール遵守）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    if (section && site) {
      const el = document.getElementById(`section-${section}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
      }
    }
  }, [site]);

  useSeoHead({
    title: seo?.meta_title || site?.site_name,
    description: seo?.meta_description,
    ogTitle: seo?.og_title,
    ogDescription: seo?.og_description,
    ogImage: seo?.og_image_url,
    canonicalUrl: seo?.canonical_url,
    keywords: seo?.seo_keywords,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // エラーハンドリング
  if (error) {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.error || '';

    if (status === 401) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          <div className="text-center">
            <p className="text-2xl mb-2">ログインが必要です</p>
            <p className="text-sm text-slate-400">下書きサイトを閲覧するにはログインしてください</p>
          </div>
        </div>
      );
    }

    if (status === 403) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          <div className="text-center">
            <p className="text-2xl mb-2">閲覧権限がありません</p>
            <p className="text-sm text-slate-400">この下書きサイトを閲覧する権限がありません</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-2xl mb-2">サイトが見つかりません</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-2xl mb-2">サイトが見つかりません</p>
        </div>
      </div>
    );
  }

  // 非公開（準備中）
  if (site.status !== 'published' && !isPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-xl mb-2">このサイトは準備中です</p>
          <p className="text-sm">{site.site_name}</p>
        </div>
      </div>
    );
  }

  if (!homePage || blocks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-xl mb-2">{site.site_name}</p>
          <p className="text-sm">コンテンツがまだ登録されていません</p>
        </div>
      </div>
    );
  }

  const navConfig = site?.navigation_config || {};
  const menuItems = navConfig.menu_items?.filter(m => m.is_visible) || [];
  const logoUrl = navConfig.logo_url || site?.logo_url;
  const siteName = navConfig.site_name_text || site?.site_name || 'Site';
  const bookingText = navConfig.booking_button_text || 'ご予約';
  const bookingUrl = navConfig.booking_button_url || '#booking';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logoUrl
              ? <img src={logoUrl} alt={siteName} className="h-8 w-auto" />
              : <span className="text-lg font-bold text-stone-800">{siteName}</span>
            }
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-stone-600">
            {menuItems.length > 0
              ? menuItems.map(item => (
                  <a key={item.label} href={item.href} className="hover:text-stone-900 transition-colors">
                    {item.label}
                  </a>
                ))
              : (
                  <>
                    <a href="#about" className="hover:text-stone-900 transition-colors">About</a>
                    <a href="#menu" className="hover:text-stone-900 transition-colors">Menu</a>
                    <a href="#staff" className="hover:text-stone-900 transition-colors">Staff</a>
                    <a href="#gallery" className="hover:text-stone-900 transition-colors">Gallery</a>
                    <a href="#contact" className="hover:text-stone-900 transition-colors">Contact</a>
                  </>
                )
            }
            <a href={bookingUrl} className="ml-4 px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors">
              {bookingText}
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {blocks.map((block) => (
          <div key={block.id} id={block.block_type === 'Booking' || block.block_type === 'Contact' ? `section-${block.block_type.toLowerCase()}` : undefined}>
            <SiteBlockRenderer block={block} />
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-500 text-center py-6 text-xs mt-auto">
        © {new Date().getFullYear()} {site?.site_name || 'Site'}. All rights reserved.
      </footer>
    </div>
  );
}

export default function SiteView() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const siteId = urlParams.get('site_id')
    || (pathParts.includes('site') ? pathParts[pathParts.indexOf('site') + 1] : null)
    || '';
  const isPreview = urlParams.get('preview') === 'true';

  if (!siteId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <p>site_id が指定されていません</p>
      </div>
    );
  }

  return <SiteViewInner siteId={siteId} isPreview={isPreview} />;
}