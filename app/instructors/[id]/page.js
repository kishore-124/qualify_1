import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Avatar from '@/components/Avatar';
import CourseCard from '@/components/CourseCard';
import { courseCardSelect, withStats } from '@/lib/queries';
import { compactNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function InstructorProfile({ params }) {
  const { id } = await params;
  const instructor = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, avatar: true, headline: true, bio: true, website: true, role: true, status: true },
  });
  if (!instructor || instructor.role === 'STUDENT' || instructor.status !== 'ACTIVE') notFound();

  const courses = await withStats(
    await prisma.course.findMany({ where: { instructorId: id, status: 'PUBLISHED' }, orderBy: { studentCount: 'desc' }, select: courseCardSelect })
  );
  const students = courses.reduce((n, c) => n + c.studentCount, 0);
  const reviews = courses.reduce((n, c) => n + c.reviewCount, 0);
  const rating = reviews ? courses.reduce((n, c) => n + c.avgRating * c.reviewCount, 0) / reviews : 0;

  return (
    <>
      <section className="page-header py-5">
        <div className="container-xl d-flex flex-wrap align-items-center gap-4">
          <Avatar user={instructor} size="xl" />
          <div className="flex-grow-1">
            <div className="eyebrow text-white-50">Instructor</div>
            <h1 className="fw-bold mb-1">{instructor.name}</h1>
            <div className="text-white-50 mb-3">{instructor.headline}</div>
            <div className="d-flex flex-wrap gap-4">
              {[[compactNumber(students), 'Students'], [reviews, 'Reviews'], [rating.toFixed(1), 'Rating'], [courses.length, 'Courses']].map(([v, l]) => (
                <div key={l}><div className="fs-4 fw-bold">{v}</div><div className="fs-7 text-white-50">{l}</div></div>
              ))}
            </div>
          </div>
          {instructor.website && <a href={instructor.website} target="_blank" rel="noreferrer" className="btn btn-outline-light"><i className="bi bi-globe me-1" />Website</a>}
        </div>
      </section>
      <div className="container-xl py-5">
        {instructor.bio && (
          <div className="mb-5" style={{ maxWidth: 800 }}>
            <h4 className="fw-bold mb-3">About me</h4>
            <p style={{ whiteSpace: 'pre-line' }}>{instructor.bio}</p>
          </div>
        )}
        <h4 className="fw-bold mb-4">Courses by {instructor.name.split(' ')[0]} ({courses.length})</h4>
        <div className="row g-4">
          {courses.map((c) => <div className="col-sm-6 col-lg-3" key={c.id}><CourseCard course={c} /></div>)}
        </div>
      </div>
    </>
  );
}
