/* eslint-disable no-console */
// Seeds Qualify with a realistic marketplace: 10 instructors, ~150 students, 34 courses,
// a year of orders (with coupons and refunds), reviews, Q&A, certificates — plus
// moderation cases for the admin panel (reports, a paused instructor, a banned account…).
// Run with:  npm run db:seed

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/i);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const D = require('./seed-data');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Deterministic randomness so every seed produces the same data
let seed = 20261029;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const DAY = 86400000;
const daysAgo = (d) => new Date(Date.now() - d * DAY);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
const ref = () => `QF-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
const FEE = Number(process.env.PLATFORM_FEE_PERCENT ?? 30);
const r2 = (n) => Math.round(n * 100) / 100;
const effective = (c) => (c.discountPrice != null && c.discountPrice < c.price ? c.discountPrice : c.price);

async function main() {
  console.log('🌱 Seeding Qualify…');

  await prisma.$transaction([
    prisma.adminAction.deleteMany(), prisma.report.deleteMany(),
    prisma.notification.deleteMany(), prisma.answer.deleteMany(), prisma.question.deleteMany(), prisma.note.deleteMany(),
    prisma.certificate.deleteMany(), prisma.lectureProgress.deleteMany(), prisma.orderItem.deleteMany(), prisma.order.deleteMany(),
    prisma.coupon.deleteMany(), prisma.cartItem.deleteMany(), prisma.wishlistItem.deleteMany(), prisma.review.deleteMany(),
    prisma.enrollment.deleteMany(), prisma.lecture.deleteMany(), prisma.section.deleteMany(), prisma.course.deleteMany(),
    prisma.category.deleteMany(), prisma.user.deleteMany(),
  ]);

  const password = await bcrypt.hash('password123', 10);

  // ── People ──
  const admin = await prisma.user.create({ data: { name: 'Ada Admin', email: 'admin@qualify.dev', password, role: 'ADMIN', headline: 'Trust & Safety lead', createdAt: daysAgo(420) } });
  const mod = await prisma.user.create({ data: { name: 'Vikram Sethi', email: 'moderator@qualify.dev', password, role: 'ADMIN', headline: 'Content moderator', createdAt: daysAgo(300) } });

  const ins = {};
  for (const [key, i] of Object.entries(D.INSTRUCTORS)) {
    ins[key] = await prisma.user.create({
      data: {
        name: i.name, email: i.email, password, role: 'INSTRUCTOR', headline: i.headline, avatar: i.avatar, bio: i.bio,
        website: key === 'rocky' ? 'https://t.me/fastprofits_vip' : 'https://example.com',
        status: i.status || 'ACTIVE', statusReason: i.statusReason || null,
        statusChangedAt: i.status ? daysAgo(9) : null, payoutsHeld: !!i.status,
        createdAt: daysAgo(key === 'rocky' ? 75 : between(250, 410)),
      },
    });
  }

  const demo = await prisma.user.create({ data: { name: 'Sam Student', email: 'student@qualify.dev', password, headline: 'Aspiring full-stack developer', createdAt: daysAgo(120) } });
  const students = [];
  const allNames = [...new Set([...D.STUDENTS, ...D.EXTRA_STUDENTS])];
  for (const [i, name] of allNames.entries()) {
    students.push(
      await prisma.user.create({
        data: {
          name,
          email: `${slugify(name).replace(/-/g, '.')}${i >= D.STUDENTS.length ? i : ''}@example.com`,
          password,
          avatar: i < D.STUDENT_FACES.length ? D.face(D.STUDENT_FACES[i]) : null,
          createdAt: daysAgo(between(20, 380)),
        },
      })
    );
  }
  const spammer = await prisma.user.create({
    data: { name: 'Fast Profits VIP', email: 'fastprofits.vip@example.com', password, status: 'BANNED', statusReason: 'Posting promotional links to a paid Telegram group in reviews and Q&A.', statusChangedAt: daysAgo(3), createdAt: daysAgo(40) },
  });

  const cats = {};
  for (const [name, icon, color] of D.CATEGORIES) cats[name] = await prisma.category.create({ data: { name, slug: slugify(name), icon, color } });

  // ── Courses ──
  const courses = [];
  let mp4 = 0;
  for (const [ci, c] of D.COURSES.entries()) {
    const status = c.status || 'PUBLISHED';
    const createdAt = c.by === 'rocky' ? daysAgo(60) : status === 'PENDING' ? daysAgo(between(2, 6)) : daysAgo(380 - ci * 10);
    const description =
      `${c.sub}\n\nThis course is built around practice. Every section ends with an exercise or project, and every lecture comes with notes you can keep.\n\n` +
      `By the end you will be able to:\n${c.out.map((o) => `• ${o}`).join('\n')}\n\n` +
      `Who this course is for:\n• Learners who want a structured path instead of random tutorials\n• Working professionals adding ${c.tags[0]} to their toolkit`;

    const course = await prisma.course.create({
      data: {
        title: c.title, slug: slugify(c.title), subtitle: c.sub,
        description: c.by === 'rocky' || c.status === 'REJECTED' ? c.sub : description,
        thumbnail: c.thumb, previewVideo: c.status === 'REJECTED' ? null : D.MP4[ci % D.MP4.length],
        price: c.price, discountPrice: c.sale ?? null, level: c.level, language: 'English',
        status, featured: !!c.featured && status === 'PUBLISHED', rejectReason: c.rejectReason || null,
        tags: c.tags, outcomes: c.out, requirements: c.req,
        instructorId: ins[c.by].id, categoryId: cats[c.cat].id, createdAt, updatedAt: createdAt,
      },
    });
    for (const [si, [stitle, lectures]] of c.s.entries()) {
      await prisma.section.create({
        data: {
          title: stitle, position: si, courseId: course.id,
          lectures: {
            create: lectures.map((lt, li) => ({
              title: lt,
              position: li,
              videoUrl: c.status === 'REJECTED' && li > 0 ? null : si === 0 && li === 0 && c.v ? c.v : D.MP4[mp4++ % D.MP4.length],
              duration: c.by === 'rocky' ? between(120, 300) : between(260, 1320),
              isPreview: si === 0 && li < 2,
              description: `In “${lt}” we work through the idea step by step with a worked example you can follow along with.`,
              resourceUrl: li === 0 && si > 0 ? 'https://github.com/' : null,
            })),
          },
        },
      });
    }
    courses.push({ ...course, meta: c, quality: c.by === 'rocky' ? 1.6 : c.by === 'daniel' ? 3.2 : 4.1 + rnd() * 0.7 });
  }
  const bySlug = (t) => courses.find((c) => c.title.startsWith(t));
  const sellable = courses.filter((c) => ['PUBLISHED', 'SUSPENDED'].includes(c.status));

  // ── Coupons ──
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME20', discountPercent: 20 },
      { code: 'LEARN50', discountPercent: 50, maxUses: 200 },
      { code: 'NEXTJS30', discountPercent: 30, courseId: bySlug('Next.js 15').id },
      { code: 'DIWALI40', discountPercent: 40, expiresAt: daysAgo(10), active: true },
      { code: 'AWSPASS', discountPercent: 25, courseId: bySlug('AWS Certified').id, maxUses: 50 },
    ],
  });

  // ── A year of sales ──
  const saleItem = (c, price, when, refunded) => {
    const old = Date.now() - when.getTime() > 45 * DAY;
    const held = c.instructorId === ins.daniel.id;
    return {
      courseId: c.id, price, instructorId: c.instructorId,
      platformFee: r2((price * FEE) / 100), instructorEarning: r2(price - (price * FEE) / 100),
      earningStatus: refunded ? 'REVERSED' : old && !held ? 'PAID' : 'PENDING',
      stripeTransferId: !refunded && old && !held ? 'manual' : null,
      paidOutAt: !refunded && old && !held ? new Date(when.getTime() + 7 * DAY) : null,
    };
  };

  const weight = (c) => (c.featured ? 5 : 2) + (c.meta.by === 'rocky' ? 1 : 0) + (c.price === 0 ? 2 : 0);
  const pool = sellable.flatMap((c) => Array(weight(c)).fill(c));
  const enrolledPairs = new Set();
  let orders = 0, refunds = 0;
  const enrollRows = [];

  for (const s of students) {
    const n = between(2, 7);
    for (let k = 0; k < n; k++) {
      const c = pick(pool);
      const key = `${s.id}:${c.id}`;
      if (enrolledPairs.has(key)) continue;
      // Sales grow over the year: recent months are busier
      const age = Math.floor(Math.pow(rnd(), 1.6) * 360);
      const minAge = Math.max(0, Math.floor((Date.now() - c.createdAt.getTime()) / DAY) - 1);
      const when = daysAgo(Math.min(age, minAge));
      const price0 = effective(c);
      const coupon = price0 > 0 && rnd() < 0.15 ? 'WELCOME20' : null;
      const price = coupon ? r2(price0 * 0.8) : price0;
      const refundChance = c.meta.by === 'rocky' ? 0.35 : c.meta.by === 'daniel' ? 0.15 : 0.03;
      const refunded = price > 0 && rnd() < refundChance;

      if (price0 > 0) {
        orders++;
        await prisma.order.create({
          data: {
            userId: s.id, subtotal: price0, discount: r2(price0 - price), currency: 'usd', total: price, couponCode: coupon,
            status: refunded ? 'REFUNDED' : 'PAID', paymentRef: ref(), createdAt: when, paidAt: when,
            refundedAt: refunded ? new Date(when.getTime() + between(1, 6) * DAY) : null,
            items: { create: [saleItem(c, price, when, refunded)] },
          },
        });
      }
      if (refunded) {
        refunds++;
        continue;
      }
      enrolledPairs.add(key);
      const progress = Math.min(100, Math.floor(Math.pow(rnd(), 0.8) * 115));
      enrollRows.push({ userId: s.id, courseId: c.id, createdAt: when, progress, completedAt: progress === 100 ? new Date(when.getTime() + between(10, 60) * DAY) : null, course: c });
    }
  }
  for (const e of enrollRows) if (e.completedAt && e.completedAt > new Date()) e.completedAt = daysAgo(1);
  await prisma.enrollment.createMany({ data: enrollRows.map(({ course, ...e }) => e) });
  await prisma.certificate.createMany({
    data: enrollRows.filter((e) => e.progress === 100).map((e) => ({ userId: e.userId, courseId: e.courseId, serial: ref(), issuedAt: e.completedAt })),
  });

  // ── Reviews ──
  const reviews = [];
  for (const e of enrollRows) {
    if (e.progress < 25 || rnd() > 0.62 || e.course.meta.by === 'rocky') continue;
    const r = Math.max(1, Math.min(5, Math.round(e.course.quality + (rnd() - 0.55) * 1.6)));
    reviews.push({ userId: e.userId, courseId: e.courseId, rating: r, comment: rnd() < 0.85 ? pick(D.REVIEW_TEXT[r]) : null, createdAt: new Date(e.createdAt.getTime() + between(5, 40) * DAY) });
  }
  // Rocky's course gets the reviews that triggered the reports
  const rocky = bySlug('Earn $10,000');
  const rockyStudents = enrollRows.filter((e) => e.courseId === rocky.id).map((e) => e.userId);
  D.ROCKY_REVIEWS.slice(0, 3).forEach(([rating, comment], i) => {
    if (rockyStudents[i]) reviews.push({ userId: rockyStudents[i], courseId: rocky.id, rating, comment, createdAt: daysAgo(between(3, 20)) });
  });
  for (const r of reviews) if (r.createdAt > new Date()) r.createdAt = daysAgo(1);
  await prisma.review.createMany({ data: reviews, skipDuplicates: true });

  // The spam review (by the now-banned account) and an abusive review that was hidden
  await prisma.enrollment.create({ data: { userId: spammer.id, courseId: rocky.id, createdAt: daysAgo(30) } });
  const spamReview = await prisma.review.create({ data: { userId: spammer.id, courseId: rocky.id, rating: 5, comment: D.ROCKY_REVIEWS[3][1], createdAt: daysAgo(6) } });
  const fullstack = bySlug('The Complete Full-Stack');
  const abusiveAuthor = students[22];
  await prisma.enrollment.upsert({ where: { userId_courseId: { userId: abusiveAuthor.id, courseId: fullstack.id } }, create: { userId: abusiveAuthor.id, courseId: fullstack.id, progress: 30, createdAt: daysAgo(50) }, update: {} });
  await prisma.review.deleteMany({ where: { userId: abusiveAuthor.id, courseId: fullstack.id } });
  const hiddenReview = await prisma.review.create({
    data: { userId: abusiveAuthor.id, courseId: fullstack.id, rating: 1, comment: 'Instructor is an idiot who can’t teach. Total waste of money, don’t buy this garbage.', hidden: true, createdAt: daysAgo(18) },
  });

  // ── Q&A ──
  let qCount = 0;
  for (const c of sellable) {
    const studentsHere = enrollRows.filter((e) => e.courseId === c.id);
    if (!studentsHere.length || c.meta.by === 'rocky') continue;
    const lectures = await prisma.lecture.findMany({ where: { section: { courseId: c.id } }, orderBy: [{ section: { position: 'asc' } }, { position: 'asc' }] });
    const qs = [...(D.QUESTIONS[c.meta.cat] || []), ...D.QUESTIONS.default].slice(0, between(1, 4));
    for (const [title, body, answer] of qs) {
      const asker = pick(studentsHere);
      const when = new Date(asker.createdAt.getTime() + between(1, 20) * DAY);
      const q = await prisma.question.create({
        data: { title, body, userId: asker.userId, lectureId: pick(lectures).id, courseId: c.id, createdAt: when > new Date() ? daysAgo(1) : when },
      });
      qCount++;
      if (rnd() < 0.8) {
        const at = new Date(q.createdAt.getTime() + between(2, 30) * 3600000);
        await prisma.answer.create({ data: { body: answer, isInstructor: true, userId: c.instructorId, questionId: q.id, createdAt: at > new Date() ? new Date() : at } });
      }
    }
  }
  const fsLecture = await prisma.lecture.findFirst({ where: { section: { courseId: fullstack.id } } });
  const spamQuestion = await prisma.question.create({
    data: { title: 'Earn $500 daily from home!!! No skills needed', body: 'Join now 👉 t.me/fastprofits_vip — limited seats', userId: spammer.id, lectureId: fsLecture.id, courseId: fullstack.id, createdAt: daysAgo(4) },
  });

  // ── Demo student: progress, notes, certificate, cart ──
  const demoCourses = [fullstack, bySlug('UI/UX Design'), bySlug('Productivity')];
  for (const [i, c] of demoCourses.entries()) {
    const when = daysAgo(60 - i * 15);
    if (effective(c) > 0) {
      await prisma.order.create({ data: { userId: demo.id, subtotal: effective(c), total: effective(c), status: 'PAID', paymentRef: ref(), createdAt: when, paidAt: when, items: { create: [saleItem(c, effective(c), when, false)] } } });
    }
    const lectures = await prisma.lecture.findMany({ where: { section: { courseId: c.id } }, orderBy: [{ section: { position: 'asc' } }, { position: 'asc' }] });
    const done = i === 2 ? lectures.length : i === 0 ? Math.ceil(lectures.length * 0.4) : 3;
    await prisma.lectureProgress.createMany({ data: lectures.slice(0, done).map((l) => ({ userId: demo.id, lectureId: l.id, completed: true, completedAt: daysAgo(between(1, 30)) })) });
    const progress = Math.round((done / lectures.length) * 100);
    await prisma.enrollment.create({ data: { userId: demo.id, courseId: c.id, createdAt: when, progress, lastLectureId: lectures[Math.min(done, lectures.length - 1)].id, completedAt: progress === 100 ? daysAgo(5) : null } });
    if (progress === 100) await prisma.certificate.create({ data: { userId: demo.id, courseId: c.id, serial: ref(), issuedAt: daysAgo(5) } });
    if (i === 0) {
      await prisma.note.createMany({
        data: [
          { userId: demo.id, lectureId: lectures[1].id, timestamp: 95, content: 'Use semantic tags (header, main, article) — helps SEO and screen readers.' },
          { userId: demo.id, lectureId: lectures[2].id, timestamp: 312, content: 'box-sizing: border-box on everything. Padding no longer breaks widths!' },
        ],
      });
    }
  }
  await prisma.cartItem.createMany({
    data: [
      { userId: demo.id, courseId: bySlug('Python for Data').id },
      { userId: demo.id, courseId: bySlug('Next.js 15').id },
      { userId: demo.id, courseId: bySlug('Docker').id, savedForLater: true },
    ],
  });
  await prisma.wishlistItem.createMany({ data: [{ userId: demo.id, courseId: bySlug('AWS Certified').id }, { userId: demo.id, courseId: bySlug('Machine Learning').id }] });

  // ── Reports (the moderation queue) ──
  const reporters = [...rockyStudents, ...students.slice(30, 34).map((s) => s.id)];
  await prisma.report.createMany({
    data: [
      { targetType: 'COURSE', targetId: rocky.id, reason: 'SCAM', reporterId: reporters[0], details: 'Guarantees profits and pushes a $180 Telegram subscription in lecture 3.', createdAt: daysAgo(8) },
      { targetType: 'COURSE', targetId: rocky.id, reason: 'MISLEADING', reporterId: reporters[1], details: 'Course is 3 short videos, nothing like the description.', createdAt: daysAgo(6) },
      { targetType: 'COURSE', targetId: rocky.id, reason: 'SCAM', reporterId: reporters[2], details: 'Asked me to transfer money on UPI for “premium signals”.', createdAt: daysAgo(2) },
      { targetType: 'COURSE', targetId: rocky.id, reason: 'MISLEADING', reporterId: students[40].id, createdAt: daysAgo(1) },
      { targetType: 'REVIEW', targetId: spamReview.id, reason: 'SPAM', reporterId: students[5].id, details: 'Fake review with a Telegram link.', createdAt: daysAgo(5) },
      { targetType: 'REVIEW', targetId: spamReview.id, reason: 'SCAM', reporterId: students[11].id, createdAt: daysAgo(4) },
      { targetType: 'QUESTION', targetId: spamQuestion.id, reason: 'SPAM', reporterId: students[2].id, details: 'Spam link in the Q&A of lecture 1.', createdAt: daysAgo(3) },
      { targetType: 'COURSE', targetId: bySlug('Statistics').id, reason: 'LOW_QUALITY', reporterId: students[17].id, details: 'Lecture 6 audio cuts out after 4 minutes.', createdAt: daysAgo(2) },
      // History: already handled
      { targetType: 'COURSE', targetId: bySlug('Become a Web Developer').id, reason: 'COPYRIGHT', reporterId: students[8].id, details: 'Lectures 4–11 are word-for-word copies of another paid course. Timestamps attached.', status: 'RESOLVED', resolution: 'Action taken: suspend-course', handledById: admin.id, resolvedAt: daysAgo(9), createdAt: daysAgo(12) },
      { targetType: 'REVIEW', targetId: hiddenReview.id, reason: 'INAPPROPRIATE', reporterId: students[3].id, status: 'RESOLVED', resolution: 'Action taken: hide-review', handledById: mod.id, resolvedAt: daysAgo(17), createdAt: daysAgo(18) },
      { targetType: 'COURSE', targetId: bySlug('SQL for Data').id, reason: 'MISLEADING', reporterId: students[14].id, details: 'Expected MongoDB too.', status: 'DISMISSED', resolution: 'Course clearly states it covers relational databases only.', handledById: mod.id, resolvedAt: daysAgo(25), createdAt: daysAgo(27) },
    ],
  });

  // ── Moderation history ──
  const log = [];
  for (const c of courses.filter((x) => ['PUBLISHED', 'SUSPENDED'].includes(x.status))) {
    log.push({ adminId: pick([admin.id, mod.id]), action: 'course.approve', targetType: 'COURSE', targetId: c.id, targetName: c.title, createdAt: new Date(c.createdAt.getTime() + DAY) });
  }
  const daniel = bySlug('Become a Web Developer');
  const canva = bySlug('Canva Masterclass');
  log.push(
    { adminId: admin.id, action: 'course.feature', targetType: 'COURSE', targetId: fullstack.id, targetName: fullstack.title, createdAt: daysAgo(200) },
    { adminId: mod.id, action: 'course.reject', targetType: 'COURSE', targetId: canva.id, targetName: canva.title, reason: canva.rejectReason, createdAt: daysAgo(4) },
    { adminId: admin.id, action: 'course.suspend', targetType: 'COURSE', targetId: daniel.id, targetName: daniel.title, reason: daniel.rejectReason, createdAt: daysAgo(9) },
    { adminId: admin.id, action: 'user.warn', targetType: 'USER', targetId: ins.daniel.id, targetName: `${ins.daniel.name} <${ins.daniel.email}>`, reason: 'Please only publish lectures you created yourself.', createdAt: daysAgo(40) },
    { adminId: admin.id, action: 'user.suspend', targetType: 'USER', targetId: ins.daniel.id, targetName: `${ins.daniel.name} <${ins.daniel.email}>`, reason: D.INSTRUCTORS.daniel.statusReason, createdAt: daysAgo(9) },
    { adminId: mod.id, action: 'review.hide', targetType: 'REVIEW', targetId: hiddenReview.id, targetName: `${abusiveAuthor.name} on ${fullstack.title}`, reason: 'Abusive language', createdAt: daysAgo(17) },
    { adminId: mod.id, action: 'report.dismissed', targetType: 'REPORT', targetId: 'seed', targetName: 'SQL for Data Analysts', reason: 'Course clearly states it covers relational databases only.', createdAt: daysAgo(25) },
    { adminId: admin.id, action: 'user.ban', targetType: 'USER', targetId: spammer.id, targetName: `${spammer.name} <${spammer.email}>`, reason: spammer.statusReason, createdAt: daysAgo(3) },
  );
  for (const l of log) if (l.createdAt > new Date()) l.createdAt = daysAgo(1);
  await prisma.adminAction.createMany({ data: log });

  // ── Denormalised counters ──
  for (const c of courses) {
    const [agg, count] = await Promise.all([
      prisma.review.aggregate({ where: { courseId: c.id, hidden: false }, _avg: { rating: true }, _count: { _all: true } }),
      prisma.enrollment.count({ where: { courseId: c.id } }),
    ]);
    await prisma.course.update({ where: { id: c.id }, data: { avgRating: Math.round((agg._avg.rating || 0) * 10) / 10, reviewCount: agg._count._all, studentCount: count } });
  }
  const used = await prisma.order.count({ where: { couponCode: 'WELCOME20' } });
  await prisma.coupon.update({ where: { code: 'WELCOME20' }, data: { usedCount: used } });

  // ── Notifications ──
  await prisma.notification.createMany({
    data: [
      { userId: demo.id, title: 'Welcome back 👋', message: 'You’re 40% through the Full-Stack Bootcamp. Keep going!', link: `/learn/${fullstack.slug}` },
      { userId: demo.id, title: 'Certificate earned 🏆', message: 'You completed “Productivity & Time Management for Busy Professionals”.', link: '/dashboard?tab=certificates' },
      { userId: ins.rahul.id, title: 'New question from a student', message: 'npm install fails with ERESOLVE error', link: `/learn/${fullstack.slug}?tab=qa` },
      { userId: ins.daniel.id, title: 'Your instructor account is paused', message: D.INSTRUCTORS.daniel.statusReason, link: '/profile' },
      { userId: ins.alex.id, title: 'Changes requested on your course', message: canva.rejectReason, link: `/instructor/courses/${canva.id}?tab=publish` },
      { userId: admin.id, title: '4 reports on one course', message: `“${rocky.title}” was reported for scam and misleading content.`, link: '/admin?tab=reports' },
      { userId: admin.id, title: '3 courses awaiting review', message: 'New submissions in the review queue.', link: '/admin?tab=review' },
    ],
  });

  const totalEnrollments = await prisma.enrollment.count();
  console.log(`✅ ${courses.length} courses, ${students.length + 1} students, ${Object.keys(ins).length} instructors, ${orders} orders (${refunds} refunded), ${totalEnrollments} enrollments, ${reviews.length + 2} reviews, ${qCount + 1} questions.`);
  console.log('\nDemo logins (password: password123)');
  console.log('  Admin:      admin@qualify.dev   (also moderator@qualify.dev)');
  console.log('  Instructor: instructor@qualify.dev');
  console.log('  Student:    student@qualify.dev');
  console.log('  Paused instructor: daniel@qualify.dev · Banned: fastprofits.vip@example.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
