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

  // サイズバリデーション
  const MAX_HTML = 10 * 1024 * 1024; // 10MB
  const MAX_CSS = 2 * 1024 * 1024;   // 2MB
  const MAX_JS = 1 * 1024 * 1024;    // 1MB

  if (html_code.length > MAX_HTML) {
    return Response.json({
      error: `HTMLコードが大きすぎます (${(html_code.length / 1024 / 1024).toFixed(2)}MB > 10MB)`,
      code: 'SIZE_LIMIT_EXCEEDED'
    }, { status: 413 });
  }

  if (css_code && css_code.length > MAX_CSS) {
    return Response.json({
      error: `CSSコードが大きすぎます (${(css_code.length / 1024 / 1024).toFixed(2)}MB > 2MB)`,
      code: 'SIZE_LIMIT_EXCEEDED'
    }, { status: 413 });
  }

  if (typeof sanitized_html === 'string' && sanitized_html.length > MAX_HTML) {
    return Response.json({
      error: `サニタイズ済みHTMLが大きすぎます (${(sanitized_html.length / 1024 / 1024).toFixed(2)}MB > 10MB)`,
      code: 'SIZE_LIMIT_EXCEEDED'
    }, { status: 413 });
  }

  // preview_token を生成
  const preview_token = crypto.getRandomValues(new Uint8Array(16))
    .reduce((a, b) => a + b.toString(16), '');

  try {
    // Ensure sanitized_html is provided and is a string
    if (typeof sanitized_html !== 'string') {
      console.warn('sanitized_html is not a string, using html_code as fallback');
    }

    let savedLp;
    const lpData = {
      title,
      slug,
      description,
      status: status || 'draft',
      source_type: 'pasted_code',
      template_type: template_type || 'custom',
      html_code,
      css_code,
      sanitized_html: typeof sanitized_html === 'string' ? sanitized_html : html_code,
      extracted_image_urls: Array.isArray(extracted_image_urls) ? extracted_image_urls : [],
      preview_token,
      user_id: user.id
    };

    if (lp_id) {
      // 既存LP更新
      savedLp = await base44.entities.LandingPage.update(lp_id, lpData);
    } else {
      // 新規LP作成
      savedLp = await base44.entities.LandingPage.create(lpData);
    }

    return Response.json({
      success: true,
      lp: savedLp,
      preview_url: `/lp/${savedLp.slug}?preview=true&token=${preview_token}`
    });
  } catch (error) {
    console.error('saveLandingPageFromCode error:', error);
    return Response.json({
      error: error.message || 'Failed to save landing page',
      details: error.toString()
    }, { status: 500 });
  }
});