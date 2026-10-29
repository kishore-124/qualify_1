'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSearch() {
  const [q, setQ] = useState('');
  const router = useRouter();
  return (
    <form
      className="hero-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/courses${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
      }}
    >
      <i className="bi bi-search text-muted-2 ms-2" aria-hidden="true" />
      <input className="form-control" placeholder="Search 'Python for data analysis'" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search courses" />
      <button className="btn btn-primary btn-lg px-4" type="submit">Search</button>
    </form>
  );
}
