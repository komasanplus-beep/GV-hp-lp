import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LPDomainSettingDialog({ lp, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [domainType, setDomainType] = useState('subdomain');
  const [subdomain, setSubdomain] = useState('');
  const [domain, setDomain] = useState('');
  const [siteId, setSiteId] = useState('');

  const { data: existing } = useQuery({
    queryKey: ['lpDomainMapping', lp?.id],
    queryFn: () => base44.entities.DomainMapping.filter({ landing_page_id: lp.id }),
    enabled: !!lp?.id && open,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list(),
    enabled: open,
  });

  // 既存設定の初期値反映
  useEffect(() => {
    if (!open) return;
    const record = existing?.[0];
    if (record) {
      setDomainType(record.domain_type || 'subdomain');
      setSubdomain(record.subdomain || '');
      setDomain(record.domain || '');
      setSiteId(record.site_id || '');
    } else {
      setDomainType('subdomain');
      setSubdomain('');
      setDomain('');
      setSiteId('');
    }
  }, [existing, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const record = existing?.[0];

      const data = {
        landing_page_id: lp.id,
        user_id: user.id,
        domain_type: domainType,
        subdomain: domainType === 'subdomain' ? subdomain : '',
        domain: domainType === 'custom_domain' ? domain : '',
        site_id: domainType === 'site_path' ? siteId : (record?.site_id || ''),
        ...(domainType === 'custom_domain' ? { verification_status: 'pending' } : {}),
      };

      if (record) {
        return base44.entities.DomainMapping.update(record.id, data);
      } else {
        return base44.entities.DomainMapping.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpDomainMapping', lp.id] });
      toast.success('公開URL設定を保存しました');
      onOpenChange(false);
    },
  });

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('コピーしました'); };

  const selectedSite = sites.find(s => s.id === siteId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>公開URL設定</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 -mt-2">{lp?.title}</p>

        <div className="space-y-4 pt-1">
          {/* Domain type selector */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">公開方法</label>
            <Select value={domainType} onValueChange={setDomainType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subdomain">サブドメイン（無料）</SelectItem>
                <SelectItem value="custom_domain">独自ドメイン</SelectItem>
                <SelectItem value="site_path">サイトのパス配下</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* subdomain */}
          {domainType === 'subdomain' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">サブドメイン</label>
              <div className="flex items-center gap-2">
                <Input value={subdomain} onChange={e => setSubdomain(e.target.value)} placeholder="campaign" />
                <span className="text-sm text-slate-400 whitespace-nowrap">.base44.app</span>
              </div>
              {subdomain && (
                <p className="text-xs text-slate-400 mt-1">URL: https://{subdomain}.base44.app</p>
              )}
            </div>
          )}

          {/* custom_domain */}
          {domainType === 'custom_domain' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">ドメイン名</label>
                <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="campaign.com" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-700">DNS設定手順</p>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span><strong>Aレコード:</strong> @ → <code className="bg-white border px-1 rounded">216.24.57.1</code></span>
                  <button onClick={() => copy('216.24.57.1')}><Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" /></button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span><strong>CNAME:</strong> www → <code className="bg-white border px-1 rounded">base44.onrender.com</code></span>
                  <button onClick={() => copy('base44.onrender.com')}><Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" /></button>
                </div>
              </div>
            </div>
          )}

          {/* site_path */}
          {domainType === 'site_path' && (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">紐付けるサイト</label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger><SelectValue placeholder="サイトを選択" /></SelectTrigger>
                  <SelectContent>
                    {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selectedSite && lp?.slug && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">プレビューURL</p>
                  <p className="text-sm font-medium text-slate-800">{selectedSite.site_name}/lp/{lp.slug}</p>
                  <p className="text-xs text-slate-400 mt-2">※パスにはLPのスラッグ（半角英数字・ハイフンのみ）が自動的に使用されます。スラッグはLP作成時に設定した値です。</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button
              className="flex-1 bg-slate-800 hover:bg-slate-700"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}