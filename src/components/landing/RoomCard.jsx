import React from 'react';
import { motion } from 'framer-motion';
import { Users, Maximize, Bed } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function RoomCard({ room, index, onBook }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group bg-white overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={room.images?.[0] || `https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80`}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status Badge */}
        <div className={`absolute top-4 right-4 px-4 py-1.5 text-xs font-medium tracking-wide uppercase ${
          room.status === 'available' 
            ? 'bg-emerald-500 text-white' 
            : room.status === 'booked'
            ? 'bg-amber-500 text-white'
            : 'bg-slate-500 text-white'
        }`}>
          {room.status}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-medium text-slate-900">{room.name}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {room.capacity} Guests
              </span>
              {room.size && (
                <span className="flex items-center gap-1.5">
                  <Maximize className="w-4 h-4" />
                  {room.size} m²
                </span>
              )}
              {room.bed_type && (
                <span className="flex items-center gap-1.5">
                  <Bed className="w-4 h-4" />
                  {room.bed_type}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-2">
          {room.description || 'Experience comfort and luxury in our beautifully appointed room with modern amenities.'}
        </p>

        {/* Amenities */}
        {room.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {room.amenities.slice(0, 4).map((amenity, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                {amenity}
              </span>
            ))}
            {room.amenities.length > 4 && (
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                +{room.amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            <span className="text-2xl font-light text-slate-900">${room.price_per_night}</span>
            <span className="text-slate-500 text-sm"> / night</span>
          </div>
          <Button
            onClick={() => onBook(room)}
            variant="outline"
            className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white transition-all duration-300 rounded-none px-6"
            disabled={room.status !== 'available'}
          >
            {room.status === 'available' ? 'Book Now' : 'Unavailable'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}