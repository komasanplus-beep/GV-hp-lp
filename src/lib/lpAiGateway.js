import { base44 } from '@/api/base44Client';

function getErrorMessage(error) {
  const responseMessage = error?.response?.data?.error || error?.data?.error;
  if (responseMessage) return responseMessage;
  const message = String(error?.message || '');
  if (/routing restriction|InvokeLLM|app-runtime/i.test(message)) return 'AI生成の接続経路でエラーが発生しました。管理者へお問い合わせください。';
  if (/401|unauthor|login|token/i.test(message)) return 'ログイン情報を確認できませんでした。再ログインしてお試しください。';
  if (/403|forbidden|権限/i.test(message)) return 'このAI機能を利用する権限がありません。';
  if (/429|limit|quota|上限/i.test(message)) return 'AI生成の利用上限に達しています。契約プランまたは利用状況をご確認ください。';
  return message && !/[A-Za-z]{12,}/.test(message) ? message : 'AI生成中にエラーが発生しました。時間をおいて再度お試しください。';
}

export async function invokeLPAI(payload) {
  try {
    const response = await base44.functions.invoke('lpAiGateway', payload);
    const body = response?.data ?? response;
    if (!body?.success) throw new Error(body?.error || 'AI生成に失敗しました。');
    return body.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

