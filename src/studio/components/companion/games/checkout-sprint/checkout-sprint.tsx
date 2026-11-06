'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ArrowLeft, MessageCircle, Pause, Play, X } from 'lucide-react'
import styles from './checkout-sprint.module.css'
import { useArcadeInput } from '../../arcade-controls'
import { drawFrontSprite, FRONT_SOCIAL_ATLAS } from '../../../../lib/companion/front-animation'
import { drawRunningSprite, RUN_ATLAS } from '../../../../lib/companion/run-animation'

type CheckoutSprintGameProps = {
  variant?: 'platform' | 'stealth'
  immersive: boolean
  chatOpen: boolean
  onBack: () => void
  onChat: () => void
  onClose: () => void
}

type Platform = { x: number; y: number; width: number }
type Spark = { x: number; y: number }
type Bug = { x: number; min: number; max: number; speed: number; direction: 1 | -1 }
type GameState = {
  x: number
  y: number
  vx: number
  vy: number
  landedAt: number
  grounded: boolean
  facing: 1 | -1
  frame: number
  camera: number
  lastCheckpoint: number
  collected: Set<number>
  activatedCheckpoints: Set<number>
  bugs: Bug[]
  elapsed: number
  lastHudAt: number
  message: string
  messageUntil: number
  finished: boolean
  sneaking: boolean
  alert: number
}

const VIEW_WIDTH = 960
const VIEW_HEIGHT = 540
const WORLD_WIDTH = 3420
const GROUND_Y = 432
const PLAYER_WIDTH = 36
const PLAYER_HEIGHT = 60
const GRAVITY = 1500
const MOVE_SPEED = 250
const JUMP_SPEED = 610
const GROUND: Platform[] = [
  { x: 0, y: GROUND_Y, width: 730 },
  { x: 805, y: GROUND_Y, width: 625 },
  { x: 1495, y: GROUND_Y, width: 615 },
  { x: 2195, y: GROUND_Y, width: 585 },
  { x: 2850, y: GROUND_Y, width: 570 },
]
const PLATFORMS: Platform[] = [
  { x: 755, y: 400, width: 58 },
  { x: 1415, y: 400, width: 92 },
  { x: 2092, y: 396, width: 112 },
  { x: 2765, y: 400, width: 94 },
  { x: 990, y: 350, width: 125 },
  { x: 1745, y: 354, width: 132 },
  { x: 2430, y: 344, width: 128 },
]
const SPARKS: Spark[] = [
  { x: 360, y: 345 }, { x: 690, y: 325 }, { x: 880, y: 340 },
  { x: 1050, y: 292 }, { x: 1275, y: 350 }, { x: 1555, y: 330 },
  { x: 1808, y: 294 }, { x: 2025, y: 346 }, { x: 2290, y: 330 },
  { x: 2493, y: 286 }, { x: 2695, y: 345 }, { x: 2980, y: 330 },
  { x: 3200, y: 350 },
]
const CHECKPOINTS = [1110, 2235]

function makeGame(stealth = false): GameState {
  return {
    x: 105,
    y: GROUND_Y - PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    landedAt: -1,
    grounded: true,
    facing: 1,
    frame: 0,
    camera: 0,
    lastCheckpoint: 105,
    collected: new Set(),
    activatedCheckpoints: new Set(),
    bugs: [
      { x: 545, min: 470, max: 660, speed: 78, direction: 1 },
      { x: 1275, min: 1190, max: 1370, speed: 92, direction: -1 },
      { x: 1840, min: 1685, max: 1990, speed: 84, direction: 1 },
      { x: 2635, min: 2490, max: 2730, speed: 96, direction: -1 },
      { x: 3070, min: 2960, max: 3280, speed: 88, direction: 1 },
    ],
    elapsed: 0,
    lastHudAt: 0,
    message: stealth ? 'Reach the beacon. Hold B to sneak past patrols.' : 'Collect sparks!',
    messageUntil: 4,
    finished: false,
    sneaking: false,
    alert: 0,
  }
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height))
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  const s = scale
  rect(ctx, x + 18 * s, y, 38 * s, 9 * s, '#ffffff')
  rect(ctx, x + 8 * s, y + 8 * s, 62 * s, 10 * s, '#ffffff')
  rect(ctx, x, y + 15 * s, 76 * s, 8 * s, '#ffffff')
  rect(ctx, x + 23 * s, y - 7 * s, 22 * s, 10 * s, '#ffffff')
}

