import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    // Upstash Redis via REST API (works in serverless/Vercel)
    // Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    // OR just KV_REST_API_URL and KV_REST_API_TOKEN (Vercel KV)
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
    });
  }
  return redis;
}

// Key helpers
export const keys = {
  shop: (id: string) => `shop:${id}`,
  shopByEmail: (email: string) => `shop:email:${email}`,
  shopCustomers: (shopId: string) => `shop:${shopId}:customers`,
  shopLoans: (shopId: string) => `shop:${shopId}:loans`,
  customer: (id: string) => `customer:${id}`,
  loan: (id: string) => `loan:${id}`,
  reminderLog: (id: string) => `reminder:${id}`,
  allLoans: () => 'all:loans',
};
