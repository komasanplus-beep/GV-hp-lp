/**
 * PayAsYouGoConfig
 * プランの従量課金設定UI
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

export default function PayAsYouGoConfig({ plan, onUpdate, loading }) {
  const [config, setConfig] = useState(plan?.payg_pricing || {
    enabled: true,
    free_quota: 10,
    unit_price_yen: 100,
    monthly_cap_yen: 5000,
  });

  const handleSave = () => {
    onUpdate({
      ...plan,
      payg_pricing: config,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div>
        <h4 className="font-semibold text-sm text-slate-800 mb-3">AI従量課金設定</h4>
        <div className="space-y-3">
          {/* 有効切り替え */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Pay as you go有効化</Label>
            <Switch
              checked={config.enabled !== false}
              onCheckedChange={(v) => setConfig(p => ({ ...p, enabled: v }))}
            />
          </div>

          {config.enabled !== false && (
            <>
              {/* 無料枠 */}
              <div>
                <label className="label-xs mb-1.5">月間無料枠（回数）</label>
                <Input
                  type="number"
                  min="0"
                  value={config.free_quota || 0}
                  onChange={(e) => setConfig(p => ({ ...p, free_quota: parseInt(e.target.value) || 0 }))}
                  placeholder="10"
                  className="h-8 text-sm"
                />
              </div>

              {/* 単価 */}
              <div>
                <label className="label-xs mb-1.5">1回あたりの料金（円）</label>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={config.unit_price_yen || 0}
                  onChange={(e) => setConfig(p => ({ ...p, unit_price_yen: parseInt(e.target.value) || 0 }))}
                  placeholder="100"
                  className="h-8 text-sm"
                />
              </div>

              {/* 月額上限 */}
              <div>
                <label className="label-xs mb-1.5">月額上限料金（円、空欄=無制限）</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={config.monthly_cap_yen || ''}
                  onChange={(e) => setConfig(p => ({ ...p, monthly_cap_yen: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="5000"
                  className="h-8 text-sm"
                />
              </div>

              {/* シミュレーション */}
              {config.free_quota > 0 && config.unit_price_yen > 0 && (
                <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">料金シミュレーション</p>
                  {[10, 20, 30, 50].map(usage => {
                    const overage = Math.max(0, usage - config.free_quota);
                    const cost = overage * config.unit_price_yen;
                    const cappedCost = config.monthly_cap_yen !== null ? Math.min(cost, config.monthly_cap_yen) : cost;
                    return (
                      <div key={usage} className="flex justify-between text-xs text-slate-600">
                        <span>{usage}回使用時</span>
                        <span className="font-medium">
                          {overage > 0 ? `¥${cappedCost.toLocaleString('ja-JP')}` : '無料'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex gap-2 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-blue-700">
                  Pay as you go有効時、無料枠を超過しても利用できます。超過分が自動課金されます。
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700"
      >
        {loading ? 'saving...' : 'Save Configuration'}
      </Button>
    </div>
  );
}