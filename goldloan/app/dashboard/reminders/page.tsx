'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

interface LoanReminder { id: string; customerName: string; customerPhone: string; dueDate: string; status: string; calculatedInterest: { outstandingBalance: number; monthlyInterestAmount: number; }; }

export default function RemindersPage() {
  const [overdue, setOverdue] = useState<LoanReminder[]>([]);
  const [dueSoon, setDueSoon] = useState<LoanReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ loanId: string; status: string }[]>([]);
  const [shopWA, setShopWA] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/reminders').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([r, s]) => {
      setOverdue(Array.isArray(r.overdue) ? r.overdue : []);
      setDueSoon(Array.isArray(r.dueSoon) ? r.dueSoon : []);
      setShopWA(s.whatsappEnabled);
      setLoading(false);
    });
  }, []);

  function toggle(id: string) {
    setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function selectAll(loans: LoanReminder[]) {
    setSelected(new Set(loans.map(l => l.id)));
  }

  async function sendReminders() {
    if (!selected.size) return;
    setSending(true);
    const res = await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loanIds: [...selected] }) });
    const data = await res.json();
    setResults(data.results || []);
    setSending(false);
    setSelected(new Set());
  }

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  function LoanCard({ loan, section }: { loan: LoanReminder; section: 'overdue' | 'due' }) {
    const checked = selected.has(loan.id);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: `1.5px solid ${section === 'overdue' ? '#F0B8B2' : '#FFD180'}`, borderRadius: 10, background: section === 'overdue' ? '#FDEEEC' : '#FFF8E8', marginBottom: 8, cursor: 'pointer' }} onClick={() => toggle(loan.id)}>
        <input type="checkbox" checked={checked} onChange={() => toggle(loan.id)} style={{ width: 16, height: 16, accentColor: '#C9922A', cursor: 'pointer', flexShrink: 0 }} onClick={e => e.stopPropagation()} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Link href={`/dashboard/loans/${loan.id}`} style={{ fontWeight: 700, color: '#1A1A2E', textDecoration: 'none', fontSize: 15 }} onClick={e => e.stopPropagation()}>{loan.customerName}</Link>
              <div style={{ fontSize: 12, color: '#5A5A7A', marginTop: 2 }}>{loan.customerPhone}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: section === 'overdue' ? '#C0392B' : '#D4841A', fontSize: 17 }}>{fmt(loan.calculatedInterest?.outstandingBalance || 0)}</div>
              <div style={{ fontSize: 11, color: '#5A5A7A' }}>Monthly: {fmt(loan.calculatedInterest?.monthlyInterestAmount || 0)}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: section === 'overdue' ? '#C0392B' : '#D4841A', marginTop: 4, fontWeight: 600 }}>
            {section === 'overdue' ? '⚠️ Overdue since' : '📅 Due on'}: {format(new Date(loan.dueDate), 'dd MMM yyyy')}
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, color: '#5A5A7A' }}>Loading...</div>;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1A1A2E', marginBottom: 4 }}>Reminders</h1>
        <p style={{ color: '#5A5A7A', fontSize: 14 }}>{overdue.length + dueSoon.length} loans need attention</p>
      </div>

      {/* WA status */}
      {!shopWA && (
        <div style={{ background: '#FFF3E0', border: '1px solid #FFD180', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#D4841A', marginBottom: 2 }}>📱 WhatsApp not configured</div>
            <div style={{ fontSize: 13, color: '#5A5A7A' }}>Set up WhatsApp Business API to send automated reminders to customers.</div>
          </div>
          <Link href="/dashboard/settings" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap', marginLeft: 16 }}>Configure →</Link>
        </div>
      )}

      {/* Action bar */}
      {selected.size > 0 && (
        <div style={{ background: '#1A1A2E', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'white', fontWeight: 600 }}>{selected.size} loan{selected.size > 1 ? 's' : ''} selected</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setSelected(new Set())} className="btn-ghost" style={{ fontSize: 13, padding: '7px 14px', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>Clear</button>
            {shopWA && <button className="btn-gold" onClick={sendReminders} disabled={sending} style={{ fontSize: 13, padding: '7px 14px' }}>{sending ? 'Sending...' : `📱 Send WhatsApp (${selected.size})`}</button>}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ background: '#E8F5EE', border: '1px solid #A8D5B8', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: '#2E7D52', marginBottom: 8 }}>✅ Reminders sent</div>
          {results.map(r => (
            <div key={r.loanId} style={{ fontSize: 13, color: r.status === 'sent' ? '#2E7D52' : '#C0392B' }}>
              {r.status === 'sent' ? '✓' : '✗'} Loan #{r.loanId.slice(-6).toUpperCase()}: {r.status}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Overdue */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#C0392B' }}>⚠️ Overdue ({overdue.length})</h2>
            {overdue.length > 0 && <button onClick={() => selectAll(overdue)} style={{ background: 'none', border: 'none', color: '#C9922A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Select All</button>}
          </div>
          {overdue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', background: '#E8F5EE', borderRadius: 10, color: '#2E7D52' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600 }}>No overdue loans!</div>
            </div>
          ) : overdue.map(l => <LoanCard key={l.id} loan={l} section="overdue" />)}
        </div>

        {/* Due Soon */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#D4841A' }}>📅 Due Soon ({dueSoon.length})</h2>
            {dueSoon.length > 0 && <button onClick={() => selectAll(dueSoon)} style={{ background: 'none', border: 'none', color: '#C9922A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Select All</button>}
          </div>
          {dueSoon.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', background: '#FFF8E8', borderRadius: 10, color: '#D4841A' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 600 }}>No upcoming dues this week</div>
            </div>
          ) : dueSoon.map(l => <LoanCard key={l.id} loan={l} section="due" />)}
        </div>
      </div>
    </div>
  );
}
