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
import { Badge } from "@/components/ui/badge";

// --- Types ---

interface CombinationSumStep {
  id: number;
  type: "start" | "choose" | "backtrack" | "found" | "prune";
  path: number[];
  sum: number;
  target: number;
  description: string;
  activeNodeId: string;
  result: number[][];
}

interface TreeNodeData {
  value: number | null; // The number added at this step
  path: number[]; // The full path at this node
  sum: number;
  target: number;
  status: "default" | "active" | "visited" | "found" | "pruned";
  isLeaf: boolean;
}

// --- Constants ---

const NODE_WIDTH = 60;
const NODE_HEIGHT = 60;
const ANIMATION_SPEED = 800;
const MAX_NODES = 60; // Safety limit

// --- Custom Node Component ---

const SumNode = ({ data }: NodeProps<TreeNodeData>) => {
  const { value, path, sum, target, status } = data;

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
    bgColor = "bg-destructive/20";
    borderColor = "border-destructive/50";
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
          w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center 
          transition-all duration-300 z-10 relative
          ${bgColor} ${borderColor} ${textColor} ${shadow}
        `}
      >
        <span className="text-lg font-bold">
          {value === null ? "0" : value}
        </span>
        {path.length > 0 && (
          <span className="text-[10px] opacity-80 font-mono leading-none absolute -bottom-5 text-foreground font-bold whitespace-nowrap">
            Σ={sum}
          </span>
        )}
      </motion.div>

      {status === "found" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 shadow-sm z-20"
        >
          Found!
        </motion.div>
      )}
      {status === "pruned" && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 z-20 bg-background rounded-full"
        >
          <XCircle className="w-5 h-5 text-destructive fill-background" />
        </motion.div>
      )}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  sumNode: SumNode,
};

// --- Main Component ---

export default function CombinationSumDemo() {
  // State
  const [candidatesStr, setCandidatesStr] = useState("2,3,6,7");
  const [targetStr, setTargetStr] = useState("7");

  const [candidates, setCandidates] = useState<number[]>([2, 3, 6, 7]);
  const [target, setTarget] = useState<number>(7);

  const [steps, setSteps] = useState<CombinationSumStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  // --- Logic: Generate Steps & Tree ---

  const generateData = (cands: number[], tgt: number) => {
    const steps: CombinationSumStep[] = [];
    const result: number[][] = [];

    const treeNodes: {
      id: string;
      value: number | null;
      path: number[];
      sum: number;
      parentId: string | null;
    }[] = [];
    const treeEdges: { id: string; source: string; target: string }[] = [];

    let nodeCounter = 0;

    // Root
    treeNodes.push({
      id: "root",
      value: null,
      path: [],
      sum: 0,
      parentId: null,
    });

    // DFS to generate steps
    const backtrack = (
      startIndex: number,
      currentPath: number[],
      currentSum: number,
      parentId: string
    ) => {
      // Safety check to prevent browser hang on large trees
      if (nodeCounter > MAX_NODES) return;

      if (currentSum === tgt) {
        result.push([...currentPath]);
        steps.push({
          id: steps.length,
          type: "found",
          path: [...currentPath],
          sum: currentSum,
          target: tgt,
          description: `找到组合: [${currentPath.join(", ")}], 和为 ${tgt}`,
          activeNodeId: parentId,
          result: [...result],
        });
        return;
      }

      if (currentSum > tgt) {
        steps.push({
          id: steps.length,
          type: "prune",
          path: [...currentPath],
          sum: currentSum,
          target: tgt,
          description: `和 ${currentSum} > ${tgt}, 剪枝`,
          activeNodeId: parentId,
          result: [...result],
        });
        return;
      }

      for (let i = startIndex; i < cands.length; i++) {
        if (nodeCounter > MAX_NODES) break;

        const val = cands[i];
        // Pruning optimization (assuming sorted)
        if (currentSum + val > tgt) {
          // Although we prune here, let's visualize the "attempt" or at least explain why we stop?
          // For visualization, maybe we don't show the node at all if we prune BEFORE visiting?
          // Or we show it as pruned. Let's show it as pruned.
          // Actually, let's just check normally.
        }

        const newPath = [...currentPath, val];
        const newSum = currentSum + val;
        const nodeId = `node-${newPath.join("-")}-${nodeCounter++}`; // Unique ID

        // Add to tree structure
        treeNodes.push({
          id: nodeId,
          value: val,
          path: newPath,
          sum: newSum,
          parentId,
        });
        treeEdges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
        });

        // Step: Choose
        steps.push({
          id: steps.length,
          type: "choose",
          path: [...newPath],
          sum: newSum,
          target: tgt,
          description: `选择 ${val}, 当前和: ${newSum}`,
          activeNodeId: nodeId,
          result: [...result],
        });

        backtrack(i, newPath, newSum, nodeId); // i stays same for repetition

        // Step: Backtrack
        steps.push({
          id: steps.length,
          type: "backtrack",
          path: [...currentPath],
          sum: currentSum,
          target: tgt,
          description: `回溯: 移除 ${val}, 返回和 ${currentSum}`,
          activeNodeId: parentId,
          result: [...result],
        });
      }
    };

    // Initial step
    steps.push({
      id: 0,
      type: "start",
      path: [],
      sum: 0,
      target: tgt,
      description: "开始搜索",
      activeNodeId: "root",
      result: [],
    });

    backtrack(0, [], 0, "root");

    return { steps, treeNodes, treeEdges };
  };

  // --- Handlers ---

  const handleStart = () => {
    const parts = candidatesStr
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedCands = parts.map(Number).sort((a, b) => a - b);
    const parsedTarget = parseInt(targetStr);

    if (parsedCands.some(isNaN) || isNaN(parsedTarget)) {
      setError("请输入有效的数字");
      return;
    }
    if (parsedCands.length === 0) {
      setError("候选数组不能为空");
      return;
    }

    // Limit complexity for visualization
    if (parsedTarget > 20) {
      setError("为了演示效果，目标值建议小于 20");
      // return; // Optional limit
    }

    setError(null);
    setCandidates(parsedCands);
    setTarget(parsedTarget);
    setIsPlaying(false);

    const {
      steps: newSteps,
      treeNodes,
      treeEdges,
    } = generateData(parsedCands, parsedTarget);
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
        type: "sumNode",
        position: {
          x: dagreNode.x - NODE_WIDTH / 2,
          y: dagreNode.y - NODE_HEIGHT / 2,
        },
        data: {
          value: node.value,
          path: node.path,
          sum: node.sum,
          target: parsedTarget,
          status: "default",
          isLeaf: false,
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

        // Check if node is part of current path (prefix)
        // For this problem, path is array of numbers.
        const isPrefix =
          nodePath.length <= stepPath.length &&
          nodePath.every((val, idx) => val === stepPath[idx]);

        if (node.id === currentStep.activeNodeId) {
          if (currentStep.type === "found") status = "found";
          else if (currentStep.type === "prune") status = "pruned";
          else status = "active";
        } else if (isPrefix) {
          status = "visited";
        }

        // Keep found nodes green if they are part of a collected result
        const isCollected = currentStep.result.some(
          (res) =>
            res.length === nodePath.length &&
            res.every((v, i) => v === nodePath[i])
        );
        if (isCollected && node.data.sum === node.data.target) {
          status = "found";
        }

        return {
          ...node,
          data: {
            ...node.data,
            status,
          },
          zIndex: status === "active" || status === "found" ? 10 : 0,
          hidden: false, // Could hide nodes not yet visited if desired
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
              设置参数
            </h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">
                  候选数组
                </label>
                <Input
                  value={candidatesStr}
                  onChange={(e) => setCandidatesStr(e.target.value)}
                  placeholder="例如: 2,3,6,7"
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  目标值 (Target)
                </label>
                <Input
                  value={targetStr}
                  onChange={(e) => setTargetStr(e.target.value)}
                  placeholder="例如: 7"
                  className="font-mono"
                />
              </div>
              <Button
                onClick={handleStart}
                disabled={isPlaying}
                className="w-full"
              >
                生成演示
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              当前操作
            </h3>
            <div className="p-3 bg-muted/30 rounded-lg min-h-[60px] text-sm flex items-center justify-center text-center">
              {currentStep ? currentStep.description : "输入参数开始演示"}
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
            <h4 className="text-sm font-bold mb-1">Target: {target}</h4>
            <div className="text-xs text-muted-foreground font-mono">
              Current Sum: {currentStep?.sum || 0}
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
          结果集 ({currentStep?.result.length || 0})
        </h3>
        <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
          {currentStep?.result.map((res, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-md font-mono text-sm flex items-center gap-2"
            >
              <span>[{res.join(", ")}]</span>
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
