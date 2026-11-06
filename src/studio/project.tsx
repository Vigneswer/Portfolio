import { Link } from "./components/primitives";
import { ArrowUpRight, Check } from "lucide-react";
import { projects } from "./lib/portfolio";
import { Navigation } from "./components/portfolio/navigation";
import { Footer } from "./components/portfolio/footer";
import { NotFound } from "./not-found";
export default function ProjectPage({ slug }: { slug: string }) {
  const project = projects.find(project => project.slug === slug);
  if (!project) return <NotFound />;
  return <main className="portfolio"><Navigation home /><article className="case-study rounded-panel"><Link href="/#work" className="outline-button">Back to selected work</Link><div className="case-intro"><span className="section-label">{project.category}</span><h1>{project.title}</h1><p>{project.description}</p><div className="tool-pills">{project.technologies.map(technology => <span key={technology}>{technology}</span>)}</div></div><div className="case-columns"><section><h2>The idea</h2><p>{project.problem}</p></section><section><h2>How I built it</h2><p>{project.approach}</p></section></div><section className="case-details"><h2>What it does</h2>{project.details.map(detail => <p key={detail}><Check size={18} />{detail}</p>)}</section>{project.liveUrl && <a className="primary-button" href={project.liveUrl} target="_blank" rel="noopener noreferrer">Visit {project.title} <ArrowUpRight size={17} /></a>}</article><Footer /></main>;
}
