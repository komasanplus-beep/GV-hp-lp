import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import BlockRenderer from '@/components/lp/BlockRenderer';
import { Loader2 } from 'lucide-react';
import { useSeoHead } from '@/hooks/useSeoHead';
import { generateThemeCSS } from '@/lib/lpThemeRenderer';

function LPViewInner({ slug, preview, token }) {
  const [themeCSS, setThemeCSS] = useState('');

  const { data: pages = [], isLoading: lpLoading } = useQuery({
    queryKey: ['lpBySlug', slug],
    queryFn: () => base44.entities.LandingPage.filter({ slug }),
    enabled: !!slug,
  });

  const lp = pages[0];
  const siteId = lp?.site_id;

  // source_type が pasted_code の場合用の処理
  const isCodeLP = lp?.source_type === 'pasted_code';

  // 公開状態チェック（下書きで preview=true の場合は表示可）
  const canView = !lp || lp.status === 'published' || (preview === 'true');

  // テーマ取得
  const { data: themeData } = useQuery({
    queryKey: ['siteTheme', siteId],
    queryFn: async () => {
      if (!siteId) return null;
      const res = await base44.functions.invoke('getSiteTheme', { site_id: siteId });
      return res.data?.theme;
    },
    enabled: !!siteId && lp?.use_site_theme,
  });

  // テーマCSSを生成
  useEffect(() => {
    if (themeData && lp?.use_site_theme) {
      const css = generateThemeCSS(themeData);
      setThemeCSS(css);
    }
  }, [themeData, lp?.use_site_theme]);

  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['lpBlocksView', lp?.id],
    queryFn: () => base44.entities.LPBlock.filter({ lp_id: lp.id }, 'sort_order'),
    enabled: !!lp?.id && !isCodeLP,
  });

  // LP固有のSEOデータ (lp_id = lp.id)
  const { data: seoArr = [] } = useQuery({
    queryKey: ['lpSeo', lp?.id],
    queryFn: () => base44.entities.LPSeoData.filter({ lp_id: lp.id }),
    enabled: !!lp?.id,
  });
  const seo = seoArr[0] || null;

  useSeoHead({
    title: seo?.meta_title || lp?.title,
    description: seo?.meta_description,
    ogTitle: seo?.og_title,
    ogDescription: seo?.og_description,
    ogImage: seo?.og_image_url,
    canonicalUrl: seo?.canonical_url,
    keywords: seo?.seo_keywords,
  });

  if (lpLoading || blocksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!lp) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-2xl mb-2">ページが見つかりません</p>
          <p className="text-sm">/lp/{slug}</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-xl mb-2">このページは準備中です</p>
          <p className="text-sm">{lp.title}</p>
        </div>
      </div>
    );
  }

  // コード貼り付けLP の表示
  if (isCodeLP) {
    const htmlToDisplay = lp.sanitized_html || lp.html_code || '';
    const cssToDisplay = lp.css_code || '';

    if (!htmlToDisplay) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          <div className="text-center">
            <p className="text-xl mb-2">コンテンツが見つかりません</p>
            <p className="text-sm">{lp.title}</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <style>{cssToDisplay}</style>
        <div dangerouslySetInnerHTML={{ __html: htmlToDisplay }} />
      </div>
    );
  }

  // ブロック型LP の表示
  return (
    <div className="min-h-screen">
      {themeCSS && <style>{themeCSS}</style>}
      {blocks.map((block) => (
        <BlockRenderer 
          key={block.id} 
          block={block} 
          siteId={siteId} 
          theme={themeData}
          useTheme={lp?.use_site_theme}
        />
      ))}
    </div>
  );
}

export default function LPView() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const slug = urlParams.get('slug') || pathParts[pathParts.indexOf('lp') + 1] || '';
  const preview = urlParams.get('preview');
  const token = urlParams.get('token');

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <p>slug が指定されていません</p>
      </div>
    );
  }

  return <LPViewInner slug={slug} preview={preview} token={token} />;
}