/* ===========================================================================
   THE ONLY FILE YOU NEED TO EDIT.
   Every string the site renders comes from here — hero, terminal commands,
   case studies, skills, contact. Change a value, the whole page follows.

   Populated from Vigneswer_V.pdf. Anything you'd phrase differently in your
   own voice, change here — especially the `about` lines and the `outcome`
   fields, which are the two places recruiters actually slow down and read.
   =========================================================================== */

export const profile = {
  /** Shown huge in the hero, set in expanded display type. */
  name: "Vigneswer V",
  /** Terminal prompt + logo mark. lowercase. */
  handle: "vigneswer",
  role: "Full-stack Engineer",
  /** Rendered inline in the hero and in `whoami`. */
  experience: "shipping production since 2025",
  /** The pitch. One line, under ~90 characters reads best. */
  pitch:
    "I build commerce systems where the architecture is as considered as the interface.",
  location: "Kochi, Kerala · IN",
} as const;

export const links = {
  email: "vigneswervigneswer2003@gmail.com",
  github: "https://github.com/Vigneswer",
  linkedin: "https://linkedin.com/in/vigneswer-v",
  /** Served from /public — the terminal `resume` command and the contact
      button both read this. */
  resume: "/Vigneswer_V.pdf" as string | null,
} as const;

/* --------------------------------------------------------------------------
   ABOUT — each line reveals as its own beat, so they're written as beats
   rather than a paragraph.
   -------------------------------------------------------------------------- */
export const about = {
  lines: [
    "I work at the seam between the two halves people usually split: the payment webhook that must never double-charge, and the checkout screen that must never make you think.",
    "Most of my year has gone into multi-tenant commerce — Clean Architecture, CQRS, saga and outbox patterns on the backend, Next.js and a shared component library on the front. I like systems where correctness is provable and the UI hides all of it.",
    "Before that I was training multimodal models to catch fake news in Malayalam, which is a fancy way of saying I'll follow an interesting problem well outside my job description.",
  ],
  notes: [
    { k: "based", v: "Kochi, Kerala" },
    { k: "currently", v: "Multi-tenant commerce at Druvino Systems" },
    { k: "obsessed with", v: "Idempotency — webhooks that survive being replayed" },
    { k: "studied", v: "B.Tech IT, GEC Idukki" },
  ],
} as const;

/* --------------------------------------------------------------------------
   PROJECTS — these become the physics cards and the case-study panels.
   -------------------------------------------------------------------------- */
export type Project = {
  id: string;
  index: string;
  name: string;
  year: string;
  /** One line, shown on the card face. */
  blurb: string;
  problem: string;
  approach: string;
  outcome: string;
  tech: string[];
  href: string | null;
  repo: string | null;
};

