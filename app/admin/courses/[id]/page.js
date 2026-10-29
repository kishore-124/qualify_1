'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import VideoPlayer from '@/components/VideoPlayer';
import Avatar from '@/components/Avatar';
import StarRating from '@/components/StarRating';
import ReasonDialog from '@/components/admin/ReasonDialog';
import { formatMoney, formatPrice, effectivePrice, formatClock, formatDuration, formatDate, timeAgo, STATUS_BADGE, LEVELS, FALLBACK_THUMB } from '@/lib/utils';

const STATUS_TEXT = {
  DRAFT: 'Draft — the instructor hasn’t submitted it',
  PENDING: 'Waiting for your review',
  PUBLISHED: 'Live and for sale',
  REJECTED: 'Sent back to the instructor for changes',
  SUSPENDED: 'Taken down by an admin',
};

const REJECT_PRESETS = [
  'Audio quality is too low in several lectures.',
  'Description doesn’t match the content of the course.',
  'Some lectures are missing videos.',
  'Please add more depth — the course is too short for its price.',
];
const SUSPEND_PRESETS = [
  'Content copied from another creator without permission.',
  'Course is misleading — students report it doesn’t deliver what it promises.',
  'Asks students to pay or contact the instructor outside Qualify.',
  'High refund rate and repeated quality complaints.',
];

