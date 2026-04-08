/**
 * backup.js - バックアップ作成・復元ロジック
 */
import { base44 } from '@/api/base44Client';

const AUTO_MAX = 10;
const MANUAL_MAX = 30;

/**
 * 現在のサイトデータをスナップショット化してBackupエンティティに保存
 */
export async function createBackup(siteId, { name = '', description = '', type = 'auto' } = {}) {
  // 全データ並列取得
  const [site, pages, blocks, services, posts] = await Promise.all([
    base44.entities.Site.filter({ id: siteId }).then(r => r[0] || null),
    base44.entities.SitePage.filter({ site_id: siteId }),
    base44.entities.SiteBlock.filter({ site_id: siteId }),
    base44.entities.Service.filter({ site_id: siteId }),
    base44.entities.Post.filter({ site_id: siteId }),
  ]);

  const snapshot = {
    site,
    pages,
    blocks,
    services,
    posts,
    settings: {
      navigation: site?.navigation_config || {},
      footer: site?.footer_config || {},
      seo: site?.seo_config || {},
    },
  };

  const backup = await base44.entities.Backup.create({
    site_id: siteId,
    name: name || (type === 'auto' ? '自動保存' : name),
    description,
    snapshot_json: JSON.stringify(snapshot),
    type,
    is_pinned: false,
  });

  // 上限管理（ピン留め以外）
  await pruneBackups(siteId, type);

  return backup;
}

/**
 * 上限を超えた古いバックアップを削除（ピン除く）
 */
async function pruneBackups(siteId, type) {
  const max = type === 'auto' ? AUTO_MAX : MANUAL_MAX;
  const all = await base44.entities.Backup.filter({ site_id: siteId, type }, '-created_date');
  const unpinned = all.filter(b => !b.is_pinned);
  if (unpinned.length > max) {
    const toDelete = unpinned.slice(max);
    await Promise.all(toDelete.map(b => base44.entities.Backup.delete(b.id)));
  }
}

/**
 * バックアップから復元する
 * 復元前に現在状態を自動バックアップ
 */
export async function restoreBackup(backupId, siteId, onProgress) {
  // Step1: 復元前の自動バックアップ
  onProgress?.('復元前のバックアップを作成中...');
  await createBackup(siteId, { name: '復元前の自動保存', type: 'auto' });

  // Step2: スナップショット取得
  onProgress?.('スナップショットを取得中...');
  const backups = await base44.entities.Backup.filter({ id: backupId });
  const backup = backups[0];
  if (!backup) throw new Error('バックアップが見つかりません');
  const snapshot = JSON.parse(backup.snapshot_json);

  // Step3: 現在のデータを削除
  onProgress?.('現在のデータを削除中...');
  const [existingPages, existingBlocks, existingServices, existingPosts] = await Promise.all([
    base44.entities.SitePage.filter({ site_id: siteId }),
    base44.entities.SiteBlock.filter({ site_id: siteId }),
    base44.entities.Service.filter({ site_id: siteId }),
    base44.entities.Post.filter({ site_id: siteId }),
  ]);

  await Promise.all([
    ...existingPages.map(p => base44.entities.SitePage.delete(p.id)),
    ...existingBlocks.map(b => base44.entities.SiteBlock.delete(b.id)),
    ...existingServices.map(s => base44.entities.Service.delete(s.id)),
    ...existingPosts.map(p => base44.entities.Post.delete(p.id)),
  ]);

  // Step4: スナップショットから再作成
  onProgress?.('データを復元中...');

  // Site設定を復元（navigation_config / footer_config / seo_config）
  if (snapshot.site) {
    await base44.entities.Site.update(siteId, {
      navigation_config: snapshot.settings?.navigation || snapshot.site.navigation_config,
      footer_config: snapshot.settings?.footer || snapshot.site.footer_config,
      seo_config: snapshot.settings?.seo || snapshot.site.seo_config,
    });
  }

  // ページIDマッピング（旧ID → 新ID）のため順番に作成
  const pageIdMap = {};
  for (const page of (snapshot.pages || [])) {
    const { id: oldId, created_date, updated_date, created_by, ...pageData } = page;
    const newPage = await base44.entities.SitePage.create({ ...pageData, site_id: siteId });
    pageIdMap[oldId] = newPage.id;
  }

  // ブロック（page_idを新IDに変換）
  for (const block of (snapshot.blocks || [])) {
    const { id, created_date, updated_date, created_by, ...blockData } = block;
    const newPageId = pageIdMap[blockData.page_id] || blockData.page_id;
    await base44.entities.SiteBlock.create({ ...blockData, site_id: siteId, page_id: newPageId });
  }

  // サービス
  for (const service of (snapshot.services || [])) {
    const { id, created_date, updated_date, created_by, ...serviceData } = service;
    await base44.entities.Service.create({ ...serviceData, site_id: siteId });
  }

  // 記事
  for (const post of (snapshot.posts || [])) {
    const { id, created_date, updated_date, created_by, ...postData } = post;
    await base44.entities.Post.create({ ...postData, site_id: siteId });
  }

  onProgress?.('復元完了！');
}