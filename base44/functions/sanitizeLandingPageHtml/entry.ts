/**
 * sanitizeLandingPageHtml
 * HTMLをサニタイズし、危険なタグ・属性を除去
 * script タグ、onclick、javascript: スキーム等を削除
 */

Deno.serve(async (req) => {
  const { html_code, css_code } = await req.json();

  if (!html_code) {
    return Response.json({ error: 'html_code is required' }, { status: 400 });
  }

  // サニタイズ処理
  let sanitized = html_code;

  // 1. script タグを完全に除去
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. 危険なイベントハンドラを除去 (onClick, onLoad, onError など)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');

  // 3. javascript: スキームを除去
  sanitized = sanitized.replace(/javascript:\s*/gi, '');

  // 4. href や src に javascript: がないか確認
  sanitized = sanitized.replace(/([href|src])=['"]javascript:[^'"]*['"]/gi, '$1=""');

  // 5. iframe は初期は除去（必要に応じて許可リスト化可）
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // 6. style タグ内のjavascript:も除去
  sanitized = sanitized.replace(/style\s*=\s*["']([^"']*)javascript:[^"']*["']/gi, 'style="$1"');

  // 画像URL抽出
  const imgRegex = /src=["']([^"']+)["']/gi;
  const extracted_image_urls = [];
  let match;
  while ((match = imgRegex.exec(html_code)) !== null) {
    if (match[1] && !extracted_image_urls.includes(match[1])) {
      extracted_image_urls.push(match[1]);
    }
  }

  return Response.json({
    sanitized_html: sanitized,
    extracted_image_urls
  });
});