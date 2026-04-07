/**
 * replaceImageUrlsInHtml
 * HTMLコード内の画像URLを置換
 * original_url → file_url への対応付けを実施
 */

Deno.serve(async (req) => {
  const { html_code, replacements } = await req.json();

  if (!html_code) {
    return Response.json({ error: 'html_code is required' }, { status: 400 });
  }

  // replacements: [{ original_url, file_url }, ...]
  let result = html_code;

  if (replacements && Array.isArray(replacements)) {
    replacements.forEach(({ original_url, file_url }) => {
      if (original_url && file_url) {
        // src=original_url を src=file_url に置換
        const regex = new RegExp(
          `(src=["'])${original_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`,
          'g'
        );
        result = result.replace(regex, `$1${file_url}$2`);
      }
    });
  }

  return Response.json({ replaced_html: result });
});