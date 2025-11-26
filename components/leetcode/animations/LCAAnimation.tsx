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
type NodeStatus =
  | "current"
  | "found-p"
  | "found-q"
  | "lca"
  | "visited"
  | "default";

interface TreeNodeFlowData {
  value: number;
  status: NodeStatus;
  returnValue?: string | null; // "p", "q", "LCA", "null", "p+q"
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
  leftResult: string | null;
  rightResult: string | null;
  returnVal: string | null; // What this node returns to parent
  foundP: boolean;
  foundQ: boolean;
  lcaNodeId: string | null;
  action:
    | "visit"
    | "found"
    | "search-left"
    | "search-right"
    | "process"
    | "complete";
  stack: string[]; // Visualization of recursion stack
}

const NODE_SIZE = 50;
const EDGE_COLOR = "rgba(156, 163, 175, 0.5)";

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-blue-500 text-white border-blue-600 shadow-lg scale-110 z-20",
  "found-p":
    "bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-500",
  "found-q":
    "bg-purple-100 border-purple-400 text-purple-800 ring-2 ring-purple-500",
  lca: "bg-emerald-500 text-white border-emerald-600 shadow-xl ring-4 ring-emerald-200 scale-110 z-30",
  visited: "bg-blue-50 border-blue-200 text-blue-700",
  default: "bg-white border-gray-200 text-gray-700",
};

