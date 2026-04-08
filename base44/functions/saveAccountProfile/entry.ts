import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile } = await req.json();

    if (!profile?.account_name || !profile?.email) {
      return Response.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // ユーザー情報を更新
    // 注：base44.auth.updateMe() ではロールなど保護されたフィールドは変更できない
    const updateData = {
      account_name: profile.account_name,
      user_name: profile.user_name,
      full_name: profile.contact_name,
      phone: profile.phone,
      company_name: profile.company_name,
      address: profile.address,
      notes: profile.notes,
    };

    // ユーザー更新
    const updated = await base44.auth.updateMe(updateData);

    return Response.json({
      success: true,
      profile: {
        id: updated.id,
        account_name: updated.account_name || updated.full_name || '',
        user_name: updated.user_name || '',
        contact_name: updated.full_name || '',
        email: updated.email || '',
        phone: updated.phone || '',
        company_name: updated.company_name || '',
        address: updated.address || '',
        notes: updated.notes || '',
      },
    });
  } catch (error) {
    console.error('saveAccountProfile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});