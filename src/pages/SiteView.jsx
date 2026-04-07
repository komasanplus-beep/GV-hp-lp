/**
 * SiteView - サイト固有の公開ビュー
 * URL: /site/:siteId  または  /SiteView?site_id=xxx
 *
 * データ取得は getSiteViewData backend function に一元化。
 * 公開判定・権限チェックはすべて function 側で行う。
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SiteBlockRenderer from '@/components/site/SiteBlockRenderer';
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

  // 401/403: プレビュー権限なし
  if (error || !site) {
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

  return (
    <div className="min-h-screen">
      {blocks.map((block) => (
        <SiteBlockRenderer key={block.id} block={block} />
      ))}
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