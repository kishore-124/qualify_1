import Link from 'next/link';
import SwaggerDocs from '@/components/SwaggerDocs';

export const metadata = { title: 'API documentation' };

export default function DocsPage() {
  return (
    <>
      <section className="page-header py-4">
        <div className="container-xl d-flex flex-wrap justify-content-between align-items-end gap-3">
          <div>
            <h1 className="page-title mb-1">API documentation</h1>
            <p className="text-muted-2 mb-0" style={{ maxWidth: '44rem' }}>
              Every Qualify endpoint, with request and response shapes. Log in with <code>POST /api/auth/login</code> first — the
              session cookie is reused by <b>Try it out</b>. All amounts are US dollars.
            </p>
          </div>
          <div className="d-flex gap-2">
            <a href="/api/openapi.json" className="btn btn-outline-primary btn-sm" download="qualify-openapi.json">
              <i className="bi bi-download me-1" />OpenAPI JSON
            </a>
            <Link href="/" className="btn btn-ghost btn-sm">Back to site</Link>
          </div>
        </div>
      </section>
      <div className="container-xl py-3">
        <SwaggerDocs url="/api/openapi.json" />
      </div>
    </>
  );
}
