import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="q-footer mt-auto">
      <div className="container-xl">
        <div className="row g-4 pb-4">
          <div className="col-lg-4">
            <Logo tone="light" size={34} />
            <p className="small mt-3 pe-lg-5">
              Video courses from working professionals, with a verifiable certificate when you finish.
            </p>
            <div className="d-flex gap-3 fs-5">
              <a href="#" aria-label="X"><i className="bi bi-twitter-x" /></a>
              <a href="#" aria-label="LinkedIn"><i className="bi bi-linkedin" /></a>
              <a href="#" aria-label="YouTube"><i className="bi bi-youtube" /></a>
              <a href="#" aria-label="Instagram"><i className="bi bi-instagram" /></a>
            </div>
          </div>
          <nav className="col-6 col-lg-2" aria-label="Learn">
            <h2 className="q-footer-h">Learn</h2>
            <ul className="list-unstyled small d-grid gap-2">
              <li><Link href="/courses">All courses</Link></li>
              <li><Link href="/courses?price=free">Free courses</Link></li>
              <li><Link href="/courses?sort=newest">New courses</Link></li>
              <li><Link href="/courses?sort=rating">Top rated</Link></li>
            </ul>
          </nav>
          <nav className="col-6 col-lg-2" aria-label="Teach">
            <h2 className="q-footer-h">Teach</h2>
            <ul className="list-unstyled small d-grid gap-2">
              <li><Link href="/teach">Teach on Qualify</Link></li>
              <li><Link href="/instructor">Instructor dashboard</Link></li>
              <li><Link href="/instructor/earnings">Earnings & payouts</Link></li>
            </ul>
          </nav>
          <nav className="col-6 col-lg-2" aria-label="Account">
            <h2 className="q-footer-h">Account</h2>
            <ul className="list-unstyled small d-grid gap-2">
              <li><Link href="/dashboard">My learning</Link></li>
              <li><Link href="/wishlist">Wishlist</Link></li>
              <li><Link href="/cart">Cart</Link></li>
              <li><Link href="/profile">Settings</Link></li>
            </ul>
          </nav>
          <nav className="col-6 col-lg-2" aria-label="Company">
            <h2 className="q-footer-h">Company</h2>
            <ul className="list-unstyled small d-grid gap-2">
              <li><a href="#">About</a></li>
              <li><a href="#">Help center</a></li>
              <li><Link href="/docs">API docs</Link></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </nav>
        </div>
        <div className="q-footer-base">
          <span>© {new Date().getFullYear()} Qualify</span>
          <span>Payments secured by Stripe</span>
        </div>
      </div>
    </footer>
  );
}
