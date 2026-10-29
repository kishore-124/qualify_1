'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import { formatMoney, FALLBACK_THUMB } from '@/lib/utils';

export default function SuccessPage() {
  return (
    <Suspense>
      <Success />
    </Suspense>
  );
}

function Success() {
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    const q = params.get('session_id') ? `session_id=${params.get('session_id')}` : `order=${params.get('order')}`;
    api(`/api/checkout/verify?${q}`)
      .then((d) => {
        setOrder(d.order);
        if (d.order.status === 'PAID') refresh();
        // Some payment methods confirm a few seconds later — poll briefly
        else if (d.order.status === 'PENDING' && tries < 10) setTimeout(() => setTries((t) => t + 1), 2000);
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tries]);

  if (error) {
    return (
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <div className="panel p-5 text-center">
          <h1 className="h3 fw-bold">We couldn’t confirm this payment</h1>
          <p className="text-muted-2">{error}</p>
          <Link href="/dashboard?tab=purchases" className="btn btn-primary">See my purchases</Link>
        </div>
      </div>
    );
  }
  if (!order) return <div className="container py-5" style={{ maxWidth: 640 }}><div className="skeleton" style={{ height: 360 }} /></div>;

  const paid = order.status === 'PAID';
  return (
    <div className="success-page py-5">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="receipt">
          <div className="receipt-stamp" aria-hidden="true"><i className={`bi ${paid ? 'bi-check-lg' : 'bi-hourglass-split'}`} /></div>
          <h1 className="page-title mb-2">{paid ? 'You’re enrolled' : 'Payment processing'}</h1>
          <p className="text-muted-2 mb-4">
            {paid
              ? `Receipt ${order.paymentRef} · ${formatMoney(order.total)} paid. A copy is in your purchase history.`
              : 'Your bank is confirming the payment. This page updates automatically.'}
          </p>
          <ul className="receipt-items">
            {order.items.map((i) => (
              <li key={i.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.course.thumbnail || FALLBACK_THUMB} alt="" />
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-semibold">{i.course.title}</div>
                  <div className="fs-7 text-muted-2">{i.course.instructor.name} · {formatMoney(i.price)}</div>
                </div>
                {paid && <Link href={`/learn/${i.course.slug}`} className="btn btn-primary btn-sm">Start learning</Link>}
              </li>
            ))}
          </ul>
          {order.discount > 0 && <p className="small text-success fw-semibold mt-3 mb-0">You saved {formatMoney(order.discount)} with {order.couponCode}.</p>}
          <div className="d-flex gap-2 mt-4">
            <Link href="/dashboard" className="btn btn-ghost">Go to my learning</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
