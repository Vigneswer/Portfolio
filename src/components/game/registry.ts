/**
 * The arcade's card catalogue. Deliberately tiny and dependency-free so UI
 * that only needs names and ids (Work section, terminal, case studies) never
 * pulls actual game code into its chunk.
 */
export type GameId = "commerce" | "flagged" | "grounded";

export type ArcadeGame = {
  id: GameId;
  name: string;
  tagline: string;
  /** Plain words, no jargon — what you actually do in the game. */
  desc: string;
  /** Which project this game is the playable version of. */
  projectId: string;
  index: string;
};

export const ARCADE: ArcadeGame[] = [
  {
    id: "commerce",
    name: "DOUBLE‑CHARGE",
    tagline: "you are the idempotency layer",
    desc: "Payment receipts fall from the top. Tap each one exactly once — tap a repeat and a customer gets charged twice.",
    projectId: "commerce",
    index: "01",
  },
  
  {
    id: "flagged",
    name: "FLAGGED",
    tagline: "tap the lie, not just the post",
    desc: "News posts with photos — some carry one lie. Don't just call it fake: tap the exact detail that's lying. Wrong accusation costs you too.",
    projectId: "malayalam",
    index: "02",
  },
  {
    id: "grounded",
    name: "GROUNDED",
    tagline: "you are the retrieval layer",
    desc: "A chatbot answers student questions. Approve only the answers backed by a real document — reject the made-up ones.",
    projectId: "askktu",
    index: "03",
  },
];

export const gameForProject = (projectId: string): ArcadeGame | undefined =>
  ARCADE.find((g) => g.projectId === projectId);

/** Open the arcade. No id (or "menu") lands on the game-select screen. */
export const openGame = (game?: GameId | "menu") =>
  window.dispatchEvent(
    new CustomEvent("vg:play", { detail: { game: game ?? "menu" } }),
  );
