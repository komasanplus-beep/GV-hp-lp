import React, { useState, useEffect } from 'react';

export default function ImageSlider({ 
  images = [],
  interval = 3000,
  transitionType = 'fade',
  autoplay = true,
  loop = true,
  filters = {}
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev === images.length - 1) {
          return loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoplay, interval, loop, images.length]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];
  const {
    opacity = 1,
    brightness = 100,
    contrast = 100,
    blur = 0,
    scale = 1,
    position = 'center',
  } = filters;

  const filterStyle = `opacity(${opacity}) brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;
  const transformStyle = `scale(${scale})`;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Image Container */}
      <div className="absolute inset-0">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              transitionType === 'fade' ? 'fade' : 'slide'
            } ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{
              filter: filterStyle,
              transform: transformStyle,
              backgroundPosition: position,
            }}
          />
        ))}
      </div>

      {/* Slide Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}