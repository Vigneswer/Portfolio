# Portfolio integration analysis and plan

Source reviewed: a separate Next.js/Vercel portfolio on its source branch. A separate local source copy was not used as the integration target. The initial worktree already lacked `public/Vigneswer_V.pdf`; do not replace it with someone else's résumé.

## Frameworks and dependencies

| Area | Current | Source | Resolution |
| --- | --- | --- | --- |
| Runtime/build | Vite ^8.2.0 (installed 8.2.1), static Worker | Next 16.3.4, Vercel, optional static export | Preserve Vite and static Worker |
| React / DOM | ^19.2.8 | 19.2.6 | Preserve current |
| TypeScript | ~6.0.2 | 5.9.3 | Preserve current strict unused-import checks |
| Tailwind | ^4.3.3 via Vite | 4.2.1 via PostCSS | Preserve Vite plugin; isolate imported CSS |
| Motion | Framer Motion ^13, GSAP ^3.15, Matter ^0.20 | CSS transforms, pointer parallax, canvas sprite animation | Keep existing dependencies and import active CSS/canvas motion |
| Fonts | Archivo Variable, JetBrains Mono | System Avenir/Segoe/Helvetica, local VT323 | Preserve classic fonts, namespace imported pixel font |
| Icons | Existing SVG assets | lucide-react ^1.31.0 | Add only lucide-react 1.31.0 |
| Theme | Light | next-themes ^0.4.6 | Small local React theme provider, distinct storage key |
| Archived WebGL | None | three ^0.180, fiber ^9.8.1, drei ^10.7.7, @types/three | Not imported by any active source page; omit archived implementation/assets |
| Unused UI kit | None | radix-ui ^1.6.7, cva 0.7.1, clsx 2.1.1, tailwind-merge 3.6.0, tw-animate-css ^1.4 | Active components use plain CSS; omit unused kit/dependencies |
| Tooling | oxlint ^1.75, Wrangler ^4.125, Vite React ^6, existing types | ESLint 9.39.4, eslint-config-next 16.3.4, Node types 22 | Preserve current tools/types/scripts |

## Structures and active functionality

Current: `src/main.tsx` mounts `src/App.tsx`; content lives in `src/content/profile.ts`. Components cover opening, terminal hero, about, experience, projects with physics/case studies, skills, contact/copy email, cursor and grain. `src/components/game/` provides the three existing games (Double Charge, Judge, Flagged). Hooks implement scroll/reveal, tilt, magnetism, media queries and reduced motion. Static images/SVGs are in `public/`; `scripts/` generates design plates.

Source: `app/page.tsx` composes desktop-window navigation/sidebar, hero, project grid, about/toolkit, experience/education/community, contact and footer. `app/projects/[slug]/page.tsx` has eight data-driven case studies. `app/not-found.tsx` handles unknown pages. `components/portfolio/` contains these sections, Character, DepthScene and MascotRunner. The active depth effect is CSS, not WebGL. `hooks/use-motion.ts` manages pointer parallax, reduced motion, visibility and touch capabilities. `components/companion/` provides a focus-managed portal, handheld controls, sprite renderer, Checkout Sprint, Order Dash (Checkout Sprint variant) and Project Trail. `lib/companion/` contains sprite atlas logic and server chat contracts, validation, knowledge and OpenRouter integration. `components/three/` and the model-generation scripts are archived. `components/ui/` is an unused Radix UI kit.

Active assets: ten transparent character poses; three generated sprite atlases; local VT323 font and license. Source public also contains unused GLBs, portrait, alternative sprites, run-frame experiments, HTML previews and the friend's résumé. Copy only active assets into `public/studio/`; preserve current favicon, Open Graph images and other public assets.

## Deployment invariants and conflicts