function drawPalm(ctx: CanvasRenderingContext2D, x: number, ground: number, scale = 1, sway = 0) {
  const s = scale
  rect(ctx, x + 13 * s, ground - 108 * s, 9 * s, 108 * s, '#926d54')
  rect(ctx, x + 10 * s, ground - 78 * s, 6 * s, 6 * s, '#b58a65')
  const crownX = x + 17 * s + sway
  rect(ctx, crownX - 39 * s, ground - 117 * s, 42 * s, 7 * s, '#4d9876')
  rect(ctx, crownX - 56 * s, ground - 108 * s, 54 * s, 7 * s, '#60aa7e')
  rect(ctx, crownX - 28 * s, ground - 128 * s, 39 * s, 7 * s, '#4d9876')
  rect(ctx, crownX + 4 * s, ground - 118 * s, 48 * s, 7 * s, '#60aa7e')
  rect(ctx, crownX + 3 * s, ground - 107 * s, 61 * s, 7 * s, '#4d9876')
  rect(ctx, crownX - 16 * s, ground - 139 * s, 7 * s, 16 * s, '#60aa7e')
}

function drawBackground(ctx: CanvasRenderingContext2D, game: GameState, now: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT)
  sky.addColorStop(0, '#cce7ff')
  sky.addColorStop(0.72, '#f4f5df')
  sky.addColorStop(1, '#fce8bd')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, ctx.canvas.width, VIEW_HEIGHT)

  const cloudShift = (now * 0.014) % 1150
  for (let i = -1; i < Math.ceil(ctx.canvas.width / 390) + 1; i += 1) {
    drawCloud(ctx, ((i * 390 - cloudShift * 0.38) % 1450) - 90, 74 + (i % 2) * 50, 0.8)
  }

  // Kochi's distant roofline drifts more slowly than the playable ground.
  const skylineOffset = -(game.camera * 0.18) % 520
  for (let i = -1; i < Math.ceil(ctx.canvas.width / 390) + 1; i += 1) {
    const x = skylineOffset + i * 520
    rect(ctx, x, 330, 520, 82, '#a9d9d2')
    rect(ctx, x + 20, 294, 92, 118, '#8fcac2')
    rect(ctx, x + 47, 274, 18, 138, '#6fb2b0')
    rect(ctx, x + 142, 316, 120, 96, '#91c9bd')
    rect(ctx, x + 155, 299, 16, 113, '#78b9af')
    rect(ctx, x + 302, 290, 104, 122, '#91c9bd')
    rect(ctx, x + 324, 272, 12, 140, '#78b9af')
    rect(ctx, x + 433, 321, 70, 91, '#83beb6')
  }

  // Shallow water with a few animated glints under the distant town.
  rect(ctx, 0, 412, ctx.canvas.width, 44, '#8ac6d0')
  const waterOffset = (now * 0.055) % 160
  for (let i = -1; i < 8; i += 1) {
    rect(ctx, i * 160 + waterOffset, 420 + (i % 3) * 9, 52, 3, '#c4e8d9')
    rect(ctx, i * 160 + waterOffset + 74, 438 - (i % 2) * 7, 34, 3, '#6dafc1')
  }

  const palmOffset = -(game.camera * 0.38) % 640
  for (let i = -1; i < Math.ceil(ctx.canvas.width / 640) + 1; i += 1) {
    drawPalm(ctx, palmOffset + i * 640 + 96, 420, 0.73, Math.sin(now * 0.001 + i) * 3)
    drawPalm(ctx, palmOffset + i * 640 + 440, 420, 0.55, Math.sin(now * 0.0013 + i) * 2)
  }
}

function drawGround(ctx: CanvasRenderingContext2D, camera: number) {
  const drawPlatform = (platform: Platform, isGround = false) => {
    const x = platform.x - camera
    if (x + platform.width < -40 || x > ctx.canvas.width + 40) return
    rect(ctx, x, platform.y, platform.width, isGround ? VIEW_HEIGHT - platform.y : 16, '#4f7955')
    rect(ctx, x, platform.y, platform.width, 8, '#82bd71')
    rect(ctx, x, platform.y + 8, platform.width, 6, '#c98c52')
    rect(ctx, x, platform.y + 14, platform.width, isGround ? VIEW_HEIGHT - platform.y - 14 : 9, '#a96e49')
    for (let stripe = 0; stripe < platform.width; stripe += 42) {
      rect(ctx, x + stripe + 8, platform.y + 23, 15, 4, '#ba7e50')
    }
  }
  GROUND.forEach((platform) => drawPlatform(platform, true))
  PLATFORMS.forEach((platform) => drawPlatform(platform))

  // Decorative little workshop sign marks the final stretch.
  const signX = 3030 - camera
  if (signX > -90 && signX < VIEW_WIDTH + 20) {
    rect(ctx, signX, 345, 7, 87, '#765c4f')
    rect(ctx, signX - 35, 332, 79, 35, '#fff5da')
    rect(ctx, signX - 29, 338, 66, 22, '#df9b52')
    rect(ctx, signX - 23, 345, 7, 8, '#fff5da')
    rect(ctx, signX - 9, 345, 7, 8, '#fff5da')
    rect(ctx, signX + 5, 345, 7, 8, '#fff5da')
  }
}


