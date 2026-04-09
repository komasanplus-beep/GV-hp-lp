import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Star, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';

export default function OwnerAnnouncementBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data } = useQuery({
    queryKey: ['ownerAnnouncements'],
    queryFn: () => base44.functions.invoke('getOwnerAnnouncements', {}).then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const announcements = data?.announcements || [];
  const unreadCount = data?.unread_count || 0;

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('markAnnouncementRead', { announcement_id: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ownerAnnouncements'] }),
  });

  const handleOpen = (item) => {
    setSelected(item);
    if (!item.is_read) markReadMutation.mutate(item.id);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="お知らせ"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSelected(null); }} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-slate-800 text-sm">お知らせ</h3>
              <button onClick={() => { setOpen(false); setSelected(null); }}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {selected ? (
              /* Detail View */
              <div className="p-4 max-h-80 overflow-y-auto">
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-blue-500 hover:underline mb-3 block"
                >← 一覧に戻る</button>
                <div className="flex items-center gap-2 mb-2">
                  {selected.is_important && (
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                      <Star className="w-3 h-3" />重要
                    </span>
                  )}
                  <span className="font-semibold text-slate-800 text-sm">{selected.title}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {selected.publish_start_at && format(new Date(selected.publish_start_at), 'yyyy/MM/dd')}
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selected.body}</p>
                {selected.attachment_urls?.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />添付ファイル
                    </p>
                    {selected.attachment_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        className="block text-xs text-blue-600 hover:underline truncate">
                        ファイル {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* List View */
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {announcements.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">お知らせはありません</div>
                ) : announcements.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleOpen(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!item.is_read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!item.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                      {item.is_read && <span className="w-1.5 h-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {item.is_important && <Star className="w-3 h-3 text-red-500 shrink-0" />}
                          <span className={`text-sm truncate ${!item.is_read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.publish_start_at && format(new Date(item.publish_start_at), 'MM/dd')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}