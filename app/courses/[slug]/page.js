import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import StarRating from '@/components/StarRating';
import Avatar from '@/components/Avatar';
import CourseCard from '@/components/CourseCard';
import CourseActions from '@/components/CourseActions';
import Curriculum from '@/components/Curriculum';
import ReportButton from '@/components/ReportButton';
import { courseCardSelect, withStats } from '@/lib/queries';
import { formatDuration, formatDate, LEVELS, timeAgo, compactNumber, FALLBACK_THUMB } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getCourse(slug) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      instructor: { select: { id: true, name: true, avatar: true, headline: true, bio: true, status: true } },
      sections: {
        orderBy: { position: 'asc' },
        include: {
          lectures: {
            orderBy: { position: 'asc' },
            select: { id: true, title: true, duration: true, isPreview: true, videoUrl: true },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { title: true, subtitle: true, thumbnail: true } });
  if (!course) return { title: 'Course not found' };
  return { title: course.title, description: course.subtitle, openGraph: { images: course.thumbnail ? [course.thumbnail] : [] } };
}

export default async function CourseDetailPage({ params }) {
  const { slug } = await params;
  const [course, user] = await Promise.all([getCourse(slug), getCurrentUser()]);
  if (!course) notFound();

  const isOwner = !!user && (user.id === course.instructorId || user.role === 'ADMIN');
  if (course.status !== 'PUBLISHED' && !isOwner) notFound();
  const purchasable = course.status === 'PUBLISHED' && course.instructor.status === 'ACTIVE';

  // Only preview lectures expose their video publicly
  const sections = course.sections.map((s) => ({
    ...s,
    lectures: s.lectures.map((l) => ({ ...l, videoUrl: l.isPreview ? l.videoUrl : null })),
  }));
  const lectures = sections.flatMap((s) => s.lectures);
  const totalDuration = lectures.reduce((n, l) => n + l.duration, 0);

  const [enrollment, inCart, inWishlist, reviews, groups, instructorStats, moreRaw] = await Promise.all([
    user ? prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null,
    user ? prisma.cartItem.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null,
    user ? prisma.wishlistItem.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null,
    prisma.review.findMany({
      where: { courseId: course.id, hidden: false },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true, avatar: true } } },
    }),
    prisma.review.groupBy({ by: ['rating'], where: { courseId: course.id, hidden: false }, _count: { _all: true } }),
    prisma.course.aggregate({
      where: { instructorId: course.instructorId, status: 'PUBLISHED' },
      _sum: { studentCount: true, reviewCount: true },
      _count: { _all: true },
      _avg: { avgRating: true },
    }),
    prisma.course.findMany({
      where: { status: 'PUBLISHED', id: { not: course.id }, OR: [{ categoryId: course.categoryId }, { instructorId: course.instructorId }] },
      orderBy: { studentCount: 'desc' },
      take: 4,
      select: courseCardSelect,
    }),
  ]);
  const more = await withStats(moreRaw);
  const distribution = [5, 4, 3, 2, 1].map((r) => ({ r, n: groups.find((g) => g.rating === r)?._count._all || 0 }));

  return (
    <>
      {course.status === 'PUBLISHED' && course.instructor.status !== 'ACTIVE' && (
        <div className="alert alert-warning rounded-0 mb-0 text-center small fw-semibold">
          This course is temporarily unavailable for new students. If you’re enrolled, your access continues as normal.
        </div>
      )}
      {course.status !== 'PUBLISHED' && (
        <div className="alert alert-warning rounded-0 mb-0 text-center small fw-semibold">
          <i className="bi bi-eye me-1" /> Preview mode — this course is <b>{course.status.toLowerCase()}</b> and not visible to students.
          {user?.role === 'ADMIN' && <Link href={`/admin/courses/${course.id}`} className="ms-2 fw-bold">Open in review console</Link>}
        </div>
      )}

      <section className="course-hero">
        <div className="container-xl">
          <div className="row">
            <div className="col-lg-8">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb small mb-3">
                  <li className="breadcrumb-item"><Link href="/courses" className="text-white-50 text-decoration-none">Courses</Link></li>
                  {course.category && (
                    <li className="breadcrumb-item"><Link href={`/courses?category=${course.category.slug}`} className="text-decoration-none" style={{ color: '#c4b5fd' }}>{course.category.name}</Link></li>
                  )}
                </ol>
              </nav>
              <h1 className="fw-bold display-6 mb-3">{course.title}</h1>
              {course.subtitle && <p className="lead text-white-50 mb-3">{course.subtitle}</p>}
              <div className="d-flex flex-wrap align-items-center gap-3 mb-3 small">
                {course.studentCount >= 50 && <span className="badge badge-bestseller">Bestseller</span>}
                {course.reviewCount > 0 && <StarRating value={course.avgRating} showValue count={course.reviewCount} />}
                <span className="text-white-50"><i className="bi bi-people me-1" />{course.studentCount.toLocaleString()} students</span>
              </div>
              <div className="small mb-3">
                Created by <Link href={`/instructors/${course.instructor.id}`} className="fw-semibold" style={{ color: '#c4b5fd' }}>{course.instructor.name}</Link>
              </div>
              <div className="d-flex flex-wrap gap-3 small text-white-50">
                <span><i className="bi bi-clock-history me-1" />Updated {formatDate(course.updatedAt)}</span>
                <span><i className="bi bi-globe me-1" />{course.language}</span>
                <span><i className="bi bi-bar-chart me-1" />{LEVELS[course.level]}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-xl py-5">
        <div className="row g-5">
          {/* Buy box (first on mobile) */}
          <div className="col-lg-4 order-lg-2">
            <div className="buy-card buy-card-sticky">
              <CourseActions
                course={{
                  id: course.id,
                  slug: course.slug,
                  title: course.title,
                  price: course.price,
                  discountPrice: course.discountPrice,
                  thumbnail: course.thumbnail || FALLBACK_THUMB,
                  previewVideo: course.previewVideo,
                }}
                state={{ loggedIn: !!user, enrolled: !!enrollment, inCart: !!inCart, inWishlist: !!inWishlist, isOwner, purchasable, progress: enrollment?.progress || 0 }}
                includes={[
                  ['bi-play-btn', `${formatDuration(totalDuration)} on-demand video`],
                  ['bi-collection', `${lectures.length} lectures`],
                  ['bi-phone', 'Access on mobile and desktop'],
                  ['bi-infinity', 'Full lifetime access'],
                  ['bi-award', 'Certificate of completion'],
                  ['bi-chat-dots', 'Instructor Q&A'],
                ]}
              />
            </div>
          </div>

          <div className="col-lg-8 order-lg-1">
            {course.outcomes.length > 0 && (
              <div className="outcomes-box mb-5">
                <h4 className="fw-bold mb-3">What you&apos;ll learn</h4>
                <div className="row g-2">
                  {course.outcomes.map((o, i) => (
                    <div className="col-md-6 d-flex gap-2" key={i}>
                      <i className="bi bi-check2 text-primary fs-5 lh-1" />
                      <span className="small">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.tags.length > 0 && (
              <div className="mb-5 d-flex flex-wrap gap-2">
                {course.tags.map((t) => (
                  <Link key={t} href={`/courses?q=${encodeURIComponent(t)}`} className="chip">#{t}</Link>
                ))}
              </div>
            )}

            <div className="mb-5">
              <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-2">
                <h4 className="fw-bold mb-0">Course content</h4>
                <span className="small text-muted-2">
                  {sections.length} sections • {lectures.length} lectures • {formatDuration(totalDuration)} total length
                </span>
              </div>
              <Curriculum sections={sections} />
            </div>

            {course.requirements.length > 0 && (
              <div className="mb-5">
                <h4 className="fw-bold mb-3">Requirements</h4>
                <ul className="mb-0">
                  {course.requirements.map((r, i) => <li key={i} className="mb-1">{r}</li>)}
                </ul>
              </div>
            )}

            {course.description && (
              <div className="mb-5">
                <h4 className="fw-bold mb-3">Description</h4>
                <div style={{ whiteSpace: 'pre-line' }} className="text-body">{course.description}</div>
              </div>
            )}

            {/* Instructor */}
            <div className="mb-5">
              <h4 className="fw-bold mb-3">Your instructor</h4>
              <div className="panel p-4">
                <div className="d-flex gap-3 align-items-center mb-3">
                  <Avatar user={course.instructor} size="lg" />
                  <div>
                    <Link href={`/instructors/${course.instructor.id}`} className="fw-bold fs-5 text-decoration-none">{course.instructor.name}</Link>
                    {course.instructor.headline && <div className="text-muted-2 small">{course.instructor.headline}</div>}
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-4 small mb-3">
                  <span><i className="bi bi-star-fill text-warning me-1" />{(instructorStats._avg.avgRating || 0).toFixed(1)} instructor rating</span>
                  <span><i className="bi bi-award me-1" />{compactNumber(instructorStats._sum.reviewCount || 0)} reviews</span>
                  <span><i className="bi bi-people me-1" />{compactNumber(instructorStats._sum.studentCount || 0)} students</span>
                  <span><i className="bi bi-play-circle me-1" />{instructorStats._count._all} courses</span>
                </div>
                {course.instructor.bio && <p className="mb-0 small" style={{ whiteSpace: 'pre-line' }}>{course.instructor.bio}</p>}
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-5" id="reviews">
              <h4 className="fw-bold mb-3">Student feedback</h4>
              {course.reviewCount === 0 ? (
                <p className="text-muted-2">No reviews yet. Enrolled students can leave a review from the course player.</p>
              ) : (
                <>
                  <div className="row g-4 align-items-center mb-3">
                    <div className="col-sm-4 text-center">
                      <div className="display-3 fw-bold" style={{ color: '#b45309' }}>{course.avgRating.toFixed(1)}</div>
                      <StarRating value={course.avgRating} size="1.1rem" />
                      <div className="small text-muted-2 mt-1">Course rating</div>
                    </div>
                    <div className="col-sm-8">
                      {distribution.map(({ r, n }) => (
                        <div className="d-flex align-items-center gap-2 mb-2" key={r}>
                          <div className="rating-bar flex-grow-1"><div style={{ width: `${course.reviewCount ? (n / course.reviewCount) * 100 : 0}%` }} /></div>
                          <span className="small text-nowrap" style={{ width: 90 }}><StarRating value={r} size="0.7rem" /></span>
                          <span className="small text-muted-2" style={{ width: 40 }}>{course.reviewCount ? Math.round((n / course.reviewCount) * 100) : 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {reviews.map((r) => (
                    <div className="review-card d-flex gap-3" key={r.id}>
                      <Avatar user={r.user} />
                      <div>
                        <div className="fw-bold">{r.user.name}</div>
                        <div className="d-flex gap-2 align-items-center mb-1">
                          <StarRating value={r.rating} size="0.75rem" />
                          <span className="fs-7 text-muted-2">{timeAgo(r.createdAt)}</span>
                        </div>
                        {r.comment && <p className="mb-0 small">{r.comment}</p>}
                        <ReportButton targetType="REVIEW" targetId={r.id} />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {more.length > 0 && (
          <div className="pt-4">
            <h4 className="fw-bold mb-4">Students also bought</h4>
            <div className="row g-4">
              {more.map((c) => (
                <div className="col-sm-6 col-lg-3" key={c.id}><CourseCard course={c} /></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
