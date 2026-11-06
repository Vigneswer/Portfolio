import { Image } from "../primitives";

const poses = {
  wave: "01-hello-wave", thumbsUp: "02-thumbs-up", standing: "03-stand-casual",
  point: "04-point", celebrate: "05-celebrate", sitting: "06-sit-relaxed",
  laptop: "07-with-laptop", coffee: "08-with-coffee", backpack: "09-with-backpack", welcome: "10-open-arms",
} as const;

export function Character({ pose, className = "", sizes = "(max-width: 600px) 50vw, 280px", eager = false }: {
  pose: keyof typeof poses; className?: string; sizes?: string; eager?: boolean;
}) {
  return <Image src={`/studio/characters/${poses[pose]}.png`} alt="" width={1024} height={1536}
    sizes={sizes} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined}
    className={`character-image ${className}`} data-pose={pose} draggable={false} />;
}
