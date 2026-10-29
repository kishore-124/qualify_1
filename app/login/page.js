'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import AuthSide from '@/components/AuthSide';

const DEMO = [
  ['Student', 'student@qualify.dev'],
  ['Instructor', 'instructor@qualify.dev'],
  ['Admin', 'admin@qualify.dev'],
];

function LoginForm() {
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = await api('/api/auth/login', { method: 'POST', body: form });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      window.location.href = next.startsWith('/') ? next : '/dashboard';
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="inner">
        <h1 className="fw-bold h2 mb-1">Welcome back 👋</h1>
        <p className="text-muted-2 mb-4">Log in to continue your learning journey.</p>
        <form onSubmit={submit} className="d-grid gap-3">
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-control form-control-lg" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <div className="input-group">
              <input type={show ? 'text' : 'password'} className="form-control form-control-lg" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(!show)} aria-label="Toggle password"><i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} /></button>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm" /> : 'Log in'}
          </button>
        </form>

        <div className="mt-4 p-3 rounded-xl bg-surface">
          <div className="fs-7 fw-bold text-muted-2 mb-2">DEMO ACCOUNTS (password: password123)</div>
          <div className="d-flex flex-wrap gap-2">
            {DEMO.map(([label, email]) => (
              <button key={email} type="button" className="chip" onClick={() => setForm({ email, password: 'password123' })}>{label}</button>
            ))}
          </div>
        </div>

        <p className="text-center mt-4 mb-0">
          New to Qualify? <Link href={`/register${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`} className="fw-bold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <AuthSide title="Pick up right where you left off." text="Your courses, notes, and progress are waiting for you." />
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
