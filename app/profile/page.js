'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import { useAuth } from '@/components/Providers';
import Avatar from '@/components/Avatar';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !form) setForm({ name: user.name || '', headline: user.headline || '', bio: user.bio || '', avatar: user.avatar || '', website: user.website || '' });
  }, [user, form]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/profile', { method: 'PUT', body: form });
      await refresh();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match');
    try {
      await api('/api/profile', { method: 'PUT', body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const becomeInstructor = async () => {
    try {
      await api('/api/profile/become-instructor', { method: 'POST' });
      toast.success('Welcome to the instructor community! 🎓');
      window.location.href = '/instructor';
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!user || !form) return <div className="container py-5"><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <>
      <section className="dash-header">
        <div className="container-xl d-flex align-items-center gap-3">
          <Avatar user={{ ...user, avatar: form.avatar }} size="lg" />
          <div>
            <h1 className="fw-bold h2 mb-0">{user.name}</h1>
            <div className="text-white-50">{user.email} • <span className="badge bg-light text-dark">{user.role}</span></div>
          </div>
        </div>
      </section>
      <div className="container-xl dash-body pb-5">
        <div className="row g-4">
          <div className="col-lg-8">
            <form className="panel" onSubmit={save}>
              <div className="panel-header"><span className="fw-bold">Public profile</span></div>
              <div className="panel-body row g-3">
                <div className="col-md-6"><label className="form-label">Full name</label><input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="col-md-6"><label className="form-label">Headline</label><input className="form-control" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Senior Software Engineer" /></div>
                <div className="col-12"><label className="form-label">Bio</label><textarea className="form-control" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell learners about yourself" /></div>
                <div className="col-md-6"><label className="form-label">Avatar image URL</label><input className="form-control" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="https://…" /></div>
                <div className="col-md-6"><label className="form-label">Website</label><input className="form-control" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" /></div>
                <div className="col-12"><button className="btn btn-primary" disabled={busy}>Save changes</button></div>
              </div>
            </form>
          </div>
          <div className="col-lg-4 d-grid gap-4 align-content-start">
            {user.role === 'STUDENT' && (
              <div className="cta-band p-4">
                <h5 className="fw-bold position-relative">Share your knowledge</h5>
                <p className="small opacity-75 position-relative">Become an instructor and start creating courses today.</p>
                <button className="btn btn-light fw-bold position-relative" onClick={becomeInstructor}>Become an instructor</button>
              </div>
            )}
            <form className="panel" onSubmit={changePassword}>
              <div className="panel-header"><span className="fw-bold">Change password</span></div>
              <div className="panel-body d-grid gap-3">
                <input type="password" className="form-control" placeholder="Current password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
                <input type="password" className="form-control" placeholder="New password" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
                <input type="password" className="form-control" placeholder="Confirm new password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
                <button className="btn btn-outline-primary">Update password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
