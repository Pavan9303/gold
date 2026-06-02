'use client';
import { useEffect, useState } from 'react';

interface Shop { name: string; ownerName: string; phone: string; address: string; interestRate: number; whatsappEnabled: boolean; whatsappToken: string; whatsappPhoneId: string; }

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop>({ name: '', ownerName: '', phone: '', address: '', interestRate: 2, whatsappEnabled: false, whatsappToken: '', whatsappPhoneId: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setShop({
        name: d.name || '', ownerName: d.ownerName || '', phone: d.phone || '',
        address: d.address || '', interestRate: d.interestRate || 2,
        whatsappEnabled: d.whatsappEnabled || false,
        whatsappToken: '', whatsappPhoneId: d.whatsappPhoneId || '',
      });
      setLoading(false);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload: Partial<Shop> = { ...shop };
    if (!payload.whatsappToken) delete payload.whatsappToken;
    await fetch('/api/auth/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const f = (k: keyof Shop) => (e: React.ChangeEvent<HTMLInputElement>) => setShop(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  if (loading) return <div style={{ padding: 40, color: '#5A5A7A' }}>Loading...</div>;

  return (
    <div style={{ padding: 32, maxWidth: 680 }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1A1A2E', marginBottom: 8 }}>Settings</h1>
      <p style={{ color: '#5A5A7A', fontSize: 14, marginBottom: 32 }}>Manage your shop profile and integrations</p>

      <form onSubmit={save}>
        {/* Shop Info */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', marginBottom: 20 }}>🏪 Shop Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Shop Name</label>
              <input className="input-gold" value={shop.name} onChange={f('name')} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Owner Name</label>
              <input className="input-gold" value={shop.ownerName} onChange={f('ownerName')} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Phone Number</label>
              <input className="input-gold" value={shop.phone} onChange={f('phone')} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Default Interest Rate (% / month)</label>
              <input className="input-gold" type="number" step="0.1" min="0.1" max="10" value={shop.interestRate} onChange={f('interestRate')} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Shop Address</label>
              <input className="input-gold" value={shop.address} onChange={f('address')} placeholder="Full shop address..." />
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>📱 WhatsApp Business API</h2>
              <p style={{ fontSize: 13, color: '#5A5A7A', margin: 0 }}>Send automatic payment reminders via WhatsApp</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <span style={{ fontSize: 13, color: '#5A5A7A' }}>Enable</span>
              <div style={{ position: 'relative', width: 44, height: 24 }}>
                <input type="checkbox" checked={shop.whatsappEnabled} onChange={f('whatsappEnabled')} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                <div onClick={() => setShop(p => ({ ...p, whatsappEnabled: !p.whatsappEnabled }))} style={{ position: 'absolute', inset: 0, background: shop.whatsappEnabled ? '#C9922A' : '#D0D0D0', borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: 3, left: shop.whatsappEnabled ? 22 : 3, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </label>
          </div>

          {shop.whatsappEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#FDF6E3', border: '1px solid #E8C87A', borderRadius: 8, padding: 12, fontSize: 13, color: '#8B6014' }}>
                <strong>How to set up:</strong>
                <ol style={{ margin: '8px 0 0 16px', padding: 0, lineHeight: 1.7 }}>
                  <li>Go to <strong>Meta for Developers</strong> → Create a WhatsApp Business app</li>
                  <li>Get your <strong>Access Token</strong> from the app dashboard</li>
                  <li>Get your <strong>Phone Number ID</strong> from WhatsApp → API Setup</li>
                  <li>Add your customer phone numbers to approved contacts</li>
                </ol>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Access Token (leave blank to keep existing)</label>
                <input className="input-gold" type="password" placeholder="EAAxxxxxxx..." value={shop.whatsappToken} onChange={f('whatsappToken')} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Phone Number ID</label>
                <input className="input-gold" placeholder="1234567890" value={shop.whatsappPhoneId} onChange={f('whatsappPhoneId')} />
              </div>
            </div>
          )}
        </div>

        {/* Auto Reminders Info */}
        <div className="card" style={{ padding: 28, marginBottom: 24, background: '#F5F0FF', borderColor: '#C8A8F0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', marginBottom: 12 }}>⏰ Automatic Reminders</h2>
          <p style={{ fontSize: 13, color: '#5A5A7A', lineHeight: 1.7, margin: 0 }}>
            Automatic daily reminders are sent via the <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>/api/cron/reminders</code> endpoint.
            <br /><br />
            To enable automatic daily reminders on Vercel:
          </p>
          <ol style={{ margin: '10px 0 0 16px', padding: 0, fontSize: 13, color: '#5A5A7A', lineHeight: 1.8 }}>
            <li>Add <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>CRON_SECRET</code> to your Vercel environment variables</li>
            <li>The <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>vercel.json</code> cron is pre-configured to run at 9 AM daily</li>
            <li>Reminders are sent to loans due within 3 days and overdue loans</li>
            <li>Each loan gets max 1 reminder per day</li>
          </ol>
        </div>

        {saved && <div style={{ background: '#E8F5EE', color: '#2E7D52', padding: '10px 16px', borderRadius: 8, marginBottom: 14, fontWeight: 600 }}>✅ Settings saved successfully!</div>}

        <button className="btn-gold" type="submit" disabled={saving} style={{ padding: '12px 32px', fontSize: 15 }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
