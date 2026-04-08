import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, LayoutTemplate, Code, Pencil } from 'lucide-react';

const CREATION_METHODS = [
  {
    id: 'ai_text',
    label: 'テキストからAIで生成する',
    description: '入力した内容をもとにAIがLPを自動作成します',
    icon: FileText,
  },
  {
    id: 'ai_template',
    label: 'テンプレートからAIで生成する',
    description: 'テンプレートを選んでAIで内容を生成します',
    icon: LayoutTemplate,
  },
  {
    id: 'code_import',
    label: 'コード貼り付けて生成する',
    description: '既存コードをもとにLP構成へ変換します',
    icon: Code,
  },
  {
    id: 'manual',
    label: '手動で生成する',
    description: '空の状態から自分でLPを作成します',
    icon: Pencil,
  },
];

export default function LPCreationMethodModal({ open, onOpenChange, onSelectMethod }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>LPの作成方法を選択</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
          {CREATION_METHODS.map(method => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => onSelectMethod(method.id)}
                className="flex flex-col items-start gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all text-left"
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 text-sm">{method.label}</span>
                </div>
                <p className="text-xs text-slate-500">{method.description}</p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}