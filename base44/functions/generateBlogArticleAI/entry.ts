/**
 * generateBlogArticleAI
 * ブログ記事をAI生成（ブロック構造で返す）
 * マークダウン→ブロック配列に変換
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      site_id,
      prompt,
      max_chars = 2000,
      tone = 'polite',
      seo_keywords = '',
      region = '',
      use_web_search = false,
      file_urls = [],
    } = body;

    // ===== 1. AI利用可能チェック（aiGuard呼び出し） =====
    const guardRes = await base44.functions.invoke('aiGuard', {
      feature_code: 'ai_blog_generation',
      site_id,
    });

    if (guardRes.status !== 200 || !guardRes.data.allowed) {
      return Response.json({
        blocked: true,
        source: guardRes.data?.source || 'unknown',
        error: guardRes.data?.reason || 'AI生成が利用できません',
        limitData: guardRes.data?.limitData,
      }, { status: 429 });
    }

    // ===== 2. AI生成用プロンプト構築 =====
    const systemPrompt = `あなたはプロのブログライターです。
SEOに最適化され、読みやすく、見出し構造が明確なブログ記事を作成します。

トーン: ${tone === 'polite' ? '丁寧で親切' : tone === 'casual' ? 'カジュアルで親しみやすい' : 'より専門的で詳細'}
地域: ${region ? `${region}を意識した内容` : 'なし'}
SEOキーワード: ${seo_keywords || 'なし'}

出力フォーマット（重要）：
【タイトル】
...

【本文】
## 見出し1
段落...

## 見出し2
### 小見出し
段落...

最大文字数: ${max_chars}字`;

    const userPrompt = `以下のテーマについて、ブログ記事を作成してください：

${prompt}

${file_urls.length > 0 ? `参考資料が添付されています（${file_urls.length}個）。内容を反映してください。` : ''}
${use_web_search ? '最新情報を含めてください。' : ''}

見出しはH2（##）とH3（###）で構造化し、リスト・強調を活用してください。`;

    // ===== 3. AI呼び出し =====
    const aiRes = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      add_context_from_internet: use_web_search,
      file_urls: file_urls.length > 0 ? file_urls : undefined,
    });

    const aiOutput = aiRes;

    // ===== 4. マークダウンをブロック配列に変換 =====
    const blocks = parseMarkdownToBlocks(aiOutput);

    // ===== 5. メタデータ抽出 =====
    const titleMatch = aiOutput.match(/【タイトル】\n(.+?)\n/);
    const title = titleMatch?.[1] || 'タイトル未設定';

    const bodyMatch = aiOutput.match(/【本文】\n([\s\S]*)/);
    const bodyText = bodyMatch?.[1] || '';

    // ===== 6. 抜粋生成 =====
    const excerptText = bodyText
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .slice(0, 2)
      .join(' ')
      .substring(0, 120);

    // ===== 7. AI使用記録 =====
    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      site_id,
      feature_code: 'ai_blog_generation',
      prompt_type: 'blog_article',
      input_summary: prompt.substring(0, 200),
      output_summary: `${blocks.length}ブロック、${aiOutput.length}字`,
      status: 'success',
    });

    return Response.json({
      data: {
        title: title.trim(),
        excerpt: excerptText.trim(),
        blocks,
        raw_output: aiOutput,
      },
      used: guardRes.data?.used || 1,
      limit: guardRes.data?.limit,
    });

  } catch (error) {
    console.error('generateBlogArticleAI error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * マークダウン形式の本文をブロック配列に変換
 */
function parseMarkdownToBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let currentBlock = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'heading',
        level: 2,
        content: line.replace('## ', '').trim(),
        style: { font_size: 'lg', bold: true, line_height: 'normal' },
      };
    } else if (line.startsWith('### ')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'heading',
        level: 3,
        content: line.replace('### ', '').trim(),
        style: { font_size: 'base', bold: true, line_height: 'normal' },
      };
    } else if (line.startsWith('#### ')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'heading',
        level: 4,
        content: line.replace('#### ', '').trim(),
        style: { font_size: 'base', bold: true, line_height: 'normal' },
      };
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      if (currentBlock?.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'list',
          list_type: 'unordered',
          items: [],
        };
      }
      if (currentBlock) {
        currentBlock.items.push(line.replace(/^[-•]\s/, '').trim());
      }
    } else if (line.match(/^\d+\.\s/)) {
      if (currentBlock?.type !== 'list' || currentBlock?.list_type !== 'ordered') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'list',
          list_type: 'ordered',
          items: [],
        };
      }
      if (currentBlock) {
        currentBlock.items.push(line.replace(/^\d+\.\s/, '').trim());
      }
    } else if (line.trim() === '') {
      if (currentBlock?.type === 'paragraph') {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    } else if (line.trim()) {
      if (!currentBlock || currentBlock.type !== 'paragraph') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'paragraph',
          content: line.trim(),
          style: { font_size: 'base', bold: false, line_height: 'normal' },
        };
      } else {
        currentBlock.content += ' ' + line.trim();
      }
    }
  }

  if (currentBlock) blocks.push(currentBlock);

  return blocks;
}