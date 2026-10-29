'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/EmptyState';

export default function WishlistPage() {
  const { setCounts, addToCart: addCourse } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    api('/api/wishlist').then((d) => setItems(d.items)).catch(() => setItems([]));
  }, []);

  const remove = async (courseId) => {
    await api('/api/wishlist', { method: 'POST', body: { courseId } });
    setItems((i) => i.filter((x) => x.courseId !== courseId));
    setCounts((c) => ({ ...c, wishlist: Math.max(0, c.wishlist - 1) }));
  };

  const addToCart = (course) => addCourse(course);

  return (
    <>
      <section className="page-header">
        <div className="container-xl">
          <h1 className="fw-bold mb-1"><i className="bi bi-heart-fill me-2" style={{ color: '#e5484d' }} />Wishlist</h1>
          <p className="text-white-50 mb-0">Courses you&apos;ve saved for later</p>
        </div>
      </section>
      <div className="container-xl py-5">
        {items === null ? (
          <div className="skeleton" style={{ height: 280 }} />
        ) : items.length === 0 ? (
          <EmptyState icon="bi-heart" title="Your wishlist is empty" text="Tap the heart on any course to save it here." actionHref="/courses" actionLabel="Explore courses" />
        ) : (
          <div className="row g-4">
            {items.map(({ course, courseId }) => (
              <div className="col-sm-6 col-lg-4 col-xl-3" key={courseId}>
                <div className="h-100 d-flex flex-column">
                  <div className="flex-grow-1"><CourseCard course={course} /></div>
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-primary btn-sm flex-fill" onClick={() => addToCart(course)}><i className="bi bi-cart-plus me-1" />Add to cart</button>
                    <button className="btn btn-soft btn-sm" onClick={() => remove(courseId)} aria-label="Remove"><i className="bi bi-trash" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
