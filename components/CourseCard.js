import Link from 'next/link';
import StarRating from './StarRating';
import { formatPrice, effectivePrice, LEVELS, FALLBACK_THUMB, formatDuration, compactNumber } from '@/lib/utils';

export default function CourseCard({ course }) {
  const price = effectivePrice(course);
  const hasDiscount = price < course.price;
  const isNew = Date.now() - new Date(course.createdAt).getTime() < 1000 * 60 * 60 * 24 * 30;
  const bestseller = course.studentCount >= 50;

  return (
    <div className="card course-card h-100">
      <div className="course-thumb-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={course.thumbnail || FALLBACK_THUMB} alt={course.title} className="course-thumb" loading="lazy" />
        <div className="badges">
          {course.featured && <span className="badge badge-featured">Featured</span>}
          {bestseller && <span className="badge badge-bestseller">Bestseller</span>}
          {!bestseller && isNew && <span className="badge badge-new">New</span>}
        </div>
      </div>
      <div className="card-body d-flex flex-column p-3">
        {course.category && <div className="card-cat">{course.category.name}</div>}
        <h3 className="card-title line-clamp-2 mb-1">
          <Link href={`/courses/${course.slug}`}>{course.title}</Link>
        </h3>
        <div className="text-muted-2 fs-7 mb-2">{course.instructor?.name}</div>
        <div className="mb-2">
          {course.reviewCount > 0 ? (
            <StarRating value={course.avgRating} showValue count={course.reviewCount} />
          ) : (
            <span className="fs-7 text-muted-2">No reviews yet</span>
          )}
        </div>
        <div className="d-flex flex-wrap gap-2 fs-8 text-muted-2 mb-3">
          <span><i className="bi bi-bar-chart me-1" />{LEVELS[course.level]}</span>
          {course.lectures > 0 && <span><i className="bi bi-play-circle me-1" />{course.lectures} lectures</span>}
          {course.duration > 0 && <span><i className="bi bi-clock me-1" />{formatDuration(course.duration)}</span>}
          {course.studentCount > 0 && <span><i className="bi bi-people me-1" />{compactNumber(course.studentCount)}</span>}
        </div>
        <div className="mt-auto d-flex align-items-baseline gap-2">
          <span className="price fs-5">{formatPrice(price)}</span>
          {hasDiscount && <span className="price-old">{formatPrice(course.price)}</span>}
        </div>
      </div>
    </div>
  );
}
