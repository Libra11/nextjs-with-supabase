"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  NodeTypes,
  Position,
  ReactFlowInstance,
  useNodesState,
  useEdgesState,
} from "reactflow";
import dagre from "dagre";
import { motion } from "framer-motion";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- Types ---

interface ParenthesisStep {
  id: number;
  type: "start" | "add_left" | "add_right" | "backtrack" | "found" | "prune";
  path: string;
  left: number; // count of left parens
  right: number; // count of right parens
  n: number;
  description: string;
  activeNodeId: string;
  result: string[];
}

interface TreeNodeData {
  value: string; // The char added at this step
  path: string; // The full path at this node
  left: number;
  right: number;
  status: "default" | "active" | "visited" | "found" | "pruned";
  isLeaf: boolean;
}

// --- Constants ---

const NODE_WIDTH = 50;
const NODE_HEIGHT = 50;
const ANIMATION_SPEED = 800;
const MAX_N = 4; // Limit n to 4 to prevent browser crash (Cat(4)=14, tree size manageable)

// --- Custom Node Component ---

const ParenthesisNode = ({ data }: NodeProps<TreeNodeData>) => {
  const { value, path, status, isLeaf } = data;

  let bgColor = "bg-card";
  let borderColor = "border-border";
  let textColor = "text-foreground";
  let shadow = "";
  let scale = 1;

  if (status === "active") {
    bgColor = "bg-primary";
    borderColor = "border-primary";
    textColor = "text-primary-foreground";
    shadow = "shadow-[0_0_20px_rgba(var(--primary),0.5)]";
    scale = 1.1;
  } else if (status === "found") {
    bgColor = "bg-emerald-500";
    borderColor = "border-emerald-500";
    textColor = "text-white";
    shadow = "shadow-[0_0_15px_rgba(16,185,129,0.6)]";
  } else if (status === "visited") {
    bgColor = "bg-muted";
    borderColor = "border-primary/20";
    textColor = "text-muted-foreground";
  } else if (status === "pruned") {
    bgColor = "bg-destructive/10";
    borderColor = "border-destructive/30";
    textColor = "text-destructive";
  }

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: scale }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center 
          transition-all duration-300 z-10 relative
          ${bgColor} ${borderColor} ${textColor} ${shadow}
        `}
      >
        <span className="text-lg font-bold">{value || "S"}</span>
      </motion.div>

      {/* Tooltip style path display */}
      {path && value && (
        <div
          className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono whitespace-nowrap ${status === "active" ? "text-primary font-bold" : "text-muted-foreground"}`}
        >
          "{path}"
        </div>
      )}

      {isLeaf && status === "found" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 shadow-sm z-20"
        >
          Valid
        </motion.div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  parenNode: ParenthesisNode,
};

// --- Main Component ---

