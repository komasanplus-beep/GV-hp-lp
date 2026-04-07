import React from 'react';
import { Star, CheckCircle, ChevronRight } from 'lucide-react';

const parseLines = (text) => (text || '').split('\n').map(s => s.trim()).filter(Boolean);
const parsePairs = (text) => parseLines(text).map(line => {
  const [a, b] = line.split('|');
  return { a: (a || '').trim(), b: (b || '').trim() };
});

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
          ? `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)) center/cover, url(${d.image_url}) center/cover no-repeat`
          : 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)'
      }}
    >
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center w-full">
        {d.eyebrow && <p className="text-amber-400 tracking-widest text-xs md:text-sm uppercase mb-4">{d.eyebrow}</p>}
        {d.headline && <h1 className="text-3xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight" style={{ fontFamily: 'serif' }}>{d.headline}</h1>}
        {d.subheadline && <p className="text-base md:text-lg lg:text-xl text-white/80 mb-10 font-light">{d.subheadline}</p>}
        {d.cta_text && (
          <a href={ctaUrl(d.cta_url || '#booking')} className="inline-block w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 md:px-10 py-4 text-base md:text-lg font-light tracking-wide transition-colors text-center">
            {d.cta_text}
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
            {d.title && <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-slate-900 mb-6 md:mb-8" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
            <ul className="space-y-3 md:space-y-4">
              {parseLines(d.items).map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="text-red-400 mt-0.5 text-lg shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {d.image_url && (
            <img src={d.image_url} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl shadow" />
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'Solution') return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          {d.image_url && (
            <img src={d.image_url} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl shadow" />
          )}
          <div>
            {d.title && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-4 md:mb-6" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
            {d.body && <div className="text-slate-600 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: d.body }} />}
          </div>
        </div>
      </div>
    </section>
  );

  if (type === 'Feature') return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {d.title && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <ul className="space-y-3 md:space-y-4">
            {parseLines(d.features).map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700">
                <CheckCircle className="text-amber-500 w-5 h-5 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {d.image_url && (
            <img src={d.image_url} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl shadow" />
          )}
        </div>
        {d.body && <div className="mt-6 md:mt-8 text-slate-600 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: d.body }} />}
      </div>
    </section>
  );

  if (type === 'Evidence') return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {d.title && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-6 md:mb-8 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {parsePairs(d.stats).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
            {parsePairs(d.stats).map((s, i) => (
              <div key={i} className="text-center p-4 md:p-6 bg-amber-50 rounded-xl">
                <div className="text-2xl md:text-3xl font-light text-amber-600">{s.b}</div>
                <div className="text-xs md:text-sm text-slate-500 mt-1">{s.a}</div>
              </div>
            ))}
          </div>
        )}
        {d.body && <div className="text-slate-600 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: d.body }} />}
        {d.image_url && (
          <img src={d.image_url} alt="" className="w-full h-48 md:h-56 object-cover rounded-xl shadow mt-6 md:mt-8" />
        )}
      </div>
    </section>
  );

  if (type === 'Voice') return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {d.title && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {parsePairs(d.voices).map((v, i) => (
            <div key={i} className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-100">
              <div className="flex mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-slate-700 leading-relaxed mb-3">「{v.b}」</p>
              <p className="text-sm text-slate-400">— {v.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (type === 'Flow') return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        {d.title && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="space-y-3 md:space-y-4">
          {parseLines(d.steps).map((step, i) => (
            <div key={i} className="flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-slate-50 rounded-xl">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-light shrink-0 text-sm">
                {i + 1}
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-700 text-sm md:text-base">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  if (type === 'Comparison') return (
    <section className="py-12 md:py-20 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        {d.title && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 md:p-6">
            <h3 className="font-semibold text-amber-700 mb-4 text-center">当サロン</h3>
            <ul className="space-y-2 md:space-y-3">
              {parseLines(d.our_points).map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700 text-sm md:text-base">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-100 rounded-xl p-5 md:p-6">
            <h3 className="font-semibold text-slate-500 mb-4 text-center">他店</h3>
            <ul className="space-y-2 md:space-y-3">
              {parseLines(d.other_points).map((p, i) => (
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
        {d.title && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-8 md:mb-10 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="space-y-3 md:space-y-4">
          {parsePairs(d.faqs).map((faq, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 md:px-6 py-3 md:py-4 font-medium text-slate-800 text-sm md:text-base">
                <span className="text-amber-500 mr-2">Q.</span>{faq.a}
              </div>
              <div className="px-4 md:px-6 py-3 md:py-4 text-slate-600 text-sm md:text-base">
                <span className="text-amber-500 mr-2">A.</span>{faq.b}
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
            {d.title && <h2 className="text-2xl md:text-3xl font-light text-slate-900 mb-4 md:mb-6" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
            {d.body && <div className="text-slate-600 leading-relaxed prose max-w-none" dangerouslySetInnerHTML={{ __html: d.body }} />}
          </div>
          {d.image_url && (
            <img src={d.image_url} alt="" className="w-full h-56 md:h-64 object-cover rounded-xl shadow" />
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'CTA') return (
    <section
      className="py-16 md:py-24 text-white text-center"
      style={{ backgroundColor: d.background_color || '#1a1a2e' }}
    >
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        {d.title && <h2 className="text-2xl md:text-3xl lg:text-4xl font-light mb-4 md:mb-6" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {d.body && <p className="text-white/70 mb-8 md:mb-10 leading-relaxed text-sm md:text-base">{d.body}</p>}
        {d.cta_text && (
          <a href={ctaUrl(d.cta_url || '#booking')} className="inline-block w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-10 md:px-12 py-4 text-base md:text-lg font-light tracking-wide transition-colors text-center">
            {d.cta_text}
          </a>
        )}
      </div>
    </section>
  );

  return <div className="py-8 text-center text-slate-400 text-sm">[{type} ブロック - 未対応]</div>;
}