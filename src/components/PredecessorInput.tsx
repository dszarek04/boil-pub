"use client";

import { PredecessorRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

const EXAMPLES: { label: string; rows: Omit<PredecessorRow, "id">[] }[] = [
  {
    label: "Przykład 1 - prosty (8 czynności)",
    rows: [
      { name: "A", predecessors: [], duration: 5 },
      { name: "B", predecessors: [], duration: 7 },
      { name: "C", predecessors: ["A"], duration: 6 },
      { name: "D", predecessors: ["A"], duration: 8 },
      { name: "E", predecessors: ["B"], duration: 3 },
      { name: "F", predecessors: ["C"], duration: 4 },
      { name: "G", predecessors: ["C"], duration: 2 },
      { name: "H", predecessors: ["E", "D", "F"], duration: 5 },
    ],
  },
  {
    label: "Przykład 2 - liniowy (5 czynności)",
    rows: [
      { name: "A", predecessors: [], duration: 3 },
      { name: "B", predecessors: ["A"], duration: 4 },
      { name: "C", predecessors: ["B"], duration: 2 },
      { name: "D", predecessors: ["C"], duration: 6 },
      { name: "E", predecessors: ["D"], duration: 1 },
    ],
  },
  {
    label: "Przykład 3 - równoległy (6 czynności)",
    rows: [
      { name: "A", predecessors: [], duration: 4 },
      { name: "B", predecessors: [], duration: 6 },
      { name: "C", predecessors: ["A"], duration: 3 },
      { name: "D", predecessors: ["A", "B"], duration: 5 },
      { name: "E", predecessors: ["C"], duration: 2 },
      { name: "F", predecessors: ["D", "E"], duration: 4 },
    ],
  },
];

interface Props {
  rows: PredecessorRow[];
  onChange: (rows: PredecessorRow[]) => void;
  fieldErrors: Record<string, string>;
}

export default function PredecessorInput({ rows, onChange, fieldErrors }: Props) {
  const addRow = () =>
    onChange([...rows, { id: uuidv4(), name: "", predecessors: [], duration: 1 }]);

  const removeRow = (id: string) =>
    onChange(rows.filter((r) => r.id !== id));

  const update = (id: string, field: keyof PredecessorRow, value: unknown) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const loadExample = (idx: number) =>
    onChange(EXAMPLES[idx].rows.map((r) => ({ ...r, id: uuidv4() })));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Wpisz nazwy poprzedników oddzielone przecinkiem. Pozostaw puste, jeśli czynność nie ma poprzedników.
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
      <div className="min-w-145">
        <div
          className="grid grid-cols-[90px_130px_1fr_44px]"
          style={{ background: "var(--muted)", borderBottom: `1px solid var(--border)` }}
        >
          {["Czynność", "Czas trwania", "Poprzednik (przecinek)", ""].map(
            (h, i) => (
              <div
                key={i}
                className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--muted-foreground)" }}
              >
                {h}
              </div>
            )
          )}
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
                  onChange={(e) => update(row.id, "name", e.target.value.toUpperCase())}
                  placeholder="A"
                  maxLength={20}
                  className={cn(
                    "h-8 text-sm font-mono font-bold text-center",
                    fieldErrors[`${row.id}-name`] ? "border-destructive" : ""
                  )}
                />
                {fieldErrors[`${row.id}-name`] && (
                  <p className="text-[11px] text-destructive mt-1">
                    {fieldErrors[`${row.id}-name`]}
                  </p>
                )}
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
                {fieldErrors[`${row.id}-duration`] && (
                  <p className="text-[11px] text-destructive mt-1">
                    {fieldErrors[`${row.id}-duration`]}
                  </p>
                )}
              </div>


              <div className="px-2 py-2">
                <Input
                  defaultValue={row.predecessors.join(", ")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const preds = raw
                      ? Array.from(
                          new Set(
                            raw
                              .split(",")
                              .map((s) => s.trim().toUpperCase())
                              .filter(Boolean)
                          )
                        )
                      : [];
                    update(row.id, "predecessors", preds);
                  }}
                  onBlur={(e) => {
                    e.target.value = row.predecessors.join(", ");
                  }}
                  placeholder="np. A, B  (puste = brak poprzednika)"
                  className="h-8 text-sm font-mono"
                />
                {row.predecessors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {row.predecessors.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px] h-4 px-1.5">
                        {p}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeRow(row.id)}
                  title="Usuń wiersz"
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