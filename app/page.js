import Link from 'next/link';
import prisma from '@/lib/prisma';
import CourseCard from '@/components/CourseCard';
import HeroSearch from '@/components/HeroSearch';
import { courseCardSelect, withStats } from '@/lib/queries';
import { PLATFORM_FEE_PERCENT } from '@/lib/stripe';
import { compactNumber, formatMoney } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, popularRaw, newestRaw, counts, certCount, latestCert] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { courses: { where: { status: 'PUBLISHED', instructor: { status: 'ACTIVE' } } } } } },
    }),
    prisma.course.findMany({ where: { status: 'PUBLISHED', instructor: { status: 'ACTIVE' } }, orderBy: [{ featured: 'desc' }, { studentCount: 'desc' }], take: 8, select: courseCardSelect }),
    prisma.course.findMany({ where: { status: 'PUBLISHED', instructor: { status: 'ACTIVE' } }, orderBy: { createdAt: 'desc' }, take: 4, select: courseCardSelect }),
    Promise.all([
      prisma.enrollment.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
    ]),
    prisma.certificate.count(),
    prisma.certificate.findFirst({ orderBy: { issuedAt: 'desc' }, include: { user: { select: { name: true } }, course: { select: { title: true } } } }),
  ]);
  const [popular, newest] = await Promise.all([withStats(popularRaw), withStats(newestRaw)]);
  const [enrollments, courseCount, instructorCount] = counts;
  const instructorShare = 100 - PLATFORM_FEE_PERCENT;
  const cert = latestCert || { serial: 'QF-8C21E4', user: { name: 'Priya Sharma' }, course: { title: 'The Complete Full-Stack Web Development Bootcamp' } };

  return (
    <>
      {/* Hero: the certificate is the thing people come here for */}
      <section className="hero ruled">
        <div className="container-xl">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <h1>Learn it. Prove&nbsp;it. Get qualified.</h1>
              <p className="lede">
                Video courses taught by people who do the work every day. Finish every lecture and you get a certificate anyone can verify.
              </p>
              <HeroSearch />
              <div className="topic-links">
                <span>Popular:</span>
                {['React', 'Python', 'Figma', 'SQL', 'Docker'].map((t) => (
                  <Link key={t} href={`/courses?q=${encodeURIComponent(t)}`}>{t}</Link>
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="cert-stage" aria-label="Example certificate">
                <div className="cert-sheet s1" />
                <div className="cert-sheet s2" />
                <div className="cert-main">
                  <div className="cert-seal" aria-hidden="true"><i className="bi bi-check-lg" /></div>
                  <div className="cert-kicker">Certificate of completion</div>
                  <div className="cert-name">{cert.user.name}</div>
                  <div className="cert-kicker">has completed</div>
                  <div className="cert-course">{cert.course.title}</div>
                  <div className="cert-meta">
                    <div><b>Verified</b>by Qualify</div>
                    <div><b className="tnum">{cert.serial}</b>credential ID</div>
                  </div>
                </div>
                <div className="cert-progress" aria-hidden="true">
                  <div className="d-flex justify-content-between"><span>Lecture 22 of 24</span><span className="tnum">92%</span></div>
                  <div className="bar"><span /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-xl">
        <div className="facts">
          <div><b>{courseCount}</b><span>courses to choose from</span></div>
          <div><b>{instructorCount}</b><span>instructors teaching</span></div>
          <div><b>{compactNumber(enrollments)}</b><span>enrollments so far</span></div>
          <div><b>{compactNumber(certCount)}</b><span>certificates earned</span></div>
        </div>
      </div>

      <section className="section">
        <div className="container-xl">
          <div className="block-head">
            <div>
              <h2 className="section-title mb-0">Popular with learners</h2>
              <p>The courses people are enrolling in this month.</p>
            </div>
            <Link href="/courses" className="btn btn-outline-primary">See all courses</Link>
          </div>
          <div className="row g-4">
            {popular.map((c) => (
              <div className="col-sm-6 col-lg-3" key={c.id}><CourseCard course={c} /></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-xl">
          <div className="row g-5">
            <div className="col-lg-4">
              <h2 className="section-title">Browse by subject</h2>
              <p className="text-muted-2">From your first line of code to running a business — pick a subject and see every course in it.</p>
            </div>
            <div className="col-lg-8">
              <nav className="subject-index" aria-label="Subjects">
                {categories.map((c) => (
                  <Link key={c.id} href={`/courses?category=${c.slug}`}>
                    <i className={`bi ${c.icon}`} style={{ color: c.color }} />
                    {c.name}
                    <span className="count">{c._count.courses}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-xl">
          <h2 className="section-title mb-4">How Qualify works</h2>
          <ol className="steps p-0 m-0">
            <li>
              <h3>Pick a course</h3>
              <p>Watch the free preview lectures first. Buy once and the course is yours for good, including updates.</p>
            </li>
            <li>
              <h3>Learn at your pace</h3>
              <p>Pick up where you left off on any device. Ask the instructor questions and keep notes pinned to the video.</p>
            </li>
            <li>
              <h3>Get your certificate</h3>
              <p>Complete every lecture and your certificate is issued with an ID employers can check online.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-xl">
          <div className="block-head">
            <div>
              <h2 className="section-title mb-0">Just published</h2>
              <p>New courses from our instructors.</p>
            </div>
            <Link href="/courses?sort=newest" className="btn btn-outline-primary">See new courses</Link>
          </div>
          <div className="row g-4">
            {newest.map((c) => (
              <div className="col-sm-6 col-lg-3" key={c.id}><CourseCard course={c} /></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-xl">
          <figure className="quote-block">
            <blockquote>
              &ldquo;I put the certificate ID on my CV. The recruiter checked it during the call, and two weeks later I started as a frontend developer.&rdquo;
            </blockquote>
            <figcaption className="d-flex align-items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=70&auto=format&fit=crop" alt="" className="avatar" style={{ width: 48, height: 48 }} />
              <div><div className="fw-bold">Priya Sharma</div><div className="fs-7 text-muted-2">Frontend developer, Bengaluru</div></div>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="pb-5">
        <div className="container-xl">
          <div className="teach-band">
            <div className="row g-4 align-items-center">
              <div className="col-lg-6">
                <h2>Teach what you know. Keep {instructorShare}% of every sale.</h2>
                <p className="mb-4">Build your course in the studio, set your price, and get paid straight to your bank through Stripe.</p>
                <Link href="/teach" className="btn btn-accent btn-lg">Start teaching</Link>
              </div>
              <div className="col-lg-6">
                <div className="split-bar" role="img" aria-label={`Instructor ${instructorShare}%, Qualify ${PLATFORM_FEE_PERCENT}%`}>
                  <div className="you" style={{ width: `${instructorShare}%` }}>You {instructorShare}%</div>
                  <div className="fee" style={{ width: `${PLATFORM_FEE_PERCENT}%` }}>Qualify {PLATFORM_FEE_PERCENT}%</div>
                </div>
                <p className="small mt-2 mb-0">On a {formatMoney(1000)} sale you earn {formatMoney((1000 * instructorShare) / 100)}, paid out automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
