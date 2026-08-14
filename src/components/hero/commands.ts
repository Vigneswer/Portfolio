import {
  about,
  education,
  experience,
  links,
  profile,
  projects,
  skills,
} from "../../content/profile";
import { ARCADE } from "../game/registry";

export type Line = {
  id: number;
  kind: "input" | "out" | "dim" | "signal" | "error" | "rule";
  text: string;
  href?: string;
};

export type CommandContext = {
  /** Scroll the page to a section id. */
  goto: (section: string) => void;
  clear: () => void;
  /** Easter egg: flips the accent colour site-wide. */
  invert: () => void;
};

type Handler = (args: string[], ctx: CommandContext) => Omit<Line, "id">[];

const out = (text = ""): Omit<Line, "id"> => ({ kind: "out", text });
const dim = (text: string): Omit<Line, "id"> => ({ kind: "dim", text });
const sig = (text: string): Omit<Line, "id"> => ({ kind: "signal", text });
const err = (text: string): Omit<Line, "id"> => ({ kind: "error", text });
const link = (text: string, href: string): Omit<Line, "id">[] =>
  href.includes("TODO") ? [dim(`${text}  · not set yet`)] : [{ kind: "out", text, href }];

/** Commands hidden from `help` — for people who poke around. */
const HIDDEN = new Set(["sudo", "signal", "rm", "exit", "vim"]);

export const COMMANDS: Record<
  string,
  { desc: string; run: Handler }
