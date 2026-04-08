import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import LPCreationMethodModal from './LPCreationMethodModal';
import LPTemplateSelector from './LPTemplateSelector';

export default function LPCreationFlow({ open, onOpenChange, disabled }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState(null);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 1. バックエンドで制限チェック
      const checkRes = await base44.functions.invoke('validateLPCreation', { action: 'check' });
      if (!checkRes.data.canCreate) {
        throw new Error(`LP作成数の上限に達しています（${checkRes.data.limit}件）`);
      }

      // 2. LP作成
      const user = await base44.auth.me();
      const lp = await base44.entities.LandingPage.create({
        title: data.title || 'Untitled LP',
        slug: data.slug || `lp-${Date.now()}`,
        status: 'draft',
        creation_method: 'manual',
        user_id: user.id,
      });

      // 3. 最小限のブロック（Heroのみ）を作成
      await base44.entities.LPBlock.create({
        lp_id: lp.id,
        block_type: 'Hero',
        sort_order: 0,
        data: { headline: '', subheadline: '', cta_text: '詳しく見る' },
      });

      // 4. バックエンドで月度カウンターをインクリメント
      await base44.functions.invoke('validateLPCreation', { action: 'increment' });

      return lp;
    },
    onSuccess: (lp) => {
      queryClient.invalidateQueries({ queryKey: ['landingPages'] });
      queryClient.invalidateQueries({ queryKey: ['planUsage'] });
      setSelectedMethod(null);
      onOpenChange(false);
      
      // 選択した方法に応じて遷移
      if (selectedMethod === 'ai_text') {
        navigate(createPageUrl('AdminLPList?method=ai_text&id=' + lp.id));
      } else if (selectedMethod === 'ai_template') {
        navigate(createPageUrl(`AdminLPEditor?id=${lp.id}&showTemplateSelector=true`));
      } else if (selectedMethod === 'code_import') {
        navigate(createPageUrl('AdminLPCodeCreator'));
      } else {
        // manual - エディタへ直接遷移
        navigate(createPageUrl(`AdminLPEditor?id=${lp.id}`));
      }
    },
  });

  const handleSelectMethod = async (method) => {
    setSelectedMethod(method);
    
    if (method === 'manual') {
      // 手動作成 - すぐにLP作成
      createMutation.mutate({});
    } else if (method === 'ai_text') {
      // テキストからAI生成 - LP管理へ戻る（新規作成フローで処理）
      onOpenChange(false);
      navigate(createPageUrl('AdminLPList?method=ai_text'));
    } else if (method === 'ai_template') {
      // テンプレートからAI生成
      onOpenChange(false);
      navigate(createPageUrl('AdminLPList?method=ai_template'));
    } else if (method === 'code_import') {
      // コード貼り付け - AdminLPCodeCreator へ遷移
      onOpenChange(false);
      navigate(createPageUrl('AdminLPCodeCreator'));
    }
  };

  return (
    <LPCreationMethodModal
      open={open}
      onOpenChange={onOpenChange}
      onSelectMethod={handleSelectMethod}
    />
  );
}