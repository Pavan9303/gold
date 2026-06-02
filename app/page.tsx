import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 50%, #1A1A2E 100%)' }}>
      {/* Hero */}
      <div style={{ padding: '80px 24px', textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(201,146,42,0.12)', border: '1px solid rgba(201,146,42,0.3)', borderRadius: 12, padding: '10px 20px' }}>
            <span style={{ fontSize: 28 }}>🪙</span>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, color: '#E8B84B', fontWeight: 700 }}>GoldLoan Manager</span>
          </div>
        </div>

        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 6vw, 60px)', color: 'white', lineHeight: 1.2, marginBottom: 20 }}>
          Manage Your Gold Loans{' '}
          <span style={{ color: '#E8B84B' }}>Effortlessly</span>
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 40 }}>
          Complete loan management for gold shops. Track customers, calculate interest automatically, 
          send WhatsApp reminders, and never miss a payment.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn-gold" style={{ fontSize: 16, padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }}>
            Register Your Shop →
          </Link>
          <Link href="/login" className="btn-ghost" style={{ fontSize: 16, padding: '14px 32px', textDecoration: 'none', display: 'inline-block', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
            Login
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { icon: '📊', title: 'Auto Interest Calculation', desc: 'Monthly compound interest calculated automatically. See outstanding balances in real-time.' },
            { icon: '👥', title: 'Customer Profiles', desc: 'Complete customer profiles with item details, weight, purity, and loan history.' },
            { icon: '⏰', title: 'Smart Reminders', desc: 'Automatic WhatsApp reminders for due payments and overdue loans to customers.' },
            { icon: '💳', title: 'Payment Tracking', desc: 'Record partial or full payments. Balances update instantly with each entry.' },
            { icon: '🏪', title: 'Multi-Shop Ready', desc: 'Each gold shop gets their own account, customers, and dashboard.' },
            { icon: '📱', title: 'WhatsApp Integration', desc: 'Send payment confirmations and reminders directly via WhatsApp Business API.' },
          ].map((f) => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,146,42,0.2)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ color: '#E8B84B', fontWeight: 600, marginBottom: 8, fontSize: 16 }}>{f.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
