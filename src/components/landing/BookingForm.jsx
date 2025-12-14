import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, X, Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BookingForm({ isOpen, onClose, rooms, selectedRoom }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    email: '',
    phone: '',
    check_in: '',
    check_out: '',
    guests_count: 1,
    room_type: selectedRoom?.name || '',
    room_id: selectedRoom?.id || '',
    message: '',
    status: 'pending'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await base44.entities.Booking.create(formData);
    
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setFormData({
        guest_name: '',
        email: '',
        phone: '',
        check_in: '',
        check_out: '',
        guests_count: 1,
        room_type: '',
        room_id: '',
        message: '',
        status: 'pending'
      });
    }, 2000);
    
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light text-slate-900" style={{ fontFamily: 'serif' }}>
                  Book Your Stay
                </h2>
                <p className="text-slate-500 text-sm mt-1">Complete the form below</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900 mb-2">Booking Request Sent!</h3>
                  <p className="text-slate-500">We'll get back to you shortly.</p>
                </motion.div>
              ) : (
                <>
                  {/* Guest Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wide">Guest Details</h3>
                    
                    <Input
                      placeholder="Full Name *"
                      value={formData.guest_name}
                      onChange={(e) => handleChange('guest_name', e.target.value)}
                      required
                      className="h-12 rounded-none border-slate-200 focus:border-amber-500"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="email"
                        placeholder="Email *"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        className="h-12 rounded-none border-slate-200 focus:border-amber-500"
                      />
                      <Input
                        type="tel"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="h-12 rounded-none border-slate-200 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Stay Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wide">Stay Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Check-in Date *</label>
                        <Input
                          type="date"
                          value={formData.check_in}
                          onChange={(e) => handleChange('check_in', e.target.value)}
                          required
                          className="h-12 rounded-none border-slate-200 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Check-out Date *</label>
                        <Input
                          type="date"
                          value={formData.check_out}
                          onChange={(e) => handleChange('check_out', e.target.value)}
                          required
                          className="h-12 rounded-none border-slate-200 focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Number of Guests</label>
                        <Select 
                          value={String(formData.guests_count)} 
                          onValueChange={(val) => handleChange('guests_count', parseInt(val))}
                        >
                          <SelectTrigger className="h-12 rounded-none border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map(n => (
                              <SelectItem key={n} value={String(n)}>{n} Guest{n > 1 ? 's' : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Room Type</label>
                        <Select 
                          value={formData.room_type} 
                          onValueChange={(val) => {
                            const room = rooms.find(r => r.name === val);
                            handleChange('room_type', val);
                            handleChange('room_id', room?.id || '');
                          }}
                        >
                          <SelectTrigger className="h-12 rounded-none border-slate-200">
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.filter(r => r.status === 'available').map(room => (
                              <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <Textarea
                      placeholder="Special requests or message..."
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      rows={4}
                      className="rounded-none border-slate-200 focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white rounded-none text-lg font-light tracking-wide"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Submit Booking Request'
                    )}
                  </Button>

                  <p className="text-xs text-slate-400 text-center">
                    By submitting, you agree to our booking terms and conditions
                  </p>
                </>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}