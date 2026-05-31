"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Check, Maximize2, Minimize2, Bot } from "lucide-react";
import CanvasPage from "./canvas/CanvasPage";
import LayersPanel from "./panels/LayersPanel";
import PropertiesPanel from "./panels/PropertiesPanel";
import { genId } from "@/lib/utils";
import { isAiUsable } from "@/lib/ai";
import type { AiConversation, AiUsageRecord, AppData, Book, CoverDesign, CoverElement, CoverPage, PageBackground, Theme } from "@/lib/types";
import CoverAIPanel from "./CoverAIPanel";
import { createDefaultCoverDesign } from "@/lib/utils";

// Base page dimensions (pixels at 100% zoom)
const PAGE_W = 300;
const PAGE_H = 450;
const SPINE_W = 44;

interface Props {
  book:     Book;
  onSave:   (design: CoverDesign) => void;
  onClose:  () => void;
  notify:   (msg: string, type?: "ok" | "err") => void;
  data:     AppData;
  theme:    Theme;
  onSaveAiConversation: (c: AiConversation) => void;
  onSaveAiUsage: (u: AiUsageRecord) => void;
  onOpenProvidersSettings: () => void;
}

type PageKey = "front" | "spine" | "back";

const PAGES: { key: PageKey; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "spine", label: "Spine" },
  { key: "back",  label: "Back"  },
];

