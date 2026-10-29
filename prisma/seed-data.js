/* Realistic demo content for Qualify. Used by prisma/seed.js. */

const img = (id) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;
const face = (id) => `https://images.unsplash.com/${id}?w=200&h=200&q=70&auto=format&fit=crop&crop=faces`;

// Public sample videos + well-known free YouTube lessons
const MP4 = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];
const YT = {
  python: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
  js: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
  sql: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
  react: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
  docker: 'https://www.youtube.com/watch?v=3c-iBn73dDE',
  html: 'https://www.youtube.com/watch?v=pQN-pnXPaVg',
};

const CATEGORIES = [
  ['Web Development', 'bi-code-slash', '#2b3fe0'],
  ['Data Science', 'bi-graph-up', '#0e7490'],
  ['AI & Machine Learning', 'bi-cpu', '#7c3aed'],
  ['Design', 'bi-palette', '#c2410c'],
  ['Business', 'bi-briefcase', '#b45309'],
  ['Marketing', 'bi-megaphone', '#15803d'],
  ['IT & Cloud', 'bi-cloud', '#1d4ed8'],
  ['Cybersecurity', 'bi-shield-lock', '#334155'],
  ['Finance & Investing', 'bi-currency-exchange', '#047857'],
  ['Photography & Video', 'bi-camera', '#be123c'],
  ['Personal Development', 'bi-heart-pulse', '#9333ea'],
];

/* key → instructor. `status` lets the seed create moderation scenarios. */
const INSTRUCTORS = {
  rahul: { name: 'Rahul Verma', email: 'instructor@qualify.dev', headline: 'Senior Full-Stack Engineer, ex-Flipkart', avatar: face('photo-1507003211169-0a1dd7228f2d'), bio: 'I spent 12 years building web products at Flipkart and two early-stage startups in Bengaluru. Over 40,000 people have learned to code with my courses. I teach the way I wish I had been taught: build real things first, then fill in the theory.' },
  meera: { name: 'Dr. Meera Iyer', email: 'meera@qualify.dev', headline: 'Data Scientist · PhD, IISc Bengaluru', avatar: face('photo-1580489944761-15a19d654956'), bio: 'Former research scientist at a healthcare AI lab. I help analysts and engineers move from spreadsheets to production machine learning, using real, messy datasets rather than toy examples.' },
  alex: { name: 'Alex Carter', email: 'alex@qualify.dev', headline: 'Product Designer, 10+ years at agencies and SaaS', avatar: face('photo-1472099645785-5658abf4ff4e'), bio: 'I have designed apps used by millions, led design teams in London and Singapore, and mentored more than 200 junior designers. My courses focus on the decisions behind good design, not just the tools.' },
  ananya: { name: 'Ananya Krishnan', email: 'ananya@qualify.dev', headline: 'Growth Marketer · Ex-Swiggy, Zomato', avatar: face('photo-1573496359142-b8d87734a5a2'), bio: 'I ran performance marketing budgets of $6M+ a year and built growth teams from scratch. I teach marketing as a set of experiments you can measure.' },
  arjun: { name: 'Arjun Nair', email: 'arjun@qualify.dev', headline: 'Cloud Architect · AWS & Kubernetes certified', avatar: face('photo-1560250097-0b93528c311a'), bio: 'I design cloud platforms for fintech companies and hold AWS Solutions Architect Professional and CKA certifications. I love making infrastructure feel less scary.' },
  sofia: { name: 'Sofia Martins', email: 'sofia@qualify.dev', headline: 'Security Engineer & CTF player', avatar: face('photo-1573497019940-1c28c88b4f3e'), bio: 'Penetration tester turned security engineer. I teach practical, ethical security skills with hands-on labs you can run safely on your own machine.' },
  karthik: { name: 'Karthik Subramanian', email: 'karthik@qualify.dev', headline: 'Chartered Accountant & SEBI-registered advisor', avatar: face('photo-1519085360753-af0119f7cbe7'), bio: 'I have advised over 1,500 families on personal finance. My courses explain money in plain language — no jargon, no stock tips, just sound habits.' },
  li: { name: 'Li Wen', email: 'li@qualify.dev', headline: 'Filmmaker & Photographer', avatar: face('photo-1531427186611-ecfd6d936c79'), bio: 'Documentary filmmaker whose work has screened at festivals across Asia. I teach storytelling with the camera you already own.' },
  rocky: { name: 'Rocky Malhotra', email: 'rocky@qualify.dev', headline: 'Trader · "Financial freedom coach"', avatar: face('photo-1557862921-37829c790f19'), bio: 'Made my first crore by 25. I show you the exact system I use.', flagged: true },
  daniel: { name: 'Daniel Brooks', email: 'daniel@qualify.dev', headline: 'Web developer', avatar: face('photo-1500648767791-00dcc994a43e'), bio: 'Web developer and online educator.', status: 'SUSPENDED', statusReason: 'Two courses contained lectures copied from another creator’s paid course without permission.' },
};

