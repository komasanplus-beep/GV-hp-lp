import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import AboutSection from '@/components/landing/AboutSection';
import GallerySection from '@/components/landing/GallerySection';
import LocationSection from '@/components/landing/LocationSection';
import Footer from '@/components/landing/Footer';
import { X } from 'lucide-react';
import { createPageUrl } from '@/utils';

const HOTEL_SETTINGS = {
  hotel_name: 'Luxury Hotel',
  hero_eyebrow: 'Welcome to',
  hero_title: 'Luxury Hotel',
  hero_subtitle: 'Experience luxury redefined. Where timeless elegance meets modern comfort.',
  hero_button_text: 'Book Your Stay',
  hero_image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
  nav_about: 'About',
  nav_services: 'Rooms',
  nav_facilities: 'Facilities',
  nav_gallery: 'Gallery',
  nav_contact: 'Contact',
  nav_book_button: 'Book Now',
  address: '123 Luxury Ave, Paradise City',
  phone: '03-1234-5678',
  email: 'info@luxuryhotel.com',
};

const HOTEL_ABOUT = {
  title: 'A Legacy of Luxury & Hospitality',
  content: '私たちのホテルは、お客様に最高の体験をご提供することを使命としています。熟練したスタッフが心を込めてサービスし、日常の疲れを癒す特別な時間をお届けします。',
  image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
};

const SALON_SETTINGS = {
  salon_name: 'Beauty Salon',
  hero_title: 'Beauty Salon',
  hero_subtitle: '丁寧な施術と心地よい空間で、あなたの美しさを引き出します。',
  hero_button_text: '今すぐ予約',
  hero_image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80',
  address: '東京都渋谷区○○町1-2-3',
  phone: '03-1234-5678',
  instagram_url: '#',
  booking_url: '#',
};

const SALON_MENUS = [
  { title: 'カット', content: 'スタイリストが丁寧にカットします', price: '¥5,500', order: 0 },
  { title: 'カラー', content: 'トレンドカラーをご提案します', price: '¥9,900', order: 1 },
  { title: 'パーマ', content: 'ふんわり自然なウェーブに', price: '¥11,000', order: 2 },
  { title: 'トリートメント', content: '髪質改善・ダメージ補修', price: '¥4,400', order: 3 },
];

export default function TemplatePreview() {
  const urlParams = new URLSearchParams(window.location.search);
  const templateKey = urlParams.get('key') || 'hotel_luxury';
  const isHotel = templateKey === 'hotel_luxury';

  return (
    <div className="min-h-screen">
      {/* プレビューバー */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-700 text-white flex items-center justify-between px-4 py-2 text-sm shadow-lg">
        <div className="flex items-center gap-3">
          <span className="bg-white/20 rounded px-2 py-0.5 text-xs font-medium">プレビュー中</span>
          <span>{isHotel ? 'ホテル・高級施設テンプレート' : '美容室テンプレート'}</span>
        </div>
        <a
          href={createPageUrl('MasterTemplates')}
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded px-3 py-1 transition-colors"
        >
          <X className="w-4 h-4" />
          閉じる
        </a>
      </div>

      {/* ホテルテンプレートプレビュー */}
      {isHotel && (
        <div className="pt-10">
          <Navbar settings={HOTEL_SETTINGS} onBookClick={() => {}} />
          <HeroSection settings={HOTEL_SETTINGS} onBookClick={() => {}} />
          <AboutSection content={HOTEL_ABOUT} />
          <GallerySection gallery={[]} />
          <LocationSection settings={HOTEL_SETTINGS} />
          <Footer settings={HOTEL_SETTINGS} />
        </div>
      )}

      {/* サロンテンプレートプレビュー */}
      {!isHotel && (
        <div className="pt-10 min-h-screen bg-white font-sans">
          <nav className="fixed top-10 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-100">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <span className="text-lg font-bold text-stone-800">{SALON_SETTINGS.salon_name}</span>
              <div className="hidden md:flex items-center gap-6 text-sm text-stone-600">
                <a href="#about" className="hover:text-stone-900">About</a>
                <a href="#menu" className="hover:text-stone-900">Menu</a>
                <a href="#contact" className="hover:text-stone-900">Contact</a>
              </div>
              <span className="bg-stone-800 text-white text-sm px-4 py-2 rounded-full cursor-pointer">予約する</span>
            </div>
          </nav>

          <section
            className="relative min-h-screen flex items-center justify-center text-center pt-24"
            style={{ backgroundImage: `url(${SALON_SETTINGS.hero_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 px-4 text-white">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">{SALON_SETTINGS.hero_title}</h1>
              <p className="text-lg md:text-xl mb-8 max-w-xl mx-auto text-white/90">{SALON_SETTINGS.hero_subtitle}</p>
              <span className="inline-flex items-center gap-2 bg-stone-800 text-white px-8 py-3 rounded-full text-sm font-medium cursor-pointer">
                {SALON_SETTINGS.hero_button_text}
              </span>
            </div>
          </section>

          <section id="menu" className="py-20 px-4 bg-stone-50">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs uppercase tracking-widest text-stone-400 mb-2 text-center">Menu</p>
              <h2 className="text-3xl font-bold text-stone-800 mb-10 text-center">メニュー</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {SALON_MENUS.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-5 border border-stone-100">
                    <h3 className="font-semibold text-stone-800">{item.title}</h3>
                    <p className="text-sm text-stone-500 mt-1">{item.content}</p>
                    <p className="text-sm font-bold text-stone-700 mt-2">{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="bg-stone-900 text-stone-500 text-center py-6 text-xs">
            © {new Date().getFullYear()} {SALON_SETTINGS.salon_name}. All rights reserved.
          </footer>
        </div>
      )}
    </div>
  );
}