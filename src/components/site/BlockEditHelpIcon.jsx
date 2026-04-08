import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function BlockEditHelpIcon() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          aria-label="ブロック編集の説明"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">ブロック編集とは</h4>
            <p className="text-slate-700">
              このページ専用の表示内容や並び順を編集する機能です。
            </p>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="font-semibold text-slate-900 mb-1">コンテンツ管理とは</h4>
            <p className="text-slate-700">
              記事・サービス・共通情報など、複数ページで再利用できる中身を管理する機能です。
            </p>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="font-semibold text-slate-900 mb-2">入力方式を選べます</h4>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-slate-800">手入力</p>
                <p className="text-slate-600">
                  このページだけの内容をその場で入力します。
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-800">コンテンツ選択</p>
                <p className="text-slate-600">
                  サービス管理・記事管理・共通コンテンツから選んで表示します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}