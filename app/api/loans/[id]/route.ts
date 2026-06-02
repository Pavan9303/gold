import { NextRequest, NextResponse } from 'next/server';
import { getRedis, keys } from '@/lib/redis';
import { getAuthShopId } from '@/lib/auth';
import { Loan } from '@/types';
import { calculateInterest } from '@/lib/interest';
import { v4 as uuidv4 } from 'uuid';

function parseLoan(data: string | unknown): Loan {
  return typeof data === 'string' ? JSON.parse(data) : data as Loan;
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const redis = getRedis();
  const data = await redis.get<string>(keys.loan(id));
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const loan = parseLoan(data);
  if (loan.shopId !== shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  return NextResponse.json({ ...loan, calculatedInterest: calculateInterest(loan) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const redis = getRedis();
  const data = await redis.get<string>(keys.loan(id));
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const loan = parseLoan(data);
  if (loan.shopId !== shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const updated = { ...loan, ...body, id, shopId };
  await redis.set(keys.loan(id), JSON.stringify(updated));
  return NextResponse.json({ ...updated, calculatedInterest: calculateInterest(updated) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const redis = getRedis();
  const data = await redis.get<string>(keys.loan(id));
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const loan = parseLoan(data);
  if (loan.shopId !== shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const { amount, note, type } = body;

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });

  const payment = {
    id: uuidv4(), amount: Number(amount),
    date: new Date().toISOString(), note, type: type || 'both',
  };

  const newTotalPaid = loan.totalPaid + payment.amount;
  const interest = calculateInterest({ ...loan, totalPaid: newTotalPaid });
  const newStatus: Loan['status'] = newTotalPaid >= interest.totalDue ? 'closed' : loan.status;

  const updatedLoan: Loan = {
    ...loan, payments: [...loan.payments, payment],
    totalPaid: newTotalPaid, status: newStatus,
  };

  await redis.set(keys.loan(id), JSON.stringify(updatedLoan));
  return NextResponse.json({ ...updatedLoan, calculatedInterest: calculateInterest(updatedLoan), payment });
}
