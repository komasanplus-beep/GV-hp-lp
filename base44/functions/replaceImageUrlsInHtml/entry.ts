/**
 * replaceImageUrlsInHtml
 * HTMLコード内の画像URLを置換
 * original_url → file_url への対応付けを実施
 */

Deno.serve(async (req) => {
  try {
    const { html_code, replacements } = await req.json();

    if (!html_code || typeof html_code !== 'string') {
      return Response.json({ error: 'html_code is required and must be a string' }, { status: 400 });
    }

    // replacements: [{ original_url, file_url }, ...]
    let result = html_code;

    if (replacements && Array.isArray(replacements)) {
      replacements.forEach(({ original_url, file_url }) => {
        if (original_url && file_url && typeof original_url === 'string' && typeof file_url === 'string') {
          try {
            // src=original_url を src=file_url に置換
            const regex = new RegExp(
              `(src=["'])${original_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`,
              'g'
            );
            result = result.replace(regex, `$1${file_url}$2`);
          } catch (err) {
            console.error(`Error replacing ${original_url}:`, err);
            // エラーが発生しても処理続行（他の置換は実行）
          }
        }
      });
    }

    return Response.json({ replaced_html: result, success: true });
  } catch (error) {
    console.error('replaceImageUrlsInHtml error:', error);
    return Response.json({
      error: error.message,
      replaced_html: ''
    }, { status: 500 });
  }
});