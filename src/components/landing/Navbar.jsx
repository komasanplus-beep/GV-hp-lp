import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Navbar({ settings, onBookClick }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Rooms', href: '#rooms' },
    { name: 'Facilities', href: '#facilities' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Contact', href: '#location' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#" className={`text-2xl font-light transition-colors ${
              isScrolled ? 'text-slate-900' : 'text-white'
            }`} style={{ fontFamily: 'serif' }}>
              {settings?.hotel_name || 'Bawi Hotel'}
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-light tracking-wide transition-colors hover:text-amber-500 ${
                    isScrolled ? 'text-slate-700' : 'text-white/90'
                  }`}
                >
                  {link.name}
                </a>
              ))}
              <Link 
                to={createPageUrl('Dashboard')}
                className={`text-sm font-light tracking-wide transition-colors hover:text-amber-500 ${
                  isScrolled ? 'text-slate-700' : 'text-white/90'
                }`}
              >
                Admin
              </Link>
              <button
                onClick={onBookClick}
                className={`px-6 py-2.5 text-sm font-light tracking-wide transition-all ${
                  isScrolled 
                    ? 'bg-amber-600 text-white hover:bg-amber-700' 
                    : 'bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20'
                }`}
              >
                Book Now
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden p-2 ${isScrolled ? 'text-slate-900' : 'text-white'}`}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-light text-white" style={{ fontFamily: 'serif' }}>
                  {settings?.hotel_name || 'Bawi Hotel'}
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-8">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-3xl font-light text-white hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </motion.a>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                >
                  <Link 
                    to={createPageUrl('Dashboard')}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-3xl font-light text-white hover:text-amber-400 transition-colors"
                  >
                    Admin
                  </Link>
                </motion.div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onBookClick();
                }}
                className="w-full py-4 bg-amber-600 text-white text-lg font-light tracking-wide"
              >
                Book Your Stay
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}