'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { formatMoney, formatDate } from '@/lib/utils';

const STATUS = {
  PENDING: ['bg-warning', 'Pending payout'],
  PAID: ['bg-success', 'Paid out'],
  REVERSED: ['bg-danger', 'Refunded'],
};

export default function EarningsPage() {
  return (
    <Suspense>
      <Earnings />
    </Suspense>
  );
}

function Earnings() {
  const params = useSearchParams();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = () => api('/api/instructor/earnings').then(setData).catch((e) => toast.error(e.message));
  useEffect(() => {
    load();
    if (params.get('onboarding') === 'done') toast.success('Stripe details saved. We’ll confirm your account shortly.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = async (path, label) => {
    setBusy(label);
    try {
      const d = await api(path, { method: 'POST' });
      if (d.url) window.location.href = d.url;
      else {
        toast.success(d.paid ? `${d.paid} payout(s) sent to Stripe` : 'Nothing to pay out right now');
        load();
        setBusy(null);
      }
    } catch (e) {
      toast.error(e.message);
      setBusy(null);
    }
  };

  if (!data) return <div className="container-xl py-5"><div className="skeleton" style={{ height: 420 }} /></div>;
  const t = data.totals;
  const s = data.stripe;
  const share = 100 - data.feePercent;
  const gross = t.gross || 1;

  return (
    <>
      <section className="dash-header">
        <div className="container-xl d-flex flex-wrap justify-content-between align-items-end gap-3">
          <div>
            <Link href="/instructor" className="small text-decoration-none"><i className="bi bi-arrow-left me-1" />Instructor dashboard</Link>
            <h1 className="page-title mt-2 mb-1">Earnings & payouts</h1>
            <p className="text-muted-2 mb-0">You keep {share}% of every sale. Qualify keeps {data.feePercent}% to cover payments, hosting and marketing.</p>
          </div>
        </div>
      </section>

      <div className="container-xl dash-body pb-5">
        <div className="row g-3 mb-4">
          {[
            ['Total earned', t.earned, `${t.sales} sales · ${formatMoney(t.gross)} gross`],
            ['Paid out', t.paidOut, 'Sent to your Stripe account'],
            ['Pending', t.pending, s.payoutsEnabled ? 'Sends automatically' : 'Connect Stripe to receive it'],
            ['Refunded', t.reversed, 'Earnings reversed by refunds'],
          ].map(([label, v, sub]) => (
            <div className="col-6 col-lg-3" key={label}>
              <div className="stat-card">
                <div className="small text-muted-2 fw-semibold mb-2">{label}</div>
                <div className="value">{formatMoney(v)}</div>
                <div className="fs-7 text-muted-2">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-7">
            <div className="panel h-100">
              <div className="panel-header"><span className="fw-bold">Where each sale goes</span></div>
              <div className="panel-body">
                <div className="ledger-split mb-3" role="img" aria-label="Revenue split">
                  <span style={{ width: `${(t.earned / gross) * 100}%`, background: 'var(--q-yellow)' }} />
                  <span style={{ width: `${(t.fees / gross) * 100}%`, background: 'var(--q-ink)' }} />
                </div>
                <div className="d-flex flex-wrap gap-4 small mb-4">
                  <span><i className="legend-dot" style={{ background: 'var(--q-yellow)' }} />Your earnings {formatMoney(t.earned)}</span>
                  <span><i className="legend-dot" style={{ background: 'var(--q-ink)' }} />Qualify fee {formatMoney(t.fees)}</span>
                </div>
                <table className="table mb-0">
                  <thead><tr><th>Course</th><th className="text-end">Sales</th><th className="text-end">Gross</th><th className="text-end">You earned</th></tr></thead>
                  <tbody>
                    {data.courses.length === 0 && <tr><td colSpan={4} className="text-center text-muted-2 py-4">No sales yet. Share your course link to get your first student.</td></tr>}
                    {data.courses.map((c) => (
                      <tr key={c.id}>
                        <td><Link href={`/courses/${c.slug}`} className="fw-semibold text-body text-decoration-none">{c.title}</Link></td>
                        <td className="text-end">{c.sales}</td>
                        <td className="text-end">{formatMoney(c.gross)}</td>
                        <td className="text-end fw-bold">{formatMoney(c.earned)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className={`payout-card h-100 ${s.payoutsEnabled ? 'ready' : 'todo'}`}>
              <h2 className="h5 fw-bold mb-2"><i className="bi bi-bank me-2" />Payout account</h2>
              {!s.enabled ? (
                <>
                  <p className="text-muted-2 small">Stripe isn’t configured on this site yet, so earnings are recorded and paid out by the Qualify team.</p>
                  <div className="alert alert-info small mb-0">Admins: add <code>STRIPE_SECRET_KEY</code> to enable automatic payouts.</div>
                </>
              ) : s.payoutsEnabled ? (
                <>
                  <p className="small mb-3"><span className="badge bg-success me-2">Active</span>Earnings are transferred to your Stripe account after each sale. Stripe then pays your bank on your payout schedule.</p>
                  <div className="d-grid gap-2">
                    {t.pending > 0 && (
                      <button className="btn btn-primary" disabled={!!busy} onClick={() => go('/api/instructor/earnings/withdraw', 'withdraw')}>
                        {busy === 'withdraw' ? 'Sending…' : `Send ${formatMoney(t.pending)} now`}
                      </button>
                    )}
                    <button className="btn btn-outline-primary" disabled={!!busy} onClick={() => go('/api/instructor/earnings/dashboard', 'dash')}>
                      Open Stripe dashboard <i className="bi bi-box-arrow-up-right ms-1" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="small">
                    {s.connected
                      ? 'Stripe still needs a few details before it can send you money.'
                      : 'Connect a Stripe account to receive your earnings. It takes about 5 minutes and you’ll need your bank details and ID.'}
                  </p>
                  {s.requirements?.length > 0 && <p className="fs-8 text-muted-2">Still needed: {s.requirements.slice(0, 4).join(', ').replaceAll('_', ' ')}</p>}
                  <button className="btn btn-primary w-100" disabled={!!busy} onClick={() => go('/api/instructor/earnings/connect', 'connect')}>
                    {busy === 'connect' ? 'Opening Stripe…' : s.connected ? 'Finish Stripe setup' : 'Connect with Stripe'}
                  </button>
                  {t.pending > 0 && <p className="fs-7 text-muted-2 mt-2 mb-0">{formatMoney(t.pending)} is waiting for you and will be sent as soon as setup is done.</p>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><span className="fw-bold">Sales history</span><span className="fs-7 text-muted-2">Latest 60</span></div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead><tr><th>Date</th><th>Course</th><th>Student</th><th className="text-end">Price</th><th className="text-end">Qualify fee</th><th className="text-end">You earn</th><th>Status</th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={7} className="text-center text-muted-2 py-4">Your sales will appear here.</td></tr>}
                {data.items.map((i) => (
                  <tr key={i.id}>
                    <td className="small text-nowrap">{formatDate(i.order.createdAt)}</td>
                    <td className="small">{i.course.title}{i.order.couponCode && <span className="tag-highlight ms-2">{i.order.couponCode}</span>}</td>
                    <td className="small">{i.order.user.name}</td>
                    <td className="text-end">{formatMoney(i.price)}</td>
                    <td className="text-end text-muted-2">−{formatMoney(i.platformFee)}</td>
                    <td className="text-end fw-bold">{formatMoney(i.instructorEarning)}</td>
                    <td><span className={`badge ${STATUS[i.earningStatus][0]}`}>{STATUS[i.earningStatus][1]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
