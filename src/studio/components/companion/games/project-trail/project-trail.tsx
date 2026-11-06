import { projects } from "../../../../lib/portfolio";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Compass, MessageCircle, Pause, Play, RotateCcw, Sparkles, X } from 'lucide-react';
import styles from './project-trail.module.css';
import { useArcadeInput } from '../../arcade-controls';
import { drawFrontSprite, FRONT_SOCIAL_ATLAS, FRONT_MOVEMENT_ATLAS } from '../../../../lib/companion/front-animation';
import { drawRunningSprite, RUN_ATLAS } from '../../../../lib/companion/run-animation';

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';
type Nearby = { kind: 'station'; id: StationId } | { kind: 'workshop' } | null;
type Conversation = { kind: 'station' | 'workshop' | 'complete'; id?: StationId; title: string; body: string };

const TILE = 24;
const MAP_WIDTH = 27;
const MAP_HEIGHT = 18;
const CANVAS_WIDTH = MAP_WIDTH * TILE;
const CANVAS_HEIGHT = MAP_HEIGHT * TILE;
const START: Point = { x: 4, y: 14 };
const WORKSHOP: Point = { x: 12, y: 9 };

const stations = [
  {
    id: 'commerce',
    name: 'Druvino',
    kind: projects[0].title,
    fact: projects[0].description,
    x: 4,
    y: 2,
    approach: { x: 5, y: 4 },
    roof: '#6999e8',
    mark: 'P',
  },
  {
    id: 'malayalam',
    name: 'News Checker',
    kind: projects[1].title,
    fact: projects[1].description,
    x: 19,
    y: 2,
    approach: { x: 20, y: 4 },
    roof: '#eab96b',
    mark: 'R',
  },
  {
    id: 'askktu',
    name: 'Ask KTU',
    kind: projects[2].title,
    fact: projects[2].description,
    x: 19,
    y: 10,
    approach: { x: 20, y: 12 },
    roof: '#75b997',
    mark: 'S',
  },
] as const;

const stationById = new Map(stations.map((station) => [station.id, station]));
type StationId = (typeof stations)[number]['id'];

function isLand(x: number, y: number) {
  if (x < 2 || x > 24 || y < 1 || y > 16) return false;
  if ((x < 4 || x > 22) && (y < 4 || y > 13)) return false;
  return true;
}

function buildPath() {
  const path = new Set<string>();
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let x = x1;
    let y = y1;
    path.add(`${x},${y}`);
    while (x !== x2 || y !== y2) {
      if (x !== x2) x += dx;
      else if (y !== y2) y += dy;
      path.add(`${x},${y}`);
    }
  };
  addLine(4, 13, 6, 13);
  addLine(6, 5, 6, 13);
  addLine(6, 5, 20, 5);
  addLine(13, 5, 13, 10);
  addLine(20, 5, 20, 13);
  addLine(6, 5, 5, 5);
  addLine(20, 5, 20, 4);
  addLine(20, 13, 20, 12);
  return path;
}

const PATH = buildPath();
const BUILDINGS = [
  { x: 4, y: 2, w: 3, h: 2 },
  { x: 19, y: 2, w: 3, h: 2 },
  { x: 19, y: 10, w: 3, h: 2 },
  { x: 11, y: 7, w: 3, h: 2 },
];
const PALMS = [
  { x: 3, y: 5 }, { x: 9, y: 3 }, { x: 16, y: 3 }, { x: 23, y: 7 },
  { x: 9, y: 11 }, { x: 16, y: 14 }, { x: 23, y: 14 }, { x: 8, y: 15 },
];

function tileHash(x: number, y: number) {
  return (x * 37 + y * 61 + x * y * 13) % 11;
}