function drawRooftops(ctx: CanvasRenderingContext2D, game: GameState) {
  rect(ctx, 0, 0, ctx.canvas.width, VIEW_HEIGHT, '#20243d')
  rect(ctx, 760 - game.camera * .04, 50, 48, 48, '#f4dfb0')
  for (let i = 0; i < 45; i++) rect(ctx, (i * 137 % 960), (i * 61 % 230), 2, 2, '#a4a5c3')
  for (let layer = 0; layer < 2; layer++) {
    for (let i = -1; i < Math.ceil(ctx.canvas.width / 110) + 1; i++) {
      const x = i * 110 - (game.camera * (.12 + layer * .14)) % 110
      const y = 220 + ((i * 37 + 80) % 100) + layer * 65
      rect(ctx, x, y, 90, VIEW_HEIGHT - y, layer ? '#41415b' : '#30324e')
      rect(ctx, x + 33, y - 24, 24, 24, layer ? '#41415b' : '#30324e')
      for (let w = 0; w < 3; w++) rect(ctx, x + 12 + w * 26, y + 25, 9, 15, '#a08a6a')
    }
  }
  for (const platform of [...GROUND, ...PLATFORMS]) {
    const x = platform.x - game.camera
    rect(ctx, x, platform.y, platform.width, 120, '#685569')
    rect(ctx, x - 2, platform.y, platform.width + 4, 9, '#c5a68b')
    rect(ctx, x, platform.y + 9, platform.width, 6, '#8d7380')
    for (let brick = 0; brick < platform.width; brick += 36) rect(ctx, x + brick + 5, platform.y + 32, 25, 3, '#7a6577')
  }
  if (game.alert > 0) {
    rect(ctx, 390, 72, 180, 9, '#392e49')
    rect(ctx, 390, 72, game.alert * 180, 9, '#f58b78')
  }
}
function drawGuard(ctx: CanvasRenderingContext2D, guard: Bug, camera: number) {
  const x = guard.x - camera
  ctx.fillStyle = '#efc47a28'
  ctx.beginPath(); ctx.moveTo(x + 16, GROUND_Y - 36); ctx.lineTo(x + 16 + guard.direction * 160, GROUND_Y - 110); ctx.lineTo(x + 16 + guard.direction * 160, GROUND_Y); ctx.closePath(); ctx.fill()
  rect(ctx, x + 9, GROUND_Y - 52, 18, 15, '#caa385')
  rect(ctx, x + 7, GROUND_Y - 54, 22, 7, '#b2a5b0')
  rect(ctx, x + 5, GROUND_Y - 37, 26, 27, '#a65d71')
  rect(ctx, x + 8, GROUND_Y - 10, 8, 10, '#28243a')
  rect(ctx, x + 22, GROUND_Y - 10, 8, 10, '#28243a')
}

function drawSpark(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const bob = Math.round(Math.sin(time * 0.005 + x) * 4)
  rect(ctx, x + 9, y - 4 + bob, 10, 10, '#a75d31')
  rect(ctx, x + 7, y + bob, 14, 10, '#f5c75e')
  rect(ctx, x + 10, y + 3 + bob, 8, 4, '#fff4bb')
  rect(ctx, x + 12, y - 8 + bob, 4, 26, '#f5c75e')
  rect(ctx, x + 3, y + 4 + bob, 22, 4, '#f5c75e')
}

function drawBug(ctx: CanvasRenderingContext2D, bug: Bug, camera: number, frame: number) {
  const x = Math.round(bug.x - camera)
  if (x < -40 || x > ctx.canvas.width + 40) return
  const bounce = frame % 24 < 12 ? 0 : 2
  rect(ctx, x + 5, GROUND_Y - 22 + bounce, 25, 14, '#26324b')
  rect(ctx, x + 9, GROUND_Y - 28 + bounce, 17, 12, '#df6d59')
  rect(ctx, x + 10, GROUND_Y - 26 + bounce, 5, 5, '#fff8da')
  rect(ctx, x + 20, GROUND_Y - 26 + bounce, 5, 5, '#fff8da')
  rect(ctx, x + 12, GROUND_Y - 25 + bounce, 2, 3, '#26324b')
  rect(ctx, x + 22, GROUND_Y - 25 + bounce, 2, 3, '#26324b')
  rect(ctx, x + 6, GROUND_Y - 8 + bounce, 5, 7, '#26324b')
  rect(ctx, x + 25, GROUND_Y - 8 + bounce, 5, 7, '#26324b')
}

