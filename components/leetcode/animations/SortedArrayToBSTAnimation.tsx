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
  arrayIndex: number;
  parentId: string | null;
  leftChildId: string | null;
  rightChildId: string | null;
}

interface BuildTask {
  id: string;
  left: number;
  right: number;
  parentId: string | null;
  side: ChildSide;
}

interface BuildStep {
  id: number;
  title: string;
  description: string;
  highlightRange: [number, number];
  midIndex: number;
  nodeId: string;
  value: number;
  parentId: string | null;
  side: ChildSide;
  treeSnapshot: VisualTreeNode[];
  pendingTasks: BuildTask[];
}

interface FlowGraphResult {
  nodes: Node<TreeNodeFlowData>[];
  edges: Edge[];
}

interface ParseSuccess {
  ok: true;
  values: number[];
}

interface ParseFailure {
  ok: false;
  error: string;
}

type ParseResult = ParseSuccess | ParseFailure;

const DEFAULT_NUMBERS = [-10, -3, 0, 5, 9];
const DEFAULT_INPUT = DEFAULT_NUMBERS.join(", ");
const MAX_LENGTH = 15;
const NODE_SIZE = 50;
const EDGE_COLOR = "rgba(16,185,129,0.75)";

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]",
  built: "bg-emerald-500/10 border-emerald-500/60 text-emerald-700",
  default: "bg-card/90 border-border text-foreground",
};

