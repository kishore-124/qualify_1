'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './Providers';
import { api } from '@/lib/client';
import { formatMoney, formatPrice, effectivePrice, FALLBACK_THUMB } from '@/lib/utils';

/** Slide-out mini cart that opens whenever a course is added. */
export default function CartDrawer() {
  const { user, guestIds, cartOpen, closeCart, cartVersion, lastAdded, removeFromCart, addToCart } = useAuth();
  const pathname = usePathname();
  const [cart, setCart] = useState(null);

  useEffect(() => {
    if (!cartOpen) return;
    const url = user ? '/api/cart' : `/api/cart/preview?ids=${guestIds.join(',')}`;
    api(url).then(setCart).catch(() => setCart(null));
  }, [cartOpen, cartVersion, user, guestIds]);

  useEffect(() => {
    closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e) => e.key === 'Escape' && closeCart();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cartOpen, closeCart]);

  if (!cartOpen) return null;
  const justAdded = lastAdded && cart?.items.some((i) => i.courseId === lastAdded.id) ? lastAdded : null;

  return (
    <div className="drawer-scrim" onClick={closeCart}>
      <aside className="drawer" role="dialog" aria-label="Your cart" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <div className="fw-bold fs-5">Your cart</div>
            <div className="fs-7 text-muted-2">{cart ? `${cart.items.length} course${cart.items.length === 1 ? '' : 's'}` : 'Loading…'}</div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={closeCart} aria-label="Close cart"><i className="bi bi-x-lg" /></button>
        </header>

        {justAdded && (
          <div className="drawer-added">
            <i className="bi bi-check-circle-fill" /> <span>Added <b>{justAdded.title}</b></span>
          </div>
        )}

        <div className="drawer-body">
          {!cart && [1, 2].map((i) => <div key={i} className="skeleton mb-3" style={{ height: 72 }} />)}
          {cart?.items.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-bag fs-1 text-muted-2" />
              <p className="mt-2 mb-3">Your cart is empty.</p>
              <Link href="/courses" className="btn btn-primary">Browse courses</Link>
            </div>
          )}
          {cart?.items.map(({ course }) => (
            <div key={course.id} className="drawer-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={course.thumbnail || FALLBACK_THUMB} alt="" />
              <div className="min-w-0 flex-grow-1">
                <Link href={`/courses/${course.slug}`} className="fw-semibold small text-body text-decoration-none line-clamp-2">{course.title}</Link>
                <div className="fs-8 text-muted-2">{course.instructor.name}</div>
                <div className="d-flex align-items-baseline gap-2 mt-1">
                  <span className="fw-bold">{formatPrice(effectivePrice(course))}</span>
                  {effectivePrice(course) < course.price && <span className="price-old fs-8">{formatPrice(course.price)}</span>}
                </div>
              </div>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => removeFromCart(course.id)} aria-label={`Remove ${course.title}`}><i className="bi bi-trash3" /></button>
            </div>
          ))}

          {cart?.recommendations?.length > 0 && cart.items.length > 0 && (
            <div className="mt-4">
              <div className="fw-bold small mb-2">Often bought together</div>
              {cart.recommendations.slice(0, 2).map((c) => (
                <div key={c.id} className="drawer-item drawer-rec">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.thumbnail || FALLBACK_THUMB} alt="" />
                  <div className="min-w-0 flex-grow-1">
                    <div className="fw-semibold small line-clamp-2">{c.title}</div>
                    <div className="fw-bold small">{formatPrice(effectivePrice(c))}</div>
                  </div>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => addToCart(c, { open: true })}>Add</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart?.items.length > 0 && (
          <footer className="drawer-foot">
            {cart.saleSavings > 0 && (
              <div className="d-flex justify-content-between small mb-1 text-success fw-semibold">
                <span>You save</span><span>{formatMoney(cart.saleSavings)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between align-items-baseline mb-3">
              <span className="fw-semibold">Subtotal</span>
              <span className="fs-4 fw-bold">{formatMoney(cart.total)}</span>
            </div>
            <div className="d-grid gap-2">
              <Link href="/cart" className="btn btn-primary btn-lg">{user ? 'Check out' : 'Review cart'}</Link>
              <button className="btn btn-ghost" onClick={closeCart}>Keep browsing</button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}
