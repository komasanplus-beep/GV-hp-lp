import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckSquare, Square } from 'lucide-react';

export default function ContentSourceSelector({ siteId, sourceType, selectedIds, onChange }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!siteId || !sourceType) {
      setCandidates([]);
      return;
    }
    setLoading(true);
    base44.functions.invoke('getBlockContentCandidates', {
      site_id: siteId,
      content_source_type: sourceType,
    }).then(res => {
      setCandidates(res.data?.candidates || []);
    }).catch(() => setCandidates([]))
    .finally(() => setLoading(false));
  }, [siteId, sourceType]);

  const toggleItem = (id) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">読み込み中...</span>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-slate-400 bg-slate-50 rounded-lg">
        該当データがありません
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      <p className="text-xs text-slate-500">{selectedIds.length}件選択中</p>
      {candidates.map(item => {
        const isSelected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
              isSelected
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {isSelected
              ? <CheckSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              : <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            }
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-8 h-8 object-cover rounded shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                  {item.subtitle && <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>}
                </div>
                {item.price && <span className="text-xs text-amber-600 font-medium shrink-0 ml-auto">{item.price}</span>}
              </div>
              {item.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}