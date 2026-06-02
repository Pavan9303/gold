'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', ownerName: '', email: '', password: '', phone: '', address: '', interestRate: '2' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, interestRate: Number(form.interestRate) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="modal" style={{ maxWidth: 500, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1A1A2E', marginBottom: 6 }}>Register Your Shop</h1>
          <p style={{ color: '#5A5A7A', fontSize: 14 }}>Create your gold shop account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Shop Name *</label>
              <input className="input-gold" placeholder="Sri Lakshmi Gold" value={form.name} onChange={f('name')} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Owner Name *</label>
              <input className="input-gold" placeholder="Ravi Kumar" value={form.ownerName} onChange={f('ownerName')} required />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Email Address *</label>
            <input className="input-gold" type="email" placeholder="shop@example.com" value={form.email} onChange={f('email')} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Phone *</label>
              <input className="input-gold" placeholder="9876543210" value={form.phone} onChange={f('phone')} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Default Interest Rate (% / month)</label>
              <input className="input-gold" type="number" step="0.1" min="0.1" max="10" placeholder="2" value={form.interestRate} onChange={f('interestRate')} required />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Shop Address</label>
            <input className="input-gold" placeholder="123, Main Street, City" value={form.address} onChange={f('address')} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Password *</label>
            <input className="input-gold" type="password" placeholder="••••••••" value={form.password} onChange={f('password')} required minLength={6} />
          </div>

          {error && <div style={{ background: '#FDEEEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button className="btn-gold" type="submit" disabled={loading} style={{ width: '100%', fontSize: 15, padding: '12px' }}>
            {loading ? 'Creating Account...' : 'Create Shop Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#5A5A7A' }}>
          Already registered?{' '}
          <Link href="/login" style={{ color: '#C9922A', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}
