'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Loan {
  id: string; customerName: string; customerPhone: string;
  principalAmount: number; status: string; dueDate: string;
  items?: { description: string; weightGrams: number; purity: string; }[];
  calculatedInterest: { outstandingBalance: number; interestAccrued: number; monthlyInterestAmount: number; };
}

export default function DashboardPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/loans').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]).then(([l, c]) => {
      setLoans(Array.isArray(l) ? l : []);
      setCustomers(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  const activeLoans = loans.filter(l => l.status === 'active');
  const overdueLoans = loans.filter(l => l.status === 'overdue' || (l.status === 'active' && new Date(l.dueDate) < new Date()));
  const totalOutstanding = activeLoans.reduce((s, l) => s + (l.calculatedInterest?.outstandingBalance || 0), 0);
  const totalPrincipal = activeLoans.reduce((s, l) => s + l.principalAmount, 0);

  // Gold summary — active loans (including overdue) still hold the physical gold
  const goldHeldLoans = loans.filter(l => l.status === 'active');
  const goldHeldGrams = goldHeldLoans.reduce((s, l) => s + (l.items?.reduce((gs, it) => gs + (it.weightGrams || 0), 0) ?? 0), 0);

  const PURITY_ORDER = ['24K', '22K', '18K', '14K', 'Silver'];
  const byPurity: Record<string, number> = {};
  goldHeldLoans.forEach(l => l.items?.forEach(it => {
    if (it.purity) byPurity[it.purity] = (byPurity[it.purity] || 0) + (it.weightGrams || 0);
  }));
  const purityBreakdown = Object.entries(byPurity).sort(([a], [b]) => {
    const ai = PURITY_ORDER.indexOf(a), bi = PURITY_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  if (loading) return <div style={{ padding: 40, color: '#5A5A7A' }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, color: '#1A1A2E', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: '#5A5A7A', fontSize: 14 }}>{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Outstanding', value: fmt(totalOutstanding), icon: '💰', color: '#C9922A', bg: '#FDF6E3' },
          { label: 'Principal Lent', value: fmt(totalPrincipal), icon: '🏦', color: '#2E7D52', bg: '#E8F5EE' },
          { label: 'Active Loans', value: activeLoans.length.toString(), icon: '📋', color: '#1A6BAA', bg: '#E8F0FD' },
          { label: 'Total Customers', value: customers.length.toString(), icon: '👥', color: '#7B3FA5', bg: '#F3E8FD' },
          { label: 'Overdue Loans', value: overdueLoans.length.toString(), icon: '⚠️', color: '#C0392B', bg: '#FDEEEC' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#5A5A7A', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
              </div>
              <div style={{ background: s.bg, borderRadius: 10, padding: '10px 12px', fontSize: 22 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gold in Vault */}
      <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, #FDFAF4 0%, #FDF6E3 100%)', border: '1px solid #E8C87A' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>🪙</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Gold in Vault</h2>
              <span style={{ fontSize: 11, color: '#5A5A7A', background: '#F0E8D0', padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>Active loans</span>
            </div>
            {goldHeldGrams === 0 ? (
              <p style={{ color: '#5A5A7A', fontSize: 14, margin: 0 }}>No gold currently held — all loans are closed.</p>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                {purityBreakdown.map(([purity, grams]) => (
                  <div key={purity} style={{ padding: '8px 16px', background: 'white', border: '1.5px solid #E8C87A', borderRadius: 8, minWidth: 80, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#5A5A7A', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{purity}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#C9922A', fontFamily: 'Playfair Display, serif' }}>{grams.toFixed(1)}<span style={{ fontSize: 12, fontWeight: 600, marginLeft: 2 }}>g</span></div>
                  </div>
                ))}
                {purityBreakdown.length === 0 && goldHeldGrams > 0 && (
                  <div style={{ fontSize: 14, color: '#5A5A7A' }}>Items have no purity data yet.</div>
                )}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#5A5A7A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Total Held</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#C9922A', fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>
              {goldHeldGrams.toFixed(1)}
              <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4 }}>g</span>
            </div>
            <div style={{ fontSize: 12, color: '#5A5A7A', marginTop: 4 }}>{goldHeldLoans.length} active loan{goldHeldLoans.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Overdue alerts */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>⚠️ Overdue Loans</h2>
            <Link href="/dashboard/reminders" style={{ fontSize: 13, color: '#C9922A', textDecoration: 'none', fontWeight: 600 }}>View All →</Link>
          </div>
          {overdueLoans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#5A5A7A', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              No overdue loans!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overdueLoans.slice(0, 5).map(l => (
                <Link key={l.id} href={`/dashboard/loans/${l.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#FDFAF4', border: '1px solid #F0E8D0', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A2E' }}>{l.customerName}</div>
                      <div style={{ fontSize: 12, color: '#C0392B' }}>Due: {format(new Date(l.dueDate), 'dd MMM')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#C0392B', fontSize: 14 }}>{fmt(l.calculatedInterest?.outstandingBalance || 0)}</div>
                      <div style={{ fontSize: 11, color: '#5A5A7A' }}>outstanding</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Loans */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>📋 Recent Loans</h2>
            <Link href="/dashboard/loans" style={{ fontSize: 13, color: '#C9922A', textDecoration: 'none', fontWeight: 600 }}>View All →</Link>
          </div>
          {loans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#5A5A7A', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              No loans yet. <Link href="/dashboard/loans" style={{ color: '#C9922A', textDecoration: 'none' }}>Add one</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loans.slice(0, 5).map(l => (
                <Link key={l.id} href={`/dashboard/loans/${l.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#FDFAF4', border: '1px solid #F0E8D0', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A2E' }}>{l.customerName}</div>
                      <div style={{ fontSize: 12, color: '#5A5A7A' }}>Principal: {fmt(l.principalAmount)}</div>
                    </div>
                    <span className={`badge-${l.status === 'active' && new Date(l.dueDate) < new Date() ? 'overdue' : l.status}`} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                      {l.status === 'active' && new Date(l.dueDate) < new Date() ? 'Overdue' : l.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard/customers?add=1" className="btn-gold" style={{ textDecoration: 'none', fontSize: 14 }}>+ New Customer</Link>
          <Link href="/dashboard/loans?add=1" className="btn-gold" style={{ textDecoration: 'none', fontSize: 14, background: 'linear-gradient(135deg, #2E7D52, #3aaa70)' }}>+ New Loan</Link>
          <Link href="/dashboard/reminders" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 14 }}>Send Reminders</Link>
        </div>
      </div>
    </div>
  );
}