function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number, roof: string, name: string, mark: string, time: number) {
  const left = x * TILE;
  const top = y * TILE;
  ctx.fillStyle = '#26324b44';
  ctx.fillRect(left + 4, top + 5, TILE * 3, TILE * 2);
  ctx.fillStyle = '#26324b';
  ctx.fillRect(left, top, TILE * 3, TILE * 2);
  ctx.fillStyle = '#fff9ec';
  ctx.fillRect(left + 2, top + 2, TILE * 3 - 4, TILE * 2 - 3);
  ctx.fillStyle = roof;
  ctx.fillRect(left + 3, top + 3, TILE * 3 - 6, TILE - 2);
  ctx.fillStyle = '#ffffff55';
  ctx.fillRect(left + 6, top + 5, TILE * 3 - 12, 3);
  ctx.fillStyle = '#d9a96f';
  ctx.fillRect(left + 4, top + TILE + 1, TILE * 3 - 8, TILE - 7);
  ctx.fillStyle = '#26324b';
  ctx.fillRect(left + TILE + 8, top + TILE + 3, 10, TILE - 8);
  ctx.fillStyle = '#fff9ec';
  ctx.fillRect(left + 5, top + TILE + 3, 9, 7);
  ctx.fillRect(left + TILE * 2 + 10, top + TILE + 3, 9, 7);
  ctx.fillStyle = '#669eeB';
  ctx.fillRect(left + 7, top + TILE + 5, 5, 3);
  ctx.fillRect(left + TILE * 2 + 12, top + TILE + 5, 5, 3);
  ctx.fillStyle = '#26324b';
  ctx.fillRect(left + TILE + 10, top + TILE + 13, 2, 2);
  ctx.fillStyle = '#26324b';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name, left + TILE * 1.5, top - 3);
  const pulse = Math.round(Math.sin(time / 550) * 1);
  ctx.fillStyle = '#fff9ec';
  ctx.fillRect(left + TILE * 1.5 - 6, top + 8 + pulse, 12, 12);
  ctx.fillStyle = '#26324b';
  ctx.fillText(mark, left + TILE * 1.5, top + 17 + pulse);
}

function drawWorkshop(ctx: CanvasRenderingContext2D, time: number) {
  drawHouse(ctx, 11, 7, '#465e8f', 'WORKSHOP', '✳', time);
  ctx.fillStyle = '#eab96b';
  ctx.fillRect(WORKSHOP.x * TILE + 6, (WORKSHOP.y + 1) * TILE + 2, 12, 4);
}

function drawPalm(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const sway = Math.sin(time / 650 + x) > 0 ? 1 : 0;
  const px = x * TILE;
  const py = y * TILE;
  ctx.fillStyle = '#26324b27';
  ctx.fillRect(px + 3, py + 16, 18, 5);
  ctx.fillStyle = '#9a6d50';
  ctx.fillRect(px + 10 + sway, py + 7, 4, 12);
  ctx.fillRect(px + 8, py + 15, 7, 3);
  ctx.fillStyle = '#36795f';
  ctx.fillRect(px + 4, py + 5 + sway, 7, 3);
  ctx.fillRect(px + 13, py + 4 - sway, 7, 3);
  ctx.fillRect(px + 2, py + 9 - sway, 7, 3);
  ctx.fillRect(px + 15, py + 8 + sway, 7, 3);
  ctx.fillStyle = '#75b997';
  ctx.fillRect(px + 9, py + 3, 7, 5);
  ctx.fillRect(px + 6, py + 6, 12, 3);
}

function drawDock(ctx: CanvasRenderingContext2D) {
  const x = 2 * TILE;
  const y = 14 * TILE;
  ctx.fillStyle = '#26324b';
  ctx.fillRect(x + 2, y + 4, 54, 26);
  ctx.fillStyle = '#a9784f';
  ctx.fillRect(x + 4, y + 4, 50, 21);
  for (let row = 0; row < 3; row += 1) {
    ctx.fillStyle = row % 2 ? '#c79561' : '#b78355';
    ctx.fillRect(x + 6, y + 6 + row * 6, 46, 4);
  }
  ctx.fillStyle = '#80573e';
  ctx.fillRect(x + 7, y + 25, 5, 7);
  ctx.fillRect(x + 44, y + 25, 5, 7);
}

