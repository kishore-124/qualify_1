'use client';

import 'swagger-ui-dist/swagger-ui.css';
import { useEffect, useRef, useState } from 'react';

/** Renders Swagger UI (bundled locally from swagger-ui-dist — no CDN needed). */
export default function SwaggerDocs({ url }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import('swagger-ui-dist/swagger-ui-bundle.js')
      .then((mod) => {
        if (cancelled || !ref.current) return;
        const SwaggerUIBundle = mod.default || mod;
        SwaggerUIBundle({
          url,
          domNode: ref.current,
          deepLinking: true,
          docExpansion: 'list',
          defaultModelsExpandDepth: 0,
          displayRequestDuration: true,
          filter: true,
          persistAuthorization: true,
          tryItOutEnabled: false,
          requestInterceptor: (req) => {
            req.credentials = 'same-origin'; // send the login cookie with "Try it out"
            return req;
          },
        });
      })
      .catch((e) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) return <div className="alert alert-danger">Couldn’t load the API explorer: {error}. The raw spec is at <a href={url}>{url}</a>.</div>;
  return <div ref={ref} className="swagger-host" />;
}
