import { Link } from "../primitives";
import { ArrowUpRight, Check, FileText, Layers, ScanText, Sparkles, FileSearch, PenLine } from "lucide-react";
import { projects } from "../../lib/portfolio";
import { Character } from "./character";
import { DepthScene } from "./depth-scene";

function ProjectVisual({ kind }: { kind: string }) {
  return <DepthScene className={`project-stage ${kind}-stage`}>
    {kind === "student" && <>
      <div className="product-floor depth-surface" />
      <div className="student-phone depth-surface"><div className="device-camera" /><div className="product-brand"><FileSearch size={17} /> Ask KTU</div><span className="screen-label">Grounded in sources.</span><strong className="phone-title">University rules,<br />within reach.</strong><div className="expense-chart"><i /><i /><i /><i /><i /></div><div className="import-notice"><Check size={12} /> Source retrieved</div><div className="phone-expenses"><span>Answers with context</span><span><i /> University documents</span><span><i /> Persistent conversations</span></div></div>
      <Character pose="laptop" className="project-character" sizes="(max-width: 600px) 42vw, 210px" />
      <div className="product-chip depth-surface"><Sparkles size={13} /> A little help from AI</div>
    </>}
    {kind === "petition" && <>
      <div className="document-back depth-surface" />
      <div className="document-front depth-surface"><div className="document-header"><PenLine size={17} /><span>Petition</span><span>OPEN</span></div><strong>Make a change.<br />Add your name.</strong><div className="document-lines"><i /><i /><i /><i /></div><div className="document-highlight">Signatures, kept together.</div><div className="document-lines short"><i /><i /></div></div>
      <div className="ocr-chip depth-surface"><FileText size={19} /><span>One clear<br /><strong>record.</strong></span></div>
      <div className="summary-chip depth-surface"><Check size={14} /> Ready to share</div>
    </>}
    {kind === "news" && <>
      <div className="document-back depth-surface" />
      <div className="document-front depth-surface"><div className="document-header"><FileText size={17} /><span>Malayalam</span><span>AI</span></div><strong>Text and images.<br />Checked together.</strong><div className="document-lines"><i /><i /><i /><i /></div><div className="document-highlight">See what the story says.</div><div className="document-lines short"><i /><i /></div></div>
      <div className="ocr-chip depth-surface"><ScanText size={19} /><span>Text. Image.<br /><strong>Verify.</strong></span></div>
      <div className="summary-chip depth-surface"><Sparkles size={14} /> Text, image, and link</div>
    </>}
    {kind === "commerce" && <>
      <div className="commerce-back depth-surface"><Layers size={16} /> A little clarity.</div>
      <div className="commerce-board depth-surface"><div className="document-header"><Layers size={17} /><span>Druvino</span><Sparkles size={14} /></div><strong>Reliable commerce<br />starts here.</strong><div className="plan-task"><span className="task-check"><Check size={10} /></span> Verify payment signatures</div><div className="plan-task"><span className="task-circle" /> Keep each payment accurate</div><div className="plan-task"><span className="task-circle" /> Track orders and returns</div><div className="plan-footer">Checkout. Pay. Track.</div></div>
      <div className="review-chip depth-surface"><Sparkles size={15} /><span>Order events,<br /><strong>in sync.</strong></span></div>
    </>}
  </DepthScene>;
}

export function ProjectGrid() {
  return <section className="work-section section-space" id="work" aria-labelledby="work-title">
    <div className="section-heading work-heading"><div><p className="section-label">Selected work</p><h2 id="work-title">Useful ideas,<br />brought to life.</h2></div><div className="work-introduction"><p>From easier shopping and petitions to tools for students. Here are a few things I’ve built.</p><Character pose="point" className="heading-character" sizes="130px" /></div></div>
    <div className="projects-grid">{projects.filter(project => project.featured).map(project => <Link className={`project-card ${project.className}`} key={project.slug} href={`/projects/${project.slug}`}>
      <ProjectVisual kind={project.className} />
      <div className="project-caption"><div><span className="project-category">{project.category}</span><h3>{project.title} <span>{project.type}</span></h3><p>{project.description}</p><div className="project-tech">{project.focus}</div></div><span className="project-open"><ArrowUpRight size={20} /></span></div>
    </Link>)}</div>
    {projects.some(project => !project.featured) && <div className="other-work"><h3>And a few more rabbit holes.</h3><div>{projects.filter(project => !project.featured).map(project => <Link key={project.slug} href={`/projects/${project.slug}`}><span>{project.title}<small>{project.type}</small></span><ArrowUpRight size={18} /></Link>)}</div></div>}
  </section>;
}
