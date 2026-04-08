import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ManualNavigationLinkList({
  links,
  onEdit,
  onDelete,
  onMove,
  isLoading,
}) {
  if (!links || links.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-6 text-center text-slate-400">
        <p className="text-sm">手動追加リンクがありません</p>
      </div>
    );
  }

  const sorted = [...links].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-2">
      {sorted.map((link, idx) => (
        <Card key={link.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            {/* Order badge */}
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {idx + 1}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{link.label}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                <span className="truncate">{link.url}</span>
                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  {link.target === '_blank' ? '新規タブ' : '同一タブ'}
                </span>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  link.placement === 'header' ? 'bg-blue-100 text-blue-700' :
                  link.placement === 'footer' ? 'bg-purple-100 text-purple-700' :
                  'bg-emerald-100 text-emerald-700'
                )}>
                  {link.placement === 'header' ? 'ヘッダー' :
                   link.placement === 'footer' ? 'フッター' : '両方'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => onMove(link.id, -1)}
                disabled={idx === 0 || isLoading}
                title="上に移動"
              >
                <ChevronUp className="w-4 h-4 text-slate-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => onMove(link.id, 1)}
                disabled={idx === sorted.length - 1 || isLoading}
                title="下に移動"
              >
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => onEdit(link)}
                disabled={isLoading}
              >
                <Pencil className="w-4 h-4 text-slate-400 hover:text-amber-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => onDelete(link.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-400" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}