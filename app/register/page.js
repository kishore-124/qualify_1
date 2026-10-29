'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import AuthSide from '@/components/AuthSide';

function RegisterForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: params.get('role') === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT' });
  const [busy, setBusy] = useState(false);
  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(form.password)).length);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = await api('/api/auth/register', { method: 'POST', body: form });
      toast.success('Account created! Welcome aboard 🎉');
      const next = params.get('next');
      window.location.href = next?.startsWith('/') ? next : user.role === 'INSTRUCTOR' ? '/instructor' : '/courses';
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="inner">
        <h1 className="fw-bold h2 mb-1">Create your account</h1>
        <p className="text-muted-2 mb-4">Start learning for free. No credit card required.</p>
        <form onSubmit={submit} className="d-grid gap-3">
          <div className="row g-2">
            {[
              ['STUDENT', 'bi-mortarboard', 'I want to learn'],
              ['INSTRUCTOR', 'bi-easel', 'I want to teach'],
            ].map(([role, icon, label]) => (
              <div className="col-6" key={role}>
                <label className={`role-option text-center ${form.role === role ? 'active' : ''}`}>
                  <input type="radio" className="d-none" checked={form.role === role} onChange={() => setForm({ ...form, role })} />
                  <i className={`bi ${icon} fs-4 d-block text-primary`} />
                  <span className="fw-semibold small">{label}</span>
                </label>
              </div>
            ))}
          </div>
          <div>
            <label className="form-label">Full name</label>
            <input className="form-control form-control-lg" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" autoComplete="name" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-control form-control-lg" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input type="password" className="form-control form-control-lg" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" autoComplete="new-password" />
            {form.password && (
              <div className="d-flex gap-1 mt-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex-fill rounded" style={{ height: 4, background: i < strength ? ['#ef4444', '#f59e0b', '#22c55e', '#12a150'][strength - 1] : '#e5e7eb' }} />
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm" /> : 'Create account'}
          </button>
          <p className="fs-7 text-muted-2 text-center mb-0">By signing up you agree to our Terms of Use and Privacy Policy.</p>
        </form>
        <p className="text-center mt-4 mb-0">
          Already have an account? <Link href="/login" className="fw-bold">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="auth-wrap">
      <AuthSide title="Learn without limits." text="Join thousands of learners building real-world skills with expert instructors." />
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