function drawVigneswer(ctx: CanvasRenderingContext2D, game: GameState, spriteSheet: HTMLImageElement | null, reduceMotion: boolean, runAtlas: HTMLImageElement | null) {
  const x = Math.round(game.x - game.camera)
  const y = Math.round(game.y)
  const moving = Math.abs(game.vx) > 24 && game.grounded
  const landingProgress = (game.elapsed - game.landedAt) / .16
  const landing = game.grounded && landingProgress >= 0 && landingProgress < 1
  if ((moving || !game.grounded || landing) && drawRunningSprite(ctx, runAtlas, game.elapsed * (game.sneaking ? 600 : 1000), x + PLAYER_WIDTH / 2, y + PLAYER_HEIGHT + 3, game.sneaking ? 65 : 82, game.facing, reduceMotion, { action: !game.grounded ? 'jump' : landing ? 'land' : 'run', velocityY: game.vy, landingProgress })) return
  const runFrame = Math.floor(game.frame / 6) % 5
  const bob = reduceMotion ? 0 : moving ? (runFrame % 2 ? -2 : 1) : game.grounded ? Math.round(Math.sin(game.frame * 0.055) * 1.4) : 0
  const arm = !reduceMotion && moving ? (runFrame % 2 ? 5 : -4) : 0
  const legSpread = !reduceMotion && moving ? (runFrame % 2 ? 6 : -2) : 0
  if (drawFrontSprite(ctx, spriteSheet, 'idle', game.elapsed * 1000, x + PLAYER_WIDTH / 2, y + PLAYER_HEIGHT + 3, 82, reduceMotion)) return
  ctx.save()
  if (game.facing < 0) {
    ctx.translate(x + PLAYER_WIDTH, 0)
    ctx.scale(-1, 1)
  } else {
    ctx.translate(x, 0)
  }
  const py = y + bob
  // Shoes, white shorts, blue shirt, ears and face are laid out on a 4px grid.
  rect(ctx, 3, py + 52 - legSpread, 14, 6, '#26324b')
  rect(ctx, 5, py + 50 - legSpread, 13, 7, '#fffaf0')
  rect(ctx, 20, py + 52 + legSpread, 13, 6, '#26324b')
  rect(ctx, 20, py + 50 + legSpread, 13, 7, '#fffaf0')
  rect(ctx, 7, py + 40, 23, 14, '#fffaf0')
  rect(ctx, 4, py + 39, 28, 6, '#e6edf3')
  rect(ctx, 5, py + 22, 27, 23, '#5d91dc')
  rect(ctx, 9, py + 24, 19, 18, '#79aaf0')
  rect(ctx, 17, py + 24, 4, 19, '#4e80c9')
  rect(ctx, 20, py + 29, 3, 3, '#eff4ff')
  rect(ctx, 20, py + 36, 3, 3, '#eff4ff')
  // Sleeves and swinging arms.
  rect(ctx, 1, py + 24 + arm, 8, 9, '#6a9fe8')
  rect(ctx, 0, py + 30 + arm, 7, 13, '#f0a66d')
  rect(ctx, 28, py + 24 - arm, 8, 9, '#6a9fe8')
  rect(ctx, 30, py + 30 - arm, 6, 13, '#f0a66d')
  // Watch.
  rect(ctx, 29, py + 37 - arm, 7, 3, '#5b765d')
  rect(ctx, 31, py + 37 - arm, 3, 4, '#e0b868')
  // Ears and face.
  rect(ctx, 3, py + 9, 6, 11, '#d98755')
  rect(ctx, 28, py + 9, 6, 11, '#d98755')
  rect(ctx, 7, py + 5, 24, 22, '#f3b477')
  rect(ctx, 10, py + 6, 18, 19, '#ffc990')
  // Hair silhouette with deliberately blocky curls.
  rect(ctx, 4, py + 3, 28, 10, '#382b2b')
  rect(ctx, 7, py - 1, 7, 9, '#382b2b')
  rect(ctx, 15, py - 3, 8, 10, '#382b2b')
  rect(ctx, 23, py, 8, 9, '#382b2b')
  rect(ctx, 2, py + 5, 8, 7, '#382b2b')
  rect(ctx, 27, py + 5, 8, 7, '#382b2b')
  rect(ctx, 9, py + 3, 5, 3, '#5b4140')
  rect(ctx, 18, py + 1, 5, 3, '#5b4140')
  // Eyes, brows, smile and nose.
  rect(ctx, 11, py + 13, 4, 5, '#26324b')
  rect(ctx, 23, py + 13, 4, 5, '#26324b')
  rect(ctx, 12, py + 13, 2, 2, '#ffffff')
  rect(ctx, 24, py + 13, 2, 2, '#ffffff')
  rect(ctx, 10, py + 10, 6, 2, '#382b2b')
  rect(ctx, 22, py + 10, 6, 2, '#382b2b')
  rect(ctx, 18, py + 18, 4, 3, '#e69a63')
  rect(ctx, 13, py + 22, 13, 2, '#8a493d')
  rect(ctx, 15, py + 22, 9, 2, '#fffaf0')
  ctx.restore()
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, x: number, camera: number, active: boolean) {
  const px = Math.round(x - camera)
  if (px < -30 || px > ctx.canvas.width + 30) return
  rect(ctx, px, GROUND_Y - 72, 5, 72, '#765747')
  rect(ctx, px + 5, GROUND_Y - 70, 31, 18, active ? '#70b996' : '#fff8e7')
  rect(ctx, px + 9, GROUND_Y - 66, 20, 10, active ? '#d8f0dd' : '#80a6dd')
  rect(ctx, px + 12, GROUND_Y - 63, 5, 4, '#fff8e7')
}

