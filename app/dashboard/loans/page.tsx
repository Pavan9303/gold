'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, addDays, addMonths } from 'date-fns';

interface LoanItem { description: string; weightGrams: string; purity: string; purityPercentage: string; estimatedValue: string; itemImage?: string; }

const PURITY_DEFAULTS: Record<string, string> = {
  '24K': '99.9', '22K': '91.6', '18K': '75.0', '14K': '58.3', 'Silver': '92.5',
};

const DURATION_PRESETS = [
  { key: '1d',  label: '1 Day' },
  { key: '3d',  label: '3 Days' },
  { key: '7d',  label: '7 Days' },
  { key: '1m',  label: '1 Month' },
  { key: '3m',  label: '3 Months' },
  { key: '6m',  label: '6 Months' },
  { key: '12m', label: '12 Months' },
  { key: 'custom', label: 'Custom' },
];

function calcDueDate(startDate: string, preset: string): string {
  if (!startDate || preset === 'custom' || !preset) return '';
  const [y, m, d] = startDate.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  let result: Date;
  switch (preset) {
    case '1d':  result = addDays(base, 1);    break;
    case '3d':  result = addDays(base, 3);    break;
    case '7d':  result = addDays(base, 7);    break;
    case '1m':  result = addMonths(base, 1);  break;
    case '3m':  result = addMonths(base, 3);  break;
    case '6m':  result = addMonths(base, 6);  break;
    case '12m': result = addMonths(base, 12); break;
    default: return '';
  }
  return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`;
}
interface Loan { id: string; customerName: string; customerPhone: string; principalAmount: number; interestRate: number; status: string; startDate: string; dueDate: string; totalPaid: number; items: {description:string;weightGrams:number;purity:string;estimatedValue:number;itemImage?:string;}[]; calculatedInterest: {outstandingBalance:number;interestAccrued:number;monthlyInterestAmount:number;totalDue:number;}; }
interface Customer { id: string; name: string; phone: string; }

function LoansContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(sp.get('add') === '1');
  const [filter, setFilter] = useState(sp.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [dateFilterType, setDateFilterType] = useState<'day'|'month'|'year'|'range'|''>('');
  const [dateFilterDay,   setDateFilterDay]   = useState('');
  const [dateFilterMonth, setDateFilterMonth] = useState('');
  const [dateFilterYear,  setDateFilterYear]  = useState('');
  const [dateFilterFrom,  setDateFilterFrom]  = useState('');
  const [dateFilterTo,    setDateFilterTo]    = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const defaultCustomerId = sp.get('customerId') || '';
  const defaultCustomerName = sp.get('customerName') || '';

  const [form, setForm] = useState({
    customerId: defaultCustomerId,
    interestRate: '2',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    durationPreset: '',
    principalAmount: '',
    isCompoundInterest: false,
    notes: '',
    items: [{ description: '', weightGrams: '', purity: '22K', purityPercentage: '91.6', estimatedValue: '', itemImage: '' }] as LoanItem[],
  });

  // Per-item upload tracking
  const [itemUploading, setItemUploading] = useState<boolean[]>([false]);
  const activeItemIdx = useRef<number>(-1);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/loans').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]).then(([l, c]) => {
      setLoans(Array.isArray(l) ? l : []);
      setCustomers(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  function matchesDateFilter(loan: Loan): boolean {
    if (!dateFilterType) return true;
    const d = loan.startDate.slice(0, 10);
    if (dateFilterType === 'day')   return d === dateFilterDay;
    if (dateFilterType === 'month') return dateFilterMonth ? d.slice(0, 7) === dateFilterMonth : true;
    if (dateFilterType === 'year')  return dateFilterYear  ? d.slice(0, 4) === dateFilterYear  : true;
    if (dateFilterType === 'range') {
      if (dateFilterFrom && d < dateFilterFrom) return false;
      if (dateFilterTo   && d > dateFilterTo)   return false;
      return true;
    }
    return true;
  }

  const filtered = loans.filter(l => {
    const matchStatus = filter === 'all' || l.status === filter || (filter === 'overdue' && new Date(l.dueDate) < new Date() && l.status === 'active');
    const matchSearch = l.customerName.toLowerCase().includes(search.toLowerCase()) || l.customerPhone.includes(search);
    return matchStatus && matchSearch && matchesDateFilter(l);
  });

  const dateFilterActive = !!dateFilterType;
  const aggregateSummary = dateFilterActive ? {
    count:       filtered.length,
    principal:   filtered.reduce((s, l) => s + l.principalAmount, 0),
    goldGrams:   filtered.reduce((s, l) => s + (l.items?.reduce((gs, it) => gs + (it.weightGrams || 0), 0) ?? 0), 0),
  } : null;

  function addItem() {
    setForm(p => ({ ...p, items: [...p.items, { description: '', weightGrams: '', purity: '22K', purityPercentage: '91.6', estimatedValue: '', itemImage: '' }] }));
    setItemUploading(p => [...p, false]);
  }
  function removeItem(i: number) {
    setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
    setItemUploading(p => p.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, k: string, v: string) {
    setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  }

  function triggerItemPhoto(i: number, mode: 'camera' | 'gallery') {
    activeItemIdx.current = i;
    if (mode === 'camera') cameraInputRef.current?.click();
    else galleryInputRef.current?.click();
  }

  async function handleItemPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const i = activeItemIdx.current;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || i < 0) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      updateItem(i, 'itemImage', base64); // show preview immediately
      setItemUploading(p => { const n = [...p]; n[i] = true; return n; });
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64, folder: 'goldloan/items' }),
        });
        const data = await res.json() as { url?: string; error?: string };
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        updateItem(i, 'itemImage', data.url!);
      } catch {
        updateItem(i, 'itemImage', ''); // clear on failure
      } finally {
        setItemUploading(p => { const n = [...p]; n[i] = false; return n; });
      }
    };
    reader.readAsDataURL(file);
  }

  const anyItemUploading = itemUploading.some(Boolean);

  async function addLoan(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    if (!form.dueDate) { setError('Please select a loan duration or pick a due date.'); setSaving(false); return; }
    const payload = {
      ...form,
      principalAmount: Number(form.principalAmount),
      interestRate: Number(form.interestRate),
      durationPreset: form.durationPreset || undefined,
      isCompoundInterest: form.isCompoundInterest,
      items: form.items.map(it => ({
        description: it.description,
        weightGrams: Number(it.weightGrams),
        purity: it.purity,
        ...(it.purityPercentage ? { purityPercentage: Number(it.purityPercentage) } : {}),
        estimatedValue: Number(it.estimatedValue),
        ...(it.itemImage ? { itemImage: it.itemImage } : {}),
      })),
    };
    const res = await fetch('/api/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setLoans(p => [{ ...data, calculatedInterest: { outstandingBalance: data.principalAmount, interestAccrued: 0, monthlyInterestAmount: data.principalAmount * data.interestRate / 100, totalDue: data.principalAmount } }, ...p]);
    setShowAdd(false);
    setSaving(false);
    router.push(`/dashboard/loans/${data.id}`);
  }

  function clearDateFilter() {
    setDateFilterType(''); setDateFilterDay(''); setDateFilterMonth('');
    setDateFilterYear(''); setDateFilterFrom(''); setDateFilterTo('');
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i).reverse();

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const purityOptions = ['24K', '22K', '18K', '14K', 'Silver'];

  return (
    <div style={{ padding: 32 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1A1A2E', marginBottom: 4 }}>Loans</h1>
          <p style={{ color: '#5A5A7A', fontSize: 14 }}>{loans.length} total loans</p>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}>+ New Loan</button>
      </div>

      {/* Status + search filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <input className="input-gold" placeholder="🔍 Search customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'active', 'overdue', 'closed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', borderColor: filter === f ? '#C9922A' : '#E8E0D0', background: filter === f ? '#FDF6E3' : 'white', color: filter === f ? '#C9922A' : '#5A5A7A' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter panel */}
      <div style={{ marginBottom: 20, padding: '14px 16px', background: '#FDFAF4', border: '1px solid #F0E8D0', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', marginRight: 4 }}>Filter by loan date:</span>
          {(['day','month','year','range'] as const).map(type => {
            const labels = { day: 'Day', month: 'Month', year: 'Year', range: 'Date Range' };
            const active = dateFilterType === type;
            return (
              <button key={type} onClick={() => { setDateFilterType(active ? '' : type); }} style={{ padding: '5px 13px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderColor: active ? '#C9922A' : '#E8E0D0', background: active ? '#FDF6E3' : 'white', color: active ? '#C9922A' : '#5A5A7A' }}>
                {labels[type]}
              </button>
            );
          })}
          {dateFilterActive && (
            <button onClick={clearDateFilter} style={{ padding: '5px 13px', borderRadius: 20, border: '1.5px solid #C0392B', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#FDEEEC', color: '#C0392B', marginLeft: 4 }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Filter inputs */}
        {dateFilterType === 'day' && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: '#5A5A7A', fontWeight: 600 }}>Date:</label>
            <input className="input-gold" type="date" value={dateFilterDay} onChange={e => setDateFilterDay(e.target.value)} style={{ maxWidth: 200 }} />
          </div>
        )}
        {dateFilterType === 'month' && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: '#5A5A7A', fontWeight: 600 }}>Month:</label>
            <input className="input-gold" type="month" value={dateFilterMonth} onChange={e => setDateFilterMonth(e.target.value)} style={{ maxWidth: 200 }} />
          </div>
        )}
        {dateFilterType === 'year' && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: '#5A5A7A', fontWeight: 600 }}>Year:</label>
            <select className="input-gold" value={dateFilterYear} onChange={e => setDateFilterYear(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="">Select year…</option>
              {yearOptions.map(y => <option key={y} value={y.toString()}>{y}</option>)}
            </select>
          </div>
        )}
        {dateFilterType === 'range' && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: '#5A5A7A', fontWeight: 600 }}>From:</label>
            <input className="input-gold" type="date" value={dateFilterFrom} onChange={e => setDateFilterFrom(e.target.value)} style={{ maxWidth: 180 }} />
            <label style={{ fontSize: 12, color: '#5A5A7A', fontWeight: 600 }}>To:</label>
            <input className="input-gold" type="date" value={dateFilterTo} min={dateFilterFrom} onChange={e => setDateFilterTo(e.target.value)} style={{ maxWidth: 180 }} />
          </div>
        )}
      </div>

      {loading ? <div style={{ color: '#5A5A7A', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <>
        {/* Aggregate summary — only shown when a date filter is active */}
        {aggregateSummary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Loans in Period',      value: aggregateSummary.count.toString(),                              icon: '📋', color: '#1A6BAA', bg: '#E8F0FD' },
              { label: 'Total Principal',       value: fmt(aggregateSummary.principal),                               icon: '🏦', color: '#2E7D52', bg: '#E8F5EE' },
              { label: 'Total Gold Weight',     value: `${aggregateSummary.goldGrams.toFixed(1)} g`,                  icon: '⚖️', color: '#C9922A', bg: '#FDF6E3' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '14px 18px', background: s.bg, border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: '#5A5A7A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>No loans found</div>
              <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Create First Loan</button>
            </div>
          ) : (
            <table className="table-gold">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Principal</th>
                  <th>Interest/Mo</th>
                  <th>Outstanding</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const isOD = l.status === 'active' && new Date(l.dueDate) < new Date();
                  return (
                    <tr key={l.id} onClick={() => router.push(`/dashboard/loans/${l.id}`)}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.customerName}</div>
                        <div style={{ fontSize: 12, color: '#5A5A7A' }}>{l.customerPhone}</div>
                      </td>
                      <td style={{ fontSize: 12, color: '#5A5A7A', maxWidth: 200 }}>
                        {l.items?.slice(0, 2).map(i => `${i.description} ${i.weightGrams}g`).join(', ')}
                        {l.items?.length > 2 && ` +${l.items.length - 2} more`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(l.principalAmount)}</td>
                      <td style={{ color: '#C9922A', fontWeight: 600 }}>{fmt(l.calculatedInterest?.monthlyInterestAmount || 0)}</td>
                      <td style={{ fontWeight: 700, color: isOD ? '#C0392B' : '#1A1A2E' }}>{fmt(l.calculatedInterest?.outstandingBalance || 0)}</td>
                      <td style={{ fontSize: 13, color: isOD ? '#C0392B' : '#5A5A7A', fontWeight: isOD ? 600 : 400 }}>{format(new Date(l.dueDate), 'dd MMM yyyy')}</td>
                      <td>
                        <span className={`badge-${isOD ? 'overdue' : l.status}`} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                          {isOD ? 'Overdue' : l.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        </>
      )}

      {/* Hidden file inputs shared across all items */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleItemPhoto} style={{ display: 'none' }} />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleItemPhoto} style={{ display: 'none' }} />

      {/* Add Loan Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" style={{ padding: 32, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22 }}>Create New Loan</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#5A5A7A' }}>×</button>
            </div>
            <form onSubmit={addLoan}>
              {/* Customer Select */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Customer *</label>
                {defaultCustomerId ? (
                  <input className="input-gold" value={defaultCustomerName} readOnly style={{ background: '#F8F4ED' }} />
                ) : (
                  <select className="input-gold" value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))} required>
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                )}
                {customers.length === 0 && <p style={{ fontSize: 12, color: '#C9922A', marginTop: 4 }}>No customers yet. <Link href="/dashboard/customers?add=1" style={{ color: '#C9922A' }}>Add one first.</Link></p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Principal (₹) *</label>
                  <input className="input-gold" type="number" placeholder="50000" value={form.principalAmount} onChange={e => setForm(p => ({ ...p, principalAmount: e.target.value }))} required min={1} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Interest (% / month) *</label>
                  <input className="input-gold" type="number" step="0.1" placeholder="2" value={form.interestRate} onChange={e => setForm(p => ({ ...p, interestRate: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Start Date *</label>
                  <input className="input-gold" type="date" value={form.startDate} onChange={e => {
                    const newStart = e.target.value;
                    setForm(p => ({
                      ...p,
                      startDate: newStart,
                      dueDate: (p.durationPreset && p.durationPreset !== 'custom')
                        ? calcDueDate(newStart, p.durationPreset)
                        : p.dueDate,
                    }));
                  }} required />
                </div>
              </div>
              {/* Duration presets */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 8 }}>Loan Duration *</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {DURATION_PRESETS.map(p => {
                    const active = form.durationPreset === p.key;
                    return (
                      <button key={p.key} type="button" onClick={() => {
                        const toggled = active ? '' : p.key;
                        setForm(prev => ({
                          ...prev,
                          durationPreset: toggled,
                          dueDate: toggled && toggled !== 'custom'
                            ? calcDueDate(prev.startDate, toggled)
                            : toggled === 'custom' ? prev.dueDate : '',
                        }));
                      }} style={{ padding: '6px 13px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderColor: active ? '#C9922A' : '#E8E0D0', background: active ? '#FDF6E3' : 'white', color: active ? '#C9922A' : '#5A5A7A' }}>
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Due date — auto-computed display for presets, editable picker for custom/none */}
                {form.durationPreset && form.durationPreset !== 'custom' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FDF6E3', border: '1px solid #E8C87A', borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: '#5A5A7A', fontWeight: 600 }}>Due Date:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#C9922A' }}>
                      {form.dueDate ? format(new Date(form.dueDate + 'T00:00:00'), 'dd MMMM yyyy') : '—'}
                    </span>
                    <span style={{ fontSize: 11, color: '#5A5A7A', marginLeft: 'auto' }}>auto-calculated</span>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Due Date *</label>
                    <input className="input-gold" type="date" value={form.dueDate} min={form.startDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required />
                  </div>
                )}
              </div>

              {/* Items */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A' }}>Gold Items *</label>
                  <button type="button" onClick={addItem} style={{ fontSize: 12, color: '#C9922A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: '10px 12px', background: '#FDFAF4', borderRadius: 8, border: '1px solid #F0E8D0' }}>
                    {/* Main row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.75fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input className="input-gold" placeholder="Description (e.g., Gold Chain)" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required />
                      <input className="input-gold" type="number" placeholder="Weight (g)" value={item.weightGrams} onChange={e => updateItem(i, 'weightGrams', e.target.value)} required />
                      <select className="input-gold" value={item.purity} onChange={e => {
                        updateItem(i, 'purity', e.target.value);
                        updateItem(i, 'purityPercentage', PURITY_DEFAULTS[e.target.value] ?? '');
                      }}>
                        {purityOptions.map(p => <option key={p}>{p}</option>)}
                      </select>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input-gold"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="%"
                          value={item.purityPercentage}
                          onChange={e => updateItem(i, 'purityPercentage', e.target.value)}
                          style={{ paddingRight: 22 }}
                          title="Purity percentage (e.g. 91.6)"
                        />
                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#5A5A7A', pointerEvents: 'none' }}>%</span>
                      </div>
                      <input className="input-gold" type="number" placeholder="Value (₹)" value={item.estimatedValue} onChange={e => updateItem(i, 'estimatedValue', e.target.value)} />
                    </div>

                    {/* Image row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.itemImage ? (
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img src={item.itemImage} alt="item" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1.5px solid #E8C87A' }} />
                          {itemUploading[i] && (
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            </div>
                          )}
                          {!itemUploading[i] && (
                            <button type="button" onClick={() => updateItem(i, 'itemImage', '')} title="Remove photo" style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#C0392B', border: 'none', color: 'white', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" onClick={() => triggerItemPhoto(i, 'camera')} disabled={itemUploading[i]}
                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1.5px solid #C9922A', borderRadius: 6, background: 'white', color: '#C9922A', cursor: 'pointer' }}>
                            📷 Photo
                          </button>
                          <button type="button" onClick={() => triggerItemPhoto(i, 'gallery')} disabled={itemUploading[i]}
                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1.5px solid #E8E0D0', borderRadius: 6, background: 'white', color: '#5A5A7A', cursor: 'pointer' }}>
                            🖼 Gallery
                          </button>
                        </div>
                      )}
                      <div style={{ flex: 1 }} />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} style={{ background: '#FDEEEC', border: 'none', borderRadius: 6, color: '#C0392B', cursor: 'pointer', padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Notes (optional)</label>
                <input className="input-gold" placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>

              {/* Compound interest toggle */}
              <div style={{ marginBottom: 20, padding: '12px 14px', background: form.isCompoundInterest ? '#FDF6E3' : '#F8F8FC', border: `1.5px solid ${form.isCompoundInterest ? '#E8C87A' : '#E8E0D0'}`, borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div
                    onClick={() => setForm(p => ({ ...p, isCompoundInterest: !p.isCompoundInterest }))}
                    style={{ width: 40, height: 22, borderRadius: 11, background: form.isCompoundInterest ? '#C9922A' : '#C8C8D8', position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <div style={{ position: 'absolute', top: 3, left: form.isCompoundInterest ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>
                      Calculate as Compound Interest
                    </div>
                    <div style={{ fontSize: 11, color: '#5A5A7A', marginTop: 2 }}>
                      {form.isCompoundInterest
                        ? 'Monthly compounding: P × (1 + r)ⁿ'
                        : 'Simple interest: P × r × n  (default)'}
                    </div>
                  </div>
                </label>
              </div>

              {error && <div style={{ background: '#FDEEEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-gold" type="submit" disabled={saving || anyItemUploading} style={{ flex: 1 }}>
                  {anyItemUploading ? 'Uploading photo…' : saving ? 'Creating...' : 'Create Loan'}
                </button>
                <button className="btn-ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoansPage() {
  return <Suspense fallback={<div style={{ padding: 40, color: '#5A5A7A' }}>Loading...</div>}><LoansContent /></Suspense>;
}
