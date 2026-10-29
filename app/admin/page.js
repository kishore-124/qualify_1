'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import Avatar from '@/components/Avatar';
import StarRating from '@/components/StarRating';
import ReviewQueue from '@/components/admin/ReviewQueue';
import ReportsQueue from '@/components/admin/ReportsQueue';
import ActivityLog from '@/components/admin/ActivityLog';
import { formatMoney, formatDate, formatPrice, effectivePrice, STATUS_BADGE, timeAgo, FALLBACK_THUMB } from '@/lib/utils';

const BarLineChart = dynamic(() => import('@/components/charts/BarLineChart'), { ssr: false, loading: () => <div className="skeleton" style={{ height: 300 }} /> });

const ICONS = ['bi-code-slash', 'bi-palette', 'bi-graph-up', 'bi-briefcase', 'bi-megaphone', 'bi-camera', 'bi-music-note-beamed', 'bi-heart-pulse', 'bi-translate', 'bi-cpu', 'bi-calculator', 'bi-shield-lock'];

export default function AdminPage() {
  return (
    <Suspense>
      <Admin />
    </Suspense>
  );
}

function Admin() {
  const { user: me } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const setTab = (t) => router.replace(`/admin${t === 'overview' ? '' : `?tab=${t}`}`, { scroll: false });

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [userQuery, setUserQuery] = useState({ q: '', role: '', status: '', page: 1 });
  const [courses, setCourses] = useState(null);
  const [courseFilter, setCourseFilter] = useState({ status: '', q: '' });
  const [categories, setCategories] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', icon: 'bi-code-slash', color: '#2b3fe0' });
  const [coupons, setCoupons] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: '', discountPercent: 20, maxUses: '', expiresAt: '' });
  const [payouts, setPayouts] = useState(null);
  const [payBusy, setPayBusy] = useState(false);
  const loadPayouts = useCallback(() => api('/api/admin/payouts').then(setPayouts).catch((e) => toast.error(e.message)), []);

  const loadStats = useCallback(() => api('/api/admin/stats').then(setStats).catch((e) => toast.error(e.message)), []);
  const loadUsers = useCallback(() => {
    const sp = new URLSearchParams({ ...userQuery, page: String(userQuery.page) });
    api(`/api/admin/users?${sp}`).then(setUsers);
  }, [userQuery]);
  const loadCourses = useCallback(() => {
    const sp = new URLSearchParams(courseFilter);
    api(`/api/admin/courses?${sp}`).then((d) => setCourses(d.courses));
  }, [courseFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, loadUsers]);
  useEffect(() => { if (tab === 'courses') loadCourses(); }, [tab, loadCourses]);
  useEffect(() => { if (tab === 'payouts') loadPayouts(); }, [tab, loadPayouts]);

  const payoutAction = async (action, instructorId) => {
    if (action === 'mark-paid' && !confirm('Mark these earnings as paid? Use this after paying the instructor outside Stripe (bank transfer, PayPal, Wise…).')) return;
    setPayBusy(true);
    try {
      const d = await api('/api/admin/payouts', { method: 'POST', body: { action, instructorId } });
      toast.success(action === 'release' ? `${d.paid} transfer(s) sent${d.failed ? `, ${d.failed} failed` : ''}` : `${d.marked} earning(s) marked as paid`);
      loadPayouts();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPayBusy(false);
    }
  };

  const refund = async (o) => {
    if (!confirm(`Refund ${formatMoney(o.total)} to ${o.user.name}? They lose access to the course(s) and instructor earnings are reversed.`)) return;
    try {
      await api(`/api/admin/orders/${o.id}/refund`, { method: 'POST' });
      toast.success('Order refunded');
      loadPayouts();
      loadStats();
    } catch (e) {
      toast.error(e.message);
    }
  };
  useEffect(() => {
    if (tab === 'categories' && !categories) api('/api/categories').then((d) => setCategories(d.categories));
    if (tab === 'coupons' && !coupons) api('/api/coupons').then((d) => setCoupons(d.coupons));
  }, [tab, categories, coupons]);

  const moderate = async (id, status) => {
    try {
      await api('/api/admin/courses', { method: 'PATCH', body: { id, status } });
      toast.success('Course approved & published');
      loadStats();
      if (tab === 'courses') loadCourses();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggleFeatured = async (c) => {
    await api('/api/admin/courses', { method: 'PATCH', body: { id: c.id, featured: !c.featured } });
    setCourses((list) => list.map((x) => (x.id === c.id ? { ...x, featured: !c.featured } : x)));
  };

  const changeRole = async (id, role) => {
    try {
      await api('/api/admin/users', { method: 'PATCH', body: { id, role } });
      toast.success('Role updated');
      loadUsers();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.name}? All their data will be removed.`)) return;
    try {
      await api(`/api/admin/users?id=${u.id}`, { method: 'DELETE' });
      toast.success('User deleted');
      loadUsers();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    try {
      const { category } = await api('/api/categories', { method: 'POST', body: catForm });
      setCategories((c) => [...c, { ...category, _count: { courses: 0 } }]);
      setCatForm({ ...catForm, name: '' });
      toast.success('Category added');
    } catch (err) {
      toast.error(err.message);
    }
  };
  const deleteCategory = async (id) => {
    if (!confirm('Delete this category? Courses will become uncategorized.')) return;
    await api(`/api/categories/${id}`, { method: 'DELETE' });
    setCategories((c) => c.filter((x) => x.id !== id));
  };

  const addCoupon = async (e) => {
    e.preventDefault();
    try {
      const { coupon } = await api('/api/coupons', { method: 'POST', body: couponForm });
      setCoupons((c) => [coupon, ...c]);
      setCouponForm({ code: '', discountPercent: 20, maxUses: '', expiresAt: '' });
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

  const t = stats?.totals;

  return (
    <>
      <section className="dash-header">
        <div className="container-xl">
          <div className="text-white-50 small mb-1"><i className="bi bi-shield-lock me-1" />Admin panel</div>
          <h1 className="fw-bold mb-0">Platform overview</h1>
        </div>
      </section>

      <div className="container-xl dash-body pb-5">
        <div className="row g-3 mb-4">
          {[
            ['bi-cash-stack', '#fff7d1', '#1b1f3b', t ? formatMoney(t.revenue) : '—', 'Gross sales', t ? `${formatMoney(t.platformFees)} Qualify fees · ${t.orders} orders` : ''],
            ['bi-people', '#eef0fe', '#2b3fe0', t?.users ?? '—', 'Users', t ? `${t.students} students • ${t.instructors} instructors` : ''],
            ['bi-collection-play', '#ddf5e6', '#12a150', t?.courses ?? '—', 'Courses', t ? `${t.published} live • ${t.pending} pending` : ''],
            ['bi-flag', '#fde4e4', '#b42318', t?.openReports ?? '—', 'Open reports', t ? `${t.restricted} restricted account${t.restricted === 1 ? '' : 's'} · ${t.suspendedCourses} course${t.suspendedCourses === 1 ? '' : 's'} taken down` : ''],
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

        <ul className="nav tabs-lh mb-4">
          {[
            ['overview', 'Overview'],
            ['review', 'Review queue'],
            ['reports', 'Reports'],
            ['courses', 'Courses'],
            ['users', 'Users'],
            ['categories', 'Categories'],
            ['coupons', 'Coupons'],
            ['payouts', 'Payouts'],
            ['activity', 'Activity log'],
          ].map(([k, l]) => (
            <li className="nav-item" key={k}>
              <button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
                {l}
                {k === 'review' && t?.pending > 0 && <span className="badge bg-warning ms-1">{t.pending}</span>}
                {k === 'reports' && t?.openReports > 0 && <span className="badge bg-danger ms-1">{t.openReports}</span>}
              </button>
            </li>
          ))}
        </ul>

        {tab === 'overview' && (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="panel mb-4">
                <div className="panel-header"><span className="fw-bold">Revenue & orders — last 6 months</span></div>
                <div className="panel-body">
                  {stats ? <BarLineChart labels={stats.monthly.map((m) => m.label)} revenue={stats.monthly.map((m) => m.revenue)} counts={stats.monthly.map((m) => m.orders)} countLabel="Orders" /> : <div className="skeleton" style={{ height: 300 }} />}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><span className="fw-bold">Awaiting review</span><span className="badge bg-warning text-dark">{stats?.pending.length || 0}</span></div>
                {stats?.pending.length === 0 && <div className="panel-body text-center text-muted-2">No courses waiting for review 🎉</div>}
                {stats?.pending.map((c) => (
                  <div key={c.id} className="d-flex align-items-center gap-3 p-3 border-bottom flex-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.thumbnail || FALLBACK_THUMB} alt="" className="thumb-sm" />
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate">{c.title}</div>
                      <div className="fs-8 text-muted-2">{c.instructor.name} • {c.category?.name || 'Uncategorized'} • submitted {timeAgo(c.updatedAt)}</div>
                    </div>
                    <Link href={`/admin/courses/${c.id}`} className="btn btn-sm btn-primary">Open review</Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-lg-4 d-grid gap-4 align-content-start">
              <div className="panel">
                <div className="panel-header"><span className="fw-bold">Recent orders</span></div>
                <div className="panel-body d-grid gap-3">
                  {stats?.recentOrders.map((o) => (
                    <div key={o.id} className="d-flex justify-content-between align-items-center">
                      <div className="min-w-0">
                        <div className="small fw-semibold text-truncate">{o.user.name}</div>
                        <div className="fs-8 text-muted-2">{o._count.items} course(s) • {timeAgo(o.createdAt)}</div>
                      </div>
                      <span className="fw-bold small">{formatMoney(o.total)}</span>
                    </div>
                  ))}
                  {stats?.recentOrders.length === 0 && <div className="text-muted-2 small">No orders yet</div>}
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><span className="fw-bold">New users</span></div>
                <div className="panel-body d-grid gap-3">
                  {stats?.recentUsers.map((u) => (
                    <div key={u.id} className="d-flex align-items-center gap-2">
                      <Avatar user={u} />
                      <div className="min-w-0 flex-grow-1"><div className="small fw-semibold text-truncate">{u.name}</div><div className="fs-8 text-muted-2 text-truncate">{u.email}</div></div>
                      <span className="badge bg-light text-dark">{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'courses' && (
          <div className="panel">
            <div className="panel-header flex-wrap">
              <div className="d-flex gap-2 flex-wrap">
                {['', 'PENDING', 'PUBLISHED', 'DRAFT', 'REJECTED', 'SUSPENDED'].map((s) => (
                  <button key={s} className={`chip ${courseFilter.status === s ? 'active' : ''}`} onClick={() => setCourseFilter({ ...courseFilter, status: s })}>{s || 'All'}</button>
                ))}
              </div>
              <input className="form-control form-control-sm" style={{ maxWidth: 240 }} placeholder="Search title…" value={courseFilter.q} onChange={(e) => setCourseFilter({ ...courseFilter, q: e.target.value })} />
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>Course</th><th>Instructor</th><th>Status</th><th>Price</th><th>Students</th><th>Rating</th><th>Featured</th><th></th></tr></thead>
                <tbody>
                  {!courses && <tr><td colSpan={8}><div className="skeleton" style={{ height: 40 }} /></td></tr>}
                  {courses?.map((c) => (
                    <tr key={c.id}>
                      <td style={{ minWidth: 240 }}>
                        <div className="d-flex align-items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.thumbnail || FALLBACK_THUMB} alt="" className="thumb-sm" />
                          <Link href={`/admin/courses/${c.id}`} className="small fw-semibold text-body line-clamp-2">{c.title}</Link>
                        </div>
                      </td>
                      <td className="small"><Link href={`/admin/users/${c.instructor.id}`} className="text-body">{c.instructor.name}</Link>{c.instructor.status !== 'ACTIVE' && <span className="badge bg-danger ms-1">{c.instructor.status.toLowerCase()}</span>}</td>
                      <td><span className={`badge bg-${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                      <td className="small">{formatPrice(effectivePrice(c))}</td>
                      <td>{c.studentCount}</td>
                      <td>{c.reviewCount ? <StarRating value={c.avgRating} showValue size="0.65rem" /> : '—'}</td>
                      <td><div className="form-check form-switch m-0"><input className="form-check-input" type="checkbox" checked={c.featured} onChange={() => toggleFeatured(c)} /></div></td>
                      <td className="text-nowrap">
                        <Link href={`/admin/courses/${c.id}`} className="btn btn-sm btn-soft">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="panel">
            <div className="panel-header flex-wrap">
              <div className="d-flex gap-2 flex-wrap">
                {[['', 'All'], ['SUSPENDED', 'Paused'], ['BANNED', 'Banned']].map(([st, label]) => (
                  <button key={`s${st}`} className={`chip ${(userQuery.status || '') === st && st ? 'active' : ''}`} onClick={() => setUserQuery({ ...userQuery, status: st, page: 1 })} hidden={!st}>{label}</button>
                ))}
                {['', 'STUDENT', 'INSTRUCTOR', 'ADMIN'].map((r) => (
                  <button key={r} className={`chip ${userQuery.role === r ? 'active' : ''}`} onClick={() => setUserQuery({ ...userQuery, role: r, page: 1 })}>{r || 'All'}</button>
                ))}
              </div>
              <input className="form-control form-control-sm" style={{ maxWidth: 260 }} placeholder="Search name or email…" value={userQuery.q} onChange={(e) => setUserQuery({ ...userQuery, q: e.target.value, page: 1 })} />
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead><tr><th>User</th><th>Role</th><th>Enrollments</th><th>Courses</th><th>Joined</th><th></th></tr></thead>
                <tbody>
                  {users?.users.map((u) => (
                    <tr key={u.id}>
                      <td><div className="d-flex align-items-center gap-2"><Avatar user={u} /><div className="min-w-0"><Link href={`/admin/users/${u.id}`} className="small fw-semibold text-body">{u.name}</Link>{u.status !== 'ACTIVE' && <span className={`badge ms-1 ${u.status === 'BANNED' ? 'bg-danger' : 'bg-warning'}`}>{u.status.toLowerCase()}</span>}<div className="fs-8 text-muted-2">{u.email}</div></div></div></td>
                      <td>
                        <select className="form-select form-select-sm" style={{ width: 140 }} value={u.role} disabled={u.id === me?.id} onChange={(e) => changeRole(u.id, e.target.value)}>
                          <option value="STUDENT">Student</option>
                          <option value="INSTRUCTOR">Instructor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>{u._count.enrollments}</td>
                      <td>{u._count.courses}</td>
                      <td className="small text-nowrap">{formatDate(u.createdAt)}</td>
                      <td>{u.id !== me?.id && <button className="btn btn-sm btn-link text-danger" onClick={() => deleteUser(u)}><i className="bi bi-trash" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users && users.pages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3">
                <span className="small text-muted-2">{users.total} users</span>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-soft" disabled={userQuery.page <= 1} onClick={() => setUserQuery({ ...userQuery, page: userQuery.page - 1 })}>Prev</button>
                  <span className="small align-self-center">Page {users.page} / {users.pages}</span>
                  <button className="btn btn-sm btn-soft" disabled={userQuery.page >= users.pages} onClick={() => setUserQuery({ ...userQuery, page: userQuery.page + 1 })}>Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'categories' && (
          <div className="row g-4">
            <div className="col-lg-4">
              <form className="panel" onSubmit={addCategory}>
                <div className="panel-header"><span className="fw-bold">Add category</span></div>
                <div className="panel-body d-grid gap-3">
                  <input className="form-control" placeholder="Category name" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
                  <div>
                    <label className="form-label">Icon</label>
                    <div className="d-flex flex-wrap gap-2">
                      {ICONS.map((i) => (
                        <button type="button" key={i} className={`btn btn-icon ${catForm.icon === i ? 'btn-primary' : 'btn-soft'}`} onClick={() => setCatForm({ ...catForm, icon: i })}><i className={`bi ${i}`} /></button>
                      ))}
                    </div>
                  </div>
                  <div><label className="form-label">Color</label><input type="color" className="form-control form-control-color" value={catForm.color} onChange={(e) => setCatForm({ ...catForm, color: e.target.value })} /></div>
                  <button className="btn btn-primary">Add category</button>
                </div>
              </form>
            </div>
            <div className="col-lg-8">
              <div className="row g-3">
                {categories?.map((c) => (
                  <div className="col-md-6" key={c.id}>
                    <div className="category-tile">
                      <span className="ico" style={{ background: `${c.color}1a`, color: c.color }}><i className={`bi ${c.icon}`} /></span>
                      <div className="flex-grow-1"><div className="fw-bold">{c.name}</div><div className="fs-7 text-muted-2">{c._count.courses} published courses</div></div>
                      <button className="btn btn-sm btn-link text-danger" onClick={() => deleteCategory(c.id)}><i className="bi bi-trash" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'coupons' && (
          <div className="row g-4">
            <div className="col-lg-4">
              <form className="panel" onSubmit={addCoupon}>
                <div className="panel-header"><span className="fw-bold">Site-wide coupon</span></div>
                <div className="panel-body d-grid gap-3">
                  <input className="form-control text-uppercase" placeholder="CODE" required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} />
                  <div><label className="form-label">Discount: {couponForm.discountPercent}%</label><input type="range" className="form-range" min={5} max={100} step={5} value={couponForm.discountPercent} onChange={(e) => setCouponForm({ ...couponForm, discountPercent: e.target.value })} /></div>
                  <div className="row g-2">
                    <div className="col-6"><input type="number" min={1} className="form-control" placeholder="Max uses" value={couponForm.maxUses} onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })} /></div>
                    <div className="col-6"><input type="date" className="form-control" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} /></div>
                  </div>
                  <button className="btn btn-primary">Create coupon</button>
                </div>
              </form>
            </div>
            <div className="col-lg-8">
              <div className="panel">
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead><tr><th>Code</th><th>Scope</th><th>Off</th><th>Used</th><th>Expires</th><th>Active</th><th></th></tr></thead>
                    <tbody>
                      {coupons?.map((c) => (
                        <tr key={c.id}>
                          <td><code className="fw-bold">{c.code}</code></td>
                          <td className="small">{c.course?.title || <span className="badge bg-soft text-primary">All courses</span>}</td>
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

        {tab === 'payouts' && (
          !payouts ? <div className="skeleton" style={{ height: 300 }} /> : (
            <div className="d-grid gap-4">
              <div className="row g-3">
                {[
                  ['Gross sales', payouts.totals.gross],
                  [`Qualify fees (${payouts.feePercent}%)`, payouts.totals.platformFees],
                  ['Paid to instructors', payouts.totals.paidOut],
                  ['Owed to instructors', payouts.totals.pending],
                ].map(([l, v]) => (
                  <div className="col-6 col-lg-3" key={l}><div className="stat-card"><div className="small text-muted-2 fw-semibold mb-1">{l}</div><div className="value">{formatMoney(v)}</div></div></div>
                ))}
              </div>
              <div className="panel">
                <div className="panel-header flex-wrap">
                  <span className="fw-bold">Owed to instructors</span>
                  {payouts.stripeEnabled && (
                    <button className="btn btn-primary btn-sm" disabled={payBusy} onClick={() => payoutAction('release')}>Send all via Stripe</button>
                  )}
                </div>
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead><tr><th>Instructor</th><th>Stripe</th><th className="text-end">Sales</th><th className="text-end">Owed</th><th></th></tr></thead>
                    <tbody>
                      {payouts.owed.length === 0 && <tr><td colSpan={5} className="text-center text-muted-2 py-4">Everyone is paid up.</td></tr>}
                      {payouts.owed.map((o) => (
                        <tr key={o.instructor.id}>
                          <td><div className="d-flex align-items-center gap-2"><Avatar user={o.instructor} /><div><div className="small fw-semibold">{o.instructor.name}</div><div className="fs-8 text-muted-2">{o.instructor.email}</div></div></div></td>
                          <td>{o.instructor.payoutsEnabled ? <span className="badge bg-success">Ready</span> : o.instructor.stripeAccountId ? <span className="badge bg-warning">Onboarding</span> : <span className="badge bg-secondary">Not connected</span>}</td>
                          <td className="text-end">{o.sales}</td>
                          <td className="text-end fw-bold">{formatMoney(o.amount)}</td>
                          <td className="text-end text-nowrap">
                            {payouts.stripeEnabled && o.instructor.payoutsEnabled && <button className="btn btn-sm btn-soft me-1" disabled={payBusy} onClick={() => payoutAction('release', o.instructor.id)}>Pay via Stripe</button>}
                            <button className="btn btn-sm btn-ghost" disabled={payBusy} onClick={() => payoutAction('mark-paid', o.instructor.id)}>Mark paid</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header"><span className="fw-bold">Recent orders</span></div>
                <div className="table-responsive">
                  <table className="table mb-0">
                    <thead><tr><th>Order</th><th>Student</th><th>Courses</th><th>Date</th><th className="text-end">Total</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {payouts.recentOrders.map((o) => (
                        <tr key={o.id}>
                          <td><code>{o.paymentRef}</code></td>
                          <td className="small">{o.user.name}</td>
                          <td className="small">{o.items.map((i) => i.course.title).join(', ')}</td>
                          <td className="small text-nowrap">{formatDate(o.createdAt)}</td>
                          <td className="text-end fw-semibold">{formatMoney(o.total)}</td>
                          <td><span className={`badge ${o.status === 'PAID' ? 'bg-success' : 'bg-danger'}`}>{o.status === 'PAID' ? 'Paid' : 'Refunded'}</span></td>
                          <td>{o.status === 'PAID' && <button className="btn btn-sm btn-link text-danger" onClick={() => refund(o)}>Refund</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}

        {tab === 'review' && <ReviewQueue onChange={loadStats} />}
        {tab === 'reports' && <ReportsQueue onChange={loadStats} />}
        {tab === 'activity' && <ActivityLog />}
      </div>
    </>
  );
}