export default function CourseReviewPage({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [current, setCurrent] = useState(null);
  const [dialog, setDialog] = useState(null);

  const load = useCallback(
    () =>
      api(`/api/admin/courses/${id}`)
        .then((d) => {
          setData(d);
          setCurrent((c) => c || d.course.sections.flatMap((s) => s.lectures)[0] || null);
        })
        .catch((e) => toast.error(e.message)),
    [id]
  );
  useEffect(() => {
    load();
  }, [load]);

  const lectures = useMemo(() => (data ? data.course.sections.flatMap((s) => s.lectures) : []), [data]);

  const act = async (action, reason) => {
    try {
      await api(`/api/admin/courses/${id}`, { method: 'POST', body: { action, reason } });
      const msg = { approve: 'Approved and published', reject: 'Changes requested', suspend: 'Course taken down', restore: 'Course restored', unpublish: 'Moved to draft', feature: 'Featured on the home page', unfeature: 'No longer featured' };
      toast.success(msg[action]);
      load();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  };

  const toggleReview = async (r, reason) => {
    try {
      await api(`/api/admin/reviews/${r.id}`, { method: 'PATCH', body: { hidden: !r.hidden, reason } });
      toast.success(r.hidden ? 'Review restored' : 'Review hidden');
      load();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  };

  const removeQuestion = async (q, reason) => {
    try {
      await api(`/api/admin/discussions/${q.id}?type=QUESTION&reason=${encodeURIComponent(reason)}`, { method: 'DELETE' });
      toast.success('Question removed');
      load();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  };

  if (!data) return <div className="container-xl py-5"><div className="skeleton" style={{ height: 520 }} /></div>;
  const { course, stats, checks, reviews, reports, history, questions } = data;
  const passed = checks.filter((c) => c.ok).length;
  const openReports = reports.filter((r) => r.status === 'OPEN');
  const ins = course.instructor;

  return (
    <>
      <div className="player-topbar">
        <div className="container-xl py-3 d-flex flex-wrap align-items-center gap-3">
          <Link href="/admin?tab=review" className="text-white fs-5" aria-label="Back to admin"><i className="bi bi-arrow-left" /></Link>
          <div className="min-w-0 me-auto">
            <div className="small" style={{ color: 'rgba(255,255,255,.6)' }}>Course review</div>
            <div className="fw-bold text-truncate">{course.title}</div>
          </div>
          <span className={`badge bg-${STATUS_BADGE[course.status] || 'danger'}`}>{course.status}</span>
          <Link href={`/courses/${course.slug}`} target="_blank" className="btn btn-sm btn-outline-light">Landing page</Link>
          <Link href={`/learn/${course.slug}`} target="_blank" className="btn btn-sm btn-outline-light">Open player</Link>
        </div>
      </div>

      <div className="container-xl py-4">
        <div className="decision-bar mb-4">
          <div className="min-w-0">
            <div className="fw-bold">{STATUS_TEXT[course.status]}</div>
            {course.rejectReason && <div className="small text-muted-2">Last note to instructor: {course.rejectReason}</div>}
            {ins.status !== 'ACTIVE' && <div className="small text-danger fw-semibold">Instructor is {ins.status.toLowerCase()} — the course can’t be sold until they’re reactivated.</div>}
          </div>
          <div className="d-flex flex-wrap gap-2">
            {['PENDING', 'DRAFT', 'REJECTED'].includes(course.status) && (
              <button className="btn btn-success" onClick={() => act('approve')}><i className="bi bi-check-lg me-1" />Approve & publish</button>
            )}
            {['PENDING', 'DRAFT'].includes(course.status) && (
              <button className="btn btn-outline-primary" onClick={() => setDialog({ type: 'reject' })}>Request changes</button>
            )}
            {course.status === 'PUBLISHED' && (
              <>
                <button className="btn btn-soft" onClick={() => act(course.featured ? 'unfeature' : 'feature')}>
                  <i className={`bi ${course.featured ? 'bi-star-fill' : 'bi-star'} me-1`} />{course.featured ? 'Featured' : 'Feature'}
                </button>
                <button className="btn btn-ghost" onClick={() => setDialog({ type: 'unpublish' })}>Move to draft</button>
              </>
            )}
            {course.status === 'SUSPENDED' ? (
              <button className="btn btn-primary" onClick={() => act('restore')}>Restore course</button>
            ) : course.status !== 'DRAFT' && (
              <button className="btn btn-outline-danger" onClick={() => setDialog({ type: 'suspend' })}><i className="bi bi-slash-circle me-1" />Take down</button>
            )}
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="panel overflow-hidden mb-4">
              <div className="player-video">
                <VideoPlayer url={current?.videoUrl} poster={course.thumbnail} />
              </div>
              <div className="panel-body d-flex justify-content-between align-items-start gap-3">
                <div className="min-w-0">
                  <div className="fs-7 text-muted-2">Lecture {lectures.findIndex((l) => l.id === current?.id) + 1} of {lectures.length}</div>
                  <div className="fw-bold">{current?.title || 'No lectures yet'}</div>
                  {current?.description && <div className="small text-muted-2 mt-1">{current.description}</div>}
                </div>
                {current?.resourceUrl && <a className="btn btn-sm btn-soft text-nowrap" href={current.resourceUrl} target="_blank" rel="noreferrer">Resource <i className="bi bi-box-arrow-up-right" /></a>}
              </div>
            </div>

            <div className="panel mb-4">
              <div className="panel-header">
                <span className="fw-bold">Curriculum</span>
                <span className="fs-7 text-muted-2">{course.sections.length} sections · {stats.lectures} lectures · {formatDuration(stats.duration)}</span>
              </div>
              {course.sections.map((s, si) => (
                <div key={s.id}>
                  <div className="section-head">Section {si + 1}: {s.title}</div>
                  {s.lectures.length === 0 && <div className="px-3 py-2 small text-danger">Empty section</div>}
                  {s.lectures.map((l, li) => (
                    <button key={l.id} type="button" className={`lecture-item w-100 border-0 text-start bg-transparent ${current?.id === l.id ? 'active' : ''}`} onClick={() => setCurrent(l)}>
                      <i className={`bi ${l.videoUrl ? 'bi-play-circle' : 'bi-exclamation-triangle text-danger'}`} />
                      <div className="min-w-0 flex-grow-1">
                        <div className="small">{li + 1}. {l.title}</div>
                        <div className="fs-8 text-muted-2">{formatClock(l.duration)}{!l.videoUrl && ' · no video'}{l.resourceUrl && ' · has resource'}</div>
                      </div>
                      {l.isPreview && <span className="badge bg-soft text-primary">Free preview</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="panel mb-4">
              <div className="panel-header"><span className="fw-bold">Landing page content</span></div>
              <div className="panel-body">
                <div className="d-flex gap-3 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={course.thumbnail || FALLBACK_THUMB} alt="" className="rounded-3" style={{ width: 200, aspectRatio: '16/9', objectFit: 'cover' }} />
                  <div className="small">
                    <div className="fw-bold fs-6">{course.title}</div>
                    <div className="text-muted-2 mb-2">{course.subtitle || <span className="text-danger">No subtitle</span>}</div>
                    <div>{course.category?.name || <span className="text-danger">No category</span>} · {LEVELS[course.level]} · {course.language}</div>
                    <div className="mt-1"><b>{formatPrice(effectivePrice(course))}</b>{effectivePrice(course) < course.price && <span className="price-old ms-2">{formatPrice(course.price)}</span>}</div>
                  </div>
                </div>
                <h3 className="h6 fw-bold">Description</h3>
                <p className="small" style={{ whiteSpace: 'pre-line' }}>{course.description || <span className="text-danger">No description</span>}</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <h3 className="h6 fw-bold">Outcomes</h3>
                    <ul className="small mb-0">{course.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
                  </div>
                  <div className="col-md-6">
                    <h3 className="h6 fw-bold">Requirements</h3>
                    <ul className="small mb-0">{course.requirements.map((o) => <li key={o}>{o}</li>)}</ul>
                  </div>
                </div>
                {course.coupons.length > 0 && (
                  <div className="mt-3 small"><b>Coupons:</b> {course.coupons.map((c) => `${c.code} (${c.discountPercent}% · used ${c.usedCount})`).join(', ')}</div>
                )}
              </div>
            </div>

            <div className="panel mb-4" id="reviews">
              <div className="panel-header"><span className="fw-bold">Reviews</span><span className="fs-7 text-muted-2">{reviews.length} shown · hidden reviews don’t count toward the rating</span></div>
              <div className="panel-body pt-0">
                {reviews.length === 0 && <p className="text-muted-2 small mt-3 mb-0">No reviews yet.</p>}
                {reviews.map((r) => (
                  <div key={r.id} className={`review-card d-flex gap-3 ${r.hidden ? 'opacity-50' : ''}`}>
                    <Avatar user={r.user} />
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <Link href={`/admin/users/${r.user.id}`} className="fw-semibold small text-body">{r.user.name}</Link>
                        <StarRating value={r.rating} size="0.7rem" />
                        <span className="fs-8 text-muted-2">{timeAgo(r.createdAt)}</span>
                        {r.hidden && <span className="badge bg-secondary">Hidden</span>}
                        {reports.some((x) => x.targetType === 'REVIEW' && x.targetId === r.id && x.status === 'OPEN') && <span className="badge bg-danger">Reported</span>}
                      </div>
                      {r.comment && <p className="small mb-0 mt-1">{r.comment}</p>}
                    </div>
                    <button className="btn btn-sm btn-ghost text-nowrap align-self-start" onClick={() => (r.hidden ? toggleReview(r) : setDialog({ type: 'hide-review', review: r }))}>
                      {r.hidden ? 'Restore' : 'Hide'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Recent Q&A</span></div>
              <div className="panel-body pt-0">
                {questions.length === 0 && <p className="text-muted-2 small mt-3 mb-0">No questions yet.</p>}
                {questions.map((q) => (
                  <div key={q.id} className="review-card d-flex gap-3 align-items-start">
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold small">{q.title}</div>
                      {q.body && <div className="small text-muted-2">{q.body}</div>}
                      <div className="fs-8 text-muted-2">{q.user.name} · {timeAgo(q.createdAt)} · {q._count.answers} answers</div>
                    </div>
                    <button className="btn btn-sm btn-ghost text-danger" onClick={() => setDialog({ type: 'remove-question', question: q })}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4 d-grid gap-4 align-content-start">
            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Quality checks</span><span className={`badge ${passed === checks.length ? 'bg-success' : passed >= checks.length - 2 ? 'bg-warning' : 'bg-danger'}`}>{passed}/{checks.length}</span></div>
              <ul className="list-unstyled panel-body mb-0 d-grid gap-2 small">
                {checks.map((c) => (
                  <li key={c.label} className="d-flex gap-2">
                    <i className={`bi ${c.ok ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`} />
                    <span className={c.ok ? '' : 'fw-semibold'}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Instructor</span>{ins.status !== 'ACTIVE' && <span className="badge bg-danger">{ins.status}</span>}</div>
              <div className="panel-body">
                <div className="d-flex gap-3 align-items-center mb-3">
                  <Avatar user={ins} size="lg" />
                  <div className="min-w-0">
                    <div className="fw-bold">{ins.name}</div>
                    <div className="fs-7 text-muted-2 text-truncate">{ins.email}</div>
                    <div className="fs-8 text-muted-2">Joined {formatDate(ins.createdAt)} · {ins._count.courses} courses</div>
                  </div>
                </div>
                {ins.statusReason && <p className="small text-danger">{ins.statusReason}</p>}
                {ins.payoutsHeld && <p className="small"><span className="badge bg-warning me-1">Payouts on hold</span></p>}
                <Link href={`/admin/users/${ins.id}`} className="btn btn-outline-primary w-100">Instructor profile & actions</Link>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Sales</span></div>
              <dl className="summary-lines panel-body mb-0">
                <div><dt>Students</dt><dd>{course.studentCount}</dd></div>
                <div><dt>Paid sales</dt><dd>{stats.sales}</dd></div>
                <div><dt>Gross</dt><dd>{formatMoney(stats.gross)}</dd></div>
                <div><dt>Qualify fees</dt><dd>{formatMoney(stats.fees)}</dd></div>
                <div><dt>Refunds</dt><dd className={stats.refundRate >= 0.1 ? 'text-danger' : ''}>{stats.refunds} ({Math.round(stats.refundRate * 100)}%)</dd></div>
                <div><dt>Rating</dt><dd>{course.reviewCount ? `${course.avgRating.toFixed(1)} (${course.reviewCount})` : '—'}</dd></div>
              </dl>
            </div>

            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Reports</span>{openReports.length > 0 && <span className="badge bg-danger">{openReports.length} open</span>}</div>
              <div className="panel-body d-grid gap-2">
                {reports.length === 0 && <span className="small text-muted-2">No reports about this course or its reviews.</span>}
                {reports.slice(0, 8).map((r) => (
                  <div key={r.id} className="small">
                    <span className={`badge me-1 ${r.status === 'OPEN' ? 'bg-danger' : 'bg-secondary'}`}>{r.reason.replace('_', ' ').toLowerCase()}</span>
                    {r.targetType === 'REVIEW' ? 'on a review' : 'on the course'} · {r.reporter.name} · {timeAgo(r.createdAt)}
                    {r.details && <div className="text-muted-2">“{r.details}”</div>}
                  </div>
                ))}
                {openReports.length > 0 && <Link href="/admin?tab=reports" className="btn btn-sm btn-soft mt-1">Handle in reports queue</Link>}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><span className="fw-bold">Moderation history</span></div>
              <ol className="timeline panel-body mb-0">
                {history.length === 0 && <li className="small text-muted-2">No actions yet.</li>}
                {history.map((h) => (
                  <li key={h.id}>
                    <div className="small"><b>{h.action.replace('course.', '')}</b> by {h.admin.name}</div>
                    {h.reason && <div className="small text-muted-2">{h.reason}</div>}
                    <div className="fs-8 text-muted-2">{formatDate(h.createdAt)}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {dialog?.type === 'reject' && (
        <ReasonDialog title="Request changes" description="The course goes back to the instructor as “changes requested”. Tell them exactly what to fix." confirmLabel="Send back to instructor" presets={REJECT_PRESETS} onConfirm={(r) => act('reject', r)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'suspend' && (
        <ReasonDialog title="Take this course down" description="The course is removed from the catalog and from every cart immediately. Students who already bought it keep access. Only an admin can restore it." confirmLabel="Take down course" danger presets={SUSPEND_PRESETS} onConfirm={(r) => act('suspend', r)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'unpublish' && (
        <ReasonDialog title="Move to draft" description="The instructor can edit and resubmit it." confirmLabel="Move to draft" requireReason={false} onConfirm={(r) => act('unpublish', r)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'hide-review' && (
        <ReasonDialog title="Hide this review" description={`“${dialog.review.comment || `${dialog.review.rating}★`}” — the reviewer is notified and the course rating is recalculated.`} confirmLabel="Hide review" presets={['Spam or advertising', 'Abusive language', 'Not about the course', 'Fake review']} onConfirm={(r) => toggleReview(dialog.review, r)} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'remove-question' && (
        <ReasonDialog title="Remove question" description={`“${dialog.question.title}” and its answers will be deleted.`} confirmLabel="Remove" danger presets={['Spam or advertising', 'Abusive language', 'Shares paid content illegally']} onConfirm={(r) => removeQuestion(dialog.question, r)} onClose={() => setDialog(null)} />
      )}
    </>
  );
}
