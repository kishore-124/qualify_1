'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import EmptyState from '@/components/EmptyState';
import { formatDate, formatMoney, FALLBACK_THUMB } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') || 'learning';
  const [enrollments, setEnrollments] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
  const [certificates, setCertificates] = useState(null);
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api('/api/enrollments').then((d) => { setEnrollments(d.enrollments); setStats(d.stats); }).catch(() => setEnrollments([]));
    api('/api/certificates').then((d) => setCertificates(d.certificates)).catch(() => setCertificates([]));
    api('/api/orders').then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, []);

  const setTab = (t) => router.replace(`/dashboard${t === 'learning' ? '' : `?tab=${t}`}`, { scroll: false });

  const shown = (enrollments || []).filter((e) =>
    filter === 'all' ? true : filter === 'completed' ? e.progress >= 100 : filter === 'progress' ? e.progress > 0 && e.progress < 100 : e.progress === 0
  );
  const continueCourse = (enrollments || []).find((e) => e.progress > 0 && e.progress < 100);

  return (
    <>
      <section className="dash-header">
        <div className="container-xl">
          <div className="text-white-50 small mb-1">My learning</div>
          <h1 className="fw-bold mb-0">Hi {user?.name?.split(' ')[0] || 'there'}, keep up the momentum! 🚀</h1>
        </div>
      </section>

      <div className="container-xl dash-body pb-5">
        <div className="row g-3 mb-4">
          {[
            ['bi-collection-play', '#eef0fe', '#2b3fe0', stats.total, 'Enrolled courses'],
            ['bi-hourglass-split', '#fff7d1', '#b58900', stats.inProgress, 'In progress'],
            ['bi-check2-circle', '#ddf5e6', '#12a150', stats.completed, 'Completed'],
            ['bi-award', '#fff7d1', '#1b1f3b', certificates?.length || 0, 'Certificates'],
          ].map(([icon, bg, color, value, label]) => (
            <div className="col-6 col-lg-3" key={label}>
              <div className="stat-card d-flex align-items-center gap-3">
                <span className="ico" style={{ background: bg, color }}><i className={`bi ${icon}`} /></span>
                <div><div className="value">{value}</div><div className="small text-muted-2">{label}</div></div>
              </div>
            </div>
          ))}
        </div>

        {continueCourse && tab === 'learning' && (
          <div className="panel p-3 p-md-4 mb-4 d-flex flex-wrap align-items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={continueCourse.course.thumbnail || FALLBACK_THUMB} alt="" className="rounded-3" style={{ width: 140, aspectRatio: '16/9', objectFit: 'cover' }} />
            <div className="flex-grow-1 min-w-0">
              <div className="eyebrow">Continue where you left off</div>
              <div className="fw-bold fs-5 text-truncate">{continueCourse.course.title}</div>
              <div className="d-flex align-items-center gap-2 mt-2" style={{ maxWidth: 360 }}>
                <div className="progress flex-grow-1" style={{ height: 8 }}><div className="progress-bar" style={{ width: `${continueCourse.progress}%` }} /></div>
                <span className="small fw-semibold">{continueCourse.progress}%</span>
              </div>
            </div>
            <Link href={`/learn/${continueCourse.course.slug}`} className="btn btn-primary btn-lg"><i className="bi bi-play-fill me-1" />Resume</Link>
          </div>
        )}

        <ul className="nav tabs-lh mb-4">
          {[
            ['learning', 'All courses'],
            ['certificates', 'Certificates'],
            ['purchases', 'Purchase history'],
          ].map(([k, l]) => (
            <li className="nav-item" key={k}><button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button></li>
          ))}
          <li className="nav-item"><Link className="nav-link" href="/wishlist">Wishlist</Link></li>
        </ul>

        {tab === 'learning' && (
          <>
            <div className="d-flex gap-2 mb-4 flex-wrap">
              {[['all', 'All'], ['progress', 'In progress'], ['new', 'Not started'], ['completed', 'Completed']].map(([k, l]) => (
                <button key={k} className={`chip ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
            {enrollments === null ? (
              <div className="row g-4">{[1, 2, 3].map((i) => <div className="col-md-4" key={i}><div className="skeleton" style={{ height: 260 }} /></div>)}</div>
            ) : shown.length === 0 ? (
              <EmptyState icon="bi-collection-play" title={enrollments.length ? 'No courses in this filter' : 'You haven\'t enrolled in any courses yet'} text="Browse our catalog and start learning something new today." actionHref="/courses" actionLabel="Browse courses" />
            ) : (
              <div className="row g-4">
                {shown.map((e) => (
                  <div className="col-sm-6 col-lg-4 col-xl-3" key={e.id}>
                    <Link href={`/learn/${e.course.slug}`} className="card course-card learning-card h-100 text-decoration-none">
                      <div className="course-thumb-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.course.thumbnail || FALLBACK_THUMB} alt="" className="course-thumb" />
                        <div className="position-absolute top-50 start-50 translate-middle">
                          <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white text-primary shadow" style={{ width: 52, height: 52 }}><i className="bi bi-play-fill fs-3" /></span>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="fw-bold text-body line-clamp-2 mb-1">{e.course.title}</div>
                        <div className="fs-7 text-muted-2 mb-3">{e.course.instructor.name}</div>
                        <div className="progress mb-2"><div className="progress-bar" style={{ width: `${e.progress}%` }} /></div>
                        <div className="d-flex justify-content-between fs-7">
                          <span className="text-muted-2">{e.progress >= 100 ? 'Completed 🎉' : e.progress > 0 ? `${e.progress}% complete` : 'Start course'}</span>
                          {e.progress >= 100 && <i className="bi bi-award-fill text-warning" />}
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'certificates' && (
          certificates?.length ? (
            <div className="row g-4">
              {certificates.map((c) => (
                <div className="col-md-6 col-lg-4" key={c.id}>
                  <div className="panel p-4 h-100 d-flex flex-column">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <span className="feature-icon" style={{ background: '#fff7d1', color: '#b58900' }}><i className="bi bi-award-fill" /></span>
                      <div className="min-w-0"><div className="fw-bold line-clamp-2">{c.course.title}</div><div className="fs-7 text-muted-2">Issued {formatDate(c.issuedAt)}</div></div>
                    </div>
                    <div className="fs-7 text-muted-2 mb-3">Credential ID: <code>{c.serial}</code></div>
                    <Link href={`/certificates/${c.id}`} className="btn btn-soft mt-auto">View certificate</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="bi-award" title="No certificates yet" text="Complete every lecture in a course to earn your certificate of completion." />
          )
        )}

        {tab === 'purchases' && (
          orders?.length ? (
            <div className="panel">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead><tr><th>Order</th><th>Courses</th><th>Date</th><th>Coupon</th><th className="text-end">Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td><code>{o.paymentRef}</code></td>
                        <td>{o.items.map((i) => <div key={i.id} className="small"><Link href={`/courses/${i.course.slug}`}>{i.course.title}</Link></div>)}</td>
                        <td className="small text-nowrap">{formatDate(o.createdAt)}</td>
                        <td className="small">{o.couponCode || '—'}</td>
                        <td className="text-end fw-bold">{formatMoney(o.total)}</td>
                        <td><span className="badge bg-success">{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState icon="bi-receipt" title="No purchases yet" text="Your receipts will appear here after you buy a course." />
          )
        )}
      </div>
    </>
  );
}
