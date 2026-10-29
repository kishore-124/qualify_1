'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import StarRating from '@/components/StarRating';
import { effectivePrice, formatMoney, formatPrice, formatDuration, FALLBACK_THUMB } from '@/lib/utils';

export default function CartPage() {
  return (
    <Suspense>
      <Cart />
    </Suspense>
  );
}

function Cart() {
  const params = useSearchParams();
  const { user, loading, guestIds, setCounts, removeFromCart, addToCart, cartVersion } = useAuth();
  const [cart, setCart] = useState(null);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    const d = await api(user ? '/api/cart' : `/api/cart/preview?ids=${guestIds.join(',')}`);
    setCart(d);
    if (user) setCounts((c) => ({ ...c, cart: d.items.length }));
    return d;
  }, [user, guestIds, setCounts]);

  useEffect(() => {
    if (!loading) load().catch(() => setCart({ items: [], saved: [], recommendations: [], total: 0, subtotal: 0, listTotal: 0, saleSavings: 0 }));
  }, [loading, load, cartVersion]);

  useEffect(() => {
    if (params.get('canceled')) toast('Payment canceled — your cart is saved.', { icon: '↩️' });
  }, [params]);

  // Re-price the coupon whenever the cart changes
  useEffect(() => {
    if (!applied || !user) return;
    api('/api/coupons/validate', { method: 'POST', body: { code: applied.coupon.code } })
      .then((d) => setApplied(d.discount > 0 ? d : null))
      .catch(() => setApplied(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.items.length]);

  const remove = async (courseId) => {
    await removeFromCart(courseId);
    toast.success('Removed from cart');
  };

  const setSaved = async (courseId, savedForLater) => {
    const d = await api('/api/cart', { method: 'PATCH', body: { courseId, savedForLater } });
    setCart(d);
    setCounts((c) => ({ ...c, cart: d.items.length }));
    toast.success(savedForLater ? 'Saved for later' : 'Moved to cart');
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!user) return setCouponError('Log in to use a coupon.');
    try {
      const d = await api('/api/coupons/validate', { method: 'POST', body: { code } });
      if (d.discount <= 0) return setCouponError('This code doesn’t apply to the courses in your cart.');
      setApplied(d);
      setCode('');
    } catch (err) {
      setCouponError(err.message);
    }
  };

  const checkout = async () => {
    setPaying(true);
    try {
      const d = await api('/api/checkout', { method: 'POST', body: { couponCode: applied?.coupon.code } });
      window.location.href = d.url; // Stripe Checkout, or the success page in demo mode
    } catch (err) {
      toast.error(err.message);
      setPaying(false);
    }
  };

  if (!cart) {
    return (
      <div className="container-xl py-5">
        <div className="row g-4"><div className="col-lg-8"><div className="skeleton" style={{ height: 320 }} /></div><div className="col-lg-4"><div className="skeleton" style={{ height: 320 }} /></div></div>
      </div>
    );
  }

  const discountFor = (courseId) => applied?.items.find((i) => i.courseId === courseId);
  const couponOff = applied?.discount || 0;
  const total = cart.total - couponOff;
  const totalSaved = cart.saleSavings + couponOff;
  const lectures = cart.items.reduce((n, i) => n + (i.course.lectures || 0), 0);
  const hours = cart.items.reduce((n, i) => n + (i.course.duration || 0), 0);

  return (
    <div className="cart-page">
      <div className="container-xl py-4 py-lg-5">
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
          <div>
            <h1 className="page-title mb-1">Cart</h1>
            <p className="text-muted-2 mb-0">
              {cart.items.length === 0
                ? 'Nothing here yet.'
                : `${cart.items.length} course${cart.items.length > 1 ? 's' : ''} · ${lectures} lectures · ${formatDuration(hours)} of video`}
            </p>
          </div>
          <Link href="/courses" className="btn btn-ghost"><i className="bi bi-arrow-left me-1" />Continue shopping</Link>
        </div>

        <div className="row g-4 align-items-start">
          <div className="col-lg-8">
            {cart.items.length === 0 ? (
              <div className="panel p-5 text-center">
                <i className="bi bi-bag display-5 text-muted-2" />
                <h2 className="h4 fw-bold mt-3">Your cart is empty</h2>
                <p className="text-muted-2">Find a course you like and add it here. Your cart is saved even if you’re not logged in.</p>
                <Link href="/courses" className="btn btn-primary">Browse courses</Link>
              </div>
            ) : (
              <ul className="cart-list">
                {cart.items.map(({ course }) => {
                  const disc = discountFor(course.id);
                  const now = disc ? disc.price : effectivePrice(course);
                  return (
                    <li key={course.id} className="cart-row">
                      <Link href={`/courses/${course.slug}`} className="cart-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={course.thumbnail || FALLBACK_THUMB} alt="" />
                      </Link>
                      <div className="min-w-0 flex-grow-1">
                        <Link href={`/courses/${course.slug}`} className="cart-title">{course.title}</Link>
                        <div className="fs-7 text-muted-2 mb-1">By {course.instructor.name}</div>
                        <div className="d-flex flex-wrap align-items-center gap-3 fs-7 text-muted-2">
                          {course.reviewCount > 0 && <StarRating value={course.avgRating} showValue count={course.reviewCount} />}
                          {course.lectures > 0 && <span>{course.lectures} lectures</span>}
                          {course.duration > 0 && <span>{formatDuration(course.duration)}</span>}
                        </div>
                        <div className="cart-actions">
                          <button onClick={() => remove(course.id)}>Remove</button>
                          {user && <button onClick={() => setSaved(course.id, true)}>Save for later</button>}
                        </div>
                      </div>
                      <div className="cart-price">
                        <div className="fw-bold fs-5">{formatPrice(now)}</div>
                        {now < course.price && <div className="price-old">{formatPrice(course.price)}</div>}
                        {disc && disc.price < disc.base && <span className="tag-highlight">{applied.coupon.code}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {cart.saved?.length > 0 && (
              <section className="mt-5">
                <h2 className="h5 fw-bold mb-3">Saved for later <span className="text-muted-2 fw-normal">({cart.saved.length})</span></h2>
                <ul className="cart-list cart-list-muted">
                  {cart.saved.map(({ course }) => (
                    <li key={course.id} className="cart-row">
                      <Link href={`/courses/${course.slug}`} className="cart-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={course.thumbnail || FALLBACK_THUMB} alt="" />
                      </Link>
                      <div className="min-w-0 flex-grow-1">
                        <Link href={`/courses/${course.slug}`} className="cart-title">{course.title}</Link>
                        <div className="fs-7 text-muted-2">By {course.instructor.name}</div>
                        <div className="cart-actions">
                          <button onClick={() => setSaved(course.id, false)}>Move to cart</button>
                          <button onClick={() => remove(course.id)}>Remove</button>
                        </div>
                      </div>
                      <div className="cart-price"><div className="fw-bold">{formatPrice(effectivePrice(course))}</div></div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {cart.recommendations?.length > 0 && (
              <section className="mt-5">
                <h2 className="h5 fw-bold mb-3">{cart.items.length ? 'Learners also added' : 'Popular right now'}</h2>
                <div className="row g-3">
                  {cart.recommendations.map((c) => (
                    <div className="col-sm-6" key={c.id}>
                      <div className="rec-card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.thumbnail || FALLBACK_THUMB} alt="" />
                        <div className="min-w-0 flex-grow-1">
                          <Link href={`/courses/${c.slug}`} className="fw-semibold small text-body text-decoration-none line-clamp-2">{c.title}</Link>
                          <div className="d-flex align-items-baseline gap-2">
                            <span className="fw-bold small">{formatPrice(effectivePrice(c))}</span>
                            {effectivePrice(c) < c.price && <span className="price-old fs-8">{formatPrice(c.price)}</span>}
                          </div>
                        </div>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => addToCart(c, { open: false }).then((ok) => ok && toast.success('Added to cart'))}>
                          <i className="bi bi-plus-lg" /> Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="col-lg-4">
              <aside className="summary sticky-lg-top" style={{ top: 88 }}>
                <h2 className="h5 fw-bold mb-3">Order summary</h2>
                <dl className="summary-lines">
                  <div><dt>Original price</dt><dd>{formatMoney(cart.listTotal)}</dd></div>
                  {cart.saleSavings > 0 && <div className="save"><dt>Sale discount</dt><dd>−{formatMoney(cart.saleSavings)}</dd></div>}
                  {couponOff > 0 && (
                    <div className="save">
                      <dt>
                        Coupon <span className="tag-highlight">{applied.coupon.code}</span>
                        <button className="btn btn-link btn-sm p-0 ms-1 text-muted-2" onClick={() => setApplied(null)} aria-label="Remove coupon"><i className="bi bi-x-circle" /></button>
                      </dt>
                      <dd>−{formatMoney(couponOff)}</dd>
                    </div>
                  )}
                </dl>
                <div className="summary-total">
                  <span>Total</span>
                  <span>{formatMoney(total)}</span>
                </div>
                {totalSaved > 0 && <div className="saved-note">You’re saving {formatMoney(totalSaved)} ({Math.round((totalSaved / cart.listTotal) * 100)}%)</div>}

                {user ? (
                  <button className="btn btn-primary btn-lg w-100 mt-3" onClick={checkout} disabled={paying}>
                    {paying ? <><span className="spinner-border spinner-border-sm me-2" />Redirecting to payment…</> : <><i className="bi bi-lock-fill me-2" />Check out · {formatMoney(total)}</>}
                  </button>
                ) : (
                  <Link href="/login?next=/cart" className="btn btn-primary btn-lg w-100 mt-3">Log in to check out</Link>
                )}

                <form onSubmit={applyCoupon} className="coupon-form mt-3">
                  <label htmlFor="coupon" className="form-label small mb-1">Have a coupon?</label>
                  <div className="input-group">
                    <input id="coupon" className="form-control text-uppercase" placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value)} />
                    <button className="btn btn-outline-primary" disabled={!code.trim()}>Apply</button>
                  </div>
                  {couponError && <div className="small text-danger mt-1">{couponError}</div>}
                </form>

                <ul className="trust-list">
                  <li><i className="bi bi-shield-lock" />Secure payment by Stripe — cards, Apple Pay and Google Pay</li>
                  <li><i className="bi bi-arrow-counterclockwise" />30-day money-back guarantee</li>
                  <li><i className="bi bi-infinity" />Lifetime access, including future updates</li>
                </ul>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
