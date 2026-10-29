import { buildOpenApiSpec } from '@/lib/openapi';

// GET /api/openapi.json — machine-readable API description (OpenAPI 3.1)
export async function GET() {
  return Response.json(buildOpenApiSpec(), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
