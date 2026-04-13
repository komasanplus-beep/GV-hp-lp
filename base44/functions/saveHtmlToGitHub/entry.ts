import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, lpId, htmlContent } = await req.json();
    if (!userId || !lpId || !htmlContent) {
      return Response.json({ error: 'userId, lpId, htmlContent are required' }, { status: 400 });
    }

    const token = Deno.env.get('Github-Personal-Access-Tokens');
    const owner = Deno.env.get('GITHUB_OWNER');
    const repo = Deno.env.get('GITHUB_REPO');
    const path = `lps/${userId}/${lpId}.html`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // 既存ファイルのSHA取得
    let sha = undefined;
    try {
      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch (e) {}

    // Base64エンコード（Deno用）
    const encoded = btoa(unescape(encodeURIComponent(htmlContent)));

    const body = {
      message: `LP: ${lpId}`,
      content: encoded,
      ...(sha ? { sha } : {})
    };

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(`GitHub API error: ${err}`);
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
    return Response.json({ file_url: rawUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});