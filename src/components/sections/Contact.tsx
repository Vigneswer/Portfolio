import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { links, profile } from "../../content/profile";
import { useMagnetic } from "../../hooks/useMagnetic";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { Section } from "../ui/Section";
import { SpinSeal } from "../ui/SpinSeal";

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

        <div className="flex items-start justify-center lg:justify-end">
          <SpinSeal
            text={`${profile.location} · SAY HELLO`}
            size={190}
            factor={-0.13}
            className="text-ink"
          >
            <span className="type-display-tight text-center text-sm leading-tight text-ink">
              open
              <br />
              to work
            </span>
          </SpinSeal>
        </div>
      </div>
    </Section>
  );
}
