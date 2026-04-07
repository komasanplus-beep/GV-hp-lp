/**
 * sanitizeLandingPageHtml
 * HTMLをサニタイズし、危険なタグ・属性を除去
 * script タグ、onclick、javascript: スキーム等を削除
 */

Deno.serve(async (req) => {
  try {
    const { html_code, css_code } = await req.json();

    if (!html_code) {
      return Response.json({ error: 'html_code is required' }, { status: 400 });
    }

    // サニタイズ処理
    let sanitized = html_code;

    // 1. script タグを完全に除去
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 2. style タグを完全に除去（inline style は許可）
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 3. iframe を除去
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // 4. すべての on[a-z]+ 属性を除去（onclick, onload, onerror など）
    // パターン1: onclick="..." / onclick='...'
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*["']([^"']*)['"]/gi, '');
    // パターン2: onclick=no_quotes_value
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '');

    // 5. javascript: スキームを除去
    sanitized = sanitized.replace(/javascript:\s*/gi, '');

    // 6. href や src に javascript: がないか確認
    sanitized = sanitized.replace(/([href|src])=['"]javascript:[^'"]*['"]/gi, '$1=""');

    // 7. data: スキーム（XSS対策）
    sanitized = sanitized.replace(/([href|src])=['"]data:[^'"]*['"]/gi, '$1=""');

    // 画像URL抽出（サニタイズ前のHTMLから）
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
      extracted_image_urls,
      success: true
    });
  } catch (error) {
    console.error('sanitizeLandingPageHtml error:', error);
    return Response.json({
      error: error.message,
      sanitized_html: '',
      extracted_image_urls: []
    }, { status: 500 });
  }
});