"use client";

import { useMemo } from "react";
import { CpmActivity } from "@/lib/types";

interface GanttChartProps {
  activities: CpmActivity[];
  projectDuration: number;
  showCriticalPath: boolean;
  showFloatBars: boolean;
}

export default function GanttChart({
  activities,
  projectDuration,
  showCriticalPath,
  showFloatBars,
}: GanttChartProps) {
  const ticks = useMemo(
    () => Array.from({ length: projectDuration + 1 }, (_, i) => i),
    [projectDuration]
  );

  if (projectDuration === 0) return null;

  const pct = (v: number) => `${(v / projectDuration) * 100}%`;
  const pctW = (a: number, b: number) =>
    `${((b - a) / projectDuration) * 100}%`;

  return (
    <div className="pdf-export-gantt-scroll w-full overflow-x-auto">
      <div className="pdf-export-gantt-inner min-w-160 space-y-0">
        <div className="flex mb-3">
          <div className="w-28 shrink-0" />
          <div
            className="relative flex-1 h-6 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute flex flex-col items-center"
                style={{ left: pct(t), transform: "translateX(-50%)" }}
              >
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t}
                </span>
                <div
                  className="w-px h-2"
                  style={{ background: "var(--border)" }}
                />
              </div>
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </div>


        <div className="space-y-2">
          {activities.map((act) => {
            const isCrit = act.isCritical && showCriticalPath;
            const hasFloat = act.R > 0;

            return (
              <div key={act.name} className="flex items-center gap-2">
                <div
                  className="w-28 shrink-0 text-xs font-bold text-right pr-3 font-mono"
                  style={{ color: isCrit ? "#ef4444" : "var(--foreground)" }}
                >
                  {act.name}
                </div>

                <div
                  className="relative flex-1 h-8 rounded"
                  style={{
                    background: "var(--muted)",
                    border: `1px solid var(--border)`,
                  }}
                >
                  {showFloatBars && hasFloat && (
                    <div
                      className="absolute top-0 h-full rounded transition-all duration-300"
                      style={{
                        left: pct(act.ES),
                        width: pctW(act.ES, act.LF),
                        background: isCrit
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(var(--primary-rgb, 30,41,59),0.12)",
                        border: `1px dashed ${isCrit ? "#fca5a5" : "var(--border)"}`,
                      }}
                      title={`LS=${act.LS} → LF=${act.LF}`}
                    />
                  )}


                  {showFloatBars && hasFloat && (
                    <div
                      className="absolute top-0 h-full w-0.5 transition-all duration-300"
                      style={{
                        left: pct(act.LS),
                        background: "#f59e0b",
                        opacity: 0.8,
                      }}
                      title={`LS = ${act.LS}`}
                    />
                  )}


                  <div
                    className="absolute top-0 h-full rounded transition-all duration-300 flex items-center justify-center"
                    style={{
                      left: pct(act.ES),
                      width: pctW(act.ES, act.EF),
                      background: isCrit ? "#ef4444" : "var(--primary)",
                    }}
                    title={`ES=${act.ES}  EF=${act.EF}  D=${act.duration}`}
                  >
                    <span
                      className="text-[11px] font-bold truncate px-1 select-none"
                      style={{ color: "#ffffff" }}
                    >
                      {act.duration}
                    </span>
                  </div>
                </div>

                <div className="w-10 shrink-0 text-right">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: act.R === 0 ? "#ef4444" : "#d97706" }}
                  >
                    R={act.R}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-5 pt-4 flex flex-wrap gap-x-5 gap-y-2 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <LegendItem color="var(--primary)" label="ES → EF (wcześniejszy termin)" />
          {showFloatBars && (
            <>
              <LegendItem
                color="rgba(30,41,59,0.12)"
                border="1px dashed var(--border)"
                label="Obszar rezerwy (ES → LF)"
              />
              <LegendItem color="#f59e0b" label="LS — najpóźniejszy start" />
            </>
          )}
          {showCriticalPath && (
            <LegendItem color="#ef4444" label="Ścieżka krytyczna" />
          )}
        </div>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  border,
}: {
  color: string;
  label: string;
  border?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-5 h-3.5 rounded-sm shrink-0"
        style={{ background: color, border: border ?? "none" }}
      />
      <span
        className="text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
    </div>
  );
}