- Leave `.git`, remotes, history, `.wrangler`, `wrangler.jsonc`, `vite.config.ts`, all TypeScript config, deploy/build scripts, existing dependencies and environment files untouched.
- `wrangler.jsonc` names `portfolio`, serves `./dist`, and uses SPA fallback. A browser pathname dispatcher supports project pages without changing deployment routing or adding Next infrastructure.
- Do not copy source Next/Vercel config, workflows, npmrc, nvmrc, lockfile, scripts or environment settings.
- Next Link/Image/dynamic and app metadata cannot run in Vite: use ordinary anchors/images, React lazy/Suspense, existing index metadata, and a project title effect.
- Both sites define global classes, root tokens and resets, including conflicting `--ink`, hero classes and typography. Load each design's CSS only in its selected page bundle; use full-document navigation between classic and studio. Scope imported theme to the studio page.
- Preserve current identity, project facts, employment, skills, contact, résumé URL and SEO. Adapt imported layouts to current data; do not claim the friend's work or community achievements. Imported characters are decorative design assets.
- Source theme key becomes a separate `portfolio-studio-theme`; no existing browser settings are overwritten.
- Source API `/api/companion/chat` calls OpenRouter using server-only `OPENROUTER_API_KEY`, optional `COMPANION_CHAT_MODEL`. Its retired transcribe route returns 410. The current static deployment cannot execute these routes. Provide a labeled deterministic local portfolio guide with no network calls/secrets rather than change the deployment. AI chat is not enabled; no API environment variables are copied or exposed.
- Source fixed app viewport/internal scrolling must coexist with hash navigation and mobile layouts. Verify navigation, direct project URLs, theme, keyboard focus, games and mobile overflow.
- Source PixelPose requires type-only import under current TypeScript settings; remove obsolete client directives/Next-specific imports.

## Incremental implementation plan (recorded before application changes)

1. Baseline build and repository-state inventory. Direct TypeScript/Vite commands already pass; npm currently reports macOS Keychain `SecItemCopyMatching -50` and is being investigated independently.
2. Add isolated studio feature, active component designs, data adapters, React primitives, namespaced images/font and pathname dispatch. Keep `App.tsx` and all existing functionality accessible at `/classic`. Build.
3. Port lazy-loaded handheld arcade, sprite animation and games; personalize project facts and local guide. Build and lint.
4. Run development and production preview, check home, project deep links, unknown paths, classic, mobile, theme, reduced motion, contact and assets. Verify protected configuration/Git state. Record changes, commands and limitations.

No deployment or Git push is part of this work.

## Completed implementation

- `/` uses the imported window/sidebar design with Vigneswer's existing content. `/projects/commerce`, `/projects/petition`, `/projects/malayalam`, and `/projects/askktu` show full case studies from the existing project data. Unknown paths render an in-app not-found page (the static SPA host still responds HTTP 200).
- `/classic` renders the unchanged original App, including terminal, opening animations, cursor, physics cards, copy-email and original arcade. Its global CSS is dynamically loaded separately from studio CSS. A full-page link in the studio footer opens it.
- Active character poses, CSS depth/parallax, theme, pixel animations, portal transition, handheld controls, Checkout Sprint, Order Dash and Project Trail are integrated. The project-trail game uses Vigneswer's project facts. Source-project claims, employment and community achievements are not attributed to Vigneswer.
- The local companion guide is explicitly labeled, deterministic, and makes no network requests. OpenRouter server routes and secrets were not imported, because enabling them requires changing the static deployment architecture.
- `lucide-react` is pinned at `1.31.0`; package-lock updated by npm. No existing dependency versions or package scripts changed. No Next, Three, theme, Radix or PostCSS packages were added.
- No deployment/configuration/environment/Git changes. Current SEO metadata, favicon and Open Graph assets remain unchanged. No push or deploy performed.
- Missing résumé is detected at build time; studio download links remain hidden until the owner's original PDF exists again. Classic remains unchanged, including its pre-existing résumé link. No file was restored or substituted.
- Added responsive rules for the longer owner name and project-page navigation; old home hashes `#top`, `#projects` and `#skills` remain usable.

## Verification

Baseline, UI stage, arcade stage, and final TypeScript/Vite production builds pass. The normal `npm run build` command also passes outside the execution sandbox. `npm run dev -- --host 127.0.0.1` starts successfully (5174 in this session, since 5173 was occupied). `npm run preview -- --host 127.0.0.1` starts successfully on 4173.

An earlier integration pass used a temporary jsdom/Vite harness for 20 DOM checks under `/tmp/portfolio-integration-qa`, with no test dependencies added to the repository: owner/project rendering, no friend-content misattribution, missing-résumé handling, theme toggle and persistence, classic link, namespaced illustrations, arcade open/background inert/close restoration, guide disclosure and answer, all three games mounting, all three project deep links, and two not-found cases. Those checks predate the copy and Petition Platform update in November 2026. Canvas rendering, animation frames, layout and media capabilities were stubbed; they do not validate visual appearance or complete gameplay.

