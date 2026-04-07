/**
 * ServiceListByType
 * 業種別Service一覧表示
 * hotel: グリッド・高級デザイン
 * salon: リスト型・シンプル
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getUIConfig } from '@/lib/uiConfig';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ServiceListByType({ siteId, businessType = 'other' }) {
  const config = getUIConfig(businessType);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', siteId],
    queryFn: () =>
      siteId
        ? base44.entities.Service.filter({ site_id: siteId }, 'sort_order')
        : Promise.resolve([]),
    enabled: !!siteId,
  });

  const searchParams = new URLSearchParams(window.location.search);
  const isPreview = searchParams.get('preview') === 'true';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <div className="text-4xl mb-3">{config.icon}</div>
        <p className="text-sm">{config.service_plural}がありません</p>
      </div>
    );
  }

  // Hotel: グリッド・高級デザイン
  if (businessType === 'hotel') {
    return (
      <div className={cn('grid gap-6', config.layout.service_grid)}>
        {services.map((svc) => (
          <Link
            key={svc.id}
            to={`/service/${svc.id}?site_id=${siteId}${isPreview ? '&preview=true' : ''}`}
            className={cn(
              'group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105',
              config.layout.service_card_height,
              'bg-white'
            )}
          >
            {svc.image_url && (
              <div className={cn('overflow-hidden', config.layout.service_image_height)}>
                <img
                  src={svc.image_url}
                  alt={svc.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="font-serif text-xl font-semibold text-slate-800 mb-2">
                  {svc.name}
                </h3>
                {svc.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{svc.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                {svc.price > 0 && (
                  <span className={cn('text-lg font-semibold', `text-amber-600`)}>
                    ¥{svc.price.toLocaleString()}
                  </span>
                )}
                <span className="text-xs text-amber-600 font-medium">詳しく見る →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  // Salon: リスト型・シンプル
  if (businessType === 'salon') {
    return (
      <div className="space-y-3">
        {services.map((svc) => (
          <Link
            key={svc.id}
            to={`/service/${svc.id}?site_id=${siteId}${isPreview ? '&preview=true' : ''}`}
            className="flex items-center gap-4 p-4 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 transition-colors duration-200 group"
          >
            {svc.image_url && (
              <img
                src={svc.image_url}
                alt={svc.name}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">
                {svc.name}
              </h3>
              {svc.description && (
                <p className="text-sm text-slate-500 line-clamp-1">{svc.description}</p>
              )}
              {svc.duration && (
                <p className="text-xs text-slate-400 mt-1">{svc.duration}</p>
              )}
            </div>
            {svc.price > 0 && (
              <span className="text-lg font-semibold text-rose-600 flex-shrink-0">
                ¥{svc.price.toLocaleString()}
              </span>
            )}
          </Link>
        ))}
      </div>
    );
  }

  // Default: グリッド
  return (
    <div className={cn('grid gap-4', config.layout.service_grid)}>
      {services.map((svc) => (
        <Link
          key={svc.id}
          to={`/service/${svc.id}?site_id=${siteId}${isPreview ? '&preview=true' : ''}`}
          className="rounded-lg overflow-hidden bg-white border shadow-sm hover:shadow-md transition-all duration-200"
        >
          {svc.image_url && (
            <img
              src={svc.image_url}
              alt={svc.name}
              className={cn('w-full object-cover', config.layout.service_image_height)}
            />
          )}
          <div className="p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-1">{svc.name}</h3>
            {svc.description && (
              <p className="text-xs text-slate-600 line-clamp-2 mb-2">{svc.description}</p>
            )}
            {svc.price > 0 && (
              <p className="text-sm font-semibold text-slate-700">¥{svc.price.toLocaleString()}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}