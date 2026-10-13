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
    'Senior Software Engineer with nearly 5 years modernizing web applications across fintech and enterprise platforms. ' +
    'Experienced in rebuilding production systems end to end, pairing Vue 3, React, and Next.js interfaces with Node.js API layers, ' +
    'and shipping them through evolving APIs, backend migrations, and third-party integrations. ' +
    'Focused on clean architecture, measurable performance gains, and reliable releases.',

  jobs: [
    {
      company: 'Alice Blue Financial Services',
      role: 'Senior Software Engineer',
      dates: 'Feb 2025 – Present',
      suffix: '',
      bullets: [
        // slot with 1 hyperlink (Rise)
        "Re-architected and rebuilt [[Rise]], Alice Blue's investment platform, in **Vue 3** (Composition API), owning investment and payment workflows end to end and integrating BSE 2.0 APIs.",
        // slot with 2 hyperlinks (Corporate Website, TradeSchool)
        'Building the [[Corporate Website]] and [[TradeSchool]] in **Next.js**, with SEO-optimized routing, faster page loads, and an accessibility-first component architecture.',
        'Kept production releases seamless through continuously evolving APIs and a full backend migration from **Java to Go**.',
        'Maintain **Node.js** API layers that proxy external requests, enforce controlled access, and handle third-party integrations.',
        'Refactored the Partner Dashboard and eKYC platforms onto shared, reusable patterns, cutting duplicated logic and speeding up feature work.',
        'Own release coordination, deployment setup, cron scheduling, and cloud storage integration; cover critical flows with **Vitest** unit tests and ship responsive transactional email templates.',
      ],
    },
    {
      company: 'Software AG',
      role: 'Software Engineer',
      dates: 'Feb 2022 – Apr 2024',
      suffix: ' (acquired by IBM)',
      bullets: [
        'Refactored the legacy **webMethods** codebase to **ES6+** and removed heavy dependencies such as Lodash, cutting workflow execution time by **40%**, webhook startup by **75%**, and API transaction costs by **15%**.',
        'Developed **Node.js** plugins and automation scripts for real-time data processing and service integration on the webMethods platform.',
        'Built and maintained multi-platform integration bots for Webex Teams, driving interactive workflows with Microsoft Adaptive Cards.',
        'Migrated **AppHub** from class-based to functional **React** components, improving OAuth integration and service configuration.',
        'Integrated third-party SaaS platforms over REST APIs and webhooks to power bot-driven workflows.',
      ],
    },
    {
      company: 'CrowInfo',
      role: 'Web Developer (Internship)',
      dates: 'Feb 2021 – Feb 2022',
      suffix: '',
      bullets: [
        'Built and maintained client web applications across e-commerce, automotive, education, logistics, and services using **HTML**, **CSS**, **JavaScript**, jQuery, and **Vue.js**.',
      ],
    },
  ],

  projects: [
    '[[pnl-heatmap]] (npm package): Reusable GitHub-style heatmap component for visualizing time-series financial performance data, published to npm and drop-in across frontend applications.',
    '[[Dual-Hangman Game]]: Full-stack **Node.js** and **React** app deployed on **AWS EC2** with NGINX, PM2, and Linux administration; built with AI-assisted development (Claude Code, Antigravity IDE).',
  ],

  // label / value pairs — 9 rows, matching the slots available in v1's sidebar
  skills: [
    ['Frontend', 'Vue.js 3 (Composition API), React, Next.js, Pinia, TradingView Charting Library'],
    ['Languages', 'JavaScript (ES6+), TypeScript'],
    ['Backend', 'Node.js, Express, API proxy layers'],
    ['Integration', 'REST APIs, Axios / Fetch, OAuth, Webhooks'],
    ['Databases', 'MySQL, MongoDB'],
    ['UI & Styling', 'HTML5, CSS3, Tailwind CSS, SASS/SCSS, Material UI, Vuetify, Bootstrap'],
    ['Cloud & DevOps', 'AWS EC2, Docker, NGINX, Linux, PM2, SSH'],
    ['Testing & Tools', 'Vitest, Git, GitHub, Postman, Figma'],
    ['Practices', 'Responsive design, Accessibility (a11y), Clean architecture, Agile'],
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
