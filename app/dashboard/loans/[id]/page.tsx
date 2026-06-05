'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface CalcInterest { principalAmount: number; interestAccrued: number; totalDue: number; totalPaid: number; outstandingBalance: number; monthsElapsed: number; interestDue: number; monthlyInterestAmount: number; }
interface Payment { id: string; amount: number; date: string; note?: string; type: string; }
const PRESET_LABELS: Record<string, string> = { '1d':'1 Day','3d':'3 Days','7d':'7 Days','1m':'1 Month','3m':'3 Months','6m':'6 Months','12m':'12 Months','custom':'Custom' };
interface Loan { id: string; customerId: string; customerName: string; customerPhone: string; principalAmount: number; interestRate: number; startDate: string; dueDate: string; durationPreset?: string; isCompoundInterest?: boolean; status: string; totalPaid: number; payments: Payment[]; items: {description:string;weightGrams:number;purity:string;purityPercentage?:number;estimatedValue:number;itemImage?:string;}[]; notes?: string; calculatedInterest: CalcInterest; }

export default function LoanDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payType, setPayType] = useState('both');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    fetch(`/api/loans/${id}`).then(r => {
      if (!r.ok) { router.push('/dashboard/loans'); return null; }
      return r.json();
    }).then(d => { if (d) { setLoan(d); setLoading(false); } });
  }, [id, router]);

  async function addPayment(e: React.FormEvent) {
    e.preventDefault(); setPaying(true); setPayError('');
    const res = await fetch(`/api/loans/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(payAmount), note: payNote, type: payType }) });
    const data = await res.json();
    if (!res.ok) { setPayError(data.error); setPaying(false); return; }
    setLoan(data);
    setShowPayment(false);
    setPayAmount(''); setPayNote('');
    setPaying(false);
  }

  if (loading) return <div style={{ padding: 40, color: '#5A5A7A' }}>Loading...</div>;
  if (!loan) return null;

  const ci = loan.calculatedInterest;
  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const isOD = loan.status === 'active' && new Date(loan.dueDate) < new Date();
  const displayStatus = isOD ? 'overdue' : loan.status;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/loans" style={{ color: '#5A5A7A', fontSize: 13, textDecoration: 'none' }}>← Back to Loans</Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#1A1A2E' }}>Loan #{loan.id.slice(-6).toUpperCase()}</h1>
            <span className={`badge-${displayStatus}`} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>{displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}</span>
          </div>
          <Link href={`/dashboard/customers/${loan.customerId}`} style={{ color: '#C9922A', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{loan.customerName}</Link>
          <span style={{ color: '#5A5A7A', marginLeft: 8, fontSize: 14 }}>{loan.customerPhone}</span>
        </div>
        {loan.status === 'active' && (
          <button className="btn-gold" onClick={() => setShowPayment(true)}>+ Record Payment</button>
        )}
      </div>

      {/* Interest Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Principal Amount', value: fmt(ci.principalAmount), color: '#1A6BAA', bg: '#E8F0FD', icon: '🏦' },
          { label: 'Interest Accrued', value: fmt(ci.interestAccrued), color: '#C9922A', bg: '#FDF6E3', icon: '📈' },
          { label: 'Total Due', value: fmt(ci.totalDue), color: '#7B3FA5', bg: '#F3E8FD', icon: '💰' },
          { label: 'Total Paid', value: fmt(ci.totalPaid), color: '#2E7D52', bg: '#E8F5EE', icon: '✅' },
          { label: 'Outstanding', value: fmt(ci.outstandingBalance), color: isOD ? '#C0392B' : '#1A1A2E', bg: isOD ? '#FDEEEC' : '#F5F5F5', icon: isOD ? '⚠️' : '⏳' },
          { label: 'Monthly Interest', value: fmt(ci.monthlyInterestAmount), color: '#D4841A', bg: '#FFF3E0', icon: '📅' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 16, background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 11, color: '#5A5A7A', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Loan Details */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#1A1A2E' }}>📋 Loan Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Start Date', value: format(new Date(loan.startDate), 'dd MMMM yyyy') },
              { label: 'Due Date', value: format(new Date(loan.dueDate), 'dd MMMM yyyy') },
              ...(loan.durationPreset ? [{ label: 'Duration', value: PRESET_LABELS[loan.durationPreset] ?? loan.durationPreset }] : []),
              { label: 'Interest Rate', value: `${loan.interestRate}% per month` },
              { label: 'Months Elapsed', value: `${ci.monthsElapsed} months` },
              ...(loan.notes ? [{ label: 'Notes', value: loan.notes }] : []),
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0E8D0' }}>
                <span style={{ fontSize: 13, color: '#5A5A7A' }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gold Items */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#1A1A2E' }}>🪙 Gold Items Held</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loan.items?.map((item, i) => (
              <div key={i} style={{ padding: 12, background: '#FDF6E3', borderRadius: 8, border: '1px solid #E8C87A', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {item.itemImage && (
                  <a href={item.itemImage} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                    <img src={item.itemImage} alt={item.description} style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', border: '1.5px solid #E8C87A', display: 'block' }} />
                  </a>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>{item.description}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#5A5A7A', flexWrap: 'wrap' }}>
                    <span>⚖️ {item.weightGrams}g</span>
                    <span>✨ {item.purity}{item.purityPercentage != null ? ` (${item.purityPercentage}%)` : ''}</span>
                    {item.estimatedValue > 0 && <span>💰 Est. {fmt(item.estimatedValue)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interest Calculation Breakdown */}
      {loan.isCompoundInterest !== undefined && (
        <div className="card" style={{ padding: 20, marginBottom: 20, background: loan.isCompoundInterest ? '#FDFAF4' : '#F8F8FC', border: `1px solid ${loan.isCompoundInterest ? '#E8C87A' : '#E0E0EE'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 15 }}>{loan.isCompoundInterest ? '📈' : '📊'}</span>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>
              {loan.isCompoundInterest ? 'Compound Interest (Monthly)' : 'Simple Interest'}
            </h2>
            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600, background: loan.isCompoundInterest ? '#FDF6E3' : '#EDEDF8', color: loan.isCompoundInterest ? '#C9922A' : '#5A5A7A', marginLeft: 'auto' }}>
              {loan.isCompoundInterest ? 'Compound' : 'Simple'}
            </span>
          </div>
          {loan.isCompoundInterest ? (
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#3A3A5A', lineHeight: 2 }}>
              <div>Total = P × (1 + r)<sup>n</sup></div>
              <div style={{ color: '#5A5A7A' }}>
                {'= ₹'}
                {loan.principalAmount.toLocaleString('en-IN')}
                {' × (1 + '}
                {(loan.interestRate / 100).toFixed(4)}
                {')'}
                <sup>{ci.monthsElapsed}</sup>
              </div>
              <div style={{ fontWeight: 700, color: '#C9922A' }}>
                = ₹{ci.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} total
                &nbsp;(₹{ci.interestAccrued.toLocaleString('en-IN', { maximumFractionDigits: 2 })} interest)
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#3A3A5A', lineHeight: 2 }}>
              <div>Interest = P × r × n</div>
              <div style={{ color: '#5A5A7A' }}>
                {'= ₹'}
                {loan.principalAmount.toLocaleString('en-IN')}
                {' × '}
                {loan.interestRate}
                {'% × '}
                {ci.monthsElapsed}
                {' months'}
              </div>
              <div style={{ fontWeight: 700, color: '#5A5A7A' }}>
                = ₹{ci.interestAccrued.toLocaleString('en-IN', { maximumFractionDigits: 2 })} interest
                &nbsp;(₹{ci.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} total)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#1A1A2E' }}>💳 Payment History ({loan.payments?.length || 0} payments)</h2>
        {!loan.payments?.length ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#5A5A7A', fontSize: 14 }}>No payments recorded yet.</div>
        ) : (
          <table className="table-gold">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {[...loan.payments].reverse().map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: '#5A5A7A', fontSize: 12 }}>{loan.payments.length - i}</td>
                  <td style={{ fontSize: 13 }}>{format(new Date(p.date), 'dd MMM yyyy, h:mm a')}</td>
                  <td style={{ fontWeight: 700, color: '#2E7D52' }}>{fmt(p.amount)}</td>
                  <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#E8F5EE', color: '#2E7D52', fontWeight: 600 }}>{p.type}</span></td>
                  <td style={{ color: '#5A5A7A', fontSize: 13 }}>{p.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" style={{ padding: 32, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20 }}>Record Payment</h2>
              <button onClick={() => setShowPayment(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#5A5A7A' }}>×</button>
            </div>

            <div style={{ background: '#FDF6E3', border: '1px solid #E8C87A', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#5A5A7A' }}>Total Outstanding</span>
                <span style={{ fontWeight: 700, color: '#C9922A', fontSize: 16 }}>{fmt(ci.outstandingBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#5A5A7A' }}>Monthly Interest</span>
                <span style={{ fontWeight: 600, color: '#C9922A' }}>{fmt(ci.monthlyInterestAmount)}</span>
              </div>
            </div>

            <form onSubmit={addPayment}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Payment Amount (₹) *</label>
                <input className="input-gold" type="number" placeholder="e.g. 5000" value={payAmount} onChange={e => setPayAmount(e.target.value)} required min={1} autoFocus />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Payment Type</label>
                <select className="input-gold" value={payType} onChange={e => setPayType(e.target.value)}>
                  <option value="both">Interest + Principal</option>
                  <option value="interest">Interest Only</option>
                  <option value="principal">Principal Only</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Note (optional)</label>
                <input className="input-gold" placeholder="e.g. Cash payment, Partial payment" value={payNote} onChange={e => setPayNote(e.target.value)} />
              </div>

              {payError && <div style={{ background: '#FDEEEC', color: '#C0392B', padding: '10px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{payError}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-gold" type="submit" disabled={paying} style={{ flex: 1 }}>{paying ? 'Recording...' : 'Record Payment'}</button>
                <button className="btn-ghost" type="button" onClick={() => setShowPayment(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
