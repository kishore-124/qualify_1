import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
      <div className="display-1 fw-bold gradient-text-dark mt-5">404</div>
      <h2 className="fw-bold mb-3">This page wandered off to study</h2>
      <p className="text-muted-2 mb-4">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <div className="d-flex gap-2 justify-content-center">
        <Link href="/" className="btn btn-primary">Go home</Link>
        <Link href="/courses" className="btn btn-soft">Browse courses</Link>
      </div>
    </div>
  );
}
