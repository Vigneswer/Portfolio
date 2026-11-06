import { portfolio, projects, experience, skillGroups } from "../portfolio";
/** Deterministic answers from public data; no model, credentials, or API requests. */
export function portfolioReply(message: string): string {
  const text = message.toLowerCase();
  const project = projects.find(item => text.includes(item.slug) || text.includes(item.title.toLowerCase()));
  if (project) return `${project.title}: ${project.description} ${project.approach}`;
  if (/contact|email|hire|reach|linkedin|github/.test(text)) return `Email ${portfolio.email}. GitHub: ${portfolio.github}. LinkedIn: ${portfolio.linkedin}.`;
  if (/skill|stack|technolog|tool/.test(text)) return skillGroups.map(group => `${group.title}: ${group.skills.join(", ")}.`).join(" ");
  if (/experience|job|work|building|druvino/.test(text)) return experience.map(job => `${job.role} at ${job.company} (${job.dates}). ${job.highlights[0]}`).join(" ");
  if (/project|built|build/.test(text)) return `Explore ${projects.map(project => project.title).join(", ")}. Ask about a project by name for more detail.`;
  if (/hello|hi\b|who|about|name|where/.test(text)) return `${portfolio.name} — ${portfolio.title}, based in ${portfolio.location}. ${portfolio.description}`;
  return "I’m a local guide using the public portfolio, so I can answer about projects, skills, experience, or contact details. Try asking about the Petition Platform, Druvino Commerce, or Ask KTU.";
}