function drawAvatar(ctx: CanvasRenderingContext2D, point: Point, direction: Direction, frame: number, animationTime: number, sheet: HTMLImageElement | null, waving: boolean, walking: boolean, runAtlas: HTMLImageElement | null, movementAtlas: HTMLImageElement | null) {
  const x = point.x * TILE + TILE / 2, bottom = point.y * TILE + TILE + 2;
  if (walking && (direction === 'left' || direction === 'right') && drawRunningSprite(ctx, runAtlas, animationTime, x, bottom, 56, direction === 'left' ? -1 : 1)) return;
  if (direction === 'up' && drawFrontSprite(ctx, movementAtlas, 'walkBack', animationTime, x, bottom, 56, !walking)) return;
  if (walking && direction === 'down' && drawFrontSprite(ctx, movementAtlas, 'walkFront', animationTime, x, bottom, 56)) return;
  if (drawFrontSprite(ctx, sheet, waving ? 'wave' : 'idle', animationTime, x, bottom, 56)) return;

  const left = point.x * TILE + 4;
  const top = point.y * TILE + 2;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(left + x, top + y, w, h);
  };
  const front = direction === 'down';
  const side = direction === 'left' || direction === 'right';
  const flip = direction === 'left';
  ctx.save();
  if (flip) {
    ctx.translate(left * 2 + 16, 0);
    ctx.scale(-1, 1);
  }
  ctx.fillStyle = '#26324b36';
  ctx.fillRect(left + 1, top + 19, 18, 4);
  // Curly silhouette and face, drawn on a shared 2-pixel grid.
  rect(3, 1, 10, 3, '#241c20');
  rect(1, 3, 14, 4, '#241c20');
  rect(2, 2, 3, 3, '#35252a');
  rect(7, 0, 4, 3, '#35252a');
  rect(12, 2, 3, 3, '#35252a');
  rect(3, 6, 10, 6, '#f1a96f');
  if (!front && !side) {
    rect(2, 5, 12, 4, '#241c20');
    rect(3, 9, 10, 3, '#35252a');
  } else {
    rect(2, 7, 2, 3, '#f1a96f');
    rect(12, 7, 2, 3, '#f1a96f');
    if (front) {
      rect(5, 8, 2, 2, '#26324b');
      rect(10, 8, 2, 2, '#26324b');
      rect(7, 10, 4, 1, '#a94e4c');
    } else {
      rect(10, 8, 2, 2, '#26324b');
      rect(11, 10, 2, 1, '#a94e4c');
    }
  }
  // Blue shirt, watch, white shorts, and shoes echo the supplied portrait.
  rect(3, 12, 10, 5, '#669eeb');
  rect(1, 12, 3, 5, '#669eeb');
  rect(12, 12, 3, 5, '#669eeb');
  rect(7, 12, 1, 5, '#d6e8ff');
  rect(4, 17, 8, 3, '#fff9ec');
  if (frame % 2 === 0) {
    rect(4, 19, 3, 3, '#fff9ec');
    rect(10, 18, 3, 4, '#fff9ec');
  } else {
    rect(3, 18, 3, 4, '#fff9ec');
    rect(11, 19, 3, 3, '#fff9ec');
  }
  rect(12, 14, 3, 2, '#5b7556');
  ctx.restore();
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  time: number,
  player: Point,
  direction: Direction,
  walkFrame: number,
  walking: boolean,
  collected: Set<string>,
  reducedMotion: boolean,
  spriteSheet: HTMLImageElement | null,
  waving: boolean,
  runAtlas: HTMLImageElement | null,
  movementAtlas: HTMLImageElement | null,
) {
  const ambientTime = reducedMotion ? 0 : time;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const left = x * TILE;
      const top = y * TILE;
      if (!isLand(x, y)) {
        ctx.fillStyle = '#77c7cf';
        ctx.fillRect(left, top, TILE, TILE);
        ctx.fillStyle = '#8bd4d8';
        if ((tileHash(x, y) + Math.floor(ambientTime / 700)) % 4 === 0) ctx.fillRect(left + Math.floor((ambientTime / 90 + x * 5) % 17), top + 5 + (tileHash(y, x) % 12), 5, 2);
        ctx.fillStyle = '#63b7c3';
        if (tileHash(x, y) % 5 === 0) ctx.fillRect(left + 2, top + 19, 6, 2);
        continue;
      }
      const beach = !isLand(x - 1, y) || !isLand(x + 1, y) || !isLand(x, y - 1) || !isLand(x, y + 1);
      if (beach) {
        ctx.fillStyle = '#f0ce93';
        ctx.fillRect(left, top, TILE, TILE);
        ctx.fillStyle = '#e5bc7d';
        if (tileHash(x, y) % 3 === 0) ctx.fillRect(left + 5, top + 8, 3, 2);
      } else if (PATH.has(`${x},${y}`)) {
        ctx.fillStyle = '#e8bc82';
        ctx.fillRect(left, top, TILE, TILE);
        ctx.fillStyle = '#d8a86e';
        ctx.fillRect(left + 4 + (tileHash(x, y) % 8), top + 4 + (tileHash(y, x) % 9), 4, 2);
        ctx.fillRect(left + 14, top + 16, 3, 2);
      } else {
        ctx.fillStyle = tileHash(x, y) % 4 === 0 ? '#82c69a' : '#8bcda0';
        ctx.fillRect(left, top, TILE, TILE);
        ctx.fillStyle = '#75b997';
        if (tileHash(x, y) % 3 === 0) ctx.fillRect(left + 4 + tileHash(y, x) % 12, top + 5 + tileHash(x + 3, y) % 13, 2, 2);
        if (tileHash(x, y) % 7 === 0) {
          ctx.fillStyle = '#f0ce93';
          ctx.fillRect(left + 15, top + 6, 2, 2);
        }
      }
    }
  }

  // Small sea-side details keep the map Kochi-inspired without pretending to be a literal map.
  drawDock(ctx);
  PALMS.forEach((palm) => drawPalm(ctx, palm.x, palm.y, ambientTime));
  stations.forEach((station) => drawHouse(ctx, station.x, station.y, station.roof, station.name, station.mark, ambientTime));
  drawWorkshop(ctx, ambientTime);

  // Collected stamps become little pennants above each station.
  for (const station of stations) {
    if (!collected.has(station.id)) continue;
    const x = (station.x + 1.5) * TILE;
    const y = (station.y - 0.2) * TILE;
    ctx.fillStyle = '#26324b';
    ctx.fillRect(x - 1, y - 9, 2, 11);
    ctx.fillStyle = '#fff9ec';
    ctx.fillRect(x + 1, y - 8, 10, 7);
    ctx.fillStyle = '#75b997';
    ctx.fillRect(x + 4, y - 6, 4, 3);
  }

  drawAvatar(ctx, player, direction, walkFrame, ambientTime, spriteSheet, waving, walking, runAtlas, movementAtlas);
}

