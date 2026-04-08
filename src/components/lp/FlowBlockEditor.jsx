/**
 * FlowBlockEditor
 * Flow ブロック専用エディタ
 * ステップを1件ずつ編集できるUI
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronUp, ChevronDown, Plus, Trash2, Copy } from 'lucide-react';

export default function FlowBlockEditor({ data = {}, onChange }) {
  const [title, setTitle] = useState(data.title || '');
  const [steps, setSteps] = useState(data.steps || []);

  // データ更新時に親に通知
  useEffect(() => {
    onChange({ title, steps });
  }, [title, steps, onChange]);

  const addStep = () => {
    const newStep = {
      id: `step_${Date.now()}`,
      heading: '',
      description: '',
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index, updates) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const duplicateStep = (index) => {
    const step = steps[index];
    const newStep = {
      ...step,
      id: `step_${Date.now()}`,
      heading: `${step.heading} (複製)`,
    };
    setSteps([...steps.slice(0, index + 1), newStep, ...steps.slice(index + 1)]);
  };

  const moveStepUp = (index) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setSteps(newSteps);
  };

  const moveStepDown = (index) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
  };

  return (
    <div className="space-y-6">
      {/* タイトル */}
      <div>
        <Label className="mb-1 block text-sm font-medium text-slate-700">
          セクションタイトル
        </Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 施術の流れ"
          className="text-base"
        />
      </div>

      {/* ステップ一覧 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium text-slate-700">ステップ</Label>
          <span className="text-xs text-slate-500">{steps.length}件</span>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {steps.map((step, index) => (
            <Card key={step.id || index}>
              <CardContent className="pt-4">
                {/* ステップ番号表示 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">ステップ {index + 1}</span>
                </div>

                {/* ステップ名 */}
                <div className="mb-3">
                  <Label className="text-xs text-slate-600 mb-1.5 block">
                    ステップ名 / タイトル
                  </Label>
                  <Input
                    value={step.heading || ''}
                    onChange={(e) => updateStep(index, { heading: e.target.value })}
                    placeholder="例: ご予約"
                    className="text-sm"
                  />
                </div>

                {/* 説明文 */}
                <div className="mb-4">
                  <Label className="text-xs text-slate-600 mb-1.5 block">
                    説明文
                  </Label>
                  <Textarea
                    value={step.description || ''}
                    onChange={(e) => updateStep(index, { description: e.target.value })}
                    placeholder="このステップの説明を入力..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                {/* 操作ボタン */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-slate-500 hover:text-slate-700 h-7"
                    onClick={() => moveStepUp(index)}
                    disabled={index === 0}
                    title="上に移動"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-slate-500 hover:text-slate-700 h-7"
                    onClick={() => moveStepDown(index)}
                    disabled={index === steps.length - 1}
                    title="下に移動"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>

                  <div className="flex-1"></div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-slate-500 hover:text-slate-700 h-7"
                    onClick={() => duplicateStep(index)}
                    title="複製"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    複製
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-500 hover:text-red-700 h-7"
                    onClick={() => removeStep(index)}
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {steps.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
            <p className="text-sm">ステップがありません</p>
            <p className="text-xs mt-1">「ステップ追加」でステップを追加してください</p>
          </div>
        )}
      </div>

      {/* ステップ追加ボタン */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={addStep}
      >
        <Plus className="w-4 h-4 mr-2" />
        ステップ追加
      </Button>
    </div>
  );
}