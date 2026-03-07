import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80';

export default function HeroSection({ onBookClick, settings = {} }) {
  const eyebrow = settings.hero_eyebrow || 'Welcome to';
  const title = settings.hero_title || settings.hotel_name || 'サロン';
  const subtitle = settings.hero_subtitle || 'Experience luxury redefined. Where timeless elegance meets modern comfort in the heart of paradise.';
  const buttonText = settings.hero_button_text || 'Book Your Stay';
  const buttonUrl = settings.hero_button_url || '';
  const bgImage = settings.hero_image_url || DEFAULT_IMAGE;

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="inline-block text-amber-300 tracking-[0.3em] text-sm font-light mb-6 uppercase">
            {eyebrow}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-8xl font-light text-white mb-6 tracking-wide"
          style={{ fontFamily: 'serif' }}
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-white/90 font-light mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {buttonUrl ? (
            <a href={buttonUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-6 text-lg font-light tracking-wider rounded-none border border-amber-500 transition-all duration-300 hover:scale-105"
              >
                {buttonText}
              </Button>
            </a>
          ) : (
            <Button
              onClick={onBookClick}
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-6 text-lg font-light tracking-wider rounded-none border border-amber-500 transition-all duration-300 hover:scale-105"
            >
              {buttonText}
            </Button>
          )}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/70"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </motion.div>
    </section>
  );
}