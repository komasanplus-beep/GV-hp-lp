import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Phone, MapPin, Instagram, ExternalLink, Star, ChevronRight } from 'lucide-react';

export default function Home() {
  const { data: settingsData = [] } = useQuery({
    queryKey: ['salonSettings'],
    queryFn: () => base44.entities.SalonSettings.list(),
  });
  const settings = settingsData[0] || {};

  const { data: content = [] } = useQuery({
    queryKey: ['salonContent'],
    queryFn: () => base44.entities.SalonContent.filter({ is_active: true }),
  });

  const about = content.find(c => c.section === 'about');
  const menus = content.filter(c => c.section === 'menu').sort((a,b) => (a.order||0)-(b.order||0));
  const staff = content.filter(c => c.section === 'staff').sort((a,b) => (a.order||0)-(b.order||0));
  const gallery = content.filter(c => c.section === 'gallery').sort((a,b) => (a.order||0)-(b.order||0));
  const voices = content.filter(c => c.section === 'voice').sort((a,b) => (a.order||0)-(b.order||0));
  const campaigns = content.filter(c => c.section === 'campaign').sort((a,b) => (a.order||0)-(b.order||0));

  const salonName = settings.salon_name || 'Salon';

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.logo_url
              ? <img src={settings.logo_url} alt={salonName} className="h-8 w-auto" />
              : <span className="text-lg font-bold text-stone-800">{salonName}</span>
            }
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-stone-600">
            {about && <a href="#about" className="hover:text-stone-900 transition-colors">About</a>}
            {menus.length > 0 && <a href="#menu" className="hover:text-stone-900 transition-colors">Menu</a>}
            {staff.length > 0 && <a href="#staff" className="hover:text-stone-900 transition-colors">Staff</a>}
            {gallery.length > 0 && <a href="#gallery" className="hover:text-stone-900 transition-colors">Gallery</a>}
            <a href="#contact" className="hover:text-stone-900 transition-colors">Contact</a>
          </div>
          {settings.booking_url && (
            <a
              href={settings.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-stone-800 text-white text-sm px-4 py-2 rounded-full hover:bg-stone-700 transition-colors"
            >
              予約する
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center justify-center text-center pt-16"
        style={settings.hero_image_url ? {
          backgroundImage: `url(${settings.hero_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : { background: 'linear-gradient(135deg, #f5f0eb 0%, #e8ddd4 100%)' }}
      >
        {settings.hero_image_url && <div className="absolute inset-0 bg-black/40" />}
        <div className={`relative z-10 px-4 ${settings.hero_image_url ? 'text-white' : 'text-stone-800'}`}>
          {campaigns.length > 0 && (
            <div className="inline-flex items-center gap-2 bg-rose-500 text-white text-xs px-3 py-1 rounded-full mb-4">
              <span>🎉 {campaigns[0].title}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            {settings.hero_title || salonName}
          </h1>
          {settings.hero_subtitle && (
            <p className={`text-lg md:text-xl mb-8 max-w-xl mx-auto ${settings.hero_image_url ? 'text-white/90' : 'text-stone-600'}`}>
              {settings.hero_subtitle}
            </p>
          )}
          {settings.booking_url && (
            <a
              href={settings.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-stone-800 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-stone-700 transition-colors"
            >
              {settings.hero_button_text || '今すぐ予約'} <ChevronRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </section>

      {/* About */}
      {about && (
        <section id="about" className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
            {about.image_url && (
              <img src={about.image_url} alt={about.title} className="w-full md:w-1/2 rounded-2xl object-cover aspect-square" />
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">About</p>
              <h2 className="text-3xl font-bold text-stone-800 mb-4">{about.title}</h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line">{about.content}</p>
            </div>
          </div>
        </section>
      )}

      {/* Menu */}
      {menus.length > 0 && (
        <section id="menu" className="py-20 px-4 bg-stone-50">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-2 text-center">Menu</p>
            <h2 className="text-3xl font-bold text-stone-800 mb-10 text-center">メニュー</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {menus.map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-stone-100 flex items-start gap-4">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-800">{item.title}</h3>
                    {item.content && <p className="text-sm text-stone-500 mt-1 line-clamp-2">{item.content}</p>}
                    {item.price && <p className="text-sm font-bold text-stone-700 mt-2">{item.price}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Staff */}
      {staff.length > 0 && (
        <section id="staff" className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-2 text-center">Staff</p>
            <h2 className="text-3xl font-bold text-stone-800 mb-10 text-center">スタッフ</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {staff.map((s, i) => (
                <div key={i} className="text-center">
                  {s.image_url && (
                    <img src={s.image_url} alt={s.staff_name || s.title} className="w-24 h-24 object-cover rounded-full mx-auto mb-3" />
                  )}
                  <h3 className="font-semibold text-stone-800">{s.staff_name || s.title}</h3>
                  {s.content && <p className="text-xs text-stone-500 mt-1">{s.content}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section id="gallery" className="py-20 px-4 bg-stone-50">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-2 text-center">Gallery</p>
            <h2 className="text-3xl font-bold text-stone-800 mb-10 text-center">ギャラリー</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((g, i) => g.image_url && (
                <img key={i} src={g.image_url} alt={g.title} className="w-full aspect-square object-cover rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Voice */}
      {voices.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-2 text-center">Voice</p>
            <h2 className="text-3xl font-bold text-stone-800 mb-10 text-center">お客様の声</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {voices.map((v, i) => (
                <div key={i} className="bg-stone-50 rounded-xl p-6">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(n => <Star key={n} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed mb-3">"{v.content}"</p>
                  <p className="text-xs text-stone-400 font-medium">{v.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="py-20 px-4 bg-stone-800 text-white">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Contact</p>
            <h2 className="text-3xl font-bold mb-6">お問い合わせ</h2>
            <div className="space-y-4 text-stone-300">
              {settings.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 text-stone-400 flex-shrink-0" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-stone-400" />
                  <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">{settings.phone}</a>
                </div>
              )}
              {settings.instagram_url && (
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-stone-400" />
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
                </div>
              )}
              {settings.line_url && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-stone-400" />
                  <a href={settings.line_url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LINE</a>
                </div>
              )}
            </div>
            {settings.booking_url && (
              <a
                href={settings.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 bg-white text-stone-800 px-6 py-3 rounded-full text-sm font-semibold hover:bg-stone-100 transition-colors"
              >
                ご予約はこちら <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </div>
          {settings.map_embed_url && (
            <div className="rounded-xl overflow-hidden">
              <iframe
                src={settings.map_embed_url}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="map"
              />
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-500 text-center py-6 text-xs">
        © {new Date().getFullYear()} {salonName}. All rights reserved.
      </footer>
    </div>
  );
}