function distance(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findNearby(point: Point): Nearby {
  const station = stations.find((item) => distance(point, item.approach) <= 2);
  if (station) return { kind: 'station', id: station.id };
  if (distance(point, WORKSHOP) <= 2) return { kind: 'workshop' };
  return null;
}

function cellBlocked(x: number, y: number) {
  if (!isLand(x, y)) return true;
  if (BUILDINGS.some((building) => x >= building.x && x < building.x + building.w && y >= building.y && y < building.y + building.h)) return true;
  return PALMS.some((palm) => Math.abs(x - palm.x) <= 0 && Math.abs(y - palm.y) <= 0);
}

function pointInDirection(point: Point, direction: Direction): Point {
  if (direction === 'up') return { x: point.x, y: point.y - 1 };
  if (direction === 'down') return { x: point.x, y: point.y + 1 };
  if (direction === 'left') return { x: point.x - 1, y: point.y };
  return { x: point.x + 1, y: point.y };
}

const directionKeys: Record<string, Direction | undefined> = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

export default function ProjectTrailGame({ immersive, chatOpen, onBack, onChat, onClose }: { immersive: boolean; chatOpen: boolean; onBack: () => void; onChat: () => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Point>(START);
  const visualPlayerRef = useRef<Point>({ ...START });
  const animationTimeRef = useRef(0);
  const movementAtlasRef = useRef<HTMLImageElement | null>(null);
  const directionRef = useRef<Direction>('down');
  const walkFrameRef = useRef(0);
  const keysRef = useRef(new Set<string>());
  const touchDirectionRef = useRef<Direction | null>(null);
  const collectedRef = useRef(new Set<string>());
  const lastMoveAtRef = useRef(0);
  const runAtlasRef = useRef<HTMLImageElement | null>(null);
  const spriteSheetRef = useRef<HTMLImageElement | null>(null);
  const reducedMotionRef = useRef(false);
  const nearbyRef = useRef<Nearby>(null);
  const conversationRef = useRef<Conversation | null>(null);
  const pausedRef = useRef(false);
  const wonRef = useRef(false);
  const [collected, setCollected] = useState<string[]>([]);
  const [nearby, setNearby] = useState<Nearby>(() => findNearby(START));
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);
  const [announcement, setAnnouncement] = useState('Find the three project stamps, then return to the Workshop.');

  const effectivePaused = paused || chatOpen;

  const moveOneTile = (direction: Direction) => {
    directionRef.current = direction;
    const next = pointInDirection(playerRef.current, direction);
    if (cellBlocked(next.x, next.y)) return;
    playerRef.current = next;
    walkFrameRef.current += 1;
    const nextNearby = findNearby(next);
    nearbyRef.current = nextNearby;
    setNearby(nextNearby);
  };

  const interact = () => {
    if (effectivePaused || wonRef.current || conversationRef.current) return;
    const target = nearbyRef.current;
    if (!target) return;
    if (target.kind === 'station') {
      const station = stationById.get(target.id);
      if (!station) return;
      const alreadyFound = collectedRef.current.has(station.id);
      const nextConversation: Conversation = {
        kind: 'station',
        id: station.id,
        title: alreadyFound ? `${station.name} stamp found` : `A stop at ${station.name}`,
        body: alreadyFound ? `You already found this stamp. ${station.kind}!` : station.fact,
      };
      conversationRef.current = nextConversation;
      setConversation(nextConversation);
      return;
    }
    if (collectedRef.current.size === stations.length) {
      const nextConversation: Conversation = {
        kind: 'complete',
        title: 'Quest complete!',
        body: 'Three stops, three stamps, and a lovely little trip around Kochi. Vigneswer says: nicely explored!',
      };
      conversationRef.current = nextConversation;
      wonRef.current = true;
      setConversation(nextConversation);
      setWon(true);
    } else {
      const nextConversation: Conversation = {
        kind: 'workshop',
        title: 'Your Workshop stop',
        body: `The map is full of little discoveries. You have ${collectedRef.current.size} of ${stations.length} stamps so far. Keep exploring, then come back here!`,
      };
      conversationRef.current = nextConversation;
      setConversation(nextConversation);
    }
  };

  const collectStamp = (id: StationId) => {
    const station = stationById.get(id);
    if (!station || collectedRef.current.has(id)) {
      conversationRef.current = null;
      setConversation(null);
      return;
    }
    const next = new Set(collectedRef.current);
    next.add(id);
    collectedRef.current = next;
    setCollected(Array.from(next));
    conversationRef.current = null;
    setConversation(null);
    const count = next.size;
    setAnnouncement(count === stations.length
      ? 'All three stamps collected. Head back to the Workshop and press E.'
      : `${station.name} stamp collected! ${count} of ${stations.length}.`);
  };

  const closeConversation = () => {
    conversationRef.current = null;
    setConversation(null);
  };

  const togglePause = () => {
    const nextPaused = !pausedRef.current;
    if (nextPaused) {
      touchDirectionRef.current = null;
      keysRef.current.clear();
    }
    conversationRef.current = null;
    setConversation(null);
    pausedRef.current = nextPaused;
    setPaused(nextPaused);
    setAnnouncement(nextPaused ? 'Quest paused.' : 'Quest resumed. Find the three stamps!');
  };

  const openChat = () => {
    touchDirectionRef.current = null;
    keysRef.current.clear();
    onChat();
  };

  const restart = () => {
    playerRef.current = START;
    visualPlayerRef.current = { ...START };
    directionRef.current = 'down';
    walkFrameRef.current = 0;
    collectedRef.current = new Set();
    touchDirectionRef.current = null;
    keysRef.current.clear();
    conversationRef.current = null;
    pausedRef.current = false;
    wonRef.current = false;
    setCollected([]);
    const startNearby = findNearby(START);
    nearbyRef.current = startNearby;
    setNearby(startNearby);
    setConversation(null);
    setPaused(false);
    setWon(false);
    setAnnouncement('Find the three project stamps, then return to the Workshop.');
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      togglePause();
      return;
    }
    const direction = directionKeys[event.key];
    if (direction) {
      event.preventDefault();
      keysRef.current.add(event.key);
      directionRef.current = direction;
      return;
    }
    if (event.key === 'e' || event.key === 'E' || event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) interact();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    let frameId = 0;
    let previousTime = 0;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sceneStartedAt = performance.now();
    reducedMotionRef.current = mediaQuery.matches;
    const syncMotionPreference = () => { reducedMotionRef.current = mediaQuery.matches; };
    mediaQuery.addEventListener('change', syncMotionPreference);

    const releaseKey = (event: globalThis.KeyboardEvent) => {
      keysRef.current.delete(event.key);
    };
    window.addEventListener('keyup', releaseKey);

    const draw = (time: number) => {
      const dt = previousTime ? Math.min(time - previousTime, 50) : 0;
      previousTime = time;
      if (!effectivePaused) animationTimeRef.current += dt;
      const direction = touchDirectionRef.current ?? Array.from(keysRef.current).map((key) => directionKeys[key]).find(Boolean) ?? null;
      const canMove = !effectivePaused && !conversationRef.current && !wonRef.current;
      if (canMove && direction && time - lastMoveAtRef.current > 138) {
        moveOneTile(direction);
        lastMoveAtRef.current = time;
      }
      const visual = visualPlayerRef.current;
      const distance = Math.hypot(playerRef.current.x - visual.x, playerRef.current.y - visual.y);
      if (!effectivePaused) {
        const blend = reducedMotionRef.current ? 1 : 1 - Math.exp(-dt / 40);
        visual.x += (playerRef.current.x - visual.x) * blend;
        visual.y += (playerRef.current.y - visual.y) * blend;
      }
      const bounds = canvas.getBoundingClientRect();
      const viewWidth = Math.max(220, Math.round(CANVAS_HEIGHT * bounds.width / Math.max(1, bounds.height)));
      if (canvas.width !== viewWidth) canvas.width = viewWidth;
      const cropLeft = viewWidth < CANVAS_WIDTH
        ? Math.max(0, Math.min(CANVAS_WIDTH - viewWidth, (visual.x + .5) * TILE - viewWidth / 2))
        : (CANVAS_WIDTH - viewWidth) / 2;
      context.fillStyle = '#77c7cf';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(-cropLeft, 0);
      drawWorld(
        context,
        animationTimeRef.current,
        visual,
        directionRef.current,
        walkFrameRef.current,
        distance > .02 && canMove,
        collectedRef.current,
        reducedMotionRef.current,
        spriteSheetRef.current,
        !reducedMotionRef.current && time - sceneStartedAt < 1800,
        runAtlasRef.current,
        movementAtlasRef.current,
      );
      context.restore();
      frameId = window.requestAnimationFrame(draw);
    };
    frameId = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('keyup', releaseKey);
      mediaQuery.removeEventListener('change', syncMotionPreference);
    };
  }, [effectivePaused]);

  useEffect(() => {
    const atlas = new Image();
    atlas.src = RUN_ATLAS;
    atlas.onload = () => { runAtlasRef.current = atlas; };
    const sheet = new Image();
    sheet.decoding = 'async';
    sheet.src = FRONT_SOCIAL_ATLAS;
    const movement = new Image();
    movement.src = FRONT_MOVEMENT_ATLAS;
    movement.onload = () => { movementAtlasRef.current = movement; };
    sheet.onload = () => { spriteSheetRef.current = sheet; };
    return () => {
      sheet.onload = null;
      movement.onload = null;
      atlas.onload = null;
      spriteSheetRef.current = null;
    };
  }, []);

  useArcadeInput((key, down) => {
    if (key === 'start' && down) { togglePause(); return; }
    if (key === 'b' && down) { closeConversation(); return; }
    if (key === 'a' && down) {
      if (effectivePaused) return;
      if (conversation?.kind === 'station' && conversation.id && !collected.includes(conversation.id)) collectStamp(conversation.id);
      else if (conversation?.kind === 'complete') restart();
      else if (conversation) closeConversation();
      else interact();
      return;
    }
    if (key === 'up' || key === 'down' || key === 'left' || key === 'right') {
      if (!down) { if (touchDirectionRef.current === key) touchDirectionRef.current = null; }
      else if (!effectivePaused && !conversation && !won) { touchDirectionRef.current = key; directionRef.current = key; lastMoveAtRef.current = performance.now(); moveOneTile(key); }
    }
  });

  const nearestStation = nearby?.kind === 'station' ? stationById.get(nearby.id) : undefined;
  const interactionLabel = nearestStation
    ? `Talk to ${nearestStation.name}`
    : nearby?.kind === 'workshop'
      ? collected.length === stations.length ? 'Finish quest' : 'Check the Workshop'
      : 'Move near a stop to interact';

  return (
    <section className={`${styles.game} ${immersive ? styles.immersive : ''}`} aria-labelledby="project-trail-title">
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.titleMark} aria-hidden="true"><Compass size={21} strokeWidth={2.2} /></div>
          <div>
            <p className={styles.eyebrow}>Vigneswer · game 2</p>
            <h2 id="project-trail-title">Project Trail</h2>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.quietButton} type="button" onClick={openChat} aria-label="Chat with Vigneswer"><MessageCircle size={16} /> <span>Chat</span></button>
          <button className={styles.backButton} type="button" onClick={onBack} aria-label="All games"><ArrowLeft size={15} /><span>Games</span></button>
          <button className={styles.quietButton} type="button" onClick={togglePause} disabled={chatOpen} aria-label={effectivePaused ? 'Resume game' : 'Pause game'}>
            {effectivePaused ? <Play size={16} /> : <Pause size={16} />} <span>{effectivePaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button className={styles.quietButton} type="button" onClick={onClose} aria-label="Close Vigneswer"><X size={16} /></button>
        </div>
      </header>

      <div className={styles.introRow}>
        <p>Take the sunny path, meet a few projects, and bring your stamps home.</p>
        <div className={styles.progress} aria-label={`${collected.length} of 3 stamps collected`}>
          <Sparkles size={16} aria-hidden="true" /> <span>{collected.length} / 3 stamps</span>
        </div>
      </div>

      <div className={styles.playArea}>
        <div className={styles.sceneFrame}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            tabIndex={0}
            role="application"
            aria-label="Project Trail pixel map. Use arrow keys or W A S D to walk, and E or Enter to interact."
            aria-describedby="project-trail-instructions project-trail-status"
            onKeyDown={handleKeyDown}
            onBlur={() => keysRef.current.clear()}
            onPointerDown={(event) => event.currentTarget.focus()}
          />
          <div className={styles.mapBadge}><span className={styles.statusDot} /> Kochi, Kerala</div>
          <div className={styles.welcomeTag}>A tiny trip, a few big ideas</div>
        </div>

        <aside className={styles.journal} aria-labelledby="quest-journal-title">
          <div className={styles.journalHeading}>
            <div>
              <p className={styles.eyebrow}>Your little field notes</p>
              <h3 id="quest-journal-title">Discovery journal</h3>
            </div>
            <span className={styles.journalCount}>{collected.length}/3</span>
          </div>
          <ul className={styles.stampList}>
            {stations.map((station) => {
              const hasStamp = collected.includes(station.id);
              return (
                <li className={styles.stampRow} key={station.id}>
                  <span className={`${styles.stampIcon} ${hasStamp ? styles.stampFound : ''}`} aria-hidden="true">
                    {hasStamp ? <Check size={14} strokeWidth={3} /> : station.mark}
                  </span>
                  <span className={styles.stampText}><strong>{station.name}</strong><small>{hasStamp ? 'Stamp collected' : station.kind}</small></span>
                  <span className={styles.stampState}>{hasStamp ? 'Found' : 'Hidden'}</span>
                </li>
              );
            })}
          </ul>
          <p className={styles.returnHint}>
            {collected.length === stations.length
              ? 'All stamps are yours. Head back to the Workshop!'
              : 'Start at the jetty. Bring all three stamps back to the Workshop.'}
          </p>
          <div className={styles.desktopInstruction} id="project-trail-instructions">
            <strong>How to explore</strong>
            <span>Walk with arrows or W A S D. Press E or Enter near a stop.</span>
          </div>
        </aside>
      </div>

      <div className={styles.gameBottom}>
        <div className={styles.touchControls} aria-label="Touch movement controls">
          <div className={styles.dPad}>
            <button type="button" aria-label="Move up" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); touchDirectionRef.current = 'up'; directionRef.current = 'up'; }} onPointerUp={() => { touchDirectionRef.current = null; }} onPointerCancel={() => { touchDirectionRef.current = null; }} onLostPointerCapture={() => { touchDirectionRef.current = null; }} onClick={(event) => { if (event.detail === 0 && !effectivePaused && !conversationRef.current && !wonRef.current) moveOneTile('up'); }}><ArrowUp size={21} /></button>
            <button type="button" aria-label="Move left" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); touchDirectionRef.current = 'left'; directionRef.current = 'left'; }} onPointerUp={() => { touchDirectionRef.current = null; }} onPointerCancel={() => { touchDirectionRef.current = null; }} onLostPointerCapture={() => { touchDirectionRef.current = null; }} onClick={(event) => { if (event.detail === 0 && !effectivePaused && !conversationRef.current && !wonRef.current) moveOneTile('left'); }}><ArrowLeft size={21} /></button>
            <button type="button" aria-label="Move down" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); touchDirectionRef.current = 'down'; directionRef.current = 'down'; }} onPointerUp={() => { touchDirectionRef.current = null; }} onPointerCancel={() => { touchDirectionRef.current = null; }} onLostPointerCapture={() => { touchDirectionRef.current = null; }} onClick={(event) => { if (event.detail === 0 && !effectivePaused && !conversationRef.current && !wonRef.current) moveOneTile('down'); }}><ArrowDown size={21} /></button>
            <button type="button" aria-label="Move right" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); touchDirectionRef.current = 'right'; directionRef.current = 'right'; }} onPointerUp={() => { touchDirectionRef.current = null; }} onPointerCancel={() => { touchDirectionRef.current = null; }} onLostPointerCapture={() => { touchDirectionRef.current = null; }} onClick={(event) => { if (event.detail === 0 && !effectivePaused && !conversationRef.current && !wonRef.current) moveOneTile('right'); }}><ArrowRight size={21} /></button>
          </div>
          <p>Press and hold to walk</p>
        </div>
        <button className={styles.interactButton} type="button" onClick={interact} disabled={!nearby || effectivePaused || won || Boolean(conversation)}>
          <Sparkles size={17} /> <span>{interactionLabel}</span>
        </button>
        <p className={styles.statusMessage} id="project-trail-status" role="status" aria-live="polite">{announcement}</p>
      </div>

      {conversation && (
        <div className={styles.dialogue} role="group" aria-labelledby="quest-dialogue-title" aria-live="polite">
          <div className={styles.dialogueAvatar} aria-hidden="true">B</div>
          <div className={styles.dialogueCopy}>
            <h3 id="quest-dialogue-title">{conversation.title}</h3>
            <p>{conversation.body}</p>
          </div>
          <div className={styles.dialogueActions}>
            {conversation.kind === 'station' && conversation.id && !collected.includes(conversation.id) ? (
              <button type="button" className={styles.collectButton} onClick={() => collectStamp(conversation.id!)}>Collect stamp</button>
            ) : conversation.kind === 'complete' ? (
              <button type="button" className={styles.collectButton} onClick={restart}><RotateCcw size={15} /> Play again</button>
            ) : (
              <button type="button" className={styles.dialogueClose} onClick={closeConversation}>Keep exploring</button>
            )}
          </div>
        </div>
      )}

      {effectivePaused && !chatOpen && (
        <div className={styles.pausedNote} role="status"><Pause size={15} /> The quest is taking a breather. <button type="button" onClick={togglePause}>Resume</button></div>
      )}
    </section>
  );
}
