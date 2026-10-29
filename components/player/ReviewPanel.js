'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import Avatar from '../Avatar';
import StarRating from '../StarRating';
import ReportButton from '../ReportButton';
import { timeAgo } from '@/lib/utils';

const LABELS = ['', 'Awful, not what I expected', 'Poor, pretty disappointed', 'Average, could be better', 'Good, what I expected', 'Amazing, above expectations!'];

export default function ReviewPanel({ courseId, myReview, enrolled, onSaved }) {
  const [rating, setRating] = useState(myReview?.rating || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(myReview?.comment || '');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);

  const load = () => api(`/api/courses/${courseId}/reviews`).then(setData).catch(() => {});
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const save = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error('Please select a rating');
    setBusy(true);
    try {
      const { review } = await api(`/api/courses/${courseId}/reviews`, { method: 'POST', body: { rating, comment } });
      onSaved?.(review);
      toast.success(myReview ? 'Review updated' : 'Thanks for your review!');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const shown = hover || rating;

  return (
    <div>
      {enrolled && (
        <form onSubmit={save} className="panel p-4 mb-4">
          <h6 className="fw-bold mb-1">{myReview ? 'Your review' : 'How would you rate this course?'}</h6>
          <div className="small text-muted-2 mb-2" style={{ minHeight: 20 }}>{LABELS[shown]}</div>
          <div className="d-flex gap-1 mb-3 fs-3 stars" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <i key={i} role="button" className={`bi ${i <= shown ? 'bi-star-fill' : 'bi-star'}`} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)} />
            ))}
          </div>
          <textarea className="form-control mb-3" rows={3} placeholder="Tell us about your experience with this course…" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn btn-primary btn-sm" disabled={busy}>{myReview ? 'Update review' : 'Submit review'}</button>
        </form>
      )}

      {data && (
        <>
          <div className="d-flex align-items-center gap-3 mb-3">
            <h6 className="fw-bold mb-0">{data.total} student review{data.total === 1 ? '' : 's'}</h6>
          </div>
          {data.reviews.map((r) => (
            <div key={r.id} className="review-card d-flex gap-3">
              <Avatar user={r.user} />
              <div>
                <div className="fw-bold small">{r.user.name}</div>
                <div className="d-flex gap-2 align-items-center"><StarRating value={r.rating} size="0.75rem" /><span className="fs-8 text-muted-2">{timeAgo(r.createdAt)}</span></div>
                {r.comment && <p className="small mb-0 mt-1">{r.comment}</p>}
                <ReportButton targetType="REVIEW" targetId={r.id} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
