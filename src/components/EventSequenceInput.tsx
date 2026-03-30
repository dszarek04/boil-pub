"use client";

import { EventSequenceRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, BookOpen, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

const EXAMPLES: { label: string; rows: Omit<EventSequenceRow, "id">[] }[] = [
  {
    label: "Przykład 1 - sieć (10 czynności)",
    rows: [
      { name: "A", duration: 3, fromNode: "1", toNode: "2" },
      { name: "B", duration: 4, fromNode: "2", toNode: "3" },
      { name: "C", duration: 6, fromNode: "2", toNode: "4" },
      { name: "D", duration: 7, fromNode: "3", toNode: "5" },
      { name: "E", duration: 1, fromNode: "5", toNode: "7" },
      { name: "F", duration: 2, fromNode: "4", toNode: "7" },
      { name: "G", duration: 3, fromNode: "4", toNode: "6" },
      { name: "H", duration: 4, fromNode: "6", toNode: "7" },
      { name: "I", duration: 1, fromNode: "7", toNode: "8" },
      { name: "J", duration: 2, fromNode: "8", toNode: "9" },
    ],
  },
  {
    label: "Przykład 2 - liniowy (4 czynności)",
    rows: [
      { name: "A", duration: 3, fromNode: "1", toNode: "2" },
      { name: "B", duration: 5, fromNode: "2", toNode: "3" },
      { name: "C", duration: 2, fromNode: "3", toNode: "4" },
      { name: "D", duration: 4, fromNode: "4", toNode: "5" },
    ],
  },
  {
    label: "Przykład 3 - równoległy (5 czynności)",
    rows: [
      { name: "A", duration: 4, fromNode: "1", toNode: "2" },
      { name: "B", duration: 6, fromNode: "1", toNode: "3" },
      { name: "C", duration: 3, fromNode: "2", toNode: "4" },
      { name: "D", duration: 5, fromNode: "3", toNode: "4" },
      { name: "E", duration: 2, fromNode: "4", toNode: "5" },
    ],
  },
];

interface Props {
  rows: EventSequenceRow[];
  onChange: (rows: EventSequenceRow[]) => void;
  fieldErrors: Record<string, string>;
}

export default function EventSequenceInput({ rows, onChange, fieldErrors }: Props) {
  const normalizeNodeValue = (value: string) =>
    value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const addRow = () =>
    onChange([
      ...rows,
      { id: uuidv4(), name: "", duration: 1, fromNode: "", toNode: "" },
    ]);

  const removeRow = (id: string) =>
    onChange(rows.filter((r) => r.id !== id));

  const update = (id: string, field: keyof EventSequenceRow, value: unknown) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const loadExample = (idx: number) =>
    onChange(EXAMPLES[idx].rows.map((r) => ({ ...r, id: uuidv4() })));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Podaj numer węzła startowego i końcowego dla każdej czynności (np.{" "}
          <span className="font-mono font-semibold">1-2</span>).
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
              Wczytaj przykład
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </Button>
          } />
          <DropdownMenuContent align="end">
            {EXAMPLES.map((ex, i) => (
              <DropdownMenuItem key={i} onClick={() => loadExample(i)}>
                {ex.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <div className="min-w-130">
        <div
          className="grid grid-cols-[90px_130px_1fr_44px]"
          style={{ background: "var(--muted)", borderBottom: `1px solid var(--border)` }}
        >
          {["Czynność", "Czas trwania", "Następstwo zdarzeń", ""].map((h, i) => (
            <div
              key={i}
              className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--muted-foreground)" }}
            >
              {h}
            </div>
          ))}
        </div>

        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.length === 0 && (
            <div
              className="py-10 text-center text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Brak wierszy - kliknij „Dodaj czynność&quot;.
            </div>
          )}
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="grid grid-cols-[90px_130px_1fr_44px] items-start"
              style={{
                background: idx % 2 === 0 ? "var(--card)" : "var(--muted)",
              }}
            >
              <div className="px-2 py-2">
                <Input
                  value={row.name}
                  onChange={(e) =>
                    update(row.id, "name", e.target.value)
                  }
                  placeholder="A"
                  maxLength={20}
                  className={cn(
                    "h-8 text-sm font-mono font-bold text-center",
                    fieldErrors[`${row.id}-name`] ? "border-destructive" : ""
                  )}
                />
              </div>

              <div className="px-2 py-2">
                <Input
                  type="number"
                  min={1}
                  value={row.duration === 0 ? "" : row.duration}
                  onChange={(e) =>
                    update(row.id, "duration", parseInt(e.target.value, 10) || 0)
                  }
                  className={cn(
                    "h-8 text-sm",
                    fieldErrors[`${row.id}-duration`] ? "border-destructive" : ""
                  )}
                />
              </div>

              <div className="px-2 py-2 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={row.fromNode}
                  onChange={(e) =>
                    update(row.id, "fromNode", normalizeNodeValue(e.target.value))
                  }
                  placeholder="od"
                  className={cn(
                    "h-8 w-16 text-sm font-mono text-center",
                    fieldErrors[`${row.id}-fromNode`] ? "border-destructive" : ""
                  )}
                />
                <ArrowRight
                  className="w-4 h-4 shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                />
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={row.toNode}
                  onChange={(e) =>
                    update(row.id, "toNode", normalizeNodeValue(e.target.value))
                  }
                  placeholder="do"
                  className={cn(
                    "h-8 w-16 text-sm font-mono text-center",
                    fieldErrors[`${row.id}-toNode`] ? "border-destructive" : ""
                  )}
                />
                <Badge
                  variant="outline"
                  className="font-mono shrink-0 text-[11px]"
                >
                  {row.fromNode || "?"}-{row.toNode || "?"}
                </Badge>
                {fieldErrors[`${row.id}-toNode`] && (
                  <p className="text-[11px] text-destructive">
                    {fieldErrors[`${row.id}-toNode`]}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
        <Plus className="w-4 h-4" />
        Dodaj czynność
      </Button>
    </div>
  );
}