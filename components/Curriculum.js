'use client';

import { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { formatClock, formatDuration } from '@/lib/utils';

export default function Curriculum({ sections }) {
  const [open, setOpen] = useState(() => new Set(sections.slice(0, 1).map((s) => s.id)));
  const [preview, setPreview] = useState(null);

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allOpen = open.size === sections.length;

  return (
    <>
      <div className="text-end mb-2">
        <button className="btn btn-link btn-sm fw-semibold p-0" onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((s) => s.id)))}>
          {allOpen ? 'Collapse all sections' : 'Expand all sections'}
        </button>
      </div>
      <div className="accordion curriculum">
        {sections.map((s, i) => {
          const dur = s.lectures.reduce((n, l) => n + l.duration, 0);
          const isOpen = open.has(s.id);
          return (
            <div className="accordion-item" key={s.id}>
              <h2 className="accordion-header">
                <button className={`accordion-button ${isOpen ? '' : 'collapsed'}`} onClick={() => toggle(s.id)}>
                  <span className="me-auto">Section {i + 1}: {s.title}</span>
                  <span className="fs-7 text-muted-2 fw-normal me-3 d-none d-sm-inline">{s.lectures.length} lectures • {formatDuration(dur)}</span>
                </button>
              </h2>
              {isOpen && (
                <div className="accordion-body py-2">
                  {s.lectures.map((l) => (
                    <div className="lecture-row" key={l.id}>
                      <i className={`bi ${l.isPreview ? 'bi-play-circle-fill text-primary' : 'bi-play-circle'} text-muted-2`} />
                      {l.isPreview && l.videoUrl ? (
                        <button className="btn btn-link p-0 text-start flex-grow-1 small fw-semibold" onClick={() => setPreview(l)}>{l.title}</button>
                      ) : (
                        <span className="flex-grow-1">{l.title}</span>
                      )}
                      {l.isPreview && <span className="badge bg-soft text-primary">Preview</span>}
                      <span className="text-muted-2 fs-7">{formatClock(l.duration)}</span>
                    </div>
                  ))}
                  {s.lectures.length === 0 && <div className="text-muted-2 small py-2">No lectures yet</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {preview && (
        <div className="modal-backdrop-lh" onClick={() => setPreview(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <div><div className="fs-7 text-muted-2">Free preview</div><div className="fw-bold">{preview.title}</div></div>
              <button className="btn-close" onClick={() => setPreview(null)} />
            </div>
            <div className="player-video"><VideoPlayer url={preview.videoUrl} autoPlay /></div>
          </div>
        </div>
      )}
    </>
  );
}
