/**
 * saveHtmlToGitHub
 * HTMLファイルをGitHubリポジトリに保存し、raw URLを返す
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GITHUB_TOKEN = Deno.env.get('Github-Personal-Access-Tokens');
const GITHUB_OWNER = Deno.env.get('GITHUB_OWNER');
const GITHUB_REPO = Deno.env.get('GITHUB_REPO');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, lpId, htmlContent } = await req.json();

    if (!userId || !lpId || !htmlContent) {
      return Response.json({ error: 'userId, lpId, htmlContent are required' }, { status: 400 });
    }

    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      return Response.json({ error: 'GitHub environment variables are not configured' }, { status: 500 });
    }

    const filePath = `lps/${userId}/${lpId}.html`;
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    // 既存ファイルのSHAを取得（上書き更新のため）
    let sha = null;
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // Base64エンコード
    const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));

    const body = {
      message: `Save LP HTML: ${lpId}`,
      content: base64Content,
      ...(sha ? { sha } : {}),
    };

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      return Response.json({ error: errData.message || 'GitHub API error' }, { status: putRes.status });
    }

    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${filePath}`;

    return Response.json({
      success: true,
      html_file_url: rawUrl,
      github_file_path: filePath,
    });
  } catch (error) {
    console.error('saveHtmlToGitHub error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});