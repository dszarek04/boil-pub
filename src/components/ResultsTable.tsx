"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CpmActivity } from "@/lib/types";

interface Props {
  activities: CpmActivity[];
  showCriticalPath: boolean;
  onRowClick: (activity: CpmActivity) => void;
}

export default function ResultsTable({ activities, showCriticalPath, onRowClick }: Props) {
  return (
    <div
      className="pdf-export-table-shell rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <Table>
        <TableHeader>
          <TableRow style={{ background: "var(--muted)" }}>
            {["Czynność", "D", "ES", "EF", "LS", "LF", "R", "Status"].map((h) => (
              <TableHead
                key={h}
                className="text-center font-semibold text-xs uppercase tracking-wide"
                style={{ color: "var(--muted-foreground)" }}
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((act) => {
            const isCrit = act.isCritical && showCriticalPath;
            return (
              <TableRow
                key={act.name}
                onClick={() => onRowClick(act)}
                className="cursor-pointer transition-colors"
                style={{
                  background: isCrit ? "#fff5f5" : undefined,
                  color: isCrit ? "#7f1d1d" : undefined,
                }}
              >
                <TableCell className="text-center font-mono font-bold text-sm">
                  {act.name}
                </TableCell>
                <TableCell className="text-center tabular-nums">{act.duration}</TableCell>
                <TableCell className="text-center tabular-nums">{act.ES}</TableCell>
                <TableCell className="text-center tabular-nums">{act.EF}</TableCell>
                <TableCell className="text-center tabular-nums">{act.LS}</TableCell>
                <TableCell className="text-center tabular-nums">{act.LF}</TableCell>
                <TableCell className="text-center tabular-nums">
                  <span
                    className="font-bold"
                    style={{ color: act.R === 0 ? "#ef4444" : "#d97706" }}
                  >
                    {act.R}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {act.isCritical ? (
                    <Badge variant="destructive" className="text-[10px] whitespace-nowrap">
                      Krytyczna
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                      Niekrytyczna
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}