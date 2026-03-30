"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Network,
  BarChart3,
  TableIcon,
  RotateCcw,
  Play,
  GitBranch,
  Info,
} from "lucide-react";

import PredecessorInput from "@/components/PredecessorInput";
import EventSequenceInput from "@/components/EventSequenceInput";
import CpmGraph from "@/components/CpmGraph";
import GanttChart from "@/components/GanttChart";
import ResultsTable from "@/components/ResultsTable";
import ActivityDialog from "@/components/ActivityDialog";

import { computeCpm, eventSequenceToPredecessors } from "@/lib/cpm";
import { loadState, saveState, clearState } from "@/lib/storage";
import {
  predecessorFormSchema,
  eventSequenceFormSchema,
} from "@/lib/validation";
import { usePdfExport } from "@/hooks/usePdfExport";
import type {
  CpmActivity,
  CpmResult,
  EventSequenceRow,
  InputFormat,
  PredecessorRow,
} from "@/lib/types";

export default function Home() {
  const [appState, setAppState] = useState({
    hydrated: false,
    inputFormat: "predecessor" as InputFormat,
    predecessorRows: [] as PredecessorRow[],
    eventSequenceRows: [] as EventSequenceRow[],
  });
  const { hydrated, inputFormat, predecessorRows, eventSequenceRows } = appState;

  const setInputFormat       = useCallback((v: InputFormat)           => setAppState(s => ({ ...s, inputFormat: v })), []);
  const setPredecessorRows   = useCallback((rows: PredecessorRow[])   => setAppState(s => ({ ...s, predecessorRows: rows })), []);
  const setEventSequenceRows = useCallback((rows: EventSequenceRow[]) => setAppState(s => ({ ...s, eventSequenceRows: rows })), []);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cpmResult, setCpmResult] = useState<CpmResult | null>(null);
  const [hasComputed, setHasComputed] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<CpmActivity | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const { exportPdf, exporting } = usePdfExport();

  useEffect(() => {
    const saved = loadState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAppState({
      hydrated: true,
      inputFormat: saved?.inputFormat ?? "predecessor",
      predecessorRows: saved?.predecessorRows ?? [],
      eventSequenceRows: saved?.eventSequenceRows ?? [],
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({
      inputFormat,
      predecessorRows,
      eventSequenceRows,
    });
  }, [
    hydrated,
    inputFormat,
    predecessorRows,
    eventSequenceRows,
  ]);

  const validateFields = useCallback((): boolean => {
    const newFieldErrors: Record<string, string> = {};

    if (inputFormat === "predecessor") {
      const result = predecessorFormSchema.safeParse(predecessorRows);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const [rowIdx, field] = issue.path;
          if (typeof rowIdx === "number" && typeof field === "string") {
            const rowId = predecessorRows[rowIdx]?.id;
            if (rowId) newFieldErrors[`${rowId}-${field}`] = issue.message;
          }
        }
        setFieldErrors(newFieldErrors);
        return false;
      }
    } else {
      const result = eventSequenceFormSchema.safeParse(eventSequenceRows);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const [rowIdx, field] = issue.path;
          if (typeof rowIdx === "number" && typeof field === "string") {
            const rowId = eventSequenceRows[rowIdx]?.id;
            if (rowId) newFieldErrors[`${rowId}-${field}`] = issue.message;
          }
        }
        setFieldErrors(newFieldErrors);
        return false;
      }
    }

    setFieldErrors({});
    return true;
  }, [inputFormat, predecessorRows, eventSequenceRows]);

  const handleCompute = useCallback(() => {
    setValidationErrors([]);
    setCpmResult(null);
    setHasComputed(false);

    const fieldsOk = validateFields();
    if (!fieldsOk) {
      setValidationErrors(["Popraw błędy w formularzu przed obliczeniem."]);
      return;
    }

    let rows: PredecessorRow[];

    if (inputFormat === "predecessor") {
      rows = predecessorRows;
    } else {
      rows = eventSequenceToPredecessors(eventSequenceRows);
    }

    const result = computeCpm(rows);

    if (result.errors.length > 0) {
      setValidationErrors(result.errors);
      return;
    }

    setCpmResult(result);
    setHasComputed(true);
  }, [inputFormat, predecessorRows, eventSequenceRows, validateFields]);

  const handleReset = useCallback(() => {
    setAppState({
      hydrated: true,
      inputFormat: "predecessor",
      predecessorRows: [],
      eventSequenceRows: [],
    });
    setValidationErrors([]);
    setFieldErrors({});
    setCpmResult(null);
    setHasComputed(false);
    setSelectedActivity(null);
    clearState();
  }, []);

  const handleActivityClick = useCallback((activity: CpmActivity) => {
    setSelectedActivity(activity);
    setDialogOpen(true);
  }, []);

  const handleExportPdf = useCallback(() => {
    exportPdf("cpm-results-section", "cpm-wyniki.pdf");
  }, [exportPdf]);

  const currentRowCount =
    inputFormat === "predecessor"
      ? predecessorRows.length
      : eventSequenceRows.length;

  const hasErrors = validationErrors.length > 0;

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--muted-foreground)" }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <header
        className="border-b sticky top-0 z-40"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <GitBranch
                className="w-4 h-4"
                style={{ color: "var(--primary-foreground)" }}
              />
            </div>
            <div>
              <h1
                className="text-sm font-bold leading-none"
                style={{ color: "var(--foreground)" }}
              >
                CPM Kalkulator
              </h1>
              <p
                className="text-[11px] leading-none mt-0.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Metoda ścieżki krytycznej
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasComputed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={exporting}
                className="gap-1.5 text-xs"
              >
                {exporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {exporting ? "Eksportowanie…" : "Eksportuj PDF"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Resetuj
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base">Dane wejściowe</CardTitle>
                <CardDescription className="mt-0.5">
                  Wybierz format danych i wprowadź czynności projektu.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {currentRowCount}{" "}
                {currentRowCount === 1 ? "czynność" : "czynności"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs
              value={inputFormat}
              onValueChange={(v) => {
                const next = v as InputFormat;
                setValidationErrors([]);
                setFieldErrors({});
                setCpmResult(null);
                setHasComputed(false);

                if (next === "event-sequence") {
                  setPredecessorRows([]);
                } else if (next === "predecessor") {
                  setEventSequenceRows([]);
                }

                setInputFormat(next);
              }}
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="predecessor" className="gap-1.5 text-xs">
                  <TableIcon className="w-3.5 h-3.5" />
                  Czynność poprzedzająca
                </TabsTrigger>
                <TabsTrigger value="event-sequence" className="gap-1.5 text-xs">
                  <Network className="w-3.5 h-3.5" />
                  Następstwo zdarzeń
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="predecessor" className="mt-0">
                  <PredecessorInput
                    rows={predecessorRows}
                    onChange={setPredecessorRows}
                    fieldErrors={fieldErrors}
                  />
                </TabsContent>

                <TabsContent value="event-sequence" className="mt-0">
                  <EventSequenceInput
                    rows={eventSequenceRows}
                    onChange={setEventSequenceRows}
                    fieldErrors={fieldErrors}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <Separator />

            <div className="flex items-center justify-end">
              <Button
                onClick={handleCompute}
                className="gap-2"
                disabled={currentRowCount === 0}
              >
                <Play className="w-4 h-4" />
                Oblicz CPM
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Błędy walidacji</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {validationErrors.map((e, i) => (
                  <li key={i} className="text-sm">
                    {e}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {hasComputed && cpmResult && (
          <div id="cpm-results-section" ref={resultsRef} className="space-y-6">

            <Card className="pdf-export-panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dane wejściowe</CardTitle>
                <CardDescription>
                  Użyta metoda: {inputFormat === "predecessor" ? "Czynność poprzedzająca" : "Następstwo zdarzeń"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inputFormat === "predecessor" ? (
                  <div className="pdf-export-table-wrap overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ background: "var(--muted)" }}>
                          <TableHead className="text-center text-xs">Czynność</TableHead>
                          <TableHead className="text-center text-xs">Poprzedniki</TableHead>
                          <TableHead className="text-center text-xs">Czas trwania</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {predecessorRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-center font-mono">{row.name}</TableCell>
                            <TableCell className="text-center">
                              {row.predecessors.length > 0 ? row.predecessors.join(", ") : "-"}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">{row.duration}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="pdf-export-table-wrap overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
                    <Table>
                      <TableHeader>
                        <TableRow style={{ background: "var(--muted)" }}>
                          <TableHead className="text-center text-xs">Czynność</TableHead>
                          <TableHead className="text-center text-xs">Od zdarzenia</TableHead>
                          <TableHead className="text-center text-xs">Do zdarzenia</TableHead>
                          <TableHead className="text-center text-xs">Czas trwania</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventSequenceRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-center font-mono">{row.name}</TableCell>
                            <TableCell className="text-center tabular-nums">{row.fromNode}</TableCell>
                            <TableCell className="text-center tabular-nums">{row.toNode}</TableCell>
                            <TableCell className="text-center tabular-nums">{row.duration}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert
              className="border"
              style={{
                background: "#f0fdf4",
                borderColor: "#86efac",
              }}
            >
              <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
              <AlertTitle style={{ color: "#15803d" }}>
                Obliczenia zakończone
              </AlertTitle>
              <AlertDescription style={{ color: "#166534" }}>
                Czas trwania projektu:{" "}
                <strong>{cpmResult.projectDuration}</strong> jednostek.{" "}
                Ścieżka krytyczna:{" "}
                <strong>{cpmResult.criticalPath.join(" → ")}</strong>
              </AlertDescription>
            </Alert>

            <Card className="pdf-export-panel">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  <CardTitle className="text-base">Tabela wyników</CardTitle>
                </div>
                <CardDescription>
                  Kliknij wiersz, aby zobaczyć szczegóły czynności.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResultsTable
                  activities={cpmResult.activities}
                  showCriticalPath={true}
                  onRowClick={handleActivityClick}
                />
              </CardContent>
            </Card>

            <Card className="pdf-export-panel">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  <CardTitle className="text-base">Graf CPM</CardTitle>
                </div>
                <CardDescription>
                  Kliknij węzeł, aby zobaczyć szczegółowe wartości.
                  Możesz przeciągać węzły i używać scrolla do powiększania.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CpmGraph
                  activities={cpmResult.activities}
                  showCriticalPath={true}
                  onNodeClick={handleActivityClick}
                />

                <div
                  className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-10 h-0.5"
                      style={{ background: "var(--border)" }}
                    />
                    <span>Zależność</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-0.5 bg-red-500" />
                    <span>Ścieżka krytyczna</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    <span>
                      Węzeł: ES&nbsp;|&nbsp;D&nbsp;|&nbsp;EF (góra) ·
                      LS&nbsp;|&nbsp;R&nbsp;|&nbsp;LF (dół)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pdf-export-panel">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  <CardTitle className="text-base">Wykres Gantta</CardTitle>
                </div>
                <CardDescription>
                  Harmonogram czynności z uwzględnieniem rezerw czasowych.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GanttChart
                  activities={cpmResult.activities}
                  projectDuration={cpmResult.projectDuration}
                  showCriticalPath={true}
                  showFloatBars={true}
                />
              </CardContent>
            </Card>

          </div>
        )}

        {!hasComputed && !hasErrors && (
          <div
            className="rounded-lg border-2 border-dashed py-16 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <GitBranch
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "var(--muted-foreground)" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Wprowadź dane i kliknij „Oblicz CPM&quot;
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              Możesz użyć przycisku „Wczytaj przykład&quot; w tabeli, aby szybko
              przetestować aplikację.
            </p>
          </div>
        )}
      </main>

      <footer
        className="border-t mt-12 py-4 text-center text-xs"
        style={{
          borderColor: "var(--border)",
          color: "var(--muted-foreground)",
        }}
      >
        CPM Kalkulator - Metoda ścieżki krytycznej
      </footer>

      <ActivityDialog
        activity={selectedActivity}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}