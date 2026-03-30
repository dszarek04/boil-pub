import {
  CpmActivity,
  CpmResult,
  PredecessorRow,
  EventSequenceRow,
} from "./types";

export function predecessorsToEventSequence(rows: PredecessorRow[]): EventSequenceRow[] {
  if (rows.length === 0) return [];

  const norm = rows.map((r) => ({
    ...r,
    name: r.name.trim().toUpperCase(),
    predecessors: Array.from(
      new Set(r.predecessors.map((p) => p.trim().toUpperCase()).filter(Boolean))
    ),
  }));

  const rowMap: Record<string, typeof norm[0]> = {};
  for (const r of norm) rowMap[r.name] = r;

  const succ: Record<string, string[]> = {};
  for (const r of norm) succ[r.name] = [];
  for (const r of norm) for (const p of r.predecessors) if (succ[p]) succ[p].push(r.name);

  const inDeg: Record<string, number> = {};
  for (const r of norm) inDeg[r.name] = r.predecessors.length;
  const q = norm.filter((r) => r.predecessors.length === 0).map((r) => r.name);
  const topo: string[] = [];
  while (q.length) {
    const n = q.shift()!;
    topo.push(n);
    for (const s of succ[n]) if (--inDeg[s] === 0) q.push(s);
  }

  let counter = 2;
  const toNodeOf: Record<string, string> = {};
  for (const name of topo) toNodeOf[name] = String(counter++);

  const mergeNode: Record<string, string> = {};
  for (const name of topo) {
    const { predecessors } = rowMap[name];
    if (predecessors.length < 2) continue;
    const key = [...predecessors].sort().join(",");
    if (!mergeNode[key]) mergeNode[key] = String(counter++);
    const mn = mergeNode[key];
    for (const pred of predecessors) toNodeOf[pred] = mn;
  }

  const fromNodeOf: Record<string, string> = {};
  for (const name of topo) {
    const { predecessors } = rowMap[name];
    if (predecessors.length === 0) {
      fromNodeOf[name] = "1";
    } else if (predecessors.length === 1) {
      fromNodeOf[name] = toNodeOf[predecessors[0]];
    } else {
      fromNodeOf[name] = mergeNode[[...predecessors].sort().join(",")];
    }
  }

  return norm.map((r) => ({
    id: r.id,
    name: r.name,
    duration: r.duration,
    fromNode: fromNodeOf[r.name],
    toNode: toNodeOf[r.name],
  }));
}

export function eventSequenceToPredecessors(
  rows: EventSequenceRow[]
): PredecessorRow[] {
  const endMap: Record<string, string[]> = {};
  for (const row of rows) {
    const toNode = row.toNode.trim();
    if (!endMap[toNode]) endMap[toNode] = [];
    endMap[toNode].push(row.name.trim().toUpperCase());
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name.trim().toUpperCase(),
    duration: row.duration,
    predecessors: endMap[row.fromNode.trim()] ?? [],
  }));
}

export function computeCpm(rows: PredecessorRow[]): CpmResult {
  const errors: string[] = [];

  if (rows.length === 0) {
    return {
      activities: [],
      projectDuration: 0,
      criticalPath: [],
      errors: ["Brak danych wejściowych."],
    };
  }

  const normalized = rows.map((r) => ({
    ...r,
    name: r.name.trim().toUpperCase(),
    predecessors: Array.from(
      new Set(r.predecessors.map((p) => p.trim().toUpperCase()).filter(Boolean))
    ),
  }));

  const names = normalized.map((r) => r.name);
  const nameSet = new Set(names);
  if (nameSet.size !== names.length) {
    errors.push("Nazwy czynności muszą być unikalne.");
  }

  for (const row of normalized) {
    for (const pred of row.predecessors) {
      if (!nameSet.has(pred)) {
        errors.push(
          `Czynność "${row.name}" odwołuje się do nieznanego poprzednika "${pred}".`
        );
      }
    }
    if (row.predecessors.includes(row.name)) {
      errors.push(`Czynność "${row.name}" nie może być swoim własnym poprzednikiem.`);
    }
    if (!Number.isFinite(row.duration) || row.duration <= 0) {
      errors.push(`Czynność "${row.name}" musi mieć czas trwania większy od 0.`);
    }
  }

  if (errors.length > 0) {
    return { activities: [], projectDuration: 0, criticalPath: [], errors };
  }

  const actMap: Record<string, CpmActivity> = {};
  for (const row of normalized) {
    actMap[row.name] = {
      name: row.name,
      duration: row.duration,
      predecessors: row.predecessors,
      ES: 0,
      EF: 0,
      LS: 0,
      LF: 0,
      R: 0,
      isCritical: false,
    };
  }

  const inDegree: Record<string, number> = {};
  const successors: Record<string, string[]> = {};
  for (const key of Object.keys(actMap)) {
    inDegree[key] = 0;
    successors[key] = [];
  }
  for (const act of Object.values(actMap)) {
    for (const pred of act.predecessors) {
      successors[pred].push(act.name);
      inDegree[act.name]++;
    }
  }

  const queue: string[] = Object.keys(actMap).filter((k) => inDegree[k] === 0);
  const topoOrder: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    topoOrder.push(node);
    for (const succ of successors[node]) {
      inDegree[succ]--;
      if (inDegree[succ] === 0) queue.push(succ);
    }
  }

  if (topoOrder.length !== Object.keys(actMap).length) {
    return {
      activities: [],
      projectDuration: 0,
      criticalPath: [],
      errors: ["Graf zawiera cykl — dane są niepoprawne."],
    };
  }

  for (const key of topoOrder) {
    const act = actMap[key];
    act.ES =
      act.predecessors.length === 0
        ? 0
        : Math.max(...act.predecessors.map((p) => actMap[p].EF));
    act.EF = act.ES + act.duration;
  }

  const projectDuration = Math.max(...Object.values(actMap).map((a) => a.EF));

  for (const key of [...topoOrder].reverse()) {
    const act = actMap[key];
    act.LF =
      successors[key].length === 0
        ? projectDuration
        : Math.min(...successors[key].map((s) => actMap[s].LS));
    act.LS = act.LF - act.duration;
    act.R = act.LS - act.ES;
    act.isCritical = act.R === 0;
  }

  const criticalPath = topoOrder.filter((k) => actMap[k].isCritical);

  return {
    activities: topoOrder.map((k) => actMap[k]),
    projectDuration,
    criticalPath,
    errors: [],
  };
}