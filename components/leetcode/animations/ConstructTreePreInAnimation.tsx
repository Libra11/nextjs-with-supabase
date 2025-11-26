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
} from "reactflow";
import dagre from "dagre";
import { motion, AnimatePresence } from "framer-motion";

import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NodeStatus = "current" | "built" | "default";
type ChildSide = "root" | "left" | "right";

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
}

interface VisualTreeNode {
  id: string;
  value: number;
  parentId: string | null;
  leftChildId: string | null;
  rightChildId: string | null;
}

interface BuildTask {
  id: string;
  preStart: number;
  preEnd: number;
  inStart: number;
  inEnd: number;
  parentId: string | null;
  side: ChildSide;
}

interface BuildStep {
  id: number;
  title: string;
  description: string;
  preRange: [number, number]; // [start, end]
  inRange: [number, number]; // [start, end]
  rootVal: number | null;
  rootInIndex: number | null;
  nodeId: string | null;
  treeSnapshot: VisualTreeNode[];
  pendingTasks: BuildTask[];
}

interface FlowGraphResult {
  nodes: Node<TreeNodeFlowData>[];
  edges: Edge[];
}

interface ParseResult {
  ok: boolean;
  error?: string;
  preorder?: number[];
  inorder?: number[];
}

const DEFAULT_PREORDER = "3, 9, 20, 15, 7";
const DEFAULT_INORDER = "9, 3, 15, 20, 7";
const NODE_SIZE = 50;
const EDGE_COLOR = "rgba(59,130,246,0.75)";

const statusClasses: Record<NodeStatus, string> = {
  current:
    "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]",
  built: "bg-blue-500/10 border-blue-500/60 text-blue-700",
  default: "bg-card/90 border-border text-foreground",
};

