/**
 * SiteBlockRenderer - Site用ブロックタイプのレンダリング
 * block_type: Hero, About, Menu, Service, Staff, Gallery, Voice, Feature, FAQ, Access, Contact, Booking, CTA, Campaign, Custom
 */
import React, { useState } from 'react';
import { Star, CheckCircle, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const parseLines = (text) => (text || '').split('\n').map(s => s.trim()).filter(Boolean);
const parsePairs = (text) => parseLines(text).map(line => {
  const [a, ...rest] = line.split('|');
  return { a: (a || '').trim(), b: rest.join('|').trim() };
});

function BookingBlock({ d, siteId }) {
  const [form, setForm] = useState({ name: '', email: '', date: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.date) return;
    setStatus('sending');
    await base44.entities.Reservation.create({
      site_id: siteId,
      name: form.name,
      email: form.email,
      date: form.date,
      message: form.message,
      status: 'pending',
    });
    setStatus('done');
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-4 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {d.body && <p className="text-slate-500 text-center mb-10">{d.body}</p>}
        {status === 'done' ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-xl font-light text-slate-700">ご予約ありがとうございます</p>
            <p className="text-slate-400 text-sm mt-2">確認メールをお送りいたします。</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="お名前 *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="メールアドレス *"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="ご来店日 *"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
            <textarea
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 h-32 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="その他ご要望・メッセージ"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            />
            <button
              type="submit"
              disabled={status === 'sending' || !form.name || !form.email || !form.date}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white py-4 rounded-lg font-light tracking-wide transition-colors"
            >
              {status === 'sending' ? '送信中...' : (d.button_text || 'ご予約する')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function ServiceBlock({ d, siteId }) {
  const { data: services = [] } = React.useQuery({
    queryKey: ['services', siteId],
    queryFn: () => base44.entities.Service.filter({ site_id: siteId }, 'sort_order'),
  });

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {d.subtitle && <p className="text-slate-500 text-center mb-10">{d.subtitle}</p>}
        {services.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(svc => (
              <div key={svc.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {svc.image_url && (
                  <img src={svc.image_url} alt={svc.name} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-800 mb-1">{svc.name}</h3>
                  {svc.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{svc.description}</p>}
                  <div className="flex items-center justify-between text-sm">
                    {svc.price > 0 && <span className="text-amber-600 font-medium">¥{svc.price.toLocaleString()}</span>}
                    {svc.duration && <span className="text-slate-400">{svc.duration}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-300 py-8 text-4xl">🛎️</div>
        )}
      </div>
    </section>
  );
}

function ContactBlock({ d, siteId }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus('sending');
    await base44.entities.Inquiry.create({
      site_id: siteId,
      name: form.name,
      email: form.email,
      message: form.message,
      status: 'new',
    });
    setStatus('done');
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-4 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {d.body && <p className="text-slate-500 text-center mb-10">{d.body}</p>}
        {status === 'done' ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-xl font-light text-slate-700">送信が完了しました</p>
            <p className="text-slate-400 text-sm mt-2">お問い合わせありがとうございます。</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="お名前 *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="メールアドレス *"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <textarea
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-slate-700 h-32 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="メッセージ *"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white py-4 rounded-lg font-light tracking-wide transition-colors"
            >
              {status === 'sending' ? '送信中...' : (d.button_text || '送信する')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function SiteBlockRenderer({ block }) {
  const d = block?.data || {};
  const type = block.block_type;

  if (type === 'Hero') return (
    <section
      className="relative min-h-screen flex items-center justify-center text-white"
      style={{
        background: d.image_url
          ? `linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)) center/cover, url(${d.image_url}) center/cover no-repeat`
          : 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)'
      }}
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        {d.eyebrow && <p className="text-amber-400 tracking-widest text-sm uppercase mb-4">{d.eyebrow}</p>}
        <h1 className="text-4xl md:text-6xl font-light mb-6 leading-tight" style={{ fontFamily: 'serif' }}>
          {d.headline || d.title || block.site_name || 'Welcome'}
        </h1>
        {d.subheadline && <p className="text-lg text-white/80 mb-10 font-light">{d.subheadline}</p>}
        {d.cta_text && (
          <a href={d.cta_url || '#contact'} className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-10 py-4 text-lg font-light tracking-wide transition-colors">
            {d.cta_text}
          </a>
        )}
      </div>
    </section>
  );

  if (type === 'About') return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-6" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
            {d.body && <p className="text-slate-600 leading-relaxed">{d.body}</p>}
            {d.tagline && <p className="mt-4 text-amber-600 italic">{d.tagline}</p>}
          </div>
          {d.image_url ? (
            <img src={d.image_url} alt="" className="w-full h-72 object-cover rounded-xl shadow-lg" />
          ) : (
            <div className="w-full h-72 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 text-6xl">🏢</div>
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'Menu' || type === 'Service') return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="grid md:grid-cols-2 gap-6">
          {parsePairs(d.items).length > 0 ? (
            parsePairs(d.items).map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm flex justify-between items-center">
                <span className="text-slate-700">{item.a}</span>
                {item.b && <span className="text-amber-600 font-medium">{item.b}</span>}
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center text-slate-300 py-8 text-4xl">📋</div>
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'Staff') return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {parsePairs(d.members).length > 0 ? (
            parsePairs(d.members).map((m, i) => (
              <div key={i} className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-3xl mb-4">👤</div>
                <p className="font-medium text-slate-800">{m.a}</p>
                {m.b && <p className="text-sm text-slate-500 mt-1">{m.b}</p>}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-slate-300 py-8 text-4xl">👥</div>
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'Gallery') return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {parseLines(d.image_urls).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {parseLines(d.image_urls).map((url, i) => (
              <img key={i} src={url} alt="" className="w-full h-48 object-cover rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-4xl">🖼</div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  if (type === 'Voice') return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="grid md:grid-cols-2 gap-6">
          {parsePairs(d.voices).map((v, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-6">
              <div className="flex mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-slate-700 leading-relaxed mb-3">「{v.b}」</p>
              <p className="text-sm text-slate-400">— {v.a}</p>
            </div>
          ))}
          {parsePairs(d.voices).length === 0 && (
            <div className="col-span-2 text-center text-slate-300 py-8 text-4xl">💬</div>
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'Feature') return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="grid md:grid-cols-3 gap-6">
          {parseLines(d.features).length > 0 ? (
            parseLines(d.features).map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <CheckCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <p className="text-slate-700">{f}</p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-slate-300 py-8 text-4xl">⭐</div>
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'FAQ') return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="space-y-4">
          {parsePairs(d.faqs).map((faq, i) => (
            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 font-medium text-slate-800">
                <span className="text-amber-500 mr-2">Q.</span>{faq.a}
              </div>
              <div className="px-6 py-4 text-slate-600">
                <span className="text-amber-500 mr-2">A.</span>{faq.b}
              </div>
            </div>
          ))}
          {parsePairs(d.faqs).length === 0 && (
            <div className="text-center text-slate-300 py-8 text-4xl">❓</div>
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'Access') return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            {d.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-slate-700">{d.address}</p>
              </div>
            )}
            {d.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-slate-700">{d.phone}</p>
              </div>
            )}
            {d.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-slate-700">{d.email}</p>
              </div>
            )}
            {d.hours && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-slate-700 whitespace-pre-line">{d.hours}</p>
              </div>
            )}
          </div>
          {d.map_embed_url ? (
            <iframe src={d.map_embed_url} className="w-full h-64 rounded-xl border-0" allowFullScreen loading="lazy" />
          ) : (
            <div className="w-full h-64 bg-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-4xl">🗺</div>
          )}
        </div>
      </div>
    </section>
  );

  if (type === 'Service') return <ServiceBlock d={d} siteId={block.site_id} />;

  if (type === 'Contact') return <ContactBlock d={d} siteId={block.site_id} />;

  if (type === 'Booking') return <BookingBlock d={d} siteId={block.site_id} />;

  if (type === 'CTA') return (
    <section
      className="py-24 text-white text-center"
      style={{ backgroundColor: d.background_color || '#1a1a2e' }}
    >
      <div className="max-w-2xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light mb-6" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {d.body && <p className="text-white/70 mb-10">{d.body}</p>}
        {d.cta_text && (
          <a href={d.cta_url || '#contact'} className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-12 py-4 text-lg font-light tracking-wide transition-colors">
            {d.cta_text}
          </a>
        )}
      </div>
    </section>
  );

  if (type === 'Campaign') return (
    <section className="py-16 bg-amber-50 border-y border-amber-200">
      <div className="max-w-3xl mx-auto px-6 text-center">
        {d.title && <h2 className="text-2xl md:text-3xl font-semibold text-amber-800 mb-4">{d.title}</h2>}
        {d.body && <p className="text-amber-700 mb-6">{d.body}</p>}
        {d.cta_text && (
          <a href={d.cta_url || '#contact'} className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-10 py-3 rounded-lg transition-colors">
            {d.cta_text}
          </a>
        )}
      </div>
    </section>
  );

  if (type === 'Custom') return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {d.title && <h2 className="text-3xl font-light text-slate-900 mb-6 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {d.body && <div className="text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: d.body }} />}
      </div>
    </section>
  );

  // 未対応ブロックはプレースホルダー表示（data空でも見た目が成立する）
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center text-slate-300">
        <div className="text-5xl mb-4">📦</div>
        <p className="text-sm">{type} セクション</p>
      </div>
    </section>
  );
}