import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MasterLayout from '@/components/master/MasterLayout';
import { Users, ToggleLeft, Settings, BookOpen, FileText, ArrowRight, CreditCard, Globe, Layout, Layers, LayoutDashboard } from 'lucide-react';

const cards = [
  { name: 'ユーザー管理', desc: 'ユーザーアカウント・停止', icon: Users, page: 'MasterUsers', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { name: '機能制御', desc: '機能ON/OFF・使用制限設定', icon: ToggleLeft, page: 'MasterFeatureControl', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { name: 'プラン管理', desc: 'サブスクリプションプラン', icon: CreditCard, page: 'MasterPlans', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { name: 'サイト一覧', desc: '全ユーザーのサイト管理', icon: Layout, page: 'MasterSiteList', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { name: 'LP一覧', desc: '全ユーザーのLP管理', icon: Layers, page: 'MasterLPList', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { name: 'ドメイン一覧', desc: 'ドメイン設定・検証管理', icon: Globe, page: 'MasterDomainList', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { name: 'テンプレート', desc: 'サイトテンプレート管理', icon: LayoutTemplate, page: 'MasterTemplates', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { name: 'AI設定', desc: 'AIモデル・プロンプト設定', icon: Settings, page: 'MasterAISettings', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { name: 'AIナレッジ', desc: 'ナレッジ登録・管理', icon: BookOpen, page: 'MasterAIKnowledge', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { name: 'システムログ', desc: 'システムログの確認', icon: FileText, page: 'MasterSystemLogs', color: 'bg-slate-50 border-slate-200 text-slate-700' },
];

export default function MasterDashboard() {
  return (
    <MasterLayout title="システム管理">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-1">Master管理画面</h2>
            <p className="text-violet-200 text-sm">ユーザー管理・AI設定・ナレッジ登録・使用制限の管理ができます</p>
          </div>

          {/* 機能カード */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">管理メニュー</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cards.map((card) => (
                <Link
                  key={card.name}
                  to={createPageUrl(card.page)}
                  className={`border rounded-xl p-4 hover:shadow-md transition-all group ${card.color}`}
                >
                  <card.icon className="w-6 h-6 mb-2" />
                  <p className="font-semibold text-sm">{card.name}</p>
                  <p className="text-xs opacity-70 mt-0.5 leading-tight">{card.desc}</p>
                  <div className="flex justify-end mt-2">
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </MasterLayout>
  );
}