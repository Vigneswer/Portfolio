import { useEffect } from "react";
import { Providers } from "./components/providers";
import Home from "./home";
import ProjectPage from "./project";
import { NotFound } from "./not-found";
import { portfolio, projects } from "./lib/portfolio";
import "./studio.css";
export default function Studio() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const slug = path.startsWith("/projects/") ? path.slice(10) : null;
  const project = projects.find(item => item.slug === slug);
  useEffect(() => {
    document.title = project ? `${project.title} | ${portfolio.name}` : `${portfolio.name} — ${portfolio.title}`;
    const scrollToHash = () => {
      const hash = window.location.hash.slice(1);
      const id = ({ top: "main", projects: "work", skills: "skills" } as Record<string, string>)[hash] ?? hash;
      if (id) document.getElementById(id)?.scrollIntoView();
    };
    const frame = requestAnimationFrame(scrollToHash);
    window.addEventListener("hashchange", scrollToHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", scrollToHash); };
  }, [project]);
  return <Providers>{path === "/" ? <Home /> : slug ? <ProjectPage slug={slug} /> : <NotFound />}</Providers>;
}
