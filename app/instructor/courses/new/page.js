'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { LEVELS } from '@/lib/utils';

export default function NewCoursePage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', subtitle: '', categoryId: '', level: 'ALL_LEVELS' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/categories').then((d) => setCategories(d.categories));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { course } = await api('/api/courses', { method: 'POST', body: form });
      toast.success('Course created! Now build your curriculum.');
      router.push(`/instructor/courses/${course.id}?tab=curriculum`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="bg-surface py-5" style={{ minHeight: 'calc(100vh - 66px)' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="text-center mb-4">
          <span className="feature-icon mb-3" style={{ background: '#eef0fe', color: '#2b3fe0' }}><i className="bi bi-magic" /></span>
          <h1 className="fw-bold h2">Let&apos;s create your course</h1>
          <p className="text-muted-2">Start with the basics — you can change everything later.</p>
        </div>
        <form className="panel p-4 p-md-5 d-grid gap-4" onSubmit={submit}>
          <div>
            <label className="form-label">Working title</label>
            <input className="form-control form-control-lg" maxLength={90} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. The Complete React Developer Course" />
            <div className="fs-8 text-muted-2 text-end mt-1">{form.title.length}/90</div>
          </div>
          <div>
            <label className="form-label">Subtitle</label>
            <input className="form-control" maxLength={140} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="A short, catchy one-line description" />
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Choose a category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Level</label>
              <select className="form-select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? <span className="spinner-border spinner-border-sm" /> : <>Create course <i className="bi bi-arrow-right ms-1" /></>}</button>
        </form>
      </div>
    </div>
  );
}
