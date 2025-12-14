import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const defaultGallery = [
  { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', title: 'Hotel Exterior' },
  { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80', title: 'Luxury Suite' },
  { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', title: 'Pool Area' },
  { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80', title: 'Restaurant' },
  { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80', title: 'Bedroom' },
  { url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80', title: 'Lounge' },
];

export default function GallerySection({ gallery }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const images = gallery?.length > 0 ? gallery : defaultGallery;

  const openLightbox = (index) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  
  const goNext = () => setSelectedIndex((prev) => (prev + 1) % images.length);
  const goPrev = () => setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <section id="gallery" className="py-24 md:py-32 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-amber-400 tracking-[0.2em] text-sm font-medium uppercase">
            Gallery
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-white mt-4" style={{ fontFamily: 'serif' }}>
            Captured Moments
          </h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto font-light">
            A glimpse into the elegance that awaits you
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative overflow-hidden cursor-pointer group ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.url || image.image_url}
                alt={image.title || `Gallery ${index + 1}`}
                className={`w-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                  index === 0 ? 'h-[300px] md:h-[500px]' : 'h-[200px] md:h-[240px]'
                }`}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-lg font-light">{image.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
              onClick={closeLightbox}
            >
              <X className="w-8 h-8" />
            </button>
            
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            <motion.img
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={images[selectedIndex].url || images[selectedIndex].image_url}
              alt={images[selectedIndex].title}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}