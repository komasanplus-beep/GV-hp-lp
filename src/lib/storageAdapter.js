/**
 * StorageAdapter
 * 画像アップロードの抽象層
 * 現在はBase44 Core UploadFileを使用。将来的にR2/S3/Supabaseへ差し替え可能。
 *
 * 全アップロードはこのモジュール経由で行うこと。
 * DBにはfile_urlとfile_keyのみ保存する（画像本体は保存しない）。
 */

import { base44 } from '@/api/base44Client';

/**
 * ファイルバリデーション
 */
export function validateImageFile(file, options = {}) {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options;

  if (!file) throw new Error('ファイルが選択されていません');

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`対応形式: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`ファイルサイズは${maxSizeMB}MB以下にしてください（現在: ${(file.size / 1024 / 1024).toFixed(1)}MB）`);
  }

  return true;
}

/**
 * 画像をストレージにアップロード
 * @param {File} file - アップロードするファイル
 * @param {string} pathHint - パスのヒント (例: "sites/hero", "services")
 * @returns {Promise<{file_url: string, file_key: string, content_type: string, file_size: number}>}
 */
export async function uploadImageToStorage(file, pathHint = 'uploads') {
  validateImageFile(file);

  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  // file_key はURL末尾のパス部分を使用（将来的にR2等に移行時も同じインターフェース）
  const url = new URL(file_url);
  const file_key = url.pathname.replace(/^\//, '');

  return {
    file_url,
    file_key,
    content_type: file.type,
    file_size: file.size,
  };
}

/**
 * 公開URLを取得（現在はfile_urlをそのまま返す）
 */
export function getPublicImageUrl(fileKeyOrUrl) {
  return fileKeyOrUrl || '';
}

/**
 * 画像を置き換えアップロード
 * 旧URLは参照のみ保持（物理削除は管理画面から）
 */
export async function replaceImageInStorage(oldKey, newFile, pathHint = 'uploads') {
  // 新しいファイルをアップロード
  const result = await uploadImageToStorage(newFile, pathHint);
  // 旧ファイルの削除はサーバー側で管理（現在はBase44が管理）
  return result;
}

/**
 * 複数画像を順番にアップロード
 */
export async function uploadMultipleImages(files, pathHint = 'uploads') {
  const results = [];
  for (const file of files) {
    const result = await uploadImageToStorage(file, pathHint);
    results.push(result);
  }
  return results;
}