const STUDENTS = [
  'Priya Sharma', 'Arjun Mehta', 'Sara Thomas', 'Kavya Nair', 'Vikram Rao', 'Ananya Gupta', 'Rohan Das', 'Neha Pillai',
  'Karthik Raman', 'Divya Krishnan', 'Aditya Joshi', 'Fatima Khan', 'Rahul Bose', 'Sneha Reddy', 'Manish Patel', 'Pooja Iyer',
  'Siddharth Menon', 'Ishita Kapoor', 'Nikhil Agarwal', 'Meghna Shetty', 'Harish Kumar', 'Tanvi Desai', 'Varun Chopra', 'Aarti Mishra',
  'Deepak Yadav', 'Ritika Banerjee', 'Gaurav Singh', 'Lakshmi Narayanan', 'Abdul Rahman', 'Swati Kulkarni', 'Kiran Hegde', 'Anjali Verma',
  'Mohammed Irfan', 'Shruti Bhat', 'Rajesh Pandey', 'Nandini Rao', 'Akash Tiwari', 'Preeti Saxena', 'Sameer Qureshi', 'Bhavna Jain',
  'Emily Johnson', 'Daniel Kim', 'Sofia Rossi', 'Lucas Müller', 'Aisha Bello', 'James O’Connor', 'Mei Tanaka', 'Carlos Mendes',
  'Hannah Lee', 'Omar Haddad', 'Chloe Martin', 'Ravi Shankar', 'Vidya Sagar', 'Zara Ahmed', 'Tarun Gill', 'Keerthana S',
];
// Extra learners generated from common first/last names so courses have realistic numbers
const FIRST = ['Aarav', 'Vivaan', 'Aditi', 'Diya', 'Ishaan', 'Saanvi', 'Reyansh', 'Myra', 'Krishna', 'Anika', 'Arnav', 'Kiara', 'Dhruv', 'Riya', 'Kabir', 'Avni', 'Yash', 'Meera', 'Atharv', 'Tara', 'Pranav', 'Nisha', 'Rohit', 'Shreya', 'Amit', 'Kavitha', 'Suresh', 'Lavanya', 'Naveen', 'Pallavi', 'John', 'Maria', 'Ahmed', 'Chen', 'Olivia', 'Noah', 'Ethan', 'Grace', 'Yusuf', 'Leila'];
const LAST = ['Sharma', 'Iyer', 'Reddy', 'Patel', 'Nair', 'Singh', 'Gupta', 'Menon', 'Rao', 'Pillai', 'Kulkarni', 'Chatterjee', 'Joshi', 'Bhat', 'Das', 'Fernandes', 'Khan', 'Mehta', 'Varma', 'Hegde', 'Smith', 'Garcia', 'Wang', 'Silva', 'Ali'];
const EXTRA_STUDENTS = Array.from({ length: 100 }, (_, i) => `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 11 + Math.floor(i / FIRST.length)) % LAST.length]}`);

const STUDENT_FACES = [
  'photo-1494790108377-be9c29b29330', 'photo-1506794778202-cad84cf45f1d', 'photo-1438761681033-6461ffad8d80', 'photo-1534528741775-53994a69daeb',
  'photo-1539571696357-5a69c17a67c6', 'photo-1544005313-94ddf0286df2', 'photo-1517841905240-472988babdf9', 'photo-1554151228-14d9def656e7',
];

