/**
 * saveLandingPageFromCode
 * コード貼り付けからLPを保存
 * 既存LPの更新にも対応
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    lp_id,
    title,
    slug,
    description,
    status,
    template_type,
    html_code,
    css_code,
    sanitized_html,
    extracted_image_urls
  } = await req.json();

  if (!title || !slug || !html_code) {
    return Response.json({ error: 'title, slug, html_code are required' }, { status: 400 });
  }

  // preview_token を生成
  const preview_token = crypto.getRandomValues(new Uint8Array(16))
    .reduce((a, b) => a + b.toString(16), '');

  try {
    let savedLp;

    if (lp_id) {
      // 既存LP更新
      savedLp = await base44.entities.LandingPage.update(lp_id, {
        title,
        slug,
        description,
        status: status || 'draft',
        source_type: 'pasted_code',
        template_type: template_type || 'custom',
        html_code,
        css_code,
        sanitized_html,
        extracted_image_urls: extracted_image_urls || [],
        preview_token,
        user_id: user.id
      });
    } else {
      // 新規LP作成
      savedLp = await base44.entities.LandingPage.create({
        title,
        slug,
        description,
        status: status || 'draft',
        source_type: 'pasted_code',
        template_type: template_type || 'custom',
        html_code,
        css_code,
        sanitized_html,
        extracted_image_urls: extracted_image_urls || [],
        preview_token,
        user_id: user.id
      });
    }

    return Response.json({
      success: true,
      lp: savedLp,
      preview_url: `/lp/${savedLp.slug}?preview=true&token=${preview_token}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});