export default function GenerateParenthesisDemo() {
  // State
  const [nStr, setNStr] = useState("3");
  const [n, setN] = useState(3);

  const [steps, setSteps] = useState<ParenthesisStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // --- Logic: Generate Steps & Tree ---

  const generateData = (count: number) => {
    const steps: ParenthesisStep[] = [];
    const result: string[] = [];

    const treeNodes: {
      id: string;
      value: string;
      path: string;
      left: number;
      right: number;
      parentId: string | null;
    }[] = [];
    const treeEdges: { id: string; source: string; target: string }[] = [];

    // Root
    treeNodes.push({
      id: "root",
      value: "",
      path: "",
      left: 0,
      right: 0,
      parentId: null,
    });

    // DFS to build tree structure first (or simultaneously)
    // We'll build simultaneously with steps for easier logic

    let nodeCounter = 0;

    const backtrack = (
      path: string,
      left: number,
      right: number,
      parentId: string
    ) => {
      if (path.length === 2 * count) {
        result.push(path);
        steps.push({
          id: steps.length,
          type: "found",
          path: path,
          left,
          right,
          n: count,
          description: `找到有效组合: "${path}"`,
          activeNodeId: parentId, // It's this node
          result: [...result],
        });
        return;
      }

      // Try Add Left '('
      if (left < count) {
        const char = "(";
        const newPath = path + char;
        const nodeId = `node-${newPath}-${nodeCounter++}`;

        treeNodes.push({
          id: nodeId,
          value: char,
          path: newPath,
          left: left + 1,
          right,
          parentId,
        });
        treeEdges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
        });

        steps.push({
          id: steps.length,
          type: "add_left",
          path: newPath,
          left: left + 1,
          right,
          n: count,
          description: `添加 '(': left=${left + 1} < ${count}`,
          activeNodeId: nodeId,
          result: [...result],
        });

        backtrack(newPath, left + 1, right, nodeId);

        steps.push({
          id: steps.length,
          type: "backtrack",
          path: path,
          left,
          right,
          n: count,
          description: `回溯: 撤销 '('`,
          activeNodeId: parentId,
          result: [...result],
        });
      }

      // Try Add Right ')'
      if (right < left) {
        const char = ")";
        const newPath = path + char;
        const nodeId = `node-${newPath}-${nodeCounter++}`;

        treeNodes.push({
          id: nodeId,
          value: char,
          path: newPath,
          left,
          right: right + 1,
          parentId,
        });
        treeEdges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
        });

        steps.push({
          id: steps.length,
          type: "add_right",
          path: newPath,
          left,
          right: right + 1,
          n: count,
          description: `添加 ')': right=${right + 1} < left=${left}`,
          activeNodeId: nodeId,
          result: [...result],
        });

        backtrack(newPath, left, right + 1, nodeId);

        steps.push({
          id: steps.length,
          type: "backtrack",
          path: path,
          left,
          right,
          n: count,
          description: `回溯: 撤销 ')'`,
          activeNodeId: parentId,
          result: [...result],
        });
      }
    };

    // Initial Step
    steps.push({
      id: 0,
      type: "start",
      path: "",
      left: 0,
      right: 0,
      n: count,
      description: "开始搜索",
      activeNodeId: "root",
      result: [],
    });

    backtrack("", 0, 0, "root");

    return { steps, treeNodes, treeEdges };
  };

  // --- Handlers ---

  const handleStart = () => {
    const val = parseInt(nStr);

    if (isNaN(val) || val < 1) {
      setError("请输入有效的数字 n >= 1");
      return;
    }
    if (val > MAX_N) {
      setError(`为了演示效果，建议 n <= ${MAX_N}`);
      return;
    }

    setError(null);
    setN(val);
    setIsPlaying(false);

    const { steps: newSteps, treeNodes, treeEdges } = generateData(val);
    setSteps(newSteps);
    setCurrentStepIndex(0);

    // Layout Graph
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 20, ranksep: 50 });
    g.setDefaultEdgeLabel(() => ({}));

    treeNodes.forEach((node) => {
      g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });
    treeEdges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const flowNodes: Node<TreeNodeData>[] = treeNodes.map((node) => {
      const dagreNode = g.node(node.id);
      return {
        id: node.id,
        type: "parenNode",
        position: {
          x: dagreNode.x - NODE_WIDTH / 2,
          y: dagreNode.y - NODE_HEIGHT / 2,
        },
        data: {
          value: node.value,
          path: node.path,
          left: node.left,
          right: node.right,
          status: "default",
          isLeaf: node.path.length === 2 * val,
        },
      };
    });

    const flowEdges: Edge[] = treeEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      style: { stroke: "#94a3b8", strokeWidth: 1.5, opacity: 0.5 },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);

    setTimeout(() => {
      flowInstanceRef.current?.fitView({ duration: 500, padding: 0.1 });
      setIsPlaying(true);
    }, 100);
  };

  // --- Animation Loop ---

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, ANIMATION_SPEED);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  // --- Update Node Styles ---

  useEffect(() => {
    if (steps.length === 0) return;

    const currentStep = steps[currentStepIndex];

    setNodes((nds) =>
      nds.map((node) => {
        const nodePath = node.data.path;
        const stepPath = currentStep.path;

        let status: TreeNodeData["status"] = "default";

        // Check prefix
        const isPrefix = stepPath.startsWith(nodePath);

        if (node.id === currentStep.activeNodeId) {
          status = currentStep.type === "found" ? "found" : "active";
        } else if (isPrefix) {
          status = "visited";
        } else if (node.id === "root") {
          status = "visited";
        }

        // Keep found result nodes green
        if (currentStep.result.includes(nodePath)) {
          status = "found";
        }

        return {
          ...node,
          data: {
            ...node.data,
            status,
          },
          zIndex: status === "active" || status === "found" ? 10 : 0,
        };
      })
    );
  }, [currentStepIndex, steps, setNodes]);

  const currentStep = steps[currentStepIndex];

  return (
    <div className="w-full space-y-6">
      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 space-y-4 md:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              设置 n (括号对数)
            </h3>
            <div className="flex gap-2">
              <Input
                value={nStr}
                onChange={(e) => setNStr(e.target.value)}
                placeholder="例如: 3"
                className="font-mono"
                type="number"
                min={1}
                max={8}
              />
              <Button onClick={handleStart} disabled={isPlaying}>
                生成
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground">
              <div className="bg-muted/30 p-2 rounded border border-border/50">
                <span className="block font-bold text-foreground">Left</span>
                {currentStep?.left || 0} / {n}
              </div>
              <div className="bg-muted/30 p-2 rounded border border-border/50">
                <span className="block font-bold text-foreground">Right</span>
                {currentStep?.right || 0} / {currentStep?.left || 0}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              当前操作
            </h3>
            <div className="p-3 bg-muted/30 rounded-lg min-h-[60px] text-sm flex items-center justify-center text-center">
              {currentStep ? currentStep.description : "输入 n 开始演示"}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(0);
              }}
              title="重置"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={
                  steps.length === 0 || currentStepIndex >= steps.length - 1
                }
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) =>
                    Math.min(prev + 1, steps.length - 1)
                  );
                }}
                disabled={
                  steps.length === 0 || currentStepIndex >= steps.length - 1
                }
              >
                <StepForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Tree Visualization */}
        <div className="md:col-span-2 h-[500px] border border-border/50 rounded-xl overflow-hidden bg-background/50 relative shadow-inner flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur p-2 rounded-lg border border-border shadow-sm max-w-[250px]">
            <h4 className="text-sm font-bold mb-1">n = {n}</h4>
            <div className="text-xs text-muted-foreground font-mono">
              Path: "{currentStep?.path}"
            </div>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={(instance) => (flowInstanceRef.current = instance)}
            fitView
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls className="bg-background/90 border-border" />
          </ReactFlow>
        </div>
      </div>

      {/* Results Area */}
      <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          有效组合 ({currentStep?.result.length || 0})
        </h3>
        <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
          {currentStep?.result.map((res, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-md font-mono text-sm flex items-center gap-2"
            >
              <span>"{res}"</span>
              {idx === currentStep.result.length - 1 &&
                currentStep.type === "found" && (
                  <motion.span
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </motion.span>
                )}
            </motion.div>
          ))}
          {currentStep?.result.length === 0 && (
            <span className="text-sm text-muted-foreground italic">
              暂无结果...
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