export default function CoverEditorModal({ book, onSave, onClose, notify, data, theme: appTheme, onSaveAiConversation, onSaveAiUsage, onOpenProvidersSettings }: Props) {
  const init = useRef(book.coverDesign ?? createDefaultCoverDesign(book));

  const [design, setDesign]         = useState<CoverDesign>(init.current);
  const designRef = useRef(design);
  designRef.current = design;
  const [showCoverAi, setShowCoverAi] = useState(false);
  const historyRef                  = useRef<CoverDesign[]>([init.current]);
  const histIdxRef                  = useRef(0);

  const [activeKey, setActiveKey]   = useState<PageKey>("front");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [zoom, setZoom]             = useState(1.0);
  const [snapGuides, setSnapGuides] = useState({ x: false, y: false });
  const [fullscreen, setFullscreen] = useState(false);

  const activePage = design[activeKey];
  const selectedEl = activePage.elements.find(e => e.id === selectedId) ?? null;

  // ── History ──
  const commit = useCallback((d: CoverDesign) => {
    setDesign(d);
    const hist = historyRef.current.slice(0, histIdxRef.current + 1);
    hist.push(d);
    if (hist.length > 60) hist.shift();
    historyRef.current = hist;
    histIdxRef.current = hist.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (histIdxRef.current > 0) { histIdxRef.current--; setDesign(historyRef.current[histIdxRef.current]); }
  }, []);
  const redo = useCallback(() => {
    if (histIdxRef.current < historyRef.current.length - 1) { histIdxRef.current++; setDesign(historyRef.current[histIdxRef.current]); }
  }, []);

  // ── Element helpers ──
  const withPage = useCallback((fn: (p: CoverPage) => CoverPage): CoverDesign =>
    ({ ...design, [activeKey]: fn(design[activeKey]) }),
  [design, activeKey]);

  const updateElementLive = useCallback((id: string, u: Partial<CoverElement>) => {
    setDesign(d => ({
      ...d,
      [activeKey]: {
        ...d[activeKey],
        elements: d[activeKey].elements.map(el => el.id === id ? { ...el, ...u } : el),
      },
    }));
  }, [activeKey]);

  const commitElementUpdate = useCallback((id: string, u: Partial<CoverElement>) => {
    setDesign(d => {
      const nd: CoverDesign = {
        ...d,
        [activeKey]: {
          ...d[activeKey],
          elements: d[activeKey].elements.map(el => el.id === id ? { ...el, ...u } : el),
        },
      };
      const hist = historyRef.current.slice(0, histIdxRef.current + 1);
      hist.push(nd);
      if (hist.length > 60) hist.shift();
      historyRef.current = hist;
      histIdxRef.current = hist.length - 1;
      return nd;
    });
  }, [activeKey]);

  const addElement = useCallback((el: CoverElement) => {
    const maxZ = activePage.elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const nd = withPage(p => ({ ...p, elements: [...p.elements, { ...el, zIndex: maxZ + 1 }] }));
    commit(nd);
    setSelectedId(el.id);
  }, [activePage, withPage, commit]);

  const deleteElement = useCallback((id: string) => {
    commit(withPage(p => ({ ...p, elements: p.elements.filter(e => e.id !== id) })));
    setSelectedId(null);
  }, [withPage, commit]);

  const reorderElement = useCallback((id: string, dir: "up" | "down") => {
    const sorted = [...activePage.elements].sort((a, b) => b.zIndex - a.zIndex);
    const idx = sorted.findIndex(e => e.id === id);
    if (dir === "up"   && idx === 0) return;
    if (dir === "down" && idx === sorted.length - 1) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const z1 = sorted[idx].zIndex;
    const z2 = sorted[swapIdx].zIndex;
    const nd = withPage(p => ({
      ...p,
      elements: p.elements.map(e =>
        e.id === sorted[idx].id      ? { ...e, zIndex: z2 }
        : e.id === sorted[swapIdx].id ? { ...e, zIndex: z1 }
        : e
      ),
    }));
    commit(nd);
  }, [activePage, withPage, commit]);

  const updateBackground = useCallback((u: Partial<PageBackground>) => {
    commit(withPage(p => ({ ...p, background: { ...p.background, ...u } })));
  }, [withPage, commit]);

  const updateElAndCommit = useCallback((u: Partial<CoverElement>) => {
    if (!selectedId) return;
    commitElementUpdate(selectedId, u);
  }, [selectedId, commitElementUpdate]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && editingId !== selectedId) {
        deleteElement(selectedId);
      }
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
        if ((e.key === "y") || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
        if (e.key === "d" && selectedId) {
          e.preventDefault();
          const el = activePage.elements.find(e => e.id === selectedId);
          if (el) addElement({ ...el, id: genId(), x: el.x + 3, y: el.y + 3 });
        }
      }
      // Nudge with arrow keys
      if (selectedId && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp"   ? -step : e.key === "ArrowDown"  ? step : 0;
        const el = activePage.elements.find(e => e.id === selectedId);
        if (el) commitElementUpdate(selectedId, { x: Math.max(0, el.x + dx / 100 * 100), y: Math.max(0, el.y + dy / 100 * 100) });
      }
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [selectedId, editingId, activePage, deleteElement, undo, redo, addElement, commitElementUpdate]);

  // ── Canvas pixel dims ──
  const pw = (activeKey === "spine" ? SPINE_W : PAGE_W) * zoom;
  const ph = PAGE_H * zoom;

  const save = () => { onSave(design); notify("Cover saved!", "ok"); onClose(); };

  const applyDesignFromAi = useCallback(
    (d: CoverDesign) => {
      commit(d);
    },
    [commit]
  );

  const canUndo = histIdxRef.current > 0;
  const canRedo = histIdxRef.current < historyRef.current.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      fontFamily: "var(--ui-font)",
    }}>
      {/* ── Top bar ── */}
      <div style={{
        height: 52, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 0,
        borderBottom: "1px solid var(--brd)",
        background: "var(--surf)",
        padding: "0 14px",
      }}>
        <button className="ibtn tip" data-tip="Close editor" onClick={onClose} style={{ marginRight: 8 }}>
          <ArrowLeft size={16}/>
        </button>
        <span style={{ fontFamily: "var(--ed-font)", fontWeight: 700, fontSize: 16, color: "var(--txt)", marginRight: 20 }}>
          Cover Designer
        </span>

        {/* Page tabs */}
        <div style={{ display: "flex", gap: 2, marginRight: "auto" }}>
          {PAGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveKey(key); setSelectedId(null); }}
              style={{
                padding: "6px 18px", borderRadius: 8, border: "none",
                background: activeKey === key ? "var(--acc)" : "transparent",
                color: activeKey === key ? "#fff" : "var(--txt-m)",
                fontWeight: activeKey === key ? 700 : 400,
                fontSize: 13, cursor: "pointer", transition: "all 0.14s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tools */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button className="ibtn tip" data-tip="Undo (Ctrl+Z)"       onClick={undo} style={{ opacity: canUndo ? 1 : 0.35 }}><Undo2 size={15}/></button>
          <button className="ibtn tip" data-tip="Redo (Ctrl+Y)"       onClick={redo} style={{ opacity: canRedo ? 1 : 0.35 }}><Redo2 size={15}/></button>

          <div style={{ width: 1, height: 20, background: "var(--brd)", margin: "0 4px" }}/>

          <button className="ibtn tip" data-tip="Zoom out" onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} style={{ opacity: zoom <= 0.4 ? 0.35:1 }}><ZoomOut size={15}/></button>
          <span style={{ fontSize: 12, color: "var(--txt-m)", minWidth: 38, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button className="ibtn tip" data-tip="Zoom in"  onClick={() => setZoom(z => Math.min(2.5, z + 0.15))} style={{ opacity: zoom >= 2.5 ? 0.35:1 }}><ZoomIn size={15}/></button>
          <button className="ibtn tip" data-tip="Fit to screen" onClick={() => setZoom(1.0)} style={{ fontSize: 11, width: "auto", padding: "0 8px" }}>100%</button>

          <div style={{ width: 1, height: 20, background: "var(--brd)", margin: "0 4px" }}/>

          <button className="ibtn tip" data-tip={fullscreen ? "Exit fullscreen" : "Fullscreen canvas"} onClick={() => setFullscreen(f => !f)}>
            {fullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}
          </button>

          <button
            className={`ibtn tip${showCoverAi ? " on" : ""}`}
            data-tip={
              isAiUsable(data)
                ? "AI assistant for cover"
                : "Configure AI in Settings to use cover assistant"
            }
            onClick={() => {
              if (!isAiUsable(data)) {
                notify("Enable AI and add a provider in Settings first.", "err");
                onOpenProvidersSettings();
                return;
              }
              setShowCoverAi((s) => !s);
            }}
            style={{ marginLeft: 4, opacity: isAiUsable(data) ? 1 : 0.55 }}
          >
            <Bot size={15} />
          </button>

          <button className="btn btn-primary" style={{ marginLeft: 8, padding: "7px 18px", fontSize: 13 }} onClick={save}>
            <Check size={14}/> Save Cover
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Left panel */}
        {!fullscreen && (
          <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid var(--brd)", background: "var(--surf)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <LayersPanel
              page={activePage}
              pageKey={activeKey}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAddElement={addElement}
              onUpdateElement={commitElementUpdate}
              onDeleteElement={deleteElement}
              onReorder={reorderElement}
            />
          </div>
        )}

        {/* Canvas area */}
        <div
          data-canvas
          style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "repeating-conic-gradient(#888 0% 25%, #666 0% 50%) 0 0 / 20px 20px",
            padding: "40px 60px",
          }}
          onClick={() => setSelectedId(null)}
        >
          <div style={{ position: "relative" }}>
            {/* Snap guide lines */}
            {snapGuides.x && (
              <div style={{ position:"absolute", left:"50%", top:-20, bottom:-20, width:1, background:"rgba(0,170,255,0.7)", zIndex:9999, pointerEvents:"none" }}/>
            )}
            {snapGuides.y && (
              <div style={{ position:"absolute", top:"50%", left:-20, right:-20, height:1, background:"rgba(0,170,255,0.7)", zIndex:9999, pointerEvents:"none" }}/>
            )}

            {/* Shadow + label */}
            <div style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)", borderRadius: 2 }}>
              <CanvasPage
                page={activePage}
                pw={pw} ph={ph}
                selectedId={selectedId}
                editingId={editingId}
                onSelect={(id) => { setSelectedId(id); if (id === null) setEditingId(null); }}
                onUpdateLive={updateElementLive}
                onCommit={commitElementUpdate}
                onEditingChange={setEditingId}
                onSnapGuides={setSnapGuides}
              />
            </div>

            {/* Page label */}
            <p style={{ textAlign:"center", marginTop:10, fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              {activeKey === "spine" ? `Spine — ${SPINE_W * zoom | 0}×${ph | 0}px` : `${activeKey} — ${pw | 0}×${ph | 0}px`}
            </p>
          </div>
        </div>

        {/* Right panel */}
        {!fullscreen && (
          <div style={{ width: 280, flexShrink: 0, borderLeft: "1px solid var(--brd)", background: "var(--surf)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding:"12px 14px 0", borderBottom:"1px solid var(--brd)", flexShrink:0 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--txt-f)", marginBottom:10 }}>
                {selectedEl ? `${selectedEl.name || selectedEl.type}` : "Background"}
              </p>
            </div>
            <div style={{ flex:1, overflow:"hidden" }}>
              <PropertiesPanel
                selected={selectedEl}
                background={activePage.background}
                onUpdate={(u) => { if (selectedId) updateElementLive(selectedId, u); }}
                onCommit={updateElAndCommit}
                onBgUpdate={updateBackground}
              />
            </div>
          </div>
        )}

        {showCoverAi && !fullscreen && (
          <CoverAIPanel
            data={data}
            theme={appTheme}
            book={book}
            activePage={activeKey}
            getDesign={() => designRef.current}
            onApplyDesign={applyDesignFromAi}
            notify={notify}
            onSaveAiConversation={onSaveAiConversation}
            onSaveAiUsage={onSaveAiUsage}
            onClose={() => setShowCoverAi(false)}
            onOpenProvidersSettings={onOpenProvidersSettings}
          />
        )}
      </div>

      {/* Status bar */}
      <div style={{ height:26, flexShrink:0, borderTop:"1px solid var(--brd)", background:"var(--surf)", display:"flex", alignItems:"center", padding:"0 14px", gap:16 }}>
        <span style={{ fontSize:10, color:"var(--txt-f)" }}>
          {activePage.elements.length} element{activePage.elements.length !== 1 ? "s" : ""} on {activeKey} cover
        </span>
        {selectedEl && (
          <span style={{ fontSize:10, color:"var(--txt-f)" }}>
            Selected: <strong style={{ color:"var(--txt-m)" }}>{selectedEl.name || selectedEl.type}</strong>
            {" "}— x:{Math.round(selectedEl.x)}% y:{Math.round(selectedEl.y)}%
            {" "}w:{Math.round(selectedEl.w)}% h:{Math.round(selectedEl.h)}%
            {selectedEl.rotation ? ` rot:${Math.round(selectedEl.rotation)}°` : ""}
          </span>
        )}
        <span style={{ fontSize:10, color:"var(--txt-f)", marginLeft:"auto" }}>
          Double-click text to edit · Delete key to remove · Ctrl+D to duplicate · Arrow keys to nudge
        </span>
      </div>
    </div>
  );
}
