import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// CNAMEまたはAレコードの検証先ホスト（自社サービスのホスト）
const TARGET_CNAME = 'sites.base44.app';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain_mapping_id } = await req.json();

    if (!domain_mapping_id) {
      return Response.json({ error: 'domain_mapping_id is required' }, { status: 400 });
    }

    // DomainMapping レコード取得
    const mappings = await base44.asServiceRole.entities.DomainMapping.filter({ id: domain_mapping_id });
    const mapping = mappings[0];

    if (!mapping) {
      return Response.json({ error: 'DomainMapping not found' }, { status: 404 });
    }

    const domain = mapping.domain;

    if (!domain) {
      return Response.json({ error: 'No domain configured for this mapping' }, { status: 400 });
    }

    // Cloudflare DNS over HTTPS API を使ってCNAMEレコードを検証
    let verified = false;
    let resolvedValue = null;
    let errorDetail = null;

    try {
      const dnsRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`,
        { headers: { Accept: 'application/dns-json' } }
      );
      const dnsData = await dnsRes.json();

      if (dnsData.Answer && dnsData.Answer.length > 0) {
        const cname = dnsData.Answer.find(r => r.type === 5); // type 5 = CNAME
        if (cname) {
          resolvedValue = cname.data.replace(/\.$/, ''); // 末尾のドットを除去
          verified = resolvedValue === TARGET_CNAME;
        }
      }

      // CNAMEがなければAレコードも確認（オプション）
      if (!verified && (!dnsData.Answer || dnsData.Answer.length === 0)) {
        errorDetail = 'No DNS records found';
      }
    } catch (dnsErr) {
      errorDetail = `DNS lookup failed: ${dnsErr.message}`;
    }

    // verification_status を更新
    const newStatus = verified ? 'verified' : 'failed';
    await base44.asServiceRole.entities.DomainMapping.update(domain_mapping_id, {
      verification_status: newStatus,
    });

    return Response.json({
      domain,
      verified,
      verification_status: newStatus,
      resolved_cname: resolvedValue,
      target_cname: TARGET_CNAME,
      error: errorDetail,
    });
  } catch (error) {
    console.error('[verifyCustomDomain]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});