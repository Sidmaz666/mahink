"use client";

import { useState } from "react";
import {
  X, Download, RefreshCw, Check, Circle,
  FileText, Image, ShieldCheck, Volume2,
  ChevronDown, AlignLeft, Code,
} from "lucide-react";
import CoverArt from "../ui/CoverArt";
import { exportPDF }         from "@/lib/exportPdf";
import { exportCoverPage, exportCoverSpread, exportKdpCoverPdf, exportCoverZip } from "@/lib/exportCover";
import { exportHtmlManuscript, exportMarkdownManuscript } from "@/lib/exportText";
import { exportAudiobookAudio, exportAudiobookVideo, type AudiobookExportProgress } from "@/lib/exportAudiobook";
import { validateKdpCompliance } from "@/lib/kdp";
import { countWords } from "@/lib/utils";
import type { Book, Chapter, AppSettings, Theme, ExportOptions, KdpValidationResult } from "@/lib/types";

interface Props {
  book:     Book;
  chapters: Chapter[];
  theme:    Theme;
  settings: AppSettings;
  onClose:  () => void;
  notify:   (msg: string, type?: "ok" | "err") => void;
  validation: KdpValidationResult | null;
  onSaveValidation: (validation: KdpValidationResult) => void;
}

const DEFAULT_OPTIONS: ExportOptions = {
  template: "novel", paperSize: "a5",
  includeTitle: true, includeToc: true, includePageNumbers: true,
  authorName: "", fontSize: 11, lineHeight: 1.65,
  bleed: false, mirroredMargins: true, target: "paperback", exportVariant: "kdp_print",
  dropCap: true, justifyText: true, hyphenation: true, paragraphIndent: 1.5,
  sceneBreakOrnament: "none", letterSpacing: 0, widowOrphanControl: true,
  colorMode: "color",
};

type Tab = "pdf" | "covers" | "audiobook" | "validation";

