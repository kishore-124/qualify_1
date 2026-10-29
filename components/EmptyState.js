import Link from 'next/link';

export default function EmptyState({ icon = 'bi-inbox', title, text, actionHref, actionLabel }) {
  return (
    <div className="empty-state">
      <div className="ico"><i className={`bi ${icon}`} /></div>
      <h5 className="fw-bold">{title}</h5>
      {text && <p className="text-muted-2 mx-auto" style={{ maxWidth: 420 }}>{text}</p>}
      {actionHref && (
        <Link href={actionHref} className="btn btn-primary mt-2">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
