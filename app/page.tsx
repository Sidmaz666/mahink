import Link from "next/link";
import { ArrowRight, Bot, BookOpen, LayoutTemplate, Palette, Sparkles, Target, Wand2, PanelsTopLeft, PenSquare, ShieldCheck } from "lucide-react";
import MahinkWordmark from "@/components/mahink/ui/MahinkWordmark";

const features = [
  {
    icon: Bot,
    title: "Agentic writing help",
    body: "Draft, rewrite, expand, and sharpen ideas with AI that works alongside your manuscript.",
  },
  {
    icon: Palette,
    title: "Covers with taste",
    body: "Design front, spine, and back covers with layouts that feel publishable instead of generic.",
  },
  {
    icon: LayoutTemplate,
    title: "A real studio",
    body: "Themes, typography, chapters, goals, and export tools in one clean writing environment.",
  },
  {
    icon: Target,
    title: "Built for completion",
    body: "Track momentum, structure books clearly, and keep moving from first draft to final file.",
  },
];

const workflow = [
  {
    icon: PenSquare,
    title: "Start with a real manuscript workspace",
    body: "Open a structured book, draft chapter by chapter, and keep notes, goals, and momentum in one place.",
  },
  {
    icon: Wand2,
    title: "Shape the style with AI or by hand",
    body: "Use chat to revise scenes, restyle the book, and refine covers without bouncing between tools.",
  },
  {
    icon: PanelsTopLeft,
    title: "Design the full presentation",
    body: "Control themes, typography, visual tone, and cover composition so the inside and outside feel cohesive.",
  },
  {
    icon: ShieldCheck,
    title: "Move toward export confidently",
    body: "Prepare cleaner files, stronger structure, and a more professional package for the next stage of publishing.",
  },
];

const bookTypes = [
  "Novels and literary fiction",
  "Fantasy, sci-fi, and worldbuilding-heavy books",
  "Poetry, memoir, and essay collections",
  "Self-help, nonfiction, and structured guides",
];

