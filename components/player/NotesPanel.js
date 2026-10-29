'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { formatClock } from '@/lib/utils';

export default function NotesPanel({ lectureId, videoRef }) {
  const [notes, setNotes] = useState(null);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotes(null);
    api(`/api/lectures/${lectureId}/notes`).then((d) => setNotes(d.notes)).catch(() => setNotes([]));
  }, [lectureId]);

  const now = () => Math.floor(videoRef?.current?.currentTime || 0);

  const add = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      const { note } = await api(`/api/lectures/${lectureId}/notes`, { method: 'POST', body: { content, timestamp: now() } });
      setNotes((n) => [...n, note].sort((a, b) => a.timestamp - b.timestamp));
      setContent('');
      toast.success('Note saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await api(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes((n) => n.filter((x) => x.id !== id));
  };

  const seek = (t) => {
    if (videoRef?.current) {
      videoRef.current.currentTime = t;
      videoRef.current.play?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div>
      <form onSubmit={add} className="mb-4">
        <label className="form-label d-flex justify-content-between">
          <span>Create a note</span>
          <span className="badge bg-dark">at {formatClock(now())}</span>
        </label>
        <textarea className="form-control mb-2" rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write something you want to remember…" />
        <button className="btn btn-primary btn-sm" disabled={busy || !content.trim()}><i className="bi bi-journal-plus me-1" />Save note</button>
        <span className="fs-7 text-muted-2 ms-2">Notes are private and pinned to the current video time.</span>
      </form>
      {notes === null && <div className="skeleton" style={{ height: 70 }} />}
      {notes?.length === 0 && <p className="text-muted-2 small">No notes for this lecture yet.</p>}
      <div className="d-grid gap-2">
        {notes?.map((n) => (
          <div className="note-card d-flex gap-3 align-items-start" key={n.id}>
            <button className="badge bg-dark border-0" onClick={() => seek(n.timestamp)} title="Jump to this moment">
              <i className="bi bi-play-fill" /> {formatClock(n.timestamp)}
            </button>
            <div className="flex-grow-1 small" style={{ whiteSpace: 'pre-line' }}>{n.content}</div>
            <button className="btn btn-sm btn-link text-danger p-0" onClick={() => remove(n.id)} aria-label="Delete note"><i className="bi bi-trash" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
