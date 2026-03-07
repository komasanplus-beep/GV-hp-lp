import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import BlockRenderer from '@/components/lp/BlockRenderer';
import { Loader2 } from 'lucide-react';

export default function LPView() {
  // ?slug=xxx または /lp/xxx の両方に対応
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const slug = urlParams.get('slug') || pathParts[pathParts.indexOf('lp') + 1] || '';

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