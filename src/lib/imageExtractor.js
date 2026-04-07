/**
 * HTML から画像URL を抽出する
 * - img src を対象
 * - 重複は除外
 * - data: / javascript: は除外
 * - 空文字は除外
 */
export const extractImageUrlsFromHtml = (html = '') => {
  try {
    const text = String(html || '').trim();
    if (!text) return [];

    // img src を抽出（シングル・ダブルクォート対応）
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const matches = Array.from(text.matchAll(imgRegex));
    
    const urls = matches
      .map(m => m[1])
      .filter(Boolean) // 空文字除外
      .filter(url => url.trim() !== '') // 空白のみ除外
      .filter(url => !url.toLowerCase().startsWith('data:')) // data: 除外
      .filter(url => !/^javascript:/i.test(url)); // javascript: 除外

    // 重複除外
    return Array.from(new Set(urls));
  } catch (error) {
    console.error('Error extracting image URLs:', error);
    return [];
  }
};

/**
 * 2つの URL 配列の差分を取得
 * - existingに含まれないURLをnewUrlsとして返す
 */
export const getDiffUrls = (allUrls = [], existingUrls = []) => {
  const existingSet = new Set(existingUrls);
  return allUrls.filter(url => !existingSet.has(url));
};