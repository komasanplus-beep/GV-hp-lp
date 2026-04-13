import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { slug } = await req.json();

    if (!slug) {
      return Response.json({ error: 'slug is required' }, { status: 400 });
    }

    const results = await base44.asServiceRole.entities.LandingPage.filter({ slug });
    const lp = results[0];

    if (!lp) {
      return new Response('<html><body><h1>404 Not Found</h1></body></html>', {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (lp.status !== 'published') {
      return new Response('<html><body><h1>このページは準備中です</h1></body></html>', {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const token = Deno.env.get('Github-Personal-Access-Tokens');
    const owner = Deno.env.get('GITHUB_OWNER');
    const repo = Deno.env.get('GITHUB_REPO');
    const filePath = lp.github_file_path;

    if (!filePath) {
      // html_codeフォールバック
      const html = lp.sanitized_html || lp.html_code || '<html><body><p>コンテンツがありません</p></body></html>';
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const ghRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      throw new Error(`GitHub API error: ${errText}`);
    }

    const data = await ghRes.json();
    // Base64デコード（マルチバイト対応）
    const binaryStr = atob(data.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const htmlContent = new TextDecoder('utf-8').decode(bytes);

    return new Response(htmlContent, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});