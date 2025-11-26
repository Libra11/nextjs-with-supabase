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

type ValidationMethod = "range" | "inorder";

type StepAction = "check" | "descend" | "visit" | "violation" | "complete";

type NodeStatus = "current" | "valid" | "invalid" | "default";

interface TreeNode {
  id: string;
  value: number;
  index: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface TreeNodeFlowData {
  value: number;
  index: number;
  status: NodeStatus;
  range?: { min: number; max: number }; // For range method visualization
}

interface BuildTreeResult {
  root: TreeNode | null;
  nodes: TreeNode[];
}

interface RangeLimit {
  min: number;
  max: number;
}

interface RangeStackFrame {
  nodeIndex: number | null;
  nodeValue: number | null;
  min: number;
  max: number;
}

interface InorderStackFrame {
  nodeIndex: number | null;
  nodeValue: number | null;
}

interface ValidationStep {
  id: number;
  method: ValidationMethod;
  title: string;
  description: string;
  action: StepAction;
  status: "running" | "valid" | "invalid";
  currentNode: number | null;
  range: RangeLimit | null;
  rangeStack: RangeStackFrame[];
  inorderStack: InorderStackFrame[];
  visited: number[];
  invalidNodes: number[];
  prevValue: number | null;
  sortedValues: number[]; // For inorder method visualization
}

interface ParseSuccess {
  ok: true;
  values: (number | null)[];
}

interface ParseError {
  ok: false;
  error: string;
}

type ParseResult = ParseSuccess | ParseError;

interface FlowGraphResult {
  nodes: Node<TreeNodeFlowData>[];
  edges: Edge[];
}

const DEFAULT_INPUT = "5,1,4,null,null,3,6";
const DEFAULT_VALUES: (number | null)[] = [5, 1, 4, null, null, 3, 6];
const MAX_NODES = 31;
const NODE_SIZE = 50;
const EDGE_COLOR = "rgba(251,191,36,0.75)";

const methodDescriptions: Record<ValidationMethod, string> = {
  range: "区间限制法：自顶向下，为每个节点维护一个允许的值区间 (min, max)。左子节点必须小于父节点，右子节点必须大于父节点。",
  inorder: "中序遍历法：利用 BST 的中序遍历结果必须是严格递增序列的性质。如果发现当前节点值 <= 前一个访问的节点值，则无效。",
};

const statusClasses: Record<NodeStatus, string> = {
  current: "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]",
  valid: "bg-emerald-500/15 border-emerald-500/70 text-emerald-700",
  invalid: "bg-destructive/15 border-destructive text-destructive shadow-[0_0_15px_rgba(239,68,68,0.4)]",
  default: "bg-card/90 border-border text-foreground",
};

function TreeNodeNode({ data }: NodeProps<TreeNodeFlowData>) {
  const { value, index, status, range } = data;
  const statusClass = statusClasses[status] ?? statusClasses.default;

  return (
    <div className="relative group">
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
      
      {/* Range Tooltip for Range Method */}
      {range && status === "current" && (
        <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded border shadow-sm z-50 pointer-events-none"
        >
            ({formatBound(range.min)}, {formatBound(range.max)})
        </motion.div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 pointer-events-none"
        isConnectable={false}
      />
    </div>
  );
}

export default function ValidateBSTAnimation() {
  const [method, setMethod] = useState<ValidationMethod>("range");
  const [levelOrderInput, setLevelOrderInput] = useState(DEFAULT_INPUT);
  const [treeValues, setTreeValues] = useState<(number | null)[]>([...DEFAULT_VALUES]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const treeData = useMemo(() => buildTreeData(treeValues), [treeValues]);
  const valueLookup = useMemo(() => {
    const lookup = new Map<number, number>();
    treeData.nodes.forEach((node) => lookup.set(node.index, node.value));
    return lookup;
  }, [treeData.nodes]);

  const validationSteps = useMemo(() => {
    return method === "inorder"
      ? generateInorderSteps(treeData.root)
      : generateRangeSteps(treeData.root);
  }, [treeData.root, method]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [method, treeData.root]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= validationSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, validationSteps.length - 1));
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, validationSteps.length]);

  const stepInfo = validationSteps[currentStep] ?? validationSteps[0] ?? null;
  const nodeTypesRef = useRef<NodeTypes>({ treeNode: TreeNodeNode });
  const nodeTypes = nodeTypesRef.current;
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const flowGraph = useMemo(() => buildFlowElements(treeData.root, stepInfo), [treeData.root, stepInfo]);

  const treeDepth = useMemo(() => getTreeDepth(treeData.root), [treeData.root]);
  const canvasHeight = Math.max(360, (treeDepth + 1) * 100);
  const progress =
    validationSteps.length <= 1 ? 1 : currentStep / Math.max(validationSteps.length - 1, 1);
  const nodeCount = flowGraph.nodes.length;

  useEffect(() => {
    const instance = flowInstanceRef.current;
    if (!instance || nodeCount === 0) return;

    const timer = setTimeout(() => {
        instance.fitView({ padding: 0.2, duration: 400 });
    }, 50);
    return () => clearTimeout(timer);
  }, [nodeCount]);

  const handleApplyInput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseLevelOrderInput(levelOrderInput);
    if (!parsed.ok) {
      setInputError(parsed.error);
      return;
    }
    setTreeValues(parsed.values);
    setInputError(null);
  };

