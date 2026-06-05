import { NextRequest, NextResponse } from 'next/server';
import { getRedis, keys } from '@/lib/redis';
import { Loan, Shop } from '@/types';
import { calculateLoanInterest, isOverdue, isPaymentDueSoon } from '@/lib/interest';
import { sendWhatsAppMessage, buildReminderMessage } from '@/lib/whatsapp';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

function parse<T>(data: unknown): T {
  return (typeof data === 'string' ? JSON.parse(data) : data) as T;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'cron-secret-dev';
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redis = getRedis();
  const allLoanIds = await redis.smembers(keys.allLoans());
  const processed: string[] = [];
  const errors: string[] = [];

  for (const loanId of allLoanIds) {
    const data = await redis.get(keys.loan(loanId));
    if (!data) continue;
    const loan = parse<Loan>(data);
    if (loan.status !== 'active') continue;

    const shouldRemind = isOverdue(loan) || isPaymentDueSoon(loan, 3);
    if (!shouldRemind) continue;

    const todayKey = `reminder:sent:${loanId}:${new Date().toISOString().slice(0, 10)}`;
    const alreadySent = await redis.get(todayKey);
    if (alreadySent) continue;

    const shopData = await redis.get(keys.shop(loan.shopId));
    if (!shopData) continue;
    const shop = parse<Shop>(shopData);
    if (!shop.whatsappEnabled || !shop.whatsappToken || !shop.whatsappPhoneId) continue;

    const calc = calculateLoanInterest(loan);
    const message = buildReminderMessage({
      customerName: loan.customerName, shopName: shop.name,
      outstandingBalance: calc.outstandingBalance,
      dueDate: format(new Date(loan.dueDate), 'dd MMM yyyy'),
      monthlyInterest: calc.monthlyInterestAmount, loanId: loan.id,
    });

    try {
      await sendWhatsAppMessage({ phone: loan.customerPhone, message, shopToken: shop.whatsappToken!, phoneNumberId: shop.whatsappPhoneId! });
      await redis.set(todayKey, '1');
      await redis.expire(todayKey, 86400);
      processed.push(loanId);

      const logId = uuidv4();
      await redis.set(keys.reminderLog(logId), JSON.stringify({ id: logId, shopId: loan.shopId, loanId, customerId: loan.customerId, type: 'whatsapp', message, sentAt: new Date().toISOString(), status: 'sent' }));
      await redis.expire(keys.reminderLog(logId), 60 * 60 * 24 * 30);
    } catch (e) {
      errors.push(`${loanId}: ${e instanceof Error ? e.message : 'error'}`);
    }
  }

  return NextResponse.json({ processed: processed.length, errors: errors.length, details: errors });
}
