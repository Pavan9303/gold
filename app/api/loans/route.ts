import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getRedis, keys } from '@/lib/redis';
import { getAuthShopId } from '@/lib/auth';
import { Loan, Customer, Shop } from '@/types';
import { calculateInterest } from '@/lib/interest';

export async function GET(req: NextRequest) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const redis = getRedis();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');

  const loanIds = await redis.smembers(keys.shopLoans(shopId));
  const loans = [];

  for (const lid of loanIds) {
    const data = await redis.get<string>(keys.loan(lid));
    if (data) {
      const loan: Loan = typeof data === 'string' ? JSON.parse(data) : data;
      if (status && loan.status !== status) continue;
      if (customerId && loan.customerId !== customerId) continue;
      loans.push({ ...loan, calculatedInterest: calculateInterest(loan) });
    }
  }

  loans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { customerId, items, principalAmount, interestRate, startDate, dueDate, notes } = body;

  if (!customerId || !items || !principalAmount || !startDate || !dueDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const redis = getRedis();
  const custData = await redis.get<string>(keys.customer(customerId));
  if (!custData) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  const customer: Customer = typeof custData === 'string' ? JSON.parse(custData) : custData;
  if (customer.shopId !== shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const shopData = await redis.get<string>(keys.shop(shopId));
  const shop: Shop = shopData ? (typeof shopData === 'string' ? JSON.parse(shopData) : shopData) : null as unknown as Shop;
  const finalRate = interestRate || shop?.interestRate || 2;

  const loan: Loan = {
    id: uuidv4(), shopId, customerId,
    customerName: customer.name, customerPhone: customer.phone,
    items, principalAmount: Number(principalAmount),
    interestRate: Number(finalRate), startDate, dueDate,
    status: 'active', totalPaid: 0, payments: [],
    createdAt: new Date().toISOString(), notes,
  };

  await redis.set(keys.loan(loan.id), JSON.stringify(loan));
  await redis.sadd(keys.shopLoans(shopId), loan.id);
  await redis.sadd(keys.allLoans(), loan.id);

  return NextResponse.json(loan);
}