function TreeNodeNode({ data }: NodeProps<TreeNodeFlowData>) {
  const { value, status, returnValue } = data;
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
      {returnValue && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
          返回: {returnValue}
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

const DEFAULT_INPUT = "3,5,1,6,2,0,8,null,null,7,4";
const DEFAULT_P = 5;
const DEFAULT_Q = 1;

export default function LCAAnimation() {
  return (
    <ReactFlowProvider>
      <LCAContent />
    </ReactFlowProvider>
  );
}

function LCAContent() {
  const [treeInput, setTreeInput] = useState(DEFAULT_INPUT);
  const [pValue, setPValue] = useState(DEFAULT_P);
  const [qValue, setQValue] = useState(DEFAULT_Q);
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
    }, 1500);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  const handleApply = (e?: FormEvent) => {
    e?.preventDefault();
    try {
      const parsedRoot = parseTreeInput(treeInput);
      setRoot(parsedRoot);
      if (!parsedRoot) throw new Error("树不能为空");

      // Validate P and Q existence
      const nodes: number[] = [];
      const queue = [parsedRoot];
      while (queue.length) {
        const n = queue.shift()!;
        nodes.push(n.value);
        if (n.left) queue.push(n.left);
        if (n.right) queue.push(n.right);
      }
      if (!nodes.includes(pValue))
        throw new Error(`节点 P (${pValue}) 不在树中`);
      if (!nodes.includes(qValue))
        throw new Error(`节点 Q (${qValue}) 不在树中`);

      const generatedSteps = generateSteps(parsedRoot, pValue, qValue);
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
    return buildFlowElements(root, currentStep, pValue, qValue);
  }, [root, currentStep, pValue, qValue]);

  return (
    <div className="space-y-6 w-full">
      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">二叉树的最近公共祖先动画</h3>
            <p className="text-sm text-muted-foreground">
              后序遍历自底向上查找，演示如何找到 p 和 q 的汇合点。
            </p>
          </div>
        </div>

        <form
          onSubmit={handleApply}
          className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              二叉树 (层序)
            </label>
            <Input
              value={treeInput}
              onChange={(e) => setTreeInput(e.target.value)}
              placeholder="3,5,1..."
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              节点 P
            </label>
            <Input
              type="number"
              value={pValue}
              onChange={(e) => setPValue(Number(e.target.value))}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              节点 Q
            </label>
            <Input
              type="number"
              value={qValue}
              onChange={(e) => setQValue(Number(e.target.value))}
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

          {/* Playback Controls */}
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
              <h4 className="font-semibold text-sm">当前步骤</h4>
              <Badge variant={currentStep?.lcaNodeId ? "default" : "secondary"}>
                {currentStep?.lcaNodeId ? "找到 LCA" : "搜索中"}
              </Badge>
            </div>

            {currentStep ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">左子树返回:</span>
                    <span className="font-mono font-bold text-blue-600">
                      {currentStep.leftResult || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/50 pt-2">
                    <span className="text-muted-foreground">右子树返回:</span>
                    <span className="font-mono font-bold text-blue-600">
                      {currentStep.rightResult || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/50 pt-2 bg-primary/5 -mx-3 px-3 py-1 mt-2">
                    <span className="text-muted-foreground font-medium">
                      当前节点返回:
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {currentStep.returnVal || "..."}
                    </span>
                  </div>
                </div>

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

          {/* Recursion Stack */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex-1 overflow-hidden flex flex-col">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              递归栈
              <span className="text-[10px] text-muted-foreground font-normal">
                (自底向上)
              </span>
            </h4>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col-reverse gap-2">
              {currentStep?.stack.map((nodeInfo, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border rounded px-3 py-2 text-xs font-mono bg-muted/50 flex justify-between items-center"
                >
                  <span>{nodeInfo}</span>
                  {idx === currentStep.stack.length - 1 && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </motion.div>
              ))}
              {!currentStep?.stack.length && (
                <div className="text-center text-muted-foreground text-xs py-4 opacity-50">
                  栈为空
                </div>
              )}
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

function generateSteps(root: TreeNode, p: number, q: number): AnimationStep[] {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  const stack: string[] = [];

  function lca(node: TreeNode | null): string | null {
    if (!node) return null;

    const nodeLabel = `节点 ${node.value}`;
    stack.push(nodeLabel);

    // Visit
    steps.push({
      id: stepId++,
      title: `访问 ${nodeLabel}`,
      description: "进入节点，准备递归查找左右子树。",
      currentNodeId: node.id,
      leftResult: null,
      rightResult: null,
      returnVal: null,
      foundP: false,
      foundQ: false,
      lcaNodeId: null,
      action: "visit",
      stack: [...stack],
    });

    // Check if root is p or q
    // IMPORTANT: Even if we find p or q, in the standard recursive solution we return immediately.
    // This means we don't visit children.
    if (node.value === p || node.value === q) {
      const targetName = node.value === p ? "P" : "Q";
      const ret = String(node.value);
      steps.push({
        id: stepId++,
        title: `发现目标 ${targetName}`,
        description: `当前节点值等于 ${targetName}。直接返回当前节点，不再向下递归。`,
        currentNodeId: node.id,
        leftResult: null,
        rightResult: null,
        returnVal: ret,
        foundP: node.value === p,
        foundQ: node.value === q,
        lcaNodeId: null,
        action: "found",
        stack: [...stack],
      });
      stack.pop();
      return ret;
    }

    // Recursion Left
    steps.push({
      id: stepId++,
      title: "递归左子树",
      description: `在节点 ${node.value} 的左子树中查找 p 或 q。`,
      currentNodeId: node.id,
      leftResult: null,
      rightResult: null,
      returnVal: null,
      foundP: false,
      foundQ: false,
      lcaNodeId: null,
      action: "search-left",
      stack: [...stack],
    });

    const left = lca(node.left);

    // Recursion Right
    steps.push({
      id: stepId++,
      title: "递归右子树",
      description: `在节点 ${node.value} 的右子树中查找 p 或 q。`,
      currentNodeId: node.id,
      leftResult: left ? `节点 ${left}` : "null",
      rightResult: null,
      returnVal: null,
      foundP: false,
      foundQ: false,
      lcaNodeId: null,
      action: "search-right",
      stack: [...stack],
    });

    const right = lca(node.right);

    // Process
    let result: string | null = null;
    let isLCA = false;

    if (left && right) {
      result = String(node.value); // This node is LCA
      isLCA = true;
    } else if (left) {
      result = left;
    } else if (right) {
      result = right;
    } else {
      result = null;
    }

    steps.push({
      id: stepId++,
      title: isLCA ? "找到最近公共祖先!" : "处理返回结果",
      description: isLCA
        ? `左右子树均返回了非空结果（左: ${left}, 右: ${right}），说明 p 和 q 分别在两侧。当前节点 ${node.value} 即为 LCA。`
        : `左子树返回: ${left ?? "null"}, 右子树返回: ${right ?? "null"}。${result ? `向上传递结果: ${result}` : "均为空，返回 null。"}`,
      currentNodeId: node.id,
      leftResult: left ? `节点 ${left}` : "null",
      rightResult: right ? `节点 ${right}` : "null",
      returnVal: result ? `节点 ${result}` : "null",
      foundP: false,
      foundQ: false,
      lcaNodeId: isLCA ? node.id : null,
      action: "process",
      stack: [...stack],
    });

    stack.pop();
    return result;
  }

  lca(root);

  steps.push({
    id: stepId++,
    title: "完成",
    description: "搜索结束。",
    currentNodeId: null,
    leftResult: null,
    rightResult: null,
    returnVal: null,
    foundP: false,
    foundQ: false,
    lcaNodeId: steps.some((s) => s.lcaNodeId)
      ? steps.find((s) => s.lcaNodeId)!.lcaNodeId
      : steps[steps.length - 1].returnVal === String(p) ||
          steps[steps.length - 1].returnVal === String(q)
        ? root.id
        : null,
    // If the root itself was returned (e.g. p is ancestor of q), then root is LCA effectively in the final step
    action: "complete",
    stack: [],
  });

  return steps;
}

function buildFlowElements(
  root: TreeNode,
  step: AnimationStep,
  p: number,
  q: number
) {
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

  nodeIds.forEach((id) => {
    const pos = g.node(id);
    const findNode = (n: TreeNode | null): TreeNode | null => {
      if (!n) return null;
      if (n.id === id) return n;
      return findNode(n.left) || findNode(n.right);
    };
    const node = findNode(root)!;

    let status: NodeStatus = "default";
    if (step.lcaNodeId === id) status = "lca";
    else if (step.currentNodeId === id) status = "current";
    else if (node.value === p) status = "found-p";
    else if (node.value === q) status = "found-q";

    // Determine return label to show
    let returnValue: string | undefined = undefined;
    if (step.currentNodeId === id && step.returnVal) {
      returnValue = step.returnVal.replace("节点 ", ""); // Simplify
    }

    nodes.push({
      id,
      position: { x: pos.x - NODE_SIZE / 2, y: pos.y - NODE_SIZE / 2 },
      type: "treeNode",
      data: { value: node.value, status, returnValue },
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
