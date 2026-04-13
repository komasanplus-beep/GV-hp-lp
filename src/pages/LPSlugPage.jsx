import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function LPSlugPage() {
  const { slug } = useParams();
  const [htmlContent, setHtmlContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    base44.functions.invoke('serveLpHtml', { slug })
      .then(res => {
        // レスポンスがHTMLテキストの場合
        const data = res.data;
        if (typeof data === 'string') {
          setHtmlContent(data);
        } else if (data?.error) {
          setError(data.error);
        } else {
          setError('コンテンツを取得できませんでした');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="text-xl mb-2">ページが見つかりません</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcdoc={htmlContent}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      title={slug}
    />
  );
}