import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getRedis, keys } from '@/lib/redis';
import { getAuthShopId } from '@/lib/auth';
import { Customer } from '@/types';

export async function GET() {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const redis = getRedis();
  const customerIds = await redis.smembers(keys.shopCustomers(shopId));
  const customers: Customer[] = [];

  for (const cid of customerIds) {
    const data = await redis.get<string>(keys.customer(cid));
    if (data) customers.push(typeof data === 'string' ? JSON.parse(data) : data);
  }

  customers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, phone, email, address, aadharNumber, profileImage } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: 'Name and phone required' }, { status: 400 });
  }

  const redis = getRedis();
  const customer: Customer = {
    id: uuidv4(), shopId, name, phone, email, address, aadharNumber,
    ...(profileImage ? { profileImage } : {}),
    createdAt: new Date().toISOString(),
  };

  await redis.set(keys.customer(customer.id), JSON.stringify(customer));
  await redis.sadd(keys.shopCustomers(shopId), customer.id);

  return NextResponse.json(customer);
}
