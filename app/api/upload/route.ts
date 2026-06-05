import { NextRequest, NextResponse } from 'next/server';
import { getAuthShopId } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { data?: string; folder?: string };
  if (!body.data) return NextResponse.json({ error: 'No image data provided' }, { status: 400 });

  try {
    const url = await uploadImage(body.data, body.folder || 'goldloan');
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
