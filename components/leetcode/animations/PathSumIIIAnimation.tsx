/**
 * Author: Libra
 * Date: 2025-11-26 15:37:43
 * LastEditTime: 2025-11-26 16:01:54
 * LastEditors: Libra
 * Description:
 */
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
type NodeStatus = "current" | "visited" | "path-match" | "default";

interface TreeNodeFlowData {
  value: number;
  status: NodeStatus;
  prefixSum?: number;
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
  currentSum: number;
  prefixSumMap: Record<number, number>; // sum -> count
  highlightedPathNodes: string[]; // IDs of nodes to highlight as part of a found path
  totalPaths: number;
  action: "visit" | "check" | "found" | "add" | "backtrack" | "complete";
  checkExpression?: {
    current: number;
    target: number;
    needed: number;
    foundCount: number;
  };
}

// Constants
const NODE_SIZE = 50;
const EDGE_COLOR = "rgba(156, 163, 175, 0.5)";
const HIGHLIGHT_COLOR = "rgba(245, 158, 11, 0.8)"; // Amber
const SUCCESS_COLOR = "rgba(16, 185, 129, 0.8)"; // Emerald

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-blue-500 text-white border-blue-600 shadow-lg scale-110 z-20",
  visited: "bg-blue-50 border-blue-200 text-blue-700",
  "path-match":
    "bg-emerald-100 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500 shadow-md",
  default: "bg-white border-gray-200 text-gray-700",
};

// Custom Node Component
function TreeNodeNode({ data }: NodeProps<TreeNodeFlowData>) {
  const { value, status, prefixSum } = data;
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
      {prefixSum !== undefined && status === "current" && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-30 pointer-events-none">
          和: {prefixSum}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
        isConnectable={false}
      />
    </div>
  );
}

const DEFAULT_INPUT = "10,5,-3,3,2,null,11,3,-2,null,1";
const DEFAULT_TARGET = 8;

export default function PathSumIIIAnimation() {
  return (
    <ReactFlowProvider>
      <PathSumIIIContent />
    </ReactFlowProvider>
  );
}

