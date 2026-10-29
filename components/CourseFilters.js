'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LEVELS } from '@/lib/utils';

export default function CourseFilters({ categories, params }) {
  const router = useRouter();
  const [q, setQ] = useState(params.q || '');

  const update = (key, value) => {
    const sp = new URLSearchParams(params);
    if (value === undefined || value === '' || sp.get(key) === String(value)) sp.delete(key);
    else sp.set(key, value);
    sp.delete('page');
    router.push(`/courses?${sp.toString()}`);
  };

  const hasFilters = ['q', 'category', 'level', 'price', 'rating'].some((k) => params[k]);

  return (
    <div className="d-grid gap-3 sticky-lg-top" style={{ top: 90 }}>
      <form
        className="nav-search"
        onSubmit={(e) => {
          e.preventDefault();
          update('q', q.trim());
        }}
      >
        <i className="bi bi-search" />
        <input className="form-control" placeholder="Search courses" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>

      <div className="filter-card">
        <h6 className="mb-3">Sort by</h6>
        <select className="form-select" value={params.sort || 'popular'} onChange={(e) => update('sort', e.target.value)}>
          <option value="popular">Most popular</option>
          <option value="rating">Highest rated</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      <div className="filter-card">
        <h6 className="mb-3">Category</h6>
        <div className="d-flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.id} className={`chip ${params.category === c.slug ? 'active' : ''}`} onClick={() => update('category', c.slug)}>
              <i className={`bi ${c.icon}`} /> {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-card">
        <h6 className="mb-3">Rating</h6>
        {[4.5, 4, 3.5, 3].map((r) => (
          <div className="form-check mb-2" key={r}>
            <input className="form-check-input" type="radio" id={`r${r}`} checked={params.rating === String(r)} onChange={() => update('rating', r)} />
            <label className="form-check-label d-flex align-items-center gap-1" htmlFor={`r${r}`}>
              <span className="stars small"><i className="bi bi-star-fill" /></span>
              <span className="fw-semibold">{r} & up</span>
            </label>
          </div>
        ))}
      </div>

      <div className="filter-card">
        <h6 className="mb-3">Level</h6>
        {Object.entries(LEVELS).map(([k, v]) => (
          <div className="form-check mb-2" key={k}>
            <input className="form-check-input" type="checkbox" id={k} checked={params.level === k} onChange={() => update('level', k)} />
            <label className="form-check-label" htmlFor={k}>{v}</label>
          </div>
        ))}
      </div>

      <div className="filter-card">
        <h6 className="mb-3">Price</h6>
        <div className="d-flex gap-2">
          <button className={`chip ${params.price === 'free' ? 'active' : ''}`} onClick={() => update('price', 'free')}>Free</button>
          <button className={`chip ${params.price === 'paid' ? 'active' : ''}`} onClick={() => update('price', 'paid')}>Paid</button>
        </div>
      </div>

      {hasFilters && (
        <button className="btn btn-soft" onClick={() => router.push('/courses')}>
          <i className="bi bi-x-circle me-1" /> Clear all filters
        </button>
      )}
    </div>
  );
}
