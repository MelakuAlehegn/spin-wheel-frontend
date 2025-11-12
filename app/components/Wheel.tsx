"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";

type Slice = {
  label: string;
  color: string;
};

const DEFAULT_SLICES: Slice[] = [
  { label: "T-shirt", color: "#EF4444" },
  { label: "USB Flash", color: "#F59E0B" },
  { label: "Cap", color: "#10B981" },
  { label: "Arif Try!", color: "#3B82F6" },
  { label: "Arif Luck Next Time!", color: "#8B5CF6" },
  { label: "Stay Arif!", color: "#EC4899" },
];

const fullRotation = 360;

function indexToAngle(index: number, total: number): number {
  const sliceAngle = fullRotation / total;
  // Geometry: slice center angle in SVG coords is -90 + i*slice + slice/2.
  // We rotate the wheel by R so that (center + R) == -90 (top pointer).
  // Therefore R = -90 - (-90 + i*slice + slice/2) = -i*slice - slice/2.
  const raw = -index * sliceAngle - sliceAngle / 2;
  // Normalize to [0,360)
  return ((raw % fullRotation) + fullRotation) % fullRotation;
}

export function Wheel({
  slices = DEFAULT_SLICES,
  onSpinEnd,
}: {
  slices?: Slice[];
  onSpinEnd?: (index: number, slice: Slice) => void;
}) {
  const controls = useAnimationControls();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ index: number; slice: Slice; isPrize: boolean } | null>(
    null
  );
  const [allPrizesGone, setAllPrizesGone] = useState(false);
  const sliceAngle = fullRotation / slices.length;
  const wheelRef = useRef<HTMLDivElement | null>(null);

  // Check status on mount
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.allPrizesGone) {
          setAllPrizesGone(true);
        }
      })
      .catch(() => {
        // Ignore errors, backend might not be running
      });
  }, []);

  const paths = useMemo(() => {
    const r = 156; // radius tuned to fit inside 300x300 with border
    const cx = 0;
    const cy = 0;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const makePath = (startDeg: number, endDeg: number) => {
      const x1 = cx + r * Math.cos(toRad(startDeg));
      const y1 = cy + r * Math.sin(toRad(startDeg));
      const x2 = cx + r * Math.cos(toRad(endDeg));
      const y2 = cy + r * Math.sin(toRad(endDeg));
      const largeArcFlag = endDeg - startDeg <= 180 ? 0 : 1;
      return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };
    return slices.map((_, i) => {
      const start = -90 + i * sliceAngle; // start from top
      const end = start + sliceAngle;
      return makePath(start, end);
    });
  }, [slices, sliceAngle]);

  async function spin(toIndex?: number) {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    let index = typeof toIndex === "number" ? toIndex : 0;
    let label = "";
    let isPrize = false;
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 409) {
        const body = await res.json();
        setSpinning(false);
        setResult({ index: 0, slice: { label: body.message ?? "You Have Already Spun", color: "#9CA3AF" }, isPrize: false });
        return;
      }
      if (!res.ok) throw new Error("Spin failed");
      const data = await res.json();
      index = data.sliceIndex;
      label = data.label;
      isPrize = data.prize || false;
      if (data.allPrizesGone) {
        setAllPrizesGone(true);
      }
    } catch (_e) {
      // fallback: random index if backend not running
      index = Math.floor(Math.random() * slices.length);
      label = slices[index].label;
      isPrize = false;
    }

    const turns = 5; // full extra spins for flair
    const targetAngleCenter = indexToAngle(index, slices.length);
    // Add small random jitter within the slice so the pointer does not land exactly on edges
    const sliceSize = fullRotation / slices.length;
    const marginDeg = 4; // do not get too close to borders
    const maxJitter = Math.max(0, sliceSize / 2 - marginDeg);
    const jitter = (Math.random() * (2 * maxJitter)) - maxJitter; // [-maxJitter, +maxJitter]
    const targetAngle = targetAngleCenter + jitter;
    const finalRotation = turns * fullRotation + (targetAngle % 360);

    await controls.start({
      rotate: finalRotation,
      transition: { type: "tween", duration: 3, ease: [0.12, 0.8, 0.22, 1] },
    });

    const picked = { index, slice: slices[index] ?? { label, color: "#374151" }, isPrize };
    setResult(picked);
    setSpinning(false);
    onSpinEnd?.(picked.index, picked.slice);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Pointer */}
        <div
          aria-hidden
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#079964] drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <motion.div
          ref={wheelRef}
          className="rounded-full border-4 border-[#e8fdf3] shadow-xl bg-white overflow-hidden"
          style={{ width: 320, height: 320 }}
          animate={controls}
          initial={{ rotate: 0 }}
        >
          <svg
            viewBox="-150 -150 300 300"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            shapeRendering="geometricPrecision"
            role="img"
            aria-label="Prize wheel"
          >
            {/* Outer circle background to ensure perfectly round edge */}
            <circle cx="0" cy="0" r="149" fill="#ffffff" />
            {paths.map((d, i) => (
              <path key={i} d={d} fill={slices[i].color} />
            ))}
            {slices.map((slice, i) => {
              const angle = -90 + i * sliceAngle + sliceAngle / 2;
              const rad = (angle * Math.PI) / 180;
              const r = 95;
              const x = r * Math.cos(rad);
              const y = r * Math.sin(rad);
              return (
                <text
                  key={slice.label + i}
                  x={x}
                  y={y}
                  fill="#fff"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${angle}, ${x}, ${y})`}
                >
                  {slice.label}
                </text>
              );
            })}
            {/* Center cap */}
            <circle cx="0" cy="0" r="25" fill="#079964" />
            <text x="0" y="2" fill="#fff" fontSize="11" textAnchor="middle" fontWeight="600">
              Spin
            </text>
          </svg>
        </motion.div>
      </div>

      {allPrizesGone ? (
        <div className="text-center rounded-xl border border-[#e8fdf3] bg-[#e8fdf3] p-6 shadow-sm">
          <p className="text-lg font-semibold text-[#079964]">
            All prizes have been claimed!
          </p>
          <p className="text-sm text-[#079964]/70 mt-2">
            Thank you for participating. Play is over.
          </p>
        </div>
      ) : (
        <>
          <button
            className="rounded-lg bg-[#079964] px-8 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#057852] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#079964]"
            onClick={() => spin()}
            disabled={spinning}
          >
            {spinning ? "Spinning..." : "Spin the Wheel"}
          </button>

          {result && (
            <div className={`rounded-xl border-2 px-8 py-6 text-center shadow-lg ${
              result.isPrize 
                ? "border-[#079964] bg-gradient-to-br from-[#e8fdf3] to-white" 
                : "border-[#e8fdf3] bg-white"
            }`}>
              {result.isPrize ? (
                <>
                  <div className="mb-3 text-4xl">🎉</div>
                  <p className="text-lg font-semibold text-[#079964] mb-2">
                    Congratulations! You Won!
                  </p>
                  <p className="text-2xl font-bold text-[#079964] mb-1">
                    {result.slice.label}
                  </p>
                  {/* <p className="text-sm text-[#079964]/70 mt-2">
                    Claim your prize at the event booth
                  </p> */}
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-[#079964] mb-2">
                    {result.slice.label}
                  </p>
                  <p className="text-sm text-[#079964]/70">
                    Thanks for playing! Better luck next time
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Wheel;


