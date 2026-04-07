import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import BlockRenderer from '@/components/lp/BlockRenderer';
import { Loader2 } from 'lucide-react';
import { useSeoHead } from '@/hooks/useSeoHead';

function LPViewInner({ slug }) {
  const { data: pages = [], isLoading: lpLoading } = useQuery({
    queryKey: ['lpBySlug', slug],
    queryFn: () => base44.entities.LandingPage.filter({ slug }),
    enabled: !!slug,
  });

  const lp = pages[0];

  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['lpBlocksView', lp?.id],
    queryFn: () => base44.entities.LPBlock.filter({ lp_id: lp.id }, 'sort_order'),
    enabled: !!lp?.id,
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

  if (lp.status !== 'published') {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-xl mb-2">このページは準備中です</p>
          <p className="text-sm">{lp.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}

export default function LPView() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const slug = urlParams.get('slug') || pathParts[pathParts.indexOf('lp') + 1] || '';

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <p>slug が指定されていません</p>
      </div>
    );
  }

  return <LPViewInner slug={slug} />;
}