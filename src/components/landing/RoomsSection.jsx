import React from 'react';
import { motion } from 'framer-motion';
import RoomCard from './RoomCard';

export default function RoomsSection({ rooms, onBook }) {
  return (
    <section id="rooms" className="py-24 md:py-32 bg-slate-50">
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
            Accommodations
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 mt-4" style={{ fontFamily: 'serif' }}>
            Our Rooms & Suites
          </h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto font-light">
            Each room is thoughtfully designed to provide the perfect blend of comfort and elegance
          </p>
        </motion.div>

        {/* Room Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room, index) => (
            <RoomCard key={room.id} room={room} index={index} onBook={onBook} />
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No rooms available at the moment.
          </div>
        )}
      </div>
    </section>
  );
}