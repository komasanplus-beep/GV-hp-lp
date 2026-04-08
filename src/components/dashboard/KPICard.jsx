import React from 'react';
import { cn } from '@/lib/utils';

export default function KPICard({ icon: Icon, label, value, unit, subValue, subLabel, color = 'bg-slate-50 border-slate-200 text-slate-700' }) {
  return (
    <div className={`border rounded-xl p-4 flex flex-col items-start ${color}`}>
      <div className="flex items-start justify-between w-full mb-3">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}{unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}</p>
        </div>
        {Icon && <Icon className="w-5 h-5 text-slate-400 mt-0.5" />}
      </div>
      {subLabel && (
        <p className="text-xs text-slate-500">{subLabel}: <span className="font-semibold text-slate-700">{subValue}</span></p>
      )}
    </div>
  );
}