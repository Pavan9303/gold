import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getRedis, keys } from '@/lib/redis';
import { signToken } from '@/lib/auth';
import { Shop } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ownerName, email, password, phone, address, interestRate } = body;

    if (!name || !email || !password || !phone || !ownerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const redis = getRedis();
    const existing = await redis.get(keys.shopByEmail(email));
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPw = await bcrypt.hash(password, 10);
    const shopId = uuidv4();

    const shop: Shop = {
      id: shopId, name, ownerName, email,
      password: hashedPw, phone, address,
      whatsappEnabled: false,
      interestRate: interestRate || 2,
      createdAt: new Date().toISOString(),
    };

    await redis.set(keys.shop(shopId), JSON.stringify(shop));
    await redis.set(keys.shopByEmail(email), shopId);

    const token = signToken({ shopId, email });
    const res = NextResponse.json({
      success: true,
      shop: { id: shop.id, name: shop.name, email: shop.email, ownerName: shop.ownerName }
    });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error('Register error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
