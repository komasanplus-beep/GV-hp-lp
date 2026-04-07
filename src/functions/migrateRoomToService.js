// deno-lint-ignore no-undef
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// deno-lint-ignore no-undef
/**
 * migrateRoomToService
 * 
 * 既存 Room データを Service に移行
 * - Room → Service へ変換
 * - price_per_night → price
 * - amenities, size, bed_type は Service に保持
 * 
 * 実行例:
 * POST /api/functions/migrateRoomToService
 * { "site_id": "site123" }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { site_id } = body;

    if (!site_id) {
      return Response.json(
        { error: 'site_id is required' },
        { status: 400 }
      );
    }

    // Site 情報取得（business_type確認用）
    const sites = await base44.entities.Site.filter({ id: site_id });
    if (sites.length === 0) {
      return Response.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }
    const site = sites[0];

    // Room データ取得（全件）
    let rooms = [];
    try {
      rooms = await base44.asServiceRole.entities.Room.list('-created_date', 1000);
    } catch (e) {
      // Room entity が存在しない場合はスキップ
      console.warn('Room entity not found or error:', e.message);
      rooms = [];
    }

    let migrated = 0;
    let errors = [];

    // Room → Service 変換
    for (const room of rooms) {
      try {
        const service = {
          site_id: site_id,
          name: room.name,
          description: room.description || '',
          price: room.price_per_night || 0,
          duration: '1泊',
          capacity: room.capacity || 1,
          image_url: room.images?.[0] || '',
          images: room.images || [],
          category: 'room',
          status: room.status || 'available',
          sort_order: 0,
          amenities: room.amenities || [],
          size: room.size,
          bed_type: room.bed_type
        };

        await base44.asServiceRole.entities.Service.create(service);
        migrated++;
      } catch (e) {
        errors.push({
          room_id: room.id,
          room_name: room.name,
          error: e.message
        });
      }
    }

    return Response.json({
      status: 'migrated',
      site_id: site_id,
      business_type: site.business_type,
      rooms_migrated: migrated,
      total_rooms: rooms.length,
      errors: errors,
      message: `${migrated}/${rooms.length} rooms successfully migrated to Service`
    });
  } catch (error) {
    console.error('migrateRoomToService error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});