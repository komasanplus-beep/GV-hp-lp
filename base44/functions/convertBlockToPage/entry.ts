/**
 * convertBlockToPage
 * ブロックを新しいページに変換
 * 
 * POST /api/convert-block-to-page
 * body: { block_id: string }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { block_id } = await req.json();
    if (!block_id) {
      return Response.json({ error: 'block_id required' }, { status: 400 });
    }

    // ━━━ 1. ブロック取得 ━━━
    const blocks = await base44.asServiceRole.entities.SiteBlock.filter({ id: block_id });
    if (!blocks || blocks.length === 0) {
      return Response.json({ error: 'Block not found' }, { status: 404 });
    }
    const block = blocks[0];
    const { site_id, page_id, block_type, data } = block;

    // ━━━ 2. 親ページ取得（slug生成用） ━━━
    const parentPages = await base44.asServiceRole.entities.SitePage.filter({ id: page_id });
    if (!parentPages || parentPages.length === 0) {
      return Response.json({ error: 'Parent page not found' }, { status: 404 });
    }
    const parentPage = parentPages[0];

    // ━━━ 3. 新しいslug生成 ━━━
    const slugBase = `${parentPage.slug}-${block_type.toLowerCase()}`;
    const newSlug = slugBase.replace(/[^\w\-]/g, '-').replace(/--+/g, '-').toLowerCase();

    // ━━━ 4. 新しいページ作成 ━━━
    const newPage = await base44.asServiceRole.entities.SitePage.create({
      site_id,
      title: `${block_type}`,
      slug: newSlug,
      page_type: 'custom',
      parent_page_id: page_id,
      status: 'draft',
    });

    // ━━━ 5. ブロックを新ページにコピー ━━━
    await base44.asServiceRole.entities.SiteBlock.create({
      site_id,
      page_id: newPage.id,
      block_type,
      data,
      sort_order: 0,
      user_id: user.id,
    });

    // ━━━ 6. 元ブロックをLinkタイプに変更 ━━━
    await base44.asServiceRole.entities.SiteBlock.update(block_id, {
      block_type: 'Link',
      linked_page_id: newPage.id,
      data: {
        title: `${block_type}`,
        description: '別ページへ',
      },
    });

    return Response.json({
      success: true,
      new_page_id: newPage.id,
      new_page_slug: newSlug,
    });

  } catch (error) {
    console.error('convertBlockToPage error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});