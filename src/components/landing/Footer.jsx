import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer({ settings }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16 grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-light mb-4" style={{ fontFamily: 'serif' }}>
              {settings?.hotel_name || 'Bawi Hotel'}
            </h3>
            <p className="text-slate-400 font-light leading-relaxed mb-6 max-w-md">
              Experience luxury redefined. Where timeless elegance meets modern comfort 
              in the heart of paradise.
            </p>
            <div className="flex gap-4">
              <a 
                href={settings?.social_facebook || '#'} 
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href={settings?.social_instagram || '#'} 
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href={settings?.social_twitter || '#'} 
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-3 text-slate-400 font-light">
              <li><a href="#about" className="hover:text-amber-400 transition-colors">About Us</a></li>
              <li><a href="#rooms" className="hover:text-amber-400 transition-colors">Rooms & Suites</a></li>
              <li><a href="#facilities" className="hover:text-amber-400 transition-colors">Facilities</a></li>
              <li><a href="#gallery" className="hover:text-amber-400 transition-colors">Gallery</a></li>
              <li><a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-medium uppercase tracking-wider mb-6">Contact Us</h4>
            <ul className="space-y-4 text-slate-400 font-light">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{settings?.address || '123 Paradise Avenue, Bali'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>{settings?.phone || '+62 361 123 4567'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>{settings?.email || 'info@bawihotel.com'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {currentYear} {settings?.hotel_name || 'Bawi Hotel'}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}