> = {
  help: {
    desc: "list what this thing understands",
    run: () => [
      dim("available:"),
      ...Object.entries(COMMANDS)
        .filter(([name]) => !HIDDEN.has(name))
        .map(([name, c]) => out(`  ${name.padEnd(11)}${c.desc}`)),
      dim(""),
      dim("tab completes · ↑ ↓ walks history · a few commands aren't listed"),
    ],
  },

  whoami: {
    desc: "the short version",
    run: () => [
      sig(profile.name),
      out(`${profile.role} · ${profile.experience}`),
      out(profile.pitch),
      dim(profile.location),
    ],
  },

  about: {
    desc: "the longer version",
    run: (_a, ctx) => {
      ctx.goto("about");
      return [...about.lines.map((l) => out(l)), dim("→ scrolled to /about")];
    },
  },

  ls: {
    desc: "list projects",
    run: () => [
      dim(`${projects.length} projects`),
      ...projects.map((p) => out(`  ${p.index}  ${p.name.padEnd(32)} ${p.year}`)),
      dim("open <id> for the case study"),
    ],
  },

  open: {
    desc: "open a project — open 01",
    run: (args, ctx) => {
      const key = (args[0] ?? "").toLowerCase();
      if (!key) return [err("open what? try `ls` first.")];
      const p = projects.find(
        (x) => x.index === key.padStart(2, "0") || x.id === key || x.name.toLowerCase() === key,
      );
      if (!p) return [err(`no project "${key}". \`ls\` lists them.`)];
      ctx.goto(`project-${p.id}`);
      return [
        sig(`${p.index} · ${p.name}`),
        out(p.blurb),
        dim(`problem   ${p.problem}`),
        dim(`approach  ${p.approach}`),
        dim(`outcome   ${p.outcome}`),
        dim(`stack     ${p.tech.join(" · ")}`),
        dim("→ scrolled to the case study"),
      ];
    },
  },

  skills: {
    desc: "what I actually know",
    run: (_a, ctx) => {
      ctx.goto("skills");
      const rows = skills.flatMap((g) => [
        dim(g.group.toLowerCase()),
        ...g.items.map((s) => {
          const filled = Math.round(s.weight * 12);
          return out(`  ${"▓".repeat(filled)}${"░".repeat(12 - filled)}  ${s.name}`);
        }),
      ]);
      return [...rows, dim("→ scrolled to /skills")];
    },
  },

  experience: {
    desc: "where I've worked",
    run: (_a, ctx) => {
      ctx.goto("experience");
      return [
        ...experience.flatMap((e) => [
          sig(`${e.role} · ${e.org}`),
          dim(`${e.from} — ${e.to} · ${e.place}`),
          ...e.points.map((p) => out(`  · ${p}`)),
          out(""),
        ]),
        dim("→ scrolled to /experience"),
      ];
    },
  },

  education: {
    desc: "the paper trail",
    run: () => [
      sig(education.degree),
      out(education.school),
      dim(`${education.from} — ${education.to}`),
      out(""),
      dim("certifications"),
      ...education.certifications.map((c) => out(`  · ${c}`)),
    ],
  },

  contact: {
    desc: "get in touch",
    run: (_a, ctx) => {
      ctx.goto("contact");
      return [
        ...link(`email     ${links.email}`, `mailto:${links.email}`),
        ...link(`github    ${links.github}`, links.github),
        ...link(`linkedin  ${links.linkedin}`, links.linkedin),
        dim("→ scrolled to /contact"),
      ];
    },
  },

  resume: {
    desc: "the pdf",
    run: () =>
      links.resume
        ? link(`resume    ${links.resume}`, links.resume)
        : [dim("no resume posted — `contact` me and I'll send it over.")],
  },

  play: {
    desc: "the arcade — every project, playable",
    run: (args) => {
      // The arcade overlay is owned by <App> and lazy-loaded; a window event
      // keeps the terminal free of any dependency on it.
      const key = (args[0] ?? "").toLowerCase();
      const game = ARCADE.find(
        (g) => g.id === key || g.index === key.padStart(2, "0") || g.name.toLowerCase() === key,
      );
      window.dispatchEvent(
        new CustomEvent("vg:play", { detail: { game: game?.id ?? "menu" } }),
      );
      if (game) {
        return [sig(game.name), out(`${game.tagline}. good luck.`), dim("esc backs out")];
      }
      return [
        dim("opening the arcade —"),
        ...ARCADE.map((g) => out(`  ${g.index}  ${g.name.padEnd(16)} ${g.tagline}`)),
        dim("play <01|02|03> jumps straight in"),
      ];
    },
  },

  clear: {
    desc: "wipe the scroll",
    run: (_a, ctx) => {
      ctx.clear();
      return [];
    },
  },

  /* ------------------------------ easter eggs ------------------------------ */

  sudo: {
    desc: "hidden",
    run: (args) => [
      err(`${profile.handle} is not in the sudoers file.`),
      dim(args.length ? "this incident has been reported." : "nice try."),
    ],
  },

  signal: {
    desc: "hidden",
    run: (_a, ctx) => {
      ctx.invert();
      return [sig("signal rerouted."), dim("run it again to put it back.")];
    },
  },

  vim: {
    desc: "hidden",
    run: () => [err("you're already trapped. try `help`.")],
  },

  rm: {
    desc: "hidden",
    run: (args) =>
      args.join(" ").includes("rf")
        ? [err("absolutely not."), dim("this portfolio took a while.")]
        : [err("rm: refusing to remove anything from a website.")],
  },

  exit: {
    desc: "hidden",
    run: () => [dim("there is no exit. there is only scroll.")],
  },
};

export function runCommand(raw: string, ctx: CommandContext): Omit<Line, "id">[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const [name, ...args] = trimmed.split(/\s+/);
  const cmd = COMMANDS[name.toLowerCase()];

  if (!cmd) {
    const guess = Object.keys(COMMANDS).find(
      (c) => !HIDDEN.has(c) && c.startsWith(name.slice(0, 2).toLowerCase()),
    );
    return [
      err(`${name}: command not found`),
      dim(guess ? `did you mean \`${guess}\`? or try \`help\`.` : "try `help`."),
    ];
  }

  return cmd.run(args, ctx);
}

export function complete(partial: string): string | null {
  const p = partial.trim().toLowerCase();
  if (!p || p.includes(" ")) return null;
  const matches = Object.keys(COMMANDS).filter(
    (c) => !HIDDEN.has(c) && c.startsWith(p),
  );
  return matches.length === 1 ? matches[0] : null;
}

/** Shown on load — the site introduces itself, then hands over the keyboard. */
export const BOOT: Omit<Line, "id">[] = [
  dim(`${profile.handle}@portfolio — interactive resume, v1`),
  dim("type `help`, or click a command below."),
];

export const QUICK_COMMANDS = [
  "whoami",
  "ls",
  "experience",
  "skills",
  "contact",
  "play",
  "help",
];
