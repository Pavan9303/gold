import { NextRequest, NextResponse } from 'next/server';
import { getRedis, keys } from '@/lib/redis';
import { getAuthShopId } from '@/lib/auth';
import { Customer, Loan } from '@/types';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const redis = getRedis();
  const data = await redis.get<string>(keys.customer(id));
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const customer: Customer = typeof data === 'string' ? JSON.parse(data) : data;
  if (customer.shopId !== shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const loanIds = await redis.smembers(keys.shopLoans(shopId));
  const loans: Loan[] = [];
  for (const lid of loanIds) {
    const ldata = await redis.get<string>(keys.loan(lid));
    if (ldata) {
      const loan: Loan = typeof ldata === 'string' ? JSON.parse(ldata) : ldata;
      if (loan.customerId === id) loans.push(loan);
    }
  }

  return NextResponse.json({ customer, loans });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const redis = getRedis();
  const data = await redis.get<string>(keys.customer(id));
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const customer: Customer = typeof data === 'string' ? JSON.parse(data) : data;
  if (customer.shopId !== shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const updated = { ...customer, ...body, id, shopId };
  await redis.set(keys.customer(id), JSON.stringify(updated));
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const redis = getRedis();
  const data = await redis.get<string>(keys.customer(id));
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const customer: Customer = typeof data === 'string' ? JSON.parse(data) : data;
  if (customer.shopId !== shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  await redis.del(keys.customer(id));
  await redis.srem(keys.shopCustomers(shopId), id);
  return NextResponse.json({ success: true });
}
