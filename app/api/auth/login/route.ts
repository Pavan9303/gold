import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getRedis, keys } from '@/lib/redis';
import { signToken } from '@/lib/auth';
import { Shop } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const redis = getRedis();
    const shopId = await redis.get<string>(keys.shopByEmail(email));
    if (!shopId) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const shopData = await redis.get<string>(keys.shop(shopId));
    if (!shopData) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const shop: Shop = typeof shopData === 'string' ? JSON.parse(shopData) : shopData;
    const valid = await bcrypt.compare(password, shop.password);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = signToken({ shopId: shop.id, email: shop.email });
    const res = NextResponse.json({
      success: true,
      shop: { id: shop.id, name: shop.name, email: shop.email, ownerName: shop.ownerName, interestRate: shop.interestRate }
    });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
