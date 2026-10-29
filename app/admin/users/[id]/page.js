'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import Avatar from '@/components/Avatar';
import ReasonDialog from '@/components/admin/ReasonDialog';
import { formatMoney, formatPrice, effectivePrice, formatDate, timeAgo, STATUS_BADGE, FALLBACK_THUMB } from '@/lib/utils';

const STATUS_STYLE = { ACTIVE: 'bg-success', SUSPENDED: 'bg-warning', BANNED: 'bg-danger' };

const DIALOGS = {
  warn: {
    title: 'Send a warning',
    description: 'They get a notification with your message. Nothing else changes.',
    confirmLabel: 'Send warning',
    presets: ['Please keep Q&A replies respectful.', 'Course descriptions must match what students get.', 'Don’t ask students to pay outside Qualify.'],
  },
  suspend: {
    title: 'Pause this instructor',
    description: 'Their courses disappear from the catalog and carts, and they can’t create or edit courses. Students who bought their courses keep access. You can reactivate them at any time.',
    confirmLabel: 'Pause instructor',
    danger: true,
    holdOption: true,
    presets: ['Multiple courses reported as copied content.', 'Refund rate far above the platform average.', 'Repeated policy violations after warnings.', 'Account under review for suspicious sales.'],
  },
  ban: {
    title: 'Ban this account',
    description: 'They are signed out everywhere and can’t log in. Their courses come off sale and payouts are held. Use this for fraud or serious abuse.',
    confirmLabel: 'Ban account',
    danger: true,
    presets: ['Fraudulent activity.', 'Selling stolen or pirated content.', 'Harassment of students.'],
  },
  'hold-payouts': {
    title: 'Hold payouts',
    description: 'Earnings keep being recorded but won’t be sent until you release them.',
    confirmLabel: 'Hold payouts',
    presets: ['Reviewing recent sales for chargebacks.', 'Verifying payout account details.'],
  },
};

