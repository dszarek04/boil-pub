"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionLineType,
  MarkerType,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  ReactFlowInstance,
  applyNodeChanges,
  NodeChange,
} from "reactflow";
import dagre from "@dagrejs/dagre";
import "reactflow/dist/style.css";
import { CpmActivity } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CpmNodeData {
  activity: CpmActivity;
  showCritical: boolean;
  onClick: (activity: CpmActivity) => void;
}

function CpmNode({ data }: NodeProps<CpmNodeData>) {
  const { activity, showCritical, onClick } = data;
  const highlight = activity.isCritical && showCritical;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(activity);
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "var(--border)",
          width: 8,
          height: 8,
          border: "1px solid var(--border)",
        }}
      />
      <div
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className={cn(
          "select-none rounded-lg border-2 transition-all duration-200",
          "hover:shadow-lg hover:scale-105 min-w-32.5",
          highlight
            ? "border-red-500 shadow-red-200 shadow-md"
            : "border-border shadow-sm"
        )}
        style={{
          background: highlight ? "#fff5f5" : "var(--card)",
          color: highlight ? "#7f1d1d" : "var(--card-foreground)",
          cursor: "grab",
        }}
      >
        <div
          className="rounded-t-md px-3 py-1.5 text-sm font-bold text-center border-b"
          style={{
            background: highlight ? "#ef4444" : "var(--primary)",
            color: highlight ? "#ffffff" : "var(--primary-foreground)",
            borderColor: highlight ? "#dc2626" : "var(--border)",
          }}
        >
          {activity.name}
        </div>

        <div
          className="grid grid-cols-3 divide-x text-xs"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="px-2 py-1.5 text-center">
            <div className="text-[10px] font-medium opacity-60">ES</div>
            <div className="font-bold tabular-nums">{activity.ES}</div>
          </div>
          <div
            className="px-2 py-1.5 text-center"
            style={{ background: highlight ? "#fee2e2" : "var(--muted)" }}
          >
            <div className="text-[10px] font-medium opacity-60">D</div>
            <div className="font-bold tabular-nums">{activity.duration}</div>
          </div>
          <div className="px-2 py-1.5 text-center">
            <div className="text-[10px] font-medium opacity-60">EF</div>
            <div className="font-bold tabular-nums">{activity.EF}</div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid var(--border)` }} />

        <div
          className="grid grid-cols-3 divide-x text-xs"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="px-2 py-1.5 text-center">
            <div className="text-[10px] font-medium opacity-60">LS</div>
            <div className="font-bold tabular-nums">{activity.LS}</div>
          </div>
          <div
            className="px-2 py-1.5 text-center"
            style={{ background: highlight ? "#fee2e2" : "var(--muted)" }}
          >
            <div className="text-[10px] font-medium opacity-60">R</div>
            <div
              className="font-bold tabular-nums"
              style={{ color: activity.R === 0 ? "#ef4444" : "inherit" }}
            >
              {activity.R}
            </div>
          </div>
          <div className="px-2 py-1.5 text-center">
            <div className="text-[10px] font-medium opacity-60">LF</div>
            <div className="font-bold tabular-nums">{activity.LF}</div>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "var(--border)",
          width: 8,
          height: 8,
          border: "1px solid var(--border)",
        }}
      />
    </>
  );
}

interface TerminalNodeData {
  label: string;
}

function TerminalNode({ data }: NodeProps<TerminalNodeData>) {
  const { label } = data;
  const isStart = label === "START";
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <div
        className="px-5 py-2 rounded-full font-bold text-sm border-2 select-none whitespace-nowrap"
        style={{
          background: isStart ? "var(--primary)" : "var(--muted)",
          color: isStart ? "var(--primary-foreground)" : "var(--foreground)",
          borderColor: isStart ? "var(--primary)" : "var(--border)",
        }}
      >
        {label}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
    </>
  );
}

const nodeTypes = { cpmNode: CpmNode, terminalNode: TerminalNode };

function layoutNodes(
  activities: CpmActivity[]
): Record<string, { x: number; y: number }> {
  const NODE_W = 160;
  const NODE_H = 110;
  const H_GAP = 130;
  const V_GAP = 90;

  if (activities.length === 0) return {};

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    ranker: "network-simplex",
    nodesep: V_GAP,
    ranksep: H_GAP,
    marginx: 20,
    marginy: 20,
  });

  for (const act of activities) {
    graph.setNode(act.name, { width: NODE_W, height: NODE_H });
  }

  for (const act of activities) {
    for (const pred of act.predecessors) {
      if (graph.hasNode(pred)) {
        graph.setEdge(pred, act.name);
      }
    }
  }

  dagre.layout(graph);

  const positions: Record<string, { x: number; y: number }> = {};
  for (const act of activities) {
    const node = graph.node(act.name);
    if (!node) continue;

    positions[act.name] = {
      x: node.x - NODE_W / 2,
      y: node.y - NODE_H / 2,
    };
  }

  return positions;
}

interface CpmGraphProps {
  activities: CpmActivity[];
  showCriticalPath: boolean;
  onNodeClick: (activity: CpmActivity) => void;
}

export default function CpmGraph({
  activities,
  showCriticalPath,
  onNodeClick,
}: CpmGraphProps) {
  const positions = useMemo(() => layoutNodes(activities), [activities]);

  const initialNodes = useMemo(() => {
    const NODE_W = 160;
    const H_GAP = 90;

    const result: Node[] = activities.map((act) => ({
      id: act.name,
      type: "cpmNode",
      position: positions[act.name] ?? { x: 0, y: 0 },
      data: {
        activity: act,
        showCritical: showCriticalPath,
        onClick: onNodeClick,
      },
    }));

    if (activities.length === 0) return result;

    const startActs = activities.filter((a) => a.predecessors.length === 0);
    const allPredNames = new Set(activities.flatMap((a) => a.predecessors));
    const endActs = activities.filter((a) => !allPredNames.has(a.name));

    const avgY = (acts: CpmActivity[]) =>
      acts.length > 0
        ? acts.reduce((sum, a) => sum + (positions[a.name]?.y ?? 0), 0) / acts.length
        : 0;

    const minX = Math.min(...activities.map((a) => positions[a.name]?.x ?? 0));
    const maxX = Math.max(...activities.map((a) => positions[a.name]?.x ?? 0));

    result.push({
      id: "__START__",
      type: "terminalNode",
      position: { x: minX - NODE_W - H_GAP, y: avgY(startActs) + 35 },
      data: { label: "START" },
    });
    result.push({
      id: "__END__",
      type: "terminalNode",
      position: { x: maxX + NODE_W + H_GAP, y: avgY(endActs) + 35 },
      data: { label: "KONIEC" },
    });

    return result;
  }, [activities, positions, showCriticalPath, onNodeClick]);

  const [nodes, setNodes] = useState(initialNodes);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id.startsWith("__")) return node;
        return {
          ...node,
          data: {
            ...node.data,
            showCritical: showCriticalPath,
            onClick: onNodeClick,
          },
        };
      })
    );
  }, [showCriticalPath, onNodeClick]);

  const edges: Edge[] = useMemo(() => {
    const normalEdges: Edge[] = [];
    const criticalEdges: Edge[] = [];
    const pushEdge = (edge: Edge, critical: boolean) => {
      if (critical) {
        criticalEdges.push(edge);
      } else {
        normalEdges.push(edge);
      }
    };

    const actMap = Object.fromEntries(activities.map((a) => [a.name, a]));
    for (const act of activities) {
      for (const pred of act.predecessors) {
        const criticalEdge =
          showCriticalPath &&
          actMap[pred]?.isCritical &&
          act.isCritical;

        pushEdge({
          id: `${pred}->${act.name}`,
          source: pred,
          target: act.name,
          type: "smoothstep",
          animated: false,
          style: {
            stroke: criticalEdge ? "#ef4444" : "var(--border)",
            strokeWidth: criticalEdge ? 3 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: criticalEdge ? "#ef4444" : "var(--border)",
          },
        }, criticalEdge);
      }
    }

    const startActs = activities.filter((a) => a.predecessors.length === 0);
    for (const act of startActs) {
      const criticalEdge = showCriticalPath && act.isCritical;
      pushEdge({
        id: `__START__->${act.name}`,
        source: "__START__",
        target: act.name,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: criticalEdge ? "#ef4444" : "var(--border)",
          strokeWidth: criticalEdge ? 3 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: criticalEdge ? "#ef4444" : "var(--border)",
        },
      }, criticalEdge);
    }

    const allPredNames = new Set(activities.flatMap((a) => a.predecessors));
    const endActs = activities.filter((a) => !allPredNames.has(a.name));
    for (const act of endActs) {
      const criticalEdge = showCriticalPath && act.isCritical;
      pushEdge({
        id: `${act.name}->__END__`,
        source: act.name,
        target: "__END__",
        type: "smoothstep",
        animated: false,
        style: {
          stroke: criticalEdge ? "#ef4444" : "var(--border)",
          strokeWidth: criticalEdge ? 3 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: criticalEdge ? "#ef4444" : "var(--border)",
        },
      }, criticalEdge);
    }

    return [...normalEdges, ...criticalEdges];
  }, [activities, showCriticalPath]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setTimeout(() => instance.fitView({ padding: 0.15 }), 60);
  }, []);

  return (
    <div
      className="pdf-export-graph-shell w-full h-135 rounded-lg overflow-hidden border"
      style={{ borderColor: "var(--border)" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        onInit={onInit}
        nodesConnectable={false}
        nodesDraggable={true}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
          color="var(--border)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as Partial<CpmNodeData>;
            return d.activity?.isCritical && d.showCritical
              ? "#ef4444"
              : "var(--primary)";
          }}
          maskColor="rgba(0,0,0,0.06)"
        />
      </ReactFlow>
    </div>
  );
}