export default function HomePage() {
  return (
    <main className="mahink-home">
      <section className="mahink-home-hero">
        <div className="mahink-home-orb mahink-home-orb-a" aria-hidden />
        <div className="mahink-home-orb mahink-home-orb-b" aria-hidden />
        <div className="mahink-home-noise" aria-hidden />
        <div className="mahink-home-grid" aria-hidden />

        <div className="mahink-home-shell">
          <div className="mahink-home-copy">
            <div className="mahink-home-title-wrap">
              <MahinkWordmark size="hero" />
            </div>
            <p className="mahink-home-lead">
              A modern book-making workspace for writers who want better focus, better presentation,
              and better creative support from first draft to finished cover.
            </p>

            <div className="mahink-home-actions">
              <Link href="/app" className="mahink-home-btn mahink-home-btn-primary">
                Create New Book <ArrowRight aria-hidden size={16} />
              </Link>
              <a href="#features" className="mahink-home-btn mahink-home-btn-secondary">
                See what&apos;s inside
              </a>
            </div>

            <div className="mahink-home-proof">
              <div className="mahink-home-proof-item">
                <span className="mahink-home-proof-value">Write</span>
                <span className="mahink-home-proof-label">Long-form chapters and ideas</span>
              </div>
              <div className="mahink-home-proof-item">
                <span className="mahink-home-proof-value">Design</span>
                <span className="mahink-home-proof-label">Professional covers and themes</span>
              </div>
              <div className="mahink-home-proof-item">
                <span className="mahink-home-proof-value">Ship</span>
                <span className="mahink-home-proof-label">Export-ready files and structure</span>
              </div>
            </div>

            <a href="#features" className="mahink-home-scroll-cue">
              <span className="mahink-home-scroll-dot" aria-hidden />
              Explore the workspace
            </a>
          </div>

          {/* <div className="mahink-home-stage" aria-hidden>
            <div className="mahink-home-stage-panel mahink-home-stage-panel-main">
              <div className="mahink-home-stage-topline">
                <span className="mahink-home-badge">MahInk Studio</span>
                <span className="mahink-home-stage-muted">Adapts to your selected theme</span>
              </div>
              <div className="mahink-home-stage-book">
                <div className="mahink-home-stage-book-cover" />
                <div className="mahink-home-stage-book-lines">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="mahink-home-stage-bottom">
                <div className="mahink-home-stage-chip">
                  <Sparkles size={15} aria-hidden />
                  <span>AI revisions</span>
                </div>
                <div className="mahink-home-stage-chip">
                  <Palette size={15} aria-hidden />
                  <span>Cover styling</span>
                </div>
                <div className="mahink-home-stage-chip">
                  <BookOpen size={15} aria-hidden />
                  <span>Chapter workflow</span>
                </div>
              </div>
              <div className="mahink-home-stage-wave" />
            </div>

            <div className="mahink-home-stage-panel mahink-home-stage-panel-note">
              <span className="mahink-home-stage-note-label">AI Assist</span>
              <p>Turn this chapter into a tighter, atmospheric opening with stronger pacing.</p>
            </div>

            <div className="mahink-home-stage-panel mahink-home-stage-panel-stats">
              <span className="mahink-home-stage-stat">48,200</span>
              <span className="mahink-home-stage-stat-label">words in motion</span>
            </div>
          </div> */}
        </div>
      </section>

      <section id="features" className="mahink-home-section">
        <div className="mahink-home-section-heading">
          <p className="mahink-home-section-kicker">Why it feels better</p>
          <h2>Designed to feel like a premium creative tool, not a cluttered interface.</h2>
          <p>
            MahInk brings the manuscript, the visual system, and the AI collaboration layer into one
            cohesive workspace.
          </p>
        </div>

        <div className="mahink-home-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="mahink-home-feature-card">
                <div className="mahink-home-feature-icon">
                  <Icon size={20} aria-hidden />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mahink-home-section">
        <div className="mahink-home-section-heading">
          <p className="mahink-home-section-kicker">Inside the experience</p>
          <h2>A single place for writing, visual direction, and agentic editing.</h2>
          <p>
            Instead of treating manuscript work, cover design, and AI collaboration as separate utilities,
            MahInk keeps them part of the same book workflow.
          </p>
        </div>

        <div className="mahink-home-workflow-grid">
          {workflow.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="mahink-home-workflow-card">
                <div className="mahink-home-workflow-top">
                  <div className="mahink-home-feature-icon">
                    <Icon size={20} aria-hidden />
                  </div>
                  <span className="mahink-home-workflow-index">0{workflow.indexOf(item) + 1}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mahink-home-section mahink-home-section-spotlight">
        <div className="mahink-home-spotlight-card">
          <div>
            <p className="mahink-home-section-kicker">Made for serious book projects</p>
            <h2>From rough pages to polished presentation.</h2>
          </div>
          <div className="mahink-home-spotlight-list">
            <p>Shape the writing experience with themes, typography, editor tools, and structured chapters.</p>
            <p>Use AI where it helps most: idea generation, stylistic revision, and design direction.</p>
            <p>Keep the product feeling elegant and editorial while still practical for daily work.</p>
          </div>
        </div>
      </section>

      <section className="mahink-home-section">
        <div className="mahink-home-section-heading">
          <p className="mahink-home-section-kicker">Built for many kinds of books</p>
          <h2>Fiction, nonfiction, poetry, memoir, and beyond.</h2>
          <p>
            The goal is simple: let the writer shape the experience to the book instead of forcing every
            project into the same narrow template.
          </p>
        </div>

        <div className="mahink-home-type-grid">
          {bookTypes.map((item) => (
            <div key={item} className="mahink-home-type-pill">
              <BookOpen size={16} aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mahink-home-final">
        <p className="mahink-home-section-kicker">Start the workspace</p>
        <h2>Open MahInk and build a book that looks as considered as it reads.</h2>
        <Link href="/app" className="mahink-home-btn mahink-home-btn-primary">
          Go to App <ArrowRight aria-hidden size={16} />
        </Link>
      </section>

      <footer className="mahink-home-footer">© {new Date().getFullYear()} MahInk</footer>
    </main>
  );
}
