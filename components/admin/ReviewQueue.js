'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { formatPrice, effectivePrice, timeAgo, FALLBACK_THUMB } from '@/lib/utils';

/** Courses waiting for approval, oldest first. Each opens the full review console. */
export default function ReviewQueue() {
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    api('/api/admin/courses?status=PENDING').then((d) => setCourses([...d.courses].reverse())).catch(() => setCourses([]));
  }, []);

  if (!courses) return <div className="skeleton" style={{ height: 240 }} />;
  if (courses.length === 0) {
    return (
      <div className="panel p-5 text-center">
        <i className="bi bi-inbox fs-1 text-muted-2" />
        <h2 className="h5 fw-bold mt-2">Nothing to review</h2>
        <p className="text-muted-2 mb-0">New course submissions will show up here.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="fw-bold">{courses.length} course{courses.length === 1 ? '' : 's'} waiting</span>
        <span className="fs-7 text-muted-2">Oldest submission first</span>
      </div>
      {courses.map((c) => (
        <div key={c.id} className="queue-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.thumbnail || FALLBACK_THUMB} alt="" />
          <div className="min-w-0 flex-grow-1">
            <Link href={`/admin/courses/${c.id}`} className="fw-bold text-body text-decoration-none">{c.title}</Link>
            <div className="fs-7 text-muted-2">
              <Link href={`/admin/users/${c.instructor.id}`} className="text-muted-2">{c.instructor.name}</Link>
              {' · '}{c.category?.name || 'No category'} · {formatPrice(effectivePrice(c))} · submitted {timeAgo(c.updatedAt)}
            </div>
          </div>
          <Link href={`/admin/courses/${c.id}`} className="btn btn-primary btn-sm">Review course</Link>
        </div>
      ))}
    </div>
  );
}
