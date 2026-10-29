import Link from 'next/link';
import prisma from '@/lib/prisma';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';
import CourseFilters from '@/components/CourseFilters';
import { searchCourses, withStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Browse courses' };

export default async function CoursesPage({ searchParams }) {
  const params = await searchParams;
  const [result, categories] = await Promise.all([
    searchCourses({ ...params, limit: 12 }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  const courses = await withStats(result.courses);
  const activeCategory = categories.find((c) => c.slug === params.category);

  const pageHref = (p) => {
    const sp = new URLSearchParams(params);
    sp.set('page', p);
    return `/courses?${sp.toString()}`;
  };

  return (
    <>
      <section className="page-header">
        <div className="container-xl">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-2">
              <li className="breadcrumb-item"><Link href="/">Home</Link></li>
              <li className="breadcrumb-item active text-white">Courses</li>
            </ol>
          </nav>
          <h1 className="fw-bold mb-1">
            {params.q ? <>Results for &ldquo;{params.q}&rdquo;</> : activeCategory ? activeCategory.name : 'Explore all courses'}
          </h1>
          <p className="text-white-50 mb-0">{result.total.toLocaleString()} course{result.total === 1 ? '' : 's'} found</p>
        </div>
      </section>

      <div className="container-xl py-4 py-lg-5">
        <div className="row g-4">
          <div className="col-lg-3">
            <CourseFilters categories={categories} params={params} />
          </div>
          <div className="col-lg-9">
            {courses.length === 0 ? (
              <EmptyState icon="bi-search" title="No courses match your filters" text="Try removing some filters or searching for something else." actionHref="/courses" actionLabel="Clear filters" />
            ) : (
              <>
                <div className="row g-4">
                  {courses.map((c) => (
                    <div className="col-sm-6 col-xl-4" key={c.id}><CourseCard course={c} /></div>
                  ))}
                </div>
                {result.pages > 1 && (
                  <nav className="mt-5 d-flex justify-content-center">
                    <ul className="pagination">
                      <li className={`page-item ${result.page <= 1 ? 'disabled' : ''}`}>
                        <Link className="page-link" href={pageHref(result.page - 1)}><i className="bi bi-chevron-left" /></Link>
                      </li>
                      {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
                        <li key={p} className={`page-item ${p === result.page ? 'active' : ''}`}>
                          <Link className="page-link" href={pageHref(p)}>{p}</Link>
                        </li>
                      ))}
                      <li className={`page-item ${result.page >= result.pages ? 'disabled' : ''}`}>
                        <Link className="page-link" href={pageHref(result.page + 1)}><i className="bi bi-chevron-right" /></Link>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
