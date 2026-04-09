import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { site_id, content_source_type } = await req.json();
    if (!site_id || !content_source_type) {
      return Response.json({ error: 'site_id and content_source_type required' }, { status: 400 });
    }

    let candidates = [];

    if (content_source_type === 'service') {
      const services = await base44.asServiceRole.entities.Service.filter(
        { site_id },
        'sort_order'
      );
      candidates = services.map(s => ({
        id: s.id,
        title: s.name || s.title || '',
        subtitle: s.category || s.duration || '',
        description: s.description || '',
        image_url: s.image_url || '',
        price: s.price ? `¥${Number(s.price).toLocaleString()}` : '',
      }));

    } else if (content_source_type === 'article') {
      const articles = await base44.asServiceRole.entities.Post.filter(
        { site_id, status: 'published' },
        '-published_at'
      );
      candidates = articles.map(a => ({
        id: a.id,
        title: a.title || '',
        subtitle: a.published_at ? new Date(a.published_at).toLocaleDateString('ja-JP') : '',
        description: a.excerpt || '',
        image_url: a.featured_image_url || '',
        price: '',
      }));

    } else if (content_source_type === 'shared_content') {
      // SharedContent entity があれば取得、なければ空
      try {
        const shared = await base44.asServiceRole.entities.SharedContent.filter(
          { site_id, status: 'published' },
          'sort_order'
        );
        candidates = shared.map(s => ({
          id: s.id,
          title: s.title || '',
          subtitle: s.subtitle || '',
          description: s.description || '',
          image_url: s.image_url || '',
          price: '',
        }));
      } catch {
        candidates = [];
      }
    }

    return Response.json({ candidates });
  } catch (error) {
    console.error('getBlockContentCandidates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});