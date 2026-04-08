/**
 * BackupManager - バックアップ＆復元UI
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createBackup, restoreBackup } from '@/lib/backup';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Shield, Plus, RotateCcw, Trash2, Pin, PinOff, Loader2,
  AlertTriangle, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function BackupManager({ siteId }) {
  const qc = useQueryClient();

  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [restoreTarget, setRestoreTarget] = useState(null); // Backup object
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [restoreProgress, setRestoreProgress] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch backups
  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['backups', siteId],
    queryFn: () => base44.entities.Backup.filter({ site_id: siteId }, '-created_date'),
    enabled: !!siteId,
  });

  const autoBackups = backups.filter(b => b.type === 'auto');
  const manualBackups = backups.filter(b => b.type === 'manual');

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Backup.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backups', siteId] });
      toast.success('削除しました');
    },
  });

  // Pin toggle
  const pinMutation = useMutation({
    mutationFn: ({ id, is_pinned }) => base44.entities.Backup.update(id, { is_pinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backups', siteId] }),
  });

  // Manual backup
  const handleManualBackup = async () => {
    if (!manualName.trim()) { toast.error('名前を入力してください'); return; }
    setIsCreating(true);
    try {
      await createBackup(siteId, { name: manualName.trim(), description: manualDesc.trim(), type: 'manual' });
      qc.invalidateQueries({ queryKey: ['backups', siteId] });
      toast.success('バックアップを保存しました');
      setManualName('');
      setManualDesc('');
      setShowCreateForm(false);
    } catch (err) {
      toast.error('バックアップに失敗しました: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Quick auto backup
  const handleQuickBackup = async () => {
    setIsCreating(true);
    try {
      await createBackup(siteId, { type: 'auto' });
      qc.invalidateQueries({ queryKey: ['backups', siteId] });
      toast.success('自動バックアップを作成しました');
    } catch (err) {
      toast.error('失敗: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Restore
  const handleRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      await restoreBackup(restoreTarget.id, siteId, (msg) => setRestoreProgress(msg));
      qc.invalidateQueries({ queryKey: ['sitePages', siteId] });
      qc.invalidateQueries({ queryKey: ['backups', siteId] });
      toast.success('復元が完了しました');
      setRestoreTarget(null);
      setRestoreConfirmText('');
    } catch (err) {
      toast.error('復元に失敗しました: ' + err.message);
    } finally {
      setIsRestoring(false);
      setRestoreProgress('');
    }
  };

  return (
    <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-slate-700">バックアップ管理</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            手動 {manualBackups.length}/30 · 自動 {autoBackups.length}/10
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleQuickBackup}
            disabled={isCreating}
          >
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            今すぐ保存
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs bg-slate-700 hover:bg-slate-800"
            onClick={() => setShowCreateForm(p => !p)}
          >
            <Plus className="w-3.5 h-3.5" />名前を付けて保存
          </Button>
        </div>
      </div>

      {/* 注意文 */}
      <div className="bg-blue-50 border-b border-blue-100 px-5 py-2.5 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-600 leading-relaxed">
          ページ構成・文章・設定・サービス・記事は復元できます。外部連携や画像ファイルの状態によっては完全に再現できない場合があります。
        </p>
      </div>

      {/* 手動作成フォーム */}
      {showCreateForm && (
        <div className="px-5 py-4 bg-white border-b border-slate-100 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">バックアップ名 <span className="text-red-500">*</span></label>
            <Input
              value={manualName}
              onChange={e => setManualName(e.target.value)}
              placeholder="例: デザイン変更前"
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">説明（任意）</label>
            <Textarea
              value={manualDesc}
              onChange={e => setManualDesc(e.target.value)}
              placeholder="変更内容のメモなど"
              rows={2}
              className="text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)} className="text-xs">キャンセル</Button>
            <Button
              size="sm"
              className="bg-slate-700 hover:bg-slate-800 gap-1.5 text-xs"
              onClick={handleManualBackup}
              disabled={isCreating || !manualName.trim()}
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              保存する
            </Button>
          </div>
        </div>
      )}

      {/* バックアップ一覧 */}
      <div className="divide-y divide-slate-100">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : backups.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-20" />
            バックアップがありません
          </div>
        ) : (
          backups.map(backup => (
            <BackupRow
              key={backup.id}
              backup={backup}
              onRestore={() => { setRestoreTarget(backup); setRestoreConfirmText(''); }}
              onDelete={() => deleteMutation.mutate(backup.id)}
              onTogglePin={() => pinMutation.mutate({ id: backup.id, is_pinned: !backup.is_pinned })}
              isDeleting={deleteMutation.isPending}
            />
          ))
        )}
      </div>

      {/* 復元確認モーダル */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">このバックアップに復元しますか？</h2>
                <p className="text-sm text-slate-500 mt-0.5">「{restoreTarget.name || '自動保存'}」</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700 leading-relaxed">
              現在のデータはすべて上書きされます。<br />
              <strong>復元前に現在の状態は自動バックアップされます。</strong>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 mb-5">
              <p className="text-sm font-medium text-slate-700 mb-2">
                実行する場合は <code className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono text-xs">RESTORE</code> と入力してください
              </p>
              <input
                type="text"
                value={restoreConfirmText}
                onChange={e => setRestoreConfirmText(e.target.value)}
                placeholder="RESTORE"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoFocus
                disabled={isRestoring}
              />
              {isRestoring && restoreProgress && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />{restoreProgress}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRestoreTarget(null); setRestoreConfirmText(''); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                disabled={isRestoring}
              >
                キャンセル
              </button>
              <button
                disabled={restoreConfirmText !== 'RESTORE' || isRestoring}
                onClick={handleRestore}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isRestoring
                  ? <><Loader2 className="w-4 h-4 animate-spin" />復元中...</>
                  : <><RotateCcw className="w-4 h-4" />復元を実行する</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BackupRow({ backup, onRestore, onDelete, onTogglePin, isDeleting }) {
  const typeLabel = backup.type === 'auto' ? '自動' : '手動';
  const typeColor = backup.type === 'auto'
    ? 'bg-slate-100 text-slate-500'
    : 'bg-blue-50 text-blue-600';

  return (
    <div className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors ${backup.is_pinned ? 'bg-amber-50/40' : ''}`}>
      {/* Pin indicator */}
      <button
        onClick={onTogglePin}
        className={`flex-shrink-0 ${backup.is_pinned ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'} transition-colors`}
        title={backup.is_pinned ? 'ピン解除' : 'ピン留め（削除されません）'}
      >
        {backup.is_pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800 truncate">
            {backup.name || '自動保存'}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeColor}`}>
            {typeLabel}
          </span>
          {backup.is_pinned && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
              ピン
            </span>
          )}
        </div>
        {backup.description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{backup.description}</p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">
          {backup.created_date
            ? format(new Date(backup.created_date), 'yyyy/MM/dd HH:mm')
            : '—'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onRestore}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />復元
        </button>
        {!backup.is_pinned && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
            title="削除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}