/**
 * PageTypeHelpIcon.jsx
 * ページタイプのヘルプを表示するコンポーネント
 * クリック式 Popover で説明を表示
 */
import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getPageTypeHelp } from '@/lib/pageTypeHelpContent';

export default function PageTypeHelpIcon({ type = 'top', size = 'sm' }) {
  const [open, setOpen] = useState(false);
  const help = getPageTypeHelp(type);
  
  if (!help) return null;

  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 rounded-full p-0.5"
          aria-label={`${help.title}の説明`}
          title={help.title}
        >
          <HelpCircle className={sizeStyles[size]} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        className="w-80 p-0 shadow-lg"
      >
        <div className="bg-white rounded-lg">
          {/* ヘッダー */}
          <div className="flex items-start justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-2xl">{help.icon}</span>
              <h3 className="font-semibold text-slate-900 text-sm">{help.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-4 space-y-4">
            {/* 説明文 */}
            <p className="text-sm text-slate-700 leading-relaxed">
              {help.description}
            </p>

            {/* 詳細リスト */}
            {help.details && help.details.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  特徴
                </p>
                <ul className="space-y-2">
                  {help.details.map((detail, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-600"
                    >
                      <span className="text-blue-500 mt-1 flex-shrink-0">✓</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="bg-slate-50 px-4 py-3 rounded-b-lg border-t border-slate-100 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              わかりました
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}