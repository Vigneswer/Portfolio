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
  role: "Full-stack Developer",
  /** Rendered inline in the hero and in `whoami`. */
  experience: "building useful software since 2025",
  /** The pitch. One line, under ~90 characters reads best. */
  pitch:
    "I build helpful websites and apps that make everyday tasks easier.",
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
    "I enjoy turning tricky problems into software people can use. At work, I build online shopping tools — from checkout and payments to delivery and returns.",
    "I like making the behind-the-scenes work feel simple: payments go through once, orders stay on track, and each shop sees its own information.",
    "I have also built projects that check Malayalam news and help students find answers in university documents.",
  ],
  notes: [
    { k: "based", v: "Kochi, Kerala" },
    { k: "currently", v: "Building online shopping tools at Druvino Systems" },
    { k: "care about", v: "Reliable payments and clear, easy-to-use websites" },
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
    blurb: "An online shopping platform, from checkout and payment to delivery and returns.",
    problem:
      "Many shops use the same platform, so orders and payments need to stay accurate while each shop sees only its own information.",
    approach:
      "Built the shopping website and the services behind it. Shoppers can check out as guests or sign in, pay securely, request refunds, follow deliveries, and return items. Shops can manage their own products and orders, while background services keep payment updates and notifications in sync.",
    outcome:
      "People can shop, pay, track deliveries, and request returns. The platform is running for multiple businesses.",
    tech: [".NET 10", "ASP.NET Core", "PostgreSQL", "Next.js", "TypeScript", "Razorpay"],
    href: null,
    repo: null,
  },
  {
    id: "petition",
    index: "02",
    name: "Petition Platform",
    year: "Oct 2026 – Present",
    blurb: "A simple way to publish petitions, collect signatures, and review support.",
    problem:
      "Organisers need an easy way to publish petitions and keep every signature safe and organised.",
    approach:
      "Built a public website where people can find petitions and preview their PDFs, plus a private workspace for organisers. Organisers can write drafts, publish petitions, review signatures, and close a petition. People create protected accounts and can sign each petition once. When a petition closes, the platform creates a final PDF with signatures in order.",
    outcome:
      "Organisers can manage a petition from draft to close, and download a clear record of its signatures.",
    tech: ["ASP.NET Core", "PostgreSQL", "React", "Next.js", "TypeScript", "PDF generation"],
    href: null,
    repo: null,
  },
  {
    id: "malayalam",
    index: "03",
    name: "Malayalam News Checker",
    year: "2024 – 2025",
    blurb: "Checks Malayalam news stories and explains how trustworthy they seem.",
    problem:
      "A news story can combine text, images, and links. Readers need a way to check all of it in Malayalam.",
    approach:
      "Built a website and browser extension that check a story's words, pictures, and links together. Each check gives a clear score and explains the clues behind it, using Malayalam language tools, image checks, and trusted web sources.",
    outcome:
      "Readers can check a story and see an easy-to-understand credibility score in the website or browser extension.",
    tech: ["React", "FastAPI", "Python", "MongoDB", "MuRIL", "CLIP"],
    href: null,
    repo: null,
  },
  {
    id: "askktu",
    index: "04",
    name: "Ask KTU",
    year: "2024",
    blurb: "A chatbot that answers student questions using official KTU documents.",
    problem:
      "Students need clear answers about courses, regulations, and credits, but the information is spread across many university documents.",
    approach:
      "Built a chat service that searches official university PDFs before answering. Students can sign in and return to earlier conversations.",
    outcome:
      "Students can get answers based on official KTU documents and pick up earlier chats later.",
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
      "Added guest checkout, sign-in, and account setup with a one-time code.",
      "Connected the shop to Razorpay so customers can pay and request refunds securely.",
      "Created clear return rules and shipment tracking for each item in an order.",
      "Built one shopping platform for several businesses, keeping each shop's information separate.",
    ],
  },
  {
    role: "MERN Stack Developer Intern",
    org: "Luminar Technolab",
    place: "Kochi, Kerala",
    from: "Jun 2025",
    to: "Dec 2025",
    points: [
      "Built websites and apps with React, Node.js, and MongoDB, and helped prepare them for release.",
    ],
  },
] as const;

export const education = {
  degree: "B.Tech, Information Technology",
  school: "Government Engineering College, Idukki",
  from: "Dec 2021",
  to: "Apr 2025",
  certifications: [
    "React — HackerRank",
    "React — Codecademy",
    "AI Tools and Claude Workshop — be10x",
    "GitHub Foundations — Coursera",
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
    group: "Building reliable software",
    items: [
      { name: "Clean Architecture", weight: 0.9 },
      { name: "CQRS", weight: 0.85 },
      { name: "Saga / Outbox", weight: 0.8 },
      { name: "Multi-Tenancy", weight: 0.8 },
    ],
  },
] as const;
