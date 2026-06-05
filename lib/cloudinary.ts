import crypto from 'crypto';

function getCloudinaryConfig() {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw.replace('cloudinary://', 'http://'));
    return { apiKey: u.username, apiSecret: u.password, cloudName: u.hostname };
  } catch {
    return null;
  }
}

export async function uploadImage(base64Data: string, folder: string): Promise<string> {
  const cfg = getCloudinaryConfig();
  if (!cfg) throw new Error('CLOUDINARY_URL not configured');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = { folder, timestamp };
  const sigString = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + cfg.apiSecret;
  const signature = crypto.createHash('sha256').update(sigString).digest('hex');

  const form = new FormData();
  form.append('file', base64Data);
  form.append('api_key', cfg.apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Upload failed: ${msg}`);
  }

  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

export function isCloudinaryConfigured(): boolean {
  return !!getCloudinaryConfig();
}