  const handleUseExample = () => {
    setLevelOrderInput(DEFAULT_INPUT);
    setTreeValues([...DEFAULT_VALUES]);
    setInputError(null);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (validationSteps.length === 0) return;
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, validationSteps.length - 1));
  };

  const togglePlay = () => {
    if (validationSteps.length === 0) return;
    if (currentStep >= validationSteps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const sortedValues = stepInfo?.sortedValues ?? [];
  const stackLabel = method === "range" ? "递归调用栈" : "遍历栈";
  const stackItems = method === "range" ? stepInfo?.rangeStack ?? [] : stepInfo?.inorderStack ?? [];

  return (
    <div className="w-full min-h-[520px] bg-gradient-to-br from-background via-muted/30 to-background rounded-lg p-6 space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold">验证二叉搜索树 (Validate BST)</h3>
        <p className="text-sm text-muted-foreground">
          {methodDescriptions[method]}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex bg-muted p-1 rounded-lg">
            {(["range", "inorder"] as ValidationMethod[]).map((m) => (
            <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                method === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
            >
                {m === "range" ? "区间限制法" : "中序遍历法"}
            </button>
            ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <form
          onSubmit={handleApplyInput}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              树结构 (层序遍历)
            </label>
            <div className="flex gap-2">
                <Input
                value={levelOrderInput}
                onChange={(event) => setLevelOrderInput(event.target.value)}
                placeholder="5,1,4,null,null,3,6"
                className="font-mono"
                />
                <Button type="submit" size="sm">应用</Button>
                <Button type="button" variant="outline" size="sm" onClick={handleUseExample}>
                示例
                </Button>
            </div>
            {inputError ? (
              <p className="text-xs text-destructive">{inputError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                输入数字和 null，例如: 5,1,4,null,null,3,6
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
              disabled={validationSteps.length === 0}
              title={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStepForward}
              disabled={validationSteps.length === 0 || currentStep >= validationSteps.length - 1}
              title="下一步"
            >
              <StepForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 min-w-[200px] max-w-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>进度</span>
              <span>
                {validationSteps.length === 0 ? 0 : currentStep + 1}/{validationSteps.length || 0}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full ${stepInfo?.status === 'invalid' ? 'bg-destructive' : 'bg-primary'}`}
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
          <div
            className="relative border border-border/70 rounded-xl overflow-hidden bg-card shadow-sm"
            style={{ minHeight: canvasHeight, height: canvasHeight }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 text-[10px]">
              {[
                { label: "当前检查", className: statusClasses.current },
                { label: "验证通过", className: statusClasses.valid },
                { label: "违规节点", className: statusClasses.invalid },
              ].map(({ label, className }) => (
                <span key={label} className={`px-2 py-1 rounded-md border shadow-sm ${className}`}>
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
                  minZoom={0.4}
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
          
          {/* Inorder Sorted List Visualization */}
          {method === "inorder" && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
                <h4 className="text-sm font-semibold">中序遍历序列 (应严格递增)</h4>
                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                    {sortedValues.length === 0 ? (
                        <span className="text-xs text-muted-foreground">尚未访问节点</span>
                    ) : (
                        sortedValues.map((val, idx) => {
                            const isLast = idx === sortedValues.length - 1;
                            const isInvalid = stepInfo?.status === "invalid" && isLast;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`px-3 py-1 rounded-md border text-sm font-mono ${
                                        isInvalid 
                                        ? "bg-destructive/20 border-destructive text-destructive font-bold" 
                                        : "bg-muted/50 border-border text-foreground"
                                    }`}
                                >
                                    {val}
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className={`bg-card border rounded-xl p-4 space-y-2 shadow-sm transition-colors ${
              stepInfo?.status === "invalid" ? "border-destructive/50 bg-destructive/5" : 
              stepInfo?.status === "valid" && stepInfo.action === "complete" ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">当前状态</p>
              {stepInfo?.status === "valid" && stepInfo.action === "complete" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 font-bold">
                  VALID
                </span>
              )}
              {stepInfo?.status === "invalid" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold">
                  INVALID
                </span>
              )}
            </div>
            <h4 className="text-base font-bold">{stepInfo?.title ?? "准备就绪"}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stepInfo
                ? stepInfo.description
                : "点击播放开始验证过程。"}
            </p>
            
            {method === "inorder" && stepInfo?.prevValue !== null && stepInfo?.prevValue !== undefined && (
                <div className="mt-2 pt-2 border-t border-border/50 text-xs">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">前一个值:</span>
                        <span className="font-mono">{stepInfo.prevValue}</span>
                    </div>
                    {stepInfo.currentNode !== null && (
                        <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">当前值:</span>
                            <span className="font-mono">{valueLookup.get(stepInfo.currentNode)}</span>
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm flex flex-col h-[300px]">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h4 className="text-sm font-semibold">{stackLabel}</h4>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {stackItems.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                {stackItems.length > 0 ? (
                    stackItems.map((item: any, idx: number) => (
                        <motion.div
                            key={`${item.nodeIndex}-${idx}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center justify-between rounded-lg bg-muted/30 border border-border px-3 py-2 text-xs"
                        >
                            <div>
                                <span className="font-semibold text-foreground mr-2">
                                    Node {item.nodeValue ?? "null"}
                                </span>
                                {method === "range" && (
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        ({formatBound(item.min)}, {formatBound(item.max)})
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs text-center opacity-50">
                        <p>栈为空</p>
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

function formatBound(value: number): string {
  if (value === Number.POSITIVE_INFINITY) return "+∞";
  if (value === Number.NEGATIVE_INFINITY) return "-∞";
  return `${value}`;
}

function parseLevelOrderInput(input: string): ParseResult {
  const segments = input
    .split(/[\s,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return { ok: false, error: "请输入至少一个节点。" };
  }

  if (segments.length > MAX_NODES) {
    return { ok: false, error: `节点数量过多，请不要超过 ${MAX_NODES} 个。` };
  }

  const values: (number | null)[] = [];

  for (const segment of segments) {
    if (/^null$/i.test(segment)) {
      values.push(null);
      continue;
    }
    const parsed = Number(segment);
    if (!Number.isFinite(parsed)) {
      return { ok: false, error: "节点值必须是整数或 null。" };
    }
    values.push(parsed);
  }

  return { ok: true, values };
}

function buildTreeData(values: (number | null)[]): BuildTreeResult {
  if (values.length === 0) {
    return { root: null, nodes: [] };
  }

  const [first] = values;
  if (first === null || first === undefined) {
    return { root: null, nodes: [] };
  }

  const createNode = (value: number, index: number): TreeNode => ({
    id: `node-${index}`,
    value,
    index,
    left: null,
    right: null,
  });

  const root = createNode(first, 0);
  const nodes: TreeNode[] = [root];
  const queue: TreeNode[] = [root];
  let pointer = 1;

  while (queue.length > 0 && pointer < values.length) {
    const node = queue.shift()!;

    if (pointer < values.length) {
      const leftValue = values[pointer];
      if (leftValue !== null && leftValue !== undefined) {
        const leftNode = createNode(leftValue, pointer);
        node.left = leftNode;
        queue.push(leftNode);
        nodes.push(leftNode);
      }
      pointer += 1;
    }

    if (pointer < values.length) {
      const rightValue = values[pointer];
      if (rightValue !== null && rightValue !== undefined) {
        const rightNode = createNode(rightValue, pointer);
        node.right = rightNode;
        queue.push(rightNode);
        nodes.push(rightNode);
      }
      pointer += 1;
    }
  }

  return { root, nodes };
}

function getTreeDepth(root: TreeNode | null): number {
  if (!root) return -1;
  return 1 + Math.max(getTreeDepth(root.left), getTreeDepth(root.right));
}

function buildFlowElements(root: TreeNode | null, step: ValidationStep | null): FlowGraphResult {
  if (!root) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 30, ranksep: 50, marginx: 100, marginy: 50 });

  const traversalQueue: TreeNode[] = [root];
  const collected: TreeNode[] = [];

  while (traversalQueue.length > 0) {
    const node = traversalQueue.shift()!;
    collected.push(node);
    if (node.left) traversalQueue.push(node.left);
    if (node.right) traversalQueue.push(node.right);
  }

  collected.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_SIZE, height: NODE_SIZE });
  });

  collected.forEach((node) => {
    if (node.left) {
      dagreGraph.setEdge(node.id, node.left.id);
    }
    if (node.right) {
      dagreGraph.setEdge(node.id, node.right.id);
    }
  });

  dagre.layout(dagreGraph);

  const visitedSet = new Set(step?.visited ?? []);
  const invalidSet = new Set(step?.invalidNodes ?? []);
  const currentIndex = step?.currentNode ?? null;

  const nodes: Node<TreeNodeFlowData>[] = collected.map((treeNode) => {
    let status: NodeStatus = "default";
    if (invalidSet.has(treeNode.index)) {
      status = "invalid";
    } else if (currentIndex === treeNode.index) {
      status = "current";
    } else if (visitedSet.has(treeNode.index)) {
      status = "valid";
    }

    const dagreNode = dagreGraph.node(treeNode.id);
    
    // Find range info for this node if available in stack or current step
    let rangeInfo: RangeLimit | undefined = undefined;
    if (step?.method === "range") {
        if (step.currentNode === treeNode.index && step.range) {
            rangeInfo = step.range;
        }
    }

    return {
      id: treeNode.id,
      type: "treeNode",
      data: { value: treeNode.value, index: treeNode.index, status, range: rangeInfo },
      position: {
        x: (dagreNode?.x ?? 0) - NODE_SIZE / 2,
        y: (dagreNode?.y ?? 0) - NODE_SIZE / 2,
      },
    };
  });

  const edges: Edge[] = [];
  collected.forEach((node) => {
    if (node.left) {
      edges.push({
        id: `${node.id}-${node.left.id}`,
        source: node.id,
        target: node.left.id,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
        style: { stroke: EDGE_COLOR, strokeWidth: 2 },
      });
    }
    if (node.right) {
      edges.push({
        id: `${node.id}-${node.right.id}`,
        source: node.id,
        target: node.right.id,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR },
        style: { stroke: EDGE_COLOR, strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
}

function generateRangeSteps(root: TreeNode | null): ValidationStep[] {
  const steps: ValidationStep[] = [];
  let stepId = 1;
  const pushStep = (step: Omit<ValidationStep, "id">) => {
    steps.push({ id: stepId++, ...step });
  };

  if (!root) {
    pushStep({
      method: "range",
      title: "空树",
      description: "空树天然满足 BST 定义。",
      action: "complete",
      status: "valid",
      currentNode: null,
      range: null,
      rangeStack: [],
      inorderStack: [],
      visited: [],
      invalidNodes: [],
      prevValue: null,
      sortedValues: [],
    });
    return steps;
  }

  const visited: number[] = [];
  const stack: Array<{ node: TreeNode; min: number; max: number }> = [
    { node: root, min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY },
  ];

  while (stack.length > 0) {
    const frame = stack.pop()!;
    const { node, min, max } = frame;
    const violation = node.value <= min || node.value >= max;

    const stackSnapshot = stack.map((item) => ({
      nodeIndex: item.node.index,
      nodeValue: item.node.value,
      min: item.min,
      max: item.max,
    }));

    pushStep({
      method: "range",
      title: violation ? `节点 ${node.value} 违规` : `检查节点 ${node.value}`,
      description: violation
        ? `节点值 ${node.value} 不在允许区间 (${formatBound(min)}, ${formatBound(max)}) 内。`
        : `节点值 ${node.value} 在允许区间 (${formatBound(min)}, ${formatBound(max)}) 内。`,
      action: violation ? "violation" : "check",
      status: violation ? "invalid" : "running",
      currentNode: node.index,
      range: { min, max },
      rangeStack: stackSnapshot,
      inorderStack: [],
      visited: [...visited],
      invalidNodes: violation ? [node.index] : [],
      prevValue: null,
      sortedValues: [],
    });

    if (violation) {
      pushStep({
        method: "range",
        title: "验证失败",
        description: `发现违规节点，该树不是有效的二叉搜索树。`,
        action: "complete",
        status: "invalid",
        currentNode: node.index,
        range: { min, max },
        rangeStack: stackSnapshot,
        inorderStack: [],
        visited: [...visited],
        invalidNodes: [node.index],
        prevValue: null,
        sortedValues: [],
      });
      return steps;
    }

    visited.push(node.index);

    if (node.right) {
      stack.push({ node: node.right, min: node.value, max });
    }
    if (node.left) {
      stack.push({ node: node.left, min, max: node.value });
    }
  }

  pushStep({
    method: "range",
    title: "验证通过",
    description: "所有节点均满足区间限制，验证成功。",
    action: "complete",
    status: "valid",
    currentNode: null,
    range: null,
    rangeStack: [],
    inorderStack: [],
    visited: [...visited],
    invalidNodes: [],
    prevValue: null,
    sortedValues: [],
  });

  return steps;
}

function generateInorderSteps(root: TreeNode | null): ValidationStep[] {
  const steps: ValidationStep[] = [];
  let stepId = 1;
  const pushStep = (step: Omit<ValidationStep, "id">) => {
    steps.push({ id: stepId++, ...step });
  };

  if (!root) {
    pushStep({
      method: "inorder",
      title: "空树",
      description: "空树天然满足 BST 定义。",
      action: "complete",
      status: "valid",
      currentNode: null,
      range: null,
      rangeStack: [],
      inorderStack: [],
      visited: [],
      invalidNodes: [],
      prevValue: null,
      sortedValues: [],
    });
    return steps;
  }

  const stack: TreeNode[] = [];
  let current: TreeNode | null = root;
  let prevValue: number | null = null;
  const visited: number[] = [];
  const sortedValues: number[] = [];

  while (current || stack.length > 0) {
    while (current) {
      stack.push(current);
      current = current.left;
    }

    current = stack.pop()!;
    
    const stackSnapshot = stack.map(n => ({ nodeIndex: n.index, nodeValue: n.value }));
    
    // Check violation
    const violation = prevValue !== null && current.value <= prevValue;

    pushStep({
      method: "inorder",
      title: `访问节点 ${current.value}`,
      description: violation
        ? `当前值 ${current.value} <= 前一个值 ${prevValue}，破坏了递增性质。`
        : prevValue === null 
            ? `这是第一个访问的节点。`
            : `当前值 ${current.value} > 前一个值 ${prevValue}，满足递增。`,
      action: violation ? "violation" : "visit",
      status: violation ? "invalid" : "running",
      currentNode: current.index,
      range: null,
      rangeStack: [],
      inorderStack: stackSnapshot,
      visited: [...visited],
      invalidNodes: violation ? [current.index] : [],
      prevValue,
      sortedValues: [...sortedValues],
    });

    if (violation) {
        pushStep({
            method: "inorder",
            title: "验证失败",
            description: `中序遍历序列非严格递增，验证失败。`,
            action: "complete",
            status: "invalid",
            currentNode: current.index,
            range: null,
            rangeStack: [],
            inorderStack: stackSnapshot,
            visited: [...visited],
            invalidNodes: [current.index],
            prevValue,
            sortedValues: [...sortedValues, current.value],
        });
        return steps;
    }

    prevValue = current.value;
    visited.push(current.index);
    sortedValues.push(current.value);

    current = current.right;
  }

  pushStep({
    method: "inorder",
    title: "验证通过",
    description: "中序遍历序列严格递增，验证成功。",
    action: "complete",
    status: "valid",
    currentNode: null,
    range: null,
    rangeStack: [],
    inorderStack: [],
    visited: [...visited],
    invalidNodes: [],
    prevValue,
    sortedValues: [...sortedValues],
  });

  return steps;
}
