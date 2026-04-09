import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MasterLayout from '@/components/master/MasterLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Copy, Megaphone, Users, Star, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const STATUS_LABEL = { draft: '下書き', published: '公開中', archived: '終了' };
const STATUS_COLOR = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-red-100 text-red-600',
};
const TARGET_LABEL = { all: '全ユーザー', filter: 'フィルター', selected_users: '個別指定' };

export default function MasterAnnouncements() {
  const queryClient = useQueryClient();
  const [statsMap, setStatsMap] = useState({});

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['masterAnnouncements'],
    queryFn: () => base44.entities.MasterAnnouncement.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MasterAnnouncement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterAnnouncements'] });
      toast.success('削除しました');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (item) => base44.entities.MasterAnnouncement.create({
      ...item,
      id: undefined,
      title: `【コピー】${item.title}`,
      status: 'draft',
      created_date: undefined,
      updated_date: undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterAnnouncements'] });
      toast.success('複製しました');
    },
  });

  const loadStats = async (id) => {
    const res = await base44.functions.invoke('getMasterAnnouncementStats', { announcement_id: id });
    setStatsMap(prev => ({ ...prev, [id]: res.data?.read_count ?? 0 }));
  };

  const getStatusForItem = (item) => {
    if (item.status !== 'published') return item.status;
    const now = new Date();
    if (item.publish_end_at && new Date(item.publish_end_at) < now) return 'archived';
    if (item.publish_start_at && new Date(item.publish_start_at) > now) return 'draft';
    return 'published';
  };

  return (
    <MasterLayout currentPageName="MasterAnnouncements">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl font-bold text-slate-800">オーナー向けお知らせ管理</h1>
          </div>
          <Link to="/MasterAnnouncementEdit">
            <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
              <Plus className="w-4 h-4" />新規作成
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-400">読み込み中...</div>
        ) : announcements.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-slate-400">お知らせがありません</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {announcements.map(item => {
              const displayStatus = getStatusForItem(item);
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {item.is_important && (
                            <Badge className="bg-red-100 text-red-700 gap-1 text-xs">
                              <Star className="w-3 h-3" />重要
                            </Badge>
                          )}
                          <span className="font-semibold text-slate-800 truncate">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 mt-1">
                          <Badge className={`${STATUS_COLOR[displayStatus]} text-xs`}>
                            {STATUS_LABEL[displayStatus]}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />{TARGET_LABEL[item.target_mode] || '全ユーザー'}
                          </span>
                          {item.publish_start_at && (
                            <span>開始: {format(new Date(item.publish_start_at), 'yyyy/MM/dd HH:mm')}</span>
                          )}
                          {item.publish_end_at && (
                            <span>終了: {format(new Date(item.publish_end_at), 'yyyy/MM/dd HH:mm')}</span>
                          )}
                          {statsMap[item.id] !== undefined ? (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Eye className="w-3 h-3" />既読 {statsMap[item.id]}件
                            </span>
                          ) : (
                            <button
                              onClick={() => loadStats(item.id)}
                              className="text-slate-400 hover:text-blue-500 underline"
                            >既読数を確認</button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link to={`/MasterAnnouncementEdit?id=${item.id}`}>
                          <Button size="sm" variant="ghost" title="編集">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" title="複製" onClick={() => duplicateMutation.mutate(item)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="text-red-400 hover:text-red-600"
                          title="削除"
                          onClick={() => { if (confirm('削除しますか？')) deleteMutation.mutate(item.id); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MasterLayout>
  );
}