/**
 * planUsage.js - PlanUsage カウンター操作ヘルパー
 * すべてのusage increment/decrementはここを経由する
 */
import { base44 } from '@/api/base44Client';

const currentMonth = () => new Date().toISOString().slice(0, 7);

/**
 * 指定ユーザーの当月PlanUsageを取得または作成して返す
 */
async function getOrCreateUsage(userId) {
  const month = currentMonth();
  const list = await base44.entities.PlanUsage.filter({ user_id: userId });
  const existing = list.find(u => u.month_year === month);
  if (existing) return existing;
  return base44.entities.PlanUsage.create({
    user_id: userId,
    month_year: month,
    lp_count: 0,
    ai_used: 0,
    site_count: 0,
    storage_used: 0,
  });
}

/**
 * usage.{field} を +1 する
 * field: 'lp_count' | 'ai_used' | 'site_count'
 */
export async function incrementUsage(field) {
  const user = await base44.auth.me();
  if (!user) return;
  const usage = await getOrCreateUsage(user.id);
  const current = usage[field] || 0;
  await base44.entities.PlanUsage.update(usage.id, { [field]: current + 1 });
}