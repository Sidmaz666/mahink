"use client";
/**
 * Proper CSS 3D book.
 *
 * Geometry (all faces use z=0 as the FRONT plane):
 *   Front:  z = 0,  facing +Z  (base, no transform)
 *   Spine:  x = 0,  z = 0…-SD, facing -X  → pivot at left edge, rotateY(-90)
 *   Pages:  x = CW, z = 0…-SD, facing +X  → pivot at right edge, rotateY(+90)
 *   Top:    y = 0,  z = 0…-SD, facing -Y  → pivot at top edge,   rotateX(-90)
 *   Bottom: y = CH, z = 0…-SD, facing +Y  → pivot at bottom edge, rotateX(+90)
 *   Back:   z = -SD,            facing -Z  → translateZ(-SD) rotateY(180)
 *
 * The book group is rotated rotateY(-20deg) so the spine shows on the left.
 * marginLeft: SD offsets the group so the spine is inside the scene container.
 */
import { useRef, useEffect } from "react";
import CoverArt from "./CoverArt";
import { buildCoverGradient } from "@/lib/utils";
import type { Book } from "@/lib/types";

const CW = 120;   // cover width
const CH = 168;   // cover height
const SD = 22;    // spine / depth

interface Props {
  book:        Book;
  interactive?: boolean;
}

export default function Book3D({ book, interactive = true }: Props) {
  const groupRef  = useRef<HTMLDivElement>(null);
  const sceneRef  = useRef<HTMLDivElement>(null);
  const cur       = useRef({ x: 5, y: -20 });
  const tgt       = useRef({ x: 5, y: -20 });
  const hovering  = useRef(false);
  const idleT     = useRef(0);

  // ── Spine background (split into non-shorthand to avoid React CSS conflict) ──
  const frontBg = buildCoverGradient(book);
  const spineStyle = (() => {
    const b = book.coverDesign?.spine?.background;
    if (!b) return { backgroundImage: frontBg, backgroundColor: undefined as string | undefined };
    if (b.type === "solid")
      return { backgroundColor: b.solid || "#111", backgroundImage: undefined as string | undefined };
    if (b.type === "image" && b.image)
      return { backgroundImage: `url(${b.image})`, backgroundColor: undefined as string | undefined };
    return {
      backgroundImage: `linear-gradient(180deg,${b.gradientA || "#0f2044"},${b.gradientB || "#1a4480"})`,
      backgroundColor: undefined as string | undefined,
    };
  })();

  useEffect(() => {
    if (!interactive) return;
    let raf: number;

    const tick = () => {
      // Idle sway while not hovered
      if (!hovering.current) {
        idleT.current += 0.006;
        tgt.current = {
          x:  5 + Math.sin(idleT.current * 0.55) * 4,
          y: -20 + Math.sin(idleT.current)        * 9,
        };
      }
      // Smooth lerp
      cur.current.x += (tgt.current.x - cur.current.x) * 0.08;
      cur.current.y += (tgt.current.y - cur.current.y) * 0.08;

      if (groupRef.current) {
        groupRef.current.style.transform =
          `rotateX(${cur.current.x}deg) rotateY(${cur.current.y}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [interactive]);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    const r  = sceneRef.current.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    tgt.current   = { x: -dy * 22 + 4, y: dx * 32 - 12 };
    hovering.current = true;
  };

  const onMouseLeave = () => {
    hovering.current = false;
    tgt.current = { x: 5, y: -20 };
  };

  // Shared face style
  const face = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    ...extra,
  });

  return (
    <div
      ref={sceneRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        perspective: 900,
        perspectiveOrigin: "50% 45%",
        width:  CW + SD + 10,
        height: CH + 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* ── Book group – offset left so spine sits inside the scene ── */}
      <div
        ref={groupRef}
        style={{
          width:  CW,
          height: CH,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(5deg) rotateY(-20deg)`,
          marginLeft: SD + 6,
          willChange: "transform",
          /* Drop shadow under the whole book */
          filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.55))",
        }}
      >
        {/* ══ FRONT ═══════════════════════════════════════════════ */}
        <div style={face({ inset: 0, overflow: "hidden", borderRadius: "1px 3px 3px 1px" })}>
          <CoverArt book={book} size="card" page="front"/>
          {/* Left-binding shadow */}
          <div style={{ position:"absolute", inset:"0 auto 0 0", width:8,
            background:"linear-gradient(to right,rgba(0,0,0,0.55),transparent)",
            pointerEvents:"none" }}/>
          {/* Top gloss */}
          <div style={{ position:"absolute", inset:"0 0 auto 0", height:"30%",
            background:"linear-gradient(to bottom,rgba(255,255,255,0.07),transparent)",
            pointerEvents:"none" }}/>
        </div>

        {/* ══ SPINE (left face) ════════════════════════════════════
            pivot at left edge of the book (transformOrigin: 0% 50%)
            rotateY(-90°) swings it to face -X                        */}
        <div style={face({
          left: 0, top: 0,
          width: SD, height: CH,
          transformOrigin: "0% 50%",
          transform: "rotateY(-90deg)",
          backgroundImage:    spineStyle.backgroundImage,
          backgroundColor:    spineStyle.backgroundColor,
          backgroundSize:     "cover",
          backgroundPosition: "left center",
          backgroundRepeat:   "no-repeat",
          overflow: "hidden",
        })}>
          {/* Spine lighting (darker on edges, lighter center) */}
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to right,rgba(0,0,0,0.45),rgba(0,0,0,0.15) 40%,rgba(255,255,255,0.04) 60%,rgba(0,0,0,0.25))",
            pointerEvents:"none" }}/>
        </div>

        {/* ══ PAGES (right edge) ══════════════════════════════════
            pivot at right edge; rotateY(+90°) swings to face +X     */}
        <div style={face({
          right: 0, top: 0,
          width: SD, height: CH,
          transformOrigin: "100% 50%",
          transform: "rotateY(90deg)",
          overflow: "hidden",
          background:
            "repeating-linear-gradient(to bottom,#f8f4eb,#ece6d4 2px,#f8f4eb 2px,#f8f4eb 5px)",
        })}>
          {/* Pages edge shading */}
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to right,rgba(0,0,0,0.08),transparent 50%,rgba(0,0,0,0.04))",
            pointerEvents:"none" }}/>
        </div>

        {/* ══ TOP edge ════════════════════════════════════════════
            pivot at top edge; rotateX(-90°) swings to face -Y (up)  */}
        <div style={face({
          left: 0, top: 0,
          width: CW, height: SD,
          transformOrigin: "50% 0%",
          transform: "rotateX(-90deg)",
          background:"linear-gradient(to bottom,#ede8da,#ddd6c4)",
        })}/>

        {/* ══ BOTTOM edge ═════════════════════════════════════════ */}
        <div style={face({
          left: 0, bottom: 0,
          width: CW, height: SD,
          transformOrigin: "50% 100%",
          transform: "rotateX(90deg)",
          background:"#d8d1be",
        })}/>

        {/* ══ BACK ════════════════════════════════════════════════
            placed at z=-SD, flipped 180° to face -Z (the back)      */}
        <div style={face({
          inset: 0,
          transform: `translateZ(-${SD}px) rotateY(180deg)`,
          overflow: "hidden",
          borderRadius: "3px 1px 1px 3px",
        })}>
          <CoverArt book={book} size="card" page="back"/>
        </div>
      </div>
    </div>
  );
}
