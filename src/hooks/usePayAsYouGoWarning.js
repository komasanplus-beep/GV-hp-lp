/**
 * usePayAsYouGoWarning
 * AI従量課金の警告・通知を管理するカスタムフック
 */
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AlertCircle, TrendingUp } from 'lucide-react';

export function usePayAsYouGoWarning(payg) {
  const [warned, setWarned] = useState(false);

  useEffect(() => {
    if (!payg?.enabled || payg?.cost === 0 || warned) {
      return;
    }

    if (payg.overage > 0) {
      // 超過時の警告
      toast(
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">AI従量課金が発生しています</p>
            <p className="text-xs text-slate-600 mt-1">
              {payg.overage}回の超過分：¥{Math.round(payg.cost).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>,
        {
          position: 'bottom-right',
          duration: 5000,
        }
      );
      setWarned(true);
    }
  }, [payg?.cost, payg?.overage, payg?.enabled, warned]);

  return {
    isCost: payg?.cost > 0,
    cost: payg?.cost || 0,
    overage: payg?.overage || 0,
  };
}