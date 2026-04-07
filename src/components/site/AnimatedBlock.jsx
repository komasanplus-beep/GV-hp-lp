import React, { useEffect, useRef, useState } from 'react';

const animationStyles = {
  'fade-in': {
    initial: 'opacity-0',
    visible: 'opacity-100',
    transform: 'none',
  },
  'fade-up': {
    initial: 'opacity-0 translate-y-8',
    visible: 'opacity-100 translate-y-0',
    transform: 'transform',
  },
  'fade-down': {
    initial: 'opacity-0 -translate-y-8',
    visible: 'opacity-100 translate-y-0',
    transform: 'transform',
  },
  'slide-up': {
    initial: 'opacity-0 translate-y-16',
    visible: 'opacity-100 translate-y-0',
    transform: 'transform',
  },
  'slide-left': {
    initial: 'opacity-0 translate-x-16',
    visible: 'opacity-100 translate-x-0',
    transform: 'transform',
  },
  'slide-right': {
    initial: 'opacity-0 -translate-x-16',
    visible: 'opacity-100 translate-x-0',
    transform: 'transform',
  },
  'zoom-in': {
    initial: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100',
    transform: 'transform',
  },
};

export default function AnimatedBlock({
  children,
  settings = {},
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const {
    type = 'fade-up',
    delay = 0,
    duration = 600,
    once = true,
    trigger = 'on-scroll',
  } = settings;

  // on-load の場合は即座に表示
  useEffect(() => {
    if (trigger === 'on-load') {
      setTimeout(() => {
        setIsVisible(true);
        setHasAnimated(true);
      }, delay);
    }
  }, [trigger, delay]);

  // on-scroll の場合は IntersectionObserver で発火
  useEffect(() => {
    if (trigger !== 'on-scroll' || type === 'none') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!hasAnimated || !once) {
              setTimeout(() => {
                setIsVisible(true);
                setHasAnimated(true);
              }, delay);
            }
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay, once, hasAnimated, trigger, type]);

  if (type === 'none') {
    return <div ref={ref}>{children}</div>;
  }

  const animStyle = animationStyles[type] || animationStyles['fade-up'];
  const classes = `${animStyle.transform} ${
    isVisible ? animStyle.visible : animStyle.initial
  } transition-all`;

  return (
    <div
      ref={ref}
      className={classes}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}