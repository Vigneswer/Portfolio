import { Link } from "../primitives";
import { Asterisk } from "lucide-react";
import { portfolio } from "../../lib/portfolio";
export function Footer() {
  return <footer className="footer"><Link href="/" className="brand"><Asterisk size={22} />{portfolio.shortName.toLowerCase()}.</Link><p>Made with care, and a little curiosity. <a href="/classic">Original portfolio ↗</a></p><span>© {new Date().getFullYear()} {portfolio.name}</span></footer>;
}
