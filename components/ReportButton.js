'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { useAuth } from './Providers';

const REASONS = {
  COURSE: [
    ['MISLEADING', 'Course isn’t what it promises'],
    ['LOW_QUALITY', 'Very low quality or unfinished'],
    ['COPYRIGHT', 'Uses someone else’s content'],
    ['SCAM', 'Scam or asks for payment outside Qualify'],
    ['INAPPROPRIATE', 'Offensive or inappropriate'],
    ['OTHER', 'Something else'],
  ],
  DEFAULT: [
    ['SPAM', 'Spam or advertising'],
    ['INAPPROPRIATE', 'Offensive, hateful or harassing'],
    ['MISLEADING', 'Fake or misleading'],
    ['SCAM', 'Scam or suspicious links'],
    ['OTHER', 'Something else'],
  ],
};

/** Lets any logged-in user flag a course, review, question, answer or user for the moderation team. */
export default function ReportButton({ targetType, targetId, label = 'Report', className = 'btn btn-link btn-sm p-0 text-muted-2 fs-8' }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const reasons = REASONS[targetType] || REASONS.DEFAULT;

  const start = () => {
    if (!user) return router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api('/api/reports', { method: 'POST', body: { targetType, targetId, reason, details } });
      toast.success(d.duplicate ? 'You already reported this — our team is on it.' : 'Thanks. Our moderation team will review this.');
      setOpen(false);
      setReason('');
      setDetails('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={start}>
        <i className="bi bi-flag me-1" />{label}
      </button>
      {open && (
        <div className="modal-backdrop-lh" onClick={() => setOpen(false)}>
          <form className="modal-panel" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <span className="fw-bold">Report {targetType.toLowerCase()}</span>
              <button type="button" className="btn-close" onClick={() => setOpen(false)} aria-label="Close" />
            </div>
            <div className="p-4 d-grid gap-2">
              <p className="small text-muted-2 mb-1">What’s the problem? Reports are anonymous to the person you report.</p>
              {reasons.map(([value, text]) => (
                <label key={value} className={`role-option d-flex align-items-center gap-2 py-2 ${reason === value ? 'active' : ''}`}>
                  <input type="radio" className="form-check-input m-0" name="reason" checked={reason === value} onChange={() => setReason(value)} />
                  <span className="small fw-semibold">{text}</span>
                </label>
              ))}
              <textarea className="form-control mt-2" rows={3} maxLength={2000} placeholder={reason === 'OTHER' ? 'Tell us what’s wrong (required)' : 'Anything else we should know? (optional)'} value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <div className="p-3 border-top d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!reason || busy || (reason === 'OTHER' && !details.trim())}>{busy ? 'Sending…' : 'Send report'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
