"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
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
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import dagre from "dagre";
import { motion, AnimatePresence } from "framer-motion";

import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Types
type NodeStatus = "current" | "processed" | "max-path" | "default";

interface TreeNodeFlowData {
  value: number;
  status: NodeStatus;
  contribution?: number | null;
  maxPathSumHere?: number | null;
}

interface TreeNode {
  id: string;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface AnimationStep {
  id: number;
  title: string;
  description: string;
  currentNodeId: string | null;
  leftGain: number | null;
  rightGain: number | null;
  currentPathSum: number | null;
  maxSum: number;
  returnValue: number | null; // What this node returns to parent
  highlightedNodes: string[]; // Nodes involved in the current path calculation
  maxPathNodes: string[]; // Nodes forming the global max path so far
  action: "visit" | "calculate" | "update" | "return" | "complete";
}

const NODE_SIZE = 50;
const EDGE_COLOR = "rgba(156, 163, 175, 0.5)";

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-blue-500 text-white border-blue-600 shadow-lg scale-110 z-20",
  processed: "bg-blue-50 border-blue-200 text-blue-700",
  "max-path":
    "bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-500 shadow-md",
  default: "bg-white border-gray-200 text-gray-700",
};

function TreeNodeNode({ data }: NodeProps<TreeNodeFlowData>) {
  const { value, status, contribution, maxPathSumHere } = data;
  const statusClass = statusClasses[status] ?? statusClasses.default;

  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0"
        isConnectable={false}
      />
      <div
        className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-bold text-sm transition-all duration-300 ${statusClass}`}
      >
        {value}
      </div>
      {/* Tooltip-like info */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 whitespace-nowrap gap-0.5">
        {contribution !== undefined && contribution !== null && (
          <span className="bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded">
            贡献: {contribution}
          </span>
        )}
        {status === "current" &&
          maxPathSumHere !== undefined &&
          maxPathSumHere !== null && (
            <span className="bg-emerald-600/90 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-in fade-in zoom-in">
              局部: {maxPathSumHere}
            </span>
          )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
        isConnectable={false}
      />
    </div>
  );
}

const DEFAULT_INPUT = "-10,9,20,null,null,15,7";

export default function MaxPathSumAnimation() {
  return (
    <ReactFlowProvider>
      <MaxPathSumContent />
    </ReactFlowProvider>
  );
}

function MaxPathSumContent() {
  const [treeInput, setTreeInput] = useState(DEFAULT_INPUT);
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const nodeTypes = useMemo(() => ({ treeNode: TreeNodeNode }), []);

  useEffect(() => {
    handleApply();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, 2000); // Slower for complex logic
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  const handleApply = (e?: FormEvent) => {
    e?.preventDefault();
    try {
      const parsedRoot = parseTreeInput(treeInput);
      setRoot(parsedRoot);
      if (!parsedRoot) throw new Error("树不能为空");

      const generatedSteps = generateSteps(parsedRoot);
      setSteps(generatedSteps);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setError(null);

      setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.2, duration: 500 });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Invalid input");
      setRoot(null);
      setSteps([]);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const currentStep = steps[currentStepIndex];

  const { nodes, edges } = useMemo(() => {
    if (!root) return { nodes: [], edges: [] };
    return buildFlowElements(root, currentStep);
  }, [root, currentStep]);

  return (
    <div className="space-y-6 w-full">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">二叉树中的最大路径和动画</h3>
            <p className="text-sm text-muted-foreground">
              后序遍历计算每个节点的贡献值，同时更新经过该节点的最大路径和（拐点）。
            </p>
          </div>
        </div>

        <form
          onSubmit={handleApply}
          className="grid gap-4 md:grid-cols-[1fr_auto]"
        >
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              二叉树 (层序)
            </label>
            <Input
              value={treeInput}
              onChange={(e) => setTreeInput(e.target.value)}
              placeholder="-10,9,20,null,null,15,7"
              className="font-mono"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">应用</Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>
        </form>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 h-[600px] lg:h-[500px]">
        <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-sm h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesConnectable={false}
            nodesDraggable={false}
            fitView
            onInit={(instance) => (reactFlowInstance.current = instance)}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls showInteractive={false} className="bg-background/80" />
          </ReactFlow>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 p-2 rounded-lg border border-border shadow-lg backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
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
              onClick={() =>
                setCurrentStepIndex(
                  Math.min(steps.length - 1, currentStepIndex + 1)
                )
              }
              disabled={currentStepIndex >= steps.length - 1}
            >
              <StepForward className="h-4 w-4" />
            </Button>
            <div className="text-xs text-muted-foreground w-20 text-center tabular-nums">
              {currentStepIndex + 1} / {steps.length}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">当前最大路径和</h4>
              <Badge
                variant="default"
                className="font-mono text-base px-3 py-1"
              >
                {currentStep?.maxSum === -Infinity ? "-∞" : currentStep?.maxSum}
              </Badge>
            </div>

            {currentStep ? (
              <div className="space-y-3">
                {currentStep.action !== "visit" &&
                  currentStep.action !== "complete" && (
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm space-y-2 font-mono">
                      <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                        <div className="text-xs text-muted-foreground">
                          Left Gain:
                        </div>
                        <div className="text-right font-bold text-blue-600">
                          max({currentStep.leftGain}, 0) ={" "}
                          {Math.max(currentStep.leftGain || 0, 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Right Gain:
                        </div>
                        <div className="text-right font-bold text-blue-600">
                          max({currentStep.rightGain}, 0) ={" "}
                          {Math.max(currentStep.rightGain || 0, 0)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs text-muted-foreground">
                          当前拐点路径:
                        </span>
                        <span className="font-bold text-emerald-600">
                          {currentStep.currentPathSum}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-border/50 mt-1">
                        <span className="text-xs text-muted-foreground">
                          返回贡献(单边):
                        </span>
                        <span className="font-bold text-primary">
                          {currentStep.returnValue}
                        </span>
                      </div>
                    </div>
                  )}

                <div className="text-sm text-muted-foreground leading-relaxed bg-card p-2 rounded border border-border/50">
                  <span className="font-semibold text-foreground block mb-1">
                    {currentStep.title}
                  </span>
                  {currentStep.description}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center">
                准备开始
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1 overflow-hidden flex flex-col">
            <h4 className="font-semibold text-sm mb-2">图例说明</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500 border border-blue-600"></div>
                <span>当前计算节点</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-400"></div>
                <span>构成全局最大路径的节点</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200"></div>
                <span>已处理并返回贡献的节点</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---

function parseTreeInput(input: string): TreeNode | null {
  const values = input.split(/[\s,]+/).map((v) => v.trim().toLowerCase());
  if (!values.length || values[0] === "") return null;
  if (values[0] === "null") return null;

  const root: TreeNode = {
    id: "0",
    value: Number(values[0]),
    left: null,
    right: null,
  };
  const queue = [root];
  let i = 1;

  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length) {
      const val = values[i++];
      if (val !== "null" && val !== "") {
        const left = {
          id: `${node.id}-L`,
          value: Number(val),
          left: null,
          right: null,
        };
        node.left = left;
        queue.push(left);
      }
    }
    if (i < values.length) {
      const val = values[i++];
      if (val !== "null" && val !== "") {
        const right = {
          id: `${node.id}-R`,
          value: Number(val),
          left: null,
          right: null,
        };
        node.right = right;
        queue.push(right);
      }
    }
  }
  return root;
}

function generateSteps(root: TreeNode): AnimationStep[] {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let globalMax = -Infinity;
  // We need to track the best path nodes for visualization
  // Map node ID to the list of nodes in its "max gain branch"
  const maxGainPathMap = new Map<string, string[]>();
  let globalMaxPathNodes: string[] = [];

  function dfs(node: TreeNode): number {
    // Visit
    steps.push({
      id: stepId++,
      title: `访问节点 ${node.value}`,
      description: "后序遍历：先递归处理左右子树。",
      currentNodeId: node.id,
      leftGain: null,
      rightGain: null,
      currentPathSum: null,
      maxSum: globalMax,
      returnValue: null,
      highlightedNodes: [],
      maxPathNodes: [...globalMaxPathNodes],
      action: "visit",
    });

    let leftGain = 0;
    let rightGain = 0;

    // Recurse Left
    if (node.left) {
      leftGain = Math.max(dfs(node.left), 0);
    } else {
      maxGainPathMap.set("null-L", []);
    }

    // Recurse Right
    if (node.right) {
      rightGain = Math.max(dfs(node.right), 0);
    } else {
      maxGainPathMap.set("null-R", []);
    }

    // Calculate
    const leftGainClamped = Math.max(leftGain, 0);
    const rightGainClamped = Math.max(rightGain, 0);
    const currentPathSum = node.value + leftGainClamped + rightGainClamped;

    // Construct the path for visualization
    // Path is: (Left Max Branch) + Node + (Right Max Branch)
    const currentPathNodes = [node.id];
    if (leftGain > 0 && node.left) {
      currentPathNodes.push(...(maxGainPathMap.get(node.left.id) || []));
    }
    if (rightGain > 0 && node.right) {
      currentPathNodes.push(...(maxGainPathMap.get(node.right.id) || []));
    }

    // Update Global Max
    let isNewMax = false;
    if (currentPathSum > globalMax) {
      globalMax = currentPathSum;
      globalMaxPathNodes = [...currentPathNodes];
      isNewMax = true;
    }

    // Prepare return value (Single Branch)
    const ret = node.value + Math.max(leftGainClamped, rightGainClamped);

    // Store the best branch for parent
    const bestBranchNodes = [node.id];
    if (
      leftGainClamped >= rightGainClamped &&
      leftGainClamped > 0 &&
      node.left
    ) {
      bestBranchNodes.push(...(maxGainPathMap.get(node.left.id) || []));
    } else if (
      rightGainClamped > leftGainClamped &&
      rightGainClamped > 0 &&
      node.right
    ) {
      bestBranchNodes.push(...(maxGainPathMap.get(node.right.id) || []));
    }
    maxGainPathMap.set(node.id, bestBranchNodes);

    steps.push({
      id: stepId++,
      title: isNewMax ? "更新全局最大值!" : "计算当前节点",
      description: `左贡献: ${leftGainClamped}, 右贡献: ${rightGainClamped}。经过节点 ${node.value} 的最大路径和 = ${node.value} + ${leftGainClamped} + ${rightGainClamped} = ${currentPathSum}。${isNewMax ? "创下新高！" : "未超过当前最大值。"}`,
      currentNodeId: node.id,
      leftGain,
      rightGain,
      currentPathSum,
      maxSum: globalMax,
      returnValue: ret,
      highlightedNodes: currentPathNodes,
      maxPathNodes: [...globalMaxPathNodes],
      action: "update",
    });

    steps.push({
      id: stepId++,
      title: "返回贡献值",
      description: `向父节点返回单边最大贡献: ${node.value} + max(${leftGainClamped}, ${rightGainClamped}) = ${ret}。`,
      currentNodeId: node.id,
      leftGain,
      rightGain,
      currentPathSum,
      maxSum: globalMax,
      returnValue: ret,
      highlightedNodes: [],
      maxPathNodes: [...globalMaxPathNodes],
      action: "return",
    });

    return ret;
  }

  dfs(root);

  steps.push({
    id: stepId++,
    title: "完成",
    description: `遍历结束。最大路径和为 ${globalMax}。`,
    currentNodeId: null,
    leftGain: null,
    rightGain: null,
    currentPathSum: null,
    maxSum: globalMax,
    returnValue: null,
    highlightedNodes: [],
    maxPathNodes: [...globalMaxPathNodes],
    action: "complete",
  });

  return steps;
}

function buildFlowElements(root: TreeNode, step: AnimationStep) {
  const nodes: Node<TreeNodeFlowData>[] = [];
  const edges: Edge[] = [];

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  const queue = [root];
  const nodeIds = new Set<string>();

  while (queue.length) {
    const n = queue.shift()!;
    nodeIds.add(n.id);
    g.setNode(n.id, { width: NODE_SIZE, height: NODE_SIZE });
    if (n.left) {
      g.setEdge(n.id, n.left.id);
      queue.push(n.left);
    }
    if (n.right) {
      g.setEdge(n.id, n.right.id);
      queue.push(n.right);
    }
  }

  dagre.layout(g);

  // We need a way to know if a node has been processed to mark it 'processed'
  // In post-order, if a node has returned, it's processed.
  // We can use step.returnValue but that's only for current node.
  // We can't easily know 'visited' set from just step info unless we stored it.
  // A heuristic: if node ID is not current and not in max path, but we are 'past' it...
  // Let's just rely on specific statuses.

  nodeIds.forEach((id) => {
    const pos = g.node(id);
    const findNode = (n: TreeNode | null): TreeNode | null => {
      if (!n) return null;
      if (n.id === id) return n;
      return findNode(n.left) || findNode(n.right);
    };
    const node = findNode(root)!;

    let status: NodeStatus = "default";
    if (step.currentNodeId === id) status = "current";
    else if (step.maxPathNodes.includes(id)) status = "max-path";
    else if (step.action === "complete") status = "processed";
    // Ideally we'd mark visited nodes as processed but it's okay.

    let contribution: number | undefined = undefined;
    let maxPathSumHere: number | undefined = undefined;

    if (step.currentNodeId === id) {
      if (step.returnValue !== null) contribution = step.returnValue;
      if (step.currentPathSum !== null) maxPathSumHere = step.currentPathSum;
    }

    nodes.push({
      id,
      position: { x: pos.x - NODE_SIZE / 2, y: pos.y - NODE_SIZE / 2 },
      type: "treeNode",
      data: {
        value: node.value,
        status,
        contribution,
        maxPathSumHere,
      },
    });
  });

  g.edges().forEach(({ v, w }) => {
    edges.push({
      id: `${v}-${w}`,
      source: v,
      target: w,
      type: "smoothstep",
      style: { stroke: EDGE_COLOR, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
    });
  });

  return { nodes, edges };
}