export default function ExportModal({
  book,
  chapters,
  theme,
  settings,
  onClose,
  notify,
  validation,
  onSaveValidation,
}: Props) {
  const [opts, setOpts]   = useState<ExportOptions>({ ...DEFAULT_OPTIONS, authorName: settings.authorName || "" });
  const [loading, setLoading]     = useState<string | null>(null);
  const [tab, setTab]     = useState<Tab>("pdf");
  const [exportOpen, setExportOpen] = useState(false);

  const update = (u: Partial<ExportOptions>) => setOpts((x) => ({ ...x, ...u }));
  const totalWords = chapters.reduce((a, c) => a + countWords(c.content), 0);

  const handlePdf = async () => {
    setLoading("pdf");
    try {
      await exportPDF(book, chapters, opts, settings);
      notify("PDF exported!", "ok");
    } catch (e) {
      notify(`Export failed: ${(e as Error).message}`, "err");
    }
    setLoading(null);
  };

  const handleCover = async (what: "front" | "spine" | "back" | "spread" | "zip") => {
    setLoading(what);
    try {
      if (what === "zip") await exportCoverZip(book);
      else if (what === "spread") await exportCoverSpread(book);
      else                   await exportCoverPage(book, what);
      notify(`${what === "zip" ? "ZIP" : what} exported!`, "ok");
    } catch (e) {
      notify(`Export failed: ${(e as Error).message}`, "err");
    }
    setLoading(null);
  };

  const handleKdpCoverPdf = async () => {
    setLoading("cover-pdf");
    try {
      await exportKdpCoverPdf(book, chapters);
      notify("Print-ready full cover PDF exported!", "ok");
    } catch (e) {
      notify(`Export failed: ${(e as Error).message}`, "err");
    }
    setLoading(null);
  };

  const [audiobookProgress, setAudiobookProgress] = useState<string | null>(null);
  const [audiobookPct, setAudiobookPct] = useState(0);

  const handleAudiobookAudio = async () => {
    setLoading("audiobook-audio");
    setAudiobookProgress("Preparing cover...");
    setAudiobookPct(5);
    try {
      await exportAudiobookAudio(book, chapters, (p) => {
        setAudiobookPct(p.pct);
        setAudiobookProgress(p.message ?? p.phase);
      });
      setAudiobookPct(100);
      setAudiobookProgress("Done! Downloading...");
      notify("Audiobook (audio) exported!", "ok");
    } catch (e) {
      notify(`Export failed: ${(e as Error).message}`, "err");
    }
    setLoading(null);
    setTimeout(() => { setAudiobookProgress(null); setAudiobookPct(0); }, 2000);
  };

  const handleAudiobookVideo = async () => {
    setLoading("audiobook-video");
    setAudiobookProgress("Preparing cover...");
    setAudiobookPct(5);
    try {
      await exportAudiobookVideo(book, chapters, (p) => {
        setAudiobookPct(p.pct);
        setAudiobookProgress(p.message ?? p.phase);
      });
      setAudiobookPct(100);
      setAudiobookProgress("Done! Downloading...");
      notify("Audiobook (video) exported!", "ok");
    } catch (e) {
      notify(`Export failed: ${(e as Error).message}`, "err");
    }
    setLoading(null);
    setTimeout(() => { setAudiobookProgress(null); setAudiobookPct(0); }, 2000);
  };

  const handleValidation = () => {
    const result = validateKdpCompliance(book, chapters);
    onSaveValidation(result);
    notify(result.passed ? "Print compliance check passed." : "Print compliance check updated.", result.passed ? "ok" : "err");
  };

  const toggleOptions: Array<[keyof Pick<ExportOptions,"includeTitle"|"includeToc"|"includePageNumbers">, string]> = [
    ["includeTitle",       "Cover Page"],
    ["includeToc",         "Table of Contents"],
    ["includePageNumbers", "Page Numbers"],
  ];

  const hasCoverDesign = !!book.coverDesign;

  return (
    <div className="modal-wrap" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal" 
        style={{ 
          maxWidth: 720, 
          width: "95%", 
          maxHeight: "85vh", 
          display: "flex", 
          flexDirection: "column",
          padding: 0,
          overflow: "visible",
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div style={{ padding: "24px 24px 0 24px", flexShrink: 0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <h2 className="modal-title" style={{ margin:0 }}>Export</h2>
            <button className="ibtn tip" data-tip="Close" onClick={onClose}><X size={16}/></button>
          </div>

          <div style={{ display:"flex", gap:14, alignItems:"center", padding:"12px 16px", background:theme.surfaceAlt, borderRadius:12, marginBottom:18 }}>
            <CoverArt book={book} size="small"/>
            <div>
              <p style={{ fontFamily:"var(--ed-font)", fontWeight:700, fontSize:16, color:theme.text }}>{book.title}</p>
              <p style={{ fontSize:12, color:theme.textMuted, marginTop:2 }}>{chapters.length} chapters · {totalWords.toLocaleString()} words</p>
            </div>
          </div>

          <div style={{ display:"flex", gap:4, marginBottom:0, borderBottom:`1px solid ${theme.border}` }}>
            {([["pdf","Interior Export",FileText],["covers","Cover Export",Image],["audiobook","Audiobook",Volume2],["validation","Print Guide",ShieldCheck]] as const).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setTab(key as Tab)}
                style={{ padding:"8px 16px", border:"none", background:"transparent", cursor:"pointer",
                  color: tab===key ? theme.accent : theme.textMuted,
                  fontWeight: tab===key ? 700 : 400, fontSize:13,
                  borderBottom: `2px solid ${tab===key ? theme.accent : "transparent"}`,
                  display:"flex", alignItems:"center", gap:6,
                  transition:"all 0.14s", fontFamily:"var(--ui-font)",
                }}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {tab === "pdf" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label className="lbl">Template</label><select className="inp" value={opts.template} onChange={(e) => update({ template: e.target.value as ExportOptions["template"] })}>{([["novel","Novel / Book"],["poetry","Poetry Collection"],["journal","Journal / Diary"],["essay","Essay / Non-fiction"]] as const).map(([v,l]) => (<option key={v} value={v}>{l}</option>))}</select></div>
                <div><label className="lbl">Export Target</label><select className="inp" value={opts.target} onChange={(e) => update({ target: e.target.value as ExportOptions["target"] })}><option value="paperback">Paperback</option><option value="hardcover">Hardcover</option><option value="ebook">Ebook</option></select></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label className="lbl">Trim / Paper Size</label><select className="inp" value={opts.paperSize} onChange={(e) => update({ paperSize: e.target.value as ExportOptions["paperSize"] })}>{([["a5","A5 — Book"],["a4","A4"],["letter","US Letter"],["trade","6×9 Trade"]] as const).map(([v,l]) => (<option key={v} value={v}>{l}</option>))}</select></div>
                <div><label className="lbl">Export Mode</label><select className="inp" value={opts.exportVariant} onChange={(e) => update({ exportVariant: e.target.value as ExportOptions["exportVariant"] })}><option value="kdp_print">Marketplace Print PDF</option><option value="preview">Preview PDF</option><option value="ebook">Ebook-ready PDF</option><option value="marketing">Marketing Preview</option></select></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label className="lbl">Interior Style</label><select className="inp" value={opts.colorMode ?? "color"} onChange={(e) => update({ colorMode: e.target.value as ExportOptions["colorMode"] })}><option value="color">Color (Default)</option><option value="grayscale">Black & White (Grayscale)</option></select></div>
                <div><label className="lbl">Author Name in PDF</label><input className="inp" value={opts.authorName} onChange={(e) => update({ authorName: e.target.value })}/></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label className="lbl">Font Size — {opts.fontSize}pt</label><input type="range" min={9} max={16} value={opts.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} style={{ width:"100%", accentColor:theme.accent }}/></div>
                <div><label className="lbl">Line Spacing — {opts.lineHeight}×</label><input type="range" min={1.3} max={2.2} step={0.05} value={opts.lineHeight} onChange={(e) => update({ lineHeight: Number(e.target.value) })} style={{ width:"100%", accentColor:theme.accent }}/></div>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {toggleOptions.map(([k, l]) => (
                  <button key={k} onClick={() => update({ [k]: !opts[k] })} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${opts[k] ? theme.accent : theme.border}`, background: opts[k] ? `${theme.accent}20` : "transparent", cursor:"pointer", fontSize:12, color: opts[k] ? theme.accent : theme.textMuted, fontWeight: opts[k] ? 700 : 400, display:"flex", alignItems:"center", gap:6 }}>{opts[k] ? <Check size={11}/> : <Circle size={11}/>}{l}</button>
                ))}
                <button onClick={() => update({ bleed: !opts.bleed })} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${opts.bleed ? theme.accent : theme.border}`, background: opts.bleed ? `${theme.accent}20` : "transparent", cursor:"pointer", fontSize:12, color: opts.bleed ? theme.accent : theme.textMuted, fontWeight: opts.bleed ? 700 : 400, display:"flex", alignItems:"center", gap:6 }}>{opts.bleed ? <Check size={11}/> : <Circle size={11}/>}Interior Bleed</button>
                <button onClick={() => update({ dropCap: !opts.dropCap })} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${opts.dropCap ? theme.accent : theme.border}`, background: opts.dropCap ? `${theme.accent}20` : "transparent", cursor:"pointer", fontSize:12, color: opts.dropCap ? theme.accent : theme.textMuted, fontWeight: opts.dropCap ? 700 : 400, display:"flex", alignItems:"center", gap:6 }}>{opts.dropCap ? <Check size={11}/> : <Circle size={11}/>}Professional Drop Cap</button>
                <button onClick={() => update({ justifyText: !opts.justifyText })} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${opts.justifyText ? theme.accent : theme.border}`, background: opts.justifyText ? `${theme.accent}20` : "transparent", cursor:"pointer", fontSize:12, color: opts.justifyText ? theme.accent : theme.textMuted, fontWeight: opts.justifyText ? 700 : 400, display:"flex", alignItems:"center", gap:6 }}>{opts.justifyText ? <Check size={11}/> : <Circle size={11}/>}Justify Text</button>
                <button onClick={() => update({ hyphenation: !opts.hyphenation })} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${opts.hyphenation ? theme.accent : theme.border}`, background: opts.hyphenation ? `${theme.accent}20` : "transparent", cursor:"pointer", fontSize:12, color: opts.hyphenation ? theme.accent : theme.textMuted, fontWeight: opts.hyphenation ? 700 : 400, display:"flex", alignItems:"center", gap:6 }}>{opts.hyphenation ? <Check size={11}/> : <Circle size={11}/>}Hyphenation</button>
                <button onClick={() => update({ widowOrphanControl: !opts.widowOrphanControl })} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${opts.widowOrphanControl ? theme.accent : theme.border}`, background: opts.widowOrphanControl ? `${theme.accent}20` : "transparent", cursor:"pointer", fontSize:12, color: opts.widowOrphanControl ? theme.accent : theme.textMuted, fontWeight: opts.widowOrphanControl ? 700 : 400, display:"flex", alignItems:"center", gap:6 }}>{opts.widowOrphanControl ? <Check size={11}/> : <Circle size={11}/>}Widow Control</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:4 }}>
                <div>
                  <label className="lbl">Paragraph Indentation — {opts.paragraphIndent ?? 1.5}em</label>
                  <input type="range" min={0} max={3} step={0.1} value={opts.paragraphIndent ?? 1.5} onChange={(e) => update({ paragraphIndent: Number(e.target.value) })} style={{ width:"100%", accentColor:theme.accent }}/>
                </div>
                <div>
                  <label className="lbl">Letter Spacing — {opts.letterSpacing ?? 0}em</label>
                  <input type="range" min={-0.05} max={0.2} step={0.01} value={opts.letterSpacing ?? 0} onChange={(e) => update({ letterSpacing: Number(e.target.value) })} style={{ width:"100%", accentColor:theme.accent }}/>
                </div>
              </div>
              <div>
                <label className="lbl">Scene Break Ornament</label>
                <select className="inp" value={opts.sceneBreakOrnament ?? "none"} onChange={(e) => update({ sceneBreakOrnament: e.target.value as any })} style={{ height:32, fontSize:12 }}>
                  <option value="none">None (Empty Line)</option>
                  <option value="asterism">Asterism (***)</option>
                  <option value="flower">Floral Floret (❦)</option>
                  <option value="bar">Decorative Bar (———)</option>
                </select>
              </div>
              <div style={{ padding:"12px 14px", borderRadius:10, background:theme.surfaceAlt, fontSize:12, color:theme.textMuted, lineHeight:1.65 }}>
                Tips: Finalize trim and interior setting before final export. <strong>Marketplace Print PDF</strong> mode enforces strict professional layout rules.
              </div>
              {validation && (
                 <div style={{ padding:"12px 16px", borderRadius:10, background: validation?.passed ? "#115e59" : theme.surfaceAlt, border: validation?.passed ? "1px solid #14b8a6" : `1px solid ${theme.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                       <div>
                          <p style={{ fontSize:13, fontWeight:700, color: validation?.passed ? "#ccfbfe" : theme.text }}>{validation.passed ? "✓ Print check passed" : "⚠ Print check issues found"}</p>
                          <p style={{ fontSize:11, color: validation?.passed ? "#99f6e4" : theme.textMuted, marginTop:2 }}>{validation.coverSpec.pageCount} pages · {validation.coverSpec.spineWidthIn.toFixed(3)}" spine</p>
                       </div>
                       {!validation.passed && (<button className="btn btn-ghost btn-sm" onClick={() => setTab("validation")} style={{ fontSize:11, background:"rgba(0,0,0,0.1)" }}>View Issues</button>)}
                    </div>
                 </div>
              )}
            </div>
          )}

          {tab === "covers" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {!hasCoverDesign && (
                 <div style={{ padding:"10px 14px", borderRadius:10, background:`${theme.accent}12`, border:`1px solid ${theme.accent}24`, fontSize:12, color:theme.textMuted, lineHeight:1.5 }}>You are using a <strong>Standard Cover</strong>. To create a full wraparound cover, use the <strong>Designer</strong>.</div>
              )}
              <div style={{ display:"flex", gap:10, alignItems:"flex-start", justifyContent:"center" }}>
                <div style={{ textAlign:"center" }}><CoverArt book={book} size="card" page="back"/><span style={{ fontSize:10, color:theme.textFaint }}>Back</span></div>
                <div style={{ textAlign:"center" }}><CoverArt book={book} size="card" page="spine"/><span style={{ fontSize:10, color:theme.textFaint }}>Spine</span></div>
                <div style={{ textAlign:"center" }}><CoverArt book={book} size="card" page="front"/><span style={{ fontSize:10, color:theme.textFaint }}>Front</span></div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button className="btn btn-ghost" onClick={() => handleCover("zip")} disabled={!!loading} style={{ justifyContent:"space-between", border:`1px solid ${theme.border}` }}>
                   <span style={{ display:"flex", alignItems:"center", gap:8 }}>{loading === "zip" ? <RefreshCw size={14} className="spin"/> : <Download size={14}/>} Zip All Covers</span>
                   <span style={{ fontSize:11, color:theme.textFaint }}>ZIP</span>
                </button>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                   <button className="btn btn-ghost" onClick={() => handleCover("back")} disabled={!!loading} style={{ border:`1px solid ${theme.border}`, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0" }}>
                      {loading === "back" ? <RefreshCw size={12} className="spin"/> : <Download size={12}/>} Back
                   </button>
                   <button className="btn btn-ghost" onClick={() => handleCover("spine")} disabled={!!loading} style={{ border:`1px solid ${theme.border}`, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0" }}>
                      {loading === "spine" ? <RefreshCw size={12} className="spin"/> : <Download size={12}/>} Spine
                   </button>
                   <button className="btn btn-ghost" onClick={() => handleCover("front")} disabled={!!loading} style={{ border:`1px solid ${theme.border}`, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 0" }}>
                      {loading === "front" ? <RefreshCw size={12} className="spin"/> : <Download size={12}/>} Front
                   </button>
                </div>
                {hasCoverDesign && (
                  <button className="btn btn-primary" onClick={handleKdpCoverPdf}>Full Print Cover PDF</button>
                )}
              </div>
            </div>
          )}

          {tab === "audiobook" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ padding:"12px 14px", background:theme.surfaceAlt, borderRadius:10, fontSize:12 }}>Select an export format for your audiobook recording:</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button className="btn btn-ghost" onClick={handleAudiobookAudio} disabled={!!loading} style={{ border:`1px solid ${theme.border}` }}>Record Audio Only</button>
                <button className="btn btn-ghost" onClick={handleAudiobookVideo} disabled={!!loading} style={{ border:`1px solid ${theme.border}` }}>Record Video with Cover</button>
              </div>
              {audiobookProgress && (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ height:6, borderRadius:3, background:theme.border, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${audiobookPct}%`, background:theme.accent, borderRadius:3, transition:"width 0.3s" }} />
                  </div>
                  <p style={{ fontSize:12, color:theme.textMuted }}>{audiobookProgress}</p>
                </div>
              )}
            </div>
          )}

          {tab === "validation" && (
             <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
               <div style={{ padding:"14px 16px", borderRadius:12, background: validation?.passed ? "#115e59" : theme.surfaceAlt, border: validation?.passed ? "1px solid #14b8a6" : "none" }}>
                  <p style={{ fontSize:14, fontWeight:700, color: validation?.passed ? "#ccfbfe" : theme.text }}>{validation ? (validation.passed ? "Print compliance passed" : "Compliance check failed") : "No check run yet"}</p>
               </div>
               {validation?.issues?.map((issue, idx) => (
                 <div key={idx} style={{ padding:"12px 14px", border:`1px solid ${issue.severity==="error"?"#fc8181":"#f6ad55"}`, borderRadius:10 }}>{issue.message}</div>
               ))}
               <button className="btn btn-primary" onClick={handleValidation} style={{ alignSelf:"flex-start" }}><ShieldCheck size={14}/> Run New Print Compliance Check</button>
             </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div style={{ padding: "14px 24px 24px 24px", borderTop: `1px solid ${theme.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink: 0 }}>
          <div style={{ display:"flex", gap:8 }}>
            {tab === "pdf" && (
              <button className="btn btn-ghost" onClick={handleValidation} style={{ border:`1px solid ${theme.border}`, background:theme.surfaceAlt }}>
                 <ShieldCheck size={14}/> Run Check
              </button>
            )}
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", position:"relative" }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <div style={{ display:"flex", borderRadius:10, border:`1px solid ${theme.accent}`, position:"relative" }}>
              <button 
                className="btn btn-primary" 
                onClick={handlePdf} 
                disabled={!!loading} 
                style={{ 
                  borderRadius: 0, 
                  border: "none",
                  minWidth: 130, 
                  borderRight: `1px solid rgba(255,255,255,0.2)`,
                  margin: 0,
                  boxShadow: "none",
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                }}
              >
                {loading === "pdf" ? <RefreshCw size={14} className="spin"/> : <FileText size={14}/>}
                {loading === "pdf" ? "Exporting…" : "Export PDF"}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setExportOpen(!exportOpen)} 
                style={{ 
                  borderRadius: 0, 
                  border: "none", 
                  padding: "0 10px",
                  margin: 0,
                  boxShadow: "none",
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 10,
                }}
              >
                <ChevronDown size={14} style={{ transform: exportOpen ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}/>
              </button>
              {exportOpen && (
                <div style={{ 
                  position: "absolute", 
                  bottom: "calc(100% + 12px)", 
                  right: 0, 
                  width: 220, 
                  background: theme.surface, 
                  borderRadius: 12, 
                  boxShadow: `0 12px 48px ${theme.shadow}`, 
                  border: `1px solid ${theme.border}`, 
                  overflow: "hidden", 
                  zIndex: 200 
                }}>
                  <div style={{ padding: "6px" }}>
                    <button onClick={() => { exportMarkdownManuscript(book, chapters); setExportOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", background: "transparent", color: theme.text, fontSize: 13, cursor: "pointer", textAlign: "left", borderRadius: 8 }} className="hover-bg"><AlignLeft size={14}/> Manuscript (Markdown)</button>
                    <button onClick={() => { exportHtmlManuscript(book, chapters); setExportOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", background: "transparent", color: theme.text, fontSize: 13, cursor: "pointer", textAlign: "left", borderRadius: 8 }} className="hover-bg"><Code size={14}/> Web Manuscript (HTML)</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
