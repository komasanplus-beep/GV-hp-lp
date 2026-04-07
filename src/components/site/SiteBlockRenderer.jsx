/**
 * SiteBlockRenderer - Site用ブロックタイプのレンダリング
 * block_type: Hero, About, Menu, Service, Staff, Gallery, Voice, Feature, FAQ, Access, Contact, Booking, CTA, Campaign, Custom
 */
import React, { useState, useMemo } from 'react';
import { Star, CheckCircle, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AnimatedBlock from './AnimatedBlock';
import ImageSlider from './ImageSlider';
import ServiceListByType from '@/components/service/ServiceListByType';
import { getUIConfig } from '@/lib/uiConfig';

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

function ServiceBlock({ d, siteId, businessType = 'other' }) {
  const { data: services = [] } = React.useQuery({
    queryKey: ['services', siteId],
    queryFn: () => siteId
      ? base44.entities.Service.filter({ site_id: siteId }, 'sort_order')
      : Promise.resolve([]),
  });

  const [searchParams] = React.useState(new URLSearchParams(window.location.search));
  const isPreview = searchParams.get('preview') === 'true';

  // 業種別UI
  const { getServiceLabel, BUSINESS_TYPE_LABELS } = React.useMemo(() => {
    const labels = {
      hotel: { service_label: '客室', icon: '🏨' },
      salon: { service_label: 'メニュー', icon: '💇' },
      clinic: { service_label: '診療科目', icon: '🏥' },
      gym: { service_label: 'コース', icon: '💪' },
      school: { service_label: 'レッスン', icon: '🎓' },
      restaurant: { service_label: 'メニュー', icon: '🍽️' },
      beauty: { service_label: '施術', icon: '💄' },
      wellness: { service_label: 'プログラム', icon: '🧘' },
      other: { service_label: 'サービス', icon: '⭐' }
    };
    return { BUSINESS_TYPE_LABELS: labels, getServiceLabel: (t) => labels[t]?.service_label || 'サービス' };
  }, []);

  const typeLabel = BUSINESS_TYPE_LABELS[businessType] || BUSINESS_TYPE_LABELS.other;
  const isHotel = businessType === 'hotel';

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-4 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
        {d.subtitle && <p className="text-slate-500 text-center mb-12">{d.subtitle}</p>}
        {services.length > 0 ? (
          <div className={isHotel ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "grid md:grid-cols-2 lg:grid-cols-3 gap-6"}>
            {services.map(svc => (
              <a
                key={svc.id}
                href={`/service/${svc.id}?site_id=${siteId}${isPreview ? '&preview=true' : ''}`}
                className={`rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
                  isHotel 
                    ? 'bg-white border border-slate-200 hover:border-amber-400' 
                    : 'bg-white hover:scale-105 transform'
                }`}
              >
                {svc.image_url && (
                  <img src={svc.image_url} alt={svc.name} className={`w-full ${isHotel ? 'h-48' : 'h-40'} object-cover`} />
                )}
                <div className={`p-6 ${isHotel ? '' : 'p-5'}`}>
                  <h3 className={`${isHotel ? 'text-lg font-medium' : 'font-semibold'} text-slate-800 mb-2`}>{svc.name}</h3>
                  {svc.description && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{svc.description}</p>}
                  <div className={`flex items-center ${isHotel ? 'flex-col gap-3' : 'justify-between'}`}>
                    {svc.price > 0 && <span className={`${isHotel ? 'text-xl font-light' : 'font-medium'} text-amber-600`}>¥{svc.price.toLocaleString()}</span>}
                    {svc.duration && <span className="text-xs text-slate-500">{svc.duration}</span>}
                  </div>
                  {isHotel && (
                    <button className="w-full mt-4 px-4 py-2.5 border border-amber-600 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm font-medium">
                      View Details
                    </button>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-300 py-16 text-5xl">{typeLabel.icon}</div>
        )}
      </div>
    </section>
  );
}

function ContactBlock({ d, siteId }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');

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

  const animationSettings = {
    type: block.animation_type || 'fade-up',
    delay: block.animation_delay || 0,
    duration: block.animation_duration || 600,
    once: block.animation_once !== false,
    trigger: block.animation_trigger || 'on-scroll',
  };

  // ブロックタイプに応じたセクションIDを生成
  const getSectionId = (blockType) => {
    const idMap = {
      'Hero': 'hero',
      'About': 'about',
      'Service': 'services',
      'Menu': 'menu',
      'Gallery': 'gallery',
      'Staff': 'staff',
      'Contact': 'contact',
      'Booking': 'booking',
      'Voice': 'testimonials',
      'Feature': 'features',
      'FAQ': 'faq',
      'Access': 'access',
    };
    return idMap[blockType] || blockType.toLowerCase();
  };

  let content;

  if (type === 'Hero') {
    const heroMode = d.hero_mode || 'single';
    const isSlider = heroMode === 'slider' && Array.isArray(d.image_urls) && d.image_urls.length > 0;
    const bgImage = isSlider ? null : (d.image_url || null);

    // Image filters
    const imageFilters = {
      opacity: d.image_opacity ?? 1,
      brightness: d.image_brightness ?? 100,
      contrast: d.image_contrast ?? 100,
      blur: d.image_blur ?? 0,
      scale: d.image_scale ?? 1,
      position: d.image_position || 'center',
    };

    // Overlay styles
    const overlayType = d.overlay_type || 'none';
    let overlayStyle = {};
    if (overlayType === 'color') {
      const color = d.overlay_color || '#000000';
      const opacity = d.overlay_opacity ?? 0.5;
      overlayStyle = {
        backgroundColor: color,
        opacity: opacity,
      };
    } else if (overlayType === 'gradient') {
      const from = d.gradient_from || '#000000';
      const to = d.gradient_to || '#ffffff';
      const dir = d.gradient_direction || 'to-bottom';
      const dirs = {
        'to-bottom': '180deg',
        'to-right': '90deg',
        'to-bottom-right': '135deg',
        'to-top': '0deg',
      };
      overlayStyle = {
        background: `linear-gradient(${dirs[dir]}, ${from}, ${to})`,
      };
    } else if (overlayType === 'mesh') {
      overlayStyle = {
        background: `
          repeating-linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 2px, transparent 2px, transparent 4px),
          repeating-linear-gradient(-45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px)
        `,
      };
    }

    // Text styles
    const textAlign = d.text_align || 'center';
    const textColor = d.text_color || '#ffffff';
    const textShadow = d.text_shadow ? '0 2px 8px rgba(0,0,0,0.5)' : 'none';

    const isHotel = block.business_type === 'hotel';

    content = (
      <section
        className="relative min-h-screen flex items-center justify-center text-white"
        style={{
          backgroundColor: isHotel ? '#0F1419' : '#1a1a2e',
          textAlign: textAlign,
        }}
      >
        {/* Background Image / Slider */}
        <div className="absolute inset-0 overflow-hidden">
          {isSlider ? (
            <ImageSlider
              images={d.image_urls}
              interval={d.slide_interval || 3000}
              transitionType={d.transition_type || 'fade'}
              autoplay={d.autoplay !== false}
              loop={d.loop !== false}
              filters={imageFilters}
            />
          ) : bgImage ? (
            <img
              src={bgImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                filter: `opacity(${imageFilters.opacity}) brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) blur(${imageFilters.blur}px)`,
                transform: `scale(${imageFilters.scale})`,
                objectPosition: imageFilters.position,
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800" />
          )}

          {/* Overlay */}
          {overlayType !== 'none' && (
            <div className="absolute inset-0" style={overlayStyle} />
          )}
        </div>

        {/* Text Content */}
        <div className="relative max-w-3xl mx-auto px-6 z-10">
          {d.eyebrow && <p className="text-amber-300 tracking-widest text-sm uppercase mb-4 opacity-90">{d.eyebrow}</p>}
          <h1
            className="text-5xl md:text-7xl font-light mb-6 leading-tight"
            style={{
              fontFamily: 'serif',
              color: textColor,
              textShadow: textShadow,
              letterSpacing: '0.05em',
            }}
          >
            {d.headline || d.title || block.site_name || 'Welcome'}
          </h1>
          {d.subheadline && (
            <p
              className="text-lg md:text-xl mb-10 font-light max-w-2xl"
              style={{
                color: textColor,
                opacity: 0.9,
                textShadow: textShadow,
                lineHeight: '1.8',
              }}
            >
              {d.subheadline}
            </p>
          )}
          {d.cta_text && (
            <a
              href={d.cta_url || '#contact'}
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-12 py-4 text-lg font-light tracking-wide transition-colors duration-300"
              onClick={(e) => {
                if (d.cta_url?.startsWith('#')) {
                  e.preventDefault();
                  const target = document.getElementById(d.cta_url.slice(1));
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {d.cta_text}
            </a>
          )}
        </div>
      </section>
    );
  } else if (type === 'About') {
    content = (
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
  } else if (type === 'Menu' || type === 'Service') {
    content = (
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
  } else if (type === 'Staff') {
    content = (
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
  } else if (type === 'Gallery') {
    const imageUrls = Array.isArray(d.image_urls) ? d.image_urls.filter(Boolean) : [];
    content = (
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-4 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
          {d.body && <p className="text-slate-600 text-center mb-12">{d.body}</p>}
          {imageUrls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {imageUrls.map((url, i) => (
                <div key={i} className="group overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <img src={url} alt="" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 text-5xl border border-slate-200">🖼</div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  } else if (type === 'Voice') {
    content = (
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
  } else if (type === 'Feature') {
    content = (
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {parseLines(d.features).length > 0 ? (
              parseLines(d.features).map((f, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <CheckCircle className="w-8 h-8 text-amber-600" />
                  </div>
                  <p className="text-slate-700 font-medium">{f}</p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-slate-300 py-8 text-4xl">✨</div>
            )}
          </div>
        </div>
      </section>
    );
  } else if (type === 'Access') {
    content = (
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-12 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="space-y-4">
              {d.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-slate-700 leading-relaxed">{d.address}</p>
                </div>
              )}
              {d.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-slate-700">{d.phone}</p>
                </div>
              )}
              {d.hours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-700 font-medium mb-1">Hours</p>
                    <p className="text-slate-600 text-sm whitespace-pre-line">{d.hours}</p>
                  </div>
                </div>
              )}
            </div>
            {d.map_embed_url ? (
              <iframe src={d.map_embed_url} className="w-full h-64 rounded-xl border-0 shadow-sm" allowFullScreen loading="lazy" />
            ) : (
              <div className="w-full h-64 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-3xl">📍</div>
            )}
          </div>
        </div>
      </section>
    );
  } else if (type === 'FAQ') {
    content = (
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
  } else if (type === 'Access') {
    content = (
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
  } else if (type === 'Service') {
    const config = getUIConfig(block.business_type || 'other');
    content = (
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          {d.title && <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-4 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
          <p className="text-center text-slate-500 mb-10">{config.icon}</p>
          {d.subtitle && <p className="text-slate-500 text-center mb-10">{d.subtitle}</p>}
          <ServiceListByType siteId={block.site_id} businessType={block.business_type || 'other'} />
        </div>
      </section>
    );
  } else if (type === 'Contact') {
    content = <ContactBlock d={d} siteId={block.site_id} />;
  } else if (type === 'Booking') {
    content = <BookingBlock d={d} siteId={block.site_id} />;
  } else if (type === 'CTA') {
    content = (
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
  } else if (type === 'Campaign') {
    content = (
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
  } else if (type === 'Custom') {
    content = (
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          {d.title && <h2 className="text-3xl font-light text-slate-900 mb-6 text-center" style={{ fontFamily: 'serif' }}>{d.title}</h2>}
          {d.body && <div className="text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: d.body }} />}
        </div>
      </section>
    );
  } else {
    content = (
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center text-slate-300">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-sm">{type} セクション</p>
        </div>
      </section>
    );
  }

  return (
    <div id={getSectionId(type)}>
      <AnimatedBlock settings={animationSettings}>
        {content}
      </AnimatedBlock>
    </div>
  );
}