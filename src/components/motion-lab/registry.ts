import type { ComponentType } from 'react';

import {
  ArrowButton,
  BeamButton,
  HoldButton,
  MagneticButton,
  RippleButton,
  SheenButton,
  SubmitButton,
} from './ButtonDemos';
import { Accordion, Odometer, Scramble, SharedTabs, SkeletonSwap, ToastStack } from './ComponentDemos';
import { Dock, ScrollWords, SharedExpand, SwipeDeck, TiltCard, VelocityMarquee } from './AdvancedDemos';
import { BeamGrid, Constellation, DigitalRain, FlowField, Topography, WaveField } from './Backgrounds';

/**
 * The catalogue. Each entry pairs the live component with the part of its
 * implementation that actually does the work — trimmed to the mechanism, not
 * pasted wholesale, since half of any real component here is Tailwind classes.
 *
 * `note` is the reason the thing is built the way it is. Without it this is a
 * page of hover effects; with it, it's a page about decisions.
 *
 * Entries hold a component *reference*, not a `() => <X />` thunk, which keeps
 * this file free of JSX and therefore a `.ts` — a `.tsx` exporting only
 * constants trips react-refresh's only-export-components rule.
 */

/**
 * Order drives the sidebar, and Backgrounds leads deliberately — it is the one
 * group that reads as something happening before you touch anything, so it is
 * what the page should open on. The rest run buttons → components → advanced.
 */
export const GROUPS = ['Backgrounds', 'Buttons', 'Components', 'Advanced'] as const;

export type DemoGroup = (typeof GROUPS)[number];

export type Demo = {
  id: string;
  group: DemoGroup;
  label: string;
  /** The design decision worth stating out loud. */
  note: string;
  /** The mechanism, trimmed of styling. */
  code: string;
  /** Fills its tile edge to edge and gets a taller stage — the backgrounds. */
  full?: boolean;
  Component: ComponentType;
};

