"use client";

import { Flame, BookOpen, FileText, PenTool, Clock, TrendingUp, Award } from "lucide-react";
import GoalRing from "../ui/GoalRing";
import type { AppData, Theme } from "@/lib/types";

interface Props {
  data: AppData;
  theme: Theme;
  isMobile: boolean;
  todayWords: number;
  streak: number;
  bwc: Record<string, number>;
  upSettings: (u: Partial<AppData["settings"]>) => void;
}

export default function GoalsView({ data, theme, isMobile, todayWords, streak, bwc, upSettings }: Props) {
  const total   = Object.values(bwc).reduce((a, b) => a + b, 0);
  const daily   = data.settings.dailyGoal || 500;
  const pct     = Math.min(100, (todayWords / daily) * 100);
  const sessions = data.sessions;
  const avgW    = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.words, 0) / sessions.length) : 0;

  // Heatmap data
  const sessMap: Record<string, number> = {};
  sessions.forEach((s) => { sessMap[s.date] = (sessMap[s.date] || 0) + s.words; });
  const maxW  = Math.max(...Object.values(sessMap), 1);
  const today = new Date();
  const weeks: Array<Array<{ k: string; words: number }>> = [];
  for (let w = 51; w >= 0; w--) {
    const week = [];
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - (w * 7 + d));
      const k = dt.toISOString().split("T")[0];
      week.push({ k, words: sessMap[k] || 0 });
    }
    weeks.push(week);
  }

  const statCards = [
    { l: "Total Words",    v: total.toLocaleString(),         I: FileText,   c: theme.accent         },
    { l: "Streak",         v: `${streak} days`,               I: Flame,      c: "#f6ad55"            },
    { l: "Books",          v: data.books.filter((b) => !b.isArchived).length, I: BookOpen, c: "#68d391" },
    { l: "Sessions",       v: sessions.length,                I: Clock,      c: "#90cdf4"            },
    { l: "Today",          v: todayWords.toLocaleString(),    I: PenTool,    c: theme.accentLight    },
    { l: "Avg / Session",  v: avgW,                           I: TrendingUp, c: "#e2a3f8"            },
  ];

  return (
    <div className="fade-in" style={{ padding: isMobile ? "16px 16px 88px" : "24px 28px 40px" }}>

      {/* Today's goal */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: "var(--ed-font)", fontSize: 19, fontWeight: 700, color: theme.text }}>Today's Goal</p>
            <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
              {todayWords.toLocaleString()} / {daily.toLocaleString()} words
            </p>
          </div>
          <GoalRing pct={pct} color={theme.accent} size={72}/>
        </div>
        <div className="pbar" style={{ height: 8 }}>
          <div className="pfill" style={{ width: `${pct}%`, height: "100%" }}/>
        </div>
        {pct >= 100 && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: `${theme.accent}22`, borderRadius: 9, display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={15} color={theme.accent}/>
            <span style={{ fontSize: 13, color: theme.accent, fontWeight: 700 }}>Daily goal crushed! Excellent work.</span>
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <label className="lbl">Adjust Daily Goal</label>
          <input
            type="range" min={50} max={5000} step={50} value={daily}
            onChange={(e) => upSettings({ dailyGoal: Number(e.target.value) })}
            style={{ width: "100%", accentColor: theme.accent }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: theme.textFaint, marginTop: 3 }}>
            <span>50</span>
            <span style={{ fontWeight: 700, color: theme.accent }}>{daily} words/day</span>
            <span>5,000</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {statCards.map(({ l, v, I, c }) => (
          <div key={l} className="card" style={{ textAlign: "center" }}>
            <I size={20} color={c} style={{ marginBottom: 8 }}/>
            <p style={{ fontFamily: "var(--ed-font)", fontSize: 24, fontWeight: 700, color: theme.text }}>{v}</p>
            <p style={{ fontSize: 11, color: theme.textFaint, marginTop: 3 }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Activity heatmap */}
      <div className="card">
        <p style={{ fontFamily: "var(--ed-font)", fontSize: 17, fontWeight: 700, color: theme.text, marginBottom: 14 }}>
          Writing Activity — Last 52 Weeks
        </p>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 3, minWidth: 600 }}>
            {weeks.map((wk, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {wk.map((d) => {
                  const alpha = d.words > 0 ? Math.min(1, 0.25 + 0.75 * (d.words / maxW)) : 0;
                  return (
                    <div
                      key={d.k}
                      className="hday"
                      title={`${d.k}: ${d.words} words`}
                      style={{ background: d.words > 0 ? `color-mix(in srgb,${theme.accent} ${Math.round(alpha * 100)}%,${theme.surfaceAlt})` : theme.surfaceAlt }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: theme.textFaint }}>Less</span>
            {[0.2, 0.4, 0.7, 1].map((a) => (
              <div key={a} style={{ width: 10, height: 10, borderRadius: 3, background: `color-mix(in srgb,${theme.accent} ${Math.round(a * 100)}%,${theme.surfaceAlt})` }}/>
            ))}
            <span style={{ fontSize: 10, color: theme.textFaint }}>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
