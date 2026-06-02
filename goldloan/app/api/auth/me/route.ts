import { NextResponse } from 'next/server';
import { getAuthShopId } from '@/lib/auth';
import { getRedis, keys } from '@/lib/redis';
import { Shop } from '@/types';

export async function GET() {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const redis = getRedis();
  const shopData = await redis.get<string>(keys.shop(shopId));
  if (!shopData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const shop: Shop = typeof shopData === 'string' ? JSON.parse(shopData) : shopData;
  return NextResponse.json({
    id: shop.id, name: shop.name, email: shop.email,
    ownerName: shop.ownerName, phone: shop.phone, address: shop.address,
    interestRate: shop.interestRate, whatsappEnabled: shop.whatsappEnabled,
    whatsappPhoneId: shop.whatsappPhoneId,
  });
}

export async function PUT(req: Request) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const redis = getRedis();
  const shopData = await redis.get<string>(keys.shop(shopId));
  if (!shopData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const shop: Shop = typeof shopData === 'string' ? JSON.parse(shopData) : shopData;
  const updated = {
    ...shop,
    name: body.name ?? shop.name,
    ownerName: body.ownerName ?? shop.ownerName,
    phone: body.phone ?? shop.phone,
    address: body.address ?? shop.address,
    interestRate: body.interestRate ?? shop.interestRate,
    whatsappEnabled: body.whatsappEnabled ?? shop.whatsappEnabled,
    whatsappToken: body.whatsappToken || shop.whatsappToken,
    whatsappPhoneId: body.whatsappPhoneId ?? shop.whatsappPhoneId,
  };

  await redis.set(keys.shop(shopId), JSON.stringify(updated));
  return NextResponse.json({ success: true });
}
