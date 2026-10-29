'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { useAuth } from './Providers';
import VideoPlayer from './VideoPlayer';
import ReportButton from './ReportButton';
import { formatPrice, effectivePrice, discountPercent } from '@/lib/utils';

export default function CourseActions({ course, state, includes }) {
  const router = useRouter();
  const { setCounts, addToCart: addCourse, openCart } = useAuth();
  const [inCart, setInCart] = useState(state.inCart);
  const [inWishlist, setInWishlist] = useState(state.inWishlist);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const price = effectivePrice(course);
  const off = discountPercent(course);
  const isFree = price <= 0;

  const requireLogin = () => {
    if (!state.loggedIn) {
      router.push(`/login?next=/courses/${course.slug}`);
      return true;
    }
    return false;
  };

  const addToCart = async (goToCart = false) => {
    setBusy(true);
    const ok = await addCourse(course, { open: !goToCart });
    setBusy(false);
    if (!ok) return;
    setInCart(true);
    if (goToCart) router.push('/cart');
  };

  const enrollFree = async () => {
    if (requireLogin()) return;
    setBusy(true);
    try {
      await api(`/api/courses/${course.id}/enroll`, { method: 'POST' });
      toast.success('You are enrolled! 🎉');
      router.push(`/learn/${course.slug}`);
    } catch (e) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  const toggleWishlist = async () => {
    if (requireLogin()) return;
    try {
      const d = await api('/api/wishlist', { method: 'POST', body: { courseId: course.id } });
      setInWishlist(d.inWishlist);
      setCounts((c) => ({ ...c, wishlist: c.wishlist + (d.inWishlist ? 1 : -1) }));
      toast.success(d.inWishlist ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: course.title, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  };

  return (
    <>
      <div className="preview-thumb" onClick={() => course.previewVideo && setShowPreview(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={course.thumbnail} alt={course.title} />
        {course.previewVideo && (
          <div className="play flex-column">
            <span><i className="bi bi-play-fill" /></span>
            <div className="text-white fw-bold mt-2 small">Preview this course</div>
          </div>
        )}
      </div>
      <div className="p-4">
        {state.enrolled || state.isOwner ? (
          <>
            {state.enrolled && (
              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-semibold mb-1"><span>Your progress</span><span>{state.progress}%</span></div>
                <div className="progress" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${state.progress}%` }} /></div>
              </div>
            )}
            <Link href={`/learn/${course.slug}`} className="btn btn-primary btn-lg w-100 mb-2">
              <i className="bi bi-play-circle me-2" />{state.enrolled ? (state.progress > 0 ? 'Continue learning' : 'Start learning') : 'Open course player'}
            </Link>
            {state.isOwner && (
              <Link href={`/instructor/courses/${course.id}`} className="btn btn-soft w-100"><i className="bi bi-pencil me-2" />Edit course</Link>
            )}
          </>
        ) : state.purchasable === false ? (
          <div className="text-center py-3">
            <i className="bi bi-pause-circle fs-2 text-muted-2" />
            <p className="fw-semibold mt-2 mb-1">Not available right now</p>
            <p className="small text-muted-2 mb-0">This course can’t be bought at the moment. Save it to your wishlist to come back later.</p>
          </div>
        ) : (
          <>
            <div className="d-flex align-items-baseline gap-2 mb-1">
              <span className="fs-2 fw-bold">{formatPrice(price)}</span>
              {off > 0 && <><span className="price-old fs-6">{formatPrice(course.price)}</span><span className="fw-semibold text-success small">{off}% off</span></>}
            </div>
            {off > 0 && <div className="small text-danger fw-semibold mb-3"><i className="bi bi-alarm me-1" />Limited-time offer</div>}
            <div className="d-flex gap-2 mb-2 mt-3">
              {isFree ? (
                <button className="btn btn-primary btn-lg flex-grow-1" onClick={enrollFree} disabled={busy}>
                  {busy ? <span className="spinner-border spinner-border-sm" /> : 'Enroll now — it\'s free'}
                </button>
              ) : inCart ? (
                <button className="btn btn-primary btn-lg flex-grow-1" onClick={openCart}>In your cart — view</button>
              ) : (
                <button className="btn btn-primary btn-lg flex-grow-1" onClick={() => addToCart(false)} disabled={busy}>
                  {busy ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-cart-plus me-2" />Add to cart</>}
                </button>
              )}
              <button className={`btn btn-lg ${inWishlist ? 'btn-primary' : 'btn-outline-primary'} btn-icon`} style={{ width: 54, height: 'auto' }} onClick={toggleWishlist} aria-label="Wishlist">
                <i className={`bi ${inWishlist ? 'bi-heart-fill' : 'bi-heart'}`} />
              </button>
            </div>
            {!isFree && (
              <button className="btn btn-outline-dark btn-lg w-100" onClick={() => addToCart(true)} disabled={busy}>Buy now</button>
            )}
            <p className="text-center fs-7 text-muted-2 mt-2 mb-0">30-day money-back guarantee</p>
          </>
        )}

        <hr className="my-4" />
        <h6 className="fw-bold mb-3">This course includes:</h6>
        <ul className="list-unstyled small d-grid gap-2 mb-4">
          {includes.map(([icon, text]) => (
            <li key={text}><i className={`bi ${icon} me-2 text-primary`} />{text}</li>
          ))}
        </ul>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-soft flex-fill" onClick={share}><i className="bi bi-share me-1" />Share</button>
          <Link href="/cart" className="btn btn-sm btn-soft flex-fill"><i className="bi bi-gift me-1" />Apply coupon</Link>
        </div>
        {!state.isOwner && (
          <div className="text-center mt-3">
            <ReportButton targetType="COURSE" targetId={course.id} label="Report this course" />
          </div>
        )}
      </div>

      {showPreview && (
        <div className="modal-backdrop-lh" onClick={() => setShowPreview(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <div><div className="fs-7 text-muted-2">Course preview</div><div className="fw-bold">{course.title}</div></div>
              <button className="btn-close" onClick={() => setShowPreview(false)} />
            </div>
            <div className="player-video"><VideoPlayer url={course.previewVideo} autoPlay /></div>
          </div>
        </div>
      )}
    </>
  );
}
