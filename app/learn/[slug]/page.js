'use client';

import Link from 'next/link';
import { Suspense, use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import VideoPlayer from '@/components/VideoPlayer';
import Avatar from '@/components/Avatar';
import { LogoMark } from '@/components/Logo';
import NotesPanel from '@/components/player/NotesPanel';
import QAPanel from '@/components/player/QAPanel';
import ReviewPanel from '@/components/player/ReviewPanel';
import { formatClock, formatDuration } from '@/lib/utils';

export default function LearnPage({ params }) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <Player slug={slug} />
    </Suspense>
  );
}

function Player({ slug }) {
  const search = useSearchParams();
  const videoRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [tab, setTab] = useState(search.get('tab') || 'overview');
  const [openSections, setOpenSections] = useState(new Set());
  const [autoplayNext, setAutoplayNext] = useState(true);

  useEffect(() => {
    api(`/api/learn/${slug}`)
      .then((d) => {
        setData(d);
        const all = d.course.sections.flatMap((s) => s.lectures);
        const wanted = search.get('lecture');
        const start =
          all.find((l) => l.id === wanted) ||
          all.find((l) => l.id === d.lastLectureId) ||
          all.find((l) => !l.completed) ||
          all[0];
        if (start) {
          setCurrentId(start.id);
          const sec = d.course.sections.find((s) => s.lectures.some((l) => l.id === start.id));
          setOpenSections(new Set([sec.id]));
        }
      })
      .catch((e) => setError(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const lectures = useMemo(() => (data ? data.course.sections.flatMap((s) => s.lectures) : []), [data]);
  const idx = lectures.findIndex((l) => l.id === currentId);
  const current = lectures[idx];
  const prev = lectures[idx - 1];
  const next = lectures[idx + 1];

  // Remember position ("continue where you left off")
  useEffect(() => {
    if (currentId && data?.enrolled) api(`/api/lectures/${currentId}/progress`, { method: 'PUT' }).catch(() => {});
    if (currentId && data) {
      const sec = data.course.sections.find((s) => s.lectures.some((l) => l.id === currentId));
      if (sec) setOpenSections((p) => new Set(p).add(sec.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const setCompleted = useCallback(
    async (lectureId, completed) => {
      if (!data?.enrolled) {
        toast('Progress is tracked for enrolled students', { icon: 'ℹ️' });
        return;
      }
      try {
        const r = await api(`/api/lectures/${lectureId}/progress`, { method: 'POST', body: completed === undefined ? {} : { completed } });
        setData((d) => ({
          ...d,
          progress: r.progress,
          certificateId: r.certificateId,
          course: {
            ...d.course,
            sections: d.course.sections.map((s) => ({
              ...s,
              lectures: s.lectures.map((l) => (l.id === lectureId ? { ...l, completed: r.completed } : l)),
            })),
          },
        }));
        if (r.certificateId && !data.certificateId) {
          toast.success('Course complete! Your certificate is ready 🏆', { duration: 6000 });
        }
      } catch (e) {
        toast.error(e.message);
      }
    },
    [data]
  );

  const onEnded = () => {
    if (current && !current.completed) setCompleted(current.id, true);
    if (autoplayNext && next) setTimeout(() => setCurrentId(next.id), 800);
  };

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="display-6 fw-bold mb-2">Can&apos;t open this course</div>
        <p className="text-muted-2">{error.message}</p>
        <Link href={`/courses/${slug}`} className="btn btn-primary">View course page</Link>
      </div>
    );
  }
  if (!data) return <PlayerSkeleton />;

  const { course } = data;
  const doneCount = lectures.filter((l) => l.completed).length;

  return (
    <>
      {/* Top bar */}
      <div className="player-topbar sticky-top" style={{ zIndex: 1030 }}>
        <div className="d-flex align-items-center gap-3 px-3" style={{ height: 66 }}>
          <Link href="/dashboard" className="text-white fs-4 lh-1" aria-label="Back"><i className="bi bi-arrow-left" /></Link>
          <Link href="/" className="d-none d-md-inline-flex" aria-label="Qualify home">
            <LogoMark size={32} />
          </Link>
          <div className="vr bg-white opacity-25 d-none d-md-block" />
          <Link href={`/courses/${course.slug}`} className="text-white text-decoration-none fw-semibold text-truncate min-w-0">{course.title}</Link>
          <div className="ms-auto d-flex align-items-center gap-3">
            {data.enrolled && (
              <div className="d-flex align-items-center gap-2">
                <div className="progress-ring" style={{ '--p': data.progress }}><span>{data.progress}%</span></div>
                <div className="d-none d-lg-block small text-white-50">{doneCount}/{lectures.length} complete</div>
              </div>
            )}
            {data.certificateId && (
              <Link href={`/certificates/${data.certificateId}`} className="btn btn-accent btn-sm"><i className="bi bi-award-fill me-1" />Certificate</Link>
            )}
            {data.isOwner && <Link href={`/instructor/courses/${course.id}`} className="btn btn-sm btn-outline-light">Edit</Link>}
          </div>
        </div>
      </div>

      <div className="player-shell">
        <div className="player-main">
          <div className="player-video">
            <VideoPlayer ref={videoRef} url={current?.videoUrl} poster={course.thumbnail} onEnded={onEnded} />
          </div>

          <div className="px-3 px-lg-5 py-3 border-bottom d-flex flex-wrap align-items-center gap-2">
            <div className="me-auto min-w-0">
              <div className="fs-7 text-muted-2">Lecture {idx + 1} of {lectures.length}</div>
              <h5 className="fw-bold mb-0 text-truncate">{current?.title}</h5>
            </div>
            <button className="btn btn-soft btn-sm" disabled={!prev} onClick={() => setCurrentId(prev.id)}><i className="bi bi-chevron-left" /> Prev</button>
            {current && data.enrolled && (
              <button className={`btn btn-sm ${current.completed ? 'btn-success' : 'btn-outline-primary'}`} onClick={() => setCompleted(current.id)}>
                <i className={`bi ${current.completed ? 'bi-check-circle-fill' : 'bi-check-circle'} me-1`} />
                {current.completed ? 'Completed' : 'Mark complete'}
              </button>
            )}
            <button className="btn btn-primary btn-sm" disabled={!next} onClick={() => setCurrentId(next.id)}>Next <i className="bi bi-chevron-right" /></button>
          </div>

          <div className="px-3 px-lg-5">
            <ul className="nav player-tabs border-bottom">
              {[
                ['overview', 'Overview'],
                ['qa', 'Q&A'],
                ['notes', 'Notes'],
                ['reviews', 'Reviews'],
              ].map(([k, l]) => (
                <li className="nav-item" key={k}>
                  <button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
                </li>
              ))}
            </ul>
            <div className="py-4" style={{ maxWidth: 900 }}>
              {tab === 'overview' && (
                <div>
                  {current?.description && (
                    <div className="mb-4">
                      <h6 className="fw-bold">About this lecture</h6>
                      <p style={{ whiteSpace: 'pre-line' }}>{current.description}</p>
                    </div>
                  )}
                  {current?.resourceUrl && (
                    <a href={current.resourceUrl} target="_blank" rel="noreferrer" className="btn btn-soft mb-4">
                      <i className="bi bi-download me-2" />Download lecture resources
                    </a>
                  )}
                  <h6 className="fw-bold">About this course</h6>
                  <p className="text-muted-2">{course.subtitle}</p>
                  <div className="d-flex flex-wrap gap-4 small mb-4">
                    <span><i className="bi bi-collection-play me-1" />{lectures.length} lectures</span>
                    <span><i className="bi bi-clock me-1" />{formatDuration(lectures.reduce((n, l) => n + l.duration, 0))}</span>
                    <span><i className="bi bi-people me-1" />{course.studentCount} students</span>
                    <span><i className="bi bi-globe me-1" />{course.language}</span>
                  </div>
                  <div className="form-check form-switch mb-4">
                    <input className="form-check-input" type="checkbox" id="autoplay" checked={autoplayNext} onChange={(e) => setAutoplayNext(e.target.checked)} />
                    <label className="form-check-label small fw-semibold" htmlFor="autoplay">Autoplay next lecture</label>
                  </div>
                  {course.description && <div className="small mb-4" style={{ whiteSpace: 'pre-line' }}>{course.description}</div>}
                  <div className="panel p-3 d-flex gap-3 align-items-center">
                    <Avatar user={course.instructor} size="lg" />
                    <div>
                      <div className="fs-7 text-muted-2">Instructor</div>
                      <Link href={`/instructors/${course.instructor.id}`} className="fw-bold text-decoration-none">{course.instructor.name}</Link>
                      <div className="small text-muted-2">{course.instructor.headline}</div>
                    </div>
                  </div>
                </div>
              )}
              {tab === 'qa' && current && <QAPanel lectureId={current.id} isOwner={data.isOwner} />}
              {tab === 'notes' && current && <NotesPanel lectureId={current.id} videoRef={videoRef} />}
              {tab === 'reviews' && <ReviewPanel courseId={course.id} myReview={data.myReview} enrolled={data.enrolled} onSaved={(r) => setData((d) => ({ ...d, myReview: r }))} />}
            </div>
          </div>
        </div>

        {/* Curriculum sidebar */}
        <aside className="player-sidebar">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-bold">Course content</span>
            {data.enrolled && <span className="fs-7 text-muted-2">{doneCount} / {lectures.length}</span>}
          </div>
          {course.sections.map((s, si) => {
            const open = openSections.has(s.id);
            const done = s.lectures.filter((l) => l.completed).length;
            const dur = s.lectures.reduce((n, l) => n + l.duration, 0);
            return (
              <div key={s.id}>
                <div
                  className="section-head d-flex justify-content-between align-items-start"
                  onClick={() =>
                    setOpenSections((p) => {
                      const n = new Set(p);
                      n.has(s.id) ? n.delete(s.id) : n.add(s.id);
                      return n;
                    })
                  }
                >
                  <div className="min-w-0">
                    <div className="small">Section {si + 1}: {s.title}</div>
                    <div className="fs-8 text-muted-2 fw-normal">{done} / {s.lectures.length} | {formatDuration(dur)}</div>
                  </div>
                  <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                </div>
                {open &&
                  s.lectures.map((l, li) => (
                    <div key={l.id} className={`lecture-item ${l.id === currentId ? 'active' : ''}`} onClick={() => setCurrentId(l.id)}>
                      {data.enrolled ? (
                        <input
                          type="checkbox"
                          className="form-check-input flex-shrink-0"
                          checked={!!l.completed}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setCompleted(l.id, e.target.checked)}
                          aria-label="Mark complete"
                        />
                      ) : (
                        <i className="bi bi-play-circle text-muted-2" />
                      )}
                      <div className="min-w-0">
                        <div className="small">{li + 1}. {l.title}</div>
                        <div className="fs-8 text-muted-2"><i className="bi bi-play-btn me-1" />{formatClock(l.duration)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            );
          })}
        </aside>
      </div>
    </>
  );
}

function PlayerSkeleton() {
  return (
    <div className="player-shell">
      <div className="player-main p-0">
        <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
        <div className="p-4"><div className="skeleton mb-2" style={{ height: 24, width: '50%' }} /><div className="skeleton" style={{ height: 16, width: '30%' }} /></div>
      </div>
      <div className="player-sidebar p-3 d-grid gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
      </div>
    </div>
  );
}
