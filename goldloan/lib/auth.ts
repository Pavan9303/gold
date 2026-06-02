import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'goldloan-secret-dev-key-change-in-prod';

export function signToken(payload: { shopId: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { shopId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { shopId: string; email: string };
  } catch {
    return null;
  }
}

export async function getAuthShopId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    return decoded?.shopId || null;
  } catch {
    return null;
  }
}
