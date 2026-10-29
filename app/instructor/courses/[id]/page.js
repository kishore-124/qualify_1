'use client';

import Link from 'next/link';
import { Suspense, use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import CurriculumBuilder from '@/components/instructor/CurriculumBuilder';
import { LEVELS, STATUS_BADGE, formatPrice, effectivePrice, FALLBACK_THUMB, getEmbedUrl } from '@/lib/utils';

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Spanish', 'French', 'German', 'Arabic', 'Japanese', 'Portuguese'];

export default function EditCoursePage({ params }) {
  const { id } = use(params);
  return (
    <Suspense>
      <Editor id={id} />
    </Suspense>
  );
}

function Editor({ id }) {
  const router = useRouter();
  const search = useSearchParams();
  const tab = search.get('tab') || 'details';
  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const hydrate = (c) => {
    setCourse(c);
    setForm({
      title: c.title,
      subtitle: c.subtitle || '',
      description: c.description || '',
      categoryId: c.categoryId || '',
      level: c.level,
      language: c.language,
      thumbnail: c.thumbnail || '',
      previewVideo: c.previewVideo || '',
      requirements: c.requirements.join('\n'),
      outcomes: c.outcomes.join('\n'),
      tags: c.tags.join(', '),
      price: c.price,
      discountPrice: c.discountPrice ?? '',
    });
  };

  const load = () =>
    api(`/api/courses/${id}`)
      .then((d) => hydrate(d.course))
      .catch((e) => {
        toast.error(e.message);
        router.push('/instructor');
      });

  useEffect(() => {
    load();
    api('/api/categories').then((d) => setCategories(d.categories));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setTab = (t) => router.replace(`/instructor/courses/${id}?tab=${t}`, { scroll: false });

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      const { course: updated } = await api(`/api/courses/${id}`, { method: 'PUT', body });
      hydrate(updated);
      toast.success('Changes saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const publish = async (action) => {
    try {
      const { course: c } = await api(`/api/courses/${id}/publish`, { method: 'POST', body: { action } });
      setCourse((prev) => ({ ...prev, status: c.status }));
      toast.success(action === 'unpublish' ? 'Course unpublished' : c.status === 'PUBLISHED' ? 'Course published!' : 'Submitted for review 🚀');
    } catch (err) {
      toast.error(err.message, { duration: 6000 });
    }
  };

  const remove = async () => {
    if (!confirm('Delete this course permanently? This cannot be undone.')) return;
    try {
      await api(`/api/courses/${id}`, { method: 'DELETE' });
      toast.success('Course deleted');
      router.push('/instructor');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!course || !form) return <div className="container py-5"><div className="skeleton" style={{ height: 420 }} /></div>;

  const lectureCount = course.sections.reduce((n, s) => n + s.lectures.length, 0);
  const checklist = [
    ['Title and subtitle', course.title && course.subtitle],
    ['Description (50+ characters)', (course.description || '').length >= 50],
    ['Category selected', !!course.categoryId],
    ['Course thumbnail', !!course.thumbnail],
    ['At least one learning outcome', course.outcomes.length > 0],
    ['At least one lecture', lectureCount > 0],
    ['Preview video (recommended)', !!course.previewVideo],
  ];
  const required = checklist.slice(0, 6);
  const ready = required.every(([, ok]) => ok);

  return (
    <>
      <div className="player-topbar">
        <div className="container-xl d-flex align-items-center gap-3 py-3 flex-wrap">
          <Link href="/instructor" className="text-white fs-5"><i className="bi bi-arrow-left" /></Link>
          <div className="min-w-0 me-auto">
            <div className="fw-bold text-truncate">{course.title}</div>
            <span className={`badge bg-${STATUS_BADGE[course.status]}`}>{course.status}</span>
            {['REJECTED', 'SUSPENDED'].includes(course.status) && course.rejectReason && <span className="ms-2 small text-warning">{course.rejectReason}</span>}
          </div>
          <Link href={`/courses/${course.slug}`} target="_blank" className="btn btn-outline-light btn-sm"><i className="bi bi-eye me-1" />Preview</Link>
          <Link href={`/learn/${course.slug}`} className="btn btn-outline-light btn-sm"><i className="bi bi-play-circle me-1" />Player</Link>
          {course.status === 'SUSPENDED' ? null : course.status === 'PUBLISHED' || course.status === 'PENDING' ? (
            <button className="btn btn-light btn-sm" onClick={() => publish('unpublish')}>Unpublish</button>
          ) : (
            <button className="btn btn-accent btn-sm" onClick={() => setTab('publish')}>Submit for review</button>
          )}
        </div>
      </div>

      <div className="container-xl py-4">
        <div className="row g-4">
          <div className="col-lg-3">
            <div className="panel p-2 sticky-lg-top" style={{ top: 90 }}>
              <nav className="nav nav-pills nav-pills-lh flex-column">
                {[
                  ['details', 'bi-card-text', 'Course details'],
                  ['curriculum', 'bi-list-nested', `Curriculum (${lectureCount})`],
                  ['pricing', 'bi-tag', 'Pricing'],
                  ['publish', 'bi-rocket-takeoff', 'Publish'],
                ].map(([k, icon, label]) => (
                  <button key={k} className={`nav-link text-start ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
                    <i className={`bi ${icon} me-2`} />{label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="col-lg-9">
            {tab === 'details' && (
              <form className="panel" onSubmit={save}>
                <div className="panel-header"><span className="fw-bold">Course landing page</span></div>
                <div className="panel-body row g-3">
                  <div className="col-12"><label className="form-label">Title</label><input className="form-control" maxLength={90} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                  <div className="col-12"><label className="form-label">Subtitle</label><input className="form-control" maxLength={140} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={7} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this course about? Who is it for? What makes it special?" />
                    <div className="fs-8 text-muted-2 mt-1">{form.description.length} characters (min 50)</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                      <option value="">Choose…</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Level</label>
                    <select className="form-select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                      {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Language</label>
                    <select className="form-select" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                      {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Thumbnail image URL</label>
                    <input className="form-control" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} placeholder="https://images.unsplash.com/…" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.thumbnail || FALLBACK_THUMB} alt="" className="rounded-3 mt-2 w-100" style={{ aspectRatio: '16/9', objectFit: 'cover', opacity: form.thumbnail ? 1 : 0.4 }} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Promo / preview video URL</label>
                    <input className="form-control" value={form.previewVideo} onChange={(e) => setForm({ ...form, previewVideo: e.target.value })} placeholder="YouTube, Vimeo or .mp4 link" />
                    <div className="fs-8 text-muted-2 mt-1">
                      {form.previewVideo ? (getEmbedUrl(form.previewVideo) ? '✓ Embeddable video link detected' : '✓ Direct video file') : 'Students watch this before buying.'}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">What students will learn <span className="text-muted-2 fw-normal">(one per line)</span></label>
                    <textarea className="form-control" rows={5} value={form.outcomes} onChange={(e) => setForm({ ...form, outcomes: e.target.value })} placeholder={'Build real-world apps\nUnderstand core concepts'} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Requirements <span className="text-muted-2 fw-normal">(one per line)</span></label>
                    <textarea className="form-control" rows={5} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder={'Basic computer skills\nNo prior experience needed'} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Tags <span className="text-muted-2 fw-normal">(comma separated — help students find your course)</span></label>
                    <input className="form-control" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, javascript, frontend" />
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                  </div>
                </div>
              </form>
            )}

            {tab === 'curriculum' && <CurriculumBuilder course={course} onChange={(sections) => setCourse((c) => ({ ...c, sections }))} />}

            {tab === 'pricing' && (
              <form className="panel" onSubmit={save}>
                <div className="panel-header"><span className="fw-bold">Pricing</span></div>
                <div className="panel-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label">List price</label>
                    <input type="number" min={0} step="0.01" className="form-control form-control-lg" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                    <div className="fs-8 text-muted-2 mt-1">Set 0 to make the course free.</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Sale price <span className="text-muted-2 fw-normal">(optional)</span></label>
                    <input type="number" min={0} step="0.01" className="form-control form-control-lg" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <div className="p-3 rounded-xl bg-surface d-flex align-items-baseline gap-2">
                      <span className="small text-muted-2 me-2">Students will see:</span>
                      <span className="fs-4 fw-bold">{formatPrice(effectivePrice({ price: Number(form.price), discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice) }))}</span>
                      {form.discountPrice !== '' && Number(form.discountPrice) < Number(form.price) && <span className="price-old">{formatPrice(form.price)}</span>}
                    </div>
                  </div>
                  <div className="col-12"><button className="btn btn-primary" disabled={saving}>Save pricing</button></div>
                  <div className="col-12 small text-muted-2"><i className="bi bi-lightbulb me-1" />Run promotions with coupon codes from the <Link href="/instructor">Coupons tab</Link> of your dashboard.</div>
                </div>
              </form>
            )}

            {tab === 'publish' && (
              <div className="panel">
                <div className="panel-header"><span className="fw-bold">Publish your course</span><span className={`badge bg-${STATUS_BADGE[course.status]}`}>{course.status}</span></div>
                <div className="panel-body">
                  <p className="text-muted-2">Complete the checklist below, then submit your course. Our team reviews every course before it goes live (usually within 24 hours).</p>
                  <ul className="list-unstyled checklist mb-4">
                    {checklist.map(([label, ok], i) => (
                      <li key={label} className="d-flex align-items-center gap-2">
                        <i className={`bi ${ok ? 'bi-check-circle-fill text-success' : i === 6 ? 'bi-dash-circle text-muted' : 'bi-x-circle-fill text-danger'} fs-5`} />
                        <span className={ok ? '' : 'text-muted-2'}>{label}</span>
                      </li>
                    ))}
                  </ul>
                  {course.status === 'PENDING' && <div className="alert alert-warning"><i className="bi bi-hourglass-split me-1" />Your course is under review. We&apos;ll notify you once it&apos;s approved.</div>}
                  {course.status === 'PUBLISHED' && <div className="alert alert-success"><i className="bi bi-check-circle me-1" />Your course is live!</div>}
                  {course.status === 'REJECTED' && <div className="alert alert-warning"><b>Changes requested:</b> {course.rejectReason} Update the course, then submit it again.</div>}
                  {course.status === 'SUSPENDED' && <div className="alert alert-danger"><b>Taken down by Qualify:</b> {course.rejectReason} Students who bought it keep access. Contact <a href="mailto:support@qualify.dev">support@qualify.dev</a> to appeal.</div>}
                  <div className="d-flex gap-2 flex-wrap">
                    {(course.status === 'DRAFT' || course.status === 'REJECTED') && (
                      <button className="btn btn-gradient btn-lg" disabled={!ready} onClick={() => publish('submit')}>
                        <i className="bi bi-rocket-takeoff me-1" />Submit for review
                      </button>
                    )}
                    {(course.status === 'PUBLISHED' || course.status === 'PENDING') && (
                      <button className="btn btn-outline-secondary" onClick={() => publish('unpublish')}>Move back to draft</button>
                    )}
                    <button className="btn btn-outline-danger ms-auto" onClick={remove}><i className="bi bi-trash me-1" />Delete course</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
