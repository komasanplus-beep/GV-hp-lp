import React from 'react';
import { cn } from '@/lib/utils';

export default function KPICard({ icon: Icon, label, value, unit, subValue, subLabel, color = 'bg-slate-50 border-slate-200 text-slate-700' }) {
  return (
    <div className={`border rounded-xl p-5 flex flex-col items-start ${color}`}>
      <div className="flex items-start justify-between w-full mb-4">
        <div>
          <p className="text-sm text-slate-600 font-semibold mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}{unit && <span className="text-base text-slate-500 ml-2">{unit}</span>}</p>
        </div>
        {Icon && <Icon className="w-6 h-6 text-slate-400 mt-1" />}
      </div>
      {subLabel && (
        <p className="text-sm text-slate-600">{subLabel}: <span className="font-semibold text-slate-800">{subValue}</span></p>
      )}
    </div>
  );
}