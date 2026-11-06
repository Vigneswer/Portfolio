import { profile, links, projects as originalProjects, experience as originalExperience, skills } from "../../content/profile";
const resumeFiles = import.meta.glob("/public/*.pdf", { query: "?url", import: "default", eager: true });
export const portfolio = {
  name: profile.name, shortName: "Vigneswer", title: profile.role,
  description: profile.pitch, location: profile.location, email: links.email,
  github: links.github, linkedin: links.linkedin, resumeUrl: links.resume && `/public${links.resume}` in resumeFiles ? links.resume : null,
};
// The imported mini interfaces illustrate these projects; all claims stay in the original content file.
const projectPresentation: Record<string, { category: string; focus: string; visual: string }> = {
  commerce: { category: "Online shopping", focus: "Shopping · Payments · Delivery", visual: "commerce" },
  petition: { category: "Online petitions", focus: "Petitions · Signatures · PDF records", visual: "petition" },
  malayalam: { category: "News and media", focus: "Malayalam · News · Credibility checks", visual: "news" },
  askktu: { category: "Student support", focus: "University · Study help · Chat", visual: "student" },
};
export const projects = originalProjects.map(project => ({
  slug: project.id, title: project.name,
  category: projectPresentation[project.id]?.category ?? "Project",
  focus: projectPresentation[project.id]?.focus ?? project.tech.slice(0, 2).join(" · "),
  type: project.year, className: projectPresentation[project.id]?.visual ?? "student", featured: true,
  liveUrl: project.href, repo: project.repo, description: project.blurb,
  details: [project.outcome], problem: project.problem, approach: project.approach,
  technologies: project.tech,
}));
export const experience = originalExperience.map(job => ({
  company: job.org, role: job.role === "MERN Stack Developer Intern" ? "Web Developer Intern" : job.role, dates: `${job.from} – ${job.to}`,
  description: `${job.role} · ${job.place}`, highlights: [...job.points], technologies: [] as string[],
}));
const plainSkillNames: Record<string, string> = {
  "Clean Architecture": "Organising code clearly",
  CQRS: "Keeping updates and lookups separate",
  "Saga / Outbox": "Keeping background updates reliable",
  "Multi-Tenancy": "Keeping shop data separate",
};
export const skillGroups = skills.map(group => ({
  title: group.group === "Building reliable software" ? "Reliable software" : group.group,
  description: "Tools and habits I use to build helpful software.",
  skills: group.items.map(item => plainSkillNames[item.name] ?? item.name),
}));
