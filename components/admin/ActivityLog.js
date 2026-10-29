'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { formatDate, timeAgo } from '@/lib/utils';

const LINK = { COURSE: (id) => `/admin/courses/${id}`, USER: (id) => `/admin/users/${id}` };
const TONE = { suspend: 'danger', ban: 'danger', delete: 'danger', remove: 'danger', hide: 'warning', reject: 'warning', warn: 'warning', 'hold-payouts': 'warning', approve: 'success', restore: 'success', reactivate: 'success' };

/** Read-only audit trail of every admin action. */
export default function ActivityLog() {
  const [filter, setFilter] = useState({ targetType: '', q: '', page: 1 });
  const [data, setData] = useState(null);

  useEffect(() => {
    const sp = new URLSearchParams({ ...filter, page: String(filter.page) });
    api(`/api/admin/activity?${sp}`).then(setData).catch(() => setData({ actions: [], pages: 1, page: 1, total: 0 }));
  }, [filter]);

  return (
    <div className="panel">
      <div className="panel-header flex-wrap">
        <div className="d-flex gap-2 flex-wrap">
          {[['', 'Everything'], ['COURSE', 'Courses'], ['USER', 'Users'], ['REVIEW', 'Reviews'], ['QUESTION', 'Q&A'], ['REPORT', 'Reports']].map(([k, l]) => (
            <button key={k} className={`chip ${filter.targetType === k ? 'active' : ''}`} onClick={() => setFilter({ ...filter, targetType: k, page: 1 })}>{l}</button>
          ))}
        </div>
        <input className="form-control form-control-sm" style={{ maxWidth: 240 }} placeholder="Search name or reason" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value, page: 1 })} />
      </div>
      <div className="table-responsive">
        <table className="table mb-0">
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>On</th><th>Reason</th></tr></thead>
          <tbody>
            {!data && <tr><td colSpan={5}><div className="skeleton" style={{ height: 40 }} /></td></tr>}
            {data?.actions.length === 0 && <tr><td colSpan={5} className="text-center text-muted-2 py-4">No actions recorded yet.</td></tr>}
            {data?.actions.map((a) => {
              const verb = a.action.split('.')[1];
              const link = LINK[a.targetType]?.(a.targetId);
              return (
                <tr key={a.id}>
                  <td className="small text-nowrap" title={formatDate(a.createdAt)}>{timeAgo(a.createdAt)}</td>
                  <td className="small">{a.admin.name}</td>
                  <td><span className={`badge bg-${TONE[verb] || 'secondary'}`}>{a.action.replace('.', ' ').replace('-', ' ')}</span></td>
                  <td className="small">{link ? <Link href={link}>{a.targetName}</Link> : a.targetName}</td>
                  <td className="small text-muted-2" style={{ maxWidth: 360 }}>{a.reason || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data && data.pages > 1 && (
        <div className="d-flex justify-content-between align-items-center p-3">
          <span className="small text-muted-2">{data.total} actions</span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-soft" disabled={filter.page <= 1} onClick={() => setFilter({ ...filter, page: filter.page - 1 })}>Previous</button>
            <span className="small align-self-center">Page {data.page} of {data.pages}</span>
            <button className="btn btn-sm btn-soft" disabled={filter.page >= data.pages} onClick={() => setFilter({ ...filter, page: filter.page + 1 })}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