function TreeNodeNode({ data }: NodeProps<TreeNodeFlowData>) {
  const { value, status } = data;
  const statusClass = statusClasses[status] ?? statusClasses.default;

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-bold text-sm transition-all duration-300 ${statusClass}`}
      >
        <span>{value}</span>
      </motion.div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />
    </div>
  );
}

export default function ConstructTreePreInAnimation() {
  const [preorderInput, setPreorderInput] = useState(DEFAULT_PREORDER);
  const [inorderInput, setInorderInput] = useState(DEFAULT_INORDER);
  const [preorder, setPreorder] = useState<number[]>([3, 9, 20, 15, 7]);
  const [inorder, setInorder] = useState<number[]>([9, 3, 15, 20, 7]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const buildSteps = useMemo(
    () => generateBuildSteps(preorder, inorder),
    [preorder, inorder]
  );
  const stepInfo = buildSteps[currentStep] ?? buildSteps[0] ?? null;

  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const flowGraph = useMemo(() => {
    return buildFlowElements(
      stepInfo?.treeSnapshot ?? [],
      stepInfo?.nodeId ?? null
    );
  }, [stepInfo]);

  const treeDepth = useMemo(() => {
    return stepInfo ? getTreeDepth(stepInfo.treeSnapshot) : 0;
  }, [stepInfo]);

  const canvasHeight = Math.max(360, treeDepth * 80 + 100);
  const progress =
    buildSteps.length <= 1
      ? 1
      : currentStep / Math.max(buildSteps.length - 1, 1);

  useEffect(() => {
    if (!isPlaying) return;
    if (buildSteps.length === 0) {
      setIsPlaying(false);
      return;
    }
    if (currentStep >= buildSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, buildSteps.length - 1));
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, buildSteps.length]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [preorder, inorder]);

  useEffect(() => {
    const instance = flowInstanceRef.current;
    if (!instance || flowGraph.nodes.length === 0) return;

    const timer = setTimeout(() => {
      instance.fitView({ padding: 0.2, duration: 400 });
    }, 50);
    return () => clearTimeout(timer);
  }, [flowGraph.nodes.length]);

  const handleApplyInput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseInputs(preorderInput, inorderInput);
    if (!parsed.ok) {
      setInputError(parsed.error || "Invalid input");
      return;
    }
    if (parsed.preorder && parsed.inorder) {
      setPreorder(parsed.preorder);
      setInorder(parsed.inorder);
      setInputError(null);
    }
  };

  const handleUseDefault = () => {
    setPreorderInput(DEFAULT_PREORDER);
    setInorderInput(DEFAULT_INORDER);
    setPreorder([3, 9, 20, 15, 7]);
    setInorder([9, 3, 15, 20, 7]);
    setInputError(null);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (buildSteps.length === 0) return;
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, buildSteps.length - 1));
  };

  const togglePlay = () => {
    if (buildSteps.length === 0) return;
    if (currentStep >= buildSteps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="w-full min-h-[520px] space-y-6">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              从前序与中序遍历序列构造二叉树
            </h3>
            <p className="text-sm text-muted-foreground">
              前序确定根节点，中序分割左右子树。
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseDefault}
            >
              使用示例
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              重置动画
            </Button>
          </div>
        </div>

        <form onSubmit={handleApplyInput} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Preorder (前序)
            </label>
            <Input
              value={preorderInput}
              onChange={(e) => setPreorderInput(e.target.value)}
              placeholder="3, 9, 20, 15, 7"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Inorder (中序)
            </label>
            <div className="flex gap-2">
              <Input
                value={inorderInput}
                onChange={(e) => setInorderInput(e.target.value)}
                placeholder="9, 3, 15, 20, 7"
                className="font-mono"
              />
              <Button type="submit" size="sm">
                应用
              </Button>
            </div>
          </div>
        </form>
        {inputError && <p className="text-xs text-destructive">{inputError}</p>}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {/* Arrays Visualization */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
            {/* Preorder View */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Preorder (前序)
                </span>
                {stepInfo && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Range: [{stepInfo.preRange[0]}, {stepInfo.preRange[1]}]
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {preorder.map((val, idx) => {
                  const inRange =
                    stepInfo &&
                    idx >= stepInfo.preRange[0] &&
                    idx <= stepInfo.preRange[1];
                  const isRoot =
                    stepInfo && idx === stepInfo.preRange[0] && inRange;

                  return (
                    <div
                      key={`pre-${idx}`}
                      className={`
                                    w-8 h-8 flex items-center justify-center rounded text-xs font-mono border transition-colors
                                    ${
                                      isRoot
                                        ? "bg-primary text-primary-foreground border-primary font-bold scale-110 z-10 shadow-md"
                                        : inRange
                                          ? "bg-primary/10 border-primary/30 text-primary"
                                          : "bg-muted/20 border-border text-muted-foreground opacity-60"
                                    }
                                `}
                    >
                      {val}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inorder View */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Inorder (中序)
                </span>
                {stepInfo && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Range: [{stepInfo.inRange[0]}, {stepInfo.inRange[1]}]
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {inorder.map((val, idx) => {
                  const inRange =
                    stepInfo &&
                    idx >= stepInfo.inRange[0] &&
                    idx <= stepInfo.inRange[1];
                  const isRoot = stepInfo && stepInfo.rootInIndex === idx;

                  return (
                    <div
                      key={`in-${idx}`}
                      className={`
                                    w-8 h-8 flex items-center justify-center rounded text-xs font-mono border transition-colors
                                    ${
                                      isRoot
                                        ? "bg-amber-500 text-white border-amber-600 font-bold scale-110 z-10 shadow-md"
                                        : inRange
                                          ? "bg-blue-500/10 border-blue-500/30 text-blue-700"
                                          : "bg-muted/20 border-border text-muted-foreground opacity-60"
                                    }
                                `}
                    >
                      {val}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tree View */}
          <div
            className="relative border border-border/70 rounded-xl overflow-hidden bg-card shadow-sm"
            style={{ minHeight: canvasHeight, height: canvasHeight }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 text-[10px]">
              <span
                className={`px-2 py-1 rounded-md border shadow-sm ${statusClasses.current}`}
              >
                当前处理
              </span>
              <span
                className={`px-2 py-1 rounded-md border shadow-sm ${statusClasses.built}`}
              >
                已构建
              </span>
            </div>

            <div className="relative w-full h-full">
              {flowGraph.nodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  点击播放开始构建演示
                </div>
              ) : (
                <ReactFlow
                  nodesDraggable={false}
                  nodesConnectable={false}
                  edgesUpdatable={false}
                  panOnScroll
                  zoomOnScroll
                  minZoom={0.35}
                  maxZoom={1.75}
                  nodes={flowGraph.nodes}
                  edges={flowGraph.edges}
                  nodeTypes={nodeTypesRef.current}
                  proOptions={{ hideAttribution: true }}
                  onInit={(instance) => {
                    flowInstanceRef.current = instance;
                  }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    className="text-muted-foreground/20"
                  />
                  <Controls
                    className="bg-card/90 border border-border shadow-sm"
                    showInteractive={false}
                  />
                </ReactFlow>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
            <Button variant="outline" size="icon" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleStepForward}
              disabled={currentStep >= buildSteps.length - 1}
            >
              <StepForward className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Step {currentStep + 1}</span>
                <span>Total {buildSteps.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Info Panel */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                步骤详情
              </p>
            </div>
            <h4 className="text-base font-bold">
              {stepInfo?.title ?? "Ready"}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stepInfo?.description ?? "请开始动画..."}
            </p>
          </div>

          {/* Stack Panel */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-sm font-semibold">递归调用栈</h4>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {stepInfo ? stepInfo.pendingTasks.length : 0}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {stepInfo && stepInfo.pendingTasks.length > 0 ? (
                  [...stepInfo.pendingTasks].reverse().map((task, idx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="bg-muted/30 border border-border rounded-lg p-2 text-xs"
                    >
                      <div className="flex justify-between font-mono text-[10px] text-muted-foreground mb-1">
                        <span>
                          Pre: [{task.preStart}, {task.preEnd}]
                        </span>
                        <span>
                          In: [{task.inStart}, {task.inEnd}]
                        </span>
                      </div>
                      <div className="font-semibold text-primary flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${task.side === "left" ? "bg-emerald-500" : task.side === "right" ? "bg-blue-500" : "bg-purple-500"}`}
                        />
                        {task.side === "root"
                          ? "构建根节点"
                          : task.side === "left"
                            ? "构建左子树"
                            : "构建右子树"}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs opacity-50">
                    空栈
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---

