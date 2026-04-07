/**
 * ServiceList
 * 業種に応じた Service 一覧表示
 * - hotel: 客室一覧
 * - salon: メニュー一覧
 * - clinic: 診療科目一覧等
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getServiceLabel, getPriceLabel, getDurationLabel, getCapacityLabel, BUSINESS_TYPE_LABELS } from '@/lib/businessTypeLabels';
import { useNavigate } from 'react-router-dom';

export default function ServiceList({ siteId, businessType = 'other', onServiceSelect }) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', siteId],
    queryFn: () => siteId
      ? base44.entities.Service.filter({ site_id: siteId }, 'sort_order')
      : Promise.resolve([]),
  });

  const navigate = useNavigate();
  const typeInfo = BUSINESS_TYPE_LABELS[businessType] || BUSINESS_TYPE_LABELS.other;

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">読み込み中...</div>;
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <div className="text-4xl mb-3">{typeInfo.icon}</div>
        <p className="font-medium">{typeInfo.service_label}がまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {services.map(service => (
        <div
          key={service.id}
          className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => {
            if (onServiceSelect) {
              onServiceSelect(service);
            } else {
              navigate(`/service/${service.id}?site_id=${siteId}`);
            }
          }}
        >
          {/* Image */}
          {service.image_url || service.images?.[0] ? (
            <img
              src={service.image_url || service.images[0]}
              alt={service.name}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl">
              {typeInfo.icon}
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{service.name}</h3>
            {service.description && (
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{service.description}</p>
            )}

            {/* Info Row */}
            <div className="space-y-1 text-sm">
              {service.price > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{getPriceLabel(businessType)}</span>
                  <span className="font-medium text-amber-600">¥{service.price.toLocaleString()}</span>
                </div>
              )}
              {service.duration && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{getDurationLabel(businessType)}</span>
                  <span className="text-slate-700">{service.duration}</span>
                </div>
              )}
              {service.capacity && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{getCapacityLabel(businessType)}</span>
                  <span className="text-slate-700">{service.capacity}名</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            {service.status === 'unavailable' && (
              <div className="mt-2 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                利用不可
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}