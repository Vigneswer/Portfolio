
import { ArrowDown, ArrowUpRight, Braces, Check, Download, Smartphone, Sparkles } from "lucide-react";
import { useCoarsePointer, useReducedMotion } from "../../hooks/use-motion";
import { portfolio } from "../../lib/portfolio";
import { Character } from "./character";
import { DepthScene } from "./depth-scene";

export function Hero() {
  const reducedMotion = useReducedMotion();
  const coarsePointer = useCoarsePointer();

  return <section id="main" className="studio-hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="hello-line"><span className="status-dot" /> Based in Kochi, Kerala</p>
      <h1 id="hero-title"><span className="hero-greeting">Hi, I’m</span><span>{portfolio.name}.</span></h1>
      <p className="hero-role">{portfolio.title}</p>
      <p className="hero-description">{portfolio.description}</p>
      <div className="hero-actions">
        <a className="primary-button" href="#work">Explore my work <ArrowUpRight size={17} /></a>
        {portfolio.resumeUrl && <a className="text-button" href={portfolio.resumeUrl} download><Download size={16} /> Resume</a>}
      </div>
      <div className="hero-current"><span className="current-mark"><Braces size={19} /></span><div><span className="current-label">Currently at</span><strong>Druvino Systems</strong></div></div>
    </div>
    <div className="hero-visual">
      <DepthScene className="hero-workspace" motion={!reducedMotion && !coarsePointer}>
        <div className="hero-floor depth-surface" />
        <div className="hero-word depth-surface"><span className="engraved-word">build.</span><span className="surface-caption">A little idea. A whole lot of possibility.</span></div>
        <div className="code-window depth-surface">
          <div className="window-toolbar"><span className="window-dots"><i /><i /><i /></span><span>the next idea</span><Braces size={13} /></div>
          <div className="code-content"><span className="code-soft">const</span> idea = <span className="code-blue">curiosity</span>;<br /><br /><span className="code-blue">build</span>({"{"}<br /><span className="code-indent">care: <span className="code-green">true</span>,</span><br /><span className="code-indent">possibilities: <span className="code-soft">∞</span></span><br />{"}"});</div>
        </div>
        <div className="mini-device depth-surface"><div className="device-camera" /><Smartphone size={24} /><strong>For every day.</strong><span>Simple tools.<br />Wherever you are.</span><div className="device-lines"><i /><i /><i /></div></div>
        <div className="ai-chip depth-surface"><Sparkles size={20} /><span>AI with<br /><strong>purpose.</strong></span></div>
        <Character pose="wave" className="hero-character" sizes="(max-width: 680px) 197px, (max-width: 900px) 188px, (max-width: 1150px) 220px, 244px" eager />
        <div className="hello-chip depth-surface"><Check size={14} /> Hello, world.</div>
      </DepthScene>
    </div>
    <div className="hero-bottom"><span>A little curiosity. A lot of building.</span><a href="#work" aria-label="Scroll to selected work"><ArrowDown size={16} /></a></div>
  </section>;
}