function parseInputs(preRaw: string, inRaw: string): ParseResult {
  const parseArr = (s: string) =>
    s
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map(Number);

  const preArr = parseArr(preRaw);
  const inArr = parseArr(inRaw);

  if (preArr.some(isNaN) || inArr.some(isNaN)) {
    return { ok: false, error: "输入必须是数字" };
  }
  if (preArr.length !== inArr.length) {
    return { ok: false, error: "前序和中序数组长度必须一致" };
  }
  if (preArr.length === 0) {
    return { ok: false, error: "输入不能为空" };
  }

  // Basic check if they contain same elements
  const s1 = [...preArr].sort((a, b) => a - b).join(",");
  const s2 = [...inArr].sort((a, b) => a - b).join(",");
  if (s1 !== s2) {
    return { ok: false, error: "前序和中序数组包含的元素必须相同" };
  }

  return { ok: true, preorder: preArr, inorder: inArr };
}

function generateBuildSteps(
  preorder: number[],
  inorder: number[]
): BuildStep[] {
  const steps: BuildStep[] = [];
  const nodesMap = new Map<string, VisualTreeNode>();

  const inorderMap = new Map<number, number>();
  inorder.forEach((val, idx) => inorderMap.set(val, idx));

  let stepId = 1;

  // We simulate recursion using a stack
  // But to capture the "before" and "after" states of recursion for visualization,
  // we need to be careful. A purely iterative approach with a stack is easier to snapshot.

  const stack: BuildTask[] = [
    {
      id: "root",
      preStart: 0,
      preEnd: preorder.length - 1,
      inStart: 0,
      inEnd: inorder.length - 1,
      parentId: null,
      side: "root",
    },
  ];

  // Initial state
  steps.push({
    id: stepId++,
    title: "开始构建",
    description: "准备开始递归构建二叉树。",
    preRange: [0, preorder.length - 1],
    inRange: [0, inorder.length - 1],
    rootVal: null,
    rootInIndex: null,
    nodeId: null,
    treeSnapshot: [],
    pendingTasks: [...stack],
  });

  while (stack.length > 0) {
    const task = stack.pop()!;
    const { preStart, preEnd, inStart, inEnd, parentId, side } = task;

    if (preStart > preEnd || inStart > inEnd) {
      continue;
    }

    const rootVal = preorder[preStart];
    const inRootIndex = inorderMap.get(rootVal)!;
    const leftSize = inRootIndex - inStart;

    const nodeId = `node-${rootVal}`;

    // Create node
    const node: VisualTreeNode = {
      id: nodeId,
      value: rootVal,
      parentId: parentId,
      leftChildId: null,
      rightChildId: null,
    };
    nodesMap.set(nodeId, node);

    // Link to parent
    if (parentId) {
      const parent = nodesMap.get(parentId);
      if (parent) {
        if (side === "left") parent.leftChildId = nodeId;
        else if (side === "right") parent.rightChildId = nodeId;
      }
    }

    // Snapshot current tree state
    const currentSnapshot = Array.from(nodesMap.values()).map((n) => ({
      ...n,
    }));

    // Push children to stack (Right first so Left is processed first)
    const rightTask: BuildTask = {
      id: `${nodeId}-right`,
      preStart: preStart + leftSize + 1,
      preEnd: preEnd,
      inStart: inRootIndex + 1,
      inEnd: inEnd,
      parentId: nodeId,
      side: "right",
    };

    const leftTask: BuildTask = {
      id: `${nodeId}-left`,
      preStart: preStart + 1,
      preEnd: preStart + leftSize,
      inStart: inStart,
      inEnd: inRootIndex - 1,
      parentId: nodeId,
      side: "left",
    };

    // We only push tasks if they represent valid ranges
    const nextTasks: BuildTask[] = [];
    if (rightTask.preStart <= rightTask.preEnd) nextTasks.push(rightTask);
    if (leftTask.preStart <= leftTask.preEnd) nextTasks.push(leftTask);

    // For stack processing order: push Right then Left
    if (rightTask.preStart <= rightTask.preEnd) stack.push(rightTask);
    if (leftTask.preStart <= leftTask.preEnd) stack.push(leftTask);

    steps.push({
      id: stepId++,
      title: `处理节点 ${rootVal}`,
      description: `在前序遍历中找到根节点 ${rootVal} (索引 ${preStart})。在中序遍历中定位到索引 ${inRootIndex}，左侧为左子树 (${leftSize} 个节点)，右侧为右子树。`,
      preRange: [preStart, preEnd],
      inRange: [inStart, inEnd],
      rootVal: rootVal,
      rootInIndex: inRootIndex,
      nodeId: nodeId,
      treeSnapshot: currentSnapshot,
      pendingTasks: [...stack], // This shows what's waiting
    });
  }

  steps.push({
    id: stepId++,
    title: "构建完成",
    description: "整棵树已根据前序和中序遍历序列重构完成。",
    preRange: [-1, -1],
    inRange: [-1, -1],
    rootVal: null,
    rootInIndex: null,
    nodeId: null,
    treeSnapshot: Array.from(nodesMap.values()).map((n) => ({ ...n })),
    pendingTasks: [],
  });

  return steps;
}