export default function AdminUserPage({ params }) {
  const { id } = use(params);
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => api(`/api/admin/users/${id}`).then(setData).catch((e) => toast.error(e.message)), [id]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (action, reason, extra = {}) => {
    try {
      await api(`/api/admin/users/${id}`, { method: 'POST', body: { action, reason, ...extra } });
      const msg = { warn: 'Warning sent', suspend: 'Instructor paused', ban: 'Account banned', reactivate: 'Account reactivated', 'hold-payouts': 'Payouts held', 'release-payouts': 'Payouts released', role: 'Role updated' };
      toast.success(msg[action]);
      load();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  };

  if (!data) return <div className="container-xl py-5"><div className="skeleton" style={{ height: 520 }} /></div>;
  const { user, courses, stats, signals, reports, history, reviews, orders } = data;
  const isTeacher = user.role !== 'STUDENT';
  const isSelf = me?.id === user.id;
  const d = dialog && DIALOGS[dialog];

  return (
    <>
      <section className="dash-header">
        <div className="container-xl">
          <Link href="/admin?tab=users" className="small text-decoration-none"><i className="bi bi-arrow-left me-1" />All users</Link>
          <div className="d-flex flex-wrap align-items-center gap-3 mt-3">
            <Avatar user={user} size="lg" />
            <div className="min-w-0 me-auto">
              <h1 className="page-title mb-1">{user.name}</h1>
              <div className="text-muted-2">{user.email} · {user.role.toLowerCase()} · joined {formatDate(user.createdAt)}</div>
            </div>
            <span className={`badge fs-6 ${STATUS_STYLE[user.status]}`}>{user.status}</span>
          </div>
        </div>
      </section>

      <div className="container-xl dash-body pb-5">
        {user.status !== 'ACTIVE' && (
          <div className={`alert ${user.status === 'BANNED' ? 'alert-danger' : 'alert-warning'} d-flex flex-wrap justify-content-between align-items-center gap-2`}>
            <div>
              <b>{user.status === 'BANNED' ? 'Banned' : 'Paused'}</b> {user.statusChangedAt && `since ${formatDate(user.statusChangedAt)}`}
              {user.statusReason && <> — {user.statusReason}</>}
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => act('reactivate')}>Reactivate account</button>
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8 d-grid gap-4 align-content-start">
            {isTeacher && (
              <div className="row g-3">
                {signals.map((s) => (
                  <div className="col-6 col-md-3" key={s.label}>
                    <div className={`signal signal-${s.level}`} title={s.hint}>
                      <div className="small text-muted-2 fw-semibold">{s.label}</div>
                      <div className="value">{s.value}</div>
                      <div className="fs-8">{s.level === 'ok' ? 'Looks normal' : s.level === 'medium' ? 'Worth a look' : 'Needs attention'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isTeacher && (
              <div className="panel">
                <div className="panel-header"><span className="fw-bold">Courses ({courses.length})</span></div>
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead><tr><th>Course</th><th>Status</th><th className="text-end">Price</th><th className="text-end">Students</th><th className="text-end">Rating</th><th /></tr></thead>
                    <tbody>
                      {courses.length === 0 && <tr><td colSpan={6} className="text-center text-muted-2 py-4">No courses yet.</td></tr>}
                      {courses.map((c) => (
                        <tr key={c.id}>
                          <td style={{ minWidth: 240 }}>
                            <div className="d-flex align-items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={c.thumbnail || FALLBACK_THUMB} alt="" className="thumb-sm" />
                              <div className="min-w-0">
                                <div className="small fw-semibold line-clamp-2">{c.title}</div>
                                {c.rejectReason && <div className="fs-8 text-danger">{c.rejectReason}</div>}
                              </div>
                            </div>
                          </td>
                          <td><span className={`badge bg-${STATUS_BADGE[c.status] || 'danger'}`}>{c.status}</span></td>
                          <td className="text-end small">{formatPrice(effectivePrice(c))}</td>
                          <td className="text-end">{c.studentCount}</td>
                          <td className="text-end small">{c.reviewCount ? `${c.avgRating.toFixed(1)} (${c.reviewCount})` : '—'}</td>
                          <td className="text-end"><Link href={`/admin/courses/${c.id}`} className="btn btn-sm btn-soft">Review</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Reports involving this user</span><span className="fs-7 text-muted-2">{reports.length}</span></div>
              <div className="panel-body d-grid gap-2">
                {reports.length === 0 && <span className="small text-muted-2">No reports.</span>}
                {reports.map((r) => (
                  <div key={r.id} className="small d-flex gap-2 align-items-start">
                    <span className={`badge ${r.status === 'OPEN' ? 'bg-danger' : 'bg-secondary'}`}>{r.status.toLowerCase()}</span>
                    <div>
                      <b>{r.reason.replace('_', ' ').toLowerCase()}</b> on a {r.targetType.toLowerCase()} · by {r.reporter.name} · {timeAgo(r.createdAt)}
                      {r.details && <div className="text-muted-2">“{r.details}”</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="panel h-100">
                  <div className="panel-header"><span className="fw-bold">Recent reviews written</span></div>
                  <div className="panel-body d-grid gap-2">
                    {reviews.length === 0 && <span className="small text-muted-2">None.</span>}
                    {reviews.map((r) => (
                      <div key={r.id} className={`small ${r.hidden ? 'opacity-50' : ''}`}>
                        <b>{r.rating}★</b> on <Link href={`/admin/courses/${r.course.id}#reviews`}>{r.course.title}</Link>{r.hidden && ' (hidden)'}
                        {r.comment && <div className="text-muted-2 line-clamp-2">{r.comment}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="panel h-100">
                  <div className="panel-header"><span className="fw-bold">Recent purchases</span></div>
                  <div className="panel-body d-grid gap-2">
                    {orders.length === 0 && <span className="small text-muted-2">None.</span>}
                    {orders.map((o) => (
                      <div key={o.id} className="small d-flex justify-content-between">
                        <span><code>{o.paymentRef}</code> · {formatDate(o.createdAt)}</span>
                        <span className={o.status === 'REFUNDED' ? 'text-danger' : ''}>{formatMoney(o.total)} {o.status === 'REFUNDED' && '(refunded)'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4 d-grid gap-4 align-content-start">
            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Actions</span></div>
              <div className="panel-body d-grid gap-2">
                {isSelf ? (
                  <p className="small text-muted-2 mb-0">This is your own account.</p>
                ) : user.role === 'ADMIN' ? (
                  <p className="small text-muted-2 mb-0">Change this admin’s role below before taking moderation actions.</p>
                ) : (
                  <>
                    <button className="btn btn-outline-primary" onClick={() => setDialog('warn')}><i className="bi bi-exclamation-triangle me-1" />Send a warning</button>
                    {user.status === 'ACTIVE' && isTeacher && <button className="btn btn-outline-danger" onClick={() => setDialog('suspend')}><i className="bi bi-pause-circle me-1" />Pause instructor</button>}
                    {user.status !== 'BANNED' && <button className="btn btn-danger" onClick={() => setDialog('ban')}><i className="bi bi-slash-circle me-1" />Ban account</button>}
                    {user.status !== 'ACTIVE' && <button className="btn btn-primary" onClick={() => act('reactivate')}>Reactivate account</button>}
                    {isTeacher && (user.payoutsHeld
                      ? <button className="btn btn-soft" onClick={() => act('release-payouts')}>Release payouts</button>
                      : <button className="btn btn-ghost" onClick={() => setDialog('hold-payouts')}>Hold payouts</button>)}
                  </>
                )}
                {!isSelf && (
                  <div className="mt-2">
                    <label className="form-label small" htmlFor="role">Role</label>
                    <select id="role" className="form-select" value={user.role} onChange={(e) => act('role', null, { role: e.target.value })}>
                      <option value="STUDENT">Student</option>
                      <option value="INSTRUCTOR">Instructor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {isTeacher && (
              <div className="panel">
                <div className="panel-header"><span className="fw-bold">Money</span>{user.payoutsHeld && <span className="badge bg-warning">Payouts held</span>}</div>
                <dl className="summary-lines panel-body mb-0">
                  <div><dt>Sales</dt><dd>{stats.sales}</dd></div>
                  <div><dt>Gross</dt><dd>{formatMoney(stats.gross)}</dd></div>
                  <div><dt>Instructor earned</dt><dd>{formatMoney(stats.earned)}</dd></div>
                  <div><dt>Paid out</dt><dd>{formatMoney(stats.paidOut)}</dd></div>
                  <div><dt>Pending</dt><dd>{formatMoney(stats.pending)}</dd></div>
                  <div><dt>Refunded sales</dt><dd>{stats.refunded}</dd></div>
                  <div><dt>Stripe</dt><dd>{user.payoutsEnabled ? 'Ready' : user.stripeAccountId ? 'Onboarding' : 'Not connected'}</dd></div>
                </dl>
              </div>
            )}

            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Activity</span></div>
              <dl className="summary-lines panel-body mb-0">
                <div><dt>Enrollments</dt><dd>{user._count.enrollments}</dd></div>
                <div><dt>Reviews</dt><dd>{user._count.reviews}</dd></div>
                <div><dt>Questions asked</dt><dd>{user._count.questions}</dd></div>
                <div><dt>Reports filed</dt><dd>{user._count.reportsFiled}</dd></div>
              </dl>
            </div>

            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Moderation history</span></div>
              <ol className="timeline panel-body mb-0">
                {history.length === 0 && <li className="small text-muted-2">No actions yet.</li>}
                {history.map((h) => (
                  <li key={h.id}>
                    <div className="small"><b>{h.action.replace('user.', '').replace('-', ' ')}</b> by {h.admin.name}</div>
                    {h.reason && <div className="small text-muted-2">{h.reason}</div>}
                    <div className="fs-8 text-muted-2">{formatDate(h.createdAt)}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {d && (
        <ReasonDialog
          {...d}
          onConfirm={(reason, extra) => act(dialog, reason, dialog === 'suspend' ? { holdPayouts: extra.holdPayouts } : {})}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
