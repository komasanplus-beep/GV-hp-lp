import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authUser = await base44.auth.me();

    if (!authUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id } = await req.json().catch(() => ({}));

    let user = authUser;
    if (user_id) {
      const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
      if (users?.[0]) user = users[0];
    }

    // ユーザー情報の拡張フィールドから取得を試みる
    // 今後、専用テーブル（AccountProfile）を作成する際はそこから取得
    const profile = {
      id: user.id,
      account_name: user.account_name || user.full_name || '',
      user_name: user.user_name || '',
      contact_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      company_name: user.company_name || '',
      address: user.address || '',
      notes: user.notes || '',
    };

    return Response.json(profile);
  } catch (error) {
    console.error('getAccountProfile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});