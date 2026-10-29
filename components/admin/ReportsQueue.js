'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { timeAgo } from '@/lib/utils';

const REASON = {
  SPAM: 'Spam', INAPPROPRIATE: 'Inappropriate', COPYRIGHT: 'Copyright', MISLEADING: 'Misleading',
  SCAM: 'Scam', LOW_QUALITY: 'Low quality', OTHER: 'Other',
};

/** Which actions make sense for each kind of reported content. */
const ACTIONS = {
  COURSE: [['suspend-course', 'Take course down'], ['warn-user', 'Warn instructor'], ['suspend-user', 'Pause instructor']],
  REVIEW: [['hide-review', 'Hide review'], ['warn-user', 'Warn author']],
  QUESTION: [['remove-content', 'Remove question'], ['warn-user', 'Warn author']],
  ANSWER: [['remove-content', 'Remove answer'], ['warn-user', 'Warn author']],
  USER: [['warn-user', 'Warn user'], ['suspend-user', 'Pause user']],
};

export default function ReportsQueue({ onChange }) {
  const [status, setStatus] = useState('OPEN');
  const [data, setData] = useState(null);
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setData(null);
    api(`/api/admin/reports?status=${status}`).then(setData).catch((e) => toast.error(e.message));
  }, [status]);
  useEffect(() => {
    load();
  }, [load]);

  const handle = async (item, newStatus, action = 'none') => {
    const note = notes[item.key]?.trim();
    if (action !== 'none' && (!note || note.length < 5)) {
      toast.error('Add a short note — it’s sent to the user and saved in the log.');
      return;
    }
    setBusy(item.key);
    try {
      await api(`/api/admin/reports/${item.reports[0].id}`, { method: 'PATCH', body: { status: newStatus, action, resolution: note, reason: note } });
      toast.success(newStatus === 'DISMISSED' ? 'Report dismissed' : 'Action taken and report resolved');
      load();
      onChange?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[['OPEN', 'Open'], ['RESOLVED', 'Resolved'], ['DISMISSED', 'Dismissed']].map(([k, l]) => (
          <button key={k} className={`chip ${status === k ? 'active' : ''}`} onClick={() => setStatus(k)}>
            {l} {data?.counts?.[k] ? <span className="fs-8">({data.counts[k]})</span> : null}
          </button>
        ))}
      </div>

      {!data && <div className="skeleton" style={{ height: 240 }} />}
      {data?.items.length === 0 && (
        <div className="panel p-5 text-center">
          <i className="bi bi-shield-check fs-1 text-success" />
          <h2 className="h5 fw-bold mt-2">{status === 'OPEN' ? 'No open reports' : 'Nothing here yet'}</h2>
          <p className="text-muted-2 mb-0">Reports from students about courses, reviews and Q&A appear here.</p>
        </div>
      )}

      <div className="d-grid gap-3">
        {data?.items.map((item) => (
          <div key={item.key} className={`report-card ${item.reports.length >= 3 ? 'urgent' : ''}`}>
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <div className="min-w-0">
                <span className="badge bg-secondary me-2">{item.targetType.toLowerCase()}</span>
                {item.target ? (
                  <Link href={item.target.link} className="fw-bold text-body">{item.target.name}</Link>
                ) : (
                  <span className="fw-bold text-muted-2">Content was deleted</span>
                )}
                {item.target?.hidden && <span className="badge bg-secondary ms-2">hidden</span>}
              </div>
              <div className="small text-muted-2">
                <b className={item.reports.length >= 3 ? 'text-danger' : ''}>{item.reports.length} report{item.reports.length > 1 ? 's' : ''}</b> · latest {timeAgo(item.latest)}
              </div>
            </div>
            {item.target?.excerpt && <blockquote className="report-excerpt">{item.target.excerpt}</blockquote>}
            <div className="d-flex flex-wrap gap-1 mb-2">
              {item.reasons.map((r) => <span key={r} className="tag-highlight">{REASON[r]}</span>)}
            </div>
            <ul className="list-unstyled small mb-3 d-grid gap-1">
              {item.reports.slice(0, 4).map((r) => (
                <li key={r.id}>
                  <b>{r.reporter.name}</b>: {REASON[r.reason]}{r.details ? ` — “${r.details}”` : ''} <span className="text-muted-2">· {timeAgo(r.createdAt)}</span>
                </li>
              ))}
              {item.reports.length > 4 && <li className="text-muted-2">+ {item.reports.length - 4} more</li>}
            </ul>

            {status === 'OPEN' ? (
              <>
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="Note for the user and the activity log (needed when you take action)"
                  value={notes[item.key] || ''}
                  onChange={(e) => setNotes({ ...notes, [item.key]: e.target.value })}
                />
                <div className="d-flex flex-wrap gap-2">
                  {item.target && (ACTIONS[item.targetType] || []).map(([a, label]) => (
                    <button key={a} className={`btn btn-sm ${a.startsWith('suspend') ? 'btn-outline-danger' : 'btn-outline-primary'}`} disabled={busy === item.key} onClick={() => handle(item, 'RESOLVED', a)}>
                      {label}
                    </button>
                  ))}
                  <button className="btn btn-sm btn-soft" disabled={busy === item.key} onClick={() => handle(item, 'RESOLVED')}>Resolved, no action</button>
                  <button className="btn btn-sm btn-ghost ms-auto" disabled={busy === item.key} onClick={() => handle(item, 'DISMISSED')}>Dismiss</button>
                </div>
              </>
            ) : (
              <div className="small text-muted-2">
                {item.reports[0].status.toLowerCase()} by {item.reports[0].handledBy?.name || '—'}
                {item.reports[0].resolution && <> — {item.reports[0].resolution}</>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
