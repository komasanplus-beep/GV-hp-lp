import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function ABComparisonTable({ experiment, lpA, lpB, analyticsA, analyticsB }) {
  const cvA = analyticsA?.page_views > 0 ? ((analyticsA.conversions / analyticsA.page_views) * 100).toFixed(1) : '0.0';
  const cvB = analyticsB?.page_views > 0 ? ((analyticsB.conversions / analyticsB.page_views) * 100).toFixed(1) : '0.0';

  const rows = [
    { label: 'ページビュー (PV)', a: (analyticsA?.page_views ?? 0).toLocaleString(), b: (analyticsB?.page_views ?? 0).toLocaleString() },
    { label: 'CTAクリック', a: (analyticsA?.cta_clicks ?? 0).toLocaleString(), b: (analyticsB?.cta_clicks ?? 0).toLocaleString() },
    { label: 'コンバージョン (CV)', a: (analyticsA?.conversions ?? 0).toLocaleString(), b: (analyticsB?.conversions ?? 0).toLocaleString() },
    { label: 'CV率', a: `${cvA}%`, b: `${cvB}%` },
  ];

  const winner = parseFloat(cvA) > parseFloat(cvB) ? 'A' : parseFloat(cvB) > parseFloat(cvA) ? 'B' : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
        <div className="p-4 text-sm font-medium text-slate-500">指標</div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">A</span>
            <span className="text-sm font-semibold text-slate-700 truncate">{lpA?.title ?? 'LP-A'}</span>
            {winner === 'A' && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">勝者</Badge>}
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-6 h-6 bg-rose-100 text-rose-700 rounded-full text-xs font-bold flex items-center justify-center">B</span>
            <span className="text-sm font-semibold text-slate-700 truncate">{lpB?.title ?? 'LP-B'}</span>
            {winner === 'B' && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">勝者</Badge>}
          </div>
        </div>
      </div>
      {rows.map((row, i) => (
        <div key={i} className={`grid grid-cols-3 border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
          <div className="p-4 text-sm text-slate-600">{row.label}</div>
          <div className="p-4 text-center text-sm font-semibold text-blue-700">{row.a}</div>
          <div className="p-4 text-center text-sm font-semibold text-rose-600">{row.b}</div>
        </div>
      ))}
    </div>
  );
}