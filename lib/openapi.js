/**
 * OpenAPI 3.1 description of the Qualify REST API.
 * Served at /api/openapi.json and rendered with Swagger UI at /docs.
 *
 * Auth: log in with POST /api/auth/login — the API sets an httpOnly `qf_token` cookie
 * that the browser (and Swagger UI's "Try it out") sends automatically.
 */
import { PLATFORM_FEE_PERCENT } from './stripe';

// ───────────────────────── helpers ─────────────────────────
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const arr = (items) => ({ type: 'array', items });
const obj = (properties, required) => ({ type: 'object', properties, ...(required ? { required } : {}) });
const json = (schema) => ({ 'application/json': { schema } });
const ok = (schema, description = 'Success') => ({ description, content: json(schema) });
const body = (schema, example) => ({ required: true, content: { 'application/json': { schema, ...(example ? { example } : {}) } } });
const path = (name, description) => ({ name, in: 'path', required: true, schema: { type: 'string' }, description });
const query = (name, schema, description) => ({ name, in: 'query', required: false, schema, description });
const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
const num = (description, extra = {}) => ({ type: 'number', description, ...extra });
const int = (description, extra = {}) => ({ type: 'integer', description, ...extra });
const bool = (description) => ({ type: 'boolean', description });
const date = { type: 'string', format: 'date-time' };
const enm = (values, description) => ({ type: 'string', enum: values, ...(description ? { description } : {}) });

const ERR = {
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  404: { $ref: '#/components/responses/NotFound' },
  409: { $ref: '#/components/responses/Conflict' },
  422: { $ref: '#/components/responses/Validation' },
  402: { description: 'This is a paid course — buy it through checkout', content: json(ref('Error')) },
  410: { description: 'Coupon expired, used up, or content no longer exists', content: json(ref('Error')) },
  500: { description: 'Server or payment configuration error (e.g. a publishable key in STRIPE_SECRET_KEY)', content: json(ref('Error')) },
  502: { description: 'Stripe returned an error or couldn’t be reached', content: json(ref('Error')) },
};

/**
 * Builds one operation.
 * access: 'public' | 'user' | 'instructor' | 'active-instructor' | 'admin'
 */
function op({ tag, summary, description, access = 'user', params, requestBody, response, status = 200, errors = [] }) {
  const accessNote = {
    public: '',
    user: '**Requires login.**',
    instructor: '**Requires an instructor or admin account.**',
    'active-instructor': '**Requires an instructor or admin account that isn’t paused.**',
    admin: '**Admin only.**',
  }[access];
  const responses = { [status]: response || ok(ref('Ok')) };
  const codes = new Set(errors);
  if (access !== 'public') codes.add(401);
  if (['instructor', 'active-instructor', 'admin'].includes(access)) codes.add(403);
  for (const c of [...codes].sort()) responses[c] = ERR[c];
  return {
    tags: [tag],
    summary,
    description: [description, accessNote].filter(Boolean).join('\n\n'),
    ...(access === 'public' ? { security: [] } : {}),
    ...(params ? { parameters: params } : {}),
    ...(requestBody ? { requestBody } : {}),
    responses,
  };
}

