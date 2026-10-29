'use client';

import toast from 'react-hot-toast';

export default function PrintButton() {
  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Verification link copied');
  };
  return (
    <div className="d-flex gap-2">
      <button className="btn btn-soft btn-sm" onClick={copy}><i className="bi bi-link-45deg me-1" />Copy link</button>
      <button className="btn btn-primary btn-sm" onClick={() => window.print()}><i className="bi bi-printer me-1" />Print / Save PDF</button>
    </div>
  );
}
