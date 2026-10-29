'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import EmptyState from '@/components/EmptyState';
import StarRating from '@/components/StarRating';
import Avatar from '@/components/Avatar';
import { formatMoney, formatPrice, effectivePrice, STATUS_BADGE, timeAgo, formatDate, FALLBACK_THUMB } from '@/lib/utils';

const BarLineChart = dynamic(() => import('@/components/charts/BarLineChart'), { ssr: false, loading: () => <div className="skeleton" style={{ height: 300 }} /> });

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('courses');
  const [students, setStudents] = useState(null);
  const [coupons, setCoupons] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: 20, courseId: '', maxUses: '', expiresAt: '' });

  const load = () => api('/api/instructor/stats').then(setData).catch((e) => toast.error(e.message));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (tab === 'students' && !students) api('/api/instructor/students').then((d) => setStudents(d.enrollments));
    if (tab === 'coupons' && !coupons) api('/api/coupons').then((d) => setCoupons(d.coupons));
  }, [tab, students, coupons]);

  const createCoupon = async (e) => {
    e.preventDefault();
    try {
      const { coupon } = await api('/api/coupons', { method: 'POST', body: couponForm });
      setCoupons((c) => [coupon, ...(c || [])]);
      setCouponForm({ code: '', discountPercent: 20, courseId: '', maxUses: '', expiresAt: '' });
      toast.success('Coupon created');
    } catch (err) {
      toast.error(err.message);
    }
  };
  const toggleCoupon = async (c) => {
    await api(`/api/coupons/${c.id}`, { method: 'PATCH', body: { active: !c.active } });
    setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
  };
  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    await api(`/api/coupons/${id}`, { method: 'DELETE' });
    setCoupons((list) => list.filter((x) => x.id !== id));
  };

  const t = data?.totals;

  return (
    <>
      <section className="dash-header">
        <div className="container-xl d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="text-white-50 small mb-1">Instructor dashboard</div>
            <h1 className="fw-bold mb-0">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          </div>
          <div className="d-flex gap-2"><Link href="/instructor/earnings" className="btn btn-outline-primary btn-lg"><i className="bi bi-wallet2 me-1" />Earnings & payouts</Link><Link href="/instructor/courses/new" className="btn btn-primary btn-lg"><i className="bi bi-plus-lg me-1" />New course</Link></div>
        </div>
      </section>

      <div className="container-xl dash-body pb-5">
        {user && user.status !== 'ACTIVE' && user.role !== 'ADMIN' && (
          <div className="alert alert-danger">
            <b>Your instructor account is paused.</b> {user.statusReason} Your courses aren’t for sale and you can’t edit them right now. Existing students keep access.
            Contact <a href="mailto:support@qualify.dev">support@qualify.dev</a> to appeal.
          </div>
        )}
        <div className="row g-3 mb-4">
          {[
            ['bi-wallet2', '#fff7d1', '#1b1f3b', t ? formatMoney(t.revenue) : '—', 'Your earnings', t ? `${t.sales} sales · ${formatMoney(t.gross)} gross` : ''],
            ['bi-people', '#eef0fe', '#2b3fe0', t?.students ?? '—', 'Total students', t ? `+${t.newStudents} last 30 days` : ''],
            ['bi-star', '#fff7d1', '#b58900', t ? t.avgRating.toFixed(1) : '—', 'Instructor rating', t ? `${t.reviews} reviews` : ''],
            ['bi-collection-play', '#ddf5e6', '#12a150', t?.courses ?? '—', 'Courses', t ? `${t.published} published` : ''],
          ].map(([icon, bg, color, value, label, sub]) => (
            <div className="col-6 col-lg-3" key={label}>
              <div className="stat-card">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="small text-muted-2 fw-semibold">{label}</span>
                  <span className="ico" style={{ background: bg, color }}><i className={`bi ${icon}`} /></span>
                </div>
                <div className="value">{value}</div>
                <div className="fs-7 text-muted-2">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="panel h-100">
              <div className="panel-header"><span className="fw-bold">Your earnings — last 6 months</span></div>
              <div className="panel-body">
                {data ? <BarLineChart labels={data.monthly.map((m) => m.label)} revenue={data.monthly.map((m) => m.revenue)} counts={data.monthly.map((m) => m.sales)} amountLabel="Earnings" /> : <div className="skeleton" style={{ height: 300 }} />}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="panel h-100">
              <div className="panel-header"><span className="fw-bold">Unanswered questions</span><span className="badge bg-danger">{data?.openQuestions.length || 0}</span></div>
              <div className="panel-body d-grid gap-3">
                {data?.openQuestions.length === 0 && <div className="text-muted-2 small text-center py-4"><i className="bi bi-emoji-smile fs-3 d-block mb-1" />All caught up!</div>}
                {data?.openQuestions.map((q) => (
                  <Link key={q.id} href={`/learn/${q.course.slug}?lecture=${q.lectureId}&tab=qa`} className="text-decoration-none text-body">
                    <div className="fw-semibold small line-clamp-2">{q.title}</div>
                    <div className="fs-8 text-muted-2">{q.user.name} • {q.course.title} • {timeAgo(q.createdAt)}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ul className="nav tabs-lh mb-4">
          {[['courses', 'My courses'], ['students', 'Students'], ['reviews', 'Reviews'], ['coupons', 'Coupons']].map(([k, l]) => (
            <li className="nav-item" key={k}><button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button></li>
          ))}
        </ul>

        {tab === 'courses' && (
          data?.courses.length === 0 ? (
            <EmptyState icon="bi-camera-video" title="Create your first course" text="Build your curriculum, upload videos and publish to students around the world." actionHref="/instructor/courses/new" actionLabel="Create course" />
          ) : (
            <div className="panel">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead><tr><th>Course</th><th>Status</th><th>Price</th><th>Students</th><th>Rating</th><th>Revenue</th><th></th></tr></thead>
                  <tbody>
                    {data?.courses.map((c) => (
                      <tr key={c.id}>
                        <td style={{ minWidth: 260 }}>
                          <div className="d-flex align-items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.thumbnail || FALLBACK_THUMB} alt="" className="thumb-sm" />
                            <div className="min-w-0">
                              <div className="fw-semibold line-clamp-2">{c.title}</div>
                              <div className="fs-8 text-muted-2">Updated {formatDate(c.updatedAt)}</div>
                              {c.status === 'REJECTED' && c.rejectReason && <div className="fs-8 text-danger">{c.rejectReason}</div>}
                            </div>
                          </div>
                        </td>
                        <td><span className={`badge bg-${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                        <td>{formatPrice(effectivePrice(c))}</td>
                        <td>{c.studentCount}</td>
                        <td>{c.reviewCount ? <StarRating value={c.avgRating} showValue size="0.7rem" /> : <span className="text-muted-2 small">—</span>}</td>
                        <td className="fw-semibold">{formatMoney(c.revenue)}</td>
                        <td className="text-end text-nowrap">
                          <Link href={`/instructor/courses/${c.id}`} className="btn btn-sm btn-soft me-1"><i className="bi bi-pencil" /> Edit</Link>
                          <Link href={`/courses/${c.slug}`} className="btn btn-sm btn-link"><i className="bi bi-eye" /></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {tab === 'students' && (
          <div className="panel">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>Student</th><th>Course</th><th>Enrolled</th><th style={{ width: 200 }}>Progress</th></tr></thead>
                <tbody>
                  {!students && <tr><td colSpan={4}><div className="skeleton" style={{ height: 40 }} /></td></tr>}
                  {students?.length === 0 && <tr><td colSpan={4} className="text-center text-muted-2 py-4">No students yet</td></tr>}
                  {students?.map((e) => (
                    <tr key={e.id}>
                      <td><div className="d-flex align-items-center gap-2"><Avatar user={e.user} /><div><div className="fw-semibold small">{e.user.name}</div><div className="fs-8 text-muted-2">{e.user.email}</div></div></div></td>
                      <td className="small">{e.course.title}</td>
                      <td className="small text-nowrap">{formatDate(e.createdAt)}</td>
                      <td><div className="d-flex align-items-center gap-2"><div className="progress flex-grow-1" style={{ height: 6 }}><div className="progress-bar" style={{ width: `${e.progress}%` }} /></div><span className="fs-8">{e.progress}%</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="panel panel-body">
            {data?.recentReviews.length === 0 && <div className="text-muted-2 text-center py-4">No reviews yet</div>}
            {data?.recentReviews.map((r) => (
              <div key={r.id} className="review-card d-flex gap-3">
                <Avatar user={r.user} />
                <div>
                  <div className="fw-bold small">{r.user.name} <span className="fw-normal text-muted-2">on</span> <Link href={`/courses/${r.course.slug}`}>{r.course.title}</Link></div>
                  <div className="d-flex gap-2 align-items-center"><StarRating value={r.rating} size="0.75rem" /><span className="fs-8 text-muted-2">{timeAgo(r.createdAt)}</span></div>
                  {r.comment && <p className="small mb-0 mt-1">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'coupons' && (
          <div className="row g-4">
            <div className="col-lg-4">
              <form className="panel" onSubmit={createCoupon}>
                <div className="panel-header"><span className="fw-bold">New coupon</span></div>
                <div className="panel-body d-grid gap-3">
                  <div><label className="form-label">Code</label><input className="form-control text-uppercase" required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="SUMMER30" /></div>
                  <div><label className="form-label">Course</label>
                    <select className="form-select" required value={couponForm.courseId} onChange={(e) => setCouponForm({ ...couponForm, courseId: e.target.value })}>
                      <option value="">Select course</option>
                      {data?.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div><label className="form-label">Discount: {couponForm.discountPercent}%</label><input type="range" className="form-range" min={5} max={100} step={5} value={couponForm.discountPercent} onChange={(e) => setCouponForm({ ...couponForm, discountPercent: e.target.value })} /></div>
                  <div className="row g-2">
                    <div className="col-6"><label className="form-label">Max uses</label><input type="number" min={1} className="form-control" value={couponForm.maxUses} onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })} placeholder="∞" /></div>
                    <div className="col-6"><label className="form-label">Expires</label><input type="date" className="form-control" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} /></div>
                  </div>
                  <button className="btn btn-primary">Create coupon</button>
                </div>
              </form>
            </div>
            <div className="col-lg-8">
              <div className="panel">
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead><tr><th>Code</th><th>Course</th><th>Off</th><th>Used</th><th>Expires</th><th>Active</th><th></th></tr></thead>
                    <tbody>
                      {coupons?.length === 0 && <tr><td colSpan={7} className="text-center text-muted-2 py-4">No coupons yet</td></tr>}
                      {coupons?.map((c) => (
                        <tr key={c.id}>
                          <td><code className="fw-bold">{c.code}</code></td>
                          <td className="small">{c.course?.title || 'All courses'}</td>
                          <td>{c.discountPercent}%</td>
                          <td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                          <td className="small">{c.expiresAt ? formatDate(c.expiresAt) : '—'}</td>
                          <td><div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" checked={c.active} onChange={() => toggleCoupon(c)} /></div></td>
                          <td><button className="btn btn-sm btn-link text-danger" onClick={() => deleteCoupon(c.id)}><i className="bi bi-trash" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
