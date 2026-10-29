import Link from 'next/link';
import { PLATFORM_FEE_PERCENT } from '@/lib/stripe';
import { formatMoney } from '@/lib/utils';

export const metadata = { title: 'Teach on Qualify' };

export default function TeachPage() {
  const share = 100 - PLATFORM_FEE_PERCENT;
  return (
    <>
      <section className="hero ruled">
        <div className="container-xl">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h1>Teach what you know. Get paid for every student.</h1>
              <p className="lede">Build a video course in the Qualify studio, set your own price, and keep {share}% of each sale — paid out to your bank through Stripe.</p>
              <div className="d-flex gap-2 flex-wrap">
                <Link href="/register?role=INSTRUCTOR" className="btn btn-primary btn-lg">Create an instructor account</Link>
                <Link href="/profile" className="btn btn-ghost btn-lg">I already have an account</Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="summary">
                <h2 className="h5 fw-bold mb-3">Example: one sale of {formatMoney(49.99)}</h2>
                <dl className="summary-lines">
                  <div><dt>Student pays</dt><dd>{formatMoney(49.99)}</dd></div>
                  <div><dt>Qualify fee ({PLATFORM_FEE_PERCENT}%)</dt><dd>−{formatMoney((49.99 * PLATFORM_FEE_PERCENT) / 100)}</dd></div>
                </dl>
                <div className="summary-total"><span>You earn</span><span>{formatMoney((49.99 * share) / 100)}</span></div>
                <p className="small text-muted-2 mt-3 mb-0">The fee covers card processing, video hosting, certificates and marketing. There’s no monthly charge.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-xl">
          <h2 className="section-title mb-4">From idea to first payout</h2>
          <ol className="steps p-0 m-0">
            <li>
              <h3>Build your curriculum</h3>
              <p>Add sections and lectures, paste YouTube, Vimeo or MP4 links, and mark a few lectures as free previews.</p>
            </li>
            <li>
              <h3>Publish and promote</h3>
              <p>Set a price and a sale price, create coupon codes, and submit for review. Approved courses go live the same day.</p>
            </li>
            <li>
              <h3>Get paid automatically</h3>
              <p>Connect Stripe once. Your share of each sale is transferred to your account, and Stripe pays your bank.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="pb-5">
        <div className="container-xl">
          <div className="teach-band">
            <div className="row g-4 align-items-center">
              <div className="col-lg-8">
                <h2>Your studio is ready when you are.</h2>
                <p className="mb-0">Answer student questions, read reviews and follow your earnings from one dashboard.</p>
              </div>
              <div className="col-lg-4 text-lg-end">
                <Link href="/register?role=INSTRUCTOR" className="btn btn-accent btn-lg">Start teaching</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
