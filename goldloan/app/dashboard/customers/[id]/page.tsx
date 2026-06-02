'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Customer { id: string; name: string; phone: string; email?: string; address?: string; aadharNumber?: string; createdAt: string; }
interface Loan { id: string; principalAmount: number; status: string; dueDate: string; interestRate: number; items: {description:string;weightGrams:number;purity:string;}[]; calculatedInterest: {outstandingBalance:number;interestAccrued:number;}; }

export default function CustomerDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => {
      if (!r.ok) { router.push('/dashboard/customers'); return null; }
      return r.json();
    }).then(d => { if (d) { setCustomer(d.customer); setLoans(d.loans); setLoading(false); } });
  }, [id, router]);

  if (loading) return <div style={{ padding: 40, color: '#5A5A7A' }}>Loading...</div>;
  if (!customer) return null;

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const totalOutstanding = loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.calculatedInterest?.outstandingBalance || 0), 0);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/customers" style={{ color: '#5A5A7A', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>← Back to Customers</Link>
      </div>

      {/* Customer Header */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #C9922A, #E8B84B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white', fontWeight: 700 }}>
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#1A1A2E', marginBottom: 4 }}>{customer.name}</h1>
              <a href={`tel:${customer.phone}`} style={{ color: '#C9922A', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{customer.phone}</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href={`/dashboard/loans?add=1&customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`} className="btn-gold" style={{ textDecoration: 'none', fontSize: 13 }}>
              + New Loan
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F0E8D0' }}>
          {customer.email && <div><div style={{ fontSize: 11, color: '#5A5A7A', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</div><div style={{ fontSize: 13 }}>{customer.email}</div></div>}
          {customer.address && <div><div style={{ fontSize: 11, color: '#5A5A7A', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address</div><div style={{ fontSize: 13 }}>{customer.address}</div></div>}
          {customer.aadharNumber && <div><div style={{ fontSize: 11, color: '#5A5A7A', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aadhar</div><div style={{ fontSize: 13, fontFamily: 'monospace' }}>{customer.aadharNumber}</div></div>}
          <div><div style={{ fontSize: 11, color: '#5A5A7A', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Since</div><div style={{ fontSize: 13 }}>{format(new Date(customer.createdAt), 'dd MMM yyyy')}</div></div>
          <div><div style={{ fontSize: 11, color: '#5A5A7A', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Outstanding</div><div style={{ fontSize: 16, fontWeight: 700, color: '#C9922A' }}>{fmt(totalOutstanding)}</div></div>
        </div>
      </div>

      {/* Loans */}
      <div className="card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0E8D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Loan History ({loans.length})</h2>
        </div>
        {loans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#5A5A7A' }}>No loans yet for this customer.</div>
        ) : (
          <table className="table-gold">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Items</th>
                <th>Principal</th>
                <th>Interest Rate</th>
                <th>Outstanding</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(l => (
                <tr key={l.id} onClick={() => router.push(`/dashboard/loans/${l.id}`)}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#5A5A7A' }}>#{l.id.slice(-6).toUpperCase()}</td>
                  <td style={{ fontSize: 13 }}>{l.items?.map(i => `${i.description} (${i.weightGrams}g ${i.purity})`).join(', ')}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(l.principalAmount)}</td>
                  <td>{l.interestRate}%/mo</td>
                  <td style={{ fontWeight: 700, color: '#C9922A' }}>{fmt(l.calculatedInterest?.outstandingBalance || 0)}</td>
                  <td style={{ fontSize: 13, color: new Date(l.dueDate) < new Date() ? '#C0392B' : '#5A5A7A' }}>{format(new Date(l.dueDate), 'dd MMM yyyy')}</td>
                  <td>
                    <span className={`badge-${l.status === 'active' && new Date(l.dueDate) < new Date() ? 'overdue' : l.status}`} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                      {l.status === 'active' && new Date(l.dueDate) < new Date() ? 'Overdue' : l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
