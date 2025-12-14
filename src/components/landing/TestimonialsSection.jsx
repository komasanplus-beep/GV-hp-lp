import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const defaultTestimonials = [
  {
    author: 'Sarah Mitchell',
    content: 'An absolutely stunning hotel with impeccable service. The attention to detail is remarkable and the staff went above and beyond to make our anniversary special.',
    rating: 5,
    title: 'Guest from New York'
  },
  {
    author: 'James Chen',
    content: 'The perfect blend of luxury and comfort. The infinity pool with sunset views was breathtaking. Will definitely be returning.',
    rating: 5,
    title: 'Guest from Singapore'
  },
  {
    author: 'Emma Thompson',
    content: 'From the moment we arrived, we felt like royalty. The spa treatments were divine and the restaurant exceeded all expectations.',
    rating: 5,
    title: 'Guest from London'
  },
];

export default function TestimonialsSection({ testimonials }) {
  const displayTestimonials = testimonials?.length > 0 ? testimonials : defaultTestimonials;

  return (
    <section id="testimonials" className="py-24 md:py-32 bg-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-amber-600 tracking-[0.2em] text-sm font-medium uppercase">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 mt-4" style={{ fontFamily: 'serif' }}>
            What Our Guests Say
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {displayTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white p-8 relative"
            >
              <Quote className="absolute top-6 right-6 w-12 h-12 text-amber-100" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < (testimonial.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-slate-600 font-light leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="border-t border-slate-100 pt-6">
                <div className="font-medium text-slate-900">{testimonial.author}</div>
                <div className="text-sm text-slate-500">{testimonial.title}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}