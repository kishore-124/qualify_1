'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from './Providers';
import Avatar from './Avatar';
import Logo from './Logo';
import { api } from '@/lib/client';
import { timeAgo } from '@/lib/utils';

export default function Navbar() {
  const { user, counts, setCounts, logout, loading, cartCount, openCart } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState('');
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api('/api/categories').then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    const el = document.getElementById('qNav');
    if (el?.classList.contains('show')) el.classList.remove('show');
  }, [pathname]);

  if (pathname?.startsWith('/learn/')) return null; // the course player has its own top bar

  const search = (e) => {
    e.preventDefault();
    router.push(`/courses${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  const loadNotifications = async () => {
    try {
      const d = await api('/api/notifications');
      setNotifications(d.notifications);
      if (d.unread) {
        await api('/api/notifications', { method: 'PATCH', body: {} });
        setCounts((c) => ({ ...c, notifications: 0 }));
      }
    } catch {}
  };

  const active = (p) => (pathname === p || pathname?.startsWith(p + '/') ? 'active' : '');
  const isTeacher = user && (user.role === 'INSTRUCTOR' || user.role === 'ADMIN');

  return (
    <nav className="navbar navbar-expand-lg q-nav sticky-top">
      <div className="container-xl">
        <Link href="/" className="navbar-brand me-3" aria-label="Qualify home">
          <Logo size={32} />
        </Link>

        <div className="d-flex align-items-center gap-1 order-lg-last">
          <button className="btn btn-icon btn-ghost position-relative" onClick={openCart} aria-label={`Cart, ${cartCount} items`}>
            <i className="bi bi-bag fs-5" />
            {cartCount > 0 && <span className="count-dot">{cartCount}</span>}
          </button>
          {user && (
            <>
              <div className="dropdown">
                <button className="btn btn-icon btn-ghost position-relative" data-bs-toggle="dropdown" data-bs-auto-close="outside" onClick={loadNotifications} aria-label="Notifications">
                  <i className="bi bi-bell fs-5" />
                  {counts.notifications > 0 && <span className="count-dot">{counts.notifications}</span>}
                </button>
                <div className="dropdown-menu dropdown-menu-end notif-menu">
                  <div className="px-2 pt-1 pb-2 fw-bold">Notifications</div>
                  {notifications.length === 0 && <div className="text-muted-2 small p-3 text-center">No notifications yet.</div>}
                  {notifications.map((n) => (
                    <Link key={n.id} href={n.link || '#'} className={`dropdown-item notif-item text-wrap ${n.read ? '' : 'unread'}`}>
                      <div className="fw-semibold small">{n.title}</div>
                      <div className="text-muted-2 fs-7">{n.message}</div>
                      <div className="fs-8 text-muted-2 mt-1">{timeAgo(n.createdAt)}</div>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="dropdown ms-1">
                <button className="btn p-0 border-0 rounded-circle" data-bs-toggle="dropdown" aria-label="Account menu">
                  <Avatar user={user} />
                </button>
                <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 250 }}>
                  <li className="px-3 py-2 d-flex gap-2 align-items-center">
                    <Avatar user={user} />
                    <div className="min-w-0">
                      <div className="fw-bold text-truncate">{user.name}</div>
                      <div className="fs-7 text-muted-2 text-truncate">{user.email}</div>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" href="/dashboard"><i className="bi bi-collection-play me-2" />My learning</Link></li>
                  <li><Link className="dropdown-item" href="/wishlist"><i className="bi bi-heart me-2" />Wishlist</Link></li>
                  <li><Link className="dropdown-item" href="/dashboard?tab=certificates"><i className="bi bi-patch-check me-2" />Certificates</Link></li>
                  <li><Link className="dropdown-item" href="/dashboard?tab=purchases"><i className="bi bi-receipt me-2" />Purchases</Link></li>
                  {isTeacher && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li><Link className="dropdown-item" href="/instructor"><i className="bi bi-easel me-2" />Instructor dashboard</Link></li>
                      <li><Link className="dropdown-item" href="/instructor/earnings"><i className="bi bi-wallet2 me-2" />Earnings & payouts</Link></li>
                    </>
                  )}
                  {user.role === 'ADMIN' && <li><Link className="dropdown-item" href="/admin"><i className="bi bi-shield-check me-2" />Admin</Link></li>}
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" href="/profile"><i className="bi bi-gear me-2" />Settings</Link></li>
                  <li><button className="dropdown-item text-danger" onClick={logout}><i className="bi bi-box-arrow-right me-2" />Log out</button></li>
                </ul>
              </div>
            </>
          )}
          {!user && !loading && (
            <div className="d-none d-sm-flex gap-2 ms-1">
              <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Join free</Link>
            </div>
          )}
          <button className="navbar-toggler border-0 ms-1" type="button" data-bs-toggle="collapse" data-bs-target="#qNav" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
        </div>

        <div className="collapse navbar-collapse" id="qNav">
          <ul className="navbar-nav me-2">
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Courses</a>
              <ul className="dropdown-menu" style={{ minWidth: 270 }}>
                <li><Link className="dropdown-item fw-semibold" href="/courses">All courses</Link></li>
                <li><hr className="dropdown-divider" /></li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link className="dropdown-item d-flex justify-content-between align-items-center" href={`/courses?category=${c.slug}`}>
                      <span><i className={`bi ${c.icon || 'bi-grid'} me-2`} style={{ color: c.color }} />{c.name}</span>
                      <span className="text-muted-2 fs-8">{c._count.courses}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
          <form className="nav-search flex-grow-1 my-2 my-lg-0 me-lg-3" onSubmit={search} role="search">
            <i className="bi bi-search" />
            <input className="form-control" type="search" placeholder="What do you want to learn?" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search courses" />
          </form>
          <ul className="navbar-nav align-items-lg-center">
            {!isTeacher && <li className="nav-item"><Link className={`nav-link ${active('/teach')}`} href="/teach">Teach</Link></li>}
            {isTeacher && <li className="nav-item"><Link className={`nav-link ${active('/instructor')}`} href="/instructor">Instructor</Link></li>}
            {user?.role === 'ADMIN' && <li className="nav-item"><Link className={`nav-link ${active('/admin')}`} href="/admin">Admin</Link></li>}
            {user && <li className="nav-item"><Link className={`nav-link ${active('/dashboard')}`} href="/dashboard">My learning</Link></li>}
            {!user && !loading && (
              <li className="nav-item d-sm-none d-flex gap-2 py-2">
                <Link href="/login" className="btn btn-ghost btn-sm flex-fill">Log in</Link>
                <Link href="/register" className="btn btn-primary btn-sm flex-fill">Join free</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