/*
  Courses. `s` = sections: [title, [lecture titles]]. `status` defaults to PUBLISHED.
  `v` = a YouTube lesson to use for the first lecture where it fits.
*/
const COURSES = [
  // ── Web Development ──
  {
    by: 'rahul', cat: 'Web Development', title: 'The Complete Full-Stack Web Development Bootcamp 2026', price: 89.99, sale: 13.99, level: 'ALL_LEVELS', featured: true, v: YT.html,
    sub: 'Go from zero to job-ready: HTML, CSS, JavaScript, React, Node.js, PostgreSQL and deployment — with 16 portfolio projects.',
    thumb: img('photo-1498050108023-c5249f4df085'), tags: ['javascript', 'react', 'node', 'fullstack', 'web development'],
    out: ['Build and deploy 16 real projects for your portfolio', 'Write modern JavaScript confidently (ES2024)', 'Create React apps with hooks, routing and forms', 'Design REST APIs with Node.js and Express', 'Model data in PostgreSQL with Prisma', 'Prepare for junior developer interviews'],
    req: ['A laptop (Windows, macOS or Linux)', 'No programming experience needed'],
    s: [
      ['Getting set up', ['How this bootcamp works', 'Installing VS Code, Node.js and Git', 'Your first web page in 10 minutes']],
      ['HTML & CSS foundations', ['Semantic HTML that search engines love', 'The box model, finally explained', 'Flexbox layouts', 'CSS Grid for page layouts', 'Project: responsive portfolio site']],
      ['JavaScript essentials', ['Variables, types and operators', 'Functions and scope', 'Arrays, objects and destructuring', 'Working with the DOM', 'Async JavaScript: promises and async/await']],
      ['React from scratch', ['Thinking in components', 'State and props', 'useEffect and fetching data', 'Forms and validation', 'Project: expense tracker']],
      ['Backend with Node, Express and PostgreSQL', ['Express routes and middleware', 'Designing a REST API', 'PostgreSQL and Prisma ORM', 'Authentication with JWT and cookies', 'Deploying to Render and Vercel']],
    ],
  },
  {
    by: 'rahul', cat: 'Web Development', title: 'Next.js 15 & React 19: Build Production Apps', price: 79.99, sale: 13.99, level: 'INTERMEDIATE', featured: true, v: YT.react,
    sub: 'Master the App Router, server components, server actions, caching and full-stack patterns used in real companies.',
    thumb: img('photo-1633356122544-f134324a6cee'), tags: ['nextjs', 'react', 'typescript', 'frontend'],
    out: ['Structure large Next.js apps with the App Router', 'Use server components and server actions correctly', 'Control caching, revalidation and streaming', 'Add auth, payments and a database', 'Ship to production with confidence'],
    req: ['Comfortable with JavaScript and basic React'],
    s: [
      ['The App Router mental model', ['Why server components change everything', 'Layouts, pages and route groups', 'Loading and error boundaries']],
      ['Data fetching and caching', ['fetch, cache and revalidate', 'Server actions for mutations', 'Optimistic UI with useOptimistic', 'Streaming with Suspense']],
      ['Full-stack features', ['Route handlers as APIs', 'Prisma and PostgreSQL', 'Auth with cookies and middleware', 'Stripe Checkout integration']],
      ['Shipping it', ['Performance budgets and Core Web Vitals', 'Deploying to Vercel', 'Monitoring and logging']],
    ],
  },
  {
    by: 'rahul', cat: 'Web Development', title: 'JavaScript Algorithms & Data Structures for Interviews', price: 59.99, sale: 10.99, level: 'ADVANCED', v: YT.js,
    sub: 'Crack coding interviews at product companies with patterns, 120+ solved problems and Big-O you actually understand.',
    thumb: img('photo-1515879218367-8466d910aaa4'), tags: ['algorithms', 'javascript', 'interview', 'dsa'],
    out: ['Analyse time and space complexity quickly', 'Recognise the 14 most common problem patterns', 'Implement trees, graphs and heaps from scratch', 'Explain your approach clearly in interviews'],
    req: ['Comfortable writing JavaScript functions'],
    s: [
      ['Foundations', ['Big-O without the math anxiety', 'How to approach any problem', 'Arrays and strings warm-up']],
      ['Core patterns', ['Two pointers', 'Sliding window', 'Fast and slow pointers', 'Binary search on answers']],
      ['Data structures', ['Linked lists', 'Stacks and queues', 'Trees and BSTs', 'Heaps and priority queues', 'Graphs: BFS and DFS']],
      ['Dynamic programming', ['Recursion to memoization', 'Classic 1D problems', 'Grid and 2D problems', 'Mock interview walkthrough']],
    ],
  },
  {
    by: 'rahul', cat: 'Web Development', title: 'TypeScript Deep Dive for React Developers', price: 59.99, sale: 11.99, level: 'INTERMEDIATE', status: 'PENDING',
    sub: 'Generics, utility types, discriminated unions and typing real React codebases without fighting the compiler.',
    thumb: img('photo-1587620962725-abab7fe55159'), tags: ['typescript', 'react'],
    out: ['Type components, hooks and context properly', 'Use generics and utility types', 'Model state with discriminated unions', 'Migrate a JavaScript codebase gradually'],
    req: ['Working knowledge of React'],
    s: [
      ['Type system essentials', ['Types vs interfaces', 'Narrowing', 'Generics in practice']],
      ['TypeScript with React', ['Typing props and children', 'Typing hooks and context', 'Forms with Zod and React Hook Form']],
      ['Advanced patterns', ['Discriminated unions for UI state', 'Mapped and conditional types', 'Migrating a real project']],
    ],
  },
  {
    by: 'daniel', cat: 'Web Development', title: 'Become a Web Developer in 30 Days', price: 49.99, sale: 9.99, level: 'BEGINNER', status: 'SUSPENDED',
    rejectReason: 'Lectures 4–11 are copied from another creator’s paid course. Reported by the original author with timestamps.',
    sub: 'HTML, CSS and JavaScript crash course.', thumb: img('photo-1517694712202-14dd9538aa97'), tags: ['html', 'css'],
    out: ['Build websites'], req: ['None'],
    s: [['Course', ['Intro', 'HTML', 'CSS', 'JavaScript', 'Final project']]],
  },

  // ── Data Science ──
  {
    by: 'meera', cat: 'Data Science', title: 'Python for Data Analysis: Pandas, NumPy & Visualisation', price: 79.99, sale: 14.99, level: 'BEGINNER', featured: true, v: YT.python,
    sub: 'Clean, analyse and visualise real-world data with Python — from CSVs and Excel files to dashboards your manager will love.',
    thumb: img('photo-1551288049-bebda4e38f71'), tags: ['python', 'pandas', 'data analysis', 'numpy'],
    out: ['Write clean, idiomatic Python', 'Load, clean and reshape data with pandas', 'Answer business questions with groupby and pivots', 'Create clear charts with Matplotlib and Seaborn', 'Automate weekly Excel reports'],
    req: ['No programming experience required', 'Basic school-level maths'],
    s: [
      ['Python crash course', ['Installing Python and Jupyter', 'Variables, lists and dictionaries', 'Loops and functions', 'Reading files']],
      ['NumPy and pandas', ['NumPy arrays and vectorisation', 'DataFrames 101', 'Cleaning messy data', 'Merging and joining tables', 'GroupBy and pivot tables']],
      ['Visualising data', ['Choosing the right chart', 'Matplotlib fundamentals', 'Seaborn for statistical plots']],
      ['Capstone projects', ['Sales analysis for a retail chain', 'IPL cricket stats explorer', 'Automating a weekly Excel report']],
    ],
  },
  {
    by: 'meera', cat: 'Data Science', title: 'SQL for Data Analysts: From SELECT to Window Functions', price: 49.99, sale: 10.99, level: 'BEGINNER', v: YT.sql,
    sub: 'Write fast, readable SQL in PostgreSQL and MySQL. Joins, CTEs, window functions and 40 real interview questions.',
    thumb: img('photo-1544383835-bda2bc66a55d'), tags: ['sql', 'postgresql', 'mysql', 'database'],
    out: ['Query any relational database confidently', 'Combine tables with every kind of join', 'Use CTEs and window functions', 'Solve SQL interview questions'],
    req: ['No database experience needed'],
    s: [
      ['SQL basics', ['How relational databases work', 'SELECT, WHERE and ORDER BY', 'Aggregations and GROUP BY']],
      ['Combining data', ['Inner and outer joins', 'Self joins', 'Subqueries vs CTEs']],
      ['Advanced analysis', ['Window functions: ROW_NUMBER, RANK', 'Running totals and moving averages', 'Indexes and query performance', 'Interview question walkthroughs']],
    ],
  },
  {
    by: 'meera', cat: 'Data Science', title: 'Statistics for Data Science, Explained Simply', price: 39.99, sale: 9.99, level: 'BEGINNER',
    sub: 'The statistics you actually need for A/B tests, dashboards and machine learning — with Python, not formulas.',
    thumb: img('photo-1543286386-713bdd548da4'), tags: ['statistics', 'python', 'ab testing'],
    out: ['Describe data with the right summary statistics', 'Understand distributions and sampling', 'Run and interpret A/B tests', 'Avoid the most common statistical mistakes'],
    req: ['Basic Python helps but isn’t required'],
    s: [
      ['Describing data', ['Mean, median and when each lies', 'Spread and outliers', 'Visualising distributions']],
      ['Inference', ['Sampling and the central limit theorem', 'Confidence intervals', 'Hypothesis tests without the jargon']],
      ['In practice', ['Designing an A/B test', 'Analysing an A/B test', 'Correlation is not causation']],
    ],
  },
  {
    by: 'meera', cat: 'Data Science', title: 'Power BI: Dashboards that Drive Decisions', price: 59.99, sale: 11.99, level: 'BEGINNER',
    sub: 'Turn spreadsheets into interactive Power BI dashboards. DAX, data modelling and storytelling for business users.',
    thumb: img('photo-1504868584819-f8e8b4b6d7e3'), tags: ['power bi', 'dax', 'excel', 'dashboards'],
    out: ['Import and clean data with Power Query', 'Build a star-schema data model', 'Write essential DAX measures', 'Design dashboards people actually use'],
    req: ['Power BI Desktop (free, Windows)'],
    s: [
      ['Getting data in', ['Power BI tour', 'Power Query transformations', 'Combining Excel files']],
      ['Modelling and DAX', ['Star schemas', 'CALCULATE explained', 'Time intelligence']],
      ['Dashboard design', ['Layout and visual hierarchy', 'Drill-through and bookmarks', 'Publishing and sharing']],
    ],
  },

  // ── AI & ML ──
  {
    by: 'meera', cat: 'AI & Machine Learning', title: 'Machine Learning A–Z with Python and scikit-learn', price: 99.99, sale: 15.99, level: 'INTERMEDIATE', featured: true,
    sub: 'Regression, classification, clustering and model evaluation with real datasets — and how to ship a model as an API.',
    thumb: img('photo-1677442136019-21780ecad995'), tags: ['machine learning', 'python', 'scikit-learn', 'ai'],
    out: ['Frame business problems as ML problems', 'Train regression and classification models', 'Evaluate models without fooling yourself', 'Tune hyperparameters and avoid overfitting', 'Deploy a model behind a FastAPI endpoint'],
    req: ['Python and pandas basics'],
    s: [
      ['ML foundations', ['What machine learning really is', 'Train/test splits and leakage', 'Your first model in 15 minutes']],
      ['Supervised learning', ['Linear and logistic regression', 'Decision trees and random forests', 'Gradient boosting with XGBoost', 'Evaluation metrics that matter']],
      ['Unsupervised learning', ['K-means clustering', 'PCA for dimensionality reduction', 'Customer segmentation project']],
      ['Shipping models', ['Pipelines and feature engineering', 'Serving with FastAPI', 'Monitoring model drift']],
    ],
  },
  {
    by: 'rahul', cat: 'AI & Machine Learning', title: 'Build AI Apps with LLM APIs: RAG, Agents & Tool Use', price: 89.99, sale: 16.99, level: 'INTERMEDIATE',
    sub: 'Build chatbots, document Q&A and AI agents with large language model APIs, embeddings and vector databases.',
    thumb: img('photo-1620712943543-bcc4688e7485'), tags: ['ai', 'llm', 'rag', 'python', 'agents'],
    out: ['Call LLM APIs with good prompts', 'Build retrieval-augmented generation over your documents', 'Give models tools and build simple agents', 'Evaluate and guard AI features'],
    req: ['Python or JavaScript experience'],
    s: [
      ['LLM fundamentals', ['How large language models work', 'Prompting that actually works', 'Structured outputs and JSON']],
      ['Retrieval-augmented generation', ['Embeddings explained', 'Vector databases', 'Chunking strategies', 'Project: chat with your PDFs']],
      ['Agents and tools', ['Tool use / function calling', 'Planning loops', 'Evaluations and guardrails']],
    ],
  },
  {
    by: 'arjun', cat: 'AI & Machine Learning', title: 'Deep Learning with PyTorch', price: 79.99, sale: 14.99, level: 'ADVANCED', status: 'PENDING',
    sub: 'Neural networks from first principles to CNNs and transformers, trained on your own GPU or Colab.',
    thumb: img('photo-1555949963-aa79dcee981c'), tags: ['pytorch', 'deep learning'],
    out: ['Build neural networks from scratch', 'Train CNNs for image classification', 'Understand attention and transformers', 'Use GPUs effectively'],
    req: ['Python, NumPy and basic calculus'],
    s: [
      ['Foundations', ['Tensors and autograd', 'Your first neural network', 'Training loops']],
      ['Vision', ['Convolutions', 'Transfer learning']],
      ['Sequences', ['Attention', 'A tiny transformer']],
    ],
  },

  // ── Design ──
  {
    by: 'alex', cat: 'Design', title: 'UI/UX Design with Figma: Zero to Job-Ready', price: 79.99, sale: 11.99, level: 'ALL_LEVELS', featured: true,
    sub: 'Learn the full product design process in Figma — research, wireframes, UI, prototyping and a portfolio case study.',
    thumb: img('photo-1561070791-2526d30994b5'), tags: ['figma', 'ui', 'ux', 'product design'],
    out: ['Run lightweight user research', 'Wireframe and prototype in Figma', 'Design clean, accessible interfaces', 'Build a component library with auto layout', 'Write a portfolio case study that gets interviews'],
    req: ['A free Figma account', 'No design experience needed'],
    s: [
      ['Design fundamentals', ['What good UI really means', 'Typography that works', 'Colour and contrast', 'Spacing and grids']],
      ['Figma essentials', ['Frames and auto layout', 'Components and variants', 'Prototyping interactions']],
      ['The UX process', ['User interviews', 'Journey maps', 'Wireframes', 'Usability testing on a budget']],
      ['Portfolio project', ['Redesigning a food delivery app', 'Writing your case study']],
    ],
  },
  {
    by: 'alex', cat: 'Design', title: 'Design Systems in Figma: Tokens, Components & Handoff', price: 59.99, sale: 13.99, level: 'ADVANCED',
    sub: 'Build a scalable design system with variables, tokens, documentation and a smooth developer handoff.',
    thumb: img('photo-1586717791821-3f44a563fa4c'), tags: ['design systems', 'figma', 'tokens'],
    out: ['Set up variables and design tokens', 'Build robust components with variants', 'Document usage guidelines', 'Hand off to developers without friction'],
    req: ['Comfortable with Figma'],
    s: [
      ['Foundations', ['Why design systems fail', 'Variables and modes', 'Naming tokens']],
      ['Components', ['Buttons done right', 'Form controls', 'Complex components']],
      ['Adoption', ['Documentation', 'Developer handoff', 'Governance']],
    ],
  },
  {
    by: 'alex', cat: 'Design', title: 'Graphic Design Masterclass: Photoshop, Illustrator & Canva', price: 49.99, sale: 10.99, level: 'BEGINNER',
    sub: 'Design logos, social posts and posters with confidence. Theory first, then tools.',
    thumb: img('photo-1626785774573-4b799315345d'), tags: ['graphic design', 'photoshop', 'illustrator', 'canva'],
    out: ['Apply layout, hierarchy and contrast', 'Design logos in Illustrator', 'Edit photos in Photoshop', 'Create social media kits in Canva'],
    req: ['Adobe CC trial or Canva free'],
    s: [
      ['Design theory', ['Composition', 'Hierarchy', 'Colour psychology']],
      ['Tools', ['Photoshop essentials', 'Illustrator and the pen tool', 'Canva for fast social posts']],
      ['Projects', ['Brand logo', 'Event poster', 'Instagram kit']],
    ],
  },

  // ── Business ──
  {
    by: 'ananya', cat: 'Business', title: 'Product Management Fundamentals', price: 69.99, sale: 14.99, level: 'BEGINNER',
    sub: 'How product managers decide what to build: discovery, prioritisation, metrics and working with engineers.',
    thumb: img('photo-1551434678-e076c223a692'), tags: ['product management', 'pm', 'strategy'],
    out: ['Run customer discovery interviews', 'Write clear PRDs', 'Prioritise with RICE and opportunity sizing', 'Define success metrics', 'Prepare for PM interviews'],
    req: ['None'],
    s: [
      ['The PM role', ['What PMs actually do', 'Working with design and engineering']],
      ['Discovery', ['Customer interviews', 'Finding the real problem', 'Opportunity sizing']],
      ['Delivery', ['Writing a PRD', 'Prioritisation frameworks', 'Metrics and experiments', 'PM interview practice']],
    ],
  },
  {
    by: 'ananya', cat: 'Business', title: 'Start a Business in India: From Idea to Your First $10K', price: 59.99, sale: 13.99, level: 'BEGINNER',
    sub: 'Validate an idea, register your company, handle GST, price your product and land your first customers.',
    thumb: img('photo-1556761175-b413da4baf72'), tags: ['startup', 'entrepreneurship', 'india', 'gst'],
    out: ['Validate demand before spending money', 'Choose between proprietorship, LLP and Pvt Ltd', 'Understand GST registration and invoicing', 'Price and sell your first product'],
    req: ['An idea or the urge to find one'],
    s: [
      ['Validation', ['Finding problems worth solving', 'Talking to customers', 'Pre-selling']],
      ['Setting up', ['Company structures compared', 'GST basics', 'Bank accounts and payments']],
      ['First customers', ['Pricing', 'Your first sales calls', 'Simple bookkeeping']],
    ],
  },
  {
    by: 'karthik', cat: 'Business', title: 'Excel for Business: Formulas, Pivot Tables & Dashboards', price: 39.99, sale: 9.99, level: 'ALL_LEVELS',
    sub: 'The Excel skills every office job expects: XLOOKUP, pivot tables, charts and a one-page dashboard.',
    thumb: img('photo-1454165804606-c3d57bc86b40'), tags: ['excel', 'pivot tables', 'office'],
    out: ['Use 40 essential formulas', 'Summarise data with pivot tables', 'Build a monthly sales dashboard', 'Save hours with shortcuts'],
    req: ['Microsoft Excel 2019 or 365'],
    s: [
      ['Essentials', ['Navigating like a pro', 'Cell references', 'Text and date functions']],
      ['Analysis', ['XLOOKUP and INDEX/MATCH', 'Pivot tables', 'Conditional formatting']],
      ['Dashboards', ['Charts that communicate', 'Slicers', 'One-page dashboard project']],
    ],
  },

  // ── Marketing ──
  {
    by: 'ananya', cat: 'Marketing', title: 'Digital Marketing Masterclass 2026', price: 79.99, sale: 10.99, level: 'ALL_LEVELS', featured: true,
    sub: 'SEO, Google Ads, Meta Ads, email and content — a complete, measurable marketing playbook for businesses and freelancers.',
    thumb: img('photo-1460925895917-afdab827c52f'), tags: ['digital marketing', 'seo', 'google ads', 'meta ads'],
    out: ['Plan a full-funnel marketing strategy', 'Rank pages with practical SEO', 'Run profitable Google and Meta ad campaigns', 'Grow and monetise an email list', 'Measure everything with GA4'],
    req: ['No experience needed'],
    s: [
      ['Strategy', ['The marketing funnel', 'Knowing your customer', 'Setting goals and budgets']],
      ['Organic growth', ['SEO fundamentals', 'Content that ranks', 'Social media that isn’t a time sink']],
      ['Paid growth', ['Google Search Ads', 'Meta Ads targeting', 'Creative testing', 'Retargeting']],
      ['Measurement', ['GA4 setup', 'Attribution basics', 'Reporting to clients']],
    ],
  },
  {
    by: 'ananya', cat: 'Marketing', title: 'Instagram & YouTube Growth for Creators', price: 39.99, sale: 9.99, level: 'BEGINNER',
    sub: 'Grow an audience with short-form video, consistent content systems and honest brand deals.',
    thumb: img('photo-1611162617474-5b21e879e113'), tags: ['instagram', 'youtube', 'creator', 'reels'],
    out: ['Find a niche you can sustain', 'Script and edit short videos', 'Read analytics and iterate', 'Pitch and price brand deals'],
    req: ['A smartphone'],
    s: [
      ['Foundations', ['Choosing your niche', 'Content pillars']],
      ['Making content', ['Hooks that stop the scroll', 'Filming on a phone', 'Editing in CapCut']],
      ['Growing', ['Analytics', 'Collaborations', 'Brand deals']],
    ],
  },

  // ── IT & Cloud ──
  {
    by: 'arjun', cat: 'IT & Cloud', title: 'Docker & Kubernetes: The Practical Guide', price: 79.99, sale: 13.99, level: 'INTERMEDIATE', v: YT.docker,
    sub: 'Containerise apps, write production Dockerfiles and run them on Kubernetes with Helm and GitOps.',
    thumb: img('photo-1667372393119-3d4c48d07fc9'), tags: ['docker', 'kubernetes', 'devops', 'helm'],
    out: ['Write small, secure Docker images', 'Run multi-service apps with Compose', 'Deploy and scale on Kubernetes', 'Package apps with Helm', 'Set up a GitOps workflow'],
    req: ['Comfortable with the command line'],
    s: [
      ['Docker', ['Containers vs virtual machines', 'Writing Dockerfiles', 'Multi-stage builds', 'Docker Compose']],
      ['Kubernetes core', ['Pods, deployments and services', 'ConfigMaps and secrets', 'Ingress and TLS']],
      ['Production', ['Autoscaling', 'Helm charts', 'GitOps with Argo CD', 'Observability basics']],
    ],
  },
  {
    by: 'arjun', cat: 'IT & Cloud', title: 'AWS Certified Solutions Architect – Associate (SAA-C03)', price: 89.99, sale: 15.99, level: 'INTERMEDIATE', featured: true,
    sub: 'Everything you need to pass the SAA-C03 exam — with hands-on labs and two full practice tests.',
    thumb: img('photo-1451187580459-43490279c0fa'), tags: ['aws', 'cloud', 'certification', 'saa-c03'],
    out: ['Pass the AWS SAA-C03 exam', 'Design secure, resilient architectures', 'Choose the right storage and database services', 'Control costs on AWS'],
    req: ['Basic IT knowledge', 'An AWS free-tier account'],
    s: [
      ['Core services', ['IAM done right', 'EC2 and Auto Scaling', 'S3 storage classes', 'VPC networking']],
      ['Databases and decoupling', ['RDS vs DynamoDB', 'SQS, SNS and EventBridge', 'Caching with ElastiCache']],
      ['Exam preparation', ['Well-Architected Framework', 'Practice test 1 walkthrough', 'Practice test 2 walkthrough', 'Exam day tips']],
    ],
  },
  {
    by: 'arjun', cat: 'IT & Cloud', title: 'Linux Command Line & Shell Scripting', price: 39.99, sale: 9.99, level: 'BEGINNER',
    sub: 'Get comfortable in the terminal: files, permissions, processes, networking and Bash scripts that automate boring work.',
    thumb: img('photo-1558494949-ef010cbdcc31'), tags: ['linux', 'bash', 'shell'],
    out: ['Navigate and manage files from the terminal', 'Understand users, groups and permissions', 'Manage processes and services', 'Write Bash scripts'],
    req: ['Any computer; we use a free Ubuntu VM'],
    s: [
      ['Terminal basics', ['Your first commands', 'Files and directories', 'Pipes and redirection']],
      ['System administration', ['Users and permissions', 'Processes and systemd', 'Networking tools']],
      ['Scripting', ['Variables and loops', 'Functions', 'Automating backups']],
    ],
  },

  // ── Cybersecurity ──
  {
    by: 'sofia', cat: 'Cybersecurity', title: 'Ethical Hacking & Penetration Testing from Scratch', price: 89.99, sale: 15.99, level: 'BEGINNER',
    sub: 'Learn how attackers think and how to defend systems — legally, in your own lab with Kali Linux.',
    thumb: img('photo-1563986768609-322da13575f3'), tags: ['ethical hacking', 'cybersecurity', 'kali linux', 'pentesting'],
    out: ['Build a safe home hacking lab', 'Scan and enumerate networks', 'Find and exploit common web vulnerabilities', 'Write a professional pentest report'],
    req: ['A computer with 8 GB RAM', 'Curiosity and good ethics'],
    s: [
      ['Lab setup', ['Ethics and the law', 'Installing Kali and target VMs']],
      ['Reconnaissance', ['Passive recon', 'Nmap scanning', 'Service enumeration']],
      ['Web application attacks', ['OWASP Top 10 overview', 'SQL injection', 'Cross-site scripting', 'Broken authentication']],
      ['Reporting', ['Writing findings', 'Remediation advice']],
    ],
  },
  {
    by: 'sofia', cat: 'Cybersecurity', title: 'Cybersecurity Essentials for Everyone', price: 0, level: 'BEGINNER',
    sub: 'Protect yourself and your family from scams, phishing and account takeovers in under two hours.',
    thumb: img('photo-1555949963-ff9fe0c870eb'), tags: ['security', 'privacy', 'phishing'],
    out: ['Spot phishing and UPI scams', 'Use a password manager and 2FA', 'Secure your phone and Wi-Fi'],
    req: ['None'],
    s: [
      ['Everyday threats', ['How scammers think', 'Phishing and fake UPI requests']],
      ['Protecting yourself', ['Passwords and 2FA', 'Securing your phone', 'Home Wi-Fi checklist']],
    ],
  },

  // ── Finance ──
  {
    by: 'karthik', cat: 'Finance & Investing', title: 'Personal Finance in India: Save, Invest, Retire Early', price: 49.99, sale: 9.99, level: 'BEGINNER', featured: true,
    sub: 'Budgeting, emergency funds, insurance, mutual funds, tax saving and a plan you can follow for the next 20 years.',
    thumb: img('photo-1579621970563-ebec7560ff3e'), tags: ['personal finance', 'mutual funds', 'tax', 'india'],
    out: ['Build a budget that sticks', 'Choose the right term and health insurance', 'Invest in index funds and SIPs', 'Save tax legally under the new and old regimes'],
    req: ['None'],
    s: [
      ['Foundations', ['Where your money goes', 'Emergency funds', 'Getting out of credit card debt']],
      ['Protection', ['Term insurance', 'Health insurance']],
      ['Investing', ['Mutual funds explained', 'Index funds and SIPs', 'Asset allocation', 'Tax saving options']],
    ],
  },
  {
    by: 'karthik', cat: 'Finance & Investing', title: 'Stock Market Investing for Beginners', price: 59.99, sale: 11.99, level: 'BEGINNER',
    sub: 'Read financial statements, value companies and build a long-term portfolio — no tips, no hype.',
    thumb: img('photo-1611974789855-9c2a0a7236a3'), tags: ['stocks', 'investing', 'nse', 'fundamental analysis'],
    out: ['Read balance sheets and P&L statements', 'Value a business with simple ratios', 'Avoid common behavioural mistakes', 'Build a diversified long-term portfolio'],
    req: ['A Demat account is helpful but not required'],
    s: [
      ['How markets work', ['Stocks, exchanges and brokers', 'Indices and ETFs']],
      ['Analysing companies', ['Reading financial statements', 'Key ratios', 'Moats and management']],
      ['Building a portfolio', ['Diversification', 'When to sell', 'Behavioural traps']],
    ],
  },
  {
    by: 'rocky', cat: 'Finance & Investing', title: 'Earn $10,000/Month from Options Trading — My Secret System', price: 119.99, sale: 49.99, level: 'ALL_LEVELS',
    sub: 'The exact strategy I use to make guaranteed profits every month. Join my private Telegram for live calls.',
    thumb: img('photo-1590283603385-17ffb3a7f29f'), tags: ['trading', 'options', 'income'],
    out: ['Make consistent monthly income', 'Copy my trades in Telegram'], req: ['A trading account'],
    s: [['The system', ['My story', 'The secret indicator', 'Join the Telegram group']]],
  },

  // ── Photography & Video ──
  {
    by: 'li', cat: 'Photography & Video', title: 'Smartphone Photography Made Simple', price: 0, level: 'BEGINNER',
    sub: 'Take stunning photos with the phone in your pocket — composition, light and editing in free apps.',
    thumb: img('photo-1502920917128-1aa500764cbd'), tags: ['photography', 'mobile', 'editing'],
    out: ['Compose striking photos', 'Use natural light well', 'Edit in Snapseed and Lightroom Mobile'],
    req: ['Any smartphone'],
    s: [
      ['Shooting', ['Composition rules that work', 'Working with light', 'Portrait mode tips']],
      ['Editing', ['A simple editing workflow', 'Colour grading basics']],
    ],
  },
  {
    by: 'li', cat: 'Photography & Video', title: 'Video Editing with DaVinci Resolve', price: 59.99, sale: 11.99, level: 'BEGINNER',
    sub: 'Edit, colour grade and export professional videos with the free version of DaVinci Resolve.',
    thumb: img('photo-1516035069371-29a1b244cc32'), tags: ['video editing', 'davinci resolve', 'color grading'],
    out: ['Edit efficiently on the cut and edit pages', 'Colour grade like a pro', 'Mix audio cleanly', 'Export for YouTube and Instagram'],
    req: ['DaVinci Resolve (free)'],
    s: [
      ['Editing', ['Project setup', 'The cut page', 'Trimming and transitions']],
      ['Colour', ['Colour correction', 'Creative looks']],
      ['Finishing', ['Audio with Fairlight', 'Titles', 'Exporting']],
    ],
  },
  {
    by: 'li', cat: 'Photography & Video', title: 'Documentary Storytelling', price: 49.99, level: 'INTERMEDIATE', status: 'PENDING',
    sub: 'Find, shoot and shape true stories into short documentaries.',
    thumb: img('photo-1485846234645-a62644f84728'), tags: ['documentary', 'filmmaking'],
    out: ['Find stories', 'Interview people'], req: ['A camera'],
    s: [['Story', ['Finding a story', 'Interviewing']]],
  },

  // ── Personal Development ──
  {
    by: 'karthik', cat: 'Personal Development', title: 'Productivity & Time Management for Busy Professionals', price: 0, level: 'ALL_LEVELS',
    sub: 'Plan your week, protect deep work and stop living in your inbox — systems that take 20 minutes a week.',
    thumb: img('photo-1484480974693-6ca0a78fb36b'), tags: ['productivity', 'time management', 'habits'],
    out: ['Run a weekly review', 'Prioritise with confidence', 'Protect focus time', 'Build habits that stick'],
    req: ['None'],
    s: [
      ['Systems', ['The weekly review', 'Prioritisation frameworks']],
      ['Focus', ['Deep work blocks', 'Taming email and Slack']],
      ['Habits', ['Habit stacking', 'Tracking without obsessing']],
    ],
  },
  {
    by: 'ananya', cat: 'Personal Development', title: 'Public Speaking & Presentation Skills', price: 39.99, sale: 9.99, level: 'BEGINNER',
    sub: 'Speak with confidence in meetings, interviews and on stage — structure, slides and handling nerves.',
    thumb: img('photo-1507925921958-8a62f3d1a50d'), tags: ['public speaking', 'presentation', 'communication'],
    out: ['Structure any talk in 15 minutes', 'Design simple, clear slides', 'Manage nerves', 'Handle tough questions'],
    req: ['None'],
    s: [
      ['Structure', ['Know your audience', 'The three-part talk']],
      ['Delivery', ['Voice and body language', 'Handling nerves', 'Q&A without panic']],
    ],
  },
  {
    by: 'alex', cat: 'Design', title: 'Canva Masterclass for Small Businesses', price: 19.99, sale: 9.99, level: 'BEGINNER', status: 'REJECTED',
    rejectReason: 'Audio is very low in sections 2 and 3, and three lectures have no video yet. Please fix and resubmit.',
    sub: 'Create posts, flyers and brand kits in Canva.', thumb: img('photo-1558655146-9f40138edfeb'), tags: ['canva'],
    out: ['Design social posts', 'Create a brand kit'], req: ['Free Canva account'],
    s: [['Basics', ['Canva tour', 'Brand kits', 'Templates']]],
  },
];

