import React from 'react';
import { Star, CheckCircle } from 'lucide-react';

const toText = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value
      .flatMap(v => {
        if (v == null) return [];
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return [String(v)];
        if (typeof v === 'object') return Object.values(v).filter(Boolean).map(String);
        return [String(v)];
      })
      .filter(Boolean)
      .join(' ');
  }
  if (typeof value === 'object') {
    return Object.values(value).filter(Boolean).map(String).join(' ');
  }
  return String(value);
};

const toLines = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap(v => {
        if (v == null) return [];
        if (typeof v === 'string') return v.split('\n');
        if (typeof v === 'number' || typeof v === 'boolean') return [String(v)];
        if (typeof v === 'object') return Object.values(v).filter(Boolean).map(String);
        return [String(v)];
      })
      .map(v => String(v).trim())
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return Object.values(value).filter(Boolean).map(v => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split('\n')
    .map(v => v.trim())
    .filter(Boolean);
};

const toPairs = (value) => {
  return toLines(value).map((line) => {
    const parts = String(line).split('|');
    return {
      left: (parts[0] || '').trim(),
      right: (parts[1] || '').trim()
    };
  });
};

export default function BlockRenderer({ block, siteId }) {
  const d = block?.data || {};
  const type = block.block_type;
  
  // CTA・Hero・footer CTAを site 予約・問い合わせに遷移
  const ctaUrl = (url) => {
    if (!url) return '#';
    // すでに絶対URLの場合はそのまま返す
    if (url.startsWith('http') || url.startsWith('/')) return url;
    // 相対URLの場合は site に遷移
    if (siteId) {
      if (url === '#booking') return `/site/${siteId}?section=booking`;
      if (url === '#contact') return `/site/${siteId}?section=contact`;
    }
    return url;
  };

  if (type === 'Hero') return (
    <section
      className="relative min-h-screen flex items-center justify-center text-white"
      style={{
        background: d.image_url
          ? `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)) center/cover, url(${toText(d.image_url)}) center/cover no-repeat`
          : 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)'
      }}
    >
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center w-full">
        {toText(d.eyebrow) && <p className="text-amber-400 tracking-widest text-xs md:text-sm uppercase mb-4">{toText(d.eyebrow)}</p>}
        {toText(d.headline) && <h1 className="text-3xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight" style={{ fontFamily: 'serif' }}>{toText(d.headline)}</h1>}
        {toText(d.subheadline) && <p className="text-base md:text-lg lg:text-xl text-white/80 mb-10 font-light">{toText(d.subheadline)}</p>}
        {toText(d.cta_text) && (
          <a href={ctaUrl(d.cta_url || '#booking')} className="inline-block w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 md:px-10 py-4 text-base md:text-lg font-light tracking-wide transition-colors text-center">
            {toText(d.cta_text)}
          </a>
        )}
      </div>
    </section>
  );

  if (type === 'Problem') return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            {toText(d.title) && <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-900 mb-6 md:mb-8" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
            <ul className="space-y-3 md:space-y-4">
              {toLines(d.items).map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="text-red-400 mt-0.5 text-lg shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {toText(d.image_url) && (
            <img src={toText(d.image_url)} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl shadow" />
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'Solution') return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          {toText(d.image_url) && (
            <img src={toText(d.image_url)} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl shadow" />
          )}
          <div>
            {toText(d.title) && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-4 md:mb-6" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
            {toText(d.body) && <div className="text-slate-600 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: toText(d.body) }} />}
          </div>
        </div>
      </div>
    </section>
  );

  if (type === 'Feature') return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {toText(d.title) && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <ul className="space-y-3 md:space-y-4">
            {toLines(d.features).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700">
                <CheckCircle className="text-amber-500 w-5 h-5 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {toText(d.image_url) && (
            <img src={toText(d.image_url)} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl shadow" />
          )}
        </div>
        {toText(d.body) && <div className="mt-6 md:mt-8 text-slate-600 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: toText(d.body) }} />}
      </div>
    </section>
  );

  if (type === 'Evidence') return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {toText(d.title) && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-6 md:mb-8 text-center" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
        {toPairs(d.stats).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
            {toPairs(d.stats).map((s, i) => (
              <div key={i} className="text-center p-4 md:p-6 bg-amber-50 rounded-xl">
                <div className="text-2xl md:text-3xl font-light text-amber-600">{s.right}</div>
                <div className="text-xs md:text-sm text-slate-500 mt-1">{s.left}</div>
              </div>
            ))}
          </div>
        )}
        {toText(d.body) && <div className="text-slate-600 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: toText(d.body) }} />}
        {toText(d.image_url) && (
          <img src={toText(d.image_url)} alt="" className="w-full h-48 md:h-56 object-cover rounded-xl shadow mt-6 md:mt-8" />
        )}
      </div>
    </section>
  );

  if (type === 'Voice') return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {toText(d.title) && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {toPairs(d.voices).map((v, i) => (
            <div key={i} className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-100">
              <div className="flex mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-slate-700 leading-relaxed mb-3">「{v.right}」</p>
              <p className="text-sm text-slate-400">— {v.left}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (type === 'Flow') return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {toText(d.title) && <h2 className="text-3xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
        {Array.isArray(d.steps) && d.steps.length > 0 ? (
          <div className="relative">
            {/* 接続線 */}
            {d.steps.length > 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-1 bg-gradient-to-b from-amber-300 to-amber-100 hidden md:block" />
            )}
            
            {/* ステップ一覧 */}
            <div className="space-y-8 relative z-10">
              {d.steps.map((step, index) => (
                <div key={step.id || index} className="flex gap-6 items-start">
                  {/* ステップ番号 */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white font-bold text-lg shadow-lg">
                      {index + 1}
                    </div>
                    {index < d.steps.length - 1 && (
                      <div className="hidden md:block w-1 h-12 bg-gradient-to-b from-amber-300 to-amber-100 mt-2" />
                    )}
                  </div>
                  
                  {/* コンテンツ */}
                  <div className="flex-1 pt-1">
                    {step.heading && (
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        {step.heading}
                      </h3>
                    )}
                    {step.description && (
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );

  if (type === 'Comparison') return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        {toText(d.title) && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 md:p-6">
            <h3 className="font-semibold text-amber-700 mb-4 text-center">当サロン</h3>
            <ul className="space-y-2 md:space-y-3">
              {toLines(d.our_points).map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700 text-sm md:text-base">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-100 rounded-xl p-5 md:p-6">
            <h3 className="font-semibold text-slate-500 mb-4 text-center">他店</h3>
            <ul className="space-y-2 md:space-y-3">
              {toLines(d.other_points).map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-500 text-sm md:text-base">
                  <span className="text-red-400 shrink-0">✗</span>{p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  if (type === 'FAQ') return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        {toText(d.title) && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
        <div className="space-y-3 md:space-y-4">
          {toPairs(d.faqs).map((faq, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 md:px-6 py-3 md:py-4 font-medium text-slate-800 text-sm md:text-base">
                <span className="text-amber-500 mr-2">Q.</span>{faq.left}
              </div>
              <div className="px-4 md:px-6 py-3 md:py-4 text-slate-600 text-sm md:text-base">
                <span className="text-amber-500 mr-2">A.</span>{faq.right}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (type === 'Future') return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div>
            {toText(d.title) && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-4 md:mb-6" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
            {toText(d.body) && <div className="text-slate-600 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: toText(d.body) }} />}
          </div>
          {toText(d.image_url) && (
            <img src={toText(d.image_url)} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl shadow" />
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'CTA') return (
    <section
      className="py-16 md:py-24 text-white text-center"
      style={{ backgroundColor: toText(d.background_color) || '#1a1a2e' }}
    >
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        {toText(d.title) && <h2 className="text-2xl md:text-3xl lg:text-4xl font-light mb-4 md:mb-6" style={{ fontFamily: 'serif' }}>{toText(d.title)}</h2>}
        {toText(d.body) && <p className="text-white/70 mb-8 md:mb-10 leading-relaxed text-sm md:text-base">{toText(d.body)}</p>}
        {toText(d.cta_text) && (
          <a href={ctaUrl(d.cta_url || '#booking')} className="inline-block w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-10 md:px-12 py-4 text-base md:text-lg font-light tracking-wide transition-colors text-center">
            {toText(d.cta_text)}
          </a>
        )}
      </div>
    </section>
  );

  return <div className="py-8 text-center text-slate-400 text-sm">[{type} ブロック - 未対応]</div>;
}