export const projects: Project[] = [
  {
    id: "commerce",
    index: "01",
    name: "Druvino Commerce",
    year: "2026",
    blurb: "Multi-tenant e-commerce platform, checkout to returns.",
    problem:
      "One codebase had to serve many tenants while handling real money — where a duplicated webhook or a lost order event isn't a bug, it's a refund dispute.",
    approach:
      "A modular monolith on Clean Architecture with CQRS and MediatR. Razorpay integration with signature verification and idempotent event handling, saga and outbox patterns for order state, plus a hierarchical return-policy engine and per-item shipment tracking. Frontend in Next.js and TypeScript against a shared component library.",
    outcome:
      "Guest and authenticated checkout, OTP onboarding with JWT, payments, refunds, shipment tracking and returns running in production across tenants.",
    tech: [".NET 10", "ASP.NET Core", "PostgreSQL", "Next.js", "TypeScript", "Razorpay"],
    href: null,
    repo: null,
  },
  {
    id: "malayalam",
    index: "02",
    name: "Fake News Detection · Malayalam",
    year: "2025",
    blurb: "Multimodal misinformation detection for a low-resource language.",
    problem:
      "Malayalam misinformation spreads as image-and-caption pairs, and the models that catch it in English simply don't exist for it.",
    approach:
      "Combined MuRIL for Malayalam text with CLIP and BLIP for the image side, so a claim and its picture are judged together rather than separately. Layered real-time verification through the Gemini and Exa APIs, and shipped it as both a web app and a browser extension so it meets people where they actually read the news.",
    outcome:
      "Working end-to-end multimodal pipeline with a browser extension that flags claims in place, on a language most tooling ignores.",
    tech: ["React", "FastAPI", "Python", "MongoDB", "MuRIL", "CLIP"],
    href: null,
    repo: null,
  },
  {
    id: "askktu",
    index: "03",
    name: "Ask KTU",
    year: "2024",
    blurb: "RAG chatbot that actually knows the university's own rules.",
    problem:
      "KTU's regulations live scattered across PDFs and notice boards, so students ask each other and get confidently wrong answers.",
    approach:
      "Retrieval-augmented generation over the real documents: chunked and embedded into Supabase vector storage, semantic search on top, LangChain orchestrating retrieval and persistent chat history so answers stay grounded in a source rather than improvised.",
    outcome:
      "Students get answers cited from actual university documents, with conversations that persist across sessions.",
    tech: ["React", "LangChain", "OpenAI API", "Supabase", "Vector Search"],
    href: null,
    repo: null,
  },
];

/* --------------------------------------------------------------------------
   EXPERIENCE — rendered as the scroll-driven timeline in the next pass.
   -------------------------------------------------------------------------- */
export const experience = [
  {
    role: "Software Engineer",
    org: "Druvino Systems",
    place: "Kochi, Kerala",
    from: "Jan 2026",
    to: "Present",
    points: [
      "Built checkout, guest checkout and OTP onboarding with JWT authentication.",
      "Integrated Razorpay end to end: webhook handling, signature verification, refunds, idempotent event handling.",
      "Designed a hierarchical return-policy engine and per-item shipment tracking driven by order events.",
      "Applied Clean Architecture, CQRS, DDD, saga and outbox patterns across a multi-tenant modular monolith.",
    ],
  },
  {
    role: "MERN Stack Developer Intern",
    org: "Luminar Technolab",
    place: "Kochi, Kerala",
    from: "Jun 2025",
    to: "Dec 2025",
    points: [
      "Built full-stack applications with React, Node, Express and MongoDB, integrating REST APIs and deploying to cloud platforms.",
    ],
  },
] as const;

export const education = {
  degree: "B.Tech, Information Technology",
  school: "Government Engineering College, Idukki",
  from: "Dec 2021",
  to: "Apr 2025",
  certifications: [
    "React — Codecademy",
    "Python Internship — River Tech IT Solutions",
    "UI/UX Workshop — Eldii",
  ],
} as const;

/* --------------------------------------------------------------------------
   SKILLS — `weight` (0–1) drives visual emphasis. Use it honestly:
   1 = you'd defend it in a technical interview.
   -------------------------------------------------------------------------- */
export const skills = [
  {
    group: "Frontend",
    items: [
      { name: "React", weight: 0.95 },
      { name: "TypeScript", weight: 0.9 },
      { name: "Next.js", weight: 0.85 },
      { name: "Tailwind CSS", weight: 0.85 },
    ],
  },
  {
    group: "Backend",
    items: [
      { name: "ASP.NET Core / C#", weight: 0.9 },
      { name: "PostgreSQL", weight: 0.8 },
      { name: "EF Core / MediatR", weight: 0.8 },
      { name: "Node.js / Express", weight: 0.7 },
    ],
  },
  {
    group: "Architecture",
    items: [
      { name: "Clean Architecture", weight: 0.9 },
      { name: "CQRS", weight: 0.85 },
      { name: "Saga / Outbox", weight: 0.8 },
      { name: "Multi-Tenancy", weight: 0.8 },
    ],
  },
] as const;
