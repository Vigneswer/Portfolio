import { GraduationCap, Sparkles } from "lucide-react";
import { education } from "../../../content/profile";
import { experience } from "../../lib/portfolio";
import { Character } from "./character";
import { DepthScene } from "./depth-scene";

export function ExperienceSection() {
  return <>
    <section className="experience-section section-space" id="experience" aria-labelledby="experience-title">
      <div className="experience-intro"><p className="section-label">Along the way</p><h2 id="experience-title">Building things.<br />Growing with them.</h2><p>Teams, products, and all the lessons in between.</p><DepthScene className="experience-stage"><div className="experience-slab depth-surface"><span>Make it useful.</span><strong>Make it happen.</strong></div><Character pose="standing" className="standing-character" sizes="240px" /></DepthScene></div>
      <div className="experience-timeline">{experience.map((job, index) => <article className="experience-entry" key={job.company}><span className={`timeline-dot ${index === 0 ? "current" : ""}`} /><div className="experience-meta"><span>{job.dates}</span>{index === 0 && <span className="current-badge">Currently here</span>}</div><h3>{job.company}</h3><p className="job-role">{job.role}</p><p>{job.description}</p><ul>{job.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul><div className="tool-pills">{job.technologies.map(technology => <span key={technology}>{technology}</span>)}</div><details className="experience-more"><summary>Role highlights and tools</summary><ul>{job.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul><div className="tool-pills">{job.technologies.map(technology => <span key={technology}>{technology}</span>)}</div></details></article>)}</div>
    </section>
    <section className="beyond-section section-space" aria-labelledby="beyond-title">
      <div className="section-heading"><div><p className="section-label">Beyond the desk</p><h2 id="beyond-title">Always learning.<br />Finding new ideas.</h2></div><p className="heading-description">I enjoy learning new skills and putting them to use.</p></div>
      <div className="beyond-grid"><article className="education-card"><GraduationCap size={24} /><div><h3>A foundation to build on.</h3><p>{education.degree}</p><span>{education.school}<br />{education.from} – {education.to}</span></div><Character pose="backpack" className="education-character" sizes="160px" /></article>
      <article className="community-card"><div className="community-copy"><Sparkles size={23} /><h3>Courses & certificates</h3><p>A few things I’ve learned along the way.</p>{education.certifications.map(item => <p key={item} className="community-other">{item}</p>)}</div><Character pose="celebrate" className="community-character" sizes="(max-width: 600px) 38vw, 200px" /></article></div>
    </section>
  </>;
}
