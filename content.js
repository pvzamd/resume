// Single source of truth for resume copy, shared by v1, v3 and v4.
// Markup: **strong**, [[hyperlink]] (reuses the link already in that paragraph).

const C = {
  name: 'Parvez Ahmed',
  // Kept short so it sits on one line in every layout (v3's header runs ~20pt).
  // The framework keywords live in Profile and Skills, so ATS coverage is intact.
  title: 'Senior Software Engineer | Frontend',

  contact: {
    email: 'amdpvz@gmail.com',
    phone: '+91 97065 19278',
    location: 'Bengaluru, Karnataka',
    linkedin: 'linkedin.com/in/amdpvz',
    github: 'github.com/pvzamd',
  },

  // hyperlink targets, reused from the existing versions
  links: {
    'linkedin.com/in/amdpvz': 'https://www.linkedin.com/in/amdpvz/',
    'github.com/pvzamd': 'https://github.com/pvzamd',
    'amdpvz@gmail.com': 'mailto:amdpvz@gmail.com',
    'Alice Blue Financial Services': 'https://aliceblueonline.com/',
    'Rise': 'https://rise.aliceblueonline.com/',
    'Corporate Website': 'https://aliceblueonline.com/',
    'TradeSchool': 'https://tradeschool.aliceblueonline.com/',
    'Software AG': 'https://www.softwareag.com/en/',
    'CrowInfo': 'https://www.crowinfo.com/',
    'pnl-heatmap': 'https://www.npmjs.com/package/pnl-heatmap',
    'Dual-Hangman Game': 'https://github.com/pvzamd/dual-hangman',
  },

  profile:
    'Senior Software Engineer with nearly 5 years building web applications across fintech and enterprise platforms. ' +
    "Lead development of Alice Blue's Next.js corporate website and TradeSchool, owning architecture, code review and releases. " +
    'Strong in Vue 3, React and Next.js with Node.js backends, and focused on measurable gains in performance, SEO and reliability.',

  jobs: [
    {
      company: 'Alice Blue Financial Services',
      role: 'Senior Software Engineer',
      dates: 'Feb 2025 – Present',
      suffix: '',
      bullets: [
        // slot with 1 hyperlink (Rise)
        "Top contributor (37% of commits) to [[Rise]], Alice Blue's **Vue 3** mutual-fund platform: built the IPO, goal-investing and ELSS flows, moved payments to **BSE StarMF 2.0**, and replaced ~140 ad-hoc API calls with a shared service layer.",
        // slot with 2 hyperlinks (Corporate Website, TradeSchool)
        'Lead development of the [[Corporate Website]] and [[TradeSchool]] in **Next.js**: own the architecture, code review (~400 PRs merged) and production releases, and mentor junior developers.',
        'Redesigning TradeSchool hands-on (11 pages in **Next.js 16** and **Tailwind 4**) and designed its next-phase architecture for content, login and payments.',
        'Built SEO-first stock and IPO sections (**7,000+** pages with TradingView charts) and cut Google-reported 404s by **92%** (34.5k to 2.7k) with nginx redirect maps and sitemap fixes.',
        'Improved INP: removed Material UI, deferred third-party tags (main-thread busy **343 to 18 ms/s**), built real-user INP attribution, and cut a brokerage-calculator tap from **~4 s to under 0.2 s**.',
        'Designed and shipped the internal Performance Management System solo (**Next.js**, **Prisma/MySQL**, **AWS EC2**), automating monthly reviews, weighted scoring and email notifications for 83 employees.',
        'Shipped an embeddable **Vue 3** support-chat library for the vendor-maintained ANT trading app (9 languages, 170 test assertions), a **Node.js** LeadSquared CRM sync job, and Outlook-safe email templates on **AWS S3**.',
      ],
    },
    {
      company: 'Software AG',
      role: 'Software Engineer',
      dates: 'Feb 2022 – Apr 2024',
      suffix: ' (acquired by IBM)',
      bullets: [
        'Refactored legacy **webMethods** code to **ES6+** and removed heavy dependencies like Lodash, cutting workflow execution time by **40%**, webhook startup by **75%** and API transaction costs by **15%**.',
        'Developed **Node.js** plugins and automation scripts for real-time data processing on webMethods.',
        'Built Webex Teams integration bots with interactive Microsoft Adaptive Cards.',
        'Migrated **AppHub** from class-based to functional **React** components.',
      ],
    },
    {
      company: 'CrowInfo',
      role: 'Web Developer (Internship)',
      dates: 'Feb 2021 – Feb 2022',
      suffix: '',
      bullets: [
        'Built client web apps in e-commerce, automotive, education and logistics using **HTML**, **CSS**, **JavaScript** and **Vue.js**.',
      ],
    },
  ],

  projects: [
    '[[pnl-heatmap]] (npm package): Zero-dependency JavaScript library that renders GitHub-style daily P&L calendars, with ESM/UMD builds and CDN delivery.',
    '[[Dual-Hangman Game]]: Full-stack **Node.js** and **React** app deployed on **AWS EC2** with NGINX and PM2; built with AI-assisted development (Claude Code, Antigravity IDE).',
  ],

  // label / value pairs — 9 rows, matching the slots available in v1's sidebar
  skills: [
    ['Frontend', 'Vue.js 3 (Composition API), React, Next.js (App Router), Pinia, TradingView'],
    ['Languages', 'JavaScript (ES6+), TypeScript'],
    ['Backend', 'Node.js, Express, Prisma ORM, cron jobs'],
    ['Integration', 'REST APIs, OAuth, Webhooks, WordPress, LeadSquared'],
    ['Databases', 'MySQL, MongoDB'],
    ['UI & Styling', 'HTML5, CSS3, Tailwind CSS, SASS/SCSS, Material UI, Vuetify, Bootstrap'],
    ['Cloud & DevOps', 'AWS EC2/S3, NGINX, PM2, Docker, GitHub Actions'],
    ['Testing & Tools', 'Vitest, Git, GitHub, Postman, Figma'],
    ['Practices', 'Technical SEO, Core Web Vitals, a11y, Code review, Mentoring'],
  ],

  education: [
    {
      degree: 'Master of Computer Application (MCA)',
      short: 'Master of Computer Application',
      school: 'Tezpur University (Central), Assam',
      years: '2018 – 2021',
      score: 'CGPA 8.04',
    },
    {
      degree: 'Bachelor of Computer Application (BCA)',
      short: 'Bachelor of Computer Application',
      school: 'Gauhati University, Assam',
      years: '2015 – 2018',
      score: 'CGPA 7.3',
    },
    {
      degree: 'Diploma in Civil Engineering',
      short: 'Diploma in Civil Engineering',
      school: 'Assam Engineering Institute, Assam',
      years: '2010 – 2014',
      score: '66.86%',
    },
  ],
};

module.exports = C;
