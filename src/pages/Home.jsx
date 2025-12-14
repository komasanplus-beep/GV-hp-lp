import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import AboutSection from '@/components/landing/AboutSection';
import RoomsSection from '@/components/landing/RoomsSection';
import FacilitiesSection from '@/components/landing/FacilitiesSection';
import GallerySection from '@/components/landing/GallerySection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import LocationSection from '@/components/landing/LocationSection';
import BookingForm from '@/components/landing/BookingForm';
import Footer from '@/components/landing/Footer';

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Fetch rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => base44.entities.Room.list(),
  });

  // Fetch hotel settings
  const { data: settingsData = [] } = useQuery({
    queryKey: ['hotelSettings'],
    queryFn: () => base44.entities.HotelSettings.list(),
  });
  const settings = settingsData[0] || {};

  // Fetch content
  const { data: content = [] } = useQuery({
    queryKey: ['hotelContent'],
    queryFn: () => base44.entities.HotelContent.filter({ is_active: true }),
  });

  const aboutContent = content.find(c => c.section === 'about');
  const facilities = content.filter(c => c.section === 'facility');
  const gallery = content.filter(c => c.section === 'gallery');
  const testimonials = content.filter(c => c.section === 'testimonial');

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setIsBookingOpen(true);
  };

  const handleOpenBooking = () => {
    setSelectedRoom(null);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar settings={settings} onBookClick={handleOpenBooking} />
      
      <HeroSection onBookClick={handleOpenBooking} />
      
      <AboutSection content={aboutContent} />
      
      <RoomsSection rooms={rooms} onBook={handleBookRoom} />
      
      <FacilitiesSection facilities={facilities} />
      
      <GallerySection gallery={gallery} />
      
      <TestimonialsSection testimonials={testimonials} />
      
      <LocationSection settings={settings} />
      
      <Footer settings={settings} />

      <BookingForm
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        rooms={rooms}
        selectedRoom={selectedRoom}
      />
    </div>
  );
}