export const DEMOS: Demo[] = [
  /* ------------------------------ Buttons ------------------------------ */
  {
    id: 'magnetic',
    group: 'Buttons',
    label: 'Magnetic',
    note: 'Offset is divided by a strength factor rather than tracking the cursor 1:1 — a control that follows exactly feels like it has come loose.',
    code: `const { left, top, width, height } = el.getBoundingClientRect()
const cx = left + width / 2
const cy = top + height / 2

// Only engage inside a padded hit zone, so the whole page
// isn't recomputing offsets for a button 900px away.
if (Math.abs(cx - e.clientX) < width / 2 + padding &&
    Math.abs(cy - e.clientY) < height / 2 + padding) {
  setPos({ x: (e.clientX - cx) / strength,
           y: (e.clientY - cy) / strength })
} else {
  setPos({ x: 0, y: 0 })
}`,
    Component: MagneticButton,
  },
  {
    id: 'sheen',
    group: 'Buttons',
    label: 'Sheen sweep',
    note: 'Skewed 20°, so it reads as a light source crossing a surface. An unskewed rectangle sliding past reads as a rectangle sliding past.',
    code: `<button className="group relative overflow-hidden rounded-full">
  <span className="relative z-10">Hover me</span>
  <span
    aria-hidden
    className="absolute inset-y-0 -left-full w-1/2 -skew-x-[20deg]
               bg-gradient-to-r from-transparent via-primary/25 to-transparent
               transition-[left] duration-700 ease-out
               group-hover:left-[150%]"
  />
</button>

// Pure CSS. No JS, no state, no listener.`,
    Component: SheenButton,
  },
  {
    id: 'ripple',
    group: 'Buttons',
    label: 'Ripple',
    note: 'Diameter is measured to the furthest corner from the click. A fixed size visibly stops short when you hit the edge of a wide button.',
    code: `const spawn = (e) => {
  const r = e.currentTarget.getBoundingClientRect()
  const size = 2 * Math.hypot(
    Math.max(e.clientX - r.left, r.right - e.clientX),
    Math.max(e.clientY - r.top, r.bottom - e.clientY),
  )
  // id read outside the updater: StrictMode runs updaters
  // twice and would burn one every click.
  const id = seq.current++
  setRipples(rs => [...rs, { id, x: e.clientX - r.left,
                             y: e.clientY - r.top, size }])
}

<motion.span
  initial={{ scale: 0, opacity: 0.45 }}
  animate={{ scale: 1, opacity: 0 }}
  onAnimationComplete={() =>
    setRipples(rs => rs.filter(x => x.id !== r.id))}
/>`,
    Component: RippleButton,
  },
  {
    id: 'beam',
    group: 'Buttons',
    label: 'Border beam',
    note: 'A spinning conic gradient with the button face laid on top — the visible 1px is whatever the face does not cover. Animating a border property would repaint every frame; a transform does not.',
    code: `<button className="relative overflow-hidden rounded-full p-px">
  <span
    aria-hidden
    className="absolute inset-[-120%] animate-[spin_3.5s_linear_infinite]
               bg-[conic-gradient(from_0deg,transparent_0%,
                   hsl(var(--primary))_10%,transparent_28%)]"
  />
  <span className="relative rounded-full bg-background px-6 py-2.5">
    Always running
  </span>
</button>

// inset-[-120%] so the square gradient still covers
// the corners of a wide button as it rotates.`,
    Component: BeamButton,
  },
  {
    id: 'submit',
    group: 'Buttons',
    label: 'Stateful submit',
    note: 'layout animates the width between the three labels; mode="wait" stops the two from overlapping, which is what makes a morphing button bounce.',
    code: `<motion.button layout onClick={go}
  transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
  <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={state}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
    >
      <Icon /> {label}
    </motion.span>
  </AnimatePresence>
</motion.button>

// Timers are cleared on unmount — a setState firing
// after navigation is a leak, not a warning.`,
    Component: SubmitButton,
  },
  {
    id: 'arrow',
    group: 'Buttons',
    label: 'Arrow relay',
    note: 'Two arrows in a clipped 1em box: one exits right as the other arrives from the left. A single arrow that just translates leaves an empty slot behind it.',
    code: `<span className="relative block h-4 w-4 overflow-hidden">
  <ArrowRight className="absolute inset-0 transition-transform
                         duration-300 group-hover:translate-x-5" />
  <ArrowRight className="absolute inset-0 -translate-x-5
                         transition-transform duration-300
                         group-hover:translate-x-0" />
</span>`,
    Component: ArrowButton,
  },
  {
    id: 'hold',
    group: 'Buttons',
    label: 'Hold to confirm',
    note: 'The fill is the timer, not a decoration of it — releasing early clears both. A progress bar that keeps filling after you let go is lying about state.',
    code: `const start = () => {
  setHeld(true)
  timer.current = setTimeout(() => { setConfirmed(true); setHeld(false) }, 900)
}
const cancel = () => { clearTimeout(timer.current); setHeld(false) }

<motion.span
  className="absolute inset-y-0 left-0 bg-destructive/20"
  animate={{ width: held ? '100%' : '0%' }}
  // Under reduced motion the fill still runs — it is
  // feedback, not decoration — just much shorter.
  transition={{ duration: held && !reduce ? 0.9 : 0.18, ease: 'linear' }}
/>`,
    Component: HoldButton,
  },

  /* ----------------------------- Components ---------------------------- */
  {
    id: 'odometer',
    group: 'Components',
    label: 'Odometer',
    note: 'Keyed per slot, so only the digits that changed animate — and padded to a fixed width, so the number does not also shift sideways while they roll.',
    code: `const digits = String(value).padStart(5, '0').split('')

digits.map((d, i) => (
  <span key={i} className="relative inline-block overflow-hidden">
    <AnimatePresence initial={false}>
      {/* key is the digit: same digit, no animation */}
      <motion.span
        key={d}
        initial={{ y: dir > 0 ? '-100%' : '100%' }}
        animate={{ y: '0%' }}
        exit={{ y: dir > 0 ? '100%' : '-100%' }}
      >{d}</motion.span>
    </AnimatePresence>
  </span>
))`,
    Component: Odometer,
  },
  {
    id: 'tabs',
    group: 'Components',
    label: 'Shared-layout tabs',
    note: 'One indicator that travels between tabs, via layoutId. Four indicators cross-fading reads as a flicker; the eye tracks a moving object, not an appearing one.',
    code: `{TABS.map(t => (
  <button key={t} onClick={() => setActive(t)} className="relative">
    {active === t && (
      <motion.span
        layoutId="tab-pill"
        className="absolute inset-0 rounded-full bg-primary"
        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      />
    )}
    <span className="relative">{t}</span>
  </button>
))}

// The label sits above the pill and stays put —
// only the background travels.`,
    Component: SharedTabs,
  },
  {
    id: 'toasts',
    group: 'Components',
    label: 'Collapsing stack',
    note: 'Collapsed, each card peeks 9px and scales down 5% per depth: enough to show there are more without asking you to read four lines at once.',
    code: `<motion.div
  layout
  animate={{
    y: open ? i * 42 : i * 9,
    scale: open ? 1 : 1 - i * 0.05,
    opacity: i > 2 ? 0 : 1,
  }}
  style={{ zIndex: notes.length - i }}
  transition={{ type: 'spring', stiffness: 320, damping: 34 }}
/>

// layout is what makes an insertion push the stack
// down rather than pop into place.`,
    Component: ToastStack,
  },
  {
    id: 'skeleton',
    group: 'Components',
    label: 'Skeleton swap',
    note: 'Bar heights are the rendered line-heights of the lines they stand in for. A skeleton whose geometry does not match makes the swap land as a jump — worse than a spinner.',
    code: `{loading ? (
  <div className="space-y-2.5">
    {/* 17px = text-sm at its rendered line-height */}
    <div className="h-[17px] w-1/2 animate-pulse rounded bg-border" />
    <div className="h-[15px] w-full animate-pulse rounded bg-border/70" />
    <div className="h-[15px] w-3/5 animate-pulse rounded bg-border/70" />
  </div>
) : (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }} className="space-y-2.5">
    ...
  </motion.div>
)}`,
    Component: SkeletonSwap,
  },
  {
    id: 'accordion',
    group: 'Components',
    label: 'Accordion',
    note: 'height: auto animates fine in framer — but only with overflow hidden on the wrapper, or the copy spills over the row below for the length of the transition.',
    code: `<motion.div
  initial={false}
  animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
  className="overflow-hidden"   // <- load-bearing
>
  <p className="px-3.5 pb-3">{body}</p>
</motion.div>

// initial={false} so a panel that starts open
// doesn't animate itself open on mount.`,
    Component: Accordion,
  },
  {
    id: 'scramble',
    group: 'Components',
    label: 'Scramble',
    note: 'Each character settles at its own frame, so the string resolves left to right. Settling everything on one frame is a flicker followed by a snap.',
    code: `const id = setInterval(() => {
  frame++
  setText(TARGET.split('').map((ch, i) =>
    // character i settles at frame i * 1.6 + 6
    frame > i * 1.6 + 6 || ch === ' '
      ? ch
      : NOISE[(frame * 7 + i * 13) % NOISE.length]
  ).join(''))
  if (frame > TARGET.length * 1.6 + 6) clearInterval(id)
}, 32)

// Spaces are never scrambled — word boundaries
// moving is what makes these read as noise.`,
    Component: Scramble,
  },

  /* ------------------------------ Advanced ----------------------------- */
  {
    id: 'dock',
    group: 'Advanced',
    label: 'Magnifying dock',
    note: 'Each item springs toward its target size instead of being driven straight off the pointer distance. Without the spring it tracks exactly and feels like a slider; the lag is the effect.',
    code: `const mouseX = useMotionValue(Infinity)   // Infinity = at rest

const distance = useTransform(mouseX, v => {
  const box = ref.current?.getBoundingClientRect()
  return box ? v - (box.left + box.width / 2) : Infinity
})

const target = useTransform(distance, [-130, 0, 130], [38, 68, 38],
                            { clamp: true })
const size = useSpring(target, { stiffness: 320, damping: 20, mass: 0.35 })

<motion.div style={{ width: size, height: size }} />

// Motion values, so pointermove never re-renders React.`,
    Component: Dock,
  },
  {
    id: 'tilt',
    group: 'Advanced',
    label: 'Tilt + specular glare',
    note: 'The highlight tracks the pointer independently of the rotation. Locking it to the tilt makes it read as a texture painted on the card rather than a light in the room.',
    code: `const rotateX = useSpring(useTransform(y, [0, 1], [11, -11]), spring)
const rotateY = useSpring(useTransform(x, [0, 1], [-14, 14]), spring)

// useMotionTemplate builds a CSS string from motion values
// without a re-render on every pointer move.
const glare = useMotionTemplate\`radial-gradient(
  circle at \${gx} \${gy},
  hsl(var(--primary) / 0.22), transparent 55%)\`

<motion.div style={{ rotateX, rotateY, transformPerspective: 900 }}>
  <motion.div style={{ background: glare }} className="absolute inset-0" />
</motion.div>`,
    Component: TiltCard,
  },
  {
    id: 'swipe',
    group: 'Advanced',
    label: 'Swipe deck',
    note: 'Dismissal takes distance OR velocity. A quick flick that only travels 40px is unmistakably a dismissal; demanding the full distance every time makes the deck feel like it is resisting you.',
    code: `const x = useMotionValue(0)
const rotate = useTransform(x, [-180, 180], [-16, 16])

<motion.div
  drag="x"
  style={{ x, rotate }}
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.7}
  onDragEnd={(_, info) => {
    if (Math.abs(info.offset.x) > 110 ||
        Math.abs(info.velocity.x) > 550) dismiss()
  }}
/>

// Cards render back-to-front, so the top card is last
// in the DOM and needs no z-index bookkeeping.`,
    Component: SwipeDeck,
  },
  {
    id: 'expand',
    group: 'Advanced',
    label: 'Shared-element expand',
    note: 'Same layoutId on the tile and the panel: framer measures both and interpolates, so it is one element travelling rather than two crossfading. Escape closes it — an overlay with only a click-outside is a trap for keyboard users.',
    code: `<motion.button layoutId={\`cell-\${c.id}\`} onClick={() => setOpen(c.id)}>
  <motion.p layoutId={\`label-\${c.id}\`}>{c.label}</motion.p>
</motion.button>

<AnimatePresence>
  {cell && (
    <motion.div layoutId={\`cell-\${cell.id}\`}>
      <motion.p layoutId={\`label-\${cell.id}\`}>{cell.label}</motion.p>
      {/* Body fades in late, so it doesn't stretch
          during the layout interpolation. */}
      <motion.p animate={{ opacity: 1, transition: { delay: 0.12 } }} />
    </motion.div>
  )}
</AnimatePresence>`,
    Component: SharedExpand,
  },
  {
    id: 'velocity',
    group: 'Advanced',
    label: 'Scroll-velocity marquee',
    note: 'Scrolling backwards reverses the marquee, not just slows it. Speed-only response reads as a glitch; a direction flip reads as the row answering the scroll.',
    code: `const scrollVelocity = useVelocity(scrollY)
// Raw velocity is spiky enough to look like a fault.
const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
const factor = useTransform(smooth, [-1600, 0, 1600], [-4, 1, 4],
                            { clamp: false })

useAnimationFrame((_, delta) => {
  let move = 2.4 * (delta / 1000) * direction.current
  if (factor.get() < 0) direction.current = -1
  else if (factor.get() > 0) direction.current = 1
  move += move * Math.abs(factor.get())
  baseX.set(wrap(-25, 0, baseX.get() + move))
})

// wrap() over one repetition's width; the row is
// duplicated 4x so a copy always covers the gap.`,
    Component: VelocityMarquee,
  },
  {
    id: 'scrollwords',
    group: 'Advanced',
    label: 'Scroll-linked text',
    note: "The offset ends at 'end 0.55', so the sentence is fully lit while it is still comfortably on screen — finishing at 'end start' means it only completes as it leaves.",
    code: `const { scrollYProgress } = useScroll({
  target: ref,
  offset: ['start 0.9', 'end 0.55'],
})

// One component per word — useTransform is a hook,
// so it cannot be called inside the map.
const Word = ({ progress, range }) => {
  const opacity = useTransform(progress, range, [0.16, 1])
  return <motion.span style={{ opacity }} />
}

words.map((w, i) => (
  <Word key={i} progress={scrollYProgress}
        range={[i / words.length, (i + 1) / words.length]} />
))`,
    Component: ScrollWords,
  },

  /* ---------------------------- Backgrounds ---------------------------- */
  {
    id: 'topography',
    group: 'Backgrounds',
    label: 'Topography',
    full: true,
    note: 'The noise field read as terrain and traced at eleven elevations by marching squares. Crossings are interpolated along each cell edge, not snapped to it — snapping gives staircases at any grid resolution you can afford; interpolating gives smooth curves from a coarse one. Move the pointer and it raises a hill.',
    code: `// Sample the field, then trace isolines through it.
for (let y = 0; y < rows; y++)
  for (let x = 0; x < cols; x++)
    f[y * cols + x] = fbm(x * 0.061, y * 0.061 + t * 0.09, 3, 17)

for (let i = 0; i < LEVELS; i++) {
  const level = -0.75 + (i / (LEVELS - 1)) * 1.5
  const segs = contourSegments(f, cols, rows, level)

  // One path per level, not per segment. Eleven strokes
  // a frame instead of a few thousand is the difference
  // between holding 60fps and not.
  ctx.beginPath()
  for (let s = 0; s < segs.length; s += 4) {
    ctx.moveTo(segs[s] * GRID, segs[s + 1] * GRID)
    ctx.lineTo(segs[s + 2] * GRID, segs[s + 3] * GRID)
  }
  ctx.stroke()
}

// The ambiguous marching-squares cases are resolved by
// the cell centre; picking arbitrarily makes contours
// cross each other and dead-end mid-field.`,
    Component: Topography,
  },
  {
    id: 'constellation',
    group: 'Backgrounds',
    label: 'Constellation',
    full: true,
    note: 'Node positions are stored normalised 0–1 and scaled at draw time, so a resize rearranges nothing. Storing pixels means every node jumps the moment the panel changes width.',
    code: `// O(n²) over 64 nodes is 2,016 pairs — trivial.
// It stops being trivial around 300, which is why the
// count is capped rather than tuned up.
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const d = Math.hypot(ax - b.x * w, ay - b.y * h)
    if (d > LINK_DIST) continue
    ctx.strokeStyle = \`hsl(\${primary} / \${(1 - d / LINK_DIST) * 0.28})\`
    ctx.stroke()
  }
}

// Nodes wrap at the edges rather than bouncing —
// a bounce puts a hard edge on an unbounded field.`,
    Component: Constellation,
  },
  {
    id: 'flow',
    group: 'Backgrounds',
    label: 'Flow field',
    full: true,
    note: 'Particles are advected by value noise from lib/noise.ts, and respawn on a lifespan as well as on leaving the frame — without that they all settle into the same few attractor streams and the rest of the canvas empties out.',
    code: `// Trails by painting the background at low alpha instead
// of clearing: cheaper than a per-particle history, and
// it fades old strokes on a curve rather than dropping them.
ctx.fillStyle = \`hsl(\${bg} / 0.13)\`
ctx.fillRect(0, 0, w, h)

for (const p of particles) {
  const a = flowAngle(p.x * 0.0032, p.y * 0.0032, t, 21)
  const vx = Math.cos(a) * 46
  const vy = Math.sin(a) * 46
  ctx.moveTo(p.x, p.y)
  ctx.lineTo(p.x += vx * dt, p.y += vy * dt)
  ctx.stroke()
}

// The pointer pushes outward, not inward — attraction
// collapses every particle into one dot in a second.`,
    Component: FlowField,
  },
  {
    id: 'rain',
    group: 'Backgrounds',
    label: 'Digital rain',
    full: true,
    note: 'The trail is the same low-alpha fill trick, so there is no per-column character history to keep. Glyphs are built from code points rather than a literal string, which keeps the source pure ASCII.',
    code: `ctx.fillStyle = \`hsl(\${bg} / 0.16)\`   // the trail
ctx.fillRect(0, 0, w, h)

for (let i = 0; i < cols; i++) {
  const d = drops[i]
  d.y += d.speed * dt          // per-column speed, or it
  if (d.y > h + 40) {          // reads as one falling row
    d.y = -40
    d.speed = 90 + Math.random() * 210
  }
  const glyph = String.fromCharCode(
    0x30a1 + Math.floor(hash2(i, frame >> 2, 31) * 90))
  ctx.fillText(glyph, i * COL_W, d.y)
}`,
    Component: DigitalRain,
  },
  {
    id: 'beams',
    group: 'Backgrounds',
    label: 'Beam grid',
    full: true,
    note: 'A transform percentage resolves against the element, not its container — so the beam spans the full height and carries a short band, rather than being a 6rem bar that would travel 6rem and never cross the panel. The radial mask is what makes the grid read as a surface instead of a texture that stops.',
    code: `<div style={{
  backgroundImage:
    'linear-gradient(hsl(var(--border) / .9) 1px, transparent 1px),' +
    'linear-gradient(90deg, hsl(var(--border) / .9) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
  maskImage:
    'radial-gradient(ellipse at 50% 40%, black 25%, transparent 78%)',
}} />

// Full height, band in the top 18%, translated a full
// container height each way.
<motion.div
  initial={{ y: '-100%' }} animate={{ y: '100%' }}
  transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
  style={{ background:
    'linear-gradient(to bottom, transparent 0%,' +
    'hsl(var(--primary) / .9) 9%, transparent 18%)' }}
  className="absolute inset-y-0 w-px"
/>`,
    Component: BeamGrid,
  },
  {
    id: 'waves',
    group: 'Backgrounds',
    label: 'Wave field',
    full: true,
    note: 'The pointer bulge uses a Gaussian falloff. A linear cone leaves a visible crease exactly at the radius, which is the single most common tell of a hand-rolled displacement effect.',
    code: `for (let x = 0; x <= w; x += STEP) {
  let y = baseY + Math.sin(x * 0.011 + t * 1.3 + i * 0.45) * 7

  if (pointer) {
    const d2 = ((x - px) ** 2 + (baseY - py) ** 2) / 5200
    y += Math.sign(baseY - py || 1) * 34 * Math.exp(-d2)
  }

  x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
}

// 20 lines sampled every 7px is ~1,100 points per frame.
// Sampling every pixel buys nothing you can see.`,
    Component: WaveField,
  },
];
