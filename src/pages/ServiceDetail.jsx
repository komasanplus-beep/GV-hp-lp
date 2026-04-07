/**
 * ServiceDetail
 * Service 詳細ページ（業種別UI）
 * URL: /service/:serviceId?site_id=xxx
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { 
  getBusinessTypeLabel,
  getPriceLabel,
  getDurationLabel,
  getCapacityLabel,
  BUSINESS_TYPE_LABELS 
} from '@/lib/businessTypeLabels';
import { ArrowLeft, MapPin, Clock, Users, CheckCircle } from 'lucide-react';
import { useSeoHead } from '@/hooks/useSeoHead';

export default function ServiceDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const serviceId = pathParts[pathParts.indexOf('service') + 1];
  const siteId = urlParams.get('site_id');
  const isPreview = urlParams.get('preview') === 'true';

  const navigate = useNavigate();

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => base44.entities.Service.filter({ id: serviceId }).then(r => r[0]),
    enabled: !!serviceId,
  });

  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => base44.entities.Site.filter({ id: siteId }).then(r => r[0]),
    enabled: !!siteId,
  });

  const [bookingForm, setBookingForm] = useState({ name: '', email: '', date: '', message: '' });
  const [bookingStatus, setBookingStatus] = useState('idle');

  const typeInfo = site ? (BUSINESS_TYPE_LABELS[site.business_type] || BUSINESS_TYPE_LABELS.other) : BUSINESS_TYPE_LABELS.other;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.email || !bookingForm.date) return;

    setBookingStatus('sending');
    try {
      await base44.entities.Reservation.create({
        site_id: siteId,
        name: bookingForm.name,
        email: bookingForm.email,
        date: bookingForm.date,
        service_name: service.name,
        message: bookingForm.message,
        status: 'pending'
      });
      setBookingStatus('done');
    } catch (e) {
      console.error('Booking error:', e);
      setBookingStatus('error');
    }
  };

  useSeoHead({
    title: `${service?.name || typeInfo.service_label} | ${site?.site_name || 'サイト'}`,
    description: service?.description
  });

  if (serviceLoading || siteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-400 mb-4">{typeInfo.service_label}が見つかりません</p>
          <button
            onClick={() => window.history.back()}
            className="text-amber-600 hover:text-amber-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">{service.name}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            {service.image_url || service.images?.[0] ? (
              <div className="space-y-3">
                <img
                  src={service.image_url || service.images[0]}
                  alt={service.name}
                  className="w-full h-80 object-cover rounded-xl"
                />
                {service.images && service.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {service.images.slice(1, 5).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt=""
                        className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-6xl">
                {typeInfo.icon}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {service.description && (
              <p className="text-slate-700 leading-relaxed mb-6">{service.description}</p>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
              {service.price > 0 && (
                <div>
                  <p className="text-sm text-slate-500">{getPriceLabel(site.business_type)}</p>
                  <p className="text-2xl font-bold text-amber-600">¥{service.price.toLocaleString()}</p>
                </div>
              )}
              {service.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">{getDurationLabel(site.business_type)}</p>
                    <p className="font-medium text-slate-800">{service.duration}</p>
                  </div>
                </div>
              )}
              {service.capacity && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">{getCapacityLabel(site.business_type)}</p>
                    <p className="font-medium text-slate-800">{service.capacity}名</p>
                  </div>
                </div>
              )}
              {service.size && (
                <div>
                  <p className="text-sm text-slate-500">面積</p>
                  <p className="font-medium text-slate-800">{service.size}m²</p>
                </div>
              )}
            </div>

            {/* Amenities / Features */}
            {service.amenities && service.amenities.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-800 mb-3">設備・特徴</h3>
                <div className="space-y-2">
                  {service.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Form */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-800 mb-4">ご予約</h3>
              {bookingStatus === 'done' ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 font-medium">ご予約ありがとうございます</p>
                  <p className="text-sm text-slate-500 mt-1">確認メールをお送りいたします</p>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-3">
                  <input
                    type="text"
                    placeholder="お名前"
                    value={bookingForm.name}
                    onChange={e => setBookingForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    required
                  />
                  <input
                    type="email"
                    placeholder="メールアドレス"
                    value={bookingForm.email}
                    onChange={e => setBookingForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    required
                  />
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={e => setBookingForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    required
                  />
                  <textarea
                    placeholder="ご要望・メッセージ"
                    value={bookingForm.message}
                    onChange={e => setBookingForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm h-24 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <button
                    type="submit"
                    disabled={bookingStatus === 'sending'}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    {bookingStatus === 'sending' ? '送信中...' : 'ご予約する'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}