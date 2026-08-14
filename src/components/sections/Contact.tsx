import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { links, profile } from "../../content/profile";
import { useMagnetic } from "../../hooks/useMagnetic";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { Section } from "../ui/Section";

const CHANNELS = [
  { label: "email", value: links.email, href: `mailto:${links.email}` },
  { label: "github", value: "github.com/Vigneswer", href: links.github },
  { label: "linkedin", value: "linkedin.com/in/vigneswer-v", href: links.linkedin },
] as const;

function Channel({ label, value, href }: (typeof CHANNELS)[number]) {
  const ref = useMagnetic<HTMLAnchorElement>(0.18, 60);

  return (
    <a
      ref={ref}
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noreferrer"
      data-cursor-label={label === "email" ? "say hello" : "visit"}
      className="group flex items-baseline justify-between gap-6 border-b border-ink/15 py-5 transition-colors hover:border-ink"
    >
      <span className="type-label text-ink-faint transition-colors group-hover:text-ink">
        {label}
      </span>
      <span className="type-display-tight overflow-hidden text-[clamp(1rem,2.6vw,1.6rem)] text-ink">
        {/* Two stacked copies: the top slides out as the signal copy slides in. */}
        <span className="relative block">
          <span className="block transition-transform duration-[400ms] ease-[var(--ease-snap)] group-hover:-translate-y-full">
            {value}
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 block translate-y-full px-1 transition-transform duration-[400ms] ease-[var(--ease-snap)] group-hover:translate-y-0"
            style={{ backgroundColor: "var(--signal)" }}
          >
            {value}
          </span>
        </span>
      </span>
    </a>
  );
}

/**
 * Copy-to-clipboard with the site's one bit of celebration: the button label
 * flips to a confirmation that springs in, then reverts itself. No form, no
 * backend, no friction — the lowest-effort path to actually being contacted.
 */
function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const reduced = usePrefersReducedMotion();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.email);
    } catch {
      // Clipboard blocked (insecure context, permissions) — the mailto link
      // beside this button still works, so fail quietly rather than alarm.
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1900);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="relative overflow-hidden border border-ink px-6 py-3.5 text-ink transition-colors hover:bg-[var(--signal)]"
    >
      <span className="type-label relative block">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? "done" : "idle"}
            initial={reduced ? { opacity: 0 } : { y: 14, opacity: 0, rotate: -6 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={reduced ? { opacity: 0 } : { y: -14, opacity: 0, rotate: 6 }}
            transition={{ duration: reduced ? 0.01 : 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            className="block"
          >
            {copied ? "copied — now write it ✦" : "copy email"}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}

/**
 * Replaces the old spinning seal — decoration that answered nothing. This is
 * a small status instrument instead: availability, a live clock in my
 * timezone so a caller can see whether I'm awake, and what to expect after
 * writing. Same information a good out-of-office gives, permanently on.
 */
function StatusPanel() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  const awake = hour >= 8 && hour < 24;

  return (
    <div className="w-full max-w-sm justify-self-center lg:justify-self-end">
      <div className="border border-ink bg-paper shadow-[5px_5px_0_0_var(--color-ink)]">
        <p className="type-label flex items-center justify-between border-b border-ink/15 px-4 py-2.5 text-ink-faint">
          status
          <span className="text-ink-soft">{profile.location}</span>
        </p>

        <div className="space-y-4 px-4 py-4">
          <p className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="relative inline-flex h-2.5 w-2.5 shrink-0"
            >
              <span
                className="absolute inset-0 rounded-full motion-safe:animate-[ping-out_2.6s_cubic-bezier(0,0,0.2,1)_infinite]"
                style={{ backgroundColor: "var(--signal)" }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "var(--signal)" }}
              />
            </span>
            <span className="type-display-tight text-lg leading-none text-ink">
              open to work
            </span>
          </p>

          <div className="flex items-baseline justify-between border-t border-ink/10 pt-4">
            <span className="type-label text-ink-faint">my local time</span>
            <span className="font-mono text-[1.05rem] tabular-nums text-ink">
              {time}
              <span className="type-label ml-2 text-ink-faint">IST</span>
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="type-label text-ink-faint">right now</span>
            <span className="type-label text-ink-soft">
              {awake ? "probably at the keyboard" : "asleep — mail lands on top"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="type-label text-ink-faint">replies</span>
            <span className="type-label text-ink-soft">usually within a day</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  return (
    <Section id="contact" index="05" title="Contact" kicker="no forms, no funnels">
      <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="type-body mb-10 max-w-md text-[clamp(1rem,1.8vw,1.25rem)] text-ink-soft">
            Building something where the backend has to be correct and the front
            end has to be quiet about it? That's the work I want.
          </p>

          <div className="mb-10">
            {CHANNELS.map((c) => (
              <Channel key={c.label} {...c} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <CopyEmail />
            <a
              href={`mailto:${links.email}`}
              className="type-label border border-ink/25 px-6 py-3.5 text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              open mail ↗
            </a>
            {links.resume && (
              <a
                href={links.resume}
                target="_blank"
                rel="noreferrer"
                className="type-label border border-ink/25 px-6 py-3.5 text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                resume ↗
              </a>
            )}
          </div>
        </div>

        <StatusPanel />
      </div>
    </Section>
  );
}