HTTP checks passed against development (5174) and production preview (4173): six SPA routes on each server, all fifteen imported public assets served byte-for-byte, and the original production SEO metadata retained.

The existing lint command passes. Remaining Fast Refresh warnings originate in existing `src/components/game/JudgeGame.tsx` and the pre-existing untracked nested portfolio copy. Imported shared contexts explicitly document their co-located hook export.

Visual desktop/mobile review and full gameplay still need a browser: the browser host was unavailable and native computer-use permission was not granted. No browser screenshot or real rendering check is claimed. Source reduced-motion and visibility handling is retained. Cloudflare remote settings were not accessed or altered; compatibility is based on preserving the existing local static deployment contract.

Suggested manual verification:

```sh
npm ci
npm run build
npm run lint
npm run dev
# In a separate terminal, after building:
npm run preview
```

At the printed URL check home, each project URL (including direct reload), not-found, `/classic`, section links, email/social links, theme persistence, character launcher, Chat, all three games, pause/resume, keyboard focus and touch controls. Check desktop and narrow/mobile widths and enable reduced motion in system/browser settings. Restoring the résumé requires another build.

## File manifest

Modified files: `src/main.tsx`, `package.json`, `package-lock.json`, `README.md`. The pre-existing deletion of `public/Vigneswer_V.pdf` and the separate untracked source copy are not integration changes.

Added files:

- `docs/portfolio-integration.md`
- `public/studio/characters/01-hello-wave.png`
- `public/studio/characters/02-thumbs-up.png`
- `public/studio/characters/03-stand-casual.png`
- `public/studio/characters/04-point.png`
- `public/studio/characters/05-celebrate.png`
- `public/studio/characters/06-sit-relaxed.png`
- `public/studio/characters/07-with-laptop.png`
- `public/studio/characters/08-with-coffee.png`
- `public/studio/characters/09-with-backpack.png`
- `public/studio/characters/10-open-arms.png`
- `public/studio/fonts/vt323/OFL.txt`
- `public/studio/fonts/vt323/VT323-Regular.ttf`
- `public/studio/vignesh/character/vignesh-front-movement-v2.png`
- `public/studio/vignesh/character/vignesh-front-social-v2.png`
- `public/studio/vignesh/character/vignesh-motion-frames-v2.png`
- `src/Classic.tsx`
- `src/studio/components/companion/arcade-controls.module.css`
- `src/studio/components/companion/arcade-controls.tsx`
- `src/studio/components/companion/companion-panel.module.css`
- `src/studio/components/companion/companion-panel.tsx`
- `src/studio/components/companion/games/checkout-sprint/checkout-sprint.module.css`
- `src/studio/components/companion/games/checkout-sprint/checkout-sprint.tsx`
- `src/studio/components/companion/games/project-trail/project-trail.module.css`
- `src/studio/components/companion/games/project-trail/project-trail.tsx`
- `src/studio/components/companion/pixel-sprite.module.css`
- `src/studio/components/companion/pixel-sprite.tsx`
- `src/studio/components/portfolio/about-section.tsx`
- `src/studio/components/portfolio/character.tsx`
- `src/studio/components/portfolio/contact-section.tsx`
- `src/studio/components/portfolio/depth-scene.tsx`
- `src/studio/components/portfolio/experience-section.tsx`
- `src/studio/components/portfolio/footer.tsx`
- `src/studio/components/portfolio/hero.tsx`
- `src/studio/components/portfolio/mascot-runner.tsx`
- `src/studio/components/portfolio/navigation.tsx`
- `src/studio/components/portfolio/project-grid.tsx`
- `src/studio/components/primitives.tsx`
- `src/studio/components/providers.tsx`
- `src/studio/home.tsx`
- `src/studio/hooks/use-motion.ts`
- `src/studio/index.tsx`
- `src/studio/lib/companion/front-animation.ts`
- `src/studio/lib/companion/local-guide.ts`
- `src/studio/lib/companion/run-animation.ts`
- `src/studio/lib/portfolio.ts`
- `src/studio/not-found.tsx`
- `src/studio/project.tsx`
- `src/studio/studio.css`
