'use client';

import { useState } from 'react';

/**
 * Confirmation dialog for moderation actions. The reason is sent to the affected
 * user and stored in the audit log, so presets keep wording consistent.
 */
export default function ReasonDialog({ title, description, confirmLabel = 'Confirm', danger = false, requireReason = true, presets = [], holdOption = false, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [hold, setHold] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onConfirm(reason.trim(), { holdPayouts: hold });
      onClose();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop-lh" onClick={onClose}>
      <form className="modal-panel" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <span className="fw-bold">{title}</span>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
        </div>
        <div className="p-4 d-grid gap-3">
          {description && <p className="small text-muted-2 mb-0">{description}</p>}
          {presets.length > 0 && (
            <div className="d-flex flex-wrap gap-2">
              {presets.map((p) => (
                <button type="button" key={p} className={`chip ${reason === p ? 'active' : ''}`} onClick={() => setReason(p)}>{p}</button>
              ))}
            </div>
          )}
          <div>
            <label className="form-label" htmlFor="reason">Reason {requireReason ? '' : <span className="text-muted-2 fw-normal">(optional)</span>}</label>
            <textarea id="reason" className="form-control" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Shown to the user and saved in the activity log" autoFocus />
          </div>
          {holdOption && (
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="hold" checked={hold} onChange={(e) => setHold(e.target.checked)} />
              <label className="form-check-label small" htmlFor="hold">Hold their payouts until this is resolved</label>
            </div>
          )}
        </div>
        <div className="p-3 border-top d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy || (requireReason && reason.trim().length < 5)}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
