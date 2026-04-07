import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSeoHead } from '@/hooks/useSeoHead';

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const [searchParams] = useSearchParams();
  const siteId = searchParams.get('site_id');
  const isPreview = searchParams.get('preview') === 'true';

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => serviceId
      ? base44.entities.Service.filter({ id: serviceId }).then(r => r[0])
      : null,
    enabled: !!serviceId,
    retry: false,
  });

  const { data: site } = useQuery({
    queryKey: ['site', siteId],
    queryFn: () => siteId
      ? base44.entities.Site.filter({ id: siteId }).then(r => r[0])
      : null,
    enabled: !!siteId,
    retry: false,
  });

  useSeoHead({
    title: service ? `${service.name} | ${site?.site_name || 'Service'}` : site?.site_name,
    description: service?.description || site?.seo_config?.meta_description,
    ogImage: service?.image_url || site?.seo_config?.og_image_url,
  });

  if (serviceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-slate-400">
          <p className="text-2xl mb-2">サービスが見つかりません</p>
          {siteId && (
            <Link to={`/site/${siteId}${isPreview ? '?preview=true' : ''}`}>
              <Button variant="outline" className="mt-4">
                サイトに戻る
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center gap-4">
          {siteId && (
            <Link to={`/site/${siteId}${isPreview ? '?preview=true' : ''}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <h1 className="text-xl font-bold text-slate-800">{service.name}</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Image */}
        {service.image_url && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <img 
              src={service.image_url} 
              alt={service.name}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Price & Duration */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {service.price > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Tag className="w-4 h-4" />
                <p className="text-sm font-medium">料金</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600">¥{service.price.toLocaleString()}</p>
            </div>
          )}
          
          {service.duration && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                <p className="text-sm font-medium">所要時間</p>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{service.duration}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {service.description && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">サービス詳細</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">{service.description}</p>
          </div>
        )}

        {/* Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">
            ステータス: 
            <span className={`ml-2 font-medium ${
              service.status === 'available' 
                ? 'text-emerald-600' 
                : 'text-slate-400'
            }`}>
              {service.status === 'available' ? '利用可能' : '利用不可'}
            </span>
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          {siteId && (
            <Link to={`/site/${siteId}${isPreview ? '?preview=true' : ''}`}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                一覧に戻る
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}