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
  const [showMethodModal, setShowMethodModal] = useState(open);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const lp = await base44.entities.LandingPage.create({
        title: data.title || 'Untitled LP',
        slug: data.slug || `lp-${Date.now()}`,
        status: 'draft',
        creation_method: 'manual',
        user_id: user.id,
      });

      // 最小限のブロック（Heroのみ）を作成
      await base44.entities.LPBlock.create({
        lp_id: lp.id,
        block_type: 'Hero',
        sort_order: 0,
        data: { headline: '', subheadline: '', cta_text: '詳しく見る' },
      });

      // PlanUsage をインクリメント
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usageList = await base44.entities.PlanUsage.filter({ user_id: user.id }).catch(() => []);
      const monthUsage = usageList.find(u => u.month_year === currentMonth);
      if (monthUsage) {
        await base44.entities.PlanUsage.update(monthUsage.id, { lp_count: (monthUsage.lp_count || 0) + 1 });
      } else {
        await base44.entities.PlanUsage.create({ user_id: user.id, month_year: currentMonth, lp_count: 1 });
      }

      return lp;
    },
    onSuccess: (lp) => {
      queryClient.invalidateQueries({ queryKey: ['landingPages'] });
      queryClient.invalidateQueries({ queryKey: ['planUsage'] });
      setShowMethodModal(false);
      setSelectedMethod(null);
      onOpenChange(false);
      
      // 選択した方法に応じて遷移
      if (selectedMethod === 'ai_text') {
        navigate(createPageUrl('AdminLPGenerate'));
      } else if (selectedMethod === 'ai_template') {
        // テンプレート選択画面へ遷移（別途実装）
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
      // テキストからAI生成 - AdminLPGenerate へ遷移
      setShowMethodModal(false);
      onOpenChange(false);
      navigate(createPageUrl('AdminLPGenerate'));
    } else if (method === 'ai_template') {
      // テンプレートからAI生成 - テンプレート選択モーダルを表示
      // 別途モーダルを表示する場合はここで処理
      setShowMethodModal(false);
      onOpenChange(false);
      navigate(createPageUrl('AdminLPList?showTemplateCreation=true'));
    } else if (method === 'code_import') {
      // コード貼り付け - AdminLPCodeCreator へ遷移
      setShowMethodModal(false);
      onOpenChange(false);
      navigate(createPageUrl('AdminLPCodeCreator'));
    }
  };

  return (
    <LPCreationMethodModal
      open={showMethodModal}
      onOpenChange={(open) => {
        setShowMethodModal(open);
        if (!open) onOpenChange(false);
      }}
      onSelectMethod={handleSelectMethod}
    />
  );
}