function buildFlowElements(
  nodesSnapshot: VisualTreeNode[],
  currentNodeId: string | null
): FlowGraphResult {
  if (nodesSnapshot.length === 0) return { nodes: [], edges: [] };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 30,
    ranksep: 50,
    marginx: 20,
    marginy: 20,
  });

  nodesSnapshot.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_SIZE, height: NODE_SIZE });
  });

  nodesSnapshot.forEach((node) => {
    if (node.leftChildId) dagreGraph.setEdge(node.id, node.leftChildId);
    if (node.rightChildId) dagreGraph.setEdge(node.id, node.rightChildId);
  });

  dagre.layout(dagreGraph);

  const nodes: Node<TreeNodeFlowData>[] = nodesSnapshot.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    return {
      id: node.id,
      type: "treeNode",
      position: {
        x: (dagreNode?.x ?? 0) - NODE_SIZE / 2,
        y: (dagreNode?.y ?? 0) - NODE_SIZE / 2,
      },
      data: {
        value: node.value,
        index: 0, // Not really used
        status: node.id === currentNodeId ? "current" : "built",
      },
    };
  });

  const edges: Edge[] = [];
  nodesSnapshot.forEach((node) => {
    if (node.leftChildId) {
      edges.push({
        id: `${node.id}-${node.leftChildId}`,
        source: node.id,
        target: node.leftChildId,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
        style: { stroke: EDGE_COLOR, strokeWidth: 2 },
      });
    }
    if (node.rightChildId) {
      edges.push({
        id: `${node.id}-${node.rightChildId}`,
        source: node.id,
        target: node.rightChildId,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
        style: { stroke: EDGE_COLOR, strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
}

function getTreeDepth(nodes: VisualTreeNode[]): number {
  if (nodes.length === 0) return 0;
  const map = new Map(nodes.map((n) => [n.id, n]));
  const root = nodes.find((n) => n.parentId === null);
  if (!root) return 0;

  const dfs = (id: string | null): number => {
    if (!id) return 0;
    const n = map.get(id);
    if (!n) return 0;
    return 1 + Math.max(dfs(n.leftChildId), dfs(n.rightChildId));
  };
  return dfs(root.id);
}
