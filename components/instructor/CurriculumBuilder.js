'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { formatClock } from '@/lib/utils';

const emptyLecture = { title: '', videoUrl: '', minutes: '', seconds: '', description: '', resourceUrl: '', isPreview: false };

export default function CurriculumBuilder({ course, onChange }) {
  const [sections, setSections] = useState(course.sections);
  const [newSection, setNewSection] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [lectureModal, setLectureModal] = useState(null); // { sectionId, lecture? }
  const [lf, setLf] = useState(emptyLecture);
  const [busy, setBusy] = useState(false);

  // Keep the parent (lecture count, publish checklist) in sync
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange?.(sections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const addSection = async (e) => {
    e.preventDefault();
    if (!newSection.trim()) return;
    try {
      const { section } = await api(`/api/courses/${course.id}/sections`, { method: 'POST', body: { title: newSection } });
      setSections((s) => [...s, section]);
      setNewSection('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const renameSection = async (id, title) => {
    await api(`/api/sections/${id}`, { method: 'PUT', body: { title } });
    setSections((s) => s.map((x) => (x.id === id ? { ...x, title } : x)));
    setEditingSection(null);
  };

  const deleteSection = async (id) => {
    if (!confirm('Delete this section and all its lectures?')) return;
    await api(`/api/sections/${id}`, { method: 'DELETE' });
    setSections((s) => s.filter((x) => x.id !== id));
  };

  const moveSection = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= sections.length) return;
    const a = sections[index];
    const b = sections[j];
    const next = [...sections];
    next[index] = b;
    next[j] = a;
    setSections(next);
    await Promise.all([
      api(`/api/sections/${a.id}`, { method: 'PUT', body: { position: j } }),
      api(`/api/sections/${b.id}`, { method: 'PUT', body: { position: index } }),
    ]);
  };

  const moveLecture = async (sectionId, index, dir) => {
    const sec = sections.find((s) => s.id === sectionId);
    const j = index + dir;
    if (j < 0 || j >= sec.lectures.length) return;
    const lectures = [...sec.lectures];
    const a = lectures[index];
    const b = lectures[j];
    lectures[index] = b;
    lectures[j] = a;
    setSections((s) => s.map((x) => (x.id === sectionId ? { ...x, lectures } : x)));
    await Promise.all([
      api(`/api/lectures/${a.id}`, { method: 'PUT', body: { position: j } }),
      api(`/api/lectures/${b.id}`, { method: 'PUT', body: { position: index } }),
    ]);
  };

  const openLecture = (sectionId, lecture) => {
    setLectureModal({ sectionId, lecture });
    setLf(
      lecture
        ? {
            title: lecture.title,
            videoUrl: lecture.videoUrl || '',
            minutes: Math.floor(lecture.duration / 60),
            seconds: lecture.duration % 60,
            description: lecture.description || '',
            resourceUrl: lecture.resourceUrl || '',
            isPreview: lecture.isPreview,
          }
        : emptyLecture
    );
  };

  const saveLecture = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = {
      title: lf.title,
      videoUrl: lf.videoUrl,
      description: lf.description,
      resourceUrl: lf.resourceUrl,
      isPreview: lf.isPreview,
      duration: (parseInt(lf.minutes) || 0) * 60 + (parseInt(lf.seconds) || 0),
    };
    try {
      const { sectionId, lecture } = lectureModal;
      if (lecture) {
        const { lecture: updated } = await api(`/api/lectures/${lecture.id}`, { method: 'PUT', body });
        setSections((s) => s.map((x) => (x.id === sectionId ? { ...x, lectures: x.lectures.map((l) => (l.id === updated.id ? updated : l)) } : x)));
      } else {
        const { lecture: created } = await api(`/api/sections/${sectionId}/lectures`, { method: 'POST', body });
        setSections((s) => s.map((x) => (x.id === sectionId ? { ...x, lectures: [...x.lectures, created] } : x)));
      }
      setLectureModal(null);
      toast.success('Lecture saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteLecture = async (sectionId, id) => {
    if (!confirm('Delete this lecture?')) return;
    await api(`/api/lectures/${id}`, { method: 'DELETE' });
    setSections((s) => s.map((x) => (x.id === sectionId ? { ...x, lectures: x.lectures.filter((l) => l.id !== id) } : x)));
  };

  // Try to read the duration of a direct video file automatically
  const detectDuration = () => {
    if (!lf.videoUrl || /youtu|vimeo/.test(lf.videoUrl)) return;
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.src = lf.videoUrl;
    v.onloadedmetadata = () => {
      const d = Math.round(v.duration || 0);
      if (d) setLf((f) => ({ ...f, minutes: Math.floor(d / 60), seconds: d % 60 }));
    };
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="fw-bold">Curriculum</span>
        <span className="fs-7 text-muted-2">Add sections, then lectures with video links (YouTube, Vimeo, or .mp4)</span>
      </div>
      <div className="panel-body d-grid gap-3">
        {sections.length === 0 && <div className="text-center text-muted-2 py-4">Start by adding your first section below.</div>}
        {sections.map((s, si) => (
          <div className="builder-section" key={s.id}>
            <div className="head">
              <span className="fw-bold text-nowrap">Section {si + 1}:</span>
              {editingSection === s.id ? (
                <form className="d-flex gap-2 flex-grow-1" onSubmit={(e) => { e.preventDefault(); renameSection(s.id, e.target.title.value); }}>
                  <input name="title" className="form-control form-control-sm" defaultValue={s.title} autoFocus />
                  <button className="btn btn-sm btn-primary">Save</button>
                </form>
              ) : (
                <span className="flex-grow-1 fw-semibold text-truncate">{s.title}</span>
              )}
              <div className="btn-group btn-group-sm">
                <button className="btn btn-link text-muted" onClick={() => moveSection(si, -1)} disabled={si === 0} title="Move up"><i className="bi bi-arrow-up" /></button>
                <button className="btn btn-link text-muted" onClick={() => moveSection(si, 1)} disabled={si === sections.length - 1} title="Move down"><i className="bi bi-arrow-down" /></button>
                <button className="btn btn-link text-muted" onClick={() => setEditingSection(s.id)} title="Rename"><i className="bi bi-pencil" /></button>
                <button className="btn btn-link text-danger" onClick={() => deleteSection(s.id)} title="Delete"><i className="bi bi-trash" /></button>
              </div>
            </div>
            <div className="px-3 pb-3 d-grid gap-2">
              {s.lectures.map((l, li) => (
                <div className="builder-lecture" key={l.id}>
                  <i className={`bi ${l.videoUrl ? 'bi-play-circle-fill text-primary' : 'bi-exclamation-circle text-warning'}`} title={l.videoUrl ? 'Has video' : 'No video yet'} />
                  <div className="flex-grow-1 min-w-0">
                    <div className="small fw-semibold text-truncate">{li + 1}. {l.title}</div>
                    <div className="fs-8 text-muted-2">{formatClock(l.duration)} {l.isPreview && <span className="badge bg-soft text-primary ms-1">Free preview</span>}</div>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-link text-muted" onClick={() => moveLecture(s.id, li, -1)} disabled={li === 0}><i className="bi bi-chevron-up" /></button>
                    <button className="btn btn-link text-muted" onClick={() => moveLecture(s.id, li, 1)} disabled={li === s.lectures.length - 1}><i className="bi bi-chevron-down" /></button>
                    <button className="btn btn-link text-muted" onClick={() => openLecture(s.id, l)}><i className="bi bi-pencil" /></button>
                    <button className="btn btn-link text-danger" onClick={() => deleteLecture(s.id, l.id)}><i className="bi bi-trash" /></button>
                  </div>
                </div>
              ))}
              <button className="btn btn-sm btn-outline-primary border-dashed justify-self-start" style={{ borderStyle: 'dashed' }} onClick={() => openLecture(s.id)}>
                <i className="bi bi-plus-lg me-1" />Add lecture
              </button>
            </div>
          </div>
        ))}

        <form className="d-flex gap-2" onSubmit={addSection}>
          <input className="form-control" placeholder="New section title, e.g. Getting started" value={newSection} onChange={(e) => setNewSection(e.target.value)} />
          <button className="btn btn-primary text-nowrap"><i className="bi bi-plus-lg me-1" />Add section</button>
        </form>
      </div>

      {lectureModal && (
        <div className="modal-backdrop-lh" onClick={() => setLectureModal(null)}>
          <form className="modal-panel" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()} onSubmit={saveLecture}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <span className="fw-bold">{lectureModal.lecture ? 'Edit lecture' : 'New lecture'}</span>
              <button type="button" className="btn-close" onClick={() => setLectureModal(null)} />
            </div>
            <div className="p-4 d-grid gap-3">
              <div><label className="form-label">Title</label><input className="form-control" required value={lf.title} onChange={(e) => setLf({ ...lf, title: e.target.value })} autoFocus /></div>
              <div>
                <label className="form-label">Video URL</label>
                <input className="form-control" value={lf.videoUrl} onChange={(e) => setLf({ ...lf, videoUrl: e.target.value })} onBlur={detectDuration} placeholder="https://youtube.com/watch?v=… or https://…/video.mp4" />
                <div className="fs-8 text-muted-2 mt-1">Direct .mp4 links get automatic duration detection and auto-complete when finished.</div>
              </div>
              <div className="row g-2">
                <div className="col-6"><label className="form-label">Minutes</label><input type="number" min={0} className="form-control" value={lf.minutes} onChange={(e) => setLf({ ...lf, minutes: e.target.value })} /></div>
                <div className="col-6"><label className="form-label">Seconds</label><input type="number" min={0} max={59} className="form-control" value={lf.seconds} onChange={(e) => setLf({ ...lf, seconds: e.target.value })} /></div>
              </div>
              <div><label className="form-label">Description</label><textarea className="form-control" rows={3} value={lf.description} onChange={(e) => setLf({ ...lf, description: e.target.value })} /></div>
              <div><label className="form-label">Downloadable resource URL <span className="text-muted-2 fw-normal">(optional)</span></label><input className="form-control" value={lf.resourceUrl} onChange={(e) => setLf({ ...lf, resourceUrl: e.target.value })} placeholder="https://… (PDF, zip, GitHub repo)" /></div>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="preview" checked={lf.isPreview} onChange={(e) => setLf({ ...lf, isPreview: e.target.checked })} />
                <label className="form-check-label" htmlFor="preview">Free preview — anyone can watch this lecture</label>
              </div>
            </div>
            <div className="p-3 border-top d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-link" onClick={() => setLectureModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save lecture'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
