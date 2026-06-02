'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Shop { id: string; name: string; ownerName: string; email: string; interestRate: number; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/login'); return null; }
      return r.json();
    }).then(d => { if (d) { setShop(d); setLoading(false); } });
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEFBF3' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🪙</div>
        <div style={{ color: '#C9922A', fontWeight: 600 }}>Loading...</div>
      </div>
    </div>
  );

  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/customers', label: 'Customers', icon: '👥' },
    { href: '/dashboard/loans', label: 'Loans', icon: '📋' },
    { href: '/dashboard/reminders', label: 'Reminders', icon: '⏰' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 40 }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🪙</span>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', color: '#E8B84B', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>GoldLoan</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Manager</div>
            </div>
          </div>
        </div>

        {/* Shop info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shop</div>
          <div style={{ color: 'white', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{shop?.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{shop?.ownerName}</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px', flex: 1 }}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={logout} className="sidebar-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ fontSize: 16 }}>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', background: '#FEFBF3' }}>
        {children}
      </main>
    </div>
  );
}
