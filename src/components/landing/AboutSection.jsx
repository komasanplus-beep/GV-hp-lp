import React from 'react';
import { motion } from 'framer-motion';

export default function AboutSection({ content }) {
  return (
    <section id="about" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative self-start"
          >
            <div className="relative z-10">
              <img
                src={content?.image_url || "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80"}
                alt="About"
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-amber-100 -z-10" />
            <div className="absolute -top-8 -left-8 w-32 h-32 border-2 border-amber-300 -z-10" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="self-start"
          >
            <span className="text-amber-600 tracking-[0.2em] text-sm font-medium uppercase">
              About Us
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-slate-900 mt-4 mb-8" style={{ fontFamily: 'serif' }}>
              {content?.title || 'A Legacy of Luxury & Hospitality'}
            </h2>
            <div className="text-slate-600 font-light leading-relaxed text-lg prose prose-lg max-w-none prose-strong:font-semibold prose-strong:text-slate-800">
              {content?.content ? (
                <div dangerouslySetInnerHTML={{ __html: content.content }} />
              ) : (
                <p>私たちのサロンは、お客様に最高の体験をご提供することを使命としています。熟練したスタッフが心を込めて施術し、日常の疲れを癒す特別な時間をお届けします。</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-slate-200">
              <div>
                <div className="text-4xl font-light text-amber-600">50+</div>
                <div className="text-sm text-slate-500 mt-1">メニュー数</div>
              </div>
              <div>
                <div className="text-4xl font-light text-amber-600">15+</div>
                <div className="text-sm text-slate-500 mt-1">年の実績</div>
              </div>
              <div>
                <div className="text-4xl font-light text-amber-600">4.9</div>
                <div className="text-sm text-slate-500 mt-1">お客様評価</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}