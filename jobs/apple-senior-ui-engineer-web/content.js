// One-off resume for Apple, Senior UI Engineer - Web (role 200690650-0321).
// Build (v2 only, into this folder):  node build.js --job jobs/apple-senior-ui-engineer-web
//
// Starts from the generic resume and overrides only what was tailored to this role:
// title, summary, experience bullets, skills and the document keywords. Contact
// details, links, projects and education still come from the generic content.js.
const base = require('../../content');

module.exports = {
  ...base,

  title: 'Senior Software Engineer | Frontend & Web UI',

  keywords: 'UI Engineer, Frontend Engineer, React, Next.js, Vue.js, TypeScript, Accessibility, Core Web Vitals, Design Systems',

  profile:
    'Senior Software Engineer with nearly 5 years building large-scale, consumer-facing web applications in fintech and enterprise. ' +
    "Lead development of Alice Blue's Next.js website and TradeSchool, owning architecture, code review and releases. " +
    'Strong in React, Next.js, Vue 3 and TypeScript; focused on pixel-perfect, accessible UI and Core Web Vitals; works daily with AI tools (Claude Code).',

  jobs: [
    {
      ...base.jobs[0],
      bullets: [
        'Lead development of the [[Corporate Website]] and [[TradeSchool]] in **Next.js** and **React**: own the architecture, code review (~400 PRs merged) and production releases, and mentor junior developers.',
        "Delivered the website's 2026 redesign page by page and am redesigning TradeSchool from **Figma** (11 pages, **Tailwind 4**) on a shared component set; replaced **Material UI** with in-house components matched to its computed styles.",
        'Improved Core Web Vitals: deferred third-party tags (main-thread busy **343 to 18 ms/s**), fixed mobile CLS (~0.11 to 0), cut preloaded fonts from **653 to 150 KB**, built real-user INP attribution, and cut a calculator tap from **~4 s to under 0.2 s**.',
        'Built a library-free accessibility menu (text scaling, contrast modes, dyslexia-friendly font, read-aloud, reduced motion) and accessible forms with **ARIA** error states and focus management.',
        "Top contributor (37% of commits) to [[Rise]], Alice Blue's **Vue 3** mutual-fund platform: built the IPO, goal-investing and ELSS flows, moved payments to **BSE StarMF 2.0**, and replaced ~140 ad-hoc API calls with a shared service layer.",
        'Shipped an embeddable **Vue 3** support-chat library for a vendor-maintained trading app: scoped styles, no global state, 9 languages, bundle cut from **765 to 228 kB**, and 170 test assertions run against the built package.',
        'Built SEO-first stock and IPO sections (**7,000+** pages with **TradingView** charts on a custom datafeed) and cut Google-reported 404s by **92%** (34.5k to 2.7k).',
      ],
    },
    {
      ...base.jobs[1],
      bullets: [
        'Refactored legacy **webMethods** code to **ES6+** and removed heavy dependencies like Lodash, cutting workflow execution time by **40%**, webhook startup by **75%** and API transaction costs by **15%**.',
        "Modernized **AppHub**'s **React** UI, migrating class-based components to functional components and hooks.",
        'Built Webex Teams bots with interactive Microsoft Adaptive Cards, plus **Node.js** plugins and automation scripts for real-time data processing on webMethods.',
      ],
    },
    base.jobs[2],
  ],

  skills: [
    ['Frontend', 'React, Next.js (App Router), Vue.js 3 (Composition API), Pinia, Tailwind CSS, Responsive design'],
    ['Languages', 'JavaScript (ES6+), TypeScript, Semantic HTML5, CSS3'],
    ['UI & Design', 'Component libraries, Design systems, Figma, CSS Modules, SASS/SCSS, Bootstrap, Vuetify, Material UI'],
    ['Performance', 'Core Web Vitals (LCP, CLS, INP), web-vitals RUM, Chrome DevTools profiling, Lazy loading, Caching'],
    ['Accessibility', 'WCAG, WAI-ARIA, Keyboard and focus management, Reduced motion, Text scaling'],
    ['Backend & APIs', 'Node.js, Express, REST APIs, OAuth, Webhooks, Prisma ORM, MySQL, MongoDB'],
    ['CMS & Data viz', 'Headless WordPress, TradingView Charting Library, ApexCharts, Highcharts, SVG charts'],
    ['Build & Testing', 'Vite, Vitest, Headless Chrome (DevTools Protocol), Git, GitHub Actions, CI/CD'],
    ['Cloud & AI tools', 'AWS EC2/S3, NGINX, PM2, Docker; Claude Code, Antigravity IDE (AI-assisted development)'],
  ],
};
