/**
 * SiteView - サイト固有の公開ビュー
 * URL: /site/:siteId  または  /SiteView?site_id=xxx
 * - published ページのブロックを順番通りに表示
 * - SEOデータをdocument headに適用
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SiteBlockRenderer from '@/components/site/SiteBlockRenderer';
import { Loader2 } from 'lucide-react';
import { useSeoHead } from '@/hooks/useSeoHead';

function SiteViewInner({ siteId }) {
  const { data: siteArr = [], isLoading: loadingSite } = useQuery({
    queryKey: ['siteById', siteId],
    queryFn: () => base44.entities.Site.filter({ id: siteId }),
    enabled: !!siteId,
  });
  const site = siteArr[0] || null;

  // ホームページを取得（page_type: 'home' 優先、なければ sort_order 最小）
  const { data: pages = [], isLoading: loadingPages } = useQuery({
    queryKey: ['sitePages', siteId],
    queryFn: () => base44.entities.SitePage.filter({ site_id: siteId }, 'sort_order'),
    enabled: !!siteId,
  });

  const homePage = pages.find(p => p.page_type === 'home') || pages[0] || null;

  const { data: blocks = [], isLoading: loadingBlocks } = useQuery({
    queryKey: ['siteBlocksView', homePage?.id],
    queryFn: () => base44.entities.SiteBlock.filter({ page_id: homePage.id }, 'sort_order'),
    enabled: !!homePage?.id,
  });

  // SEOデータ (target_type: 'site')
  const { data: seoArr = [] } = useQuery({
    queryKey: ['siteSeo', siteId],
    queryFn: () => base44.entities.LPSeoData.filter({ lp_id: siteId }),
    enabled: !!siteId,
  });
  const seo = seoArr[0] || null;

  useSeoHead({
    title: seo?.meta_title || site?.site_name,
    description: seo?.meta_description,
    ogTitle: seo?.og_title,
    ogDescription: seo?.og_description,
    ogImage: seo?.og_image_url,
    canonicalUrl: seo?.canonical_url,
    keywords: seo?.seo_keywords,
  });

  const isLoading = loadingSite || loadingPages || loadingBlocks;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
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

  // URLパラメータにpreview=trueがあれば下書きでも表示
  const urlParams2 = new URLSearchParams(window.location.search);
  const isPreview = urlParams2.get('preview') === 'true';

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
  // /site/:siteId または ?site_id=xxx
  const siteId = urlParams.get('site_id')
    || (pathParts.includes('site') ? pathParts[pathParts.indexOf('site') + 1] : null)
    || '';

  if (!siteId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <p>site_id が指定されていません</p>
      </div>
    );
  }

  return <SiteViewInner siteId={siteId} />;
}