/**
 * getSiteViewData - 公開サイト表示専用のデータ取得関数
 *
 * 公開条件:
 *  - site.status === 'published' → 誰でも閲覧可
 *  - site.status === 'draft' + preview=true → サイト所有者またはadminのみ閲覧可
 *
 * payload: { site_id: string, preview?: boolean }
 * returns: { site, homePage, blocks, seo }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { site_id, preview } = await req.json();

  if (!site_id) {
    return Response.json({ error: 'site_id is required' }, { status: 400 });
  }

  // サービスロールでSite取得
  const sites = await base44.asServiceRole.entities.Site.filter({ id: site_id });
  const site = sites[0] || null;

  if (!site) {
    return Response.json({ error: 'Site not found' }, { status: 404 });
  }

  // 公開判定
  if (site.status !== 'published') {
    if (!preview) {
      // 非公開かつpreviewなし → 準備中メッセージ用データだけ返す
      return Response.json({ site: { site_name: site.site_name, status: site.status }, homePage: null, blocks: [], seo: null });
    }

    // preview=true の場合は認証・権限チェック
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      // 未ログイン
    }

    if (!user) {
      return Response.json({ error: 'Unauthorized: Login required for preview' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin' || user.role === 'master';
    const isOwner = site.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return Response.json({ error: 'Forbidden: Not site owner or admin' }, { status: 403 });
    }
  }

  // ホームページ取得
  const pages = await base44.asServiceRole.entities.SitePage.filter({ site_id }, 'sort_order');
  const homePage = pages.find(p => p.page_type === 'home') || pages[0] || null;

  if (!homePage) {
    return Response.json({ site, homePage: null, blocks: [], seo: null });
  }

  // ブロック取得（page_id + site_id 両方で絞る）
  const allBlocks = await base44.asServiceRole.entities.SiteBlock.filter({ site_id, page_id: homePage.id }, 'sort_order');
  const blocks = allBlocks.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // SEOデータ取得
  const seoArr = await base44.asServiceRole.entities.LPSeoData.filter({ lp_id: site_id });
  const seo = seoArr[0] || null;

  return Response.json({ site, homePage, blocks, seo });
});