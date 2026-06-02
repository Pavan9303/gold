import { NextResponse } from 'next/server';
import { getRedis, keys } from '@/lib/redis';
import { getAuthShopId } from '@/lib/auth';
import { Loan, Shop } from '@/types';
import { calculateInterest, isOverdue, isPaymentDueSoon } from '@/lib/interest';
import { sendWhatsAppMessage, buildReminderMessage } from '@/lib/whatsapp';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

function parse<T>(data: string | unknown): T {
  return (typeof data === 'string' ? JSON.parse(data) : data) as T;
}

export async function GET() {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const redis = getRedis();
  const loanIds = await redis.smembers(keys.shopLoans(shopId));
  const overdue = [];
  const dueSoon = [];

  for (const lid of loanIds) {
    const data = await redis.get<string>(keys.loan(lid));
    if (data) {
      const loan = parse<Loan>(data);
      if (loan.status !== 'active') continue;
      const calc = calculateInterest(loan);
      if (isOverdue(loan)) overdue.push({ ...loan, calculatedInterest: calc });
      else if (isPaymentDueSoon(loan, 7)) dueSoon.push({ ...loan, calculatedInterest: calc });
    }
  }

  return NextResponse.json({ overdue, dueSoon });
}

export async function POST(req: Request) {
  const shopId = await getAuthShopId();
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const redis = getRedis();
  const shopData = await redis.get<string>(keys.shop(shopId));
  if (!shopData) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
  const shop = parse<Shop>(shopData);

  if (!shop.whatsappEnabled || !shop.whatsappToken || !shop.whatsappPhoneId) {
    return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 400 });
  }

  const { loanIds }: { loanIds: string[] } = await req.json();
  const results = [];

  for (const loanId of loanIds) {
    const data = await redis.get<string>(keys.loan(loanId));
    if (!data) continue;
    const loan = parse<Loan>(data);
    if (loan.shopId !== shopId) continue;

    const calc = calculateInterest(loan);
    const message = buildReminderMessage({
      customerName: loan.customerName, shopName: shop.name,
      outstandingBalance: calc.outstandingBalance,
      dueDate: format(new Date(loan.dueDate), 'dd MMM yyyy'),
      monthlyInterest: calc.monthlyInterestAmount, loanId: loan.id,
    });

    let status: 'sent' | 'failed' = 'sent';
    let error = '';
    try {
      await sendWhatsAppMessage({ phone: loan.customerPhone, message, shopToken: shop.whatsappToken!, phoneNumberId: shop.whatsappPhoneId! });
    } catch (e: unknown) {
      status = 'failed';
      error = e instanceof Error ? e.message : 'Unknown error';
    }

    const logId = uuidv4();
    await redis.set(keys.reminderLog(logId), JSON.stringify({ id: logId, shopId, loanId, customerId: loan.customerId, type: 'whatsapp', message, sentAt: new Date().toISOString(), status, error }));
    await redis.expire(keys.reminderLog(logId), 60 * 60 * 24 * 30);
    results.push({ loanId, status, error });
  }

  return NextResponse.json({ results });
}