const REVIEW_TEXT = {
  5: [
    'Hands down the best course I’ve taken online. Every section builds on the last and the projects are genuinely useful.',
    'I landed an internship two months after finishing this. The interview questions they asked were straight out of section 4.',
    'Clear, practical and no fluff. The instructor answers Q&A within a day, which made a huge difference.',
    'I’ve bought five courses on this topic and this is the only one I actually finished. Pacing is perfect.',
    'Explains the “why” behind everything instead of just typing code. Worth ten times the price.',
    'Updated for 2026 — nothing outdated, which is rare. The capstone project is now on my CV.',
    'My manager noticed the difference in my reports within a week. Very practical.',
    'Loved the real-world examples from Indian companies. Felt relevant, not generic.',
  ],
  4: [
    'Very good content. A few lectures could be shorter, but overall excellent value.',
    'Great course for beginners. I wish there were a couple more exercises in the middle sections.',
    'Solid and well structured. The last section felt a bit rushed compared to the rest.',
    'Good explanations and good audio. Would love an advanced follow-up course.',
    'Helped me a lot at work. Some examples use an older version of the tool but are easy to follow.',
  ],
  3: [
    'Decent overview but I expected more depth for the price.',
    'Good for absolute beginners. If you know the basics, skip the first two sections.',
    'Content is okay, but the instructor talks quite fast in some lectures.',
  ],
  2: ['Too basic for me, and a couple of lectures repeat the same material.', 'Audio is uneven and some code didn’t match what was shown on screen.'],
  1: ['Not what was promised in the description.'],
};

