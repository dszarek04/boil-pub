"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CpmActivity } from "@/lib/types";
import React from "react";

interface Props {
  activity: CpmActivity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RowProps {
  label: string;
  value: number | string;
  highlight?: boolean;
  description?: string;
  style?: React.CSSProperties;
}

function ValueRow({ label, value, highlight, description, style }: RowProps) {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 gap-6" style={style}>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {label}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {description}
          </p>
        )}
      </div>
      <span
        className="text-lg font-bold tabular-nums shrink-0"
        style={{ color: highlight ? "#ef4444" : "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ActivityDialog({ activity, open, onOpenChange }: Props) {
  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span
              className="font-mono font-extrabold text-2xl"
              style={{ color: "var(--primary)" }}
            >
              {activity.name}
            </span>
            {activity.isCritical && (
              <Badge variant="destructive">Ścieżka krytyczna</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Wartości obliczone metodą CPM
          </DialogDescription>
        </DialogHeader>

        <div
          className="mt-2 rounded-lg border divide-y overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <ValueRow
            label="Czas trwania"
            value={activity.duration}
            description="D"
          />
          <ValueRow label="Najwcześniejszy start" value={activity.ES} description="ES - Early Start" />
          <ValueRow label="Najwcześniejsze zakończenie" value={activity.EF} description="EF - Early Finish" />
          <ValueRow label="Najpóźniejszy start" value={activity.LS} description="LS - Late Start" />
          <ValueRow label="Najpóźniejsze zakończenie" value={activity.LF} description="LF - Late Finish" />
          <ValueRow
            label="Rezerwa czasu"
            value={activity.R}
            description="R = LS - ES"
            highlight={activity.R === 0}
            style={{ background: activity.R === 0 ? "#fff5f5" : "var(--muted)" }}
          />
        </div>

        {activity.predecessors.length > 0 && (
          <p
            className="text-xs mt-3 px-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Poprzednicy:{" "}
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>
              {activity.predecessors.join(", ")}
            </span>
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}