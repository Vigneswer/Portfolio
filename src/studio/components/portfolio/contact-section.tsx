import { ArrowUpRight, Download, Mail } from "lucide-react";
import { portfolio } from "../../lib/portfolio";
import { Character } from "./character";
import { DepthScene } from "./depth-scene";

export function ContactSection() {
  return <section id="contact" className="contact-section section-space" aria-labelledby="contact-title"><div className="contact-copy"><p className="section-label">Let’s make something</p><h2 id="contact-title">Have a little idea?<br />I’d love to hear it.</h2><p>Have a project or a good question? Drop me a note.</p><a className="primary-button" href={`mailto:${portfolio.email}`}><Mail size={17} /> Say hello <ArrowUpRight size={17} /></a><a className="contact-email" href={`mailto:${portfolio.email}`}>{portfolio.email}</a><div className="contact-links"><a href={portfolio.github} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={14} /></a><a href={portfolio.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14} /></a>{portfolio.resumeUrl && <a href={portfolio.resumeUrl} download>Resume <Download size={14} /></a>}</div></div><DepthScene className="contact-stage"><div className="contact-slab depth-surface"><span className="engraved-word">hello.</span></div><div className="envelope depth-surface"><Mail size={27} /><span>A good conversation<br />starts here.</span></div><Character pose="welcome" className="contact-character" sizes="(max-width: 600px) 80vw, 350px" /></DepthScene></section>;
}
