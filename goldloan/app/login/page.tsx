'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      <div className="modal" style={{ maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🪙</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1A1A2E', marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ color: '#5A5A7A', fontSize: 14 }}>Sign in to your shop account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 6 }}>Email Address</label>
            <input className="input-gold" type="email" placeholder="shop@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 6 }}>Password</label>
            <input className="input-gold" type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>

          {error && <div style={{ background: '#FDEEEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button className="btn-gold" type="submit" disabled={loading} style={{ width: '100%', fontSize: 15, padding: '12px' }}>
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#5A5A7A' }}>
          New shop?{' '}
          <Link href="/register" style={{ color: '#C9922A', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
        </p>
      </div>
    </main>
  );
}
