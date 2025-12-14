import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function LocationSection({ settings }) {
  return (
    <section id="location" className="py-24 md:py-32 bg-white">
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
            Find Us
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 mt-4" style={{ fontFamily: 'serif' }}>
            Our Location
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="h-[400px] bg-slate-100 overflow-hidden"
          >
            {settings?.map_embed_url ? (
              <iframe
                src={settings.map_embed_url}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="text-center text-slate-400">
                  <MapPin className="w-12 h-12 mx-auto mb-3" />
                  <p>Map will be displayed here</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center"
          >
            <h3 className="text-2xl font-light text-slate-900 mb-8">
              {settings?.hotel_name || 'Bawi Hotel'}
            </h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 mb-1">Address</div>
                  <div className="text-slate-600 font-light">
                    {settings?.address || '123 Paradise Avenue, Oceanview, Bali 80361, Indonesia'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 mb-1">Phone</div>
                  <div className="text-slate-600 font-light">
                    {settings?.phone || '+62 361 123 4567'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 mb-1">Email</div>
                  <div className="text-slate-600 font-light">
                    {settings?.email || 'info@bawihotel.com'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-900 mb-1">Check-in / Check-out</div>
                  <div className="text-slate-600 font-light">
                    Check-in: 2:00 PM | Check-out: 12:00 PM
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}