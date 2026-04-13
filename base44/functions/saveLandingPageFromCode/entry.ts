/**
 * saveLandingPageFromCode
 * コード貼り付けからLPを保存
 * 既存LPの更新にも対応
 * HTMLが大きすぎる場合はGitHubにフォールバック保存
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

  const MAX_HTML = 10 * 1024 * 1024; // 10MB
  const MAX_CSS = 2 * 1024 * 1024;   // 2MB

  if (css_code && css_code.length > MAX_CSS) {
    return Response.json({
      error: `CSSコードが大きすぎます (${(css_code.length / 1024 / 1024).toFixed(2)}MB > 2MB)`,
      code: 'SIZE_LIMIT_EXCEEDED'
    }, { status: 413 });
  }

  const htmlTooLarge = html_code.length > MAX_HTML;
  const sanitizedTooLarge = typeof sanitized_html === 'string' && sanitized_html.length > MAX_HTML;

  // preview_token を生成
  const preview_token = crypto.getRandomValues(new Uint8Array(16))
    .reduce((a, b) => a + b.toString(16), '');

  try {
    // GitHubフォールバック処理
    let html_file_url = null;
    let github_file_path = null;

    if (htmlTooLarge || sanitizedTooLarge) {
      console.log(`HTML too large, falling back to GitHub`);
      const targetLpId = lp_id || `new-${Date.now()}`;
      const githubRes = await base44.asServiceRole.functions.invoke('saveHtmlToGitHub', {
        userId: user.id,
        lpId: targetLpId,
        htmlContent: sanitizedTooLarge ? sanitized_html : html_code,
      });
      if (githubRes && githubRes.html_file_url) {
        html_file_url = githubRes.html_file_url;
        github_file_path = githubRes.github_file_path;
      } else {
        return Response.json({ error: 'HTMLが大きすぎます。GitHubへの保存にも失敗しました。' }, { status: 413 });
      }
    }

    const lpData = {
      title,
      slug,
      description,
      status: status || 'draft',
      source_type: 'pasted_code',
      template_type: template_type || 'custom',
      html_code: htmlTooLarge ? '' : html_code,
      css_code,
      sanitized_html: sanitizedTooLarge ? '' : (typeof sanitized_html === 'string' ? sanitized_html : html_code),
      extracted_image_urls: Array.isArray(extracted_image_urls) ? extracted_image_urls : [],
      preview_token,
      user_id: user.id,
      ...(html_file_url ? { html_file_url, github_file_path } : {}),
    };

    let savedLp;
    if (lp_id) {
      savedLp = await base44.entities.LandingPage.update(lp_id, lpData);
    } else {
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