function PathSumIIIContent() {
  const [treeInput, setTreeInput] = useState(DEFAULT_INPUT);
  const [targetSum, setTargetSum] = useState(DEFAULT_TARGET);
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [steps, setSteps] = useState<AnimationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const nodeTypes = useMemo(() => ({ treeNode: TreeNodeNode }), []);

  // Initialize
  useEffect(() => {
    handleApply();
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  const handleApply = (e?: FormEvent) => {
    e?.preventDefault();
    try {
      const parsedRoot = parseTreeInput(treeInput);
      setRoot(parsedRoot);
      const generatedSteps = generateSteps(parsedRoot, targetSum);
      setSteps(generatedSteps);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setError(null);

      // Fit view after a short delay to allow rendering
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

  // Build Flow Elements
  const { nodes, edges } = useMemo(() => {
    if (!root) return { nodes: [], edges: [] };
    return buildFlowElements(root, currentStep);
  }, [root, currentStep]);

  return (
    <div className="space-y-6 w-full">
      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">路径总和 III 动画演示</h3>
            <p className="text-sm text-muted-foreground">
              使用前缀和 + 回溯查找所有路径和等于目标值的路径。
            </p>
          </div>
        </div>

        <form
          onSubmit={handleApply}
          className="grid gap-4 md:grid-cols-[2fr_1fr_auto]"
        >
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              二叉树 (层序遍历)
            </label>
            <Input
              value={treeInput}
              onChange={(e) => setTreeInput(e.target.value)}
              placeholder="10,5,-3,3,2,null,11..."
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              目标和 (TargetSum)
            </label>
            <Input
              type="number"
              value={targetSum}
              onChange={(e) => setTargetSum(Number(e.target.value))}
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

      {/* Visualization Grid */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 h-[600px] lg:h-[500px]">
        {/* Left: Tree */}
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

          {/* Playback Controls Overlay */}
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

        {/* Right: State & Logs */}
        <div className="flex flex-col gap-4 h-full">
          {/* Status Card */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">当前状态</h4>
              <Badge
                variant={
                  currentStep?.action === "found" ? "default" : "outline"
                }
                className="animate-in fade-in"
              >
                路径总数: {currentStep?.totalPaths || 0}
              </Badge>
            </div>

            {currentStep ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">当前路径和:</span>
                    <span className="font-mono font-bold">
                      {currentStep.currentSum}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-2">
                    <span className="text-muted-foreground">目标值:</span>
                    <span className="font-mono">{targetSum}</span>
                  </div>
                </div>

                {currentStep.checkExpression && (
                  <div className="text-xs space-y-1 bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-300">
                    <div className="font-semibold">检查前缀和:</div>
                    <div className="font-mono">
                      {currentStep.checkExpression.current} -{" "}
                      {currentStep.checkExpression.target} =
                      <span className="font-bold text-amber-600 dark:text-amber-400 mx-1">
                        {currentStep.checkExpression.needed}
                      </span>
                    </div>
                    <div>
                      Map[{currentStep.checkExpression.needed}] ={" "}
                      {currentStep.checkExpression.foundCount}
                      {currentStep.checkExpression.foundCount > 0
                        ? " ✅ 找到路径!"
                        : " ❌ 未找到"}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center">
                准备开始
              </div>
            )}
          </div>

          {/* Prefix Sum Map */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1 overflow-hidden flex flex-col">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              前缀和映射表
              <span className="text-[10px] text-muted-foreground font-normal">
                (和 → 次数)
              </span>
            </h4>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {currentStep && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(currentStep.prefixSumMap).map(
                    ([sum, count]) => {
                      const isMatch =
                        currentStep.checkExpression?.needed === Number(sum) &&
                        currentStep.action === "found";
                      const isAdded =
                        currentStep.action === "add" &&
                        currentStep.currentSum === Number(sum);

                      return (
                        <motion.div
                          key={sum}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            backgroundColor: isMatch
                              ? "rgba(16, 185, 129, 0.1)"
                              : isAdded
                                ? "rgba(59, 130, 246, 0.1)"
                                : "transparent",
                            borderColor: isMatch
                              ? "rgba(16, 185, 129, 0.5)"
                              : isAdded
                                ? "rgba(59, 130, 246, 0.5)"
                                : "transparent",
                          }}
                          className={`
                                        border rounded px-3 py-2 flex justify-between items-center
                                        ${isMatch ? "border-emerald-500" : isAdded ? "border-blue-500" : "border-border"}
                                    `}
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            {sum}
                          </span>
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 min-w-[1.5rem] justify-center"
                          >
                            {count}
                          </Badge>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers & Logic ---

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

    // Left
    if (i < values.length) {
      const val = values[i++];
      if (val !== "null" && val !== "") {
        const left: TreeNode = {
          id: `${node.id}-L`,
          value: Number(val),
          left: null,
          right: null,
        };
        node.left = left;
        queue.push(left);
      }
    }

    // Right
    if (i < values.length) {
      const val = values[i++];
      if (val !== "null" && val !== "") {
        const right: TreeNode = {
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

function generateSteps(root: TreeNode | null, target: number): AnimationStep[] {
  const steps: AnimationStep[] = [];
  if (!root) return steps;

  let stepId = 0;
  const map = new Map<number, number>();
  map.set(0, 1); // Init

  // For visualization, we need to track which nodes contribute to a sum to highlight them
  // We can track the current path stack
  const pathStack: TreeNode[] = [];
  const prefixSumAtIndex: number[] = [0]; // Prefix sum at index i of pathStack (0 is virtual root)

  function dfs(node: TreeNode, currSum: number) {
    pathStack.push(node);
    currSum += node.value;
    prefixSumAtIndex.push(currSum);

    const needed = currSum - target;
    const foundCount = map.get(needed) || 0;

    // Step: Visit & Calculate
    steps.push({
      id: stepId++,
      title: `访问节点 ${node.value}`,
      description: `将节点值 ${node.value} 加入当前路径和。新路径和为 ${currSum}。`,
      currentNodeId: node.id,
      currentSum: currSum,
      prefixSumMap: Object.fromEntries(map),
      highlightedPathNodes: [],
      totalPaths: steps.length > 0 ? steps[steps.length - 1].totalPaths : 0,
      action: "visit",
    });

    // Step: Check
    let highlightIds: string[] = [];
    if (foundCount > 0) {
      // Identify which nodes form the path
      // We look for indices in prefixSumAtIndex where value === needed
      // path is from (index + 1) to current
      // Note: prefixSumAtIndex has length pathStack.length + 1 (due to initial 0)
      // index 0 corresponds to virtual root.

      for (let i = 0; i < prefixSumAtIndex.length - 1; i++) {
        if (prefixSumAtIndex[i] === needed) {
          // Path starts from pathStack[i] to current (pathStack[pathStack.length-1])
          // Wait, prefix sum P[i] includes node at pathStack[i-1].
          // So sum from pathStack[i]...current is P[current] - P[i-1+1 - 1]... confusing.
          // Let's stick to: P[j] - P[i] = target. Path is nodes (i+1)...j.
          // Here P[current_idx] - P[k] = target. Path is nodes at pathStack indices k...current_idx-1.
          // prefixSumAtIndex[k] is the prefix sum including pathStack[k-1].
          // So if prefixSumAtIndex[k] == needed, the path is pathStack[k] ... pathStack[end].

          for (let j = i; j < pathStack.length; j++) {
            highlightIds.push(pathStack[j].id);
          }
        }
      }
    }

    const currentTotal =
      steps.length > 0 ? steps[steps.length - 1].totalPaths : 0;

    steps.push({
      id: stepId++,
      title: foundCount > 0 ? "发现路径!" : "检查前缀和",
      description: `计算: 当前和 (${currSum}) - 目标值 (${target}) = ${needed}。哈希表中存在 ${foundCount} 个前缀和为 ${needed} 的记录。`,
      currentNodeId: node.id,
      currentSum: currSum,
      prefixSumMap: Object.fromEntries(map),
      highlightedPathNodes: highlightIds,
      totalPaths: currentTotal + foundCount,
      action: foundCount > 0 ? "found" : "check",
      checkExpression: {
        current: currSum,
        target: target,
        needed: needed,
        foundCount: foundCount,
      },
    });

    // Step: Add to map
    map.set(currSum, (map.get(currSum) || 0) + 1);

    steps.push({
      id: stepId++,
      title: "更新哈希表",
      description: `将前缀和 ${currSum} 记录到哈希表中，供子节点使用。`,
      currentNodeId: node.id,
      currentSum: currSum,
      prefixSumMap: Object.fromEntries(map),
      highlightedPathNodes: [],
      totalPaths: currentTotal + foundCount,
      action: "add",
    });

    if (node.left) dfs(node.left, currSum);
    if (node.right) dfs(node.right, currSum);

    // Backtrack
    map.set(currSum, (map.get(currSum) || 0) - 1);
    if (map.get(currSum) === 0) map.delete(currSum);

    steps.push({
      id: stepId++,
      title: "回溯",
      description: `返回父节点。离开当前分支，从哈希表中移除前缀和 ${currSum}。`,
      currentNodeId: node.id,
      currentSum: currSum,
      prefixSumMap: Object.fromEntries(map),
      highlightedPathNodes: [],
      totalPaths: currentTotal + foundCount,
      action: "backtrack",
    });

    pathStack.pop();
    prefixSumAtIndex.pop();
  }

  dfs(root, 0);

  steps.push({
    id: stepId++,
    title: "完成",
    description: "遍历结束。",
    currentNodeId: null,
    currentSum: 0,
    prefixSumMap: {},
    highlightedPathNodes: [],
    totalPaths: steps[steps.length - 1].totalPaths,
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

  // Traverse to build graph
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

  nodeIds.forEach((id) => {
    const pos = g.node(id);
    // Find node value
    const findNode = (n: TreeNode | null): TreeNode | null => {
      if (!n) return null;
      if (n.id === id) return n;
      return findNode(n.left) || findNode(n.right);
    };
    const node = findNode(root)!;

    let status: NodeStatus = "default";
    if (step.currentNodeId === id) status = "current";
    else if (step.highlightedPathNodes.includes(id)) status = "path-match";
    // We could track 'visited' set in step too, but for now let's keep it simple

    nodes.push({
      id,
      position: { x: pos.x - NODE_SIZE / 2, y: pos.y - NODE_SIZE / 2 },
      type: "treeNode",
      data: {
        value: node.value,
        status,
        prefixSum: step.currentNodeId === id ? step.currentSum : undefined,
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