const ROCKY_REVIEWS = [
  [1, 'This is a scam. The “secret system” is a moving average crossover and the rest is an ad for a paid Telegram group.'],
  [1, 'Lost $500 following his “guaranteed” calls. Nothing in the course explains risk at all.'],
  [2, 'Three short videos and then you are pushed to pay $180 for the Telegram channel. Requested a refund.'],
  [5, 'Best course!!! Rocky sir is genius. DM me for 90% accurate calls 💰💰 t.me/fastprofits_vip'],
];

const QUESTIONS = {
  default: [
    ['Can I follow along on Windows?', 'All the screenshots look like macOS — will everything work on Windows 11?', 'Yes, everything works on Windows. Where a command differs I’ve added a note in the lecture resources.'],
    ['Is this course still up to date for 2026?', null, 'Yes — I re-recorded the sections that changed in March and update the resources whenever a tool changes.'],
    ['How long does it take to finish?', 'I can study about an hour a day.', 'Most students who do an hour a day finish in 4–6 weeks, including the projects.'],
    ['Do I get a certificate at the end?', null, 'Yes — once you complete every lecture you get a certificate with a verification link you can add to LinkedIn.'],
  ],
  'Web Development': [
    ['npm install fails with ERESOLVE error', 'I get "unable to resolve dependency tree" when installing the starter project.', 'Run `npm install --legacy-peer-deps` for now — I’ve updated the starter repo so a plain install works too.'],
    ['Why use Prisma instead of writing SQL?', null, 'You can do both! Prisma gives type safety and migrations; I show raw SQL in lecture 22 for the cases where it’s clearer.'],
  ],
  'Data Science': [
    ['KeyError when merging the two DataFrames', 'Getting KeyError: "customer_id" on the merge cell.', 'One of the CSVs has a trailing space in the header. Add `df.columns = df.columns.str.strip()` after loading.'],
    ['Pandas or Polars?', 'Should I learn Polars instead?', 'Learn pandas first — it’s what employers use today. The concepts transfer to Polars in an afternoon.'],
  ],
  'IT & Cloud': [
    ['Will this lab cost me money on AWS?', null, 'If you stay in the free tier and run the cleanup script at the end of each section, it should cost nothing.'],
  ],
};

module.exports = { img, face, MP4, YT, CATEGORIES, INSTRUCTORS, STUDENTS, EXTRA_STUDENTS, STUDENT_FACES, COURSES, REVIEW_TEXT, ROCKY_REVIEWS, QUESTIONS };
