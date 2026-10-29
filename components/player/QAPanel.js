'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import Avatar from '../Avatar';
import ReportButton from '../ReportButton';
import { timeAgo } from '@/lib/utils';

export default function QAPanel({ lectureId, isOwner }) {
  const [scope, setScope] = useState('lecture');
  const [questions, setQuestions] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });
  const [asking, setAsking] = useState(false);
  const [replies, setReplies] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setQuestions(null);
    api(`/api/lectures/${lectureId}/questions?scope=${scope}`).then((d) => setQuestions(d.questions)).catch(() => setQuestions([]));
  }, [lectureId, scope]);

  const ask = async (e) => {
    e.preventDefault();
    try {
      const { question } = await api(`/api/lectures/${lectureId}/questions`, { method: 'POST', body: form });
      setQuestions((q) => [question, ...q]);
      setForm({ title: '', body: '' });
      setAsking(false);
      toast.success('Question posted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const answer = async (qid) => {
    const body = replies[qid];
    if (!body?.trim()) return;
    try {
      const { answer } = await api(`/api/questions/${qid}/answers`, { method: 'POST', body: { body } });
      setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, answers: [...q.answers, answer] } : q)));
      setReplies((r) => ({ ...r, [qid]: '' }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <div className="btn-group btn-group-sm">
          <button className={`btn ${scope === 'lecture' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setScope('lecture')}>This lecture</button>
          <button className={`btn ${scope === 'course' ? 'btn-primary' : 'btn-soft'}`} onClick={() => setScope('course')}>All lectures</button>
        </div>
        {!isOwner && (
          <button className="btn btn-outline-primary btn-sm ms-auto" onClick={() => setAsking(!asking)}>
            <i className="bi bi-question-circle me-1" />Ask a question
          </button>
        )}
      </div>

      {asking && (
        <form onSubmit={ask} className="panel p-3 mb-4">
          <input className="form-control mb-2" placeholder="Title or summary of your question" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="form-control mb-2" rows={3} placeholder="Details (optional) — what did you try?" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <div className="d-flex gap-2">
            <button className="btn btn-primary btn-sm">Publish</button>
            <button type="button" className="btn btn-link btn-sm" onClick={() => setAsking(false)}>Cancel</button>
          </div>
        </form>
      )}

      {questions === null && <div className="skeleton" style={{ height: 90 }} />}
      {questions?.length === 0 && (
        <div className="text-center text-muted-2 py-4">
          <i className="bi bi-chat-square-dots fs-2 d-block mb-2" />No questions yet. Be the first to ask!
        </div>
      )}
      <div className="d-grid gap-3">
        {questions?.map((q) => (
          <div className="qa-card" key={q.id}>
            <div className="d-flex gap-3">
              <Avatar user={q.user} />
              <div className="flex-grow-1 min-w-0">
                <div className="fw-bold">{q.title}</div>
                {q.body && <div className="small mt-1" style={{ whiteSpace: 'pre-line' }}>{q.body}</div>}
                <div className="fs-8 text-muted-2 mt-1">
                  {q.user.name} • {scope === 'course' && <>{q.lecture.title} • </>}{timeAgo(q.createdAt)}
                  {' '}• <ReportButton targetType="QUESTION" targetId={q.id} />
                </div>
                <button className="btn btn-link btn-sm p-0 mt-1 fw-semibold" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                  <i className="bi bi-chat me-1" />{q.answers.length} {q.answers.length === 1 ? 'answer' : 'answers'}
                  {q.answers.some((a) => a.isInstructor) && <span className="badge bg-success ms-2">Instructor answered</span>}
                </button>
                {expanded === q.id && (
                  <div className="mt-3 d-grid gap-2">
                    {q.answers.map((a) => (
                      <div key={a.id} className={a.isInstructor ? 'instructor-answer' : 'border-start ps-3'}>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Avatar user={a.user} className="" />
                          <span className="fw-semibold small">{a.user.name}</span>
                          {a.isInstructor && <span className="badge bg-primary">Instructor</span>}
                          <span className="fs-8 text-muted-2">{timeAgo(a.createdAt)}</span>
                          <ReportButton targetType="ANSWER" targetId={a.id} />
                        </div>
                        <div className="small" style={{ whiteSpace: 'pre-line' }}>{a.body}</div>
                      </div>
                    ))}
                    <div className="d-flex gap-2">
                      <input className="form-control form-control-sm" placeholder="Write a reply…" value={replies[q.id] || ''} onChange={(e) => setReplies({ ...replies, [q.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && answer(q.id)} />
                      <button className="btn btn-primary btn-sm" onClick={() => answer(q.id)}>Reply</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
