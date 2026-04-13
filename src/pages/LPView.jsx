import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import BlockRenderer from '@/components/lp/BlockRenderer';
import { Loader2 } from 'lucide-react';
import { useSeoHead } from '@/hooks/useSeoHead';
import { generateThemeCSS } from '@/lib/lpThemeRenderer';
import { trackLPEvent } from '@/lib/lpTracker';

function LPViewInner({ queryParams, preview }) {
  const [themeCSS, setThemeCSS] = useState('');

  // getLandingPageWithTheme でLP+ブロック+テーマを一括取得
  const { data: lpData, isLoading } = useQuery({
    queryKey: ['lpWithTheme', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams(queryParams).toString();
      const res = await base44.functions.invoke('getLandingPageWithTheme?' + params, {});
      return res.data;
    },
    enabled: Object.keys(queryParams).length > 0,
  });

  const lp = lpData?.lp;
  const blocks = lpData?.blocks || [];
  const themeData = lpData?.theme;
  const useTheme = lpData?.useTheme;
  const siteId = lp?.site_id;
  const isCodeLP = lp?.source_type === 'pasted_code';
  const canView = !lp || lp.status === 'published' || preview === 'true';

  // GitHub保存HTMLの取得
  const [githubHtml, setGithubHtml] = useState(null);
  useEffect(() => {
    if (lp?.html_file_url) {
      fetch(lp.html_file_url)
        .then(r => r.text())
        .then(html => setGithubHtml(html))
        .catch(() => setGithubHtml(''));
    }
  }, [lp?.html_file_url]);

  // ページビュートラッキング
  useEffect(() => {
    if (lp?.id && (lp.status === 'published' || preview === 'true')) {
      trackLPEvent(lp.id, 'view');
    }
  }, [lp?.id]);

  // テーマCSS生成
  useEffect(() => {
    if (themeData && useTheme) {
      setThemeCSS(generateThemeCSS(themeData));
    }
  }, [themeData, useTheme]);

  // SEOデータ取得
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

  if (isLoading) {
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

  // コード貼り付けLP
  if (isCodeLP) {
    // html_file_url がある場合はGitHubから取得したHTMLを使用
    if (lp.html_file_url && githubHtml === null) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      );
    }
    const htmlToDisplay = (lp.html_file_url ? githubHtml : null) || lp.sanitized_html || lp.html_code || '';
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

  // ブロック型LP
  return (
    <div className="min-h-screen">
      {themeCSS && <style>{themeCSS}</style>}
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          siteId={siteId}
          lpId={lp?.id}
          theme={themeData}
          useTheme={useTheme}
        />
      ))}
    </div>
  );
}

export default function LPView() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const preview = urlParams.get('preview');

  // LP解決用パラメータを優先順位に従って決定
  const lpId = urlParams.get('lp_id');
  const slug = urlParams.get('slug') || pathParts[pathParts.indexOf('lp') + 1] || '';
  const subdomain = urlParams.get('subdomain');
  const siteId = urlParams.get('site_id');
  const lpSlug = urlParams.get('lp_slug');
  const domain = urlParams.get('domain');

  let queryParams = {};
  if (lpId) {
    queryParams = { lp_id: lpId };
  } else if (domain) {
    queryParams = { domain };
  } else if (subdomain) {
    queryParams = { subdomain };
  } else if (siteId && lpSlug) {
    queryParams = { site_id: siteId, lp_slug: lpSlug };
  } else if (slug) {
    // 既存動作: slugでLPを直接検索（lp_idとして渡すのではなくslugで検索）
    queryParams = { slug };
  }

  if (Object.keys(queryParams).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <p>LP識別子が指定されていません</p>
      </div>
    );
  }

  return <LPViewInner queryParams={queryParams} preview={preview} />;
}