// ───────────────────────── schemas ─────────────────────────
const schemas = {
  Ok: obj({ ok: { type: 'boolean', example: true } }),
  Error: obj({ error: str('What went wrong, in plain words', { example: 'Please log in to continue' }) }, ['error']),

  Role: enm(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
  UserStatus: enm(['ACTIVE', 'SUSPENDED', 'BANNED'], 'SUSPENDED = paused instructor; BANNED = cannot log in'),
  CourseStatus: enm(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'SUSPENDED']),
  Level: enm(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']),
  OrderStatus: enm(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  EarningStatus: enm(['PENDING', 'PAID', 'REVERSED'], 'PENDING = not yet paid to the instructor; REVERSED = order refunded'),

  User: obj({
    id: str('User id', { example: 'clx9a2b3c0000qf01' }),
    name: str('Full name', { example: 'Sam Student' }),
    email: str('Email', { format: 'email', example: 'student@qualify.dev' }),
    role: ref('Role'),
    status: ref('UserStatus'),
    statusReason: { type: ['string', 'null'] },
    avatar: { type: ['string', 'null'], format: 'uri' },
    headline: { type: ['string', 'null'] },
    bio: { type: ['string', 'null'] },
    website: { type: ['string', 'null'] },
    createdAt: date,
  }),
  UserSummary: obj({ id: str(), name: str(), avatar: { type: ['string', 'null'] } }),
  Counts: obj({ cart: int('Courses in the active cart'), notifications: int('Unread notifications'), wishlist: int('Wishlisted courses') }),

  Category: obj({
    id: str(), name: str('', { example: 'Web Development' }), slug: str('', { example: 'web-development' }),
    icon: str('Bootstrap Icons class', { example: 'bi-code-slash' }), color: str('Hex colour', { example: '#2b3fe0' }),
    _count: obj({ courses: int('Published courses') }),
  }),

  CourseCard: obj({
    id: str(), title: str('', { example: 'Next.js 15 & React 19: Build Production Apps' }), slug: str(), subtitle: str(),
    thumbnail: str('Image URL'),
    price: num('List price in USD', { example: 79.99 }),
    discountPrice: { type: ['number', 'null'], description: 'Sale price in USD', example: 13.99 },
    level: ref('Level'), language: str('', { example: 'English' }),
    avgRating: num('', { example: 4.6 }), reviewCount: int(), studentCount: int(), featured: bool(), status: ref('CourseStatus'),
    lectures: int('Number of lectures'), duration: int('Total video length in seconds'),
    instructor: ref('UserSummary'), category: obj({ id: str(), name: str(), slug: str() }),
    createdAt: date, updatedAt: date,
  }),
  Lecture: obj({
    id: str(), title: str(), description: { type: ['string', 'null'] },
    videoUrl: { type: ['string', 'null'], description: 'YouTube, Vimeo or direct video URL. Hidden from non-buyers unless isPreview.' },
    resourceUrl: { type: ['string', 'null'] }, duration: int('Seconds'), position: int(), isPreview: bool('Free preview lecture'),
    completed: bool('Only in /api/learn — has the current user completed it'),
  }),
  Section: obj({ id: str(), title: str(), position: int(), lectures: arr(ref('Lecture')) }),
  Course: {
    allOf: [
      ref('CourseCard'),
      obj({
        description: str(), previewVideo: { type: ['string', 'null'] },
        requirements: arr(str()), outcomes: arr(str()), tags: arr(str()),
        rejectReason: { type: ['string', 'null'], description: 'Reason given when changes were requested or the course was taken down' },
        sections: arr(ref('Section')),
      }),
    ],
  },
  CourseInput: obj({
    title: str('', { minLength: 5, maxLength: 90 }), subtitle: str(), description: str(), thumbnail: str(), previewVideo: str(),
    price: num('USD', { minimum: 0, example: 79.99 }), discountPrice: { type: ['number', 'null'], example: 13.99 },
    level: ref('Level'), language: str(), categoryId: str(),
    requirements: { oneOf: [arr(str()), str('One per line')] },
    outcomes: { oneOf: [arr(str()), str('One per line')] },
    tags: { oneOf: [arr(str()), str('Comma separated')] },
  }),

  Review: obj({ id: str(), rating: int('', { minimum: 1, maximum: 5 }), comment: { type: ['string', 'null'] }, hidden: bool('Hidden by a moderator'), createdAt: date, user: ref('UserSummary') }),
  Answer: obj({ id: str(), body: str(), isInstructor: bool('Posted by the course instructor'), createdAt: date, user: ref('UserSummary') }),
  Question: obj({ id: str(), title: str(), body: { type: ['string', 'null'] }, createdAt: date, user: ref('UserSummary'), lecture: obj({ id: str(), title: str() }), answers: arr(ref('Answer')) }),
  Note: obj({ id: str(), content: str(), timestamp: int('Seconds into the video'), lectureId: str(), createdAt: date }),

  CartItem: obj({ id: str(), courseId: str(), savedForLater: bool(), course: ref('CourseCard') }),
  Cart: obj({
    items: arr(ref('CartItem')), saved: arr(ref('CartItem')),
    listTotal: num('Sum of list prices (USD)'), subtotal: num('After sale prices'), saleSavings: num(), total: num('What the student pays (before coupon)'), count: int(),
    recommendations: arr(ref('CourseCard')),
  }),
  PricedCart: obj({
    coupon: obj({ code: str(), discountPercent: int(), courseId: { type: ['string', 'null'] } }),
    items: arr(obj({ courseId: str(), base: num('Price before coupon'), price: num('Price after coupon') })),
    subtotal: num(), discount: num(), total: num(),
  }),

  OrderItem: obj({
    id: str(), courseId: str(), price: num('Final price paid (USD)'), instructorId: str(),
    platformFee: num(`Qualify commission (${PLATFORM_FEE_PERCENT}% by default)`), instructorEarning: num('Instructor share'),
    earningStatus: ref('EarningStatus'), stripeTransferId: { type: ['string', 'null'] }, paidOutAt: { type: ['string', 'null'], format: 'date-time' },
    course: obj({ id: str(), title: str(), slug: str(), thumbnail: str() }),
  }),
  Order: obj({
    id: str(), paymentRef: str('Receipt number', { example: 'QF-8C21E4A9B1' }), status: ref('OrderStatus'), currency: str('', { example: 'usd' }),
    subtotal: num(), discount: num(), total: num(), couponCode: { type: ['string', 'null'] },
    stripeSessionId: { type: ['string', 'null'] }, createdAt: date, paidAt: { type: ['string', 'null'], format: 'date-time' },
    items: arr(ref('OrderItem')),
  }),
  Coupon: obj({
    id: str(), code: str('', { example: 'WELCOME20' }), discountPercent: int('', { minimum: 1, maximum: 100 }),
    maxUses: { type: ['integer', 'null'] }, usedCount: int(), expiresAt: { type: ['string', 'null'], format: 'date-time' },
    active: bool(), courseId: { type: ['string', 'null'], description: 'Null = applies to every course (admin coupons)' },
    course: { type: ['object', 'null'], properties: { id: str(), title: str() } },
  }),
  Enrollment: obj({ id: str(), progress: int('Percent complete'), lastLectureId: { type: ['string', 'null'] }, completedAt: { type: ['string', 'null'], format: 'date-time' }, createdAt: date, course: ref('CourseCard') }),
  Certificate: obj({ id: str(), serial: str('', { example: 'QF-1A2B3C4D5E' }), issuedAt: date, course: obj({ id: str(), title: str(), slug: str() }) }),
  Notification: obj({ id: str(), title: str(), message: str(), link: { type: ['string', 'null'] }, read: bool(), createdAt: date }),

  Report: obj({
    id: str(), targetType: enm(['COURSE', 'REVIEW', 'QUESTION', 'ANSWER', 'USER']), targetId: str(),
    reason: enm(['SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'MISLEADING', 'SCAM', 'LOW_QUALITY', 'OTHER']), details: { type: ['string', 'null'] },
    status: enm(['OPEN', 'RESOLVED', 'DISMISSED']), resolution: { type: ['string', 'null'] }, createdAt: date,
  }),
  AdminAction: obj({ id: str(), action: str('', { example: 'course.suspend' }), targetType: str(), targetId: str(), targetName: str(), reason: { type: ['string', 'null'] }, createdAt: date, admin: obj({ name: str() }) }),
  MonthPoint: obj({ label: str('', { example: 'Oct' }), revenue: num(), sales: int(), orders: int() }),
  Paged: obj({ total: int(), page: int(), pages: int() }),
};

// ───────────────────────── paths ─────────────────────────
const id = path('id', 'Record id');
const courseId = path('id', 'Course id');
const lectureId = path('id', 'Lecture id');

const paths = {
  // Auth
  '/api/auth/register': {
    post: op({
      tag: 'Auth', access: 'public', status: 201, summary: 'Create an account',
      description: 'Creates a student (default) or instructor account and logs the user in (sets the `qf_token` cookie).',
      requestBody: body(obj({ name: str(), email: str('', { format: 'email' }), password: str('', { minLength: 6 }), role: enm(['STUDENT', 'INSTRUCTOR']) }, ['name', 'email', 'password']), { name: 'Jane Doe', email: 'jane@example.com', password: 'secret123' }),
      response: ok(obj({ user: ref('User') }), 'Account created and logged in'), errors: [409, 422],
    }),
  },
  '/api/auth/login': {
    post: op({
      tag: 'Auth', access: 'public', summary: 'Log in',
      description: 'Sets the httpOnly `qf_token` cookie used by every other endpoint. Banned accounts get 403. Try it with `student@qualify.dev`, `instructor@qualify.dev` or `admin@qualify.dev` (password `password123`).',
      requestBody: body(obj({ email: str(), password: str() }, ['email', 'password']), { email: 'admin@qualify.dev', password: 'password123' }),
      response: ok(obj({ user: ref('User') })), errors: [401, 403, 422],
    }),
  },
  '/api/auth/logout': { post: op({ tag: 'Auth', access: 'public', summary: 'Log out', description: 'Clears the auth cookie.' }) },
  '/api/auth/me': {
    get: op({ tag: 'Auth', access: 'public', summary: 'Current user', description: 'Returns `user: null` when logged out, plus badge counts.', response: ok(obj({ user: { oneOf: [ref('User'), { type: 'null' }] }, counts: ref('Counts') })) }),
  },
  '/api/profile': {
    get: op({ tag: 'Profile', summary: 'My profile', response: ok(obj({ user: ref('User') })) }),
    put: op({
      tag: 'Profile', summary: 'Update profile or password', description: 'Send `currentPassword` + `newPassword` to change the password.',
      requestBody: body(obj({ name: str(), headline: str(), bio: str(), avatar: str(), website: str(), currentPassword: str(), newPassword: str('', { minLength: 6 }) })),
      response: ok(obj({ user: ref('User') })), errors: [400, 422],
    }),
  },
  '/api/profile/become-instructor': { post: op({ tag: 'Profile', summary: 'Become an instructor', response: ok(obj({ user: ref('User') })) }) },

  // Catalog
  '/api/categories': {
    get: op({ tag: 'Catalog', access: 'public', summary: 'List categories', response: ok(obj({ categories: arr(ref('Category')) })) }),
    post: op({ tag: 'Admin', access: 'admin', status: 201, summary: 'Create category', requestBody: body(obj({ name: str(), icon: str(), color: str() }, ['name'])), response: ok(obj({ category: ref('Category') })), errors: [409, 422] }),
  },
  '/api/categories/{id}': {
    put: op({ tag: 'Admin', access: 'admin', summary: 'Update category', params: [id], requestBody: body(obj({ name: str(), icon: str(), color: str() })), response: ok(obj({ category: ref('Category') })), errors: [404] }),
    delete: op({ tag: 'Admin', access: 'admin', summary: 'Delete category', description: 'Its courses become uncategorised.', params: [id], errors: [404] }),
  },
  '/api/courses': {
    get: op({
      tag: 'Catalog', access: 'public', summary: 'Search courses',
      description: 'Published courses from active instructors only.',
      params: [
        query('q', { type: 'string' }, 'Search title, subtitle, tags and instructor'),
        query('category', { type: 'string' }, 'Category slug'),
        query('level', ref('Level')),
        query('price', enm(['free', 'paid'])),
        query('rating', { type: 'number', minimum: 0, maximum: 5 }, 'Minimum rating'),
        query('sort', enm(['popular', 'rating', 'newest', 'price-asc', 'price-desc'])),
        query('page', { type: 'integer', minimum: 1 }),
        query('limit', { type: 'integer', minimum: 1, maximum: 48 }),
      ],
      response: ok({ allOf: [ref('Paged'), obj({ courses: arr(ref('CourseCard')), limit: int() })] }),
    }),
    post: op({ tag: 'Instructor studio', access: 'active-instructor', status: 201, summary: 'Create a course (draft)', requestBody: body(obj({ title: str('', { minLength: 5 }), subtitle: str(), categoryId: str(), level: ref('Level') }, ['title']), { title: 'Intro to Rust for Web Developers' }), response: ok(obj({ course: ref('Course') })), errors: [422] }),
  },
  '/api/courses/{id}': {
    get: op({ tag: 'Catalog', access: 'public', summary: 'Get a course', description: 'Paid lecture videos are hidden unless you own the course or are an admin. Drafts are only visible to their owner and admins.', params: [courseId], response: ok(obj({ course: ref('Course'), isOwner: bool() })), errors: [404] }),
    put: op({ tag: 'Instructor studio', access: 'active-instructor', summary: 'Update a course', params: [courseId], requestBody: body(ref('CourseInput')), response: ok(obj({ course: ref('Course') })), errors: [404, 422] }),
    delete: op({ tag: 'Instructor studio', access: 'active-instructor', summary: 'Delete a course', description: 'Only allowed while no students are enrolled (admins can always delete).', params: [courseId], errors: [404, 409] }),
  },
  '/api/courses/{id}/publish': {
    post: op({
      tag: 'Instructor studio', access: 'active-instructor', summary: 'Submit for review / unpublish',
      description: '`submit` sends the course to the review queue (admins publish directly). Fails with 422 listing what’s missing. Courses taken down by an admin can’t be resubmitted (403).',
      params: [courseId], requestBody: body(obj({ action: enm(['submit', 'unpublish']) }), { action: 'submit' }),
      response: ok(obj({ course: ref('Course') })), errors: [404, 422],
    }),
  },
  '/api/courses/{id}/sections': {
    post: op({ tag: 'Instructor studio', access: 'active-instructor', status: 201, summary: 'Add a section', params: [courseId], requestBody: body(obj({ title: str() }, ['title'])), response: ok(obj({ section: ref('Section') })), errors: [404, 422] }),
  },
  '/api/sections/{id}': {
    put: op({ tag: 'Instructor studio', access: 'active-instructor', summary: 'Rename or reorder a section', params: [id], requestBody: body(obj({ title: str(), position: int() })), response: ok(obj({ section: ref('Section') })), errors: [404] }),
    delete: op({ tag: 'Instructor studio', access: 'active-instructor', summary: 'Delete a section and its lectures', params: [id], errors: [404] }),
  },
  '/api/sections/{id}/lectures': {
    post: op({
      tag: 'Instructor studio', access: 'active-instructor', status: 201, summary: 'Add a lecture', params: [id],
      requestBody: body(obj({ title: str(), videoUrl: str(), duration: int('Seconds'), description: str(), isPreview: bool(), resourceUrl: str() }, ['title']), { title: 'Setting up the project', videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk', duration: 540, isPreview: true }),
      response: ok(obj({ lecture: ref('Lecture') })), errors: [404, 422],
    }),
  },
  '/api/lectures/{id}': {
    put: op({ tag: 'Instructor studio', access: 'active-instructor', summary: 'Update or move a lecture', params: [lectureId], requestBody: body(obj({ title: str(), videoUrl: str(), duration: int(), description: str(), isPreview: bool(), resourceUrl: str(), position: int(), sectionId: str() })), response: ok(obj({ lecture: ref('Lecture') })), errors: [404] }),
    delete: op({ tag: 'Instructor studio', access: 'active-instructor', summary: 'Delete a lecture', params: [lectureId], errors: [404] }),
  },

  // Learning
  '/api/courses/{id}/enroll': { post: op({ tag: 'Learning', status: 201, summary: 'Enroll in a free course', params: [courseId], response: ok(obj({ enrollment: ref('Enrollment'), slug: str() })), errors: [402, 404] }) },
  '/api/learn/{slug}': {
    get: op({
      tag: 'Learning', summary: 'Course player data', description: 'Full curriculum with videos and per-lecture completion. Enrolled students, the owner and admins only.',
      params: [path('slug', 'Course slug')],
      response: ok(obj({ course: ref('Course'), isOwner: bool(), enrolled: bool(), progress: int(), lastLectureId: { type: ['string', 'null'] }, myReview: { oneOf: [ref('Review'), { type: 'null' }] }, certificateId: { type: ['string', 'null'] } })),
      errors: [403, 404],
    }),
  },
  '/api/lectures/{id}/progress': {
    post: op({ tag: 'Learning', summary: 'Mark a lecture complete / incomplete', description: 'Omit `completed` to toggle. Issues a certificate when the course reaches 100%.', params: [lectureId], requestBody: { required: false, content: json(obj({ completed: bool() })) }, response: ok(obj({ lectureId: str(), completed: bool(), progress: int(), completedLectures: int(), totalLectures: int(), certificateId: { type: ['string', 'null'] } })), errors: [403, 404] }),
    put: op({ tag: 'Learning', summary: 'Save last watched lecture', description: 'Powers “continue where you left off”.', params: [lectureId], errors: [403, 404] }),
  },
  '/api/lectures/{id}/notes': {
    get: op({ tag: 'Learning', summary: 'My notes for a lecture', params: [lectureId], response: ok(obj({ notes: arr(ref('Note')) })), errors: [403, 404] }),
    post: op({ tag: 'Learning', status: 201, summary: 'Add a timestamped note', params: [lectureId], requestBody: body(obj({ content: str(), timestamp: int('Seconds') }, ['content'])), response: ok(obj({ note: ref('Note') })), errors: [403, 422] }),
  },
  '/api/notes/{id}': {
    put: op({ tag: 'Learning', summary: 'Edit a note', params: [id], requestBody: body(obj({ content: str() }, ['content'])), response: ok(obj({ note: ref('Note') })), errors: [404, 422] }),
    delete: op({ tag: 'Learning', summary: 'Delete a note', params: [id], errors: [404] }),
  },
  '/api/lectures/{id}/questions': {
    get: op({ tag: 'Q&A', summary: 'List questions', params: [lectureId, query('scope', enm(['lecture', 'course']), 'This lecture only, or the whole course')], response: ok(obj({ questions: arr(ref('Question')) })), errors: [403, 404] }),
    post: op({ tag: 'Q&A', status: 201, summary: 'Ask a question', params: [lectureId], requestBody: body(obj({ title: str(), body: str() }, ['title'])), response: ok(obj({ question: ref('Question') })), errors: [403, 422] }),
  },
  '/api/questions/{id}/answers': { post: op({ tag: 'Q&A', status: 201, summary: 'Answer a question', params: [id], requestBody: body(obj({ body: str() }, ['body'])), response: ok(obj({ answer: ref('Answer') })), errors: [403, 404, 422] }) },
  '/api/courses/{id}/reviews': {
    get: op({ tag: 'Reviews', access: 'public', summary: 'List reviews', description: 'Hidden reviews are excluded.', params: [courseId, query('page', { type: 'integer' })], response: ok({ allOf: [ref('Paged'), obj({ reviews: arr(ref('Review')), distribution: arr(obj({ rating: int(), count: int() })) })] }) }),
    post: op({ tag: 'Reviews', status: 201, summary: 'Write or update my review', description: 'Enrolled students only. Returns 200 when updating.', params: [courseId], requestBody: body(obj({ rating: int('', { minimum: 1, maximum: 5 }), comment: str() }, ['rating']), { rating: 5, comment: 'Clear and practical.' }), response: ok(obj({ review: ref('Review') })), errors: [403, 422] }),
    delete: op({ tag: 'Reviews', summary: 'Delete my review', params: [courseId], errors: [404] }),
  },
  '/api/enrollments': { get: op({ tag: 'Learning', summary: 'My learning', response: ok(obj({ enrollments: arr(ref('Enrollment')), stats: obj({ total: int(), completed: int(), inProgress: int() }) })) }) },
  '/api/certificates': { get: op({ tag: 'Learning', summary: 'My certificates', response: ok(obj({ certificates: arr(ref('Certificate')) })) }) },
  '/api/certificates/{id}': { get: op({ tag: 'Learning', access: 'public', summary: 'Verify a certificate', description: 'Accepts the certificate id or its serial number.', params: [path('id', 'Certificate id or serial (QF-…)')], response: ok(obj({ certificate: ref('Certificate'), valid: bool() })), errors: [404] }) },
  '/api/wishlist': {
    get: op({ tag: 'Shopping', summary: 'My wishlist', response: ok(obj({ items: arr(obj({ courseId: str(), course: ref('CourseCard') })) })) }),
    post: op({ tag: 'Shopping', summary: 'Toggle a course in my wishlist', requestBody: body(obj({ courseId: str() }, ['courseId'])), response: ok(obj({ inWishlist: bool() })), errors: [422] }),
  },
  '/api/notifications': {
    get: op({ tag: 'Profile', summary: 'Latest notifications', response: ok(obj({ notifications: arr(ref('Notification')), unread: int() })) }),
    patch: op({ tag: 'Profile', summary: 'Mark notifications read', description: 'Omit `id` to mark all as read.', requestBody: { required: false, content: json(obj({ id: str() })) } }),
  },

  // Shopping
  '/api/cart': {
    get: op({ tag: 'Shopping', summary: 'My cart', response: ok(ref('Cart')) }),
    post: op({ tag: 'Shopping', status: 201, summary: 'Add to cart', description: 'Also moves a saved-for-later course back into the cart.', requestBody: body(obj({ courseId: str() }, ['courseId'])), response: ok(ref('Cart')), errors: [400, 404, 409] }),
    patch: op({ tag: 'Shopping', summary: 'Save for later / move back to cart', requestBody: body(obj({ courseId: str(), savedForLater: bool() }, ['courseId', 'savedForLater'])), response: ok(ref('Cart')), errors: [404] }),
    delete: op({ tag: 'Shopping', summary: 'Remove from cart', description: 'Omit `courseId` to empty the active cart.', params: [query('courseId', { type: 'string' })], response: ok(ref('Cart')) }),
  },
  '/api/cart/preview': { get: op({ tag: 'Shopping', access: 'public', summary: 'Price a guest cart', description: 'Guest carts live in the browser; this prices them without logging in.', params: [query('ids', { type: 'string' }, 'Comma-separated course ids')], response: ok(ref('Cart')) }) },
  '/api/cart/merge': { post: op({ tag: 'Shopping', summary: 'Merge a guest cart after login', requestBody: body(obj({ courseIds: arr(str()) }, ['courseIds'])), response: ok(obj({ added: int() })) }) },
  '/api/coupons/validate': { post: op({ tag: 'Shopping', summary: 'Apply a coupon to my cart', requestBody: body(obj({ code: str() }, ['code']), { code: 'WELCOME20' }), response: ok(ref('PricedCart')), errors: [404, 410] }) },
  '/api/checkout': {
    post: op({
      tag: 'Payments', status: 201, summary: 'Start checkout',
      description: 'Creates a PENDING order from the active cart (each line records the Qualify fee and the instructor’s earning) and returns a Stripe Checkout `url` to redirect to. Without `STRIPE_SECRET_KEY` (demo mode) or for a $0 total the order is fulfilled immediately and `url` points to the success page.',
      requestBody: { required: false, content: json(obj({ couponCode: str('', { example: 'WELCOME20' }) })) },
      response: ok(obj({ url: str('Where to send the student'), orderId: str(), mode: enm(['stripe', 'demo', 'free']) })),
      errors: [400, 404, 410, 500, 502],
    }),
  },
  '/api/checkout/verify': {
    get: op({ tag: 'Payments', summary: 'Confirm a payment', description: 'Called by the success page. Confirms the Stripe session and fulfils the order if the webhook hasn’t yet. Idempotent.', params: [query('session_id', { type: 'string' }, 'Stripe Checkout session id (cs_…)'), query('order', { type: 'string' }, 'Order id (demo / free orders)')], response: ok(obj({ order: ref('Order') })), errors: [400, 404] }),
  },
  '/api/orders': { get: op({ tag: 'Payments', summary: 'My purchase history', response: ok(obj({ orders: arr(ref('Order')) })) }) },
  '/api/stripe/webhook': {
    post: {
      tags: ['Payments'], summary: 'Stripe webhook', security: [],
      description: 'Called by Stripe, not by clients. Requires a valid `Stripe-Signature` header. Handles checkout.session.completed / async_payment_succeeded / async_payment_failed / expired, charge.refunded and account.updated.',
      parameters: [{ name: 'Stripe-Signature', in: 'header', required: true, schema: { type: 'string' } }],
      requestBody: { required: true, content: json({ type: 'object', description: 'Stripe Event object' }) },
      responses: { 200: ok(obj({ received: bool() })), 400: { description: 'Bad signature or Stripe not configured' }, 500: { description: 'Handler error — Stripe retries' } },
    },
  },

  // Instructor
  '/api/instructor/stats': { get: op({ tag: 'Instructor', access: 'instructor', summary: 'Dashboard analytics', response: ok(obj({ totals: obj({ revenue: num('Net earnings (USD)'), gross: num(), sales: int(), students: int(), newStudents: int(), courses: int(), published: int(), avgRating: num(), reviews: int() }), monthly: arr(ref('MonthPoint')), courses: arr(ref('CourseCard')), recentReviews: arr(ref('Review')), openQuestions: arr(ref('Question')) })) }) },
  '/api/instructor/students': { get: op({ tag: 'Instructor', access: 'instructor', summary: 'My students', params: [query('courseId', { type: 'string' })], response: ok(obj({ enrollments: arr(ref('Enrollment')) })) }) },
  '/api/instructor/earnings': {
    get: op({ tag: 'Instructor', access: 'instructor', summary: 'Earnings ledger and payout status', response: ok(obj({ feePercent: num(), stripe: obj({ enabled: bool(), connected: bool(), payoutsEnabled: bool(), requirements: arr(str()) }), totals: obj({ gross: num(), fees: num(), earned: num(), paidOut: num(), pending: num(), reversed: num(), sales: int() }), courses: arr(obj({ id: str(), title: str(), sales: int(), gross: num(), earned: num() })), items: arr(ref('OrderItem')) })) }),
  },
  '/api/instructor/earnings/connect': { post: op({ tag: 'Instructor', access: 'active-instructor', summary: 'Start Stripe Connect onboarding', description: 'Creates an Express account if needed and returns the onboarding link.', response: ok(obj({ url: str() })), errors: [400] }) },
  '/api/instructor/earnings/dashboard': { post: op({ tag: 'Instructor', access: 'instructor', summary: 'Stripe Express dashboard link', response: ok(obj({ url: str() })), errors: [400] }) },
  '/api/instructor/earnings/withdraw': { post: op({ tag: 'Instructor', access: 'active-instructor', summary: 'Send pending earnings now', response: ok(obj({ paid: int(), failed: int(), errors: arr(str()) })), errors: [400] }) },
  '/api/coupons': {
    get: op({ tag: 'Instructor', access: 'instructor', summary: 'List coupons', description: 'Admins see all coupons; instructors see coupons on their courses.', response: ok(obj({ coupons: arr(ref('Coupon')) })) }),
    post: op({ tag: 'Instructor', access: 'active-instructor', status: 201, summary: 'Create a coupon', description: 'Instructors must pick one of their own courses; admins may create site-wide coupons.', requestBody: body(obj({ code: str('', { pattern: '^[A-Z0-9_-]{3,20}$' }), discountPercent: int('', { minimum: 1, maximum: 100 }), maxUses: int(), expiresAt: str('', { format: 'date' }), courseId: str() }, ['code', 'discountPercent']), { code: 'LAUNCH25', discountPercent: 25, courseId: 'clx…' }), response: ok(obj({ coupon: ref('Coupon') })), errors: [409, 422] }),
  },
  '/api/coupons/{id}': {
    patch: op({ tag: 'Instructor', access: 'active-instructor', summary: 'Turn a coupon on or off', params: [id], requestBody: body(obj({ active: bool() }, ['active'])), response: ok(obj({ coupon: ref('Coupon') })), errors: [404] }),
    delete: op({ tag: 'Instructor', access: 'active-instructor', summary: 'Delete a coupon', params: [id], errors: [404] }),
  },

  // Reports
  '/api/reports': {
    post: op({ tag: 'Moderation', status: 201, summary: 'Report content', description: 'Flag a course, review, question, answer or user for moderators. Reporting the same thing twice returns the existing report with `duplicate: true`.', requestBody: body(obj({ targetType: enm(['COURSE', 'REVIEW', 'QUESTION', 'ANSWER', 'USER']), targetId: str(), reason: enm(['SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'MISLEADING', 'SCAM', 'LOW_QUALITY', 'OTHER']), details: str('Required when reason is OTHER') }, ['targetType', 'targetId', 'reason'])), response: ok(obj({ report: ref('Report'), duplicate: bool() })), errors: [400, 404, 422] }),
  },

  // Admin
  '/api/admin/stats': { get: op({ tag: 'Admin', access: 'admin', summary: 'Platform overview', response: ok(obj({ totals: obj({ users: int(), students: int(), instructors: int(), courses: int(), published: int(), pending: int(), revenue: num(), platformFees: num(), orders: int(), enrollments: int(), openReports: int(), restricted: int(), suspendedCourses: int() }), monthly: arr(ref('MonthPoint')), pending: arr(ref('CourseCard')), recentOrders: arr(ref('Order')), recentUsers: arr(ref('User')) })) }) },
  '/api/admin/courses': {
    get: op({ tag: 'Admin', access: 'admin', summary: 'List courses', params: [query('status', ref('CourseStatus')), query('q', { type: 'string' })], response: ok(obj({ courses: arr(ref('CourseCard')) })) }),
    patch: op({ tag: 'Admin', access: 'admin', summary: 'Change status / feature (list view)', description: 'Shortcut used by the list view. Prefer `POST /api/admin/courses/{id}`.', requestBody: body(obj({ id: str(), status: ref('CourseStatus'), featured: bool(), rejectReason: str() }, ['id'])), response: ok(obj({ course: ref('Course') })), errors: [404, 422] }),
  },
  '/api/admin/courses/{id}': {
    get: op({ tag: 'Moderation', access: 'admin', summary: 'Review a course', description: 'Full course with every lecture video, automatic quality checks, sales and refund stats, reviews (including hidden), reports and moderation history.', params: [courseId], response: ok(obj({ course: ref('Course'), stats: obj({ lectures: int(), duration: int(), sales: int(), gross: num(), fees: num(), refunds: int(), refundRate: num() }), checks: arr(obj({ label: str(), ok: bool() })), reviews: arr(ref('Review')), reports: arr(ref('Report')), history: arr(ref('AdminAction')), questions: arr(ref('Question')) })), errors: [404] }),
    post: op({
      tag: 'Moderation', access: 'admin', summary: 'Moderate a course',
      description: '`approve` publishes a pending course · `reject` sends it back with changes requested · `suspend` takes it down (removed from catalog and carts; buyers keep access) · `restore` · `unpublish` · `feature` / `unfeature`. `reject` and `suspend` need a reason (shown to the instructor). Every action is logged.',
      params: [courseId], requestBody: body(obj({ action: enm(['approve', 'reject', 'suspend', 'restore', 'unpublish', 'feature', 'unfeature']), reason: str() }, ['action']), { action: 'reject', reason: 'Audio is too low in section 2.' }),
      response: ok(obj({ course: ref('Course') })), errors: [400, 404, 422],
    }),
  },
  '/api/admin/users': {
    get: op({ tag: 'Admin', access: 'admin', summary: 'List users', params: [query('q', { type: 'string' }), query('role', ref('Role')), query('status', ref('UserStatus')), query('page', { type: 'integer' })], response: ok({ allOf: [ref('Paged'), obj({ users: arr(ref('User')) })] }) }),
    patch: op({ tag: 'Admin', access: 'admin', summary: 'Change a user’s role', requestBody: body(obj({ id: str(), role: ref('Role') }, ['id', 'role'])), response: ok(obj({ user: obj({ id: str(), role: ref('Role') }) })), errors: [400, 422] }),
    delete: op({ tag: 'Admin', access: 'admin', summary: 'Delete a user permanently', description: 'Prefer banning, which keeps the history.', params: [query('id', { type: 'string' })], errors: [400, 404] }),
  },
  '/api/admin/users/{id}': {
    get: op({ tag: 'Moderation', access: 'admin', summary: 'User detail and risk signals', description: 'Profile, courses, money, reports involving the user, moderation history and risk signals (refund rate, open reports, rating, takedowns).', params: [id], response: ok(obj({ user: ref('User'), courses: arr(ref('CourseCard')), stats: obj({ sales: int(), gross: num(), earned: num(), pending: num(), paidOut: num(), refunded: int() }), signals: arr(obj({ label: str(), value: { type: ['string', 'number'] }, level: enm(['ok', 'medium', 'high']), hint: str() })), reports: arr(ref('Report')), history: arr(ref('AdminAction')) })), errors: [404] }),
    post: op({
      tag: 'Moderation', access: 'admin', summary: 'Moderate a user',
      description: '`warn` (notification only) · `suspend` pauses an instructor (courses leave the catalog, no editing; `holdPayouts` defaults to true) · `ban` blocks login · `reactivate` · `hold-payouts` / `release-payouts` · `role` (with `role`). You can’t act on yourself or on other admins.',
      params: [id], requestBody: body(obj({ action: enm(['warn', 'suspend', 'ban', 'reactivate', 'hold-payouts', 'release-payouts', 'role']), reason: str('Required for warn, suspend and ban'), holdPayouts: bool(), role: ref('Role') }, ['action']), { action: 'suspend', reason: 'Selling copied content.', holdPayouts: true }),
      response: ok(obj({ user: obj({ id: str(), status: ref('UserStatus'), role: ref('Role'), payoutsHeld: bool() }) })), errors: [400, 404, 422],
    }),
  },
  '/api/admin/reports': {
    get: op({ tag: 'Moderation', access: 'admin', summary: 'Reports queue', description: 'Reports grouped by the reported item, most-reported first.', params: [query('status', enm(['OPEN', 'RESOLVED', 'DISMISSED'])), query('type', enm(['COURSE', 'REVIEW', 'QUESTION', 'ANSWER', 'USER']))], response: ok(obj({ items: arr(obj({ key: str(), targetType: str(), targetId: str(), target: obj({ name: str(), excerpt: str(), link: str() }), reasons: arr(str()), reports: arr(ref('Report')) })), counts: obj({ OPEN: int(), RESOLVED: int(), DISMISSED: int() }) })) }),
  },
  '/api/admin/reports/{id}': {
    patch: op({ tag: 'Moderation', access: 'admin', summary: 'Resolve or dismiss a report', description: 'Handles every open report on the same item. Optional `action` is applied first.', params: [id], requestBody: body(obj({ status: enm(['RESOLVED', 'DISMISSED']), action: enm(['none', 'hide-review', 'remove-content', 'suspend-course', 'warn-user', 'suspend-user']), resolution: str(), reason: str() }, ['status']), { status: 'RESOLVED', action: 'suspend-course', resolution: 'Promises guaranteed returns.' }), response: ok(obj({ handled: int('Reports closed') })), errors: [400, 404, 410, 422] }),
  },
  '/api/admin/reviews/{id}': { patch: op({ tag: 'Moderation', access: 'admin', summary: 'Hide or restore a review', description: 'Hidden reviews are excluded from the course rating.', params: [id], requestBody: body(obj({ hidden: bool(), reason: str() }, ['hidden'])), response: ok(obj({ ok: bool(), hidden: bool() })), errors: [404] }) },
  '/api/admin/discussions/{id}': { delete: op({ tag: 'Moderation', access: 'admin', summary: 'Remove a question or answer', params: [id, query('type', enm(['QUESTION', 'ANSWER'])), query('reason', { type: 'string' })], errors: [404, 422] }) },
  '/api/admin/activity': { get: op({ tag: 'Moderation', access: 'admin', summary: 'Audit log', params: [query('targetType', enm(['COURSE', 'USER', 'REVIEW', 'QUESTION', 'ANSWER', 'REPORT'])), query('q', { type: 'string' }), query('page', { type: 'integer' })], response: ok({ allOf: [ref('Paged'), obj({ actions: arr(ref('AdminAction')) })] }) }) },
  '/api/admin/payouts': {
    get: op({ tag: 'Admin', access: 'admin', summary: 'Payout overview', response: ok(obj({ feePercent: num(), stripeEnabled: bool(), totals: obj({ gross: num(), platformFees: num(), instructorEarnings: num(), paidOut: num(), pending: num() }), owed: arr(obj({ instructor: ref('User'), amount: num(), sales: int() })), recentOrders: arr(ref('Order')) })) }),
    post: op({ tag: 'Admin', access: 'admin', summary: 'Send or record payouts', description: '`release` transfers pending earnings via Stripe Connect (optionally for one instructor). `mark-paid` records a payout made outside Stripe.', requestBody: body(obj({ action: enm(['release', 'mark-paid']), instructorId: str() }, ['action'])), response: ok(obj({ paid: int(), failed: int(), marked: int() })), errors: [422] }),
  },
  '/api/admin/orders/{id}/refund': { post: op({ tag: 'Admin', access: 'admin', summary: 'Refund an order', description: 'Refunds the student in Stripe, reverses instructor transfers, removes course access and marks earnings REVERSED.', params: [id], response: ok(obj({ order: ref('Order') })), errors: [400, 404] }) },
};

export function buildOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Qualify API',
      version: '1.0.0',
      description:
        'REST API behind the Qualify online course marketplace.\n\n' +
        '**Authentication** — call `POST /api/auth/login`; the response sets an httpOnly `qf_token` cookie that your browser sends with every request, including from this page. ' +
        'Demo accounts: `student@qualify.dev`, `instructor@qualify.dev`, `admin@qualify.dev` (password `password123`).\n\n' +
        '**Money** — all amounts are US dollars (decimal numbers, e.g. `14.99`). ' +
        `Qualify keeps a ${PLATFORM_FEE_PERCENT}% commission on each sale; the rest is the instructor’s earning.\n\n` +
        '**Errors** — every error response is `{ "error": "message" }` with a meaningful HTTP status.',
    },
    // Relative URL: "Try it out" always calls the host the docs are opened on, so the login cookie is sent
    servers: [{ url: '/', description: 'This server' }],
    tags: [
      { name: 'Auth' }, { name: 'Profile' }, { name: 'Catalog', description: 'Public course browsing' },
      { name: 'Learning', description: 'Enrollment, player, progress, notes, certificates' }, { name: 'Q&A' }, { name: 'Reviews' },
      { name: 'Shopping', description: 'Cart, wishlist, coupons' }, { name: 'Payments', description: 'Stripe Checkout and orders' },
      { name: 'Instructor', description: 'Analytics, students, earnings, coupons' }, { name: 'Instructor studio', description: 'Create and edit courses' },
      { name: 'Moderation', description: 'Reports, course review and user actions' }, { name: 'Admin' },
    ],
    security: [{ cookieAuth: [] }],
    paths,
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'qf_token', description: 'Set automatically by POST /api/auth/login' },
      },
      responses: {
        BadRequest: { description: 'The request can’t be completed as sent', content: json(ref('Error')) },
        Unauthorized: { description: 'Not logged in', content: json(ref('Error')) },
        Forbidden: { description: 'Logged in but not allowed (wrong role, paused or banned)', content: json(ref('Error')) },
        NotFound: { description: 'No such record', content: json(ref('Error')) },
        Conflict: { description: 'Conflicts with existing data', content: json(ref('Error')) },
        Validation: { description: 'A field is missing or invalid', content: json(ref('Error')) },
      },
      schemas,
    },
  };
}