function TreeNodeNode({ data }: NodeProps<TreeNodeFlowData>) {
  const { value, index, status } = data;
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

export default function SortedArrayToBSTAnimation() {
  const [arrayInput, setArrayInput] = useState(DEFAULT_INPUT);
  const [numbers, setNumbers] = useState<number[]>([...DEFAULT_NUMBERS]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const buildSteps = useMemo(() => generateBuildSteps(numbers), [numbers]);
  const stepInfo = buildSteps[currentStep] ?? buildSteps[0] ?? null;
  const highlightRange = stepInfo?.highlightRange ?? null;
  const midIndex = stepInfo?.midIndex ?? -1;

  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const nodeTypes = nodeTypesRef.current;
  
  const flowGraph = useMemo(() => {
    return buildFlowElements(stepInfo?.treeSnapshot ?? [], stepInfo?.nodeId ?? null);
  }, [stepInfo]);

  const treeDepth = useMemo(() => {
    return stepInfo ? getTreeDepth(stepInfo.treeSnapshot) : 0;
  }, [stepInfo]);

  const canvasHeight = Math.max(360, treeDepth * 80 + 100);
  const progress =
    buildSteps.length <= 1 ? 1 : currentStep / Math.max(buildSteps.length - 1, 1);
  const nodeCount = flowGraph.nodes.length;

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
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, buildSteps.length]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [numbers]);

  useEffect(() => {
    const instance = flowInstanceRef.current;
    if (!instance || nodeCount === 0) return;

    // Debounce fit view to avoid jitter
    const timer = setTimeout(() => {
        instance.fitView({ padding: 0.2, duration: 400 });
    }, 50);
    return () => clearTimeout(timer);
  }, [nodeCount]);

  const handleApplyInput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseSortedInput(arrayInput);
    if (!parsed.ok) {
      setInputError(parsed.error);
      return;
    }
    setNumbers(parsed.values);
    setInputError(null);
  };

  const handleUseDefault = () => {
    setArrayInput(DEFAULT_INPUT);
    setNumbers([...DEFAULT_NUMBERS]);
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

  const valueLookup = useMemo(() => {
    return new Map((stepInfo?.treeSnapshot ?? []).map((node) => [node.id, node.value]));
  }, [stepInfo]);

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background via-muted/30 to-background rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold">将有序数组转换为平衡二叉搜索树</h3>
        <p className="text-sm text-muted-foreground">
          递归选择区间中点作为根节点，确保树的高度平衡。
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <form
          onSubmit={handleApplyInput}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              有序数组输入
            </label>
            <div className="flex gap-2">
                <Input
                value={arrayInput}
                onChange={(event) => setArrayInput(event.target.value)}
                placeholder="-10, -3, 0, 5, 9"
                className="font-mono"
                />
                <Button type="submit" size="sm">应用</Button>
                <Button type="button" variant="outline" size="sm" onClick={handleUseDefault}>
                示例
                </Button>
            </div>
            {inputError ? (
              <p className="text-xs text-destructive">{inputError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                输入严格递增的整数，用逗号分隔。
              </p>
            )}
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleReset} title="重置">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              disabled={buildSteps.length === 0}
              title={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStepForward}
              disabled={buildSteps.length === 0 || currentStep >= buildSteps.length - 1}
              title="下一步"
            >
              <StepForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 min-w-[200px] max-w-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>进度</span>
              <span>
                {buildSteps.length === 0 ? 0 : currentStep + 1}/{buildSteps.length || 0}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress * 100, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {/* Array Visualization */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">数组视图</h4>
              {highlightRange && (
                <div className="flex gap-2 text-xs">
                    <span className="text-muted-foreground">左: {highlightRange[0]}</span>
                    <span className="text-primary font-bold">中: {midIndex}</span>
                    <span className="text-muted-foreground">右: {highlightRange[1]}</span>
                </div>
              )}
            </div>
            <div className="relative flex flex-wrap gap-2 justify-center py-2">
              {numbers.map((value, idx) => {
                const inRange =
                  highlightRange && idx >= highlightRange[0] && idx <= highlightRange[1];
                const isMid = idx === midIndex;
                
                return (
                  <div key={`${value}-${idx}`} className="relative group">
                    {/* Indices */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                        {idx}
                    </div>
                    
                    <motion.div
                      animate={{
                        scale: isMid ? 1.1 : 1,
                      }}
                      className={`flex items-center justify-center w-10 h-10 rounded-md border text-sm font-medium transition-colors duration-200 ${
                        isMid
                          ? "border-primary bg-primary/10 text-primary"
                          : inRange
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
                            : "border-border bg-transparent text-foreground"
                      } ${
                        !inRange && highlightRange ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      {value}
                    </motion.div>
                    
                    {/* Markers */}
                    {highlightRange && idx === highlightRange[0] && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600">L</div>
                    )}
                    {highlightRange && idx === highlightRange[1] && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600">R</div>
                    )}
                     {isMid && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary">M</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tree Visualization */}
          <div
            className="relative border border-border/70 rounded-xl overflow-hidden bg-card shadow-sm"
            style={{ minHeight: canvasHeight, height: canvasHeight }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 text-[10px]">
              {[
                { label: "当前节点", className: statusClasses.current },
                { label: "已构建", className: statusClasses.built },
              ].map(({ label, className }) => (
                <span
                  key={label}
                  className={`px-2 py-1 rounded-md border shadow-sm ${className}`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="relative w-full h-full">
              {flowGraph.nodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  暂无数据
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
                  nodeTypes={nodeTypes}
                  proOptions={{ hideAttribution: true }}
                  onInit={(instance) => {
                    flowInstanceRef.current = instance;
                  }}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="currentColor"
                    className="text-muted-foreground/20"
                  />
                  <Controls
                    className="bg-card/90 border border-border shadow-sm"
                    position="top-right"
                    showInteractive={false}
                  />
                </ReactFlow>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Current Step Info */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">当前操作</p>
            </div>
            <h4 className="text-base font-bold">{stepInfo?.title ?? "准备就绪"}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stepInfo
                ? stepInfo.description
                : "点击播放或下一步开始演示。"}
            </p>
          </div>

          {/* Recursion Stack */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm flex flex-col h-[300px]">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-sm font-semibold">递归任务栈</h4>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {stepInfo ? stepInfo.pendingTasks.length : 0}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                {stepInfo && stepInfo.pendingTasks.length > 0 ? (
                    stepInfo.pendingTasks.map((task, idx) => {
                    const parentLabel =
                        task.parentId === null
                        ? "Root"
                        : `Parent: ${valueLookup.get(task.parentId) ?? "?"}`;
                    return (
                        <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="relative bg-muted/30 border border-border rounded-lg p-3 text-xs hover:bg-muted/50 transition-colors"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50 rounded-l-lg" />
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-mono font-semibold text-primary">
                                    [{task.left}, {task.right}]
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded">
                                    {task.side === "root" ? "ROOT" : task.side.toUpperCase()}
                                </span>
                            </div>
                            <div className="text-muted-foreground flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                {parentLabel}
                            </div>
                        </motion.div>
                    );
                    })
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-4 border-2 border-dashed border-border/50 rounded-lg"
                    >
                        <p>栈为空</p>
                        <p className="opacity-50 mt-1">所有子问题已解决</p>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseSortedInput(value: string): ParseResult {
  const segments = value
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return { ok: false, error: "请至少输入一个整数。" };
  }

  if (segments.length > MAX_LENGTH) {
    return { ok: false, error: `输入长度过长，请确保不超过 ${MAX_LENGTH} 个数字。` };
  }

  const numbers = segments.map((segment) => Number(segment));
  if (numbers.some((num) => Number.isNaN(num) || !Number.isInteger(num))) {
    return { ok: false, error: "仅支持整数输入，请检查格式。" };
  }

  for (let i = 1; i < numbers.length; i += 1) {
    if (numbers[i] <= numbers[i - 1]) {
      return { ok: false, error: "数组必须严格递增，且相邻元素不能相等或递减。" };
    }
  }

  return { ok: true, values: numbers };
}

function generateBuildSteps(nums: number[]): BuildStep[] {
  if (nums.length === 0) return [];

  const steps: BuildStep[] = [];
  const nodesMap = new Map<string, VisualTreeNode>();
  const taskStack: BuildTask[] = [
    {
      id: `task-0-${nums.length - 1}`,
      left: 0,
      right: nums.length - 1,
      parentId: null,
      side: "root",
    },
  ];

  let stepId = 1;

  while (taskStack.length > 0) {
    const task = taskStack.pop()!;
    const { left, right, parentId, side } = task;

    if (left > right) continue;

    const mid = Math.floor((left + right) / 2);
    const nodeId = `node-${mid}`;

    const node: VisualTreeNode = {
      id: nodeId,
      value: nums[mid],
      arrayIndex: mid,
      parentId,
      leftChildId: null,
      rightChildId: null,
    };
    nodesMap.set(nodeId, node);

    if (parentId) {
      const parentNode = nodesMap.get(parentId);
      if (parentNode) {
        if (side === "left") {
          parentNode.leftChildId = nodeId;
        } else if (side === "right") {
          parentNode.rightChildId = nodeId;
        }
      }
    }

    // Push right then left so left is processed first
    if (mid + 1 <= right) {
      taskStack.push({
        id: `task-${mid + 1}-${right}-${stepId}-right`,
        left: mid + 1,
        right,
        parentId: nodeId,
        side: "right",
      });
    }

    if (left <= mid - 1) {
      taskStack.push({
        id: `task-${left}-${mid - 1}-${stepId}-left`,
        left,
        right: mid - 1,
        parentId: nodeId,
        side: "left",
      });
    }

    const snapshot = Array.from(nodesMap.values()).map((treeNode) => ({ ...treeNode }));
    // We want to show the stack state AFTER we popped the current task and pushed new ones
    // But for the "current step" visualization, it might be better to show what we are about to do next?
    // Actually, showing the stack as it is *now* (ready for next iteration) is correct.
    const pendingTasks = [...taskStack].reverse().map((stackTask) => ({ ...stackTask }));

    steps.push({
      id: stepId,
      title:
        parentId === null
          ? `根节点: ${nums[mid]}`
          : `${side === "left" ? "左" : "右"}子节点: ${nums[mid]}`,
      description: `区间 [${left}, ${right}] 的中点是 ${mid} (值 ${nums[mid]})。将其作为当前子树的根，并继续递归处理左右子区间。`,
      highlightRange: [left, right],
      midIndex: mid,
      nodeId,
      value: nums[mid],
      parentId,
      side,
      treeSnapshot: snapshot,
      pendingTasks,
    });

    stepId += 1;
  }

  // Add a final "Complete" step
  steps.push({
    id: stepId,
    title: "构建完成",
    description: "所有区间已处理完毕，平衡二叉搜索树构建完成。",
    highlightRange: [-1, -1], // No highlight
    midIndex: -1,
    nodeId: "complete",
    value: 0,
    parentId: null,
    side: "root",
    treeSnapshot: Array.from(nodesMap.values()),
    pendingTasks: [],
  });

  return steps;
}

function buildFlowElements(
  nodesSnapshot: VisualTreeNode[],
  currentNodeId: string | null,
): FlowGraphResult {
  if (nodesSnapshot.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 30, ranksep: 50, marginx: 100, marginy: 50 });

  nodesSnapshot.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_SIZE, height: NODE_SIZE });
  });

  nodesSnapshot.forEach((node) => {
    if (node.leftChildId) {
      dagreGraph.setEdge(node.id, node.leftChildId);
    }
    if (node.rightChildId) {
      dagreGraph.setEdge(node.id, node.rightChildId);
    }
  });

  dagre.layout(dagreGraph);

  const nodes: Node<TreeNodeFlowData>[] = nodesSnapshot.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const status: NodeStatus = node.id === currentNodeId ? "current" : "built";
    return {
      id: node.id,
      type: "treeNode",
      data: { value: node.value, index: node.arrayIndex, status },
      position: {
        x: (dagreNode?.x ?? 0) - NODE_SIZE / 2,
        y: (dagreNode?.y ?? 0) - NODE_SIZE / 2,
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
        animated: node.leftChildId === currentNodeId,
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
        animated: node.rightChildId === currentNodeId,
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
        style: { stroke: EDGE_COLOR, strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
}

function getTreeDepth(nodesSnapshot: VisualTreeNode[]): number {
  if (nodesSnapshot.length === 0) return 0;
  const map = new Map(nodesSnapshot.map((node) => [node.id, node]));
  const root = nodesSnapshot.find((node) => node.parentId === null);
  if (!root) return 0;

  const dfs = (nodeId: string | null): number => {
    if (!nodeId) return 0;
    const node = map.get(nodeId);
    if (!node) return 0;
    return 1 + Math.max(dfs(node.leftChildId), dfs(node.rightChildId));
  };

  return dfs(root.id);
}