function drawFinish(ctx: CanvasRenderingContext2D, camera: number, time: number) {
  const x = WORLD_WIDTH - 130 - camera
  rect(ctx, x, GROUND_Y - 104, 7, 104, '#765747')
  rect(ctx, x + 7, GROUND_Y - 102, 56, 32, '#fff7df')
  rect(ctx, x + 12, GROUND_Y - 96, 46, 18, '#65a980')
  rect(ctx, x + 18, GROUND_Y - 93, 6, 6, '#fff7df')
  rect(ctx, x + 30, GROUND_Y - 93, 6, 6, '#fff7df')
  rect(ctx, x + 42, GROUND_Y - 93, 6, 6, '#fff7df')
  rect(ctx, x - 12, GROUND_Y - 10 + Math.sin(time * 0.004) * 3, 10, 6, '#f4c65f')
}

function drawScene(ctx: CanvasRenderingContext2D, game: GameState, now: number, spriteSheet: HTMLImageElement | null, reduceMotion: boolean, visible: { left: number; width: number; top: number }, runAtlas: HTMLImageElement | null, stealth: boolean) {
  const sceneTime = reduceMotion ? 0 : now
  if (stealth) drawRooftops(ctx, game)
  else { drawBackground(ctx, game, sceneTime); drawGround(ctx, game.camera) }
  SPARKS.forEach((spark, index) => {
    if (!game.collected.has(index)) drawSpark(ctx, spark.x - game.camera, spark.y, sceneTime)
  })
  CHECKPOINTS.forEach((point, index) => drawCheckpoint(ctx, point, game.camera, game.activatedCheckpoints.has(index)))
  game.bugs.forEach((bug) => stealth ? drawGuard(ctx, bug, game.camera) : drawBug(ctx, bug, game.camera, reduceMotion ? 0 : game.frame))
  drawFinish(ctx, game.camera, sceneTime)
  drawVigneswer(ctx, game, spriteSheet, reduceMotion, runAtlas)

  if (game.message && game.elapsed < game.messageUntil) {
    const bannerWidth = Math.min(460, visible.width - 16)
    const bannerLeft = visible.width >= 476 ? visible.left + 24 : visible.left + 8
    const bannerTop = visible.top + 12
    ctx.fillStyle = 'rgba(38, 50, 75, 0.92)'
    ctx.fillRect(bannerLeft, bannerTop, bannerWidth, 43)
    ctx.fillStyle = '#fff9ec'
    ctx.font = `bold ${visible.width < 360 ? 14 : 17}px ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.textBaseline = 'middle'
    ctx.fillText(game.message, bannerLeft + 12, bannerTop + 21, bannerWidth - 24)
  }
}

function overlapsPlayer(x: number, y: number, width: number, height: number, player: GameState) {
  return player.x + PLAYER_WIDTH - 7 > x && player.x + 7 < x + width && player.y + PLAYER_HEIGHT - 5 > y && player.y + 7 < y + height
}

export default function CheckoutSprintGame({ variant = 'platform', immersive, chatOpen, onBack, onChat, onClose }: CheckoutSprintGameProps) {
  const stealth = variant === 'stealth' 
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const spriteSheetRef = useRef<HTMLImageElement | null>(null)
  const runAtlasRef = useRef<HTMLImageElement | null>(null)
  const gameRef = useRef<GameState>(makeGame(stealth))
  const keysRef = useRef(new Set<string>())
  const jumpQueuedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const effectivePaused = paused || chatOpen
  const [collectedCount, setCollectedCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState(stealth ? 'Reach the beacon. Hold B to sneak past patrols.' : 'Collect sparks!')
  const [reduceMotion, setReduceMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(preference.matches)
    preference.addEventListener('change', sync)
    return () => preference.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const atlas = new Image()
    atlas.src = RUN_ATLAS
    atlas.onload = () => { runAtlasRef.current = atlas }
    const spriteSheet = new Image()
    spriteSheet.src = FRONT_SOCIAL_ATLAS
    spriteSheet.onload = () => { spriteSheetRef.current = spriteSheet }
    return () => { spriteSheet.onload = null; atlas.onload = null }
  }, [])

  const restart = useCallback(() => {
    gameRef.current = makeGame(stealth)
    keysRef.current.clear()
    jumpQueuedRef.current = false
    setPaused(false)
    setFinished(false)
    setCollectedCount(0)
    setElapsed(0)
    setProgress(0)
    setToast(stealth ? 'Reach the beacon. Hold B to sneak past patrols.' : 'Collect sparks!')
    stageRef.current?.focus()
  }, [stealth])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d', { alpha: false })
    if (!canvas || !context) return
    let frameRequest = 0
    let previous = 0

    const tick = (now: number) => {
      if (!previous) previous = now
      const dt = Math.min((now - previous) / 1000, 0.032)
      previous = now
      const game = gameRef.current
      const bounds = canvas.getBoundingClientRect()
      const viewWidth = Math.max(240, Math.round(VIEW_HEIGHT * bounds.width / Math.max(1, bounds.height)))
      if (canvas.width !== viewWidth) canvas.width = viewWidth

      if (!effectivePaused && !finished) {
        game.elapsed += dt
        game.frame += 1
        const keys = keysRef.current
        const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A')
        const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D')
        game.sneaking = stealth && (keys.has('ArrowDown') || keys.has('s') || keys.has('Shift')) && game.grounded
        const accelerating = left !== right
        if (accelerating) {
          game.vx += (right ? 1250 : -1250) * dt
          game.facing = right ? 1 : -1
        } else {
          game.vx *= Math.pow(0.001, dt)
        }
        const speed = game.sneaking ? 90 : MOVE_SPEED
        game.vx = Math.max(-speed, Math.min(speed, game.vx))
        if (jumpQueuedRef.current && game.grounded) {
          game.vy = -JUMP_SPEED
          game.grounded = false
        }
        jumpQueuedRef.current = false

        const wasGrounded = game.grounded
        const oldBottom = game.y + PLAYER_HEIGHT
        game.x += game.vx * dt
        game.y += game.vy * dt
        game.vy += GRAVITY * dt
        game.grounded = false
        let landing: Platform | undefined
        if (game.vy >= 0) {
          const surfaces = [...GROUND, ...PLATFORMS]
          landing = surfaces.find((surface) => {
            const horizontal = game.x + PLAYER_WIDTH - 5 > surface.x && game.x + 5 < surface.x + surface.width
            return horizontal && oldBottom <= surface.y + 4 && game.y + PLAYER_HEIGHT >= surface.y
          })
        }
        if (landing) {
          if (!wasGrounded) game.landedAt = game.elapsed
          game.y = landing.y - PLAYER_HEIGHT
          game.vy = 0
          game.grounded = true
        }
        game.x = Math.max(0, Math.min(WORLD_WIDTH - PLAYER_WIDTH, game.x))
        if (game.x < game.lastCheckpoint - 90) game.x = game.lastCheckpoint - 90

        let spotted = false
        game.bugs.forEach((bug) => {
          bug.x += bug.speed * bug.direction * dt
          if (bug.x < bug.min || bug.x > bug.max) bug.direction = bug.direction === 1 ? -1 : 1
          const ahead = (game.x + PLAYER_WIDTH / 2 - bug.x) * bug.direction
          if (stealth && !game.sneaking && ahead > 0 && ahead < 155 && game.y + PLAYER_HEIGHT > GROUND_Y - 75) spotted = true
          if (overlapsPlayer(bug.x + 5, GROUND_Y - (stealth ? 48 : 28), 27, stealth ? 48 : 30, game)) {
            game.x = game.lastCheckpoint
            game.y = GROUND_Y - PLAYER_HEIGHT
            game.vx = 0
            game.vy = 0
            game.grounded = true
            game.camera = Math.max(0, game.x - VIEW_WIDTH * 0.42)
            game.message = stealth ? 'Caught! Back to your rooftop checkpoint.' : 'A tiny bug! Back to your checkpoint.'
            game.messageUntil = game.elapsed + 2.5
            setToast(game.message)
          }
        })

        game.alert = Math.max(0, Math.min(1, game.alert + (spotted ? dt * 1.5 : -dt * 2)))
        if (stealth && game.alert >= 1) {
          game.x = game.lastCheckpoint; game.y = GROUND_Y - PLAYER_HEIGHT; game.vx = 0; game.vy = 0; game.alert = 0;
          game.message = 'Spotted! Sneak or take the high route.'; game.messageUntil = game.elapsed + 3; setToast(game.message);
        }

        SPARKS.forEach((spark, index) => {
          if (!game.collected.has(index) && overlapsPlayer(spark.x + 3, spark.y - 8, 26, 32, game)) {
            game.collected.add(index)
            setCollectedCount(game.collected.size)
            game.message = 'Idea spark collected! Keep going.'
            game.messageUntil = game.elapsed + 1.7
            setToast(game.message)
          }
        })

        CHECKPOINTS.forEach((point, index) => {
          if (game.x + PLAYER_WIDTH / 2 >= point && !game.activatedCheckpoints.has(index)) {
            game.activatedCheckpoints.add(index)
            game.lastCheckpoint = point + 12
            game.message = 'Checkpoint saved. Nice progress!'
            game.messageUntil = game.elapsed + 2.4
            setToast(game.message)
          }
        })

        if (game.y > VIEW_HEIGHT + 120) {
          game.x = game.lastCheckpoint
          game.y = GROUND_Y - PLAYER_HEIGHT
          game.vx = 0
          game.vy = 0
          game.grounded = true
          game.message = 'Missed that jump. Try again from here!'
          game.messageUntil = game.elapsed + 2.4
          setToast(game.message)
        }

        game.camera = Math.max(0, Math.min(WORLD_WIDTH - viewWidth, game.x - viewWidth * 0.35))
        if (game.x >= WORLD_WIDTH - 170) {
          game.finished = true
          setFinished(true)
          setPaused(false)
          game.message = 'Build complete! You made it!'
          game.messageUntil = Number.POSITIVE_INFINITY
          setToast(game.message)
        }
        if (game.elapsed - game.lastHudAt > 0.25) {
          game.lastHudAt = game.elapsed
          setElapsed(game.elapsed)
          setProgress(Math.min(100, Math.round((game.x / (WORLD_WIDTH - 130)) * 100)))
        }
      }

      context.imageSmoothingEnabled = false
      drawScene(context, game, now, spriteSheetRef.current, reduceMotion, { left: 0, width: viewWidth, top: 0 }, runAtlasRef.current, stealth)
      frameRequest = window.requestAnimationFrame(tick)
    }

    frameRequest = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameRequest)
  }, [effectivePaused, finished, reduceMotion, stealth])

  useEffect(() => {
    const root = stageRef.current
    if (!root) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!root.contains(document.activeElement)) return
      if (event.key === 'Tab' && (effectivePaused || finished)) {
        const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'))
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
        return
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift', 's', ' ', 'Spacebar', 'a', 'A', 'd', 'D', 'w', 'W'].includes(event.key)) event.preventDefault()
      const key = event.key === ' ' || event.key === 'Spacebar' ? 'Space' : event.key
      if (key === 'Escape' || key.toLowerCase() === 'p') {
        event.preventDefault()
        if (!finished) setPaused((value) => !value)
        return
      }
      const isJumpKey = key === 'Space' || key === 'ArrowUp' || key === 'w' || key === 'W'
      if (isJumpKey && !keysRef.current.has(key)) jumpQueuedRef.current = true
      keysRef.current.add(key)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key === ' ' || event.key === 'Spacebar' ? 'Space' : event.key
      keysRef.current.delete(key)
    }
    const onBlur = () => keysRef.current.clear()
    root.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      root.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [effectivePaused, finished])

  useEffect(() => {
    const root = stageRef.current
    if (!root) return
    if (effectivePaused && !chatOpen) root.querySelector<HTMLButtonElement>('[role="dialog"] button')?.focus()
    else if (!effectivePaused) root.focus()
  }, [chatOpen, effectivePaused, finished])

  const hold = (key: string, down: boolean) => {
    if (down) keysRef.current.add(key)
    else keysRef.current.delete(key)
  }
  const beginHold = (event: ReactPointerEvent<HTMLButtonElement>, key: string) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    hold(key, true)
  }
  const endHold = (event: ReactPointerEvent<HTMLButtonElement>, key: string) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    hold(key, false)
  }
  const jump = () => {
    if (!effectivePaused && !finished) jumpQueuedRef.current = true
  }
  const tapMove = (direction: 1 | -1) => {
    if (effectivePaused || finished) return
    const game = gameRef.current
    game.vx = direction * MOVE_SPEED
    game.x = Math.max(0, Math.min(WORLD_WIDTH - PLAYER_WIDTH, game.x + direction * 18))
  }
  const togglePause = () => {
    if (finished) return
    setPaused((value) => !value)
    keysRef.current.clear()
  }
  const openChat = () => {
    keysRef.current.clear()
    onChat()
  }
  useArcadeInput((key, down) => {
    if (key === 'start' && down) { togglePause(); return }
    if (effectivePaused || finished) { keysRef.current.clear(); return }
    if (key === 'a' || key === 'up' || (key === 'b' && !stealth)) { if (down) jump(); return }
    if (key === 'b' || key === 'down') { hold('ArrowDown', down); return }
    if (down) tapMove(key === 'left' ? -1 : 1)
    hold(key === 'left' ? 'ArrowLeft' : 'ArrowRight', down)
  })
  const formattedTime = `${Math.floor(elapsed / 60).toString().padStart(2, '0')}:${Math.floor(elapsed % 60).toString().padStart(2, '0')}`

  return (
    <section className={`${styles.game} ${immersive ? styles.immersive : ''}`} aria-label={stealth ? "Order Dash stealth game" : "Checkout Sprint pixel platform game"}>
      <header className={styles.header}>
        <div className={styles.gameTitle}>
          <span className={styles.titleIcon} aria-hidden="true">▣</span>
          <div>
            <h2>{stealth ? "Order Dash" : "Checkout Sprint"}</h2>
            <p>A little bug fixing, a lot of jumping.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.softButton} onClick={openChat} type="button" aria-label="Pause and chat with Vigneswer"><MessageCircle size={15} /><span>Chat</span></button>
          <button className={`${styles.softButton} ${styles.backButton}`} onClick={onBack} type="button" aria-label="All games"><ArrowLeft size={15} /><span>Games</span></button>
          <button className={styles.pauseButton} onClick={togglePause} type="button" disabled={finished || chatOpen} aria-label={effectivePaused ? 'Resume game' : 'Pause game'}>
            {effectivePaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} />}<span>{effectivePaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button className={`${styles.softButton} ${styles.closeButton}`} onClick={onClose} type="button" aria-label="Close Vigneswer"><X size={16} /></button>
        </div>
      </header>

      <div className={styles.hud} aria-label="Game progress">
        <div className={styles.progressBlock}>
          <span className={styles.hudLabel}>{stealth ? "RELICS" : "IDEA SPARKS"}</span>
          <strong><span aria-hidden="true">✦</span> {collectedCount}<small> / {SPARKS.length}</small></strong>
        </div>
        <div className={styles.levelTrack} role="progressbar" aria-label="Level progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
          <i aria-hidden="true">⚑</i>
        </div>
        <div className={styles.timer} aria-label={`Time ${formattedTime}`}>
          <span className={styles.hudLabel}>TIME</span>
          <strong>{formattedTime}</strong>
        </div>
      </div>

      <div
        ref={stageRef}
        className={styles.stage}
        tabIndex={0}
        aria-label="Game area. Use left and right arrows or A and D to move, and Space or Up to jump. Press P or Escape to pause."
        onPointerDown={() => stageRef.current?.focus()}
      >
        <canvas ref={canvasRef} className={styles.canvas} width={VIEW_WIDTH} height={VIEW_HEIGHT} aria-label={stealth ? "Vigneswer sneaking across rooftops, collecting relics and avoiding guard sight cones." : "Vigneswer running through a coastal level, collecting golden idea sparks and avoiding bugs."} role="img" />
        {toast && !effectivePaused && !finished && <div className={styles.liveMessage}>{toast}</div>}
        {effectivePaused && !chatOpen && (
          <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="paused-title">
            <div className={styles.modalCard}>
              <span className={styles.modalKicker}>TAKE A BREATHER</span>
              <h3 id="paused-title">Paused</h3>
              <p>Your idea sparks are safe. Ready when you are.</p>
              <div className={styles.modalButtons}>
                <button className={styles.primaryButton} onClick={togglePause} type="button">Resume run <span aria-hidden="true">→</span></button>
                <button className={styles.secondaryButton} onClick={openChat} type="button">Chat with Vigneswer</button>
                <button className={styles.textButton} onClick={restart} type="button">Restart level</button>
              </div>
            </div>
          </div>
        )}
        {finished && (
          <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="finish-title">
            <div className={`${styles.modalCard} ${styles.finishCard}`}>
              <span className={styles.modalKicker}>LEVEL COMPLETE</span>
              <h3 id="finish-title">{stealth ? "Beacon reached!" : "Build shipped! ✦"}</h3>
              <p>You collected {collectedCount} idea sparks in {formattedTime}. That was a great run.</p>
              <div className={styles.modalButtons}>
                <button className={styles.primaryButton} onClick={restart} type="button">Play again <span aria-hidden="true">↻</span></button>
                <button className={styles.secondaryButton} onClick={openChat} type="button">Tell Vigneswer about it</button>
                <button className={styles.textButton} onClick={onBack} type="button">Back to games</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <p className={styles.instructions}><strong>How to play</strong><span>← → or A / D move</span><span>Space or ↑ jump</span><span>P / Esc pause</span></p>
        <div className={styles.touchControls} aria-label="Touch game controls">
          <div className={styles.directionControls}>
            <button type="button" aria-label="Move left" onPointerDown={(event) => beginHold(event, 'ArrowLeft')} onPointerUp={(event) => endHold(event, 'ArrowLeft')} onPointerCancel={(event) => endHold(event, 'ArrowLeft')} onClick={() => tapMove(-1)}>←</button>
            <button type="button" aria-label="Move right" onPointerDown={(event) => beginHold(event, 'ArrowRight')} onPointerUp={(event) => endHold(event, 'ArrowRight')} onPointerCancel={(event) => endHold(event, 'ArrowRight')} onClick={() => tapMove(1)}>→</button>
          </div>
          <button className={styles.jumpButton} type="button" aria-label="Jump" onPointerDown={(event) => { event.preventDefault(); jump() }} onClick={jump}>JUMP <span aria-hidden="true">↑</span></button>
        </div>
      </div>
      <span className={styles.srOnly} aria-live="polite">{toast}</span>
    </section>
  )
}
