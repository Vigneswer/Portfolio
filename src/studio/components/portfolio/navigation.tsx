import { Link } from "../primitives";
import { Asterisk, BriefcaseBusiness, House, Layers3, Mail, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "../providers";
import { useSyncExternalStore } from "react";
import { MascotRunner } from "./mascot-runner";
import { portfolio } from "../../lib/portfolio";
const subscribe = () => () => {};
export function Navigation({ home = false, appMode = false }: { home?: boolean; appMode?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  const prefix = home ? "/" : "";
  const links = appMode
    ? [
        { label: "Home", href: `${prefix}#main`, Icon: House },
        { label: "Work", href: `${prefix}#work`, Icon: Layers3 },
        { label: "About", href: `${prefix}#about`, Icon: UserRound },
        { label: "Experience", href: `${prefix}#experience`, Icon: BriefcaseBusiness, className: "nav-experience" },
        { label: "Contact", href: `${prefix}#contact`, Icon: Mail },
      ]
    : [
        { label: "Work", href: `${prefix}#work`, Icon: Layers3 },
        { label: "About", href: `${prefix}#about`, Icon: UserRound },
        { label: "Experience", href: `${prefix}#experience`, Icon: BriefcaseBusiness, className: "nav-experience" },
        { label: "Let’s talk", href: `${prefix}#contact`, Icon: Mail },
      ];

  return <header className={`navigation${appMode ? " navigation-app" : ""}`}>
    <Link className="brand" href="/" aria-label={`${portfolio.name} home`}><Asterisk size={28} strokeWidth={2.3} /><span>{portfolio.shortName.toLowerCase()}<span className="brand-dot">.</span></span></Link>
    <nav aria-label="Main navigation">{links.map(({ label, href, Icon, className }) => <Link key={label} href={href} className={className} aria-label={label} title={label}><Icon className="nav-icon" size={18} aria-hidden="true" /><span>{label}</span></Link>)}</nav>
    {appMode && <MascotRunner />}
    <button className="theme-button" disabled={!mounted} onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
  </header>;
}
