import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, Car, Utensils, Waves, Dumbbell, Sparkles, 
  Coffee, ShieldCheck, Clock, Plane, Bath, Wind
} from 'lucide-react';

const iconMap = {
  wifi: Wifi,
  parking: Car,
  restaurant: Utensils,
  pool: Waves,
  gym: Dumbbell,
  spa: Sparkles,
  coffee: Coffee,
  security: ShieldCheck,
  '24h': Clock,
  airport: Plane,
  bathroom: Bath,
  ac: Wind,
};

const defaultFacilities = [
  { icon: 'wifi', title: 'Free WiFi', content: 'High-speed internet throughout the property' },
  { icon: 'pool', title: 'Infinity Pool', content: 'Stunning rooftop pool with panoramic views' },
  { icon: 'restaurant', title: 'Fine Dining', content: 'World-class cuisine at our restaurant' },
  { icon: 'spa', title: 'Luxury Spa', content: 'Rejuvenating treatments and massages' },
  { icon: 'gym', title: 'Fitness Center', content: 'State-of-the-art equipment 24/7' },
  { icon: 'parking', title: 'Valet Parking', content: 'Complimentary parking service' },
  { icon: '24h', title: '24/7 Service', content: 'Round-the-clock concierge assistance' },
  { icon: 'airport', title: 'Airport Transfer', content: 'Luxury airport pickup service' },
];

export default function FacilitiesSection({ facilities }) {
  const displayFacilities = facilities?.length > 0 ? facilities : defaultFacilities;

  return (
    <section id="facilities" className="py-24 md:py-32 bg-white">
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
            Amenities
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 mt-4" style={{ fontFamily: 'serif' }}>
            Hotel Facilities
          </h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto font-light">
            Everything you need for an unforgettable stay
          </p>
        </motion.div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {displayFacilities.map((facility, index) => {
            const IconComponent = iconMap[facility.icon] || Sparkles;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group text-center p-6 hover:bg-slate-50 transition-colors duration-300 rounded-lg"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {facility.title}
                </h3>
                <p className="text-sm text-slate-500 font-light">
                  {facility.content}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}