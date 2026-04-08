/**
 * SiteView - サイト固有の公開ビュー
 * URL: /site/:siteId  または  /SiteView?site_id=xxx
 *
 * データ取得は getSiteViewData backend function に一元化。
 * 公開判定・権限チェックはすべて function 側で行う。
 */
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SiteBlockRenderer from '@/components/site/SiteBlockRenderer.jsx';
import { Loader2, Menu, X } from 'lucide-react';
import { useSeoHead } from '@/hooks/useSeoHead';

function SiteViewInner({ siteId, isPreview }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    title: site?.seo_config?.meta_title || seo?.meta_title || site?.site_name,
    description: site?.seo_config?.meta_description || seo?.meta_description,
    ogImage: site?.seo_config?.og_image_url || seo?.og_image_url,
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
  
  // ロゴ優先順位: アップロード画像 > URL > サイト名テキスト
  const logoUrl = navConfig.logo_image_url || navConfig.logo_url || null;
  const logoAlt = navConfig.logo_alt || navConfig.site_name_text || site?.site_name || 'Site Logo';
  
  // 自動メニュー+手動メニューをマージ（取得時にすべてのページをlists）
  const autoMenuItems = navConfig.auto_menu_pages?.map(m => {
    const pageData = data?.all_pages?.find(p => p.id === m.page_id);
    return pageData ? {
      label: m.label_override || pageData.title,
      href: `/${pageData.slug}`,
      is_visible: m.show_in_header !== false,
      sort_order: m.sort_order,
    } : null;
  }).filter(Boolean) || [];
  
  const manualMenuItems = navConfig.menu_items?.filter(m => m.is_visible) || [];
  const allMenuItems = [...autoMenuItems, ...manualMenuItems].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  const siteName = navConfig.site_name_text || site?.site_name || 'Site';
  const bookingText = navConfig.booking_button_text || 'ご予約';
  const bookingUrl = navConfig.booking_button_url || '#booking';
  
  // ヘッダー表示用SNS
  const headerSocialLinks = navConfig.social_links?.filter(s => s.show_in_header && s.url) || [];
  
  // フッター設定
  const footerConfig = site?.footer_config || {};
  const footerSocialLinks = footerConfig.social_links?.filter(s => s.show_in_footer && s.url) || [];
  const fixedPages = data?.all_pages?.filter(p => ['privacy', 'security', 'compliance'].includes(p.page_category) && p.status === 'published') || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo/Site Name */}
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={logoAlt} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-lg font-bold text-stone-800">{siteName}</span>
            )}
          </div>

          {/* Desktop Menu + SNS */}
          <div className="hidden md:flex items-center gap-6 text-sm text-stone-600">
            {allMenuItems.length > 0
              ? allMenuItems.map(item => (
                  <a 
                    key={item.label} 
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        const target = document.getElementById(item.href.slice(1));
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </a>
                ))
              : null
            }

            {/* ヘッダーSNS */}
            {headerSocialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {headerSocialLinks.map(link => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target={link.open_new_tab ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="text-stone-500 hover:text-stone-700 transition-colors"
                    title={link.platform}
                  >
                    <span className="text-xs">{link.platform}</span>
                  </a>
                ))}
              </div>
            )}

            <button
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById('contact');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="ml-4 px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors cursor-pointer"
            >
              {bookingText}
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 transition-colors"
            aria-label="メニューを開く"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Panel */}
            <div className="fixed top-16 left-0 right-0 bg-white border-b border-stone-100 z-40 md:hidden shadow-lg">
              <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">
                {allMenuItems.length > 0
                  ? allMenuItems.map(item => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={(e) => {
                          if (item.href.startsWith('#')) {
                            e.preventDefault();
                            const target = document.getElementById(item.href.slice(1));
                            if (target) target.scrollIntoView({ behavior: 'smooth' });
                          }
                          setMobileMenuOpen(false);
                        }}
                        className="block px-4 py-2.5 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                      >
                        {item.label}
                      </a>
                    ))
                  : null
                }
                {headerSocialLinks.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <p className="text-xs font-medium text-stone-600 px-4">SNS</p>
                    {headerSocialLinks.map(link => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target={link.open_new_tab ? '_blank' : '_self'}
                        rel="noreferrer"
                        className="block px-4 py-2.5 text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                      >
                        {link.platform}
                      </a>
                    ))}
                  </div>
                )}
                <div className={headerSocialLinks.length > 0 ? 'border-t border-stone-100 pt-2' : ''}>
                  <button
                    onClick={() => {
                      const target = document.getElementById('contact');
                      if (target) target.scrollIntoView({ behavior: 'smooth' });
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg text-center font-medium hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    {bookingText}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
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
      <footer className="bg-stone-900 text-stone-500 text-center py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          {/* Copyright Text */}
          <p className="text-xs">
            {footerConfig?.copyright_text || (
              <>
                {footerConfig?.show_year !== false && <span>{new Date().getFullYear()} </span>}
                {footerConfig?.show_company_name && footerConfig?.company_name && <span>{footerConfig.company_name} </span>}
                {footerConfig?.show_site_name !== false && <span>{site?.site_name || 'Site'}</span>}
                . All rights reserved.
              </>
            )}
          </p>

          {/* Footer Links + Fixed Pages */}
          {(footerConfig?.footer_links?.length > 0 || fixedPages.length > 0 || footerSocialLinks.length > 0) && (
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              {/* 手動リンク */}
              {footerConfig?.footer_links?.map((link, idx) => (
                <a
                  key={`manual-${idx}`}
                  href={link.href}
                  className="hover:text-stone-300 transition-colors"
                >
                  {link.label}
                </a>
              ))}

              {/* 固定ページ */}
              {fixedPages.map(page => (
                <a
                  key={`fixed-${page.id}`}
                  href={`/${page.slug}`}
                  className="hover:text-stone-300 transition-colors"
                >
                  {page.title}
                </a>
              ))}
            </div>
          )}

          {/* Footer SNS */}
          {footerSocialLinks.length > 0 && (
            <div className="flex justify-center gap-4">
              {footerSocialLinks.map(link => (
                <a
                  key={link.platform}
                  href={link.url}
                  target={link.open_new_tab ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="text-stone-500 hover:text-stone-300 transition-colors text-xs"
                  title={link.platform}
                >
                  {link.platform}
                </a>
              ))}
            </div>